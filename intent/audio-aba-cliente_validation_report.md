# Delivery Validation Report — Áudio da aba do cliente

## Resumo e status

**APROVADO COM RESSALVAS.** A entrega adiciona uma fonte de áudio compartilhado independente do microfone, com identificação persistida de cliente e tratamento de ausência/interrupção de áudio. A seleção física de aba e o provedor real exigem validação manual em Chrome/Edge com dispositivo/aba de reunião disponíveis; nenhum áudio foi gravado como evidência.

## PRD × entrega

| Requisito | Status | Evidência |
|---|---|---|
| RF001 | Atendido | `getDisplayMedia` é acionado pelo controle e só suas faixas de áudio entram no peer WebRTC. |
| RF002 | Atendido | referências de stream/conexão por fonte e liberação isolada em `App.tsx`. |
| RF003 | Atendido | eventos da fonte `tab` geram bolha Cliente, sequência global e `speaker=CLIENT`. |
| RF004 | Atendido | teste Vitest cobre stream sem áudio; tracks observam `ended` e exibem aviso. |
| RF005 | Atendido | estados/labels do botão expressam escuta ativa e permitem nova seleção. |
| RF006 | Atendido | V03 e serviço backend persistem enum de falante por sessão/tenant autenticados. |
| RN001–RN005 | Atendidas | fontes e sessão têm lifecycle independente; endpoint de segredo valida sessão ativa; sem áudio não cria conexão. |

## Segurança, multi-tenancy e observabilidade

* `tenant_id` e usuário continuam derivados no backend; um ID de call não basta para emitir segredo ou inserir segmento.
* `speaker` é enum fechado (`USER`/`CLIENT`); não há áudio, vídeo, texto de fala ou segredo em logs.
* Logs operacionais registram somente IDs, sequência e falante. A UI diferencia navegador incompatível, seleção sem som e interrupção do compartilhamento.

## Evidências executadas

| Comando | Resultado |
|---|---|
| `npm test` | 8 testes aprovados |
| `npm run build` | aprovado |
| `npm run test:e2e` | 4 testes Chromium aprovados |
| `JAVA_HOME=... ./mvnw verify` | 11 testes aprovados; Testcontainers aplicou V01, V02 e V03 |
| `git diff --check` | aprovado |
| `scripts/governance-audit.sh` | aprovado |

## Risco residual

O navegador pode devolver display sem áudio mesmo quando o usuário o solicita; a UI detecta esse caso e instrui uma nova seleção. A ordem persistida é a ordem de finalização recebida pelo navegador entre duas conexões independentes. Validar manualmente em `localhost` ou HTTPS, com uma aba Chrome/Edge que compartilhe som, e interromper o compartilhamento durante a call.

## Reintegração

* **Branch:** `codex/audio-aba-cliente`
* **Main de origem:** `1b0085cc174f2343bc89c3c5a4a6ea2189483687`
* **Tipo, SHA final e push:** pendentes de reintegração.

## Parecer final

Intent e PRD atendidos, sem regressões observadas nos testes automatizados. A ressalva manual é operacional, não um requisito funcional pendente.
