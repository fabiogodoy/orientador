# Observability Review — Suporte bilíngue na call

## Parecer: APROVADO

O fluxo mantém a telemetria sanitizada existente: criação/indisponibilidade do segredo Realtime e geração/indisponibilidade da sugestão registram categoria, status ou duração e IDs internos quando aplicável. A alteração não cria nova chamada, exceção ou estado operacional; falhas de configuração continuam classificadas como rejeição do provedor, sem registrar corpo da transcrição, prompt ou segredo.

Capacidade de diagnóstico: adequada. Para investigar qualidade por idioma, suporte pode correlacionar falhas de provedor sem coletar conteúdo de reunião; métricas de acurácia por idioma permanecem fora deste escopo para evitar reter ou logar texto sensível.
