# Test Plan — Preparação e bases de conhecimento para sugestões

## Escopo e evidências

| RF | Cenário feliz | Alternativo/erro | Evidência |
| --- | --- | --- | --- |
| RF001 | Criar/listar/editar/excluir base autorizada | Recusar outro tenant e membro não autor | JUnit e resposta HTTP |
| RF002 | Preparar com contexto/base e iniciar | Ignorar e iniciar sem dados | Vitest e teste de serviço |
| RF003 | Snapshot persistido na call | Edição/exclusão posterior não altera snapshot | JUnit |
| RF004 | Prompt contém referências delimitadas | Prompt vazio preserva fluxo anterior | JUnit do cliente de sugestões |
| RF005 | Painel acessível e erro preserva campos | API indisponível mostra mensagem | Vitest/build |

## Testes unitários e de integração

* Validar limites, normalização e criação de bases.
* Validar que tenant A não lista, lê, atualiza ou exclui base do tenant B.
* Validar autoria, gestor de organização e titular individual.
* Validar criação de call com e sem preparação e o snapshot imutável.
* Validar montagem do prompt com contexto/base e a ausência dos blocos quando não há preparação.

## Frontend / E2E

* Vitest: abrir/ignorar preparação, selecionar base, manter valores depois de erro e administrar bases.
* Build `npm run build`.
* Validação manual complementar no Chromium: preparar, iniciar e ignorar, pois as permissões de áudio não são confiáveis em teste automatizado.

## Regressão

* `startCall(title)` antigo deve continuar válido.
* Captura/transcrição e geração de sugestão sem preparação não podem mudar.
* DTO de histórico não deve conter contexto, snapshot ou conteúdo de base.

## Segurança e multi-tenancy

Cobrir todas as mutações e leituras com identidade autenticada, tenant distinto e usuário não autorizado. Verificar que logs de teste não contêm texto informado.
