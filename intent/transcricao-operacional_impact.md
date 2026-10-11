# Impact Analysis — Transcrição operacional da call

## Resumo

Correção de alta prioridade do fluxo de captura já entregue, cobrindo apresentação da transcrição, diagnóstico de integração e confirmação da persistência existente.

## Sistemas impactados

| Módulo | Impacto |
|---|---|
| frontend | Remove fallback mockado e preserva mensagens de erro específicas. |
| backend | Registra falhas seguras do provedor e mantém o contrato de sessão/segmento. |
| PostgreSQL | V02/V03 são validadas e aplicadas no startup; sem novo schema. |
| landing | Não impactado. |

## Dados, segurança e multi-tenancy

As consultas existentes já inserem segmento por sessão, `tenant_id` e usuário autenticado. A mudança não pode reduzir esses filtros. Segredos efêmeros, chave permanente, SDP, áudio e texto de fala não entram em logs. A estrutura existente deve permanecer a única fonte de persistência para não criar duplicidade.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Backend antigo continuar em execução | Média | Alto | Reiniciar de forma controlada após build e confirmar PID/rotas/migrations. |
| Permissão de microfone negada | Média | Médio | Mensagem específica do navegador e teste manual. |
| Provedor rejeitar sessão | Baixa | Alto | Registrar status seguro; preservar mensagem de API e validar criação de segredo sem revelar valor. |
| Regressão no painel | Baixa | Médio | Testes de estado vazio, evento final e E2E. |

## Regressões e rollback

Risco de ocultar uma transcrição real ao remover o mock; testes devem cobrir o evento final. Rollback consiste em reverter apenas o commit da entrega; não há rollback destrutivo de banco nem remoção de migrations.

## Parecer

Implementar. Não requer ADR: não altera o desenho de captura/persistência estabelecido; corrige sua execução e visibilidade.
