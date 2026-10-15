# Observability Review — tela-custos
2026-10-15. APROVADA. Impacto médio, diagnóstico suficiente.

Tentativa possui operationId, callId, tenantId e categoria no início; conclusão registra provedor e se custo conhecido, sem valores financeiros/conteúdo/chaves. Tentativa pendente permite localizar falha entre consumo e conclusão; logs existentes de call fornecem duração/erro. Consulta registra viewer/tenant/role/período/página e global=true quando admin. PTAX registra falha sanitizada e existência de cache; retry limitado a cinco minutos. Sem catch silencioso.

Interface diferencia loading, falha com retry, custo desconhecido/estimativa parcial e cotação indisponível ou cache. Data/fonte explícitas. Ledger permite contagem de consumo não mensurado para diagnóstico; não há plataforma de métricas central nesta entrega. Cobrança real/reconciliação e alertas de orçamento fora do escopo. Testes cobrem falhas, callbacks antes de rejeição de resposta incompleta e ausência de conteúdo nos logs existentes.

## Revisão de navegação — 2026-10-15
APROVADA. Rota /app/custos identificável por URL, estados de carregamento/erro e retry preservados e revalidados. E2E cobre 503 seguido de recuperação, parcialidade e cotação indisponível. Sem novo fluxo de escrita ou integração; logs/auditoria do backend intactos. Evidências em .scratch/tela-custos-menu.
