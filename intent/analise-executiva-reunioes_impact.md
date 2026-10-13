# Impact Analysis — Análise executiva de reuniões encerradas

**Status:** Concluída

**Data:** 2026-10-13

**Intent:** `intent/analise-executiva-reunioes.md`  
**PRD:** `intent/analise-executiva-reunioes_prd.md`

## Resumo e complexidade

Complexidade técnica **alta**: adiciona estado persistente, geração assíncrona sob demanda, validação de saída de IA, novos contratos de API e uma tela reativa. Complexidade de negócio **média**: o conteúdo sintetiza conversas de clientes e deve ter limites semânticos claros. Complexidade operacional **média**: há nova dependência de disponibilidade/latência da integração já existente e necessidade de diagnóstico sem vazar dados.

## Sistemas e módulos impactados

| Sistema/módulo | Impacto |
| --- | --- |
| `frontend/` | Sim — contrato de detalhe, início/retry, estados e apresentação acessível. |
| `backend/` | Sim — domínio, autorização, geração, validação, persistência, API e logs. |
| PostgreSQL | Sim — migration Flyway, uma nova estrutura isolada por tenant e índice/uniqueness para sessão. |
| OpenAI | Sim — novo caso de uso textual com contrato estruturado, sem nova credencial. |
| `landing/` | Não — não acessa dados autenticados de reuniões. |
| captura/transcrição em tempo real | Não diretamente — reuniões ativas e fluxos de áudio permanecem inalterados. |

## Dados, banco e performance

Uma análise por sessão encerrada terá vínculo explícito a `call_sessions` e `tenant_id`, estado, conteúdo estruturado, datas e dado técnico de falha seguro. A unicidade por sessão evita duas análises concluídas e também controla gerações concorrentes. Os segmentos existentes permanecem imutáveis; a geração lê somente os da sessão autorizada.

O volume de saída é pequeno por reunião, mas uma transcrição pode ser longa. O backend deve impor o limite de conteúdo aceito pelo modelo de forma explícita, sem truncar silenciosamente informações críticas; caso o limite demande uma estratégia adicional, ela deve ser testada e registrada. A leitura do detalhe ganha uma associação/indexação por sessão e tenant. O risco de desempenho é **médio**, mitigado por uma geração única, reutilização do resultado, idempotência e não bloquear a transcrição.

## Multi-tenancy e segurança

* [x] `tenant_id` será armazenado e validado em toda leitura/escrita da análise.
* [x] O escopo continua derivado da identidade da sessão, nunca de parâmetro do frontend.
* [x] As regras atuais por papel serão reaplicadas igualmente a detalhe, geração e retry.
* [x] Recurso não autorizado ou inexistente não revela sequer a existência/estado da análise.
* [x] A OpenAI recebe somente segmentos da sessão já autorizada; a chave permanente fica no backend.
* [x] Logs e auditoria usam identificadores técnicos e não registram transcrição, resumo, participantes, justificativa ou falha que contenha conteúdo.

O risco de segurança é **alto em impacto** pelo caráter sensível das conversas, embora controlável com a política de acesso existente, testes negativos de tenant/perfil e revisão específica.

## Compatibilidade e integração

O contrato de detalhe será ampliado de forma aditiva. O frontend implantado junto à API consome os novos campos; clientes anteriores podem ignorá-los. A operação de geração será nova, autenticada e idempotente. A integração OpenAI existente para sugestões em reunião ativa não pode ser reutilizada sem um contrato distinto: ela rejeita sessões encerradas e sua saída é de orientação transitória, não análise persistente.

## Usuários e operação

Usuários individuais, membros e gestores obtêm contexto mais rápido no histórico permitido. Admin da plataforma conserva acesso global auditável. As reuniões existentes — inclusive as do Fábio — são preenchidas somente quando abertas, evitando processamento surpresa em lote. O suporte precisa reconhecer estados de geração/falha; a mensagem não deve expor detalhes internos do provedor.

Não há indicadores definidos; o efeito esperado é positivo em valor percebido, ativação e retenção. Não há impacto financeiro direto nesta entrega.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre tenants ou perfis | Baixa | Alto | Predicado de autorização centralizado, `tenant_id` obrigatório, testes de negação e security review. |
| Duas análises/generaçōes para a mesma sessão | Média | Médio | Unicidade no banco, transições de estado e operação idempotente testada sob concorrência. |
| IA inventar resumo, nome ou temperatura | Média | Médio | Prompt estruturado e restritivo, validação de contrato, indicação “Gerado por IA”, não inferir papéis técnicos. |
| Indisponibilidade ou saída inválida do provedor | Média | Médio | Estado falho controlado, logs seguros e retry explícito; transcrição continua acessível. |
| Latência/tamanho de transcrição elevar custo ou tempo | Média | Médio | Geração única, observabilidade de duração/erros, limite explícito e testes de transcrição extensa. |
| Regressão da call ativa/sugestões | Baixa | Médio | Isolar caso de uso de análise de sessão encerrada e manter contratos ativos cobertos por regressão. |

## Regressões potenciais

* O novo GET de detalhe pode degradar a abertura se carregar análise de forma ineficiente.
* Contratos alterados podem quebrar a tela se frontend e backend divergirem na transição de estado.
* Uma migração/índice incorreto pode afetar leitura do histórico.
* Reuso indevido do cliente de sugestões pode permitir análise sobre sessão ativa ou formato inadequado.

## Rollback

Em falha crítica, remover a seção e a operação de geração em versão posterior, preservando transcrições e reuniões. A nova tabela não é dependência de dados existentes; sua migration pode ser revertida de modo controlado após cessar o uso do código. Nenhuma migração deve remover ou reescrever segmentos históricos. Análises já criadas podem permanecer sem exposição até remoção planejada conforme política de retenção futura.

## Estratégia de testes

Testes unitários cobrem prompt/contrato, normalização de participantes, temperatura, limites e transições de estado. Integração com PostgreSQL efêmero valida migration, unicidade, retry, escopo de tenant e papéis. Frontend cobre todos os estados e acessibilidade; E2E cobre o fluxo completo e a não exposição a quem não tem permissão. Builds e testes seguem os comandos definidos em `.ai/context/testing-standards.md`.

## Decisão de ADR

**ADR obrigatório.** A entrega introduz uma estrutura durável relevante e uma política nova de consistência para geração sob demanda e imutável, associada a dados sensíveis multi-tenant. A decisão é difícil de reverter sem reprocessar/descartar dados e precisa permanecer compreensível para futuros mantenedores.

## Parecer final

**Recomendação: implementar com ajustes documentados em ADR.** A entrega gera valor direto e cabe em uma única integração vertical, desde que o contrato estruturado, isolamento, idempotência, limites de conteúdo e falhas recuperáveis sejam validados antes da exposição.
