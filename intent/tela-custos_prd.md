# PRD — Tela de Custos

## Metadados e objetivo
2026-10-15 · tela-custos · Aprovado. Origem: tela-custos.md. Transparência do consumo de transcrição e sugestões para todos os perfis autenticados.

## Escopo
Registro prospectivo por operação e persistência no servidor; tela inspirada na referência com cartões, filtros, gráfico e calls. Exclui faturamento, impostos, IOF, análise executiva, importação de custos anteriores e deploy. Uma única integração segura na main: schema aditivo, coleta e leitura são entregues juntos; não precisa de tickets intermediários.

## Requisitos funcionais e aceite
RF001 — Link Custos no menu principal, após Bases de conhecimento, com aria-current na rota /app/custos. Abre página autenticada na mesma aba; acesso direto, recarregamento e voltar do navegador funcionam. Em mobile, a navegação fecha o menu. Sem botão Custos no topo nem modal de custos.
RF002 — Filtros Hoje, 7 dias (padrão), 30 dias e Tudo. Dias civis inclusivos em America/Sao_Paulo; seleção atualiza cartões, gráfico e calls juntos. Carregamento/erro não exibem valores de outro filtro.
RF003 — Cartões Total estimado, Transcrição, Sugestões e Calls. Custos em US$ e R$, contagem de operações por categoria, calls e minutos no período. Valores pequenos não aparecem como zero por arredondamento. Total é somente das duas categorias.
RF004 — Gráfico diário em US$ com duas séries distinguíveis, legenda, valores acessíveis e dias sem gasto. Vazio explícito quando não há consumo conhecido; não afirmar gasto zero quando houver lacunas.
RF005 — Calls recentes em ordem de início decrescente, título, data, responsável, duração no período, situação e custos por categoria/total. Paginação de 20. Calls ativas identificadas; encerradas ligam ao histórico. Calls anteriores à medição exibem custo não disponível ou parcial quando contêm eventos novos.
RF006 — Registrar uma tentativa antes de enviar ao provedor; persistir consumo/tarifa/modelo/custo quando informados, inclusive resposta incompleta. Respostas sem consumo, falhas de transporte e medições antigas permanecem explicitamente desconhecidas. Sugestões/conteúdo de áudio não entram no registro financeiro.
RF007 — Conversão de todos os US$ exibidos pela última cotação diária PTAX venda disponível no Banco Central, com fonte/data/taxa. Cache com atualização diária e nova busca após fechamento, fallback à última cotação persistida sinalizado; indisponibilidade sem cache mantém US$ e R$ indisponível, nunca taxa inventada.
RF008 — Usuário comum: somente próprias calls no tenant; gestor: tenant inteiro; admin: todos, com log de consulta global. Autenticação e expiração seguem AccountService; query não aceita tenant fornecido pelo navegador.

## Regras
RN001 — Quantias decimais; tarifa aplicada preservada por operação. Groq usa duração retornada pelo provedor e mínimo de 10 segundos; OpenAI usa usage de entrada/cache/saída, sem estimar tokens por caracteres.
RN002 — Gastos agrupados pela data da tentativa, não pela data inicial da call. Calls incluem as que se sobrepõem ao período; duração recortada no período e limitada ao instante atual. Lista mostra o custo dentro do filtro, não o custo vitalício.
RN003 — Medição completa somente para calls criadas com coleta habilitada e sem operações desconhecidas. Totais conhecidos permanecem visíveis com aviso de parcialidade. Calls antigas não são gratuitas. Operações contam tentativas de processamento, inclusive com resposta inutilizável.
RN004 — Conversão é referência atual aplicada a todo período, não câmbio histórico nem valor cobrado no cartão. Último fechamento disponível cobre fins de semana/feriados. Análise executiva não compõe total.
RN005 — Custos segue a navegação por página das demais entradas do menu. A navegação na mesma aba deixa a tela de call, sem promessa de manter captura em segundo plano. O link permite abrir outra aba pelo navegador para consultar sem sair da call. Consulta é snapshot; atualizar recarrega dados.

## Não funcionais, UX e fluxos
RNF001: agregações no banco e lista limitada; câmbio com timeout e cache, fora do caminho da captura.
RNF002: parâmetros SQL, autorização no servidor, dados mínimos; sem logs de chaves, áudio, texto ou payloads dos provedores.
RNF003: React/TypeScript, Java 21/Spring/JDBC/Flyway; sem dependência de gráficos adicional.
RNF004: layout responsivo, filtros com aria-pressed, títulos/legenda e tabela acessível, menu com indicação de página atual, loading/status/alert e retry.
Fluxo: menu → Custos → período → dados/cotação → call encerrada ou voltar. Alternativas: vazio; dados parciais; câmbio indisponível/cache antigo; API falha com retry. Não navegar para histórico da call atual enquanto captura está ativa.

## Integrações, dados e migração
GET /api/costs?period=WEEK&page=0. Instrumentação dos clientes existentes Groq/OpenAI. Migration V10 cria ledger, marcador prospectivo e cache PTAX. ADR-0011 detalha. Rollback: reverter aplicação, conservar tabelas aditivas; remoção futura somente por migration após exportação do ledger.

## Testes, evidências e aprovação
Unitários: tarifas/cache/limites/período; integração PostgreSQL efêmero: agregações, cobertura, paginação e todos os perfis; contratos clientes com HTTP simulado; componentes e Playwright: filtros/erros/responsividade/navegação por rota. Builds obrigatórios. Evidências em .scratch/tela-custos e relatórios das suítes. RF/RN devem ser atendidos, testes/reviews/auditoria aprovados antes da conclusão. Sem perguntas pendentes.

Revisão de 2026-10-15: RF001/RN005 atualizados conforme pedido explícito. Ajuste pontual, uma integração, sem tickets/ADR novos. Testar navegação desktop/mobile, URL/reload/back, ausência de modal/topbar e proteção de login, além das regressões existentes.
