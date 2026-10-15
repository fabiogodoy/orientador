# Impact Analysis — Orientação ágil e contextual

## Metadados / Resumo
2026-10-15; Codex; Intent orientacao-agil-contextual.md; PRD orientacao-agil-contextual_prd.md. Complexidade técnica média, negócio baixa e operacional média.

## Sistemas / Contratos / Dados
Frontend: captura, timers, concorrência, UI e telemetria efêmera. Backend: instruções e contrato/validação de sugestão. Landing: não. PostgreSQL: schema não; mais segmentos curtos e escritas. Integrações atuais mantidas. Campo acao aditivo, compatibilidade por tipo Ouvir. Contexto livre existente reaproveitado.

## Segurança / Multi-Tenancy
Autenticação, CSRF, consultas de CallService e escopo tenant/usuário preservados. Texto do usuário/provedor continua não confiável; contexto não concede privilégios. Sem áudio, conteúdo ou segredos em métricas. Nenhuma alteração em credenciais.

## Performance / Operação / Usuários
Menor janela de captura e debounce, mais uploads; chamadas de sugestão limitadas e sem sobreposição. Todos usuários em call beneficiados; gestores/admin sem mudança de permissões. Sem indicadores comerciais definidos. Suporte pode distinguir captura e roundtrip; desempenho real depende da rede e provedores.

## Riscos / Regressões / Mitigação
| Risco | Probabilidade / impacto | Mitigação |
|---|---|---|
| Cobrança mínima por bloco | Alta / médio | mínimo 5 s, máximo 8 s, silêncio descartado, manter modelos |
| Cortar frase ou ruído | Média / médio | pausa 750 ms e fallback; testes de pausas curtas |
| Orientação atrasada / fora de ordem | Alta / alto | geração única, invalidação por fala, ordem por sequência e resumo conservador |
| Contrato ouvir / cliente antigo | Média / médio | campo aditivo, tipo e texto compatíveis |
| Resposta incompleta | Média / médio | preservar teto 1.200 tokens e validação de incomplete |

## Rollback / Testes
Reverter commit da entrega nos dois módulos. Sem migrations. Unitários, componente com fake clock, integração Testcontainers e E2E Chromium; validação de auth/tenant já existente é regressão obrigatória.

## Sincronização / Pendências
Monorepo único, módulos frontend e backend sem repositórios próprios. Fetch origin executado; HEAD contém origin/main 01bbad7f8886fa08b3138b0ace05eed7f547db70. Alteração externa preservada e excluída: backend/src/main/java/br/com/connectas/orientador/call/GroqTranscriptionClient.java (fallback local preexistente).

## ADR / Parecer
Sem nova arquitetura, fornecedor ou estrutura: atualizar decisão parametrizada da ADR-0007, sem novo ADR. Recomendação implementar. Impactos, rollback e testes definidos.

## Fronteira de contexto
Esta conversa permanece dedicada à única Intent orientacao-agil-contextual. Não foi criado outro chat; slug/branch delimitam a entrega e o desvio operacional fica registrado na validação.
