# Impact Analysis — Transcrição de microfone em tempo real

## Resumo

Complexidade técnica alta, operacional média e negócio alta. Impacta frontend, backend, PostgreSQL e a API OpenAI Realtime.

## Impactos

| Área | Impacto |
|---|---|
| Frontend | Permissão de microfone, WebRTC, estados de erro e envio de segmentos finais. |
| Backend | Sessões autenticadas, segredo efêmero, cliente HTTP OpenAI, autorização e logs seguros. |
| PostgreSQL | Tabelas de sessão e segmento, índices por `tenant_id`/sessão e migration Flyway. |
| OpenAI | Uso de `gpt-live-transcribe`; disponibilidade, custo e expiração de segredo. |

## Segurança e multi-tenancy

Todos os IDs externos são validados com a identidade de sessão e `tenant_id` obtidos no servidor. O backend não aceita tenant enviado pelo cliente. O segredo efêmero tem TTL curto, sessão configurada e não é persistido. Áudio, texto parcial, chave e conteúdo da transcrição não entram em logs.

## Riscos e mitigação

| Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|
| Permissão negada/sem HTTPS | Média | Médio | Diagnóstico UI e fallback seguro. |
| Segredo expira | Média | Médio | Emitir por sessão e permitir reconexão controlada. |
| Custo/indisponibilidade do provedor | Média | Alto | Logs de início/fim/falha, feedback e encerramento local. |
| Vazamento entre tenants | Baixa | Crítico | Filtros `tenant_id` em toda consulta/escrita e testes de isolamento. |
| Áudio salvo indevidamente | Baixa | Crítico | Sem endpoint de upload/persistência de áudio; revisão de logs. |

## Rollback e ADR

Reverter migration e código remove a capacidade nova; segmentos existentes permanecem como dados históricos e devem ter procedimento de exclusão futura. ADR obrigatório: integração externa, credencial efêmera e novo modelo de dados.
