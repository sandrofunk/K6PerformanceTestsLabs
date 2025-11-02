import http from 'k6/http';
import { check, sleep } from 'k6';

// === CONFIGURAÇÕES ===
export const options = {
  vus: 50,           // 50 usuários virtuais simultâneos
  duration: '2m',    // duração total do teste: 2 minutos
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições < 500ms
    http_req_failed: ['rate<0.01'],   // menos de 1% de falhas
    checks: ['rate>0.99'],            // 99% dos checks devem passar
  },
};

// URL base - pode ser sobrescrita com: k6 run -e BASE_URL=https://minha-api.com
const BASE_URL = __ENV.BASE_URL || 'https://httpbin.org';

// === FUNÇÃO PRINCIPAL ===
export default function () {
  // 1. GET request
  const getRes = http.get(`${BASE_URL}/get`, {
    tags: { type: 'get' }
  });

  check(getRes, {
    'GET: status 200': (r) => r.status === 200,
    'GET: resposta rápida': (r) => r.timings.duration < 500,
  });

  // 2. POST request com payload
  const payload = JSON.stringify({
    name: 'Usuário k6',
    email: `user-${__VU}@test.com`
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { type: 'post' }
  };

  const postRes = http.post(`${BASE_URL}/post`, payload, params);

  check(postRes, {
    'POST: status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    'POST: corpo contém name': (r) => {
      const body = r.json();
      return body && body.json && body.json.name === 'Usuário k6';
    },
  });

  // Simula tempo de pensamento do usuário
  sleep(1);
}