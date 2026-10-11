# Security Review — Áudio da aba do cliente

## Parecer: APROVADA

Risco: alto, por mídia e integração externa. A chave permanente continua fora do navegador. O endpoint adicional exige sessão e CSRF, confirma call ativa, usuário e `tenant_id` no servidor antes de emitir segredo efêmero. `speaker` é enum fechado; tenant e usuário não vêm do cliente. Não há endpoint de áudio/vídeo, e logs excluem conteúdo, mídia e credenciais.

Não há caminho de IDOR: um ID de call de outro tenant/usuário não satisfaz a consulta de sessão ativa.
