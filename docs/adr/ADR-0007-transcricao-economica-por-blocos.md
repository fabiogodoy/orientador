# ADR-0007 — Transcrição econômica por blocos e contexto efêmero

## Metadados

| Campo | Valor |
|---|---|
| Data | 2026-10-13 |
| Autor | Usuário e Codex |
| Status | Aprovada |
| Intent | `intent/transcricao-e-sugestoes-economicas.md` |
| PRD | `intent/transcricao-e-sugestoes-economicas_prd.md` |
| Impact Analysis | `intent/transcricao-e-sugestoes-economicas_impact.md` |

## Resumo executivo

O Orientador trocará a transcrição WebRTC contínua com OpenAI por transcrição HTTP de blocos temporários de áudio de 15 segundos, processados pela Groq com `whisper-large-v3-turbo`. A geração textual de sugestões continuará no backend com OpenAI, mas usará resumo interno, efêmero e não persistido como contexto acumulado.

## Contexto e problema

A arquitetura anterior usa uma conexão Realtime por fonte e mantém a transcrição acumulada como entrada das sugestões. O custo de áudio e o custo/contexto das sugestões crescem com a duração e as pausas da reunião. O solicitante classificou esse custo como inviável para o projeto.

O produto precisa manter a distinção já estabelecida entre áudio não persistido e transcrição persistida, além de proteger credenciais no backend e isolar toda call por `tenant_id`.

## Objetivos e restrições

* Diminuir o custo de áudio sem depender de modelo local nesta etapa.
* Desacoplar transcrição de conexão WebRTC persistente.
* Manter áudio apenas em memória, sem gravação ou storage na aplicação.
* Produzir sugestões somente em intenção relevante ou ação manual.
* Conservar o limite atual de 400 tokens para saída de sugestão.
* Não tornar o resumo interno visível, exportável ou persistente.

## Opções consideradas

### Opção A — Manter `gpt-live-transcribe` em WebRTC

**Vantagens:** menor alteração, texto em deltas e arquitetura já entregue.

**Desvantagens:** custo de áudio relatado como inviável e conexão persistente por fonte.

### Opção B — Usar transcrição OpenAI por arquivo

**Vantagens:** preserva fornecedor e uma única credencial operacional.

**Desvantagens:** os modelos analisados não atenderam a restrição de custo e alguns possuem horizonte de descontinuação incompatível com nova implementação.

### Opção C — Groq `whisper-large-v3-turbo` por bloco HTTP

