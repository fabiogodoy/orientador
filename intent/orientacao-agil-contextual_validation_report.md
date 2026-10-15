# Validation Report — Orientação ágil e contextual

## Metadados
Data: 2026-10-15. Autor: Codex. Intent: `orientacao-agil-contextual.md`; PRD: `orientacao-agil-contextual_prd.md`; Impact: `orientacao-agil-contextual_impact.md`.
Status: **APROVADO**. Escopo validado: implementação e integração Git; deploy não solicitado nesta entrega.

## Resumo Executivo / Problema Original
Espera local reduzida de blocos fixos de 15 s e debounce 1,8 s para teto 8 s, antecipação em pausa após mínimo 5 s e debounce 300 ms. A orientação usa papel/contexto, pode responder, comentar, perguntar com abertura ou indicar ouvir. São esperas locais configuradas e testadas, não promessa de tempo total de provedores.

## Validação PRD × Entrega
| Requisito | Status | Evidência |
|---|---|---|
| RF001 — blocos e silêncio | OK | App.callRecovery pausa/mínimo, App.test silêncio/parada; E2E com MediaRecorder real produziu WebM e primeiro upload em 5.027 ms, captura medida 5.000 ms |
| RF002 — agendamento/custo | OK | Vitest: 299 ms sem chamada, 300 ms com chamada; pendente única, coalescência e throttle 5 s; recuperação em 130 blocos |
| RF003 — intervenção contextual | OK | OpenAiSuggestionClientTest contrato/roles e quatro avaliações reais sintéticas: Resposta/OUVIR/Pergunta após convite/Comentário; E2E Ouvir sem copiar fala |
| RF004 — atualidade/ordem | OK | Vitest invalidação pelo microfone antes de transcrever, voz remota antiga fechada depois da resposta, resumo conservador, ordem invertida e expiração 12 s |
| RF005 — manual/comentários | OK | Manual após “Obrigado.” sem gatilho automático, convite/declarativo reconhecido; E2E contexto de candidato |
| RF006 — limites/medição | OK | Modelo e teto 1.200 preservados; prompt conciso; buffer 200 e User Timing 50/etapa; tempos acessíveis sem conteúdo |

## Regras de Negócio
RN001 OK: áudio somente em memória e silêncio descartado. RN002 OK: rótulos usuário/interlocutor no modelo/interface; códigos legados CLIENT/USER mantidos. RN003 OK: prompt proíbe atribuir fatos/competências só por cargo; revisão sintética repetida após detectar inferência excessiva. RN004 OK: ouvir válido sem fala copiável. RN005 OK: sem retry automático, gerações não sobrepostas e frequência limitada.

## Requisitos Não Funcionais / Sistemas
Frontend e backend: OK. Sessão, CSRF, autorização e filtros tenant/usuário preservados; regressão de isolamento executada. Sem migration ou dependência nova. Compatibilidade: acao aditiva, tipo Ouvir e texto seguro para cliente antigo. Timeout navegador 20 s sugestão/25 s áudio. Logs backend sem conteúdo; métricas locais sem IDs. Landing não afetada.

## Testes / Builds / Ambiente
- `npm run build --prefix frontend`: sucesso (TypeScript e Vite).
- `npm test --prefix frontend`: **39 aprovados**, 4 testes legados já desabilitados; nenhuma falha.
- Java 21 `./mvnw verify`: **24 aprovados**, inclusive 10 testes de integração com PostgreSQL efêmero Testcontainers e Spring Boot em porta aleatória. Nenhum banco persistente usado.
- Backend validado também em cópia temporária limpa, sem a alteração externa de GroqTranscriptionClient; versão final: **BUILD SUCCESS**, 24 testes.
- Playwright/Chromium: **2 aprovados** — captura WebM real de áudio sintético/estado ouvir e recuperação em 130 blocos com relógio simulado. Frontend executado em localhost:5188, HTTP 200; APIs de áudio/sugestão simuladas nesses E2E.
- Modelo real `gpt-6-luna`: quatro cenários sintéticos com prompt final aprovados. Durações 5.451 / 4.366 / 6.173 / 5.652 ms; saídas 148 / 98 / 107 / 139 tokens. Amostra pequena, sem comparação controlada antes/depois e sem SLA.
- Auditoria de governança: TUDO OK; `git diff --check`: OK.

