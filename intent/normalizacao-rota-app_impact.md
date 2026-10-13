# Impact Analysis — Normalização da rota /app

## Metadados

| Campo | Valor |
|---|---|
| Slug | `normalizacao-rota-app` |
| Data | 2026-10-13 |
| Intent | `intent/normalizacao-rota-app.md` |
| PRD | `intent/normalizacao-rota-app_prd.md` |

## Resumo e complexidade

Correção de baixa complexidade na configuração do servidor local do frontend. Não modifica artefatos de produção, contratos de API, dados ou regras de produto.

| Módulo | Impacto |
|---|---|
| `frontend/` | Sim — middleware de desenvolvimento e teste. |
| `backend/` | Não. |
| PostgreSQL | Não. |
| Integrações externas | Não. |
| `landing/` | Não. |

## Segurança, multi-tenancy e dados

Não há leitura ou escrita de sessão, identidade, `tenant_id`, banco ou dados sensíveis. O middleware atua antes de servir os ativos somente para a URL literal `/app`.

## Riscos e mitigação

* **Redirecionamento excessivo:** probabilidade baixa, impacto médio. Mitigar comparando o caminho exato e cobrindo com teste as rotas filhas.
* **Diferença entre dev e build:** probabilidade baixa, impacto baixo. Manter a configuração de `base` sem alteração e validar o build.

## Rollback

Remover o middleware e o teste associados; não há migration, dado persistido ou configuração operacional a reverter.

## ADR

Não necessário: é uma normalização local, reversível, sem mudança arquitetural, dependência ou contrato.

## Parecer

**Implementar.** O benefício de eliminar um bloqueio de acesso é alto frente ao custo e risco baixos.
