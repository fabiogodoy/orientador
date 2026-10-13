# PRD — Normalização da rota /app

## Metadados

| Campo | Valor |
|---|---|
| Slug | `normalizacao-rota-app` |
| Data | 2026-10-13 |
| Origem | `intent/normalizacao-rota-app.md` |
| Status | Aprovado |

## Escopo

O servidor de desenvolvimento Vite deve tratar exatamente `/app` como forma canônica faltante de `/app/`. Estão fora do escopo alterações de produção, rotas da aplicação, sessão, API, banco, permissões e CORS.

## Requisitos funcionais

### RF001 — Entrada sem barra final

Ao receber uma requisição `GET /app`, o servidor local responde com redirecionamento temporário para `/app/`.

**Aceite:** a navegação em `http://localhost:5173/app` termina em `http://localhost:5173/app/` sem exibir a página técnica do Vite.

### RF002 — Preservação do fluxo autenticado

Depois da normalização da URL, a aplicação mantém sua regra atual: sessão válida abre a área autenticada; sessão ausente ou expirada redireciona para `/app/login`.

**Aceite:** uma sessão ausente, após abrir `/app`, termina na tela de login.

### RF003 — Não regressão de rotas

`/app/`, `/app/login`, `/app/cadastro`, `/app/termos` e `/app/reunioes` continuam sendo atendidas pelo frontend.

## Regras de negócio

* RN001 — Apenas o caminho exato `/app` é normalizado; nenhuma rota filha recebe alteração de destino.
* RN002 — O redirecionamento é apenas do ambiente Vite local e não modifica o `base: '/app/'` da build.

## Requisitos não funcionais

* RNF001 — Não introduzir dependência nova.
* RNF002 — Nenhum dado de sessão, autenticação ou tenant é lido ou alterado pela normalização.
* RNF003 — A resposta deve ser um redirecionamento HTTP explícito, fácil de diagnosticar no navegador.

## Estratégia de testes

Adicionar teste de configuração/servidor para `GET /app`; executar testes e build do frontend e validar o fluxo pelo navegador local. Esta é uma única integração segura, sem ticket e sem migration.
