# Intent — Autenticação e cadastro

## Metadados

- Slug: `autenticacao-cadastro`
- Data: 2026-10-10
- Autor: usuário e agente
- Status: Aprovada após confirmação explícita do escopo pelo usuário.

## Resumo executivo

O Orientador ainda não permite que uma pessoa crie uma identidade, aceite os Termos nem acesse uma área própria. Isso impede qualquer experiência personalizada e segura do produto. A primeira entrega deve viabilizar a entrada de usuários individuais e de gestores que iniciam uma organização, com um período de avaliação gratuito conhecido desde o cadastro.

## Problema e evidências

Hoje `frontend/`, `backend/` e `landing/` são apenas diretórios preparatórios, sem aplicação executável. Não há conta, autenticação, aceite rastreável ou espaço isolado para o cliente. Sem isso, as futuras transcrições não terão titular e tenant seguros, e não existe percurso de ativação do produto. A evidência é a estrutura atual do repositório e a solicitação do usuário de implementar o primeiro fluxo.

## Objetivo e resultado esperado

Uma pessoa deve conseguir criar uma conta individual ou iniciar uma organização, conhecer e aceitar os Termos, entrar com suas credenciais e identificar que está em seu próprio espaço. O acesso deve cessar ao fim dos sete dias de avaliação, sem cobrança automática. O usuário confirma que, neste momento, o bloqueio após o prazo inclui login e área autenticada.

## Usuários e módulos impactados

- Usuário individual: poderá se registrar e entrar em seu tenant exclusivo.
- Gestor de organização: poderá criar a organização e sua primeira conta gestora.
- Usuários de organização, além do gestor inicial: não entram nesta entrega.
- Admin da plataforma: criação e renovação ficam para entrega futura; cadastro público não o alcança.
- `frontend/`: experiência de cadastro, entrada e área inicial.
- `backend/` e PostgreSQL: identidades, isolamento, prazo de avaliação e aceite.
- Conteúdo público dos Termos: passa de minuta interna para página acessível.

## Restrições e regras conhecidas

- O produto é greenfield e deve manter os módulos React/TypeScript e Spring Boot/Java 21 já definidos.
- Cada pessoa individual tem tenant próprio; uma organização nasce com tenant próprio.
- O aceite dos Termos é obrigatório, com versão e data registradas.
- A avaliação de sete dias começa no cadastro, tanto para individuais quanto para organizações. Após o vencimento, o acesso autenticado é bloqueado; contato público para exercício de direitos continua disponível.
- Não haverá nesta entrega envio de e-mails, verificação de e-mail, recuperação de senha, convites, outros membros, cobrança, renovação ou criação de admin.
- Credenciais e informações pessoais devem ser protegidas. Dados de clientes nunca atravessam tenants.

## Riscos

- Segurança: contas sem confirmação de e-mail exigem tratamento cuidadoso para não sugerir propriedade verificada do endereço.
- Produto: sem cobrança/renovação, a conta fica inacessível após sete dias e depende de futura implementação para voltar a operar.
- Operação: usuários sem recuperação automática de senha dependem do contato de suporte.
- Jurídico: os Termos devem explicitar a avaliação, o bloqueio e os meios de contato. Publicar texto não dispensa revisão jurídica antes da operação comercial.
- Regressão: o projeto não tem fluxo em produção a regredir; a principal exposição é introduzir um limite de tenant insuficiente para futuras funcionalidades.

## Critérios de sucesso

- CS001: os dois tipos de cadastro criam identidades distintas e isoladas, com aceite comprovável.
- CS002: credenciais corretas dão acesso antes do vencimento; credenciais erradas e prazo vencido não dão acesso.
- CS003: os Termos estão disponíveis sem login e são referenciados no cadastro.
- CS004: o fluxo principal é validado com build, testes e execução local, sem cobrança ou envio de e-mail.

## Indicadores e alternativas

Ainda não há indicadores numéricos definidos. A entrega torna possível medir ativação futuramente, sem inventar metas. Um cadastro manual pelo operador seria alternativa temporária, mas não resolve a autonomia esperada para contas individuais e organizações.

## Perguntas em aberto

Nenhuma para o escopo aprovado. Planos, pagamentos, extensão da avaliação, convites e criação de admin pertencem a entregas posteriores.
