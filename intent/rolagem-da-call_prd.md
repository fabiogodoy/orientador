# PRD — Rolagem acompanhada na call

Status: Aprovado
Origem: `intent/rolagem-da-call.md`

## Escopo

Dentro: rolagem interna e acompanhada em transcrição/orientação; ação de retorno ao fim; histórico transitório de sugestões durante a call. Fora: persistir sugestões, alterar API/backend, mudar regras de geração de IA.

## Requisitos funcionais

### RF001 — Transcrição acompanha o fim

Quando o usuário estiver no fim do card de transcrição, novas falas finais e parciais levam a rolagem interna ao conteúdo mais recente.

Aceite: a página não rola; a última fala permanece visível.

### RF002 — Leitura manual é respeitada

Quando o usuário rolar para longe do fim de um painel, novas entradas não alteram a posição de leitura. O painel mostra uma ação para voltar ao mais recente.

Aceite: acionar a ação restaura a rolagem ao fim e o acompanhamento automático.

### RF003 — Histórico de sugestões da call

Cada sugestão recebida para uma nova fala do cliente é mantida no painel de orientação da call atual; a nova fica destacada e as anteriores permanecem recolhidas/consultáveis.

Aceite: uma sugestão anterior não é apagada ao chegar uma nova; gerar outra para a mesma fala substitui somente a sugestão atual, sem duplicar o histórico.

### RF004 — Ciclo de vida do histórico

Ao encerrar ou começar outra call, sugestões transitórias anteriores são removidas.

Aceite: uma nova call inicia sem histórico/sugestão de outra reunião.

## Regras de negócio

* RN001: “no fim” é uma distância de até 48 px do final rolável.
* RN002: auto-rolagem deve ser instantânea para atualizações parciais frequentes; entradas finalizadas podem usar transição suave.
* RN003: histórico é somente memória do navegador para a call ativa, sem persistência ou chamada adicional de API.

## Não funcionais

* RNF001: sem novas dependências e sem alteração de backend/banco.
* RNF002: controles de retorno são acessíveis por teclado, rotulados e não ocultam o conteúdo atual.
* RNF003: não modificar isolamento de tenant ou dados protegidos.

## Estratégia e entrega

Alteração pequena, uma única integração segura na `main`; tickets e ADR não são necessários. Testar com React Testing Library e build do frontend.
