# PRD — Administração de bases de conhecimento

## Metadados

* **Slug:** `administracao-bases-de-conhecimento`
* **Data:** 2026-10-14
* **Origem:** `intent/administracao-bases-de-conhecimento.md`
* **Status:** Aprovado

## Resumo executivo

Esta entrega substitui a administração de bases concentrada em modal por uma rota autenticada, pesquisável e paginada. Também unifica a navegação da área autenticada em uma barra lateral responsiva e substitui a remoção física das bases por exclusão lógica auditável.

## Escopo

### Dentro do escopo

* Shell autenticado com barra lateral de altura integral em desktop e gaveta por menu sanduíche em mobile.
* Navegação para Reuniões, Bases de conhecimento e Perfil; Sair no rodapé da navegação.
* Rota `/app/bases-de-conhecimento` com listagem de bases ativas por tenant, busca por nome, páginas de 20 e CRUD autorizado.
* Exclusão lógica com ator e instante da ação, sem restauração e sem tela de auditoria.
* Busca de bases ativas também no seletor de preparação, para que uma base excluída ou distante na lista não seja carregada indiscriminadamente.
* Migration Flyway e testes necessários.

### Fora do escopo

* CRUD de reuniões, alteração do histórico de reuniões ou nova criação manual de reunião.
* Item “Nova reunião” no menu lateral; a call continua iniciando pelo fluxo atual de conexão de fonte/guia.
* Restauração, lixeira ou consulta visual de auditoria.
* Auditoria de criação/edição, arquivos, links, RAG, busca semântica e permissões novas.
* Alteração dos limites de nome (120) e conteúdo (12.000) já existentes.

## Personas impactadas

* Usuário individual: administra as bases de seu tenant.
* Membro de organização: consulta bases do tenant e administra as que criou.
* Gestor de organização: administra bases do tenant conforme a regra vigente.

## Sistemas e módulos impactados

| Módulo | Impacto |
| --- | --- |
| `frontend/` | Shell autenticado, rotas, formulários, busca, paginação e seleção de preparação. |
| `backend/` | Contrato paginado/pesquisável, exclusão lógica, filtros e autorização. |
| PostgreSQL | Colunas de auditoria e índices de consulta de bases ativas. |
| `landing/` | Não impactado. |
| Provedores de IA | Não impactados. |

## Requisitos funcionais

### RF001 — Navegação autenticada persistente

Em telas desktop, toda tela autenticada exibe uma barra lateral que ocupa a altura visível da página. Ela contém atalhos para Reuniões, Bases de conhecimento e Perfil, e o comando Sair fixado no rodapé.

**Aceite:** os atalhos levam aos destinos corretos; Perfil reutiliza o editor já existente; Sair encerra a sessão pelo endpoint existente e direciona para login; a call continua acessível pelo logotipo/rota inicial e mantém seus controles no topo.

### RF002 — Navegação móvel

Em larguras móveis, a barra lateral fica recolhida e é aberta por botão de menu sanduíche, como gaveta que pode ser fechada por controle explícito, tecla Escape ou clique fora.

**Aceite:** todos os destinos e Sair permanecem utilizáveis por toque e teclado; o foco não fica atrás da gaveta aberta; o conteúdo da call, reuniões e bases não sofre corte horizontal.

### RF003 — Listagem administrativa de bases

A rota `/app/bases-de-conhecimento` mostra somente bases ativas autorizadas do tenant atual. A pessoa pode pesquisar por nome; resultados são ordenados por `updated_at` decrescente e apresentados em páginas de 20 itens.

**Aceite:** buscar limpa a página para a primeira; avançar e retroceder não duplica ou omite itens; estado vazio diferencia “nenhuma base” de “nenhuma base encontrada”; cards exibem nome, trecho seguro de conteúdo e última atualização; conteúdo integral não é registrado em logs.

### RF004 — Cadastro e edição de bases

Na rota administrativa, a pessoa autorizada pode criar uma base e editar uma base permitida, obedecendo aos limites já existentes.

**Aceite:** falhas de validação/API preservam os campos digitados; uma base criada ou editada reaparece na lista com a ordenação atualizada; membro não autor não vê nem consegue executar comandos de edição; o backend é a autoridade para essa regra.

### RF005 — Exclusão lógica auditável

A pessoa autorizada confirma a exclusão de uma base. O backend marca a base como excluída, registra o usuário responsável e o instante da ação, sem removê-la fisicamente.

**Aceite:** após confirmação a base deixa imediatamente a listagem e a busca; chamadas futuras de leitura, edição, exclusão ou seleção tratam a base excluída como inexistente; a operação não expõe a auditoria na interface nesta entrega; snapshots já copiados para `call_sessions` permanecem preservados.

### RF006 — Preparação com bases ativas escalável

O fluxo existente de preparação só permite selecionar bases ativas do tenant e não depende de carregar toda a biblioteca no navegador.

**Aceite:** uma base excluída não é retornada nem aceita ao iniciar uma call; uma pessoa pode localizar uma base ativa pelo nome para selecioná-la; iniciar sem selecionar base preserva o comportamento atual.

