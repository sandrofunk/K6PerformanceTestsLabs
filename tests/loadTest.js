// Importa os módulos principais do K6
import http from 'k6/http'; // Permite fazer requisições HTTP (GET, POST, PUT, etc.)
import { check, sleep } from 'k6'; // check = validações; sleep = pausas simulando tempo de uso real
import { Trend, Rate, Counter } from 'k6/metrics'; // Tipos de métricas personalizadas

// ======================================================================
// 🔹 CRIAÇÃO DE MÉTRICAS PERSONALIZADAS
// ======================================================================

// "Trend" registra valores numéricos e calcula estatísticas (média, mediana, percentis, etc.)
export let TempoResposta = new Trend('tempo_resposta_ms'); // Guarda o tempo total de resposta em milissegundos
export let TotalDeRequisicoesRealizadas = new Trend('total_de_requisicoes_realizadas') // Total de requisições HTTP feitas.

// "Rate" mede a taxa de sucesso (0 a 1) — útil para verificar se a maioria das requisições foram bem-sucedidas
export let TaxaSucesso = new Rate('taxa_sucesso'); // Guarda a proporção de requisições com status 200

// "Counter" apenas soma ocorrências — ideal para contar falhas, erros ou exceções
export let Falhas = new Counter('falhas_requisicoes'); // Conta quantas requisições falharam

// ======================================================================
// 🔹 CONFIGURAÇÕES GERAIS DO TESTE
// ======================================================================

export let options = {
  vus: 10,            // Quantidade de "usuários virtuais" simultâneos (10 conexões em paralelo)
  duration: '30s',    // Duração total do teste (tempo de execução = 30 segundos)

  // Thresholds = metas de desempenho (o teste "passa" ou "falha" com base nesses limites)
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições devem responder em menos de 500ms
    taxa_sucesso: ['rate>0.95'],      // Pelo menos 95% das requisições devem ser bem-sucedidas
  },
};

// ======================================================================
// 🔹 FUNÇÃO PRINCIPAL - executada por cada usuário virtual (VU)
// ======================================================================

export default function () {
  // Endpoint que será testado (API pública estável)
  const url = 'https://jsonplaceholder.typicode.com/posts';

  // Envia uma requisição GET para a API e armazena a resposta na variável "res"
  const res = http.get(url);

  // ==================================================================
  // 🔹 REGISTRO DAS MÉTRICAS PERSONALIZADAS
  // ==================================================================

  // Adiciona o tempo total da resposta à métrica de "TempoResposta"
  TempoResposta.add(res.timings.duration);

  // Adiciona o tempo total da resposta à métrica de "TotalDeRequisicoesRealizadas"
  TotalDeRequisicoesRealizadas.add(res.timings.duration);

  // Se o status for 200 (sucesso), adiciona "true" (1) à TaxaSucesso; caso contrário, "false" (0)
  TaxaSucesso.add(res.status === 200);

  // Caso o status NÃO seja 200, incrementa o contador de falhas
  if (res.status !== 200) {
    Falhas.add(1);
  }

  // ==================================================================
  // 🔹 TRATAMENTO DO CORPO DA RESPOSTA (JSON)
  // ==================================================================

  // Como a resposta é JSON, fazemos o parse para transformar em objeto JavaScript
  let data;
  try {
    data = JSON.parse(res.body); // Tenta converter o corpo da resposta
  } catch (e) {
    data = null; // Se der erro (resposta vazia ou inválida), define como null
  }

  // ==================================================================
  // 🔹 VALIDAÇÕES (CHECKS)
  // ==================================================================

  // "check" executa testes de validação sobre a resposta
  // Cada item é uma asserção (condição) que deve retornar true ou false
  check(res, {
    'status é 200': (r) => r.status === 200, // Verifica se a resposta teve status 200 (OK)
    'resposta é JSON válida': () => data !== null, // Garante que o corpo é JSON válido
    'resposta contém lista de posts': () => Array.isArray(data) && data.length > 0, // Garante que retornou uma lista com posts
  });

  // ==================================================================
  // 🔹 PAUSA ENTRE REQUISIÇÕES
  // ==================================================================

  // Faz o VU "esperar" 1 segundo antes de fazer a próxima requisição
  // Isso evita sobrecarga e simula o comportamento real de um usuário
  sleep(1);
}

// ======================================================================
// 🧠 RESUMO DO FLUXO DE EXECUÇÃO
// ======================================================================
//
// 1️⃣ - O K6 cria 10 usuários virtuais (vus: 10)
// 2️⃣ - Cada VU executa a função principal repetidamente por 30 segundos
// 3️⃣ - A cada ciclo, ele envia um GET para a API e registra tempo, sucesso e falhas
// 4️⃣ - As validações (check) verificam se a resposta está correta
// 5️⃣ - O K6 exibe no final estatísticas completas: duração média, taxa de sucesso, p95, etc.
// ======================================================================