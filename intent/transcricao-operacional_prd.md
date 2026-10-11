# PRD — Transcrição operacional da call

## Metadados

* **Slug:** `transcricao-operacional`
* **Origem:** `intent/transcricao-operacional.md`
* **Status:** Aprovado para implementação

## Escopo

Corrigir o fluxo local de transcrição ao vivo, remover o fallback de falas fictícias do painel de conversa, tornar erros de inicialização úteis e comprovar a persistência no PostgreSQL. Sugestões de IA e histórico de calls fora da sessão corrente não fazem parte desta entrega.

## Requisitos funcionais

### RF001 — Painel de transcrição sem demonstração

Antes de um segmento real, o painel deve exibir um estado vazio que oriente o início da captura. Após a transcrição, deve renderizar exclusivamente segmentos e parciais recebidos da sessão atual.

**Aceite:** nenhuma fala ou selo de demonstração aparece ao carregar a call; uma fala final recebida continua sendo mostrada.

### RF002 — Erro acionável de início

Ao falhar antes da conexão Realtime, a UI deve informar se a falha veio da permissão/dispositivo, da API do Orientador ou da conexão Realtime, sem expor tokens, chaves ou SDP.

**Aceite:** a resposta de erro conhecida da API não é substituída por mensagem genérica; falha de SDP mostra instrução de tentativa/revisão de rede.

### RF003 — Persistência verificável

O backend deve continuar criando `call_sessions` e gravando cada segmento final em `transcript_segments` com `tenant_id`, usuário, sequência e falante.

**Aceite:** a migration local registra V02 e V03 e o teste de integração confirma a linha persistida, inclusive o falante.

### RF004 — Inicialização local atual

Com backend reiniciado usando `backend/.env`, o endpoint autenticado de início da call deve criar segredo efêmero e permitir a conexão WebRTC segundo o contrato oficial da OpenAI.

**Aceite:** o backend em execução responde com as rotas atuais; a criação segura de segredo é validada sem imprimir seu conteúdo.

## Regras de negócio

* **RN001:** áudio e vídeo brutos nunca são persistidos; somente o segmento final.
* **RN002:** cada escrita de segmento é limitada a `tenant_id`, usuário autenticado e sessão ativa.
* **RN003:** uma falha de fonte não pode deixar conteúdo de demonstração como se fosse uma transcrição real.

## Requisitos não funcionais

* Segurança: chave permanente fica no backend; erros e logs não incluem credenciais, áudio, SDP ou texto de fala.
* Observabilidade: a falha de criação de segredo registra somente classe/status seguro e correlação da operação.
* Compatibilidade: Chrome/Edge desktop em `localhost` ou HTTPS; microfone depende da autorização do navegador.

## Dados e migração

Não há nova estrutura. As migrations versionadas V02 (`call_sessions`, `transcript_segments`) e V03 (`speaker`) devem ser aplicadas pelo Flyway ao iniciar o backend local. Rollback: parar a versão nova; não remover dados ou migrations já aplicadas.

## Entrega única

A correção cabe em uma integração segura: altera o fluxo existente, sem nova dependência ou mudança arquitetural. Não requer ADR novo; ADR-0002 e ADR-0003 continuam válidos.