## Evidências
Arquivos locais relativos ao repositório:
- `.scratch/orientacao-agil-contextual/frontend-build.log`, `frontend-tests.log`, `backend-clean-verify.log`, `backend-verify.log`, `e2e.log`, `governance.log`.
- `.scratch/orientacao-agil-contextual/provider-evaluation.json` e script reproduzível `evaluate_provider.py` (somente dados sintéticos; chave obtida do ambiente e nunca impressa).
- `frontend/test-results/contextual-guidance-captur-31a45-evista-com-momento-de-ouvir-chromium/capture-timing.json` e `entrevista-ouvir.png`.
- `frontend/test-results/suggestion-recovery-call-l-5d270-a-e-limpa-erros-ao-encerrar-chromium/recuperacao-call-longa.png`.
Screenshots inspecionados. Na primeira execução o sinal sintético terminava antes da captura iniciar; fixture corrigida para pausar somente após fonte ativa. Sem falha remanescente.

## Reviews
Architecture, Business, Implementation, Security e Observability: aprovadas nos relatórios do mesmo slug.

## Reintegração na Main
Branch de origem: `codex/orientacao-agil-contextual`. Origin/main inicial e anterior à integração: `01bbad7f8886fa08b3138b0ace05eed7f547db70`. Fetch inicial e final executados; branch continha origin/main. Tipo: **fast-forward**, sem conflitos/resoluções e sem alteração de código pela integração.
SHA final da implementação na main: `c6ec2c85db24093898f57c365155b9888cf9bc9c`. Branch publicada; `git push origin main` confirmou `01bbad7..c6ec2c8 main -> main`. HEAD e origin/main conferidos iguais após push.
Este relatório é fechamento documental posterior ao SHA de implementação. Seu commit final pode ser resolvido sem autorreferência por `git log -1 --format=%H -- intent/orientacao-agil-contextual_validation_report.md`; a resposta final da entrega informa o SHA de fechamento publicado.

## Pendências Externas / Preservação
`backend/src/main/java/br/com/connectas/orientador/call/GroqTranscriptionClient.java` já tinha alteração local de fallback antes da tarefa. Não entrou em nenhum commit desta entrega e foi preservado byte a byte: SHA-256 `fc21c0d8129e81ab78455c20253ab92987d37b269988a62258da83fd55356227` antes/depois. Evidências em `.scratch/orientacao-agil-contextual/` são saídas locais desta entrega, não código versionado. Cópia limpa temporária removida após validação; servidor de teste próprio encerrado ao finalizar.

## Regressões / Divergências / Débito / Riscos Residuais
Sem falha nova nos testes. Quatro skips legados não contam como validação. Cabeçalho já apresenta sobreposição em viewport 1280; fora do escopo desta alteração. Esta conversa foi mantida como frente exclusiva da Intent com slug e branch próprios; não houve novo chat.
RMS não é reconhecimento de locutor: ruído pode ser confundido com fala; fallback sem detector não antecipa pausa. Blocos podem cortar uma frase longa. Modelo é probabilístico: teste de quatro exemplos não garante todas as conversas. Latência real da Groq/transcrição não medida. Blocos abaixo de 10 s podem elevar custo por cobrança mínima, compensado parcialmente pelo descarte de silêncio e por limitar gerações. Não há promessa de custo idêntico.

## Arquivos / Classes Alterados
- `CONTEXT.md`
- `backend/src/main/java/br/com/connectas/orientador/call/CallSuggestionResponse.java`
- `backend/src/main/java/br/com/connectas/orientador/call/OpenAiSuggestionClient.java`
- `backend/src/test/java/br/com/connectas/orientador/call/OpenAiLanguageSupportTest.java`
- `backend/src/test/java/br/com/connectas/orientador/call/OpenAiSuggestionClientTest.java`
- `docs/adr/ADR-0007-transcricao-economica-por-blocos.md`
- `frontend/src/App.callRecovery.test.tsx`
- `frontend/src/App.test.tsx`
- `frontend/src/App.tsx`
- `frontend/src/api.ts`
- `frontend/src/callTiming.test.ts`
- `frontend/src/callTiming.ts`
- `frontend/tests/contextual-guidance.spec.ts`
- `frontend/tests/suggestion-recovery.spec.ts`
- `intent/orientacao-agil-contextual.md`
- `intent/orientacao-agil-contextual_architecture-review.md`
- `intent/orientacao-agil-contextual_business-review.md`
- `intent/orientacao-agil-contextual_impact.md`
- `intent/orientacao-agil-contextual_implementation-review.md`
- `intent/orientacao-agil-contextual_observability-review.md`
- `intent/orientacao-agil-contextual_prd.md`
- `intent/orientacao-agil-contextual_security-review.md`
- `intent/orientacao-agil-contextual_test_plan.md`
- `intent/orientacao-agil-contextual_validation_report.md`

## Parecer / Checklist de Liberação
Intent e PRD atendidos; RF/RN implementados; builds e testes executados; multi-tenancy/segurança revisados; ambiente executado; evidências presentes; reviews aprovadas; código em main e origin/main; pendência externa preservada. Não há risco impeditivo identificado. **APROVADO** para a entrega de código validada, sem afirmar deploy em produção.
