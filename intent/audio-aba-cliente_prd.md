# PRD — Áudio da aba do cliente

## Escopo

Ampliar a call autenticada para capturar áudio de uma aba ou janela escolhida pelo usuário, transcrevê-lo com `gpt-live-transcribe` em uma conexão independente e apresentar/persistir as finalizações como **Cliente**.

O usuário confirmou que ativar qualquer fonte inicia a sessão de call. As fontes permanecem independentes durante a sessão.

## Requisitos funcionais

* **RF001 — Escolher compartilhamento:** ao ativar áudio da aba, o navegador abre o seletor nativo com áudio solicitado. O produto não lê nem transmite o vídeo retornado pelo seletor.
* **RF002 — Fonte independente:** a aba usa sua própria conexão de transcrição e pode operar junto ao microfone. Ativar/desativar uma fonte não para tracks, conexão ou transcrição da outra; a sessão só termina quando ambas estão desligadas ou quando o usuário encerra a call.
* **RF003 — Transcrição do cliente:** deltas de áudio compartilhado aparecem transitoriamente como Cliente e cada finalização entra na conversa na sequência global de finalizações, marcada como Cliente e salva como texto final.
* **RF004 — Falta/interrupção de áudio:** se o stream não tiver faixa de áudio, exibir aviso imediato para escolher uma fonte com “Compartilhar áudio” ativado. Se a faixa encerrar externamente, desativar só esta fonte e avisar o usuário.
* **RF005 — Controles e retomada:** o botão expressa “escutando áudio da aba” quando ativo, encerra apenas esta captura ao desligar e reabre o seletor para uma nova escolha quando ligado novamente.
* **RF006 — Persistência e autorização:** segmentos do cliente recebem identificação de falante, sessão e `tenant_id` derivados no backend; áudio, vídeo, deltas e credenciais não são persistidos.

## Regras de negócio

* **RN001:** uma sessão de call pode ter zero, uma ou duas fontes ativas: microfone do usuário e áudio compartilhado do cliente.
* **RN002:** call ativa enquanto houver ao menos uma fonte ativa; encerrar a call encerra as duas fontes e finaliza a sessão uma única vez.
* **RN003:** segmentos finais usam uma sequência global crescente por call; o falante é `USER` ou `CLIENT` e não é controlado por tenant enviado pelo navegador.
* **RN004:** ausência de faixa de áudio não cria conexão OpenAI e não persiste segmento.
* **RN005:** a compatibilidade suportada é Chrome/Edge desktop em HTTPS ou `localhost`; somente as escolhas que devolverem áudio podem ser transcritas.

## Não funcionais

* Chave principal continua apenas no backend; cada conexão recebe segredo efêmero autenticado e protegido por CSRF.
* Logs contêm somente IDs técnicos, fonte e sequência — nunca áudio, vídeo, texto ou segredo.
* A migration é Flyway, reversível por remoção de código/coluna em ambiente de rollback planejado.

## Fluxos

1. Usuário liga áudio da aba; se não existe sessão, ela é criada.
2. O navegador abre a escolha nativa. Se não retornar `audioTrack`, a seleção é liberada e a UI explica como compartilhar o som.
3. Com áudio, uma conexão Realtime independente é aberta e seus deltas/finais são tratados como Cliente.
4. Ao desligar a fonte ou ao evento `ended`, seus tracks/conexão são encerrados; a outra fonte continua se existir.
5. Ao encerrar a call, as duas fontes e a sessão são encerradas.

## Fora do escopo

Vídeo, gravação/reprodução de áudio, transcrição por locutor dentro da mesma fonte, histórico visual de calls e suporte Firefox/Safari.

## Decisão de integração

Apesar de envolver frontend, banco e backend, esta é uma única fatia vertical coesa: um segmento do cliente pode ser capturado, rotulado, persistido e exibido ponta a ponta. Não requer tickets separados.
