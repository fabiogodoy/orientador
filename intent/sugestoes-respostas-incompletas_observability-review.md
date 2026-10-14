# Observability Review

Data: 2026-10-14. Status: APROVADO. Risco operacional baixo.

Falhas agora distinguem output_token_limit, content_filter, incomplete_response, response_not_completed, refusal, missing_output, invalid_json e invalid_fields; transporte continua registrando classe de exceção sem texto. Truncamento informa tokens usados/teto, sem payload. CallService registra call/tenant/duração conforme fluxo existente.

Frontend mostra erro por fonte e limpa apenas após recuperação daquela fonte, ou término da call. Falha de sugestão não afirma que a transcrição está saudável. Retry de sugestão só é exibido com call ativa. Testes cobrem falha tardia e falha de finalização do histórico. Não se adiciona métrica central nem retry automático (custo previsível). Logs antigos não provam individualmente que as 24 falhas vieram do teto; diagnóstico novo permitirá distinguir ocorrências futuras.
