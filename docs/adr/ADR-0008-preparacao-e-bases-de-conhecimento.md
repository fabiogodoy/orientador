# ADR-0008 — Preparação por call e bases de conhecimento por tenant

## Status

**Aprovada** — 2026-10-13

## Contexto

Sugestões de call precisam receber referências opcionais fornecidas pelo usuário antes da captura, sem degradar o fluxo sem preparação e sem permitir que uma alteração posterior de uma base mude a referência usada numa reunião já iniciada.

## Decisão

1. `knowledge_bases` será uma entidade textual reutilizável, isolada por `tenant_id` e compartilhada para leitura dentro do tenant.
2. A base terá criador. Em organização, somente criador ou gestor pode alterá-la/excluí-la; no tenant individual, o titular é autorizado.
3. Cada call poderá receber um contexto textual pontual e uma única base selecionada antes do início.
4. A call guardará snapshot do nome/conteúdo da base, além do contexto. O snapshot não será retornado pelas APIs de histórico nem pela análise executiva.
5. As sugestões recebem os snapshots como referência delimitada, com instruções explícitas para não tratá-los como fatos confirmados fora de seu conteúdo.

## Alternativas consideradas

* Guardar apenas ID da base: descartado, pois edição/exclusão mudaria ou eliminaria a referência histórica.
* Copiar a base apenas no navegador: descartado, pois recarga e reconexão perderiam o contexto.
* Biblioteca global entre tenants: descartada por risco de vazamento e por não atender à separação de clientes.
* Arquivos e RAG: fora do escopo; elevam custo, processamento e superfície de segurança.

## Consequências

* Há duplicação controlada de texto na sessão de call, aceita para preservar auditoria e imutabilidade da referência.
* A migration é aditiva e as calls existentes continuam sem preparação.
* A operação exige filtros de tenant e checagem de autoria/gestão em todas as mutações.

## Segurança e privacidade

Não registrar conteúdo nos logs. O conteúdo pode ser enviado ao provedor de sugestões exclusivamente durante a call correspondente. APIs de histórico não o expõem.

## Reversão

Interromper a exibição e o uso das bases/preparação e manter as colunas/tabela sem leitura até uma migration de remoção posterior, após política de retenção apropriada.
