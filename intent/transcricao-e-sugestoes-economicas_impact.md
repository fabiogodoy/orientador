# Impact Analysis — Transcrição e sugestões econômicas

## Metadados

| Campo | Valor |
|---|---|
| Slug | `transcricao-e-sugestoes-economicas` |
| Data | 2026-10-13 |
| Autor | Codex |
| Intent | `intent/transcricao-e-sugestoes-economicas.md` |
| PRD | `intent/transcricao-e-sugestoes-economicas_prd.md` |

## Resumo executivo

A entrega substitui a transcrição baseada em WebRTC/OpenAI por upload HTTP temporário de blocos de áudio à Groq e altera a geração de sugestões para usar um resumo efêmero de contexto. É uma mudança arquitetural de alta complexidade técnica: modifica captura no navegador, contrato de API, autorização server-side, integração externa e contrato estruturado da sugestão. Não requer schema novo, desde que áudio e resumo não sejam persistidos.

## Complexidade estimada

| Dimensão | Nível | Justificativa |
|---|---|---|
| Técnica | Alta | Substitui canal WebRTC, eventos de transcrição, endpoint, cliente externo e contexto de IA em frontend/backend. |
| Negócio | Média | Mantém proposta de valor, mas texto passa a chegar por blocos e sugestões têm gatilho mais seletivo. |
| Operacional | Alta | Inclui nova credencial, novo fornecedor que processa áudio, limites, custos e política de dados a validar. |

## Sistemas e módulos impactados

| Sistema/módulo | Impacto |
|---|---|
| `frontend/` | Sim — `MediaRecorder` temporário substitui `RTCPeerConnection`, regras locais substituem pausa como gatilho e estado de resumo permanece em memória. |
| `backend/` | Sim — inicia call sem segredo Realtime, recebe multipart, autoriza e encaminha áudio, traduz exceções e muda contrato de sugestão. |
| PostgreSQL | Sim, sem schema — somente texto final continua sendo escrito em `transcript_segments`; a semântica de origem permanece. |
| OpenAI | Sim — deixa de receber áudio Realtime; mantém geração textual com saída estruturada estendida. |
| Groq | Sim — novo fornecedor de transcrição de áudio por upload HTTP. |
| `landing/` | Não — sem alteração de aquisição ou conteúdo público nesta entrega. |

## Impacto técnico por módulo

### Frontend

**Componentes impactados:** ciclo de vida de captura em `App.tsx`, tipagem de captura, chamadas do cliente HTTP e testes Vitest.

**Contratos impactados:** o frontend deixará de chamar criação de segredo e endpoint OpenAI WebRTC; passará a enviar `multipart/form-data` autenticado, por fonte e bloco. A API de sugestão aceitará e devolverá o estado interno de contexto necessário, sem renderizá-lo.

**Risco: alto.** `MediaRecorder` tem disponibilidade e formatos condicionados ao navegador. Pausar/encerrar fontes precisa finalizar, ou descartar de modo explícito, o último bloco sem vazar track, timer ou request. A ordem de retorno de blocos de duas fontes pode ser diferente da ordem de captura, exigindo sequenciamento seguro no backend ou no cliente.

### Backend

**Componentes impactados:** `CallController`, `CallService`, exceções HTTP, cliente de transcrição, cliente/contrato de sugestões, configurações e testes Spring.

**Contratos impactados:** surge endpoint multipart para bloco; a autorização atual de `call_sessions` por usuário, tenant e status `ACTIVE` deve ocorrer antes da chamada a Groq. `CallSessionResponse` não deve mais carregar segredo de transcrição. O contrato de sugestão ganha resumo interno de entrada/saída sem expô-lo em logs ou persistência.

**Risco: alto.** Upload de arquivo introduz tamanho/tipo/content-type não confiáveis e risco de consumo de memória. A implementação deve impor limites, permitir somente áudio WebM aceitável e encaminhar via memória sem arquivo temporário. Cliente Groq precisa de timeout, erro seguro, logging sanitizado e chave exclusiva do ambiente.

