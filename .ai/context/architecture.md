---
gerado por: $bootstrap-project
status: definido
ultima_revisao: 2026-10-10
---

# Arquitetura — Orientador

## Estado atual

O projeto é greenfield. O repositório contém o harness e a primeira implementação: cadastro individual/organizacional, login, Termos públicos e uma área inicial. Captura, transcrição, sugestões, cobrança e gestão de membros ainda não foram implementadas.

## Monorepo e responsabilidades

* **landing/** — landing page pública planejada em https://orientador.connectas.com.br/; ainda não implementada.
* **frontend/** — aplicação web React com TypeScript em `/app`, com cadastro, login, Termos e área inicial; captura, transcrição e sugestões virão depois.
* **backend/** — API Java 21 com Spring Boot; cadastro, autenticação por sessão, tenants e aceite já implementados. Persistência de transcrições e integração xAI virão depois. Endpoint público planejado: https://api-orientador.connectas.com.br.
* **PostgreSQL** — persistência dos dados do produto. Para desenvolvimento, o usuário informou um banco local chamado desenv_orientador, com usuário postgres e senha vazia.

O backend foi apontado para o servidor 31.97.129.252. A configuração de deploy, certificado TLS, banco de produção e operação de cada módulo serão definidos e validados antes da publicação. Em 2026-10-10, a verificação HTTPS da API falhou por incompatibilidade entre o certificado apresentado e o nome api-orientador.connectas.com.br.

## Comunicação entre módulos

O frontend consumirá a API HTTPS do backend para cadastro, autenticação, organizações e histórico. O fluxo de transcrição e sugestões em tempo real deverá usar comunicação bidirecional adequada, como WebSocket, com autenticação e escopo do tenant no servidor. A landing não deve acessar transcrições.

O backend guarda a credencial da xAI no servidor. O navegador não recebe a chave permanente. A xAI/Grok é a integração prevista para transcrição por streaming e geração de sugestões; modelos e limites concretos serão fixados na implementação.

O cadastro atual gera tenant e usuário na mesma transação e registra aceite da versão vigente dos Termos. A sessão é mantida no servidor e enviada em cookie HttpOnly; escritas exigem CSRF. O prazo de avaliação do tenant é verificado no backend a cada acesso autenticado. Cadastro público não cria admins. Ver `docs/adr/ADR-0001-identidade-sessao-e-tenants.md`.

## Captura de reunião

A aplicação é web, não uma extensão. O usuário escolhe a aba da reunião e autoriza sua captura; também autoriza o microfone para incluir a própria voz. A API de captura de aba do navegador pode exigir uma trilha de vídeo durante a seleção, mas o produto não deve transmitir nem persistir esse vídeo. Áudio é processado para transcrição em tempo real e não é armazenado como gravação. Apenas as transcrições são persistidas; as sugestões são transitórias na primeira versão.

A compatibilidade inicial será verificada em navegadores desktop baseados em Chromium, como Chrome e Edge. O suporte a áudio de aba varia entre navegadores e sistemas operacionais; outras combinações exigem validação antes de serem anunciadas como suportadas.

## Isolamento e permissões

O identificador de isolamento é **tenant_id**. Cada organização possui um tenant. Cada usuário individual fora de organização possui um tenant individual. Toda entidade de negócio e toda consulta, escrita, evento em tempo real ou exportação relacionada a clientes deve ser limitada pelo tenant_id validado no backend.

Usuários comuns acessam seus dados. Gestores acessam os usuários e as transcrições do próprio tenant organizacional. O admin da plataforma tem acesso global autorizado aos dados dos clientes; esse acesso deve ser autenticado, auditável e transparente nos termos. Nenhum outro acesso entre tenants é permitido.

## Organização e convenções

O frontend e a landing seguirão convenções React/TypeScript; o backend seguirá as convenções Spring Boot. O frontend não concentra regras de autorização. Identidade, tenant e permissões são sempre confirmados pelo backend. Alterações estruturais no PostgreSQL terão migrations Flyway versionadas.

Não há código legado nem restrição de compatibilidade retroativa nesta fase.

## Critério de escolha de módulo

* Conteúdo público e aquisição de usuários: landing/.
* Interface autenticada e captura local do navegador: frontend/.
* Regras de acesso, persistência, integrações externas e processamento seguro: backend/.
* Decisões comuns aos módulos: documentar no contexto ou em ADR antes da implementação.
