# Architecture Review — Sugestões de fala comerciais em tempo real

## Parecer: APROVADA COM RESSALVAS

`frontend/` é o local correto para disparar e renderizar orientação sem interferir na captura; `backend/` é o local correto para autenticar, aplicar `tenant_id`, ler segmentos persistidos, montar contexto, chamar a OpenAI e validar saída. PostgreSQL permanece fonte de verdade e não requer migration, pois sugestões são transitórias. A implementação reaproveita `HttpClient` do Java 21 e a configuração existente da chave OpenAI; não adiciona SDK ou dependência.

O acesso server-side à geração é uma fronteira diferente do segredo efêmero de transcrição e a mudança de previsão de xAI/Grok para OpenAI foi registrada em ADR-0004 e em `.ai/context/architecture.md`. O modelo `gpt-6-luna` com raciocínio `none` é adequado para a carga focada e econômica definida no PRD, condicionado à disponibilidade na conta do ambiente.

Ressalvas obrigatórias: o serviço deve impor timeout menor que a meta de UX, validar formato/tamanho/conteúdo antes de responder, tratar transcrição como dado não confiável contra prompt injection, manter filtros por sessão/tenant/usuário e descartar respostas obsoletas no frontend. A consulta de contexto deve usar o índice existente ou demonstrar plano equivalente antes de aprovação final.

## Adendo — Finalização de turnos de áudio

**APROVADA.** A correção fica no `frontend/`, que é o único módulo que possui o `MediaStream` e o data channel WebRTC. Ela reutiliza APIs nativas (`AudioContext`/`AnalyserNode`) e o protocolo Realtime existente, sem criar endpoint, persistência, dependência ou mudança de isolamento. O detector deve ser encapsulado no ciclo de vida de cada fonte e ser encerrado junto com ela; o segmento só será persistido após o evento final da OpenAI. Não há nova decisão arquitetural que exija ADR.
