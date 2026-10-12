# Security Review — Sugestões de fala comerciais em tempo real

## Parecer: APROVADO

## Risco

Alto, pois a alteração processa transcrições de reunião e introduz geração externa; nenhuma vulnerabilidade crítica ou alta foi encontrada na implementação revisada.

## Autenticação, autorização e isolamento

O endpoint exige a sessão já protegida por CSRF. `CallService` obtém identidade no servidor e verifica `id`, `tenant_id`, `user_id` e status `ACTIVE` antes de recuperar segmentos. A consulta de segmentos mantém `tenant_id`; um UUID enviado pelo navegador não basta para acessar a call de outro usuário ou tenant.

## Dados e segredos

A chave OpenAI permanece apenas no backend. O navegador recebe somente segredo efêmero da transcrição e nunca envia o contexto usado para sugestão. A integração textual usa o identificador de segurança derivado do usuário, não o UUID bruto. Logs e respostas de erro são sanitizados e não carregam texto conversacional, prompt, resposta do modelo ou credenciais.

## Entrada e provedor

A transcrição é delimitada como dado não confiável nas instruções do modelo; a resposta é limitada por JSON Schema estrito e validada por campos obrigatórios, tamanho máximo da próxima fala e quantidade de pontos. A interface trata eventos de falha de transcrição sem expor o conteúdo do provedor.

## Evidência

Os testes de serviço cobrem contexto ordenado autorizado e ausência de contexto de cliente; os testes de integração existentes usam PostgreSQL efêmero. A revisão estática confirmou filtros de tenant/usuário e ausência de chave hardcoded.
