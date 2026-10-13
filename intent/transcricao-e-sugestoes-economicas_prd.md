# PRD — Transcrição e sugestões econômicas

## Metadados

| Campo | Valor |
|---|---|
| Slug | `transcricao-e-sugestoes-economicas` |
| Data | 2026-10-13 |
| Autor | Usuário e Codex |
| Origem | `intent/transcricao-e-sugestoes-economicas.md` |
| Status | Aprovado |

## Resumo executivo

O Orientador substituirá a transcrição com sessão Realtime por transcrição HTTP de blocos temporários de áudio de 15 segundos. Sugestões continuarão na API textual atual, mas só serão acionadas por pergunta/objeção reconhecida localmente ou pelo comando explícito do usuário. O contexto será comprimido em um resumo rolante, interno e efêmero.

## Objetivos

* Reduzir o custo de áudio por reunião para o serviço de transcrição selecionado.
* Evitar inferências textuais em pausas sem intenção comercial relevante.
* Impedir que o custo do contexto textual cresça linearmente com toda a transcrição da reunião.
* Preservar transcrição por fonte, segurança server-side e isolamento por tenant.

## Escopo

### Dentro do escopo

* Capturar áudio de microfone e da aba como atualmente autorizado pelo navegador.
* Dividir cada fonte ativa em blocos fechados de 15 segundos e encaminhá-los ao backend autenticado.
* Encaminhar cada bloco somente em memória à API Groq de transcrição `whisper-large-v3-turbo` e persistir apenas o texto final resultante.
* Mostrar a transcrição final recebida por bloco na call, identificando a fonte correta.
* Remover a criação e o uso de segredos/sessões WebRTC da transcrição durante a call.
* Disparar sugestão automática somente para pergunta ou objeção identificada por regras locais e manter botão de geração manual.
* Manter, apenas durante a vida da call no navegador, um resumo rolante interno para o contexto de sugestões.
* Solicitar e receber da API textual, na mesma chamada de sugestão, a sugestão estruturada e o resumo interno atualizado.
* Limitar a saída da sugestão a 400 tokens.
* Registrar telemetria técnica sem áudio, conteúdo transcrito, resumo, sugestão ou segredos.

### Fora do escopo

* Hospedar modelo local para transcrição ou sugestões.
* Exibir, editar, exportar ou persistir o resumo técnico.
* Persistir áudio ou vídeo, inclusive como arquivo temporário de aplicação.
* Alterar o resumo executivo imutável de reunião já entregue.
* Alterar a política de planos, cobrança ou quotas comerciais do produto.
* Usar IA remota somente para classificar pergunta/objeção.

## Perfis impactados

* Usuário individual e de organização: recebem a transcrição por blocos e sugestões menos intrusivas.
* Gestor: preserva acesso apenas às transcrições já autorizadas do próprio tenant.
* Suporte/administração: recebe logs de diagnóstico sem conteúdo e acompanha falhas por categoria.

## Módulos impactados

| Módulo | Responsabilidade impactada |
|---|---|
| `frontend/` | Captura, segmentação temporária, envio de blocos, contexto efêmero, gatilhos e UI de sugestão. |
| `backend/` | Autenticação/CSRF, autorização da call, encaminhamento de áudio em memória, integração Groq e geração de sugestão. |
| PostgreSQL | Apenas persistência já existente de segmentos textuais; não há nova tabela ou coluna. |
| Groq | Transcrição HTTP de blocos de áudio. |
| OpenAI | Geração textual estruturada de sugestão e resumo interno atualizado. |

## Requisitos funcionais

### RF001 — Transcrição por blocos temporários

Cada fonte de áudio ativa deve gerar um bloco fechado a cada 15 segundos e enviá-lo para um endpoint autenticado da call.

**Aceite:**

* [ ] Microfone e áudio de aba ativos produzem blocos independentes a cada 15 segundos.
* [ ] Pausar ou encerrar uma fonte interrompe a geração e o envio de novos blocos dessa fonte.
* [ ] O áudio de um bloco não é gravado pelo navegador ou backend além do tempo necessário para a requisição.

### RF002 — Transcrição server-side com Groq

O backend deve validar sessão, usuário, tenant e acesso à call antes de encaminhar um bloco recebido ao endpoint de transcrição Groq usando `whisper-large-v3-turbo`. A credencial do fornecedor não pode ser exposta ao navegador.

