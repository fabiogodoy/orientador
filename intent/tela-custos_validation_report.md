# Delivery Validation Report — Tela de Custos

## Metadados
Slug: tela-custos. Data: 2026-10-15. Responsável: Codex. Intent: tela-custos.md. PRD: tela-custos_prd.md. Status: **APROVADO**.

## Resumo e cobertura da Intent
Tela disponível pelo botão Custos no topo da call/histórico e rota /app/custos. Filtros, cartões US$/R$, séries diárias e calls recentes com escopo autorizado. Coleta prospectiva no backend e câmbio PTAX com cache. O problema de visibilidade foi resolvido dentro do escopo aprovado; valores são estimativas, sem reconstruir história ausente.

## Matriz PRD × entrega
8 RF implementados, 0 pendentes (100%).

| Requisito | Resultado e evidência |
|---|---|
| RF001 | OK — CostsButton/Dialog e CostsRoute; Playwright prova Escape/fechar, foco e captura preservada. |
| RF002 | OK — filtros Hoje/WEEK/MONTH/ALL; CostService.startDate, limites São Paulo e componente ignora retorno obsoleto. |
| RF003 | OK — cartões/duração/quantidades, BigDecimal; ProviderUsageTest e CostIntegrationTest. Valores mínimos visíveis, câmbio renderizado. |
| RF004 | OK — gráfico SVG adaptativo com legenda e tabela acessível, renderizado a 1440/390/320 px. Agregado diário igual a resumo testado. |
| RF005 | OK — calls ativas/encerradas, intervalo recortado, total parcial/indisponível, páginas de 20; testes de 21 calls e histórico. |
| RF006 | OK — UsageCostRecorder.begin antes de contato externo; metadata antes de validação de resposta; HTTP simulado de Groq/OpenAI, incompleta e vazia incluídas. |
| RF007 | OK — BCB PTAX venda, taxa/data/fonte, cache/retry/fallback e R$ indisponível testados. Consulta real pública validou schema; IA não chamada. |
| RF008 | OK — 401 não autenticado, 403 expirado, comum só próprio tenant+user, gestor tenant, admin global; FK composta rejeita evento cruzado. |

RN001 OK: tarifa/uso por operação e precisão decimal; Groq mínimo10s, input/cache/output OpenAI e contexto longo testados. RN002 OK: custo por data da tentativa, dias civis São Paulo, calls exatamente no limite não entram no dia seguinte. RN003 OK: marcador prospectivo e operações NULL distinguem histórico parcial/zero. RN004 OK: mesmo câmbio atual aplicado ao período; UI exclui análise executiva/impostos/descontos/créditos. RN005 OK: abrir/fechar não desmonta captura; atualização manual de snapshot.

RNF: autorização no servidor; queries parametrizadas, snapshot REPEATABLE_READ, paginação/índices; dados mínimos; sem SDK/dependência nova; dialog e gráfico acessíveis; logs sanitizados. Sem benchmark de alto volume. Revisões técnica, segurança e observabilidade aprovadas nos arquivos de mesmo slug.

## Builds, ambiente e testes executados
- Backend Java21: `./mvnw verify` — **38 testes, 0 falhas/erros/skips**, BUILD SUCCESS (15,928s no worktree).
- Revalidação da cópia principal com pendência preservada: **38 testes**, BUILD SUCCESS (12,368s).
- Frontend: `npm run build` — sucesso. Warning de tamanho do chunk de exportação PDF preexistente (1,83MB); não há novo warning impeditivo.
- Frontend: `npm test` — **55 passaram, 4 skips preexistentes**, 8 arquivos.
- Playwright/Chromium: **7 passaram em 15,1s**, Costs (3), meeting-toolbar (3), contextual-guidance (1), execução final com 1 worker.
- suggestion-recovery: **1 passou** na execução inicial (38,3s); preservação de contexto/erros/call longa.
- Auditoria `scripts/governance-audit.sh`: TUDO OK. `git diff --check`: sem erros.
- Ambiente local: Vite localhost:5175 e Spring Boot real em portas aleatórias nos testes. Banco exclusivamente PostgreSQL16 efêmero Testcontainers, URL validada; nenhum teste em desenv_orientador ou produção. API de custos testada por HTTP com login real; layout usa fixtures sintéticas.

## Falhas encontradas e corrigidas
Compilação inicial (assinatura de request/import), cleanup de testes de componentes, foco ao fechar dialog, dimensão de gráfico móvel e limite de meia-noite corrigidos e revalidados. O teste preexistente de tempo de captura falhou na execução com 4 workers (7.657ms contra limite7.500ms) e passou isolado na execução final; limite e lógica não foram alterados. Não é evidência de SLA de terceiros.

