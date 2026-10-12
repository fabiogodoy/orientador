# Metadados

## ADR

ADR-0004

## Título

Geração de sugestões comerciais no backend com OpenAI

## Data

2026-10-12

## Autor

Usuário e Agente

## Status

Aprovado

## Relacionado

Intent: `intent/sugestoes-fala-tempo-real.md`
PRD: `intent/sugestoes-fala-tempo-real_prd.md`
Impact Analysis: `intent/sugestoes-fala-tempo-real_impact.md`

---

# Resumo Executivo

Sugestões de fala comerciais serão geradas pela OpenAI em uma chamada textual exclusiva do backend, usando `gpt-6-luna` com raciocínio `none` e resposta estruturada. O navegador continuará usando somente o segredo efêmero da transcrição e jamais receberá a credencial permanente ou chamará o modelo de geração diretamente.

# Contexto

O produto já usa OpenAI Realtime para transcrever áudio no navegador. A arquitetura inicial citava xAI/Grok como previsão ainda não implementada para sugestões. A necessidade confirmada é transformar a transcrição persistida da própria call em uma próxima fala curta, sem conhecimento externo e sem persistir a sugestão.

# Problema

Era necessário escolher onde e com qual provedor gerar a orientação comercial sem duplicar integrações, expor segredos, confiar em texto enviado pelo navegador ou cruzar dados entre tenants.

# Objetivos

* Reutilizar o provedor já integrado ao produto.
* Manter a chave permanente e a montagem do contexto no servidor.
* Retornar estrutura validável e de baixa latência para a interface.
* Preservar transcrição, isolamento por `tenant_id` e política de não persistir sugestões.

# Restrições

* A orientação usa somente texto final da mesma sessão de call.
* A próxima fala é em português, com até 500 caracteres, e não inventa preço, prazo ou funcionalidade.
* Não há quota comercial por tenant/sessão nesta entrega.
* Captura e transcrição não podem depender do sucesso da geração.

# Opções Consideradas

## Opção A — OpenAI textual no backend (`gpt-6-luna`)

### Vantagens

* Reutiliza fornecedor, credencial e práticas já presentes no produto.
* Mantém transcrição, prompt e validação fora do navegador.
* O catálogo oficial posiciona o modelo escolhido para tarefas focadas, de alto volume e sensíveis a custo.
* Permite exigir resposta estruturada e controlar timeout/observabilidade no servidor.

### Desvantagens

* Cria dependência adicional de disponibilidade e limites da OpenAI.
* O contexto cresce com a duração da call e aumenta custo/latência.

## Opção B — xAI/Grok no backend

### Vantagens

* Seguiria a previsão inicial do documento de arquitetura.

### Desvantagens

* Exige novo fornecedor, nova credencial, novo contrato operacional e novo caminho de dados sem benefício demonstrado para o primeiro escopo.

## Opção C — Chamar o modelo diretamente do navegador

### Vantagens

* Poderia reduzir uma viagem de rede entre frontend e backend.

### Desvantagens

* Exporia ou complicaria a proteção da credencial, confiaria no contexto enviado pelo cliente e impediria validação centralizada de tenant, sessão e resposta.

# Decisão

Usar OpenAI para a geração textual server-side, com `gpt-6-luna` e raciocínio `none`. O backend lê segmentos finalizados da sessão autorizada, monta o prompt com o texto delimitado como dado não confiável, recebe resposta estruturada, valida-a e devolve apenas o objeto transitório ao frontend.

# Justificativa

A opção A resolve a necessidade com a menor expansão operacional: a OpenAI já é usada na transcrição e a chave permanente já pertence ao backend. O modelo é recomendado pela documentação oficial para tarefas focadas de alto volume e oferece contexto suficiente para a transcrição acumulada. A fronteira backend protege segredo e dados, torna o isolamento auditável e permite recusar respostas fora das regras comerciais. xAI/Grok adicionaria custo de manutenção sem vantagem confirmada; acesso direto do navegador viola a fronteira de confiança.

# Impactos Esperados

## Positivos

* Orientação contextual disponível durante a call.
* Um único provedor de IA nesta fase.
* Validação e observabilidade centralizadas, sem persistir sugestões.

## Negativos

* Nova dependência de geração externa e custo variável por volume de transcrição.
* Respostas podem atrasar ou falhar, exigindo UX de degradação.

# Impacto Arquitetural

`frontend/` apenas solicita e apresenta a orientação. `backend/` torna-se a fronteira para montar o contexto, chamar a OpenAI e validar a resposta. PostgreSQL continua sendo a fonte de verdade de segmentos e não armazena sugestão. A conexão WebRTC/browser → Realtime segue isolada e inalterada.

# Impacto em Segurança

Identidade e `tenant_id` vêm da sessão autenticada. A consulta usa sessão, tenant e usuário; o navegador não envia transcrição. A chave OpenAI não sai do backend. Texto conversacional é tratado como entrada não confiável e não aparece em logs, métricas ou mensagens de erro.

# Impacto em Multi-Tenancy

Contexto é composto exclusivamente de segmentos da call pertencente ao usuário autenticado e ao seu `tenant_id`. A decisão não amplia permissões de gestor/admin nem cria acesso entre tenants.

# Impacto em Performance

O backend impõe timeout, limita a saída a 500 caracteres e registra duração sanitizada. A implementação descarta respostas cujo contexto tenha sido superado por nova fala do cliente; a meta é até 3 s no p95 das gerações bem-sucedidas.

# Débito Técnico

Não há débito deliberado. Caso reuniões longas passem a comprometer latência/custo, uma estratégia explícita de compactação de contexto será uma decisão futura, precedida de avaliação de qualidade e privacidade.

# Consequências

## Curto Prazo

Adicionar endpoint, cliente OpenAI textual, schema de resposta e estados da interface, sem migration.

## Médio Prazo

Monitorar duração, falhas e volume de contexto para avaliar a meta de desempenho.

## Longo Prazo

Reavaliar modelo, contexto e quotas comerciais quando houver métricas de uso, planos de cobrança ou requisitos regulatórios adicionais.

# Riscos

## Risco 01

Saída fora das regras comerciais ou influência de instruções contidas na transcrição. Mitigação: prompt delimitado, schema obrigatório, validação server-side e testes adversariais.

## Risco 02

Dependência externa superar a janela útil da conversa. Mitigação: timeout, descarte de resposta obsoleta, regeneração manual e continuidade independente da transcrição.

# Plano de Reversão

Retirar o endpoint e o acionamento da interface, deixando o card em estado vazio. Nenhum dado exige migração ou limpeza porque sugestões não são persistidas.

# Critérios de Revisão

Revisar ao falhar a meta de 3 s no p95, ao crescer custo/volume de contexto, quando houver requisito de residência de dados, ou antes de introduzir quotas, conhecimento externo ou histórico de sugestões.

# Decisão Final

## Status

* Aprovada

## Justificativa Final

Confirmada pelo solicitante em 2026-10-12 após esclarecer a divergência entre a previsão antiga de xAI/Grok e a implementação atual de OpenAI.

# Lições Aprendidas

Preencher após a implementação.
