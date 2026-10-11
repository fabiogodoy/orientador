# Intent — Transcrição de microfone em tempo real

| Campo | Valor |
|---|---|
| Slug | `transcricao-microfone-tempo-real` |
| Data | 2026-10-11 |
| Status | Aprovada |

## Problema e objetivo

A tela de call do Orientador é uma demonstração estática e não escuta o usuário. Isso impede validar a proposta central do produto: transformar a fala autorizada do usuário em texto útil durante uma call. O objetivo é permitir que o usuário autenticado inicie e encerre conscientemente uma sessão de microfone, leia a transcrição parcial/final em tempo real e mantenha o histórico textual completo de sua sessão.

## Pessoas e módulos impactados

Usuários individuais e membros/gestores de organizações usam a captura. O `frontend/` controla permissão e apresentação; o `backend/` autentica, emite segredo efêmero, persiste segmentos e mantém a chave do provedor; PostgreSQL guarda apenas metadados e texto final.

## Restrições e riscos

* Áudio bruto não pode ser persistido, logado ou exposto entre tenants.
* A chave OpenAI permanente não pode chegar ao navegador; o usuário autorizou copiá-la do BJJ Control para um `.env` ignorado pelo Git.
* A captura exige HTTPS ou localhost e permissão explícita do microfone.
* Falha de permissão, segredo vencido, queda de conexão e erro do provedor precisam ser compreensíveis ao usuário.

## Critérios de sucesso

* Usuário autenticado inicia uma sessão e vê texto parcial/final enquanto fala.
* Ao encerrar, todos os segmentos finais da sessão pertencem somente ao seu `tenant_id`.
* Nenhuma rota, banco ou log contém áudio bruto ou chave permanente.
