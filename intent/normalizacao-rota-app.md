# Intent — Normalização da rota /app

## Metadados

| Campo | Valor |
|---|---|
| Slug | `normalizacao-rota-app` |
| Data | 2026-10-13 |
| Autor | Usuário e Codex |
| Status | Aprovada |

## Problema

Ao acessar a aplicação local pelo endereço natural `http://localhost:5173/app`, o servidor de desenvolvimento do frontend exibe uma página técnica do Vite em vez de iniciar a aplicação. A pessoa precisa conhecer e digitar manualmente a variante com barra final ou a rota de login, o que interrompe o fluxo de acesso e sugere que o produto não está em execução.

## Contexto e objetivo

O Orientador é servido sob a base pública `/app/`. Usuários individuais e de organizações devem conseguir abrir a aplicação pelo endereço sem barra final, sem conhecimento da configuração de desenvolvimento. O resultado esperado é que `/app` leve automaticamente a `/app/`, onde o fluxo existente decide entre área autenticada e login.

## Impactados

* Usuários locais do frontend, incluindo o solicitante.
* Suporte e desenvolvimento, que deixam de orientar a alteração manual de URL.

## Módulo afetado

* `frontend/` — configuração do servidor Vite e teste de rota.

## Restrições e riscos

* Não alterar as rotas públicas, autenticação, API, banco ou tenant.
* Preservar a base de produção `/app/` e o comportamento de todas as rotas com barra final.
* Principal risco: redirecionar incorretamente caminhos que não sejam exatamente `/app`; mitigação por teste específico.

## Critérios de sucesso

* CS001 — `GET /app` retorna redirecionamento para `/app/` no servidor local.
* CS002 — `GET /app/` e as rotas existentes continuam carregando a aplicação.
* CS003 — Após o redirecionamento, a sessão expirada continua conduzindo o usuário ao login.

## Perguntas em aberto

Nenhuma. O solicitante confirmou que o comportamento desejado é o acesso normal por `/app`.
