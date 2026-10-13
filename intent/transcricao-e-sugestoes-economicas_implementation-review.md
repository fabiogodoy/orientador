# Implementation Review — Transcrição e sugestões econômicas

## Parecer

**APROVADA COM RESSALVAS.** A implementação troca o canal Realtime por blocos WebM temporários, mantém autorização no backend e incorpora o resumo efêmero no contrato estruturado de sugestões.

## Evidências revisadas

* `GroqTranscriptionClient` encaminha apenas bytes recebidos em memória, com limite de 2 MiB e sem escrita em disco.
* `CallService` valida usuário, tenant e call ativa antes de encaminhar áudio ou persistir somente o texto final.
* `App.tsx` fecha um `MediaRecorder` por fonte a cada 15 segundos, libera tracks ao parar e usa VAD local para não enviar blocos silenciosos.
* Sugestão automática depende de pergunta/objeção local; botão manual permanece disponível.
* `OpenAiSuggestionClient` devolve resumo interno atualizado, com limite de saída 400 e sem persistência desse resumo.

## Ressalvas

As sugestões dependem da disponibilidade/configuração operacional do fornecedor. A validação real de microfone/áudio de aba requer permissão de hardware em Chromium, complementar aos testes automatizados.
