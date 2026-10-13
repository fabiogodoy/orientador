# Impact Analysis — Preparação e bases de conhecimento para sugestões

## Metadados

* **Slug:** `preparacao-e-bases-de-conhecimento`
* **Data:** 2026-10-13
* **Intent:** `intent/preparacao-e-bases-de-conhecimento.md`
* **PRD:** `intent/preparacao-e-bases-de-conhecimento_prd.md`

## Resumo e complexidade

Funcionalidade nova de dados, API, autorização e interface que acrescenta referências opcionais às sugestões. Complexidade técnica e de negócio: **média**; operacional: **baixa a média**.

## Módulos impactados

| Módulo | Impacto |
| --- | --- |
| `frontend/` | Sim — preparação, seleção e administração de bases. |
| `backend/` | Sim — CRUD, autorização, criação de call e prompt. |
| PostgreSQL | Sim — tabela nova e colunas de snapshot. |
| `landing/` | Não. |
| Provedor de sugestões | Sim — prompt passa a conter referências opcionais. |

## Dados e banco

Nova tabela multi-tenant `knowledge_bases` com índice por `tenant_id` e atualização. As colunas anuláveis em `call_sessions` guardam o contexto e snapshot da base. A migration é aditiva; o rollback operacional consiste em interromper o uso das novas APIs/campos sem apagar dados existentes.

## Multi-tenancy e segurança

Risco alto se uma base puder ser lida ou modificada entre tenants. Mitigação: cada SQL inclui `tenant_id` da identidade autenticada; IDs externos não são confiáveis; ausência de autorização se comporta como recurso não encontrado. Autor da base e gestor de organização são verificados no servidor. Conteúdo não é incluído em logs, histórico ou resumo executivo.

## Integrações e privacidade

O conteúdo selecionado é enviado ao provedor de sugestões junto com a call, portanto é dado potencialmente sensível. Limites de tamanho reduzem custo e exposição; o prompt trata transcrição, contexto e base como conteúdo não confiável e não como instruções. Nenhuma nova credencial/dependência será usada.

## Regressões potenciais

* Alterar criação de calls pode impedir que o fluxo “iniciar sem preparação” funcione.
* Aumentar o prompt pode causar timeout ou ultrapassar limites do provedor.
* Um payload antigo de `startCall` deve continuar válido.
* Expor snapshots em DTOs de histórico violaria privacidade.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Vazamento entre tenants | Baixa | Alto | Filtros de tenant e testes negativos em todas operações. |
| Alegação factual indevida pela IA | Média | Alto | Instruções explícitas e testes de montagem do prompt. |
| Base alterada muda uma call antiga | Baixa | Médio | Snapshot na criação da call. |
| Prompt excessivo | Média | Médio | Limites de 6k/12k caracteres e uma única base. |
| Regressão da captura | Baixa | Alto | Caminho sem preparação e testes existentes preservados. |

## ADR

**Necessária.** A mudança introduz uma estrutura multi-tenant reutilizável e fixa a decisão de snapshot por call para preservar a referência utilizada.

## Estratégia de testes

Cobrir CRUD, regras de autor/gestor, isolamento tenant, seleção/snapshot, chamada de sugestão com e sem preparação, UI de omissão e regressão de início de call.

## Parecer

**Implementar com ajustes controlados.** A solução é alinhada ao produto, desde que autorização, snapshot e privacidade sejam validados antes da entrega.
