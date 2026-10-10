# Observability Review — Autenticação e cadastro

- Data: 2026-10-10
- Impacto operacional: alto (entrada no produto).
- Parecer: **APROVADO COM RESSALVAS**.

O backend registra cadastro bem-sucedido com tipo, IDs de tenant e usuário; login aceito com IDs; credenciais inválidas sem e-mail; expiração com ID e motivo. HTTP retorna códigos estáveis como `INVALID_INPUT`, `EMAIL_IN_USE`, `INVALID_CREDENTIALS`, `TRIAL_EXPIRED` e `TOO_MANY_ATTEMPTS`, com mensagens úteis no frontend. A migration Flyway registra versão e resultado. Não há logs de senha, CSRF, cookie nem transcrição. Aceite é evidência durável na tabela própria.

Falhas previsíveis de validação não são registradas uma a uma para evitar ruído e exposição de dados. Exceções inesperadas seguem o tratamento do Spring e devem ser acompanhadas nos logs do servidor. Antes de produção comercial, adicionar monitoramento de taxa de erro/latência, alertas de login anômalo e correlação de requisições; nenhum indicador de produto foi definido nesta fase. Em múltiplas instâncias, consolidar logs e estado de sessão. A capacidade de diagnóstico local foi demonstrada por logs de migração, cadastro, login e expiração nos testes.
