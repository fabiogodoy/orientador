# Impact Analysis — Suporte bilíngue na call

## Metadados

* **Slug:** suporte-bilingue-call
* **Data:** 2026-10-13
* **Intent:** `intent/suporte-bilingue-call.md`
* **PRD:** `intent/suporte-bilingue-call_prd.md`

## Resumo e Complexidade

Mudança pequena e reversível na configuração da integração OpenAI já existente e nas instruções do modelo textual. Complexidade técnica e operacional: **baixa**; de negócio: **média**, pois afeta diretamente o valor durante uma reunião internacional.

| Sistema/Módulo | Impacto |
| --- | --- |
| frontend/ | Não |
| backend/ | Sim |
| PostgreSQL | Não |
| OpenAI Realtime/Responses | Sim, configuração/instrução |

## Impacto por sistema

### Backend

`OpenAiRealtimeClient` passa a informar a lista de dois idiomas aceitos. `OpenAiSuggestionClient` substitui a imposição de português por regra de idioma da última fala do cliente. Não muda a API, sessão, consulta ou persistência.

### OpenAI

A documentação oficial permite `languages` com múltiplos códigos ISO-639-1 para `gpt-live-transcribe`; `pt` e `en` são códigos suportados. A alteração usa a integração existente, o mesmo modelo e a mesma credencial. [OpenAI Docs — Realtime transcription](https://developers.openai.com/api/docs/guides/realtime-transcription)

## Dados, segurança e multi-tenancy

Sem novas estruturas, queries ou migrations. O contexto continua sendo limitado pelo serviço a call, `tenant_id` e usuário autenticado. Não há mudança em autenticação, autorização, CSRF ou exposição de segredo.

## Riscos e mitigação

### Risco 01 — Reconhecimento ruim em fala ambígua

* **Probabilidade:** média; **impacto:** médio.
* **Mitigação:** declarar apenas PT/EN como idiomas esperados e testar áudio representativo em operação; o fornecedor mantém a inferência na transcrição.

### Risco 02 — Sugestão em idioma divergente

* **Probabilidade:** baixa; **impacto:** médio.
* **Mitigação:** instrução inequívoca baseada na última fala do cliente, com casos de teste de prompt PT, EN e alternância.

### Risco 03 — Regressão no segredo Realtime

* **Probabilidade:** baixa; **impacto:** alto.
* **Mitigação:** teste que captura o JSON enviado e confirma que modelo, delay e `turn_detection` permanecem inalterados.

## Regressões Potenciais

* A lista de idiomas pode ser serializada fora do contrato aceito pela OpenAI.
* A remoção literal de “português” poderia enfraquecer as demais regras de segurança comercial do prompt.

## Rollback

Reverter os dois arquivos do backend restaura a configuração exclusivamente portuguesa, sem migração ou dado a reverter.

## Decisão de ADR

**Não necessária.** A mudança é uma configuração reversível da integração existente, sem nova arquitetura, fornecedor, dado, permissão ou dependência.

## Aprovação para implementação

**Recomendação: implementar.** Riscos estão isolados e mitigados por testes unitários e pela manutenção das fronteiras existentes.
