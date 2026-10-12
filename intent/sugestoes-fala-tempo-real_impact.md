# Metadados

## Título

Análise de impacto — Sugestões de fala comerciais em tempo real

## Slug

sugestoes-fala-tempo-real

## Data

2026-10-12

## Autor

Agente

## Intent

`intent/sugestoes-fala-tempo-real.md`

## PRD

`intent/sugestoes-fala-tempo-real_prd.md`

---

# Resumo Executivo

A entrega acrescenta uma geração textual transitória ao fluxo de segmentos de transcrição já persistidos e corrige a finalização desses segmentos no navegador. Ela afeta frontend, backend, PostgreSQL por leitura e a integração OpenAI; não muda fontes de áudio, schema ou o ciclo de vida da sessão. O maior risco é não materializar um segmento final por ausência de commit do turno, enviar contexto inadequado, aceitar saída não confiável ou atrasada, ou vazar conteúdo conversacional por logs, prompts e consultas sem escopo. A implementação é recomendada com detecção local de silêncio, commit explícito, validação estrita no servidor, descarte de respostas obsoletas e instrumentação sanitizada.

# Complexidade Estimada

## Técnica

* Alta — envolve contrato novo, integração externa de geração, resposta estruturada, composição de contexto ordenado, UX assíncrona e tratamento de concorrência.

## Negócio

* Média — inaugura o primeiro apoio comercial contextual, mas não altera planos, cobrança ou permissões.

## Operacional

* Média — adiciona dependência de disponibilidade/latência da OpenAI e exige diagnóstico sem registrar conteúdo da conversa.

# Sistemas/Módulos Impactados

| Sistema/Módulo | Impacto |
| --- | --- |
| `frontend/` | Sim — substitui conteúdo demonstrativo por estado assíncrono, card real e finalização local de turnos de áudio. |
| `backend/` | Sim — expõe operação autenticada, lê contexto autorizado, chama OpenAI, valida retorno e mede execução. |
| PostgreSQL | Sim — leitura ordenada de sessões e segmentos existentes; sem migration. |
| OpenAI | Sim — nova chamada server-side de geração textual com `gpt-6-luna`. |
| `landing/` | Não. |
| Captura WebRTC/realtime de áudio | Sim — passa a enviar commit após silêncio local; não muda a origem de áudio nem persiste mídia. |

# Impacto Por Sistema/Módulo

## Frontend

### Componentes Impactados

`App.tsx` deixa de usar `suggestions` e `previousSuggestions` fixos. Após confirmar o `POST` de um segmento `CLIENT`, passa a obter orientação pelo contrato autenticado. `api.ts` ganha o tipo/cliente da orientação e a operação correspondente.

Como `gpt-live-transcribe` usa `turn_detection: null`, o frontend precisa detectar o fim de fala com a Web Audio API e emitir `input_audio_buffer.commit` no data channel aberto. O código deve liberar `AudioContext`, analisador e timer ao pausar/encerrar a fonte, evitando microfone retido ou commits após o encerramento.

### APIs/Contratos Impactados

Consome `POST /api/calls/{sessionId}/suggestions` e recebe somente dados transitórios estruturados. Os contratos atuais de transcrição não mudam.

### Risco

* Médio — respostas de uma fala anterior podem chegar depois de nova fala; o cliente precisa correlacionar o contexto e descartar resposta obsoleta. Estados de carregamento ou erro não podem bloquear a call.
* Médio — limiar de voz/silêncio inadequado pode dividir fala cedo demais ou atrasar o próximo segmento. O limiar e a janela devem ser constantes locais, cobertos por teste e ajustados somente com áudio representativo.

## Backend

### Componentes Impactados

`CallController` e `CallService` recebem a nova operação; a consulta deve combinar `call_session_id`, `tenant_id`, `user_id`, estado `ACTIVE` e segmentos ordenados. Um cliente de geração OpenAI separado do cliente de segredo Realtime deve manter o segredo no servidor, aplicar timeout e validar JSON estruturado antes da resposta.

### APIs/Contratos Impactados

Novo endpoint POST protegido pela sessão e CSRF já usados. Não aceita transcrição no corpo: usa a fonte de verdade persistida. Erro de provedor é mapeado a resposta sanitizada de indisponibilidade, sem detalhes internos.

### Risco

* Alto — uma consulta sem todos os predicados de identidade/tenant ou uma serialização insegura do prompt expõe transcrições. Uma chamada síncrona sem timeout compromete a meta de resposta e esgota threads sob volume.

## PostgreSQL

### Estruturas Impactadas

