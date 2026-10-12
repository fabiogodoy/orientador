# PRD — Continuidade e título das reuniões

* **Slug:** `reuniao-continuidade-titulo`
* **Data:** 2026-10-12
* **Origem:** `intent/reuniao-continuidade-titulo.md`
* **Status:** Aprovado

## Escopo

Inclui o ciclo de vida explícito de uma reunião em andamento, a finalização de texto pendente quando uma fonte é interrompida, título persistido e edição do título na tela atual. A lista ou tela de histórico fica fora deste escopo; o título ficará disponível no banco para ela.

## Requisitos funcionais

### RF001 — Reunião contínua

Parar microfone, áudio da aba ou ambos deve desligar somente a fonte correspondente. A mesma `call_session` permanece ativa e pode receber novas fontes e segmentos. Somente o botão **Encerrar call** encerra a sessão.

### RF002 — Preservação do trecho interrompido

Se houver texto parcial ao parar uma fonte, ele deve permanecer visível como trecho da reunião e ser enviado uma única vez como segmento finalizado antes de a fonte ser liberada.

### RF003 — Título sugerido e persistido

Toda reunião inicia com `Reunião sem título`. Ao compartilhar áudio de uma aba, o primeiro rótulo de aba não vazio e aproveitável substitui esse fallback uma única vez. Novos compartilhamentos não o substituem automaticamente.

### RF004 — Edição humana do título

A pessoa autenticada pode editar o título da reunião pela tela da call. O texto deve ser validado, persistido e reutilizado quando a reunião for consultada; uma edição humana nunca é sobrescrita pela captura de outra aba.

## Regras de negócio

* **RN001:** Reunião e `call_session` representam a mesma unidade de agrupamento; múltiplas fontes e pausas pertencem à mesma reunião até o encerramento explícito.
* **RN002:** O título automático é apenas uma sugestão inicial, baseada na primeira aba com rótulo útil. O fallback não é um erro.
* **RN003:** A atualização do título e a escrita de segmentos só são permitidas ao usuário dono, no tenant da sessão; clientes não escolhem `tenant_id`.
* **RN004:** Áudio e vídeo continuam não persistidos; somente texto e metadados da reunião são armazenados.

## Requisitos não funcionais

* A migration deve ser Flyway, compatível com sessões já existentes e reversível por remoção da coluna quando necessário.
* O título terá no máximo 160 caracteres após normalização; não pode ser vazio.
* Logs identificam a sessão e tenant, sem título, conteúdo de transcrição, segredos ou mídia.
* Chrome/Edge podem não disponibilizar um rótulo de aba específico; nesse caso o fallback e edição manual continuam disponíveis.

## Fluxo principal

1. A pessoa inicia a call ou uma fonte; uma reunião ativa é criada com o fallback ou com o título já editado.
2. A primeira aba compartilhada com rótulo aproveitável sugere seu título.
3. Fontes podem ser pausadas e retomadas; os segmentos permanecem na mesma reunião.
4. Ao parar uma fonte com texto pendente, esse texto é finalizado e salvo.
5. A pessoa pode editar o título.
6. Ao clicar em **Encerrar call**, todas as fontes são desligadas e a reunião é encerrada.

## Casos de erro

* Título vazio ou acima do limite é rejeitado no backend; a interface mantém o título anterior e informa o erro seguro.
* Aba sem rótulo aproveitável mantém o fallback, sem bloquear a captura.
* Tentativa de alterar uma sessão de outro tenant, de outro usuário ou inexistente retorna não encontrada.

## Testes e aceite

Os requisitos serão validados com Vitest, integração Spring/Testcontainers e Playwright. Não serão adicionadas dependências. Esta é uma única entrega vertical e retrocompatível, portanto não requer tickets separados.
