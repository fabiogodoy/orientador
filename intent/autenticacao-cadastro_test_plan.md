# Test Plan — Autenticação e cadastro

- Data: 2026-10-10
- Origem: `intent/autenticacao-cadastro_prd.md`
- Banco de integração autorizado: **somente PostgreSQL efêmero de Testcontainers**. Nunca `desenv_orientador`.

## Matriz de cobertura

| RF/RN | Feliz | Alternativo/erro | Evidência |
|---|---|---|---|
| RF001 | login e opções de cadastro renderizam | navegação por teclado e campos inválidos | teste React + E2E |
| RF002/RN001-004 | individual cria tenant e aceite | senha curta/divergente, aceite ausente | integração + componente |
| RF003/RN001,007 | organização cria gestor | nome da organização ausente; sem membro/admin | integração + E2E |
| RF004/RN004,008 | Termos públicos e versão persistida | versão errada e checkbox não marcado | integração + E2E |
| RF005/RN003,006 | login e logout funcionam | senha errada, sessão encerrada | integração + E2E |
| RF006/RN005,008 | avaliação ativa e prazo exibido | prazo exato e sessão antiga expirada | unitário + integração |
| RF007/RNF002 | identidade/tenant próprios | acesso anônimo ou tenant alheio | integração + componente |
| RF008/RN002,007 | e-mail único; campos controlados pelo servidor | duplicata; payload com role/tenant inválidos | integração |

## Unitários

CT001: normalização de e-mail e rejeição de valor inválido (RN002). CT002: cálculo de 168 horas e limite exclusivo de vencimento (RN005). CT003: validação de senha, organização e aceite atual (RN003-004). CT004: ausência de campos administrativos no contrato público (RN007).

## Integração

CT005: cadastro individual transacional e hash de senha. CT006: cadastro organizacional cria somente gestor e tenant próprio. CT007: e-mail duplicado não cria segundo tenant. CT008: login correto, incorreto e logout com sessão/CSRF. CT009: requisição mutável sem CSRF é rejeitada. CT010: sessão criada antes do prazo deixa de acessar após expiração; login expirado bloqueado. CT011: identidades de tenants A/B não retornam dados cruzados. CT012: Termos com versão inválida não geram cadastro. Todos em PostgreSQL efêmero via Testcontainers; validar datasource efetiva antes de executar.

## E2E e visual

CT013: visitante lê Termos, cadastra individual, faz login, vê seus dados e sai. CT014: visitante cadastra organização e vê perfil gestor. CT015: formulário não envia sem aceite/senha válida e comunica erros. CT016: viewport desktop e móvel; foco/labels e navegação. O E2E usa Playwright após builds aprovados e aplicação local ativa. Caso Docker indisponível, registrar bloqueio de integração sem apontar testes ao banco persistente.

## Regressão e segurança

CT017: conferir que `landing/` permanece não implementada e assets de marca seguem íntegros. CT018: cadastro público não cria admin nem aceita tenant/role. CT019: logs não contêm senha, CSRF ou sessão. CT020: CORS não libera origem arbitrária. CT021: auditoria de governança passa. Resultado e evidência real serão preenchidos no Validation Report; nenhum teste é presumido executado.