**Aceite:**

* [ ] Requisição não autenticada, sem CSRF ou para call inacessível é recusada sem chamar o fornecedor.
* [ ] Somente texto final validado é persistido como segmento da fonte correspondente e do tenant da call.
* [ ] Falha do fornecedor informa erro seguro no frontend, mantém a call utilizável e não cria segmento parcial.

### RF003 — Exibição de texto final por fonte

Depois da resposta de transcrição, a interface deve exibir o texto final no painel e preservá-lo na transcrição da call com o locutor já associado à fonte.

**Aceite:**

* [ ] Texto de microfone é exibido como usuário e texto de aba como cliente.
* [ ] A ordem de exibição segue a conclusão recebida sem substituir segmentos já finalizados.
* [ ] Não há mais dependência de eventos de delta/conclusão do canal WebRTC.

### RF004 — Detecção local de intenção para sugestão

O frontend deve acionar geração automática apenas quando o texto final de cliente corresponder a regras locais de pergunta ou objeção. Deve existir uma ação manual de gerar sugestão na interface da call.

**Aceite:**

* [ ] Uma fala comum, sem regra correspondente, não faz requisição de sugestão.
* [ ] Uma pergunta ou objeção reconhecida inicia uma única solicitação automática após a transcrição ser persistida.
* [ ] O usuário pode solicitar uma sugestão manualmente mesmo quando não houver reconhecimento.
* [ ] A detecção não chama serviço de IA, não registra conteúdo e não bloqueia a transcrição.

### RF005 — Resumo rolante interno e efêmero

A chamada de sugestão deve receber o resumo interno existente e os trechos de transcrição ainda não consolidados. Ela deve retornar a sugestão estruturada e o resumo atualizado em contrato estruturado. Esse resumo vive somente na memória do navegador durante a call.

**Aceite:**

* [ ] A primeira solicitação de sugestão inclui o contexto disponível e cria o resumo interno.
* [ ] Solicitações posteriores não reenviam segmentos já consolidados no resumo.
* [ ] O resumo é apagado ao encerrar ou recarregar a call.
* [ ] O resumo não é exibido, exportado, persistido em banco, incluído no resumo executivo ou registrado em logs.

### RF006 — Sugestão estruturada com limite atual

Cada solicitação de sugestão deve continuar retornando o contrato estruturado já exibido pela call e aceitar no máximo 400 tokens de saída.

**Aceite:**

* [ ] Campos obrigatórios da sugestão continuam validados antes da apresentação.
* [ ] O limite de saída é 400 tokens.
* [ ] Resposta inválida ou indisponível não encerra a call nem expõe dados técnicos ao usuário.

## Requisitos não funcionais

### RNF001 — Performance

O frontend deve criar um bloco por fonte a cada 15 segundos sem acumular áudio. O backend deve impor tamanho máximo compatível com o fornecedor e tempo limite explícito para a chamada externa.

### RNF002 — Segurança e privacidade

Áudio é dado sensível: só pode trafegar por HTTPS entre navegador, backend e fornecedor, em memória. A chave `GROQ_API_KEY` fica exclusivamente no ambiente do backend. Nenhum log pode conter áudio, transcrição, resumo, sugestão ou credencial.

### RNF003 — Multi-tenancy

O backend deve resolver o usuário autenticado, validar que a call pertence ao seu `tenant_id` e usar a fonte aceita apenas para associar texto à call autorizada. Nenhuma chamada externa é permitida antes dessa verificação.

### RNF004 — Compatibilidade

O fluxo continua destinado a Chrome e Edge desktop. A captura de áudio de aba continua sujeita à disponibilidade de `getDisplayMedia`; microfone continua sujeito a `getUserMedia`.

### RNF005 — Observabilidade

Cada tentativa de transcrição e sugestão deve registrar identificador técnico de call, tenant anonimizado ou interno permitido, fonte, gatilho, fornecedor/modelo, duração e categoria de resultado. Conteúdo e segredos são proibidos nos logs.

## Regras de negócio

