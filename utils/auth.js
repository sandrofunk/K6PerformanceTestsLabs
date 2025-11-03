import http from 'k6/http';
import { check } from 'k6';

export function login() {
  const url = 'https://fakestoreapi.com/auth/login';
  const payload = JSON.stringify({
    username: "mor_2314",
    password: "83r5^_"
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  // Aceitar 200 ou 201
  check(res, {
    'login status 200 ou 201': (r) => r.status === 200 || r.status === 201,
    'token existe': (r) => !!r.json('token'),
  });

  const token = res.json('token');
  if (!token) throw new Error('❌ Não foi possível obter token no login.');

  return token;
}