# Test Plan — Continuidade e título das reuniões

| Requisito | Cenário feliz | Erro/alternativo | Evidência |
|---|---|---|---|
| RF001 | Pausar ambas as fontes não encerra a sessão; retomar reutiliza seu id | Encerrar call bloqueia novos segmentos | Vitest e integração |
| RF002 | Parcial é exibido e salvo uma vez ao parar fonte | Não há parcial: nenhuma escrita extra | Vitest |
| RF003 | Primeiro rótulo de aba define título | Rótulo vazio mantém fallback; segundo não sobrescreve | Vitest e integração |
| RF004 | Edição persiste título válido | Vazio/excesso e sessão de outro tenant são rejeitados | integração e E2E |

## Execuções planejadas

* `frontend/`: `npm test`, `npm run build`, `npm run test:e2e`.
* `backend/`: Java 21 e `./mvnw verify`, exclusivamente com PostgreSQL efêmero de Testcontainers.
* Regressão: microfone e aba continuam podendo operar de forma independente; segmento após encerramento segue retornando 404.
