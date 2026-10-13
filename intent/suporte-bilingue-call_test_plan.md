# Plano de testes — Suporte bilíngue na call

## Metadados

* **Slug:** suporte-bilingue-call
* **Data:** 2026-10-13
* **Intent:** `intent/suporte-bilingue-call.md`
* **PRD:** `intent/suporte-bilingue-call_prd.md`
* **Impact Analysis:** `intent/suporte-bilingue-call_impact.md`

## Matriz de Cobertura

| Requisito | Cenário | Evidência |
| --- | --- | --- |
| RF001 | CT001 — segredo contém `pt` e `en`, preservando demais campos | JUnit |
| RF002 | CT002 — prompt exige resposta em PT para última fala PT; CT003 — em EN para última fala EN; CT004 — troca de idioma é por fala | JUnit |
| RF003 | CT005 — proteções comerciais e limites continuam no prompt/validador | JUnit e revisão |

## Testes Unitários

* **CT001:** simular a API de segredo e inspecionar o corpo JSON para confirmar a lista exata `languages: ["pt", "en"]`, modelo, delay e `turn_detection` preservados.
* **CT002/CT003/CT004:** inspecionar a instrução gerada/enviada ao Responses API, verificando a regra explícita de seguir a última fala do cliente em PT, EN e caso de alternância.
* **CT005:** manter os testes de validação existentes para limite de 500 caracteres e campos obrigatórios.

## Integração e Regressão

* Executar `./mvnw verify` com Java 21: assegura a suíte de serviço/autorização já existente.
* Executar `npm test` e `npm run build` no frontend: não há alteração de contrato ou UI, mas valida a regressão da call.
* Não há E2E adicional: o comportamento visual e contrato HTTP não foram modificados; a integração externa é coberta por simulação determinística no backend.

## Segurança e Multi-Tenancy

A entrega não altera queries, endpoints, identidade ou logs. A suíte backend existente de sugestões continua a provar que o serviço usa a sessão autorizada; a revisão confirmará que nenhum conteúdo/segredo é registrado.