**Vantagens:** custo de US$ 0,04/h informado pelo fornecedor, endpoint de upload compatível com WebM, processamento rápido e nenhum canal de streaming persistente. [Modelo](https://console.groq.com/docs/model/whisper-large-v3-turbo) e [API](https://console.groq.com/docs/speech-to-text).

**Desvantagens:** nova processadora de áudio, nova credencial/limite operacional, necessidade de validar política de retenção e texto chega em blocos em vez de deltas.

### Opção D — Executar transcrição e sugestões em modelos locais

**Vantagens:** elimina cobrança por chamada.

**Desvantagens:** adiciona infraestrutura, dimensionamento, observabilidade, manutenção e risco operacional. O solicitante adiou essa alternativa para sugestões e não a escolheu para esta entrega.

## Decisão

Adotar a opção C.

1. Cada fonte de captura produz bloco WebM temporário de 15 segundos.
2. O navegador envia o bloco autenticado ao backend; o backend valida sessão, usuário, call ativa e `tenant_id` antes de encaminhá-lo.
3. O backend usa `GROQ_API_KEY`, exclusivamente no ambiente server-side, para chamar `whisper-large-v3-turbo` e persiste somente o texto final.
4. A aplicação não armazena áudio em banco, arquivo, fila persistente ou object storage.
5. Sugestões continuam via `gpt-6-luna` no backend, com máximo de 400 tokens. Elas são solicitadas apenas em regra local de pergunta/objeção ou clique manual.
6. O frontend mantém resumo interno em memória; cada resposta de sugestão devolve o resumo atualizado e a orientação estruturada. Ao encerrar ou recarregar a call, o resumo é descartado.

## Justificativa

A escolha atende diretamente à restrição financeira e remove o canal persistente que não é mais desejado. O modelo selecionado é explicitamente apresentado pelo fornecedor como opção de melhor custo/desempenho para transcrição multilíngue. O resumo efêmero limita o crescimento de contexto sem criar um novo dado histórico ou vazar conteúdo na interface.

## Impacto arquitetural

* `frontend/`: `MediaRecorder` substitui `RTCPeerConnection` para transcrição; captura de microfone/aba e status visual permanecem no navegador.
* `backend/`: serviço de call concentra autorização, forwarding temporário de áudio e integração externa; controller não recebe regra de negócio; o cliente de sugestão mantém contrato estruturado.
* PostgreSQL: transcrições continuam como texto tenant-scoped. Não existe migration porque não há novo dado persistido.
* Fornecedores: Groq torna-se processadora de áudio; OpenAI permanece apenas para sugestões e análise executiva existentes.

## Segurança e multi-tenancy

O áudio e todo campo enviado pelo navegador são não confiáveis. O endpoint deve aplicar sessão e CSRF; a identidade server-side deve validar call ativa que pertença ao usuário e ao tenant antes de qualquer forwarding. A fonte de captura não pode determinar tenant, usuário ou acesso. Logs não contêm áudio, texto, resumo, sugestão ou chaves.

O resumo interno enviado de volta pelo navegador é dado não confiável: será limitado, tratado como conteúdo de transcrição e nunca persistido. Não possui capacidade de alterar permissões, dados ou escopo de consulta.

## Performance e consequências

Há até quatro uploads por minuto por fonte ativa. A arquitetura precisa limitar tamanho, timeout e concorrência, lidar com retorno fora de ordem e liberar tracks/recursos ao parar. Em contrapartida, elimina a sessão Realtime por fonte e reduz drasticamente custo de áudio. O usuário vê texto em blocos, com potencial pequena latência adicional.

## Débito técnico

O resumo interno se perde após reload de página, por decisão de privacidade. Em futuro requisito de continuidade entre dispositivos ou recarga, será necessário propor armazenamento tenant-scoped, retenção e revisão de segurança em nova Intent. Hospedagem local de modelos também permanece uma alternativa futura, não um atalho desta arquitetura.

## Riscos e mitigação

* **Retenção na Groq:** ativação em produção exige validação de Zero Data Retention ou acordo equivalente e atualização dos avisos aplicáveis. Sem essa evidência, produção fica bloqueada.
* **Limites/indisponibilidade:** limite de gasto, alertas, timeout e resposta segura; rollback para fluxo Realtime anterior.
* **Falsos gatilhos:** regras locais explícitas e botão manual permanente.
* **Consumo de memória:** blocos de duração fixa, tamanho máximo e sem spool em disco.

## Plano de reversão

Reativar a implementação WebRTC/OpenAI documentada em ADR-0002 e ADR-0003, remover apenas a configuração nova da Groq do ambiente e preservar segmentos textuais já gravados. Credenciais pré-existentes não são removidas nem modificadas.

## Critérios de revisão

Revisar esta ADR quando ocorrer qualquer um: crescimento de calls simultâneas, alteração de preço/limite do fornecedor, requisito de retenção diferente, necessidade de recuperação após reload, introdução de plano comercial ou decisão de hospedagem local.

## Decisão final

**Aprovada.** A relação custo-benefício justifica a nova integração desde que a validação de tratamento de dados e configuração operacional seja concluída antes da publicação em produção.

## Ajuste de orçamento — 2026-10-14

O teto de saída passa de 400 para 1.200 tokens, com resumo interno compacto de até 1.200 caracteres e tratamento explícito de respostas incompletas, conforme `intent/sugestoes-respostas-incompletas_prd.md`, aprovado pelo usuário. Não há mudança de modelo, persistência ou integração.

## Ajuste de tempo e contexto — 2026-10-15

Conforme `intent/orientacao-agil-contextual_prd.md` e confirmação do usuário, blocos passam a ter teto de 8 s, mínimo de 5 s para antecipação em pausa de 750 ms. Debounce de sugestão 300 ms, intervalo automático mínimo 5 s, uma chamada pendente e invalidação de orientações obsoletas. A orientação deixa de presumir vendas e pode indicar ouvir. Fornecedores, modelos e teto de 1.200 tokens preservados.

A [Groq](https://console.groq.com/docs/speech-to-text) documenta cobrança mínima de 10 s/envio (consultado 2026-10-15): aceitamos overhead para ganhar tempo, limitando fragmentação. A [OpenAI](https://developers.openai.com/api/docs/guides/latency-optimization) recomenda reduzir saída e requisições; solicitamos texto conciso sem reduzir o teto e reintroduzir corte. São metas locais, não SLA ou medição real de provedores.
