# Delivery Validation Report — Autenticação e cadastro

- Data: 2026-10-10
- Intent: `intent/autenticacao-cadastro.md`
- PRD: `intent/autenticacao-cadastro_prd.md`
- Status: **APROVADO COM RESSALVAS** para desenvolvimento local; não publicado em produção.

## Problema e cobertura

O problema original foi resolvido para o recorte aprovado: visitante cria conta individual ou organização com primeiro gestor, aceita Termos públicos, entra, vê seu espaço e sai. Avaliação de sete dias e bloqueio são regras no servidor. Não há captura/transcrição, membros extras, admin, cobrança, renovação nem e-mails, todos explicitamente fora desta entrega.

| Requisito | Resultado | Evidência |
|---|---|---|
| RF001 login/cadastro | OK | `frontend/src/App.tsx`, Vitest e screenshots desktop/móvel. |
| RF002 individual | OK | `AccountService`, `AuthIntegrationTest`, Playwright individual. |
| RF003 organização | OK | `AccountService`, `AuthIntegrationTest`, Playwright gestor. |
| RF004 Termos e aceite | OK | `docs/legal/termos-de-uso.md`, `/app/termos`, tabela `terms_acceptances`, testes. |
| RF005 sessão e saída | OK | `SecurityConfig`, `AuthController`, integração e E2E. |
| RF006 sete dias | OK | `Identity`, `TrialAccessFilter`, teste do limite exclusivo e sessão antiga. |
| RF007 área inicial | OK | `HomePage`, endpoint `/api/auth/me`, E2E. |
| RF008 duplicidade/cadastro indevido | OK | índice único, validação JSON, testes de duplicata e papel admin rejeitado. |

Cobertura funcional: 8/8 RF. Regras RN001–RN008: 8/8 atendidas; ver testes de cadastro transacional, unicidade, hash, aceite, prazo exato, resposta de login, tipos públicos e ausência de cobrança. Não foi detectada exposição entre tenants no fluxo atual: tenant é gerado no servidor e a identidade autenticada é recuperada pelo ID da sessão. Ainda não existe API de transcrições para testar acesso entre tenants a esse recurso futuro.

## Builds, testes e ambiente

- `backend/`: `./mvnw -q verify` com Java 21 — sucesso; 10 testes (4 unitários, 6 de integração). Datasource de integração confirmada em PostgreSQL efêmero de Testcontainers, sem uso de `desenv_orientador`.
- `frontend/`: `npm run build` — sucesso; `npm test` — 5/5 testes; `npm run test:e2e` — 3/3 cenários em Chromium.
- Aplicação local executada: Spring Boot em `localhost:8080`, Vite em `localhost:5173`, PostgreSQL temporário em container dedicado. Cadastro individual, organizacional, Termos, login, logout e validação sem aceite foram exercitados de ponta a ponta. Serviços e banco temporário foram encerrados depois da execução.
- Auditoria: `scripts/governance-audit.sh` e `git diff --cached --check` — sem falhas.
- QA visual: `frontend/test-results/login-desktop.png` e `frontend/test-results/cadastro-mobile.png` (arquivos locais ignorados pelo Git); a logo clara do painel escuro foi corrigida após a inspeção.
- `npm audit --omit=dev --audit-level=high`: zero vulnerabilidades reportadas na execução.

## Segurança, operação e regressão

Revisões de implementação, segurança e observabilidade aprovadas com ressalvas documentadas nos arquivos irmãos desta Intent. Senhas e tokens não aparecem nos logs; a senha fica em hash, cookies são HttpOnly/SameSite e Secure por padrão, CSRF e CORS foram testados. A migration Flyway foi aplicada apenas a bases efêmeras nos testes. Não havia fluxo anterior do produto para regredir; harness e marca foram preservados. Nenhuma pendência externa ao escopo foi encontrada no worktree ao reintegrar.

Riscos residuais: e-mail e organização não verificados, sem recuperação de senha; limitação de tentativas e sessão em memória são de instância única. Chrome/Chromium desktop e viewport móvel foram testados; Edge não estava instalado para execução própria. A API pública ainda precisa de certificado TLS válido; **não houve deploy**. Antes da operação comercial, revisar juridicamente os Termos, corrigir TLS, configurar HTTPS/CORS e criar contratação/reativação para contas vencidas.

## Reintegração

- Branch de entrega: `codex/autenticacao-cadastro`, commit `5e27530dbbb6444b0a7504ba843159bc0bd880e0` enviado ao remoto.
- `origin/main` usada como base: `bd89079d786a72537fe917737abfb7260274e6fa`; branch continha essa base antes do merge.
- Integração: fast-forward na `main`, seguida de commit mecânico de normalização CRLF do Maven Wrapper Windows.
- SHA da `main` com o código reintegrado, antes deste relatório: `c5d33ca` (o próprio relatório é publicado em commit posterior de governança).
- Evidência: `git push origin main` enviou `bd89079..5e27530` e depois `5e27530..c5d33ca`; `git ls-remote origin refs/heads/main` confirmou a main remota nesse SHA antes da criação do relatório.

## Decisão

**Aprovado com ressalvas** para o escopo local solicitado. Todos os RF e RN foram implementados, builds e testes executados com sucesso, ambiente rodou e `main`/`origin/main` receberam o código. As ressalvas são condições para publicação/operação comercial, não funcionalidades solicitadas nesta entrega. Este relatório deve ser commitado e enviado à `origin/main` como registro final.
