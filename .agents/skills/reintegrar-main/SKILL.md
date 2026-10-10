---
name: reintegrar-main
description: "Integra uma entrega na main e publica origin/main, preservando pendências externas do worktree. Use ao encerrar uma entrega versionável, depois dos testes e reviews, antes do Validation Report."
---

# Skill: Reintegrar Main

Use esta skill depois dos testes e das reviews de implementação/segurança/observabilidade, antes de concluir o Validation Report.

## Resultado obrigatório

As alterações da entrega atual pertencem à `main` local e a `origin/main`. Pendências externas ao escopo são preservadas, não entram no commit e são registradas no Validation Report.

## Delimitar o escopo

1. Ler Intent, PRD, Impact Analysis, plano de testes e reviews da entrega.
2. Listar `git status --short` e separar os arquivos da entrega dos itens externos.
3. Nunca usar `git add .`, `git commit -a` ou glob amplo. Adicionar ao índice somente caminhos pertencentes à Intent.
4. Não remover, substituir, rotacionar ou mascarar credenciais/configurações existentes. Quando valores forem versionados por orientação do projeto (ver `AGENTS.md`), não os exibir em comandos, logs ou relatórios.

## Sincronizar e integrar

1. Executar `git fetch --prune origin` e registrar o SHA de `origin/main`.
2. Se a entrega estiver em branch própria, integrar a `origin/main` atual nessa branch. Em caso de conflito, executar `$resolving-merge-conflicts`, rastreando cada hunk à sua Intent/PRD e rodando novamente as validações afetadas.
3. Commitar e enviar somente a entrega.
4. Integrar a branch na `main`, validar conflitos, executar novamente as validações proporcionais quando necessário e executar `git push origin main`.
5. Se a entrega foi feita diretamente na `main` (projetos pequenos, sem branch protegida — ver decisão do bootstrap em `AGENTS.md`), commitar somente seus arquivos e enviar `git push origin main`.

## Worktree com pendências externas

Pendências externas não bloqueiam esta etapa. Se impedirem checkout/merge na cópia principal, usar um worktree temporário criado a partir de `origin/main` para a integração, sem mover, apagar ou stashear alterações externas. Remover apenas o worktree temporário criado por esta execução após a integração bem-sucedida.

## Evidência

Atualizar o Validation Report com:

* branch de origem e SHA de `origin/main` usado;
* tipo de integração e SHA final da `main`;
* resultado de `git push origin main`;
* arquivos/itens externos ainda pendentes, identificados como fora do escopo.

Não aprovar a entrega sem evidência de que suas alterações foram publicadas em `origin/main`.
