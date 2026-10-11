# Test Plan — Áudio da aba do cliente

| Requisito | Cenários e evidência |
|---|---|
| RF001 | Vitest: `getDisplayMedia` é chamado por ação e a faixa de vídeo não é enviada ao WebRTC; Playwright: botão e estado visíveis. |
| RF002/RN001/RN002 | Vitest: microfone e aba têm peer/stream próprios; parar um preserva o outro e sessão termina apenas sem fontes. |
| RF003/RN003 | Vitest: delta/final do cliente atualizam a bolha Cliente e POST envia `speaker=CLIENT`; integração salva e consulta segmento. |
| RF004/RN004 | Vitest: stream sem áudio não chama API OpenAI e mostra instrução; evento `ended` mostra aviso e só desliga a aba. |
| RF005 | Vitest/Playwright: rótulos e retomada chamam novamente o seletor. |
| RF006 | Testcontainers: sessão/tenant do usuário autenticado, falante validado, tenant distinto e chamada anônima não persistem. |

Executar `npm test`, `npm run build`, `npm run test:e2e` e `./mvnw verify` com Java 21. Teste manual complementar: Chrome/Edge, HTTPS/localhost, escolher aba com som e interromper compartilhamento durante a call, sem registrar áudio como evidência.
