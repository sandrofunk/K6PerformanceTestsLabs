# 📈 Setup de Load Test com K6 + InfluxDB + Grafana via Docker

Este guia explica como configurar um ambiente completo de monitoramento para testes de performance usando:

* **K6** → geração de carga
* **InfluxDB** → armazenamento de métricas
* **Grafana** → dashboards e gráficos

Ideal para rodar testes com acompanhamento visual em tempo real.

---

## ✅ Pré‑requisitos

* Docker instalado
* k6 instalado localmente
* Scripts `auth.js` e `loadTest.js` já criados

---

## 🚀 Passo 1 — Subir containers (Grafana + InfluxDB)

Crie um arquivo `docker-compose.yml`:

```yamlersion: '3'
services:
  influxdb:
    image: influxdb:1.8
    container_name: influxdb
    ports:
      - "8086:8086"
    environment:
      - INFLUXDB_DB=k6

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    depends_on:
      - influxdb
```

Suba os serviços:

```bash
docker-compose up -d
```

Verifique se estão rodando:

```bash
docker ps
```

---

## 🛠️ Passo 2 — Criar banco `k6` no InfluxDB

Entre no container do InfluxDB:

```bash
docker exec -it influxdb influx
```

Execute no terminal do Influx:

```sql
CREATE DATABASE k6;
SHOW DATABASES;
```

Saída esperada:

```
_internal
k6
```

Digite `exit` para sair.

---

## ▶️ Passo 3 — Rodar o teste enviando métricas ao InfluxDB

Execute seu load test:

```bash
k6 run --out influxdb=http://localhost:8086/k6 loadTest.js
```

Se futuramente rodar k6 em Docker, use:

```bash
k6 run --out influxdb=http://influxdb:8086/k6 loadTest.js
```

> Importante: dentro do Docker containers conversam pelo **nome**, não `localhost`.

---

## 📊 Passo 4 — Configurar Grafana

Acesse no navegador:

```
http://localhost:3000
```

Login padrão:

```
Usuário: admin
Senha: admin
```

### ➕ Criar Data Source

* **Add data source** → selecione **InfluxDB**
* Configure:

| Campo             | Valor                  |
| ----------------- | ---------------------- |
| URL               | `http://influxdb:8086` |
| Database          | `k6`                   |
| HTTP Method       | `GET`                  |
| InfluxDB Version  | `InfluxQL`             |
| Min time interval | `1s`                   |

Clique **Save & Test** → deve aparecer ✅ *Data source is working*

---

## 🧭 Passo 5 — Importar Dashboard Oficial do K6

No Grafana:

**Dashboards → Import**

Cole o ID:

```
2587
```

Selecione sua data source `InfluxDB-k6` → **Import** ✅

Agora você verá gráficos como:

* Requisições por segundo (RPS)
* Latência (p95, p99)
* Throughput
* Taxa de erro
* VUs ativos

---

## ✅ Teste concluído

Agora, quando rodar:

```bash
k6 run --out influxdb=http://localhost:8086/k6 loadTest.js
```

Você verá os gráficos atualizado **em tempo real** no Grafana 🎯

---

## 🧰 Comandos úteis

Parar containers:

```bash
docker-compose down
```

Ver logs do InfluxDB:

```bash
docker logs influxdb --tail 50
```

---

## 🆘 Problemas comuns

| Erro                                 | Solução                                            |
| ------------------------------------ | -------------------------------------------------- |
| `connect: connection refused`        | Banco não criado ou container não iniciou          |
| `Data source not working` no Grafana | URL deve ser `http://influxdb:8086`, não localhost |
| Dashboard vazio                      | k6 não foi executado com saída para influx         |

---

## 🙌 Pronto!

Seu ambiente completo K6 + InfluxDB + Grafana está funcional 🎉

Se quiser, posso gerar também:

✅ Scripts prontos para Smoke/Load/Stress/Spike Test
✅ Dashboard customizado para API
✅ Pipeline CI/CD com K6 + GitHub Actions

Só pedir 😉
