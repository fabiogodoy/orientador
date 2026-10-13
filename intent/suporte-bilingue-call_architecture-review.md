# Architecture Review — Suporte bilíngue na call

## Parecer: APROVADA

O backend é o módulo correto: ele cria o segredo Realtime e concentra a chamada ao Responses API com a chave permanente. A alteração reutiliza `HttpClient`, o modelo, autenticação e isolamento já implementados, sem dependência, endpoint, schema ou componente de interface adicional.

A lista `languages` é a configuração indicada pela documentação da OpenAI para múltiplos idiomas esperados em `gpt-live-transcribe`. A regra de idioma pertence à instrução server-side, pois o navegador não deve definir as regras nem receber a chave. Não há migration nem necessidade de ADR: o ajuste é pequeno, reversível e não estabelece uma nova decisão arquitetural.

**Complexidade:** baixa. **Débito técnico:** nenhum deliberado.
