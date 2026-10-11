# Test Plan — Transcrição de microfone em tempo real

| RF | Cobertura |
|---|---|
| RF001/RF006 | Componente: inicia somente por ação, trata permissão negada e erro de sessão. |
| RF002 | Componente: eventos delta/final atualizam a tela; E2E com WebRTC/OpenAI simulados. |
| RF003 | Componente: tracks/canal/peer são fechados; backend marca sessão encerrada. |
| RF004 | Integração Spring/Testcontainers: segmento final persiste e consulta/escrita de tenant distinto falha. |
| RF005 | Integração HTTP mockada: segredo efêmero é emitido sem chave principal e sem log. |

Executar `npm test`, `npm run build`, `./mvnw verify` com Java 21 e Playwright. A validação manual em HTTPS/localhost com microfone real e chave local não registra áudio em evidência.
