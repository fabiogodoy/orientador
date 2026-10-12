# Impact Analysis — Consulta de reuniões

## Resumo e complexidade

Complexidade técnica **média**: acrescenta leitura de dados sensíveis já persistidos, com autorização de papéis e paginação. Complexidade de negócio e operacional **média** por expor transcrições históricas a gestores e admins autorizados.

## Módulos impactados

| Módulo | Impacto |
| --- | --- |
| `backend/` | Novos contratos GET, consultas SQL autorizadas, logs de consulta e índice Flyway. |
| `frontend/` | Rotas manuais existentes, cliente de API, telas lista/detalhe e navegação. |
| PostgreSQL | Novo índice em `call_sessions`; dados existentes permanecem compatíveis. |
| OpenAI/captura | Não impactados. |

## Dados e performance

`call_sessions`, `transcript_segments` e `users` serão lidos. A listagem é limitada a 20 e ordenada por início; será criado índice para o filtro `status` e ordenação. O detalhe consulta somente uma sessão autorizada e seus segmentos ordenados.

## Multi-tenancy e segurança

Cada consulta reconstruirá a identidade pelo `userId` da sessão. A seleção aplica, no servidor, escopo global somente para `PLATFORM_ADMIN`, `tenant_id` para `ORGANIZATION_MANAGER` e `tenant_id` + `user_id` para os demais. O mesmo predicado de acesso protege lista e detalhe; o frontend não fornece tenant nem dono. Detalhes fora do escopo serão indistinguíveis de inexistentes. Logs registrarão ID da sessão, usuário consultante, papel e tenant, sem texto transcrito.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre tenants | Baixa | Alto | Predicados por papel no serviço, testes de isolamento e revisão de segurança. |
| Gestor consultar dado fora do tenant | Baixa | Alto | Nunca aceitar tenant por parâmetro; recarregar identidade da sessão. |
| Consulta lenta ao crescer | Média | Médio | Paginação fixa, ordenação estável e índice Flyway. |
| Regressão em call ativa | Baixa | Médio | Manter endpoints de captura inalterados e cobrir regressão. |

## Compatibilidade e rollback

Os endpoints são novos e não alteram contratos existentes. Rollback: remover as rotas do frontend/backend em versão posterior; o índice adicional é reversível e não modifica registros.

## ADR

Não necessário: não há nova arquitetura, dependência ou política inédita; a entrega materializa a política de leitura já documentada.

## Parecer

Implementar com testes de autorização, isolamento e paginação antes de expor a interface.
