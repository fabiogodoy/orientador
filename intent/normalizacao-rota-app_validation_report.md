# Validation Report — Normalização da rota /app

## Status geral

**APROVADO.** A entrada local `http://localhost:5173/app` passou a normalizar a URL antes de carregar a aplicação, removendo a página técnica do Vite e preservando o fluxo de login.

## Cobertura da Intent e do PRD

| Item | Estado | Evidência |
|---|---|---|
| Problema original | OK | `GET /app` devolveu `302 Found` com `Location: /app/`. |
| RF001 | OK | Middleware `app-base-redirect` normaliza somente a URL literal; teste unitário cobre a regra. |
| RF002 | OK | Navegação real em Chrome de `/app` terminou em `/app/login` sem sessão. |
| RF003 | OK | `GET /app/` e `GET /app/login` devolveram `200`. |
| RN001–RN002 | OK | Teste preserva rota canônica, rota filha e URL com query; `base: '/app/'` não foi alterada. |
| Segurança e tenant | Não aplicável | Não há acesso a sessão, API, banco, dados ou `tenant_id`. |
| Observabilidade | OK | Resposta HTTP explícita `302` e cabeçalho `Location` permitem diagnóstico direto. |

## Evidências executadas

* `frontend: npm test -- --run` — 19 testes passaram; 4 cenários legados permaneceram explicitamente ignorados.
* `frontend: npm run build` — sucesso.
* Navegação Chrome: `http://localhost:5173/app` → `http://localhost:5173/app/login` com sessão ausente.
* `scripts/governance-audit.sh` e `git diff --check` — sucesso.

## Reintegração

* Branch de origem: `codex/normalizacao-rota-app`.
* Base usada: `origin/main` em `4a3ac65`.
* Integração: fast-forward sem conflito para `main` em `7a54320`.
* Publicação do código: `git push origin main` concluído; `origin/main` recebeu `7a54320`.

## Regressões, pendências e riscos residuais

Nenhum encontrado. Não há pendências externas ao escopo nem débito técnico gerado.

## Decisão final

**APROVADO — Intent e PRD atendidos, testes e build executados, `main` publicada.**