`call_sessions` e `transcript_segments` são somente lidas. O índice já existente por tenant/sessão/sequência atende à recuperação ordenada; a confirmação será feita com `EXPLAIN` se a implementação de consulta diferir desse caminho.

### APIs/Contratos Impactados

Nenhum contrato de banco muda; não há migration, tabela ou coluna para sugestões.

### Risco

* Médio — transcrições longas aumentam o payload e a duração da chamada ao modelo. Há uma janela de contexto ampla, mas o produto precisa tratar explicitamente a eventual ultrapassagem técnica, sem ocultar conteúdo de outro tenant nem produzir resposta inválida.

## OpenAI

### Componentes Impactados

Nova chamada de texto via backend para `gpt-6-luna`, com esforço `none`, formato estruturado e timeout menor que a meta de 3 s. A integração Realtime de transcrição do navegador não é alterada.

### APIs/Contratos Impactados

Usa a chave já configurada no servidor; não emite segredo efêmero porque o navegador não conversa com o modelo de geração.

### Risco

* Alto — disponibilidade, rate limit, saída inválida, latência e instruções maliciosas dentro da própria transcrição podem degradar a orientação. Mitigar com prompt que trate a transcrição como dados não confiáveis, esquema de resposta obrigatório, validação posterior e mensagem de falha recuperável.

# Impacto em Dados / Banco de Dados

## Estruturas Impactadas

Leitura dos segmentos finalizados de uma sessão de call ativa.

## Novas Estruturas

Nenhuma. A não persistência de sugestões preserva a política de dados já definida.

## Índices Necessários

Nenhum inicialmente. Validar o plano da consulta autorizada contra o índice existente antes de concluir a implementação.

## Volume de Dados

O contexto cresce ao longo da reunião. Embora o modelo escolhido suporte contexto amplo, o custo e a latência crescem com o texto de entrada. Não haverá quota comercial nesta entrega; haverá apenas tratamento técnico de limite de contexto e métricas agregadas.

## Risco

* Médio — leitura integral frequente e prompt maior podem afetar latência e custo.

# Impacto em Multi-Tenancy

* [x] identificador de tenant validado — obtido da identidade autenticada, nunca do navegador.
* [x] isolamento preservado — a sessão e os segmentos são buscados por `id`, `tenant_id` e usuário da sessão, repetindo o padrão de `CallService`.
* [x] consultas revisadas — a consulta nova exige os mesmos filtros antes de compor o contexto.
* [x] permissões revisadas — esta entrega é para o titular da call ativa; não amplia o acesso de gestor ou admin a calls ao vivo.

# Impacto em Segurança

* A transcrição é dado sensível de conversa: não pode ser enviada pelo frontend como fonte de verdade nem registrada em log, exceção, métrica ou tracing.
* O conteúdo transcrito é entrada não confiável. O prompt deve delimitá-lo como dados e impedir que instruções contidas nele mudem regras de sistema, formato ou política comercial.
* O backend mantém a chave permanente e deve reutilizar práticas de falha sanitizada do cliente Realtime, sem expor payload, status detalhado ou segredo.
* O novo POST permanece protegido por sessão, TrialAccessFilter, CSRF e CORS restrito já existentes.

# Impacto em Performance

O caminho adicional acontece após persistir a fala do cliente, em paralelo à continuidade da captura. O backend deve usar timeout, limitar saída ao necessário, evitar chamadas duplicadas para o mesmo contexto e registrar duração. A métrica de 3 s em p95 será observada em execuções reais/controladas; um teste automatizado usa cliente simulado e não promete latência do provedor.

## Risco

* Alto — geração externa e contexto crescente podem exceder 3 s.

# Impacto em Integrações

OpenAI deixa de ser usada apenas indiretamente pelo navegador para transcrição, via segredo efêmero, e passa a receber uma chamada textual autenticada pelo backend. Esta é uma integração externa nova em padrão de acesso e tratamento de dados, exigindo ADR.

# Impacto Operacional

Suporte precisará distinguir indisponibilidade de orientação de falha de transcrição: a primeira não encerra a call. Operação terá logs estruturados de IDs internos, duração, gatilho, modelo e categoria de erro; não terá replay de conteúdo. Não há impacto financeiro de cobrança do produto nesta fase, porém o custo de tokens cresce com uso e duração de reuniões.

# Impacto no Cliente / Usuário

* **Vendedor:** ganha apoio contextual, mas precisa entender que a sugestão não substitui seu julgamento.
* **Gestor:** vê maior utilidade potencial para adoção, sem novo acesso a sugestões ou transcrições.
* **Participante da reunião:** continua coberto pela transparência de que texto de fala é processado; não há gravação de áudio/vídeo nem nova retenção de sugestões.

