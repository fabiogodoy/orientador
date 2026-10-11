# Observability Review — Áudio da aba do cliente

## Parecer: APROVADA COM RESSALVAS

Persistência registra `callId`, `tenantId`, sequência e falante, sem texto. A UI informa indisponibilidade do navegador, ausência de áudio e interrupção externa. Isso permite distinguir falha de permissão, seleção sem som e término de compartilhamento sem gravar conteúdo sensível.

Ressalva: métricas agregadas de início/fim/falha por fonte e latência de conexão devem ser adicionadas antes de uma operação com volume relevante.
