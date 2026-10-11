# ADR-0003 — Duas fontes Realtime independentes por call

## Status

Aceita — 2026-10-11

## Contexto

Uma call do Orientador pode receber a voz do usuário pelo microfone e a voz do cliente por áudio compartilhado de uma aba ou janela. As duas fontes podem iniciar/parar em momentos distintos.

## Decisão

Cada fonte ativa abre uma conexão WebRTC de transcrição própria, com segredo efêmero próprio, mas ambas escrevem na mesma `call_session`. O frontend usa uma sequência global de segmentos e informa `USER` ou `CLIENT`; o backend persiste o falante junto ao segmento, sempre limitado à sessão e ao `tenant_id` autenticados. A captura de display descarta imediatamente suas faixas de vídeo.

## Alternativas consideradas

* Misturar os dois tracks em uma conexão: elimina a distinção confiável entre falantes e acopla os ciclos de vida.
* Fazer mixagem/local relay de áudio: aumenta processamento, reduz diagnóstico e adiciona risco de armazenar/transitar mídia desnecessária.

## Consequências

Há duas conexões potencialmente simultâneas e custo de transcrição por fonte ativa. Em troca, cada fonte pode falhar, parar e retomar sem afetar a outra. Nenhum áudio ou vídeo é persistido.
