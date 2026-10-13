# Validation Report — Suporte bilíngue na call

## Metadados

* **Slug:** suporte-bilingue-call
* **Data da validação:** 2026-10-13
* **Responsável:** Agente
* **Intent:** `intent/suporte-bilingue-call.md`
* **PRD:** `intent/suporte-bilingue-call_prd.md`

## Status Geral

**APROVADO**

## Cobertura da Intent

O produto deixa de restringir a sessão a português e deixa de obrigar a sugestão a sair em português. A transcrição passa a declarar PT/EN como idiomas possíveis, e a instrução do modelo exige que todos os campos textuais acompanhem a última fala do cliente, inclusive em alternância de idioma.

## Validação do PRD

| Item | Status | Evidência |
| --- | --- | --- |
| RF001 — Transcrição PT/EN | OK | `OpenAiLanguageSupportTest.configuresRealtimeTranscriptionForPortugueseAndEnglish` valida `pt`, `en`, modelo e delay. |
| RF002 — Orientação no idioma da última fala | OK | `OpenAiLanguageSupportTest.requiresSuggestionToFollowLastClientSpeechLanguageInBilingualCalls` valida a instrução para PT, EN e alternância. |
| RF003 — Regras comerciais preservadas | OK | O mesmo teste confirma a regra contra invenção; a validação de campos/tamanho existente foi executada em `./mvnw verify`. |
| RN001–RN004 | OK | Implementação e testes acima; nenhuma regra de segurança, limite ou fonte de fatos foi removida. |
| RNF001 — Performance | OK | Não há nova chamada ou etapa no fluxo; modelo, timeout e contrato foram preservados. |
| RNF002 — Segurança / multi-tenancy | OK | Nenhuma query, endpoint, identidade, CSRF ou permissão mudou; revisão de segurança aprovada. |
| RNF003 — Observabilidade | OK | Logs sanitizados e categorias de falha existentes foram preservados; revisão de observabilidade aprovada. |
| RNF004 — Compatibilidade | OK | Frontend, contrato HTTP e schema permanecem inalterados; suíte/frontend build passaram. |

## Testes e Build Executados

* `backend/`: `JAVA_HOME=<JDK 21> ./mvnw verify` — **17 testes aprovados**, incluindo `OpenAiLanguageSupportTest` e `AuthIntegrationTest` com PostgreSQL efêmero Testcontainers; build do JAR bem-sucedido.
* `frontend/`: `npm test -- --run` — **18 testes aprovados**.
* `frontend/`: `npm run build` — **sucesso**.
* E2E novo: não aplicável. Não houve alteração de UI, fluxo do navegador ou contrato HTTP; a mudança está coberta por teste de unidade do payload/configuração do cliente backend e pela suíte de regressão existente.

## Segurança e Multi-Tenancy

* [x] autenticação, autorização e CSRF inalterados
* [x] nenhuma consulta ou filtro por `tenant_id` alterado
* [x] chave OpenAI continua apenas no backend
* [x] transcrição, prompt e segredo continuam fora dos logs

## Governança

`scripts/governance-audit.sh` executado com sucesso: bootstrap, ADRs, sufixos de artefatos e lista de skills aprovados.

## Reintegração na Main

* **Branch de entrega:** `codex/suporte-bilingue-call`
* **Main de origem:** `d4633e3553ae68924affc4548209969c1a86d985`
* **Tipo:** fast-forward
* **SHA publicado da entrega:** `557a4207669ea35e1389ffcfd9f8dc57df40ed74`
* **Publicação:** `git push origin main` concluído com sucesso.

## Pendências e Riscos Residuais

Não há pendências externas no worktree. O fornecedor pode inferir incorretamente o idioma em uma fala muito curta ou ambígua; este risco é inerente ao reconhecimento de áudio e foi limitado aos idiomas PT/EN declarados. A validação de acurácia com áudio real representativo permanece uma atividade operacional, sem registrar conteúdo de reuniões.

## Decisão Final

**APROVADO.** A entrega atende à Intent e ao PRD, tem cobertura automatizada executada, preserva segurança e isolamento e está publicada na `main`.