## Requisitos não funcionais

* **RNF001 — Segurança:** todas as operações exigem sessão autenticada; criação, edição e exclusão conferem a identidade no backend. Identificadores externos nunca autorizam acesso por si só.
* **RNF002 — Multi-tenancy:** toda leitura, busca, paginação, mutação e seleção filtra o `tenant_id` da identidade autenticada; ausências e falta de permissão retornam recurso não encontrado sem revelar dados.
* **RNF003 — Privacidade:** logs registram somente IDs e metadados operacionais; não registram nome ou conteúdo de base. Os campos de auditoria também não são devolvidos a telas comuns nesta entrega.
* **RNF004 — Performance:** a lista administrativa executa contagem e consulta paginada sobre bases ativas, com limite máximo de 20 por página e índice compatível com tenant, atividade e ordenação. A seleção de preparação é consultável e limitada.
* **RNF005 — Acessibilidade e compatibilidade:** interface navegável por teclado, com rótulos associados, foco gerenciado na gaveta/diálogos e uso adequado em desktop Chromium e telas móveis.
* **RNF006 — Observabilidade:** logs estruturados de criação, edição e exclusão incluem IDs da base, do tenant e do ator, além do instante/duração quando aplicável, sem conteúdo textual.

## Regras de negócio

* **RN001:** `KnowledgeBase` pertence a um único tenant e somente registros com `deleted_at IS NULL` são ativos.
* **RN002:** Criador e gestor organizacional podem editar/excluir uma base ativa; usuário individual administra a sua base; os demais membros apenas leem/selecionam bases ativas do tenant.
* **RN003:** Exclusão lógica define `deleted_at` e `deleted_by_user_id` uma única vez e não existe restauração nesta entrega.
* **RN004:** Bases excluídas não integram a administração, resultados de busca, preparação ou novas sessões de call.
* **RN005:** O snapshot de uma base salvo em call antes de sua exclusão mantém nome e conteúdo originais e não é modificado.
* **RN006:** Busca por nome é opcional e não altera o escopo de tenant nem as regras de autorização.
* **RN007:** Reunião continua designando uma `call_session`; seu histórico é somente leitura nesta entrega.

## Fluxos

### Fluxo principal — administrar bases

1. A pessoa autenticada abre Bases de conhecimento pelo menu.
2. A aplicação consulta a primeira página de bases ativas do tenant.
3. A pessoa pesquisa por nome e/ou navega pelas páginas.
4. Cria ou edita uma base autorizada e recebe feedback de sucesso ou erro.
5. Para excluir, confirma a ação; a base desaparece da página e das seleções futuras.

### Fluxo alternativo — preparar uma call

1. A pessoa abre a preparação antes de conectar uma fonte.
2. Pesquisa e escolhe opcionalmente uma base ativa; ou segue sem base.
3. O servidor confere novamente que a base está ativa e pertence ao tenant ao iniciar a call.

### Casos de erro

* Página inválida, base inexistente, excluída ou fora do tenant retorna ausência de recurso sem revelar sua existência.
* Falha de listagem mantém uma mensagem acionável e permite nova tentativa.
* Falha de criação/edição/exclusão mantém o formulário ou lista consistentes e não descarta entradas não salvas.
* Uma base excluída entre a seleção no navegador e o início da call impede somente aquela seleção; a pessoa pode iniciar sem base ou escolher outra.

## Dados, APIs e migração

* `knowledge_bases` recebe `deleted_at TIMESTAMPTZ NULL` e `deleted_by_user_id UUID NULL`, referenciando o usuário que executou a exclusão.
* A migration acrescenta índice parcial de bases ativas por tenant e atualização, e índice apropriado para a busca por nome ativa.
* A listagem administrativa passa a retornar um envelope com `items`, `page`, `pageSize` e `total`; aceita página e busca por nome.
* A seleção de preparação recebe contrato paginado/pesquisável somente de bases ativas. Criação, edição e exclusão mantêm seus contratos de mutação, com a exclusão passando a devolver `204` após a marcação lógica.
* Rollback operacional: desativar as novas rotas/tela e manter colunas aditivas sem leitura; não reverter uma exclusão lógica automaticamente, pois não há restauração aprovada.

## Estratégia de testes

* Frontend/Vitest: shell desktop/móvel, links, logout, administração, busca, paginação, formulário, confirmação e erro.
* Backend/JUnit/Testcontainers: isolamento de tenant, regras de criador/gestor, exclusão lógica/auditoria, exclusão da listagem/busca/seleção e preservação de snapshots.
* E2E/Playwright: menu responsivo, navegação até bases, CRUD e pesquisa/paginação autenticados.

## Estratégia de tickets

Não são necessários tickets separados. Migration, contratos, interface e testes devem ser integrados como uma única fatia vertical, pois separar a evolução da lista da preparação criaria incompatibilidade temporária.

## Aprovação

Escopo e decisões de produto confirmados pelo solicitante em 2026-10-14.