* RN001 — Cada fonte é segmentada independentemente em blocos de 15 segundos.
* RN002 — Apenas áudio finalizado é enviado; a aplicação não mantém uma conexão persistente de transcrição.
* RN003 — A transcrição é `whisper-large-v3-turbo` na Groq, por chamada HTTP de bloco.
* RN004 — Pergunta/objeção é identificada por regras locais; o botão manual sempre está disponível durante uma call ativa.
* RN005 — O resumo rolante é um artefato técnico transitório de memória e nunca é visível ou persistido.
* RN006 — O contexto de sugestão inclui o resumo de todo o conteúdo consolidado e somente os segmentos posteriores a ele.
* RN007 — O máximo de saída da sugestão permanece 400 tokens.
* RN008 — Falha de um bloco de uma fonte não encerra a outra fonte nem a call.

## Fluxo principal

1. Usuário inicia ou retoma uma call e autoriza uma ou duas fontes de áudio.
2. Para cada fonte, o navegador cria um bloco WebM de 15 segundos em memória.
3. O navegador envia o bloco ao backend com sessão e CSRF válidos.
4. O backend autoriza call/tenant/fonte e encaminha o bloco em memória à Groq.
5. O backend persiste somente o texto final e o frontend o apresenta.
6. Para texto do cliente, o navegador avalia regras locais de pergunta/objeção.
7. Havendo gatilho automático ou ação manual, o navegador chama a sugestão com resumo interno e segmentos não consolidados.
8. A resposta atualiza a sugestão exibida e substitui o resumo interno em memória.

## Fluxos alternativos e erros

* **FA001 — Fonte sem áudio:** a captura informa a orientação atual e nenhum bloco é enviado.
* **FA002 — Recarga da página:** o resumo interno é descartado; a transcrição já persistida permanece disponível pela API existente.
* **ER001 — Groq indisponível/timeout:** a fonte exibe falha segura, o bloco não é persistido e a call continua.
* **ER002 — Limite/tamanho inválido:** backend recusa o bloco sem encaminhar e o frontend informa erro seguro.
* **ER003 — Falha em sugestão:** nenhuma sugestão nova é mostrada; a transcrição e captura continuam.
* **ER004 — Detecção não reconhece uma intenção:** usuário usa o botão manual.

## UX e acessibilidade

O status de escuta continua explícito. A transcrição passa a informar processamento de bloco quando aguardando resposta, sem sugerir que há texto contínuo. O botão de geração manual deve ter rótulo acessível e estado desabilitado somente se a call não estiver ativa ou uma geração estiver em andamento. O resumo interno não recebe elemento visual, texto, atributo de acessibilidade ou API de leitura.

## Integrações e dados

* Nova integração externa: Groq Speech-to-Text em endpoint HTTP compatível com o formato de upload.
* A API frontend/backend ganha contrato multipart autenticado para bloco temporário de áudio e resposta de segmento textual.
* Não há mudança de schema ou migration. Tabelas atuais continuam contendo apenas texto e metadados de segmentos.
* A chave da Groq é configuração operacional nova de backend, fornecida fora do Git; valores existentes não são modificados.

## Plano de testes

* **Unitários frontend:** duração/configuração do gravador, limpeza ao parar, regras de pergunta/objeção, envio manual e ciclo do resumo em memória.
* **Unitários backend:** autorização tenant/call/fonte, validação de tamanho/tipo e cliente Groq com contrato multipart.
* **Integração backend:** endpoint autenticado persiste apenas texto; falha externa não persiste; isolamento entre tenants.
* **E2E/manual:** microfone e áudio de aba em Chrome/Edge, exibição por bloco, botão manual, ausência do resumo técnico na interface e continuidade após falha de uma fonte.

## Estratégia de migração e rollback

Não há migration. O rollback restaura a configuração e os componentes da transcrição Realtime/OpenAI previstos no ADR, remove a credencial nova do ambiente operacional e preserva os segmentos textuais já existentes.

## Riscos e dependências

* Requer conta, chave e limites adequados na Groq; sem isso a transcrição não pode ser ativada.
* A Groq é nova processadora de áudio e exige atualização de transparência/contratos aplicáveis antes de produção.
* A transcrição é granular por bloco, não contínua, e pode ter menor percepção de instantaneidade.
* Regras locais podem ter falsos positivos/negativos; botão manual é mitigação.

## Aprovação

* [x] Escopo, critérios e requisitos são claros e testáveis.
* [x] Multi-tenancy, privacidade e segurança foram considerados.
* [x] Pronto para análise de impacto e arquitetura.
