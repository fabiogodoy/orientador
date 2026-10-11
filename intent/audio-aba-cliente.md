# Intent — Áudio da aba do cliente

## Metadados

* **Slug:** `audio-aba-cliente`
* **Data:** 2026-10-11
* **Status:** Aprovada

## Problema

O Orientador já pode transcrever a voz do usuário, mas não captura a fala que vem da reunião web. Isso deixa a conversa incompleta, impede a leitura do contexto do cliente e reduz a utilidade da orientação ao vivo.

## Objetivo

Permitir que o usuário escolha conscientemente uma aba ou janela de reunião e torne disponível seu áudio para transcrição ao vivo, mostrando cada fala finalizada como **Cliente**, sem interromper a captura do microfone.

## Pessoas e módulos impactados

* Usuários individuais e de organizações em calls web.
* `frontend/`, `backend/`, PostgreSQL e OpenAI Realtime.

## Resultado e critérios de sucesso

* O botão de áudio abre o seletor nativo de compartilhamento e comunica claramente o estado de escuta.
* O áudio retornado pelo navegador é transcrito por fala, rotulado como cliente e persistido apenas como texto final.
* Escolha sem áudio e interrupção da captura recebem aviso acionável.
* Microfone e áudio compartilhado são independentes; qualquer fonte inicia a sessão e desligar uma não encerra a outra.

## Riscos

Compatibilidade de áudio de `getDisplayMedia` varia por navegador/sistema; o navegador pode retornar vídeo sem áudio. Há risco de misturar fontes, expor conteúdo em logs ou encerrar a sessão enquanto a outra fonte continua ativa.

## Fora da Intent

Captura de vídeo, armazenamento de áudio, diarização de múltiplos clientes, sugestões reais de IA e suporte fora de navegadores Chromium desktop.
