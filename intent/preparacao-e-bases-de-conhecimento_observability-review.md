# Observability Review — Preparação e bases de conhecimento

## Parecer

**APROVADO.** Capacidade de diagnóstico adequada para esta entrega.

## Cobertura operacional

* Criação, edição e exclusão de base registram `knowledgeBaseId`, `tenantId` e `actorId`, sem nome/conteúdo.
* Criação de call registra `callId`, `tenantId` e flags `hasMeetingContext`/`hasKnowledgeBase`.
* A geração de sugestão mantém os logs existentes de ID, tenant, duração e quantidade de segmentos; o novo prompt não é logado.
* Falhas de autorização/ID inexistente são retornadas com código de API específico, sem dados de outro tenant.
* O frontend preserva o texto do formulário quando a API de bases falha e oferece a opção de seguir sem preparação.

## Métricas recomendadas para etapa posterior

Medir a taxa de calls com contexto/base, falhas de CRUD, tempo de geração de sugestões com/sem referência e tamanho agregado de prompts — sempre sem coletar o conteúdo textual.
