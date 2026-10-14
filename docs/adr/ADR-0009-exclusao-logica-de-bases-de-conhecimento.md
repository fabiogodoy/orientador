# ADR-0009 — Exclusão lógica auditável de bases de conhecimento

## Metadados

* **Data:** 2026-10-14
* **Autor:** Usuário e Codex
* **Status:** Aprovada
* **Relacionado:** `intent/administracao-bases-de-conhecimento.md`

## Contexto

Bases de conhecimento são dados reutilizáveis por tenant. A remoção física existente apagava a evidência de qual pessoa a removeu e em que momento, embora calls já iniciadas preservassem um snapshot próprio. Com uma biblioteca maior, a administração também passa a depender de consultas que precisam excluir registros inativos de modo consistente.

## Decisão

Uma base excluída será mantida fisicamente e marcada com `deleted_at` e `deleted_by_user_id`. Todos os caminhos funcionais de listagem, busca, edição, exclusão, seleção em preparação e snapshot para nova call tratam registros marcados como inexistentes. A marcação é definitiva nesta fase: não haverá restauração, lixeira nem interface de auditoria.

## Alternativas consideradas

* **Exclusão física:** simples, mas não preserva ator e instante da ação e dificulta suporte/auditoria.
* **Exclusão lógica com restauração para usuários:** permite recuperação, mas amplia permissões, interface e risco de reativação indevida; não foi solicitada.
* **Log de eventos separado com exclusão física:** preservaria auditoria, mas adiciona uma entidade e consultas extras sem benefício proporcional nesta fase.

## Consequências

* Consultas de dados ativos devem filtrar `deleted_at IS NULL` sempre, além de `tenant_id` e das regras de autorização.
* Snapshots já gravados em `call_sessions` continuam imutáveis e não dependem da atividade futura da base.
* A migration é aditiva; uma reversão operacional desativa os novos caminhos sem apagar marcadores. Ela não reativa bases excluídas.
* Índices de bases ativas são necessários para que registros históricos não degradem paginação e busca.

## Segurança e privacidade

O backend determina o ator de exclusão pela sessão autenticada e nunca por dado enviado pelo cliente. Os campos de auditoria não são expostos a interfaces comuns nesta entrega. Logs registram IDs operacionais, não nome ou conteúdo da base.

## Revisão

Revisitar esta decisão quando houver requisito de restauração, política formal de retenção/eliminação definitiva ou demanda de auditoria visível para gestores/admins.
