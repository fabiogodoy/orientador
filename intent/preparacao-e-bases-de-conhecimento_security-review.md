# Security Review — Preparação e bases de conhecimento

## Parecer

**APROVADO.** Risco classificado como médio por envolver dados internos e novos endpoints autenticados; nenhuma vulnerabilidade crítica ou alta foi identificada na revisão.

## Controles verificados

* Toda API usa a identidade da sessão; o frontend não informa `tenant_id`, autor ou conteúdo do snapshot.
* Listagem, leitura de snapshot, edição e exclusão aplicam `tenant_id` no SQL.
* Base inexistente, de outro tenant ou sem permissão de mutação retorna o mesmo `404`, reduzindo enumeração de IDs.
* Só criador ou `ORGANIZATION_MANAGER` pode alterar/excluir; qualquer membro autorizado do tenant pode selecionar para uma call.
* A criação de call consulta a base pelo ID e tenant no servidor, evitando IDOR e adulteração de conteúdo pelo payload.
* Contexto/snapshot não são adicionados aos DTOs de histórico e não são logados.
* Não houve adição ou alteração de credenciais.

## Recomendações futuras

Caso bases passem a aceitar arquivos ou links, adicionar validação de mídia, varredura, classificação de dados e política explícita de retenção antes de liberar esse formato.
