# Architecture Review — Administração de bases de conhecimento

## Referências avaliadas

* `intent/administracao-bases-de-conhecimento.md`
* `intent/administracao-bases-de-conhecimento_prd.md`
* `intent/administracao-bases-de-conhecimento_impact.md`
* `docs/adr/ADR-0009-exclusao-logica-de-bases-de-conhecimento.md`
* Contextos oficiais de arquitetura, padrões e negócio.

## Parecer

**APROVADA COM RESSALVAS.** A solução está nos módulos corretos: interface autenticada em `frontend/`, regras de acesso e consulta no `backend/`, e evolução aditiva no PostgreSQL. Não introduz dependências novas nem desloca autoridade de autorização ao navegador.

## Aderência arquitetural

* Reutilizar o serviço, controlador, sessão, CSRF e regras de criador/gestor de `KnowledgeBaseService`; não duplicar autorização no controller ou frontend.
* Conservar `tenant_id` como fronteira obrigatória em todos os novos SQLs e tratar base inativa como ausente nos métodos de leitura e snapshot.
* Criar uma migration Flyway aditiva para os marcadores de exclusão e os índices; não alterar banco manualmente.
* Manter a call na rota existente e separar seu shell visual da administração, sem introduzir uma aplicação ou roteador externo.
* Reutilizar a linguagem visual e os componentes React existentes; componentes novos devem ter responsabilidade limitada (shell, drawer, página/lista, formulário e seletor pesquisável).

## Ressalvas obrigatórias para implementação

1. A evolução da lista plana não pode quebrar a preparação existente. O contrato de administração e o de seleção devem ser explícitos e ambos devem filtrar bases ativas.
2. O marcador de exclusão deve ser aplicado à mutação e a todos os acessos subsequentes, inclusive a uma seleção feita antes de iniciar a call.
3. A gaveta mobile precisa gerenciar foco e fechamento por Escape/clique externo para não degradar acessibilidade.
4. O conteúdo da base não pode ser incluído em logs de busca, paginação, auditoria ou erro.

## Dados, performance e dependências

A migration e os índices parciais são necessários. Paginação limitada a 20 e filtros por tenant/atividade são adequados ao JDBC atual; não há motivo para adicionar ORM, biblioteca de componentes, biblioteca de roteamento ou mecanismo de busca. A complexidade é média, mas proporcional ao problema de escalabilidade da interface.

## ADR e tickets

A ADR-0009 registra a mudança de política de retenção/auditoria. **Não há tickets adicionais:** migration, contrato, frontend e testes formam uma única fatia vertical segura para integração na `main`; separar etapas deixaria a seleção e o CRUD temporariamente incompatíveis.

## Débito técnico

Não aprovado nesta entrega. Caso uma futura necessidade exija restauração, retenção definitiva ou auditoria visual, deverá ter Intent e revisão próprias.

## Próximo passo

Prosseguir para Business Review e plano de testes; implementar somente após a sincronização obrigatória com `origin/main`.
