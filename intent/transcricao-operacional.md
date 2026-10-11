# Intent — Transcrição operacional da call

## Metadados

* **Slug:** `transcricao-operacional`
* **Data:** 2026-10-11
* **Status:** Aprovada pelo solicitante

## Problema

O painel de conversa aparenta funcionar sem estar conectado à captura real: mostra falas de demonstração, oculta a causa do erro de inicialização e não torna evidente que os dados são persistidos. Isso impede o usuário de confiar no Orientador durante uma reunião.

## Evidências

* A tela local exibiu `Não foi possível iniciar a transcrição do microfone agora` ao acionar o microfone.
* O processo backend local foi iniciado antes da chave e das migrations/código de transcrição atuais.
* O frontend seleciona uma transcrição de demonstração quando não há segmentos ao vivo.
* A integração direta, sem expor segredo, criou sessão Realtime com HTTP 200.

## Objetivo

Permitir que um usuário autenticado inicie uma call local e veja somente as transcrições reais produzidas durante ela, com falhas compreensíveis e texto final persistido no banco do tenant.

## Usuários e módulos impactados

Usuários individuais, usuários e gestores de organização; `frontend/`, `backend/` e PostgreSQL local de desenvolvimento.

## Riscos

Permissões de microfone, disponibilidade do navegador/provedor, reinício controlado do backend local, confidencialidade de credenciais e isolamento por `tenant_id`.

## Critérios de sucesso

* O painel não exibe falas fictícias antes de haver transcrição real.
* A falha de inicialização identifica a etapa afetada sem expor segredos.
* O backend local iniciado com a configuração atual aplica V02/V03 e possui `call_sessions` e `transcript_segments`.
* Segmentos finalizados são persistidos no tenant e exibidos no painel durante a call.

## Perguntas em aberto

Nenhuma. O solicitante confirmou a entrega em uma única correção.