# Impacto nos Indicadores

Indicadores ainda não estão formalizados. Impacto esperado positivo em ativação, valor percebido e retenção. O uso de métricas operacionais não deve ser apresentado como indicador de negócio até que esse plano seja definido.

# Riscos Identificados

## Risco 01 — Saída comercial inventada ou fora do formato

### Descrição

O modelo pode criar preço, prazo ou funcionalidade, extrapolar o contexto ou retornar estrutura incompleta.

### Probabilidade

* Média

### Impacto

* Alto

### Mitigação

Prompt de sistema explícito, schema estruturado obrigatório, validação server-side de campos, limite de 500 caracteres e rejeição de saída inválida. Avaliar exemplos adversariais nos testes.

## Risco 02 — Vazamento entre tenant/sessão

### Descrição

Uma consulta de contexto com filtro incompleto pode incluir segmentos de outra call ou tenant.

### Probabilidade

* Baixa

### Impacto

* Crítico

### Mitigação

Derivar identidade da sessão, filtrar por sessão, tenant e usuário no mesmo acesso, e cobrir acesso cruzado em teste de integração.

## Risco 03 — Sugestão atrasada ou obsoleta

### Descrição

Uma geração pode demorar além da conversa ou retornar depois de nova fala do cliente.

### Probabilidade

* Média

### Impacto

* Médio

### Mitigação

Timeout, correlação com o segmento que disparou a geração, descarte no frontend, estado explícito e regeneração manual.

## Risco 04 — Indisponibilidade/rate limit da OpenAI

### Descrição

A dependência externa pode recusar ou atrasar solicitações.

### Probabilidade

* Média

### Impacto

* Médio

### Mitigação

Cliente com timeout e erro sanitizado, telemetria de categoria de falha e UI que mantém a transcrição independente.

## Risco 05 — Crescimento do contexto e custo

### Descrição

Enviar a transcrição acumulada a cada fala aumenta tokens de entrada durante calls longas.

### Probabilidade

* Alta

### Impacto

* Médio

### Mitigação

Usar modelo econômico, saída curta e observabilidade de volume/duração sem conteúdo. Quotas comerciais estão explicitamente fora do escopo; se métricas demonstrarem impacto, registrar decisão futura de compactação/contexto.

# Regressões Potenciais

## RP001 — Persistência de segmentos deixa de preceder a geração

Se o frontend não aguardar o segmento salvo, a orientação pode ignorar a última fala. Cobrir com teste de ordem assíncrona.

## RP002 — Interface mantém exemplos de demonstração

Remover arrays e estados associados e validar estado vazio/sucesso/erro por teste de componente e E2E.

## RP003 — Geração bloqueia a transcrição

Separar estados da orientação dos fluxos de WebRTC e de persistência já existentes e testar falha do endpoint durante transcrição.

## RP004 — Detector de turno permanece após encerrar uma fonte

Liberar `AudioContext`, conexões do analisador e timer ao pausar, trocar ou encerrar a fonte. Cobrir a ausência de commits após a limpeza.

# Estratégia de Rollback

Desativar o acionamento e o endpoint de sugestões, devolver a interface ao estado vazio e preservar toda a captura, transcrição e banco atuais. Como sugestões não são persistidas nem há migration, não há reversão de dados.

# Estratégia de Testes

## Unitários

Cliente OpenAI, construção/validação de schema, prompt com conteúdo adversarial, contexto ordenado e regras de limite de resposta.

## Integração

Endpoint de sugestão com OpenAI simulado, autenticação/CSRF, sessão encerrada, tenant e usuário diferentes, timeout/falha e ausência de escrita de sugestão.

## E2E

Fala final do cliente, carregamento, resposta real simulada, regeneração, nova fala que invalida resposta anterior e falha sem interromper transcrição.

# Aprovação para Implementação

* [x] Todos os impactos foram identificados.
* [x] Os riscos possuem mitigação.
* [x] Existe estratégia de rollback.
* [x] Os testes estão definidos.

# Parecer Final

## Recomendação

* Implementar com ajustes.

## Justificativa

O valor de produto é claro e o sistema já possui os segmentos, sessão e isolamento necessários. A implementação só deve avançar após registrar a nova fronteira de integração em ADR e revisar a arquitetura para garantir que o acesso server-side à geração seja separado do segredo efêmero de transcrição.

## Próxima Etapa

Executar `$architecture-review` antes da implementação.