### PostgreSQL

**Estruturas impactadas:** `call_sessions` e `transcript_segments` apenas por uso.

**Novas estruturas:** nenhuma. Não pode existir tabela, coluna, blob ou cache persistente para áudio, resumo interno ou sugestão transitória.

**Risco: médio.** O endpoint precisa gerar `sequence_number` sem confiar na ordem ou número do navegador, evitando colisões e mantendo ordenação por tenant/call. O volume de segmentos pode aumentar por blocos de 15 segundos; é necessário respeitar as limitações e índices existentes.

### Integrações externas

**Groq:** recebe arquivo temporário e devolve texto. A documentação informa endpoint de transcrição, suporte a WebM, tamanho máximo e cobrança mínima de 10 segundos; o fornecedor informa retenção operacional de dados por até 30 dias quando Zero Data Retention não estiver habilitado. A configuração e o acordo de tratamento aplicável devem ser validados antes de ativar produção. [Groq Speech-to-Text](https://console.groq.com/docs/speech-to-text), [dados na GroqCloud](https://console.groq.com/docs/your-data).

**OpenAI:** a chave continua somente no backend para sugestões. O resumo enviado pelo navegador é conteúdo não confiável e deve receber a mesma proteção de prompt-injection hoje aplicada à transcrição. O modelo `gpt-6-luna` permanece e o limite de saída fica em 400 tokens.

## Multi-tenancy

* [x] O `tenant_id` deve ser resolvido pela identidade da sessão, nunca por campo do multipart ou frontend.
* [x] A call precisa ser `ACTIVE`, do usuário autenticado e do mesmo tenant antes de chamar qualquer fornecedor.
* [x] O texto só pode ser inserido com `tenant_id` proveniente da call validada.
* [x] Resumo em memória é restrito ao ciclo de vida e `sessionId` da call atual no navegador; não é aceito como dado persistente, nem pode ser usado para acessar outra call.
* [x] Testes devem provar que usuário/tenant externo recebe 404 e não dispara chamada ao fornecedor.

## Segurança e privacidade

* [x] Sessão, CSRF e autorização de call devem ser aplicados ao novo endpoint de upload.
* [x] `GROQ_API_KEY` deve existir somente no backend; não será commitada nem devolvida à UI.
* [x] Tipo, tamanho e presença de áudio devem ser validados antes do encaminhamento.
* [x] Áudio, transcrição, resumo, sugestão e segredo não podem aparecer em logs ou mensagens de erro.
* [x] Áudio não pode ser gravado em disco, banco, fila persistente ou objeto de storage pela aplicação.
* [x] O uso de processador externo adicional precisa ser refletido nos avisos/contratos aplicáveis antes de produção.

## Performance e capacidade

* Cada fonte gera até quatro uploads por minuto; com microfone e aba, até oito uploads por minuto por call ativa.
* Blocos curtos aumentam o número de requests; limite de tamanho, timeout e falha isolada por fonte evitam saturação e interrupção da call.
* A transcrição pode terminar fora de ordem. Cada bloco precisa de uma posição lógica independente da chegada da resposta.
* O resumo reduz o payload recorrente de sugestões. A primeira sugestão após carga/reload pode incluir mais texto porque o resumo é deliberadamente efêmero.

## Impacto operacional e no usuário

* Usuários verão texto em blocos, não deltas palavra a palavra; a interface deve comunicar processamento sem prometer instantaneidade contínua.
* Perguntas/objeções que as regras locais não capturarem exigirão o botão manual.
* Suporte deve identificar categoria de falha: captura, upload inválido, autorização, limite, Groq ou sugestão OpenAI, sem acesso ao conteúdo.
* Operação precisa provisionar chave Groq, limite de gasto e alertas antes de liberar o novo caminho.

## Impacto em indicadores

Não há indicadores formais. O impacto esperado é positivo para custo unitário e viabilidade financeira; negativo potencial para latência percebida de transcrição. Medidas técnicas de duração, falha e volume permitirão avaliar o compromisso sem registrar conteúdo.

## Riscos identificados

### Risco 01 — Falha ou limite do novo fornecedor

* **Probabilidade:** Média.
* **Impacto:** Alto.
* **Mitigação:** timeout, resposta segura, logs por categoria, limites de gasto/uso, testes de cliente e fallback operacional documentado para o fluxo anterior.

### Risco 02 — Retenção pelo fornecedor externo

* **Probabilidade:** Média.
* **Impacto:** Alto.
* **Mitigação:** validar e habilitar Zero Data Retention ou contrato equivalente antes de produção; atualizar transparência/termos aplicáveis. Se isso não for possível, bloquear ativação em produção.

### Risco 03 — Uso de memória por upload

* **Probabilidade:** Média.
* **Impacto:** Alto.
* **Mitigação:** tamanho estrito, duração fixa no navegador, suporte streaming/multipart em memória quando viável, limite de requisições concorrentes e testes de rejeição.

### Risco 04 — Segmentos fora de ordem ou duplicados

* **Probabilidade:** Média.
* **Impacto:** Médio.
* **Mitigação:** identificador de bloco e sequência gerados/controlados no backend, idempotência e testes com respostas concorrentes.

### Risco 05 — Falsos positivos/negativos do gatilho local

* **Probabilidade:** Média.
* **Impacto:** Médio.
* **Mitigação:** regras explícitas PT/EN, deduplicação por segmento e ação manual sempre disponível.

### Risco 06 — Resumo manipulado ou perdido

* **Probabilidade:** Média.
* **Impacto:** Médio.
* **Mitigação:** tratar como conteúdo não confiável, limitar tamanho, nunca persistir, limpar no encerramento/reload e manter validação estruturada de saída.

## Regressões potenciais

* Microfone e áudio de aba podem não iniciar, parar ou liberar tracks corretamente.
* Captura bilíngue PT/EN pode perder qualidade/configuração de idioma ao mudar de fornecedor.
* Sugestão pode deixar de aparecer por alteração no gatilho ou contrato.
* Endpoints legados de segredo Realtime podem ficar disponíveis indevidamente, gerando custo ou confusão.
* Isolamento de call/tenant pode ser quebrado se o upload autorizar apenas pelo `sessionId`.
* Histórico e análise executiva podem receber segmentos duplicados ou desordenados.

## Estratégia de rollback

1. Desativar o novo caminho por configuração server-side.
2. Restaurar a criação de segredo Realtime e o ciclo WebRTC previamente aprovado.
3. Remover a chave Groq apenas da configuração operacional nova, preservando todas as credenciais existentes.
4. Manter segmentos textuais gerados durante a janela, pois já obedecem ao modelo de dados atual; não há áudio para limpar.

## Estratégia de testes

* Unitários frontend para gravador, parada, detecção local e resumo efêmero.
* Unitários backend para cliente Groq, validação de arquivo, autorização e contexto estruturado.
* Integração com `MockWebServer`/equivalente para multipart, timeout, falha e garantia de nenhuma chamada externa quando não autorizado.
* Integração com PostgreSQL efêmero para tenant/call/fonte, ordem e ausência de persistência de áudio.
* E2E/manual Chromium para microfone, aba, falha isolada, botão manual e inexistência visual do resumo.

## Decisão de ADR

**ADR obrigatório.** A entrega substitui a arquitetura de transcrição, adiciona processadora externa de áudio e define uma decisão de retenção/estado de contexto que será surpreendente sem histórico. A decisão é custosa de reverter e envolve alternativas reais (Realtime OpenAI, transcrição OpenAI por arquivo, fornecedor econômico, hospedagem local).

## Parecer final

**Recomendação: implementar com ajustes.** A mudança atende a restrição financeira, mas deve bloquear publicação até a chave/limites e a política de retenção de dados da Groq estarem explicitamente validados. Em código, o endpoint deve ser estritamente autorizado e limitado, e o resumo deve continuar transitório e não confiável.
