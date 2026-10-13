# Test Plan — Normalização da rota /app

## Matriz de cobertura

| Requisito | Cenário | Evidência |
|---|---|---|
| RF001 | `GET /app` recebe `302` para `/app/`. | Teste automatizado do servidor Vite. |
| RF002 | Sem cookie de sessão, `/app` termina em `/app/login`. | Navegação real no Chrome local. |
| RF003 | Rotas com barra e rotas filhas permanecem atendidas. | Teste automatizado e build Vite. |

## Execuções previstas

* Unitário/integração de configuração Vite para caminho canônico e rota filha.
* `npm test -- --run` e `npm run build` em `frontend/`.
* Navegação local no Chrome em `http://localhost:5173/app` sem sessão.

## Não aplicável

Banco, multi-tenancy e autorização server-side não são afetados. O cenário de segurança é a garantia de que o redirecionamento não adiciona acesso a recurso protegido.
