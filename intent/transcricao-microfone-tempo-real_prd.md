# PRD — Transcrição de microfone em tempo real

## Escopo

Implementar captura de microfone autorizada, transcrição em tempo real com `gpt-live-transcribe`, persistência de texto final por sessão/call e exibição na home autenticada. Ficam fora do escopo: áudio de aba, diarização de cliente, sugestões reais de IA, reprodução/gravação de áudio e histórico visual separado.

## Requisitos funcionais

* **RF001 — Iniciar captura:** o botão iniciar solicita microfone somente após ação explícita, cria sessão autenticada e mostra estado de captura.
* **RF002 — Texto em tempo real:** deltas parciais aparecem na transcrição e o segmento final substitui o parcial.
* **RF003 — Encerrar captura:** encerrar para faixas de microfone, fecha a conexão e finaliza a sessão.
* **RF004 — Persistência:** cada segmento final é salvo com sessão, usuário e `tenant_id`.
* **RF005 — Segredo seguro:** backend autenticado e protegido por CSRF emite somente segredo efêmero configurado para uma sessão, jamais a chave OpenAI principal.
* **RF006 — Falhas:** permissão negada, navegador incompatível, segredo expirado e falha do provedor são comunicados sem expor detalhes sensíveis; o usuário pode tentar novamente.

## Regras de negócio

* **RN001:** somente o usuário autenticado inicia a própria sessão de call.
* **RN002:** todo registro de sessão e segmento deve ter `tenant_id` validado no backend; leitura/escrita não pode cruzar tenants.
* **RN003:** somente texto final é persistido; áudio e texto parcial são transitórios.
* **RN004:** o provedor recebe áudio apenas durante sessão iniciada conscientemente; a tela informa a captura e seu destino.
* **RN005:** idioma inicial é português do Brasil; o modelo é `gpt-live-transcribe`.

## Não funcionais e aceite

Compatível com Chrome/Edge desktop, em HTTPS/localhost. A chave fica no `.env` ignorado e apenas o backend a lê. Operações de início/fim/persistência registram identificadores técnicos (sem texto/áudio/chave) para diagnóstico. Cada RF terá teste unitário/integrado/E2E conforme plano.

## Fluxo

1. Usuário aciona “Iniciar call”, confirma o aviso e concede microfone.
2. Frontend obtém segredo efêmero do backend e abre WebRTC de transcrição configurada em português.
3. Deltas aparecem; eventos finalizados são enviados ao backend com CSRF para persistência.
4. Usuário encerra; tracks, canal e sessão são fechados, preservando somente texto final.

## Entrega

O solicitante aprovou reunir os três marcos em uma única entrega versionada; os testes preservam as fronteiras de sessão/persistência, WebRTC e resiliência.
