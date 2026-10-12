# Impact Analysis — Continuidade e título das reuniões

* **Data:** 2026-10-12
* **Intent:** `intent/reuniao-continuidade-titulo.md`
* **PRD:** `intent/reuniao-continuidade-titulo_prd.md`
* **Recomendação:** Implementar

## Impactos

| Módulo | Impacto |
|---|---|
| Frontend | Alto: controla ciclo de vida local, texto pendente e formulário de título. |
| Backend | Médio: contrato de criação/atualização de sessão e autorização. |
| PostgreSQL | Médio: nova coluna `title` em `call_sessions`. |
| Integração OpenAI | Baixo: nenhuma alteração do áudio, segredo ou modelo. |

## Dados e isolamento

A coluna de título pertence à própria `call_session`, já limitada por `tenant_id` e `user_id`. A atualização usará os mesmos filtros de proprietário e tenant das operações existentes. Não serão persistidos áudio, vídeo, rótulos de faixas além do título selecionado nem transcrição de outro tenant.

## Riscos e mitigação

| Risco | Probabilidade | Impacto | Mitigação |
|---|---:|---:|---|
| Encerramento de fonte duplicar o trecho final | Média | Média | Consumir e limpar o parcial por fonte antes de fechar a conexão; testes de uma única escrita. |
| Rótulo da mídia ser genérico | Média | Baixo | Fallback estável e edição humana. |
| Fonte pausada manter sessão indefinidamente | Média | Baixo | Explicar estado pausado; encerramento permanece explícito, conforme decisão do produto. |
| Alteração de título de outra reunião | Baixa | Alta | `UPDATE` filtrado por id, tenant e usuário; teste de isolamento. |

## Regressões e rollback

Os controles de fontes continuam independentes e a sessão ainda rejeita segmentos após o encerramento. A migration adiciona uma coluna com valor para registros existentes; rollback técnico consiste em voltar frontend/backend e, se necessário, remover a coluna em uma migration posterior, preservando segmentos. Não é necessária ADR: a mudança esclarece o ciclo de vida já previsto na ADR-0003, sem nova integração ou fronteira arquitetural.

## Estratégia de testes

Testes de componente cobrirão pausa, preservação do parcial e título; integração cobrirá migration, edição autorizada e isolamento entre tenants; E2E verificará edição visual. Build e testes oficiais dos dois módulos serão executados.
