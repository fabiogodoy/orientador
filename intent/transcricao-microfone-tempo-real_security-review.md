# Security Review — Transcrição de microfone em tempo real

## Parecer: APROVADO COM RESSALVAS

`OPENAI_API_KEY` foi gravada apenas em `backend/.env`, ignorado pelo Git e com permissão `0600`. O navegador recebe somente segredo efêmero emitido após autenticação e CSRF; o identificador de segurança é hash estável do usuário. Sessão/segmentos usam tenant derivado no backend e não aceitam tenant do cliente. Áudio e transcrição parcial não persistem nem são logados.

Ressalva operacional: rotacionar a chave caso ela tenha sido exposta fora deste fluxo e configurar segredo separado em produção; não há valor de credencial em arquivos versionados.
