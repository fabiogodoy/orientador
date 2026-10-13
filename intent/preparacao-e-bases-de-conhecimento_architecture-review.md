# Architecture Review — Preparação e bases de conhecimento para sugestões

## Parecer

**APROVADA COM RESSALVAS.**

## Avaliação

* **Módulos corretos:** frontend controla a captura e a UX; backend controla autorização, persistência e prompt; PostgreSQL armazena dados multi-tenant.
* **Reutilização:** a criação de call e o gerador atual de sugestões serão estendidos, sem cliente paralelo nem nova dependência.
* **Dados:** migration Flyway aditiva é obrigatória. Índice em `knowledge_bases(tenant_id, updated_at desc)` atende a lista por tenant.
* **Complexidade:** média e proporcional: uma tabela, poucas colunas na call, CRUD e uma tela de configurações. Não há RAG, upload ou serviço adicional.
* **Multi-tenancy:** os filtros seguem o padrão de `CallService`; autorização de mutação é regra de serviço, nunca do frontend.
* **ADR:** ADR-0008 registra a escolha de snapshot e a propriedade tenant.

## Ressalvas obrigatórias

1. Snapshot deve ser obtido no backend a partir de ID autorizado; o frontend nunca envia o conteúdo de uma base selecionada ao iniciar a call.
2. DTOs de histórico não podem ganhar os novos campos.
3. Prompt deve separar referência de transcrição e preservar a defesa contra instruções injetadas.
4. Sem dependências novas; usar `JdbcTemplate`, Spring e componentes React existentes.
