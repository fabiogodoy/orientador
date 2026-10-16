# Delivery Validation Report — Sugestões descartadas em conversa contínua

## Metadados e cobertura
2026-10-16. Responsável: Codex. Slug: sugestoes-descartadas-em-conversa. Intent/PRD/Impact de mesmo slug. Escopo exclusivamente frontend e documentação; controle temporal corrigido, sem alterar modelo/prompt/limites/provedores/custos. Autorização: defeito reportado pelo solicitante no produto em uso. A pergunta opcional sobre mensagem visual não teve resposta até esta validação; nenhum fato sobre isso foi presumido.

## Diagnóstico e limites da conclusão
As duas reuniões locais de16/10 tiveram 167 e97 respostas concluídas. Primeiras às08:02:21 e09:02:23, medianas de2.904ms e3.354ms. Mediana de transcrição896/836ms. Logs históricos não distinguem FALAR de OUVIR nem exibição no cliente; portanto não atribuímos a totalidade dos retornos invisíveis ao defeito. Reprodução controlada confirmou que áudio remoto contínuo podia impedir todos os cartões apesar de respostas prontas. Regressão foi corrigida e revalidada.

## PRD × entrega
| Requisito | Evidência / resultado |
|---|---|
| RF001 | OK — não invalida por amostra/bloco remoto; teste de retomada VAD e inferências9s cruzando blocos8s passa. Rótulos indicam conversa/fala recente. |
| RF002 | OK — sessão/local/idade12s preservados; testes de duas calls, voz local imediata, expiração, fila única e watermark passam. |
| RF003 | OK — texto vazio ou falha de transcrição mic sem VAD não cancela; texto reconhecido e VAD real continuam invalidando. |
| RF004 | OK — espera local tem mensagem própria; só resultado OUVIR informa continuar ouvindo. Motivos categóricos testados em buffer efêmero. |
| RF005 | OK — reprodução antes:2 falhas/12 sucessos; após: cenário120s progride, primeiro cartão após17,3s simulados (captura8s + espera300ms + provedor9s). Componentes e E2E de concorrência/recuperação passam. |

5RF atendidos,0 pendentes. RN001–003 OK: sem retry adicional/alteração de modelo e sem texto/IDs nos diagnósticos; limites da simulação e logs explicitados. Não é promessa de SLA externo ou de número de sugestões por reunião. Ouvir continua uma decisão válida do modelo.

## Testes, build e ambiente
- `npm run build`: sucesso; warning preexistente do chunk PDF maior que500kB permanece.
- `npm test`:60 passaram,4 skips preexistentes,8 arquivos. Após reforço de assertion de diagnóstico:17 testes de App.callRecovery passaram novamente.
- Playwright/Chromium:5 regressões passaram no lote (contextual-guidance,3 meeting-toolbar e suggestion-recovery130 blocos); teste novo de continuidade passou isolado após corrigir assertion incompatível com relógio simulado. Total6 cenários aprovados.
- Falha de teste encontrada: User Timing do relógio simulado Playwright retorna lista vazia; assertion de diagnóstico mantida no Vitest via buffer real da aplicação. As verificações funcionais de exibição e fila no browser passaram. Sem alteração de código para contornar essa falha.
- Aplicação executada em localhost:5173; backend8080 também respondeu200 em /api/auth/csrf. Backend não modificado/reiniciado. Mídia/API sintéticas nos testes, sem chamadas pagas ou escrita em PostgreSQL persistente. Testes Java não repetidos por ausência de mudança no backend.
- Evidências em `.scratch/sugestoes-descartadas-em-conversa/`: `before.log`, `unit.log`, `unit-timing.log`, `build.log`, `e2e.log`, `e2e-continuity.log`, `runtime-summary.json`, `sugestoes-conversa-continua.png`.

## Reviews e não funcionais
Implementação/segurança/observabilidade aprovadas nos relatórios de mesmo slug. Revisão factual independente não encontrou bloqueadores. Sem novo acesso entre tenants, alteração de query, dependência, migration ou armazenamento. Buffer limitado a200 entradas e User Timing limitado por etapa. Uma chamada por vez e throttle5s preservados. Sem arquitetura nova/ADR; uma integração segura. Mesmo chat, frente delimitada pelo slug.

## Riscos residuais e rollback
Sem VAD, detecção de voz local depende da transcrição retornar: uma resposta pode aparecer antes desse retorno; com VAD a invalidação é imediata. RMS pode detectar ruído como voz; não recalibrado sem evidência. Janela12s continua descartando inferências expiradas; qualidade semântica e latência real da IA não foram medidas por mocks. Reverter o commit restaura política anterior, sem migração.

## Arquivos alterados
- `frontend/src/App.tsx`
- `frontend/src/callTiming.ts`
- `frontend/src/App.callRecovery.test.tsx`
- `frontend/tests/suggestion-continuity.spec.ts`
- `intent/sugestoes-descartadas-em-conversa.md`
- `intent/sugestoes-descartadas-em-conversa_prd.md`
- `intent/sugestoes-descartadas-em-conversa_impact.md`
- `intent/sugestoes-descartadas-em-conversa_architecture-review.md`
- `intent/sugestoes-descartadas-em-conversa_test_plan.md`
- `intent/sugestoes-descartadas-em-conversa_implementation-review.md`
- `intent/sugestoes-descartadas-em-conversa_security-review.md`
- `intent/sugestoes-descartadas-em-conversa_observability-review.md`
- `intent/sugestoes-descartadas-em-conversa_validation_report.md`

## Reintegração e pendências externas
Alteração direta na main permitida pelo projeto. Base32a36be sincronizada com origin/main por fetch antes da implementação. Pendências externas preservadas: alteração preexistente em backend/src/main/java/br/com/connectas/orientador/call/GroqTranscriptionClient.java e .scratch/. Nada disso integra staging/commit. Publicação e parecer final serão registrados após auditoria e push.
