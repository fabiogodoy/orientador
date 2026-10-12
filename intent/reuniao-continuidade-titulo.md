# Intent — Continuidade e título das reuniões

## Metadados

* **Slug:** `reuniao-continuidade-titulo`
* **Data:** 2026-10-12
* **Status:** Aprovada
* **Autor:** Usuário e Codex

## Problema

Ao desligar o microfone ou parar o compartilhamento da aba, o texto que ainda estava em transcrição desaparece. Além disso, o ciclo de vida atual encerra a sessão quando nenhuma fonte está ativa, dividindo uma conversa retomada em reuniões distintas. As reuniões também não têm um título útil para consulta futura.

## Objetivo

Manter uma conversa inteira agrupada em uma única reunião até seu encerramento explícito, preservar o texto recebido de uma fonte interrompida e atribuir um título consultável que a pessoa possa corrigir.

## Usuários e valor

Usuários individuais e de organizações mantêm um histórico confiável de reuniões, sem perder contexto nem precisar identificar conversas por horário. Gestores do tenant poderão consultar títulos úteis quando a tela de histórico for entregue.

## Módulos impactados

* `frontend/`: ciclo de vida de captura, renderização e edição do título.
* `backend/`: sessão de reunião, autorização da alteração de título e persistência.
* PostgreSQL: título persistido em `call_sessions`.

## Critérios de sucesso

* Pausar qualquer fonte não encerra a reunião nem remove seus trechos exibidos.
* Encerrar a call explicitamente é a única ação que finaliza a reunião.
* O primeiro título de aba aproveitável é usado uma única vez; o fallback é “Reunião sem título”.
* A pessoa consegue editar o título, e a alteração é persistida no escopo do próprio tenant e usuário.
