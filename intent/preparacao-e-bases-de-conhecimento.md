# Intent — Preparação e bases de conhecimento para sugestões

## Metadados

* **Slug:** `preparacao-e-bases-de-conhecimento`
* **Data:** 2026-10-13
* **Autor:** Usuário e Codex
* **Status:** Aprovada

## Resumo executivo

Hoje as sugestões durante uma call usam somente a transcrição em curso. O usuário não consegue informar o objetivo daquela conversa nem reaproveitar conhecimento confiável da sua empresa ou trajetória. Isso reduz a precisão e a utilidade da orientação em situações como entrevistas e negociações.

## Problema

O usuário inicia uma reunião sem um espaço para preparar a IA com informações que já conhece. A IA deve continuar a orientar quando não houver preparação, mas não pode afirmar como fatos preços, políticas, qualificações ou capacidades que não estejam na transcrição ou em uma base selecionada.

## Objetivo

Permitir que o usuário, opcionalmente antes da captura de áudio, escreva o contexto específico da reunião e selecione uma base de conhecimento reutilizável do seu tenant, para receber sugestões mais situadas, sem transformar hipóteses em fatos.

## Usuários impactados

* Usuário individual.
* Membro de organização.
* Gestor de organização, que também pode administrar bases do tenant.

## Processo atual

O usuário inicia a captura e as sugestões consideram a transcrição e o resumo interno transitório. Não há preparação, seleção de conhecimentos nem cadastro reutilizável.

## Resultado esperado

Antes de escolher microfone ou guia, o usuário pode abrir uma preparação, inserir o contexto daquela reunião e selecionar uma base já cadastrada. Pode ignorar essa etapa e seguir com o comportamento atual. A base é selecionada antes da reunião e o contexto é sempre fornecido para aquela reunião. Ambos são persistidos com a call, mas não aparecem no histórico, transcrição, resumo executivo ou na orientação como conteúdo exposto.

## Regras de negócio conhecidas

* **RN001:** Contexto da reunião é opcional, textual e específico da call.
* **RN002:** Bases de conhecimento são textuais, reutilizáveis e isoladas por `tenant_id`.
* **RN003:** A seleção usa uma base pré-existente; não há criação de base dentro da preparação da reunião.
* **RN004:** Sem contexto e sem base selecionada, as sugestões preservam o comportamento atual.
* **RN005:** A IA pode usar conhecimento geral para formular uma resposta útil, mas não pode apresentar como fato dados não sustentados pela transcrição, pelo contexto ou pela base selecionada.
* **RN006:** Em organizações, qualquer membro pode ler e selecionar bases do tenant; apenas o criador ou gestor da organização pode editar ou excluir uma base. Em conta individual, o titular administra as próprias bases.
* **RN007:** Contexto e cópia da base usada são salvos com a call para continuidade e auditoria, mas não são exibidos no histórico da reunião.

## Restrições

* Não incluir upload, arquivos, URLs ou ingestão de documentos nesta entrega.
* Não criar uma sugestão automática apenas pela preparação: o gatilho atual de sugestões é preservado.
* Dados e operações devem respeitar o isolamento multi-tenant e nunca ser enviados ao frontend de outro tenant.
* Não registrar conteúdo de contexto ou de bases em logs.

## Riscos

* Uma base mal escrita pode induzir uma orientação pouco apropriada; as instruções devem tratá-la como referência e exigir transparência sobre incerteza.
* Falha de isolamento pode expor conhecimento interno entre organizações.
* Alterar uma base após a call não pode mudar retroativamente a referência usada naquela reunião.

## Critérios de sucesso

* **CS001:** O usuário pode ignorar a preparação e iniciar a call exatamente como antes.
* **CS002:** O usuário pode criar, editar, excluir e selecionar bases de seu próprio tenant conforme as permissões.
* **CS003:** A solicitação de sugestão usa o contexto e a cópia da base selecionada, quando existirem.
* **CS004:** Texto de contexto/base não é mostrado na transcrição, no histórico ou no resumo executivo.
* **CS005:** Testes comprovam autorização, isolamento entre tenants, cópia histórica e regressão sem preparação.

## Decisão de governança

Esta Intent permanece isolada sob o slug `preparacao-e-bases-de-conhecimento` no branch atualmente usado por uma entrega anterior ainda não reintegrada. O isolamento em sessão/branch separada não é seguro enquanto há mudanças locais não concluídas; nenhum artefato dessa Intent será misturado na documentação de requisitos da Intent anterior.
