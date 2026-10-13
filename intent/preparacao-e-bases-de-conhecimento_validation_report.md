# Validation Report — Preparação e bases de conhecimento

## Status

**APROVADA LOCALMENTE — reintegração pendente.**

## PRD × implementação

| Item | Estado | Evidência |
| --- | --- | --- |
| RF001 | OK | `KnowledgeBaseController`/`KnowledgeBaseService` e migration V08. |
| RF002 | OK | `PreparationDialog` antecede `getUserMedia`/`getDisplayMedia`; botão “Ignorar e iniciar” preserva o caminho existente. |
| RF003 | OK | snapshot textual gravado em `call_sessions`; histórico mantém DTO anterior. |
| RF004 | OK | `CallService` recupera preparação por sessão e `OpenAiSuggestionClient` a delimita no prompt. |
| RF005 | OK | campos rotulados, limites, estados de erro e testes de fluxo. |
| RN001–RN006 | OK | limites, uma base por call, autorização e instruções do modelo implementados. |
| Segurança/multi-tenancy | OK | revisão de segurança e filtros obrigatórios por `tenant_id`. |

## Evidências executadas

* `frontend: npm test -- --run` — 17 passaram, 4 cenários legados explicitamente ignorados.
* `frontend: npm run build` — sucesso.
* `backend: JAVA_HOME=<JDK 21> ./mvnw verify -q` — sucesso; 17 testes, com Flyway V08 aplicado em PostgreSQL efêmero Testcontainers.
* `scripts/governance-audit.sh` — sucesso.
* `git diff --check` — sucesso.

## Pendência de reintegração

O worktree/branch atual já contém uma entrega anterior não concluída (`transcricao-e-sugestoes-economicas`) e mudanças compartilhadas em `CallService`, `App.tsx` e contratos de API. Para não violar a fronteira entre Intents, esta validação não registra commit, merge em `main` nem push. A reintegração deve ocorrer depois de concluir ou separar com segurança a entrega anterior; até lá, esta não é uma entrega publicada.
