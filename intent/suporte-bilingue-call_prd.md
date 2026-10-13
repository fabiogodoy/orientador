# PRD — Suporte bilíngue na call

## Metadados

* **Slug:** suporte-bilingue-call
* **Data:** 2026-10-13
* **Origem:** `intent/suporte-bilingue-call.md`
* **Status:** Aprovado

## Escopo

### Dentro do escopo

* Configurar `gpt-live-transcribe` com português e inglês como idiomas possíveis.
* Gerar orientação comercial no idioma da última fala do cliente.
* Cobrir português, inglês e troca de idioma em testes do cliente de geração.

### Fora do escopo

* Seletor manual de idioma, detecção persistida por sessão ou interface nova.
* Suporte a idiomas além de `pt` e `en`.
* Tradução da transcrição, da sugestão ou de reuniões históricas.
* Mudança de modelo, custo, retenção de áudio ou dados armazenados.

## Requisitos Funcionais

### RF001 — Transcrição PT/EN

Ao criar o segredo de uma sessão Realtime, o backend deve informar `pt` e `en` como idiomas possíveis para `gpt-live-transcribe`.

**Aceite:** a requisição de segredo contém `languages: ["pt", "en"]` e preserva o modelo, a baixa latência e o restante da configuração da sessão.

### RF002 — Orientação no idioma da fala do cliente

Após uma fala final do cliente, o gerador deve produzir `tipo`, `trechoCliente`, `proximaFala` e `pontosChave` no idioma dessa última fala. A sugestão segue a conversa mesmo quando o idioma muda entre falas.

**Aceite:** a instrução enviada ao modelo determina explicitamente a regra por última fala do cliente, sem idioma fixo por sessão.

### RF003 — Preservação das regras comerciais

A nova instrução deve preservar o uso exclusivo de fatos da transcrição, a recusa a instruções contidas nela, o limite de 500 caracteres para a próxima fala e de 1 a 3 pontos-chave.

**Aceite:** as regras preexistentes permanecem presentes na instrução e na validação server-side.

## Requisitos Não Funcionais

* **RNF001 — Performance:** não adicionar chamada externa nem latência extra ao fluxo atual.
* **RNF002 — Segurança:** a alteração não altera fronteiras de autenticação, CSRF, tenant ou credenciais.
* **RNF003 — Observabilidade:** logs continuam a conter somente IDs, duração e categorias, nunca texto transcrito ou segredo.
* **RNF004 — Compatibilidade:** o contrato HTTP e a interface atual não mudam.

## Fluxos

1. Usuário inicia uma call; o backend cria uma sessão Realtime apta a transcrever `pt` e `en`.
2. O cliente persiste uma fala final do cliente.
3. O backend recupera somente os segmentos autorizados da call.
4. A OpenAI recebe a transcrição como dado não confiável e devolve uma orientação no idioma da última fala do cliente.
5. Em uma fala posterior no outro idioma, o mesmo processo gera a próxima orientação no novo idioma.

### Erro

Se a OpenAI rejeitar a configuração ou a geração falhar, os erros sanitizados existentes são preservados e a transcrição continua independente.

## Dados, segurança e multi-tenancy

Não há migration nem alteração de banco. A busca de contexto mantém os filtros de sessão, `tenant_id` e usuário autenticado; esta entrega não cria endpoint, permissão ou dado persistido.

## Estratégia de Testes

Testes unitários do corpo da sessão e do prompt em PT, EN e alternância; suíte backend existente e build do frontend para regressão de contrato.

## Decisão de integração

A entrega cabe em uma única integração segura: modifica somente a configuração e as instruções do backend existente, sem dependência nova, endpoint, schema ou frontend.
