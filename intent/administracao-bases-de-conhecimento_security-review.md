# Security Review — Administração de bases de conhecimento

## Parecer

**APROVADO.** Não foi identificada vulnerabilidade crítica, alta ou média introduzida pela entrega.

## Autenticação, autorização e isolamento

* Toda operação parte do `SessionPrincipal`; IDs recebidos pelo navegador não definem tenant nem ator.
* Listagem, busca, opções, edição, exclusão e snapshot sempre incluem `tenant_id` da identidade autenticada.
* Edição e exclusão exigem criador ou gestor organizacional. Resultado ausente, inativo, fora do tenant ou sem permissão é tratado como não encontrado, sem revelar dados.
* A base excluída deixa de ser aceita também na criação de uma call, fechando a janela entre seleção no navegador e ação no servidor.

## Privacidade e auditoria

* Exclusão atualiza `deleted_at` e `deleted_by_user_id` na própria linha, preservando evidência sem expor os campos no contrato normal da UI.
* Registros de criação, edição e exclusão contêm somente IDs operacionais; a listagem registra tamanho do termo, nunca seu texto ou conteúdo da base.
* Nenhuma credencial, conteúdo de base ou informação de outro tenant foi adicionada a logs ou respostas de erro.

## Evidências

O teste de integração cobre exclusão lógica, ator auditado, remoção de resultados/lista de opções, segunda exclusão como 404 e rejeição de uma base excluída ao iniciar call. A suíte backend e o E2E passaram integralmente.
