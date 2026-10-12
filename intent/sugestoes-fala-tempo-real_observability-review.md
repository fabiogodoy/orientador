# Observability Review — Sugestões de fala comerciais em tempo real

## Parecer: APROVADO COM RESSALVAS

## Diagnóstico disponível

O backend registra início, sucesso e indisponibilidade da sugestão com `callId`, `tenantId`, duração e quantidade de segmentos, sem conteúdo da reunião. Falhas de segredo efêmero e de provedor são categorizadas sem imprimir token ou corpo HTTP. A interface informa separadamente falha de transcrição e falha de geração, preservando a outra parte do fluxo.

## Métricas e limite

A duração sanitizada da geração é registrada e permite extrair p95 no ambiente operacional. Ainda não há coleta/alerta centralizados nem amostra real de 20 gerações; portanto a meta de p95 <= 3 s não foi medida nesta entrega e deve ser aferida antes de ser divulgada como atingida.

## Recomendação

Criar painel/alerta agregado para taxa de falhas e p95 de geração quando houver infraestrutura de métricas. Não registrar transcrição, prompt, resposta ou segredo para obter esse diagnóstico.
