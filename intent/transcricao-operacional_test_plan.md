# Test Plan — Transcrição operacional da call

## Matriz de cobertura

| Requisito | Cenário | Evidência |
|---|---|---|
| RF001 | Estado vazio sem segmentos; segmento final substitui estado vazio | Vitest e Playwright |
| RF002 | Erro `ApiError` é exibido; falha WebRTC é classificada | Vitest |
| RF003 | Segmento `CLIENT`/`USER` persiste com tenant e sessão | JUnit/Testcontainers |
| RF004 | Backend local reiniciado aplica Flyway e recebe rota atual | log de startup, consulta local e teste manual autenticado |

## Cenários obrigatórios

* Unitário: painel inicia vazio e renderiza apenas mensagem ao vivo final.
* Unitário: `ApiError` preserva sua mensagem segura; erro de conexão Realtime informa a etapa.
* Integração: usuário autenticado grava segmento; tenant/usuário divergentes não gravam; V02/V03 aparecem no histórico Flyway do banco efêmero.
* E2E: tela da call não contém conteúdo de demonstração e mantém controles responsivos sem API real.
* Manual: em Chrome/Edge, com backend atual em `localhost`, permitir microfone, falar uma frase e confirmar o segmento; interromper a fonte e confirmar erro seguro.

## Comandos

`npm test`, `npm run build`, `npm run test:e2e` em `frontend/`; Java 21 e `./mvnw verify` em `backend/`; auditoria `scripts/governance-audit.sh`.
