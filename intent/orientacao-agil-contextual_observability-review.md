# Observability Review — Orientação ágil e contextual
2026-10-15. APROVADO. Impacto operacional médio; diagnóstico suficiente com ressalva de amostra pequena de provedor.

Backend preserva durationMs, callId/tenantId autorizados e categorias seguras de falha; sem texto/chaves. Frontend mede capture, transcription, suggestion e guidance (duração desde fechamento do bloco), com resultado completed/discarded/failed. Buffer em memória limitado a 200 e User Timing com até 50 entradas por etapa; não há persistência nem envio remoto. Inspeção no navegador: performance.getEntriesByType('measure').filter(entry => entry.name.startsWith('orientador.')). As medidas incluem rede e processamento onde aplicável, não isolam tempo interno do fornecedor.

Falhas por fonte continuam visíveis e recuperáveis; erros de sugestão não encerram a call. Incomplete/recusa/JSON inválido permanecem categorias do backend. Fallback do detector após falha de resume emite aviso genérico sem conteúdo. Timeout de navegador limita retenção de requests sem resposta. Descartes de sugestões obsoletas aparecem na métrica suggestion.

Evidências em .scratch/orientacao-agil-contextual e frontend/test-results; quatro chamadas reais sintéticas na avaliação final levaram 4.366–6.173 ms, saída 98–148 tokens. Não é benchmark, comparação antes/depois ou SLA. Transcrição Groq real não foi medida nesta entrega. Sem nova operação administrativa que exija trilha de auditoria.
