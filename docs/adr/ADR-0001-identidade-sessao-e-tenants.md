# ADR-0001 — Identidade, sessão e tenants

- Data: 2026-10-10
- Status: Aprovada
- Relacionado: `intent/autenticacao-cadastro.md`, `intent/autenticacao-cadastro_prd.md`, `intent/autenticacao-cadastro_impact.md`

## Contexto e decisão

O primeiro fluxo de contas estabelece uma fronteira permanente de dados de clientes. Usaremos autenticação por e-mail/senha com hash adaptativo, sessão mantida no backend e cookie HttpOnly, com CSRF para escritas. Cada pessoa individual tem tenant próprio; cada organização tem tenant próprio e nasce com o primeiro gestor. Identidade, papel e tenant são derivados no servidor, nunca do payload. O fim da avaliação é reavaliado no servidor em toda rota autenticada.

## Alternativas e justificativa

Tokens persistidos no armazenamento do navegador foram descartados pela exposição a JavaScript e maior custo de revogação. Um tenant implícito pelo e-mail ou apenas no frontend foi descartado porque não impõe isolamento verificável. Sessão no servidor é simples para a aplicação web na mesma família de domínios, permite encerramento explícito e pode evoluir para store compartilhado se houver múltiplas instâncias.

## Consequências e limites

O backend precisa configurar CORS com credenciais, CSRF e cookies seguros por ambiente. Sessões em memória servem ao desenvolvimento e a uma instância inicial; operação com múltiplas réplicas exigirá store compartilhado antes do scale-out. A criação pública não oferece papel admin. O acesso administrativo futuro precisará de processo próprio, com auditoria. Verificação de e-mail e recuperação de senha continuam pendentes por ausência de provedor de e-mail. O isolamento lógico por `tenant_id` exige disciplina e testes em todas as próximas entidades; não é isolamento físico por banco.

## Reversão e revisão

Mudança de mecanismo de sessão exigirá migração planejada e encerramento seguro de sessões existentes. Revisar esta ADR quando houver múltiplas instâncias, integração SSO, membros organizacionais ou necessidade de isolamento físico entre clientes.