## Evidências
Em `.scratch/tela-custos/` da cópia principal:
- `backend-verify.log`, `backend-with-preserved-changes.log`, `frontend-build.log`, `frontend-tests.log`.
- `e2e.log` (inclui achados iniciais), `e2e-final.log` (7/7), `governance-audit.log`.
- `custos-1440.png`, `custos-390.png`, `custos-320.png` — exemplos com dados sintéticos, não gastos reais.

## Reintegração e publicação Git
Branch de origem: `codex/tela-custos`. Origin/main usada na sincronização inicial e final: `1d596bbd52261bb00655e0a38f22c2c3a85ebadf`. Branch contém essa base; `git fetch --prune origin` executado antes da integração.
Tipo: **fast-forward**. SHA final da implementação na main: `a75ddffdebe3613b570385b3d520103f68c325e1`. Branch enviada com `git push -u origin codex/tela-custos`; main enviada com `git push origin main` (1d596bb..a75ddff), sucesso. Este relatório é um complemento documental posterior, sem alteração adicional de código. A revisão Git do relatório identifica o commit documental final.

## Pendências externas preservadas
- `backend/src/main/java/br/com/connectas/orientador/call/GroqTranscriptionClient.java`: fallback local OpenAI já existente, fora de todos os commits. Preservado sem stash/remoção; adaptação local do callback mantém o formato json para OpenAI, verbose_json para Groq, construtores compatíveis. O fallback externo permanece com custo desconhecido; o caminho oficial versionado é Groq para áudio e OpenAI para sugestões. Nenhuma tarifa Groq é aplicada ao fallback OpenAI.
- `.scratch/` preexistente intacto. Snapshot da pendência original em `.scratch/tela-custos-pending-bucv621w/` (SHA256 original fc21c0d8129e81ab78455c20253ab92987d37b269988a62258da83fd55356227).
- Integração realizada no worktree isolado e índice principal sincronizado somente após aplicar a entrega e reconciliar a pendência, sem incorporá-la ao staging/commit. Sem conflito entre commits, apenas reconciliação de arquivo local.

## Limitações, manutenção e rollback
Custo estimado não é fatura; operações sem usage/retorno continuam desconhecidas. Tarifas versionadas precisam de revisão ao mudar provedor/modelo/preço. Conversão usa último fechamento publicado, sem IOF. Análise executiva excluída. Não há importação histórica. Migration V10 aditiva; rollback de aplicação preserva ledger/cache, eventual exclusão apenas em migration futura após exportação. Deploy de produção não faz parte desta solicitação.

## Parecer e checklist
Intent/PRD/RF/RN/build/testes/multi-tenancy/segurança/regressão/reviews/reintegração: OK. Sem risco impeditivo identificado. Aprovação baseada nas evidências acima, não em simulação de custos reais. Alterações externas explicitamente excluídas.

## Arquivos/classes alterados
- `CONTEXT.md`
- `backend/src/main/java/br/com/connectas/orientador/call/CallService.java`
- `backend/src/main/java/br/com/connectas/orientador/call/CallSuggestionGenerator.java`
- `backend/src/main/java/br/com/connectas/orientador/call/GroqTranscriptionClient.java`
- `backend/src/main/java/br/com/connectas/orientador/call/OpenAiSuggestionClient.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/CostController.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/CostService.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/ExchangeRateService.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/ProviderUsage.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/PtaxClient.java`
- `backend/src/main/java/br/com/connectas/orientador/cost/UsageCostRecorder.java`
- `backend/src/main/resources/db/migration/V10__usage_costs_and_exchange_rate.sql`
- `backend/src/test/java/br/com/connectas/orientador/call/CallServiceSuggestionTest.java`
- `backend/src/test/java/br/com/connectas/orientador/call/GroqTranscriptionClientTest.java`
- `backend/src/test/java/br/com/connectas/orientador/call/OpenAiSuggestionClientTest.java`
- `backend/src/test/java/br/com/connectas/orientador/cost/CostIntegrationTest.java`
- `backend/src/test/java/br/com/connectas/orientador/cost/ProviderUsageTest.java`
- `backend/src/test/java/br/com/connectas/orientador/cost/PtaxClientTest.java`
- `docs/adr/ADR-0011-custos-por-operacao-e-ptax.md`
- `docs/adr/README.md`
- `frontend/src/App.tsx`
- `frontend/src/CostsPage.test.tsx`
- `frontend/src/CostsPage.tsx`
- `frontend/src/api.ts`
- `frontend/src/costTypes.ts`
- `frontend/src/costs.css`
- `frontend/tests/costs.spec.ts`
- `frontend/tests/meeting-toolbar.spec.ts`
- `intent/tela-custos.md`
- `intent/tela-custos_architecture-review.md`
- `intent/tela-custos_business-review.md`
- `intent/tela-custos_impact.md`
- `intent/tela-custos_implementation-review.md`
- `intent/tela-custos_observability-review.md`
- `intent/tela-custos_prd.md`
- `intent/tela-custos_security-review.md`
- `intent/tela-custos_test_plan.md`
- `intent/tela-custos_validation_report.md`
