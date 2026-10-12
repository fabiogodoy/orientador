# Metadados

## Título

Sugestões de fala comerciais em tempo real

## Slug

sugestoes-fala-tempo-real

## Data

2026-10-12

## Autor

Usuário e Agente

## Status

Aprovada

---

# Resumo Executivo

O Orientador já transcreve separadamente o vendedor e o cliente, mas não transforma a conversa em apoio acionável. Esta entrega busca oferecer ao vendedor uma sugestão curta para sua próxima fala, inclusive diante de objeções, no momento em que o cliente conclui sua fala.

# Problema

## Problema Principal

Em uma conversa comercial ao vivo, o vendedor precisa interpretar a última fala do cliente, relacioná-la ao histórico e formular uma resposta útil sob pressão. A transcrição isolada preserva o conteúdo, mas não reduz esse esforço cognitivo no momento em que a resposta é necessária.

## Sintomas

* A área de orientação apresenta conteúdo demonstrativo fixo, sem relação com a conversa em curso.
* O vendedor precisa converter mentalmente a transcrição em uma próxima fala durante a reunião.
* Objeções e sinais de interesse do cliente não recebem apoio contextual e imediato.

## Evidências

O fluxo atual já identifica as falas finalizadas do cliente e do vendedor e apresenta uma área intitulada “Próxima melhor resposta”, porém seu conteúdo é estático. O solicitante confirmou a necessidade de apoio comercial baseado na transcrição da própria call.

# Contexto de Negócio

O Orientador apoia pessoas em reuniões online sem substituir seu julgamento. Para o primeiro caso de uso, o público é o vendedor em conversa comercial. Sem este apoio, a transcrição continuará sendo apenas um registro textual durante a call, reduzindo o valor percebido da experiência ao vivo.

# Objetivo

Permitir que o vendedor receba orientação curta, contextual e utilizável para responder à última fala do cliente durante uma conversa comercial, sem que o produto invente condições comerciais.

# Benefícios Esperados

* **Usuário individual e usuário de organização:** mais clareza e rapidez para conduzir conversas comerciais ao vivo.
* **Gestor de organização:** maior valor percebido pela equipe que usa o produto em calls de venda.
* **Plataforma:** diferenciação da experiência de transcrição por meio de apoio contextual, sem reter sugestões como dado adicional.

# Usuários Impactados

* Usuário individual.
* Usuário de organização.
* Gestor de organização, como usuário da funcionalidade e responsável pela adoção do produto.

# Módulos/Sistemas Impactados

* `frontend/` — apresentação da orientação e interação durante a call.
* `backend/` — regra de acesso, montagem segura do contexto da reunião e integração de geração.
* OpenAI — geração textual baseada na transcrição.
* PostgreSQL — leitura dos segmentos de transcrição já persistidos, sem nova persistência de sugestões.

# Processo Atual

1. O usuário inicia a captura do microfone e/ou do áudio da aba.
2. O produto recebe e apresenta segmentos finalizados de transcrição para vendedor e cliente.
3. Os segmentos são guardados na sessão da call.
4. A área de orientação exibe exemplos estáticos que não representam a conversa atual.

# Dores do Processo Atual

* O apoio visual não é confiável como orientação para a conversa real.
* Uma objeção do cliente exige interpretação e redação inteiramente manuais pelo vendedor.
* O produto não usa o contexto já capturado para oferecer valor imediato.

# Resultado Esperado

Após cada fala final do cliente, o vendedor vê uma orientação atualizada com tipo de situação, trecho de referência, próxima fala curta e pontos-chave, todos coerentes com a transcrição acumulada da call. O vendedor pode pedir outra formulação. A orientação nunca inventa preço, prazo ou funcionalidade e continua sendo apoio, não decisão automática.

# Restrições

## Técnicas

* A geração recebe somente texto final da própria reunião; não recebe nem persiste áudio ou vídeo.
* A chave permanente do provedor não pode chegar ao navegador.
* A sugestão é transitória e não integra o histórico persistido.

## Operacionais

* A orientação precisa chegar durante a conversa, sem bloquear a transcrição ou os controles de captura.

## Financeiras

* A geração deve usar um modelo textual econômico adequado a tarefas focadas e de alto volume.
* Não haverá limite de uso por sessão ou tenant nesta entrega.

## Legais

* O tratamento continua sujeito às informações de transparência e ao isolamento de dados da reunião já previstos pelo produto.

# Regras de Negócio Conhecidas

RN001 — O primeiro escopo é conversa comercial, incluindo apoio a objeções.

RN002 — A orientação responde à última fala finalizada do cliente e considera a transcrição acumulada da mesma reunião.

RN003 — A próxima fala é em português, curta e não inventa preço, prazo ou funcionalidade.

RN004 — A orientação é gerada automaticamente após uma fala final do cliente e pode ser solicitada novamente pelo vendedor.

RN005 — Sugestões não são persistidas nesta primeira versão.

# Hipóteses

* A transcrição finalizada disponível representa contexto suficiente para gerar uma próxima fala útil.
* Um modelo textual econômico mantém qualidade suficiente para o primeiro caso de uso comercial.

# Riscos

## Riscos Técnicos

Latência ou falha da geração pode deixar a orientação desatualizada em relação à conversa.

## Riscos Operacionais

O usuário pode interpretar a orientação como garantia comercial se a interface não mantiver seu caráter de apoio claro.

## Riscos de Produto

Uma sugestão pouco relevante ou que invente condições pode reduzir a confiança no produto.

## Riscos de Regressão

A nova geração não pode impedir captura, transcrição ou persistência já funcionais.

# Impacto Esperado nos Indicadores

Ainda não há indicadores formais definidos. Espera-se impacto positivo em ativação, valor percebido e retenção, a ser medido quando houver instrumentação de produto definida.

# Critérios de Sucesso

## CS001

Para cada fala final do cliente em uma call ativa, o vendedor recebe uma orientação relacionada à conversa, sem conteúdo demonstrativo fixo.

## CS002

Cada orientação apresenta próxima fala curta em português e não introduz preço, prazo ou funcionalidade ausentes da transcrição.

## CS003

Um vendedor pode solicitar uma nova formulação sem interromper a captura ou a transcrição.

## CS004

Nenhuma sugestão é persistida nem fica acessível a outro tenant.

# Critérios para Não Implementar

Não implementar se a geração não puder ser feita exclusivamente com texto da própria reunião ou se não for possível preservar autenticação, isolamento por tenant e continuidade da transcrição.

# Alternativas Consideradas

* Manter apenas a transcrição: não resolve a necessidade de apoio imediato para a próxima fala.
* Usar exemplos fixos: rejeitado, pois não reflete a conversa real.
* Usar outro provedor de IA: rejeitado nesta entrega para evitar uma nova integração, já que a captura usa OpenAI.

# Perguntas em Aberto

Nenhuma decisão de produto bloqueante permanece aberta. A orientação deve aparecer em até 3 segundos em 95% das gerações bem-sucedidas e a próxima fala terá no máximo 500 caracteres; o contrato de API e a escolha técnica final serão definidos no PRD.

# Aprovação da Intent

* [x] A Intent descreve claramente o problema.
* [x] Existe valor de negócio.
* [x] O objetivo está claro.
* [x] Está pronta para gerar PRD.

# Próximo Passo

Gerar `intent/sugestoes-fala-tempo-real_prd.md` com `$create-prd`.
