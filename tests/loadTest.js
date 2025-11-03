import http from 'k6/http';
import { check, sleep } from 'k6';
import { login } from '../utils/auth.js';

export const options = {
  vus: 5,
  duration: '20s',
  thresholds: {
    // 95% das requisições devem ser < 800ms
    http_req_duration: ['p(95)<800', 'p(99)<1200'],

    // Menos de 1% de requisições falhar
    http_req_failed: ['rate<0.01'],

    // Checks devem passar > 98%
    checks: ['rate>0.98'],

    // Thresholds por endpoint
    'http_req_duration{endpoint:products}': ['p(95)<500'],
    'http_req_duration{endpoint:carts}': ['p(95)<700'],
  }
};

export default function () {
  const token = login();

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  // === GET /products ===
  const productsRes = http.get('https://fakestoreapi.com/products', { headers, tags: { endpoint: 'products' } });

  check(productsRes, {
    'GET /products status 200': (r) => r.status === 200,
    'GET /products é array': (r) => Array.isArray(r.json()),
    'primeiro produto tem id e title': (r) => {
      const body = r.json();
      return body.length > 0 && body[0].id !== undefined && body[0].title !== undefined;
    },
    'GET /products < 500ms': (r) => r.timings.duration < 500,
  });

  // === POST /carts ===
  const orderPayload = JSON.stringify({
    userId: 1,
    date: "2023-01-01",
    products: [{ productId: 1, quantity: 2 }]
  });

  const cartsRes = http.post('https://fakestoreapi.com/carts', orderPayload, { headers, tags: { endpoint: 'carts' } });

  check(cartsRes, {
    'POST /carts status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    'POST /carts body contém id': (r) => r.json('id') !== undefined,
    'POST /carts < 700ms': (r) => r.timings.duration < 700,
  });

  // Think time aleatório para simular usuário real
  sleep(Math.random() * 3 + 1);
}
