# Intent — Tela de call ao vivo

## Metadados

| Campo | Valor |
| --- | --- |
| Slug | `tela-call-ao-vivo` |
| Data | 2026-10-11 |
| Autor | Usuário e Codex |
| Status | Aprovada |

## Resumo executivo

O Orientador já possui autenticação e uma área inicial, mas ainda não materializa a experiência central do produto durante uma reunião. Esta entrega introduz uma tela demonstrativa, autenticada e com dados locais, para tornar visível a proposta de valor de acompanhar uma call, ler a transcrição e receber sugestões contextualizadas.

## Problema

Hoje, após o login, a pessoa vê apenas informações de conta e período de teste. Ela não consegue compreender como o Orientador apoiará uma conversa ao vivo nem avaliar a legibilidade da transcrição e das sugestões em contexto.

## Contexto e objetivo

O produto visa apoiar reuniões online sem substituir o julgamento do usuário. A meta desta etapa é oferecer uma representação visual fiel do fluxo principal: status e duração da call, transcrição em formato conversacional e uma sugestão de IA ligada à última fala do cliente. O resultado esperado é uma home autenticada que comunique esse fluxo sem alegar captura, transcrição ou IA reais.

## Usuários impactados

* Usuários individuais e usuários de organizações: passam a visualizar a experiência principal do produto.
* Gestores: podem compreender a experiência que seus membros terão.

## Módulos impactados

* `frontend/`: interface autenticada em `/app/`.

Nenhum backend, landing, banco de dados, API ou integração externa é impactado.

## Processo atual e dores

Após autenticar, a pessoa encontra uma página de conta genérica e um aviso de que o acompanhamento de reuniões virá em breve. Isso gera distância entre a promessa do produto e a experiência apresentada.

## Benefícios esperados

* Tornar o valor do Orientador compreensível assim que o usuário entrar.
* Permitir avaliação de design, hierarquia e interações antes da integração de áudio e IA.
* Preservar transparência: tudo será explicitamente uma simulação local.

## Restrições e hipóteses

* Esta etapa é visual, com dados mockados e estados exclusivamente locais.
* Não será solicitada permissão de microfone, seleção/captura de aba, transmissão ou persistência de áudio.
* Não haverá chamadas à API de sugestões, WebSocket, novas tabelas ou dependências.
* A home permanecerá protegida pela autenticação já existente.

## Riscos

* A interface pode parecer uma call real; mitigação: rótulos e comportamentos deixam claro que é uma demonstração simulada.
* A troca da home pode afetar o teste de conta atual; mitigação: manter autenticação, logout e cobrir o novo conteúdo em testes.

## Critérios de sucesso

* CS001 — Em `/app/`, um usuário autenticado visualiza estado e duração da call, transcrição e painel de sugestões.
* CS002 — Os controles simulam seus estados sem acessar dispositivos, áudio ou serviços remotos.
* CS003 — A tela se adapta a desktop e telas estreitas sem ocultar o conteúdo principal.

## Perguntas em aberto

Nenhuma. O acesso em `/app/` e a simulação local dos controles foram confirmados pelo solicitante.
