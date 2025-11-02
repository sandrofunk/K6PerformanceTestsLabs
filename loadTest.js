import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,        // 10 usuários virtuais
  duration: '30s' // por 30 segundos
};

export default function () {
  const res = http.get('https://httpbin.org/get');
  
  check(res, {
    'status é 200': (r) => r.status === 200,
    'resposta rápida': (r) => r.timings.duration < 500
  });

  sleep(1); // pausa de 1 segundo entre requisições
}