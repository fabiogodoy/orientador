# Impact Analysis — Rolagem acompanhada na call

## Resumo

Mudança de baixo risco, restrita ao estado e renderização da tela React de call.

| Módulo | Impacto |
| --- | --- |
| frontend | Sim — refs de scroll, estado de histórico e controles de UI |
| backend/PostgreSQL/OpenAI | Não |

## Dados, segurança e tenancy

Não há nova persistência, endpoint, consulta ou dado compartilhado. O histórico segue transitório por call, portanto não muda isolamento por `tenant_id` nem a política de sugestões não persistidas.

## Riscos e mitigação

* Auto-rolagem prende quem lê conteúdo antigo — manter estado independente por painel e só acompanhar quando a distância ao fim for até 48 px.
* Atualizações parciais geram animação contínua — usar rolagem imediata para parciais.
* Sugestão anterior reaparece em outra call — limpar estado no mesmo reset de `endCall`/nova sessão.
* Histórico cresce em reunião longa — é limitado à duração da call e removido ao fim.

## Regressão e rollback

Validar captura, geração manual e encerramento existentes. Rollback é reversível removendo o estado/UI novos, sem migration ou dados remanescentes.

## ADR

Não necessário: decisão é local, reversível e não altera fronteiras arquiteturais.

Parecer: implementar.
