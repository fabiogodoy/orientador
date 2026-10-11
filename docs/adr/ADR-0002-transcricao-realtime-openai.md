# ADR-0002 — Transcrição Realtime OpenAI com segredo efêmero

## Status

Aceita — 2026-10-11

## Contexto e decisão

O Orientador precisa transcrever microfone em tempo real sem expor a chave permanente da OpenAI e sem armazenar áudio. Usaremos `gpt-live-transcribe` em conexão WebRTC do navegador, autenticada por segredo efêmero emitido pelo backend para um usuário/sessão autenticados. O frontend envia ao backend somente segmentos textuais finalizados para persistência tenant-scoped; o backend guarda `OPENAI_API_KEY` fora do Git.

## Opções consideradas

* WebSocket proxy do backend: manteria o áudio no servidor, aumenta custo operacional e superfície de dados sensíveis.
* Upload de chunks: não oferece a latência esperada da transcrição em tempo real.
* WebRTC com segredo efêmero: reduz trânsito de áudio pela infraestrutura própria e preserva a chave principal no servidor.

## Consequências

Exige HTTPS/localhost e compatibilidade Chromium. Sessões e segmentos precisam de migration, isolamento por `tenant_id`, expiração/reconexão de segredo e observabilidade sem conteúdo sensível. Áudio bruto não é persistido nem logado.
