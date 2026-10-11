# Observability Review — Transcrição operacional da call

**Status: APROVADA.**

O fluxo crítico agora deixa evidência segura de `api_key_missing`, rejeição do provedor com status HTTP, resposta sem segredo e falha de transporte com o tipo de exceção. A UI distingue permissão negada, resposta da API e falha de conexão Realtime. Sessões e segmentos continuam sendo logados por IDs técnicos, tenant, sequência e falante, sem conteúdo da fala.

Ressalva: métricas agregadas de falhas/latência ainda não existem e devem ser tratadas em uma entrega de observabilidade própria quando houver ambiente de produção monitorado.
