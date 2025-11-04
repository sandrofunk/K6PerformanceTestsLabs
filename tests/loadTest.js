// Importa libs core do k6
import http from "k6/http";
import { check, sleep } from "k6";

// Função de login para obter token
import { login } from "../utils/auth.js";

// Importa métricas customizadas
import { Trend, Counter } from "k6/metrics";

// === MÉTRICAS PERSONALIZADAS ===
// Trend = guarda valores numéricos e permite percentis
const latency = new Trend("latency");  // mede latência das requisições
// Counter = soma valores (utilizamos para throughput)
const requestCount = new Counter("requests_per_second");


// === CONFIGURAÇÕES PRINCIPAIS DO TESTE ===
export const options = {
  // Quantidade de usuários virtuais
  vus: 5,

  // Tempo total de execução
  duration: "20s",

  // Regras de aprovação (SLO/SLI)
  thresholds: {
    // Latência total 95% < 800ms, 99% < 1200ms
    http_req_duration: ["p(95)<800", "p(99)<1200"],

    // TTFB (time to first byte) — quanto o servidor demorou pra começar a responder
    http_req_waiting: ["p(95)<300"],

    // Erros de request < 1%
    http_req_failed: ["rate<0.01"],

    // Checks devem passar em pelo menos 98% das execuções
    checks: ["rate>0.98"],

    // Throughput mínimo — precisa fazer mais de 100 requisições
    http_reqs: ["count>100"],

    // Thresholds específicos por endpoint (tag baseado no request)
    "http_req_duration{endpoint:products}": ["p(95)<500"],
    "http_req_duration{endpoint:carts}": ["p(95)<700"],
  },
};


// === FUNÇÃO PRINCIPAL QUE CADA VU EXECUTA ===
export default function () {

  // Login e pega token JWT
  const token = login();

  // Headers com Authorization
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };


  // ==========================================
  // ✅ GET /products — lista produtos
  // ==========================================
  const productsRes = http.get("https://fakestoreapi.com/products", {
    headers,
    tags: { endpoint: "products" },  // tag usada nos thresholds
  });

  // Adiciona métricas de performance customizadas
  latency.add(productsRes.timings.duration);
  requestCount.add(1);

  // Checks de resposta
  check(productsRes, {
    "GET /products status 200": (r) => r.status === 200,
    "GET /products é array": (r) => Array.isArray(r.json()),
    "primeiro produto tem id e title": (r) => {
      const body = r.json();
      return body.length > 0 && body[0].id && body[0].title;
    },
    "GET /products < 500ms": (r) => r.timings.duration < 500,
  });


  // ==========================================
  // ✅ POST /carts — cria carrinho
  // ==========================================
  const orderPayload = JSON.stringify({
    userId: 1,
    date: "2023-01-01",
    products: [{ productId: 1, quantity: 2 }],
  });

  const cartsRes = http.post(
    "https://fakestoreapi.com/carts",
    orderPayload,
    {
      headers,
      tags: { endpoint: "carts" }, // tag usada no threshold do endpoint
    }
  );

  // Registra métricas custom
  latency.add(cartsRes.timings.duration);
  requestCount.add(1);

  // Checks
  check(cartsRes, {
    "POST /carts status 200|201": (r) => r.status === 200 || r.status === 201,
    "POST /carts tem id": (r) => r.json("id") !== undefined,
    "POST /carts < 700ms": (r) => r.timings.duration < 700,
  });


  // Simula tempo real de usuário (1 a 4 segundos)
  sleep(Math.random() * 3 + 1);
}