# Metadados

## Título

Sugestões de fala comerciais em tempo real

## Slug

sugestoes-fala-tempo-real

## Data

2026-10-12

## Autor

Usuário e Agente

## Origem

Intent relacionada: `intent/sugestoes-fala-tempo-real.md`

## Status

Aprovado

---

# Resumo Executivo

Esta entrega converte a transcrição em tempo real de uma conversa comercial em uma orientação transitória para a próxima fala do vendedor. Após cada fala final do cliente, a aplicação solicitará ao backend uma sugestão estruturada produzida pela OpenAI a partir de toda a transcrição final disponível daquela reunião.

# Problema

O produto já apresenta texto transcrito, mas a área de orientação usa exemplos fixos que não respondem ao contexto da call. O vendedor ainda precisa interpretar uma objeção ou sinal do cliente e escrever sua próxima fala sem apoio contextual em tempo real.

# Objetivos

## Objetivo Principal

Exibir ao vendedor uma sugestão comercial curta, em português e baseada na conversa atual, para responder à última fala do cliente.

## Objetivos Secundários

* Permitir pedir outra formulação para a mesma conversa.
* Remover integralmente o conteúdo demonstrativo fixo da orientação.
* Manter sugestões apenas na memória da call, sem persistência.

## Objetivos Não Funcionais

* Exibir uma sugestão em até 3 segundos em pelo menos 95% das gerações bem-sucedidas, medido entre a chegada do segmento final do cliente ao frontend e o preenchimento do card.
* Usar um modelo textual econômico, focado e disponível na OpenAI para esse tipo de carga: `gpt-6-luna`, com raciocínio desativado (`none`). A documentação oficial o posiciona para cargas focadas de alto volume e informa janela de contexto de 1,05M tokens. [OpenAI Docs — Models](https://developers.openai.com/api/docs/models)

# Escopo

## Dentro do Escopo

* Geração automática após cada segmento finalizado do cliente em uma reunião ativa.
* Finalização confiável de turnos de áudio com detecção local de silêncio e commit no canal Realtime, para que segmentos finais e sugestões possam existir.
* Geração manual de nova formulação pelo vendedor.
* Uso da transcrição final acumulada de ambos os participantes na mesma sessão de call.
* Card de orientação preenchido dinamicamente com tipo, trecho do cliente, próxima fala e pontos-chave.
* Estados de carregamento, ausência inicial, falha e substituição segura de respostas obsoletas.
* Autenticação, autorização e isolamento por `tenant_id` no backend.
* Telemetria operacional de duração, sucesso e falha da geração, sem texto de transcrição nos logs.

## Fora do Escopo

* Gravar áudio ou vídeo.
* Persistir, consultar posteriormente ou exportar sugestões.
* Conhecimento externo, catálogo de preços, prazos ou funcionalidades não presentes na transcrição.
* Limite comercial de uso por sessão, usuário ou tenant.
* Histórico de sugestões na interface nesta primeira versão.
* Alterar a origem de áudio, gravar áudio/vídeo ou trocar o modelo de transcrição.

# Personas/Perfis Impactados

* **Usuário individual e usuário de organização:** usam a orientação durante uma conversa comercial.
* **Gestor de organização:** é impactado pela adoção e pelo valor percebido para sua equipe.
* **Admin da plataforma:** não ganha nova permissão; o comportamento deve respeitar os acessos administrativos existentes e auditáveis.

# Sistemas/Módulos Impactados

* `frontend/`: acionamento e apresentação da orientação durante a call.
* `backend/`: endpoint autenticado, leitura dos segmentos autorizados, integração OpenAI, validação da resposta e logs operacionais.
* PostgreSQL: leitura dos segmentos existentes de `transcript_segments`; não haverá tabela ou migration para sugestões.
* OpenAI: geração textual no backend com a credencial permanente já protegida no servidor.

# Requisitos Funcionais

## RF001 — Gerar após fala final do cliente

### Descrição

Quando um segmento final do cliente for salvo com sucesso em uma sessão de call ativa, a interface deve solicitar uma sugestão para essa sessão.

### Critério de Aceite

* [ ] Um segmento `CLIENT` finalizado dispara uma solicitação automática após sua persistência bem-sucedida.
* [ ] Um segmento `USER` finalizado não dispara sugestão automática.
* [ ] Captura, transcrição e salvamento do segmento continuam operando se a geração falhar.

## RF002 — Usar somente o contexto da reunião

### Descrição

A geração deve receber a transcrição final acumulada de vendedor e cliente pertencente à mesma sessão de call autorizada, ordenada pela sequência registrada, e a última fala do cliente como referência explícita.

### Critério de Aceite

* [ ] O contexto não contém áudio, vídeo nem dados de outra sessão ou tenant.
* [ ] A última fala de cliente usada é a que motivou a solicitação.
* [ ] Toda a transcrição final disponível da sessão é incluída enquanto couber no contexto do modelo.

## RF003 — Produzir orientação estruturada e segura

### Descrição

A OpenAI deve retornar uma orientação estruturada com: tipo da situação, trecho relevante da fala do cliente, próxima fala do vendedor e pontos-chave. A próxima fala deve ser em português e ter no máximo 500 caracteres.

### Critério de Aceite

* [ ] O retorno contém campos não vazios para `tipo`, `trechoCliente`, `proximaFala` e `pontosChave`.
* [ ] `proximaFala` está em português e possui no máximo 500 caracteres.
* [ ] A orientação responde à última fala do cliente e não inventa preço, prazo ou funcionalidade.
* [ ] Uma resposta que não respeite o formato ou as restrições é recusada pelo backend e não chega ao card como válida.

## RF004 — Preencher a interface com conteúdo real

### Descrição

O card “Próxima melhor resposta” deve refletir a orientação mais recente recebida. A porcentagem fixa de aderência será removida e substituída pelo texto “Baseada na última fala”.

### Critério de Aceite

* [ ] Antes de haver uma fala do cliente, o card informa que aguarda contexto, sem exemplo fixo.
* [ ] Durante uma solicitação, o card indica geração em andamento sem bloquear os controles de call.
* [ ] Após sucesso, tipo, trecho do cliente, próxima fala e pontos-chave são os retornados pela geração.
* [ ] Não há exemplos estáticos nem seção de sugestões anteriores demonstrativas.

## RF005 — Regenerar manualmente

### Descrição

O vendedor pode usar “Gerar outra” para solicitar uma nova formulação com o contexto atual da mesma call.

### Critério de Aceite

* [ ] O comando só fica disponível quando a call possui ao menos uma fala final do cliente.
* [ ] A geração manual não altera transcrições nem interrompe captura.
* [ ] Uma nova fala final do cliente torna obsoleta qualquer resposta ainda em andamento para contexto anterior.

## RF006 — Proteger acesso e dados

### Descrição

O backend aceita a geração somente de usuário autenticado que tenha acesso à sessão de call e lê segmentos com escopo de tenant validado no servidor.

### Critério de Aceite

* [ ] Um usuário sem sessão autenticada não gera sugestão.
* [ ] Um usuário de outro tenant não consegue usar, inferir ou receber transcrições ou sugestões da sessão.
* [ ] A chave permanente da OpenAI não é devolvida ao navegador.
* [ ] Sugestões não são gravadas no banco, em arquivos ou em logs de aplicação.

## RF007 — Finalizar turnos de transcrição

### Descrição

Com `gpt-live-transcribe`, a interface deve detectar o fim local de uma fala e enviar `input_audio_buffer.commit` pelo canal WebRTC. Eventos de falha de transcrição devem ficar visíveis ao usuário em mensagem segura.

### Critério de Aceite

* [ ] Após uma fala seguida de silêncio, a fonte envia um único commit para o turno no canal aberto.
* [ ] O segmento final retornado pela OpenAI continua sendo a única fonte para persistência e para o gatilho de sugestão.
* [ ] Uma falha de transcrição é informada sem expor detalhes do provedor e sem encerrar automaticamente a outra fonte de áudio.

# Requisitos Não Funcionais

## RNF001 — Performance

Em condições normais de conectividade e resposta bem-sucedida do provedor, 95% das gerações devem concluir em até 3 segundos. O frontend mantém no máximo uma geração atual por contexto; respostas tardias de contexto obsoleto são descartadas.

## RNF002 — Segurança

Toda solicitação exige a sessão autenticada e proteção CSRF já aplicada às escritas. O backend é a única parte que chama a OpenAI com a chave permanente. Logs não incluem transcrição, prompt completo, resposta ou segredo.

## RNF003 — Multi-Tenancy

O `tenant_id` da sessão autenticada deve limitar a busca da sessão e dos segmentos usados como contexto. O identificador enviado pelo navegador não concede acesso por si só.

## RNF004 — Compatibilidade

A mudança preserva o suporte atual a Chrome e Edge desktop, não altera as APIs de captura e mantém a interface utilizável enquanto uma sugestão é carregada.

## RNF005 — Observabilidade

Cada tentativa gera log estruturado com identificador técnico da sessão, tenant anonimizado ou identificador interno permitido, gatilho automático/manual, modelo, resultado, duração e categoria de falha. Não registrar conteúdo conversacional nem segredos.

# Regras de Negócio

## RN001 — Contexto comercial

O primeiro caso de uso é conversa comercial; a orientação apoia o julgamento do vendedor e não é uma instrução obrigatória.

## RN002 — Gatilho

Somente uma fala final do cliente gera automaticamente uma nova orientação.

## RN003 — Escopo de conteúdo

A sugestão usa exclusivamente a transcrição final da própria sessão de call. Não consulta fontes externas nem introduz preço, prazo ou funcionalidade ausentes dela.

## RN004 — Idioma e tamanho

A próxima fala é escrita em português e limitada a 500 caracteres.

## RN005 — Transitoriedade

Sugestões existem somente durante a call na memória do cliente e na resposta da requisição; não são persistidas.

## RN006 — Prompt base

O backend instrui o modelo a receber a transcrição da call e devolver a sugestão preenchendo os campos exibidos no app; a sugestão é a próxima fala do vendedor, em português, curta, responde à última fala do cliente e não inventa preço, prazo ou funcionalidade. O contrato estruturado é obrigatório.

# Fluxo Principal

1. A call está ativa; a detecção local observa uma fala do cliente seguida de silêncio e envia o commit do turno.
2. A transcrição recebe a fala final do cliente.
3. O frontend salva o segmento final no backend.
4. Após o salvamento, o frontend solicita a orientação para a sessão.
5. O backend autentica, valida a posse da sessão e aplica o escopo de tenant.
6. O backend lê a transcrição final ordenada da sessão e solicita à OpenAI uma resposta estruturada.
7. O backend valida a estrutura e as regras da resposta antes de devolvê-la.
8. O frontend preenche o card com a orientação mais recente e permite regenerá-la.

# Fluxos Alternativos

## FA001 — Regeneração manual

O vendedor escolhe “Gerar outra”; o fluxo inicia no passo 3 usando a transcrição atual da mesma sessão.

## FA002 — Nova fala durante geração

Se o cliente conclui nova fala enquanto há uma geração pendente, a interface prioriza o novo contexto e ignora a resposta anterior caso ela chegue depois.

# Casos de Erro

## ER001 — Falha, indisponibilidade ou tempo excedido do provedor

O card apresenta mensagem breve de indisponibilidade e opção de tentar novamente. A captura e a transcrição continuam e nenhum conteúdo demonstrativo é mostrado.

## ER002 — Resposta inválida do modelo

O backend rejeita resposta fora do contrato e trata como falha de geração; não expõe saída parcial ou não estruturada ao usuário.

## ER003 — Sessão inacessível

O backend retorna erro autorizado apropriado sem revelar se outra sessão existe.

# UX / Interface

## Objetivo

Tornar a orientação imediatamente legível e claramente vinculada à última fala, sem competir com a transcrição em andamento.

## Alterações de Tela

* Remover a sugestão principal e as sugestões anteriores estáticas.
* Mostrar estado vazio antes de haver fala do cliente.
* Mostrar tipo da situação, trecho de referência, “Baseada na última fala”, próxima fala, pontos-chave e ações de copiar/regenerar após sucesso.
* Desabilitar a regeneração enquanto não houver contexto de cliente ou enquanto uma geração para o contexto atual estiver pendente.

## Mensagens

* Vazio: “Aguardando a primeira fala do cliente para orientar sua próxima resposta.”
* Carregando: “Preparando uma sugestão para a última fala do cliente…”
* Erro: “Não foi possível gerar a sugestão agora. A transcrição continua normalmente.”

## Responsividade / Acessibilidade

Estados de carregamento e erro devem ser anunciados por região de status apropriada. Botões continuam identificáveis e operáveis por teclado.

# Integrações

## Sistemas Envolvidos

OpenAI, chamada exclusivamente pelo backend com credencial de servidor.

## APIs Impactadas

Nova operação autenticada de geração associada a uma sessão de call, por exemplo `POST /api/calls/{id}/suggestions`. O contrato exato terá requisição sem transcrição enviada pelo navegador e resposta estruturada transitória.

## Contratos Impactados

O contrato da geração devolve `tipo`, `trechoCliente`, `proximaFala` e `pontosChave`. Os contratos existentes de criar sessão, obter segredo de transcrição e salvar segmento não mudam.

# Dados / Banco de Dados

## Estruturas Impactadas

Leitura de `transcript_segments` existente, ordenada por sessão e sequência, sempre com escopo de tenant.

## Novas Estruturas

Nenhuma.

## Migração

Não necessária, pois a entrega não altera o schema nem persiste sugestões.

# Impacto Técnico

Frontend sincroniza o gatilho da orientação com a confirmação de salvamento de segmentos `CLIENT` e finaliza cada turno de áudio no canal Realtime com detecção local de silêncio. Backend compõe o contexto autorizado e integra a geração textual estruturada. A arquitetura WebRTC, as fontes de áudio e o modelo de transcrição continuam inalterados.

# Segurança

* [x] validação de tenant/permissão
* [x] validação de autenticação/autorização
* [x] proteção contra acesso indevido
* [x] proteção de dados sensíveis
* [x] logs adequados

# Multi-Tenancy

* [x] identificador de tenant validado
* [x] isolamento garantido
* [x] nenhuma consulta cruza tenants

# Estratégia de Migração

## Necessária?

Não.

## Descrição

Não há alteração estrutural de dados.

## Rollback

Desabilitar/remover a chamada de geração e apresentar apenas o estado vazio; a captura e a transcrição existentes permanecem intactas.

# Plano de Testes

## Testes Unitários

* Montagem do contexto ordenado e filtrado por sessão/tenant.
* Validação do contrato estruturado, idioma/tamanho da próxima fala e ausência de campos obrigatórios.
* Controle de resposta obsoleta e estados da interface.

## Testes de Integração

* Endpoint autenticado gera orientação usando cliente OpenAI simulado.
* Isolamento entre tenants e entre sessões.
* Falha/timeout e resposta inválida do provedor não persistem sugestão nem interrompem segmentos.

## Testes E2E

* Fala final de cliente preenche o card real e remove os exemplos fixos.
* Regeneração manual e tratamento de erro preservam a transcrição.

# Planejamento de Tickets

Não serão criados tickets nesta entrega. A mudança exige frontend e backend, mas eles formam uma única fatia vertical e atômica: não há valor funcional nem integração segura independente ao publicar apenas um dos lados. A entrega será integrada em uma única branch `codex/sugestoes-fala-tempo-real`, com build e validação dos dois módulos.

# Evidências Esperadas

Saídas de build e testes, relatório de latência das execuções controladas, logs sanitizados, e evidência E2E do estado vazio, carregamento, sucesso e erro.

# Critérios de Aceite

* [ ] Todos os RF implementados.
* [ ] Todas as RN implementadas.
* [ ] Testes criados e executados.
* [ ] Build executado com sucesso.
* [ ] Validation Report aprovado.

# Critérios de Reprovação

A entrega é reprovada se mostrar conteúdo demonstrativo, expor dados entre tenants, persistir sugestão, interromper a transcrição, permitir conteúdo inventado de preço/prazo/funcionalidade ou não atender ao contrato estruturado.

# Riscos Conhecidos

Qualidade e latência dependem da disponibilidade do provedor e do tamanho crescente da transcrição. A implementação deve registrar métricas sanitizadas e descartar resultados obsoletos.

# Dependências

* Credencial OpenAI já mantida exclusivamente no backend.
* Disponibilidade de `gpt-6-luna` na conta OpenAI do ambiente.

# Perguntas em Aberto

Nenhuma.

# Aprovação do PRD

* [x] Escopo está claro.
* [x] Critérios de aceite estão claros.
* [x] Requisitos são testáveis.
* [x] Está pronto para implementação.

# Próxima Etapa

1. `$impact-analysis`
2. `$architecture-review`
3. `$business-review`
4. implementação
5. `$generate-tests`
6. `$validate-delivery`
