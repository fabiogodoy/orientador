# Impact Analysis — Administração de bases de conhecimento

## Metadados

* **Slug:** `administracao-bases-de-conhecimento`
* **Data:** 2026-10-14
* **Intent:** `intent/administracao-bases-de-conhecimento.md`
* **PRD:** `intent/administracao-bases-de-conhecimento_prd.md`

## Resumo e complexidade

A entrega reorganiza a experiência autenticada e muda o ciclo de vida de `knowledge_bases` de remoção física para exclusão lógica auditável. A complexidade técnica é **média**, por envolver frontend, contrato de listagem, autorização, dados multi-tenant e migration; a complexidade de negócio e operacional é **baixa a média**.

## Módulos impactados

| Módulo | Impacto |
| --- | --- |
| `frontend/` | Sim — shell autenticado, navegação responsiva, rota de bases, busca/paginação e preparação pesquisável. |
| `backend/` | Sim — contrato de consulta, filtros de atividade, exclusão auditável e validação de seleção. |
| PostgreSQL | Sim — colunas de exclusão/auditoria e índices parciais. |
| `landing/` | Não. |
| OpenAI/Groq | Não — nenhum conteúdo adicional é enviado aos provedores. |

## Dados e banco

`knowledge_bases` ganhará marcadores aditivos de exclusão e ator. As consultas de listagem, busca, `snapshot` e mutações deverão tratar bases excluídas como inexistentes. A tabela já possui `tenant_id` e índice de atualização; novos índices parciais de registros ativos evitam que linhas excluídas degradem os caminhos de consulta com o aumento do histórico.

O rollback de schema é aditivo: a aplicação pode deixar de ler os novos campos e retornar ao fluxo anterior sem apagar dados. Isso não reativa registros excluídos, pois restauração não foi aprovada para esta entrega.

## Multi-tenancy e segurança

O risco principal é incluir base de outro tenant ou base excluída por meio de ID, busca ou uma seleção mantida no navegador. Mitigações obrigatórias:

* toda consulta usa `tenant_id` da identidade autenticada e `deleted_at IS NULL`;
* criação registra a identidade autenticada como autora; atualização/exclusão confirmam autor ou gestor no servidor;
* busca e paginação nunca recebem tenant fornecido pelo cliente;
* `snapshot` da criação de call verifica atividade e tenant novamente;
* ausência, exclusão ou falta de permissão seguem a semântica de recurso não encontrado;
* logs de auditoria usam IDs e não nome/conteúdo das bases.

## Compatibilidade e contratos

O contrato existente de lista plana é consumido tanto pelo modal administrativo quanto pela preparação. Alterá-lo sem adaptação quebraria a seleção de bases em uma call. A mitigação é evoluir ambos os consumidores para contratos explícitos: página administrativa e busca limitada de opções para preparação, preservando mutações existentes. A rota de histórico de reuniões permanece sem alteração funcional.

## Impacto em performance

A página administrativa exige uma contagem e uma busca ordenada por requisição. O limite fixo de 20, filtros parciais de bases ativas e índices por `tenant_id` mitigam volume crescente. Busca de texto deve permanecer limitada e parametrizada; não será carregada a biblioteca integral no navegador durante a preparação.

## Impacto de UX e operação

A barra lateral altera toda a superfície autenticada. O risco de quebrar controles de captura, layouts estreitos ou foco de teclado é mitigado por um shell comum, testes de componentes e fluxo E2E mobile. O suporte ganha rastreabilidade de quem desativou uma base e quando, sem expor um novo painel de auditoria a usuários comuns.

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre tenants pela nova busca | Baixa | Alto | Filtro de tenant em todos os SQLs e testes negativos. |
| Base excluída ainda ser selecionável | Média | Alto | Filtro de atividade na busca e validação novamente no `snapshot`. |
| Reativação acidental por rollback | Baixa | Médio | Rollback só desativa leitura; não limpa marcadores nem restaura registros. |
| Regressão de call em layout móvel | Média | Alto | Shell responsivo, teste de navegação e E2E de captura existente. |
| Custo de busca/lista em tenants grandes | Média | Médio | Limite, paginação e índices parciais/por nome. |
| Conteúdo de base aparecer em logs | Baixa | Alto | Revisão de logs e testes/revisão de segurança. |

## Regressões potenciais

* A preparação pode deixar de listar opções ou permitir uma base excluída se seus contratos não forem atualizados junto com a listagem.
* O layout lateral pode encobrir controles de áudio, título ou encerramento da call.
* Uma exclusão lógica mal filtrada pode permitir edição/exclusão repetida ou retorno de itens apagados na paginação.
* A mudança de endpoint pode romper os testes e consumidores atuais de `knowledgeBases`.

## Estratégia de testes

* **Unitários:** normalização de busca, cálculo de página e regras de atividade/autorização isoladas.
* **Integração:** consultas paginadas por tenant, pesquisa, ator/instante da exclusão, inacessibilidade pós-exclusão, permissões e snapshot histórico.
* **E2E:** navegação desktop e menu móvel, rota de bases, busca, paginação, formulário e exclusão confirmada.

## ADR

**Necessária.** A mudança estabelece uma política persistente e auditável para a retirada de bases multi-tenant, altera contratos de consulta e possui consequência intencional de não restauração. A decisão deve complementar a ADR-0008, que instituiu a entidade e seus snapshots por call.

## Parecer

**Implementar com ajustes controlados.** A entrega é compatível com a arquitetura atual desde que a evolução do contrato, filtros de exclusão, auditoria e responsividade sejam entregues como uma única fatia vertical e cobertos por testes.
