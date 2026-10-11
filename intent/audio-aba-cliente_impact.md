# Impact Analysis — Áudio da aba do cliente

## Resumo

A mudança impacta React/WebRTC, contrato autenticado de segmento, PostgreSQL e a integração Realtime. Complexidade técnica alta, pois duas entradas de mídia precisam coexistir sem compartilhar lifecycle.

| Área | Impacto |
|---|---|
| Frontend | `getDisplayMedia`, duas conexões, estado/falhas de áudio da aba, ordem e rótulo do cliente. |
| Backend | valida fonte/falante permitido, preserva tenant/sessão e logs técnicos. |
| PostgreSQL | coluna `speaker` em segmentos existentes e futuros. |
| OpenAI | uma sessão Realtime efêmera por fonte de áudio ativa. |

## Multi-tenancy e segurança

O backend continua derivando usuário e `tenant_id` da sessão. O cliente só informa o falante de uma lista fechada; não fornece tenant, usuário nem credencial. Não há upload de áudio/vídeo ou log de transcrição.

## Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Usuário compartilha sem som | Média | Médio | validar `getAudioTracks()` antes de abrir OpenAI e mostrar instrução. |
| Compartilhamento é interrompido | Média | Médio | observar `ended`, desligar só a fonte e informar a UI. |
| Encerrar uma fonte encerra a outra | Média | Alto | manter streams/conexões e estados separados; teste de regressão. |
| Ordem incorreta de segmentos | Baixa | Alto | contador global no cliente atribuído na finalização e persistido pela sessão. |
| Vazamento de áudio/vídeo | Baixa | Crítico | somente `audioTrack` é adicionado ao WebRTC; vídeo é parado localmente. |

## Dados, rollback e ADR

A migration adiciona `speaker` não nulo, preenche registros legados como `USER` e mantém índice existente. Rollback operacional: desligar a UI/fluxo de fonte de cliente; dados permanecem para auditoria. A decisão de duas conexões Realtime independentes altera a arquitetura de captura e exige ADR.

## Estratégia de testes

Vitest simula streams, trilhas sem áudio, eventos Realtime e encerramento. Spring/Testcontainers valida falante e isolamento. Playwright valida controle/feedback e regressão visual; captura física segue validação manual em Chromium.
