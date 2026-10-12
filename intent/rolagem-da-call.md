# Intent — Rolagem acompanhada na call

## Problema

Em calls longas, novas falas e sugestões deixam de ficar visíveis. A pessoa precisa procurar manualmente o conteúdo atual e perde contexto operacional durante a conversa. Além disso, sugestões anteriores são substituídas em vez de permanecerem consultáveis até o fim da call.

## Objetivo

Manter o conteúdo novo visível nos painéis de transcrição e orientação sem interromper a leitura intencional de conteúdo antigo.

## Usuários e módulos afetados

Usuários individuais e de organização na tela autenticada de call; somente `frontend/` é impactado.

## Resultado esperado

Quem acompanha o fim do painel vê automaticamente novas falas e sugestões. Quem rola para cima pode ler sem ser puxado; recebe uma ação clara para retornar ao conteúdo mais recente. Sugestões anteriores ficam disponíveis apenas durante a call ativa.

## Riscos

Auto-rolagem excessiva pode causar desconforto, e histórico sem limpeza pode vazar conteúdo entre calls. Ambos serão limitados pelo estado de leitura e pelo ciclo de vida já existente da call.

## Critérios de sucesso

* Nova fala/sugestão aparece sem rolagem manual quando o usuário está no fim do respectivo painel.
* A leitura manual de conteúdo antigo não é deslocada.
* Histórico de sugestões é limpo ao iniciar outra call.
