# Intent — Administração escalável de bases de conhecimento

## Metadados

* **Slug:** `administracao-bases-de-conhecimento`
* **Data:** 2026-10-14
* **Autor:** Usuário e Codex
* **Status:** Aprovada

## Resumo executivo

Com o crescimento da biblioteca de conhecimento de um tenant, a administração atual concentrada em um modal deixa de ser encontrável e escalável. A área autenticada também não possui uma navegação persistente entre os recursos já existentes. A entrega deve tornar a administração de bases uma tarefa clara, pesquisável e paginada, sem alterar o início automático da call ao conectar uma guia.

## Problema

Usuários não têm uma área administrativa apropriada para localizar e manter muitas bases de conhecimento. A lista integral em modal perde usabilidade à medida que a biblioteca cresce, e a ausência de navegação lateral dificulta chegar a Reuniões, Bases de conhecimento e Perfil. A remoção física de uma base também não preserva a evidência de quem a excluiu e quando.

## Objetivo

Permitir que pessoas autenticadas encontrem, criem, editem e desativem bases de conhecimento do próprio tenant por uma área administrativa responsiva, mantendo uma navegação consistente e uma trilha mínima de auditoria para exclusões.

## Usuários impactados

* Usuário individual, que administra as próprias bases.
* Membro de organização, que consulta bases do tenant e administra as que criou.
* Gestor de organização, que administra as bases do tenant conforme as permissões vigentes.
* Admin da plataforma, indiretamente, por poder auditar o funcionamento do produto conforme suas permissões existentes.

## Módulos e sistemas impactados

* `frontend/` — navegação autenticada, rota de bases e experiência responsiva.
* `backend/` — listagem pesquisável e paginada, exclusão lógica e autorização.
* PostgreSQL — dados de exclusão lógica e auditoria, além de índice compatível com a consulta.

## Processo atual

O usuário abre um modal na tela de call para listar todas as bases, criar, editar ou excluí-las. A lista não é paginada nem pesquisável. A exclusão remove o registro definitivamente. A navegação entre call, reuniões e configurações está distribuída pela interface, sem uma barra lateral persistente.

## Resultado esperado

O usuário encontra uma navegação lateral em desktop e um menu sanduíche em mobile. Pela rota de bases, consulta somente as bases ativas do seu tenant em páginas de 20 itens, ordenadas por atualização e filtráveis por nome; pode criar e editar bases autorizadas e confirmar sua exclusão lógica. Bases excluídas deixam de estar disponíveis para administração, busca e preparação de novas reuniões, enquanto snapshots históricos das calls permanecem inalterados.

## Regras de negócio conhecidas

* **RN001:** Base de conhecimento pertence a um único tenant; nunca pode atravessar tenants.
* **RN002:** O criador ou gestor organizacional administra uma base; no tenant individual, o titular a administra.
* **RN003:** A exclusão é lógica e registra usuário e instante de exclusão; não há restauração nem painel de auditoria nesta entrega.
* **RN004:** Bases excluídas não são listadas, pesquisadas nem selecionáveis em novas preparações de reunião.
* **RN005:** Uma cópia de base já vinculada a uma reunião permanece preservada, mesmo que a base original seja excluída depois.
* **RN006:** A call continua iniciando automaticamente no fluxo atual de conexão da guia; não haverá item “Nova reunião” no menu lateral.

## Restrições

* Não criar CRUD de reuniões nesta entrega; Reuniões continua sendo histórico de calls.
* Não criar restauração, lixeira visível, tela de auditoria, upload, arquivos, URLs ou busca semântica.
* Não registrar nome ou conteúdo das bases nos logs.
* Manter os limites e as permissões definidos na entrega de preparação e bases de conhecimento.

## Riscos

* Uma consulta sem filtro de tenant ou de exclusão pode expor conteúdo ou tornar bases inativas selecionáveis.
* Uma migration ou índice inadequado pode degradar a listagem em tenants grandes.
* A mudança de layout pode regressar a tela ativa de call, principalmente em dispositivos móveis.
* A alteração da semântica de exclusão pode afetar integrações existentes que esperam ausência física do registro.

## Critérios de sucesso

* **CS001:** A pessoa autenticada alcança Reuniões, Bases de conhecimento e Perfil pelo menu lateral; Sair permanece fixo no rodapé em desktop e acessível pelo menu móvel.
* **CS002:** A rota de bases mostra apenas dados ativos e autorizados do tenant, com busca por nome e páginas de 20 resultados ordenadas pela última atualização.
* **CS003:** Criação, edição e exclusão lógica respeitam as permissões atuais e preservam a base preenchida em caso de erro.
* **CS004:** A exclusão registra ator e instante no backend; a base deixa de aparecer e não pode ser usada em novas calls, sem afetar snapshots históricos.
* **CS005:** Testes cobrem isolamento entre tenants, autorização, paginação, busca, exclusão lógica e comportamento responsivo principal.

## Perguntas em aberto

Nenhuma. O escopo foi confirmado pelo solicitante em 2026-10-14.
