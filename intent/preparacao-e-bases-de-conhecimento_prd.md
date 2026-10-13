# PRD — Preparação e bases de conhecimento para sugestões

## Metadados

* **Slug:** `preparacao-e-bases-de-conhecimento`
* **Data:** 2026-10-13
* **Origem:** `intent/preparacao-e-bases-de-conhecimento.md`
* **Status:** Aprovado

## Escopo

### Dentro do escopo

* Biblioteca textual de bases de conhecimento por tenant.
* Cadastro, edição, exclusão e seleção de bases nas configurações.
* Preparação opcional antes das permissões de microfone/guia: título, contexto pontual e uma base já existente.
* Persistência do contexto e da cópia da base selecionada na sessão de call.
* Inclusão segura dessas referências no pedido de sugestão.

### Fora do escopo

* Arquivos, links, crawling, vetorização, RAG, integrações externas e pesquisa semântica.
* Alterar contexto ou base depois de iniciada a call.
* Exibir contexto/base no histórico, resumo executivo ou transcrição.
* Criar bases dentro do painel de preparação.

## Requisitos funcionais

### RF001 — Administrar bases de conhecimento

O usuário autenticado acessa Configurações e pode listar as bases visíveis ao seu tenant, criar uma base com nome e texto, e editar/excluir uma base autorizada.

**Aceite:** toda operação é autenticada; uma base de outro tenant nunca é retornada, alterada ou excluída; membro de organização sem autoria não altera a base; gestor pode alterá-la; conta individual administra suas bases.

### RF002 — Preparar uma reunião opcionalmente

Antes de pedir permissões de captura, o usuário pode abrir o painel “Preparar reunião”, informar título e contexto textual daquela reunião e selecionar no máximo uma base disponível. Também pode ignorar o painel e iniciar a call.

**Aceite:** ignorar a preparação mantém o fluxo atual; o contexto e a seleção são definidos apenas antes do início; não há seletor/criação tardios em uma call ativa.

### RF003 — Persistir referências da preparação

Ao iniciar uma call, o backend persiste o contexto informado e uma cópia imutável do nome e conteúdo da base selecionada, quando presentes.

**Aceite:** uma edição/exclusão posterior da base não muda a cópia da call; APIs de histórico e análise executiva não retornam esses campos.

### RF004 — Usar referências nas sugestões

Ao gerar uma sugestão, o backend recupera somente a preparação da própria call e a envia junto à transcrição e ao resumo interno. A instrução ao modelo diferencia fatos fornecidos de raciocínio geral.

**Aceite:** se não houver preparação, o formato enviado preserva o comportamento atual; com preparação, o modelo recebe os blocos de contexto/base; a instrução proíbe inventar fatos e permite resposta útil baseada em conhecimento geral sem alegar que dados específicos foram confirmados.

### RF005 — Interface e feedback

O painel de preparação e a tela de bases apresentam campos legíveis, limites de tamanho e estados de carregamento/erro. O fluxo de captura somente continua depois de o usuário iniciar ou ignorar a preparação.

**Aceite:** controles são navegáveis por teclado, rótulos estão associados aos campos e erros de API não descartam o texto preenchido.

## Requisitos não funcionais

* **RNF001 — Segurança:** validar autenticação, autoria/gestão e tenant no backend. Nunca confiar no ID da base vindo do navegador.
* **RNF002 — Privacidade:** não expor conteúdo de preparação nas respostas de histórico nem em logs; conteúdo é enviado ao provedor de sugestões somente para a call em que foi selecionado.
* **RNF003 — Multi-tenancy:** todas as leituras e escritas de `knowledge_bases` e de dados de preparação filtram `tenant_id`.
* **RNF004 — Performance:** lista de bases limitada e ordenada por atualização; conteúdos são limitados para controlar tamanho do prompt.
* **RNF005 — Compatibilidade:** manter navegadores Chromium desktop e o fluxo existente de captura intactos.
* **RNF006 — Observabilidade:** logs estruturados registram IDs, tenant, operação e duração, sem o conteúdo das bases/contextos.

## Regras de negócio

* **RN001:** Contexto é texto opcional de até 6.000 caracteres, específico da call.
* **RN002:** Nome da base tem de 1 a 120 caracteres e conteúdo de 1 a 12.000 caracteres.
* **RN003:** Uma call pode ter no máximo uma base selecionada.
* **RN004:** O snapshot da base é salvo na call e não acompanha futuras edições.
* **RN005:** Só criador ou gestor organizacional pode editar/excluir uma base organizacional; no tenant individual, o titular é autorizado.
* **RN006:** A IA trata a base e o contexto como referência; se precisar ir além deles, pode oferecer formulação condicional ou perguntar/confirmar, nunca criar números, políticas, experiências ou fatos específicos.

## Fluxos

1. Usuário abre a área de call e escolhe “Preparar reunião” ou “Iniciar”.
2. Em preparação, preenche opcionalmente o contexto e seleciona uma base; confirma iniciar.
3. A aplicação cria a sessão já com a preparação e, só então, solicita permissões de áudio.
4. Durante a call, sugestões usam os dados persistidos quando existirem.
5. Em Configurações, o usuário administra bases autorizadas de seu tenant.

### Alternativos e erros

* Sem bases ou sem contexto: a call inicia e a sugestão segue o prompt atual.
* Base removida após ser selecionada: a call já iniciada conserva seu snapshot; novas calls não a encontram.
* Base não autorizada ou de outro tenant: a API retorna não encontrada, sem vazar existência.
* Falha ao iniciar: o frontend mantém os dados de preparação para nova tentativa.

## Dados e APIs

* Nova tabela `knowledge_bases` com `id`, `tenant_id`, `created_by_user_id`, `name`, `content`, `created_at`, `updated_at`.
* `call_sessions` recebe `meeting_context`, `knowledge_base_name` e `knowledge_base_content` anuláveis.
* API autenticada de CRUD sob `/api/knowledge-bases`.
* Criação de call recebe `title`, `meetingContext` e `knowledgeBaseId` opcionais; a resposta permanece compatível com o cliente atual.

## Estratégia de testes

* Unitários de autorização, validação e snapshot no backend.
* Testes de serviço/controlador para falhas de tenant e autorização.
* Testes React para preparação, omissão e administração de bases.
* Build e execução local conforme os padrões do projeto.

## Aprovação

Requisitos, regras e limites confirmados pelo solicitante em 2026-10-13.
