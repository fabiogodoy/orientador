# Impact Analysis — Tela de call ao vivo

## Metadados

| Campo | Valor |
| --- | --- |
| Slug | `tela-call-ao-vivo` |
| Data | 2026-10-11 |
| Intent | `intent/tela-call-ao-vivo.md` |
| PRD | `intent/tela-call-ao-vivo_prd.md` |

## Resumo e complexidade

Alteração visual e local da home autenticada. Complexidade técnica: baixa; negócio: média; operacional: baixa.

## Sistemas e módulos

| Sistema/Módulo | Impacto |
| --- | --- |
| `frontend/` | Sim — `App.tsx`, estilos e testes da home |
| `backend/` | Não |
| `landing/` | Não |
| PostgreSQL | Não |
| xAI/Grok e streaming | Não |

## Dados, integrações e performance

Não há estruturas, leituras, escritas, índices, APIs, contratos ou integrações novos. O volume é limitado a conteúdo mockado em memória; risco de performance baixo.

## Segurança e multi-tenancy

* A autenticação continua sendo a barreira da home; não há alteração no contrato de sessão.
* Nenhuma consulta, dado de cliente ou `tenant_id` é introduzido no frontend.
* As falas e sugestões são fictícias e não representam dados de tenants.
* Não há novo log, credencial ou permissão de navegador.

## Impacto no usuário e operação

Usuários individuais, membros de organização e gestores passam a entender visualmente o fluxo do produto. O risco operacional é o usuário interpretar o mock como funcional; a mitigação é rotulagem de demonstração e ausência deliberada de permissões/captura.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| A nova home ocultar informação útil de conta | Média | Baixo | Manter logout e limitar a troca ao objetivo desta etapa; a página de conta poderá ser retomada em entrega própria. |
| Layout quebrar em viewport estreito | Média | Médio | CSS responsivo e teste visual/E2E em viewport móvel. |
| Mock sugerir gravação real | Baixa | Médio | Declaração de demonstração e nenhum uso de API de mídia. |
| Regressão de autenticação/logout | Baixa | Médio | Reusar `api.me` e `api.logout`; cobrir com testes existentes/novos. |

## Regressões potenciais

* RP001 — Login, expiração da avaliação e logout podem deixar de redirecionar corretamente se a home for reestruturada.
* RP002 — Estilos globais podem afetar login, cadastro ou termos.

## Estratégia de rollback

Reverter o commit da entrega restaura a home anterior; não há dados persistidos nem migração a reverter.

## Necessidade de ADR

Não. Não há mudança arquitetural, integração, dependência, autorização, multi-tenancy, estrutura de dados ou débito técnico consciente. A integração real de streaming exigirá análise e possivelmente ADR em uma entrega separada.

## Parecer

**Implementar.** Os riscos são baixos e controláveis; a tela está no módulo correto e prepara validação de experiência sem antecipar a arquitetura de tempo real.
