# Test Plan — Administração de bases de conhecimento

## Metadados

* **Slug:** `administracao-bases-de-conhecimento`
* **Data:** 2026-10-14
* **Intent:** `intent/administracao-bases-de-conhecimento.md`
* **PRD:** `intent/administracao-bases-de-conhecimento_prd.md`
* **Impact Analysis:** `intent/administracao-bases-de-conhecimento_impact.md`

## Matriz de cobertura

| RF | Cenário feliz | Alternativo | Erro/segurança | Evidência |
| --- | --- | --- | --- | --- |
| RF001 | CT-FE-01 shell desktop e links | CT-FE-02 perfil e logout | CT-FE-03 sessão expirada | Vitest + E2E |
| RF002 | CT-FE-04 abre/fecha drawer móvel | CT-FE-05 Escape/clique externo | CT-FE-06 foco não escapa da gaveta | Vitest + E2E |
| RF003 | CT-BE-01 página ordenada/filtrada; CT-FE-07 busca e página | CT-BE-02 busca vazia | CT-BE-03 página inválida/tenant alheio | JUnit/Testcontainers + Vitest |
| RF004 | CT-BE-04 criar/editar; CT-FE-08 formulário | CT-BE-05 gestor altera | CT-BE-06 membro não autor | JUnit/Testcontainers + Vitest |
| RF005 | CT-BE-07 exclusão lógica auditada; CT-FE-09 confirmação | CT-BE-08 snapshot preservado | CT-BE-09 base excluída inacessível | JUnit/Testcontainers + Vitest |
| RF006 | CT-BE-10 seleção ativa pesquisável; CT-FE-10 preparação | CT-BE-11 iniciar sem base | CT-BE-12 base excluída entre seleção e início | JUnit/Testcontainers + Vitest |

## Testes unitários e de componente

* **CT-FE-01:** renderizar o shell desktop, verificar Reuniões, Bases de conhecimento, Perfil e Sair; garantir que não exista item Nova reunião.
* **CT-FE-02:** acionar Perfil e Sair; confirmar chamada de logout e navegação para login.
* **CT-FE-04 a CT-FE-06:** em viewport móvel, abrir e fechar o menu por botão, Escape e clique externo, verificando gerenciamento de foco e ausência de conteúdo horizontal cortado.
* **CT-FE-07:** buscar nome, resetar para página inicial, navegar anterior/próxima e apresentar estados vazios distintos.
* **CT-FE-08:** criar/editar, validar limites e preservar campos após erro da API.
* **CT-FE-09:** cancelar e confirmar exclusão; após sucesso, remover o item da lista atual.
* **CT-FE-10:** pesquisar uma opção ativa na preparação; seguir sem base preserva o fluxo existente.

## Testes de integração — backend (Testcontainers PostgreSQL)

* **CT-BE-01/02:** criar bases de dois tenants e bases com datas distintas; listar somente o tenant autenticado, ordenado, em blocos de 20 e filtrado por nome.
* **CT-BE-03:** página negativa ou ID fora de escopo retorna ausência/erro seguro sem dados de outro tenant.
* **CT-BE-04 a CT-BE-06:** validar criação/edição por autor e gestor; membro não autor não altera nem exclui.
* **CT-BE-07:** excluir uma base e verificar `deleted_at` e `deleted_by_user_id` da identidade; a resposta é `204` e o conteúdo não aparece em logs/DTO de auditoria.
* **CT-BE-08:** iniciar uma call com uma base, excluir a base e verificar que o snapshot já salvo continua na sessão.
* **CT-BE-09:** base excluída não é retornada por lista, busca, opção de preparação, atualização, segunda exclusão ou snapshot.
* **CT-BE-10 a CT-BE-12:** seleção paginada/pesquisável retorna somente ativas; início sem base é válido; uma base excluída depois da seleção é recusada no início.

## Testes E2E — Playwright/Chromium

* **CT-E2E-01:** autenticar, abrir Bases pelo menu desktop, criar base, encontrá-la por busca, editar e excluí-la após confirmação.
* **CT-E2E-02:** em viewport móvel, abrir a gaveta, navegar até Bases e retornar à call sem perder os controles principais.
* **CT-E2E-03:** paginar uma lista com mais de 20 bases e validar que nenhum item se repete entre páginas.

## Regressão

* **CT-RG-01:** call continua iniciando pelo fluxo atual de microfone/guia; nenhum item Nova reunião é necessário.
* **CT-RG-02:** histórico de reuniões e detalhe continuam somente leitura e paginados como antes.
* **CT-RG-03:** uma call sem preparação e outra com base ativa iniciam normalmente.
* **CT-RG-04:** CSRF e logout existentes continuam protegendo mutações/sessão.

## Multi-tenancy e segurança

* **CT-MT-01:** tenant A não lista, busca, edita, exclui nem seleciona bases do tenant B.
* **CT-MT-02:** gestão por criador/gestor é conferida no servidor, mesmo que o navegador force a requisição.
* **CT-MT-03:** base logicamente excluída é indistinguível de recurso inexistente para clientes sem autorização.

## Performance

* **CT-PF-01:** inspeção de consulta/migration confirma limite de 20 e índice para `tenant_id`, atividade e ordenação; a preparação não requisita a biblioteca integral.

## Execução obrigatória

1. `npm run build` e `npm test` em `frontend/`.
2. `./mvnw verify` em `backend/` com Java 21 explicitamente selecionado e Docker/Testcontainers disponível.
3. Após builds, iniciar ambiente efêmero autorizado e executar `npm run test:e2e` em `frontend/`.
4. Executar `scripts/governance-audit.sh` porque foram criados artefatos de Intent e ADR.
