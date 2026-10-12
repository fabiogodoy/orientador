# PRD — Consulta de reuniões

Status: Aprovado
Origem: `intent/consulta-reunioes.md`

## Escopo

Dentro: rota autenticada de listagem, rota de detalhe somente leitura, APIs paginadas e autorização por perfil. Fora: gravações, sugestões persistidas, edição/exclusão, filtros, busca, exportação e mudança de papéis.

## Requisitos funcionais

### RF001 — Navegação para reuniões

A barra superior da call oferece acesso a `/app/reunioes`. A tela exige autenticação e preserva os caminhos atuais de login/termos/cadastro.

Aceite: pessoa autenticada alcança a listagem; pessoa sem sessão recebe o fluxo de autenticação existente.

### RF002 — Lista de reuniões encerradas

A lista mostra somente sessões `ENDED`, da mais recente para a mais antiga, em páginas de 20. Cada item mostra título, início, duração e, quando a consulta não for de uma reunião própria, o nome da pessoa responsável.

Aceite: estado vazio é claro; paginação não mistura nem repete itens; cada item possui acesso ao detalhe.

### RF003 — Detalhe somente leitura

`/app/reunioes/:sessionId` mostra título, início, fim/duração, responsável quando aplicável e todos os segmentos persistidos em ordem cronológica, com identificação de falante e horário de finalização.

Aceite: não há controles de edição, captura, sugestão ou áudio; sugestões transitórias nunca aparecem.

### RF004 — Autorização de consulta

O backend decide o escopo a partir da identidade autenticada:

- `PLATFORM_ADMIN`: todas as reuniões, inclusive entre tenants;
- `ORGANIZATION_MANAGER`: todas as reuniões do próprio tenant;
- `ORGANIZATION_MEMBER` e `INDIVIDUAL`: somente as próprias reuniões.

Aceite: ID de reunião fora do escopo retorna ausência de recurso, sem revelar dados; apenas o admin tem consulta global.

## Regras de negócio

- RN001: somente reunião encerrada é listável ou consultável nesta versão.
- RN002: a ordenação usa `started_at` decrescente; a página contém no máximo 20 itens.
- RN003: a duração é calculada pela diferença entre início e encerramento persistidos.
- RN004: transcrição é exibida por `sequence_number`; áudio e sugestões não fazem parte do histórico.
- RN005: consultas de admin da plataforma são registradas sem conteúdo de transcrição nos logs.

## Não funcionais

- RNF001: toda consulta autenticada valida a permissão no backend; o frontend não é autoridade.
- RNF002: gestores nunca cruzam tenants; membros e individuais nunca cruzam `user_id` dentro do tenant.
- RNF003: página e detalhe devem permanecer utilizáveis em telas desktop e mobile e por teclado.
- RNF004: as consultas paginadas devem usar índice compatível com status e data.

## Fluxos

1. A pessoa abre “Reuniões”, recebe a primeira página autorizada e escolhe um item.
2. A aplicação abre o detalhe e mostra somente os dados retornados pelo servidor.
3. Sem reuniões no escopo, a aplicação mostra estado vazio.
4. URL de ID inexistente, ativo ou não autorizado mostra “reunião não encontrada”.

## Estratégia de entrega

Backend, frontend e migration formam uma única fatia vertical segura; tickets e ADR não são necessários. A política de acesso já existe no glossário e na arquitetura; esta entrega a aplica às consultas de reunião.
