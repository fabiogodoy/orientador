# PRD — Autenticação e cadastro

## Metadados

- Slug: `autenticacao-cadastro`
- Data: 2026-10-10
- Status: Aprovado para implementação
- Origem: [Intent](autenticacao-cadastro.md)

## Problema e objetivo

O Orientador não tem identidade nem acesso próprio. Esta entrega permite ativar contas individuais e organizações com um primeiro gestor, apresentar os Termos e autenticar de modo que cada conta já pertença a um tenant isolado. A avaliação gratuita de sete dias é informada antes do cadastro e não gera cobrança.

## Escopo

Inclui: frontend React/TypeScript em `/app`, página pública de Termos em `/app/termos`, formulários responsivos de cadastro e login, área inicial autenticada, API Spring Boot/Java 21, PostgreSQL com Flyway, sessão segura, aceite versionado e expiração de avaliação. A identidade visual usa os ativos de `assets/brand/`.

Não inclui: captura ou transcrição de reunião, gestão de membros, convites, cobrança, pagamentos, renovação, verificação de e-mail, recuperação automática de senha, criação/autogestão de admin, publicação em servidor ou landing completa na raiz `/`. A página de Termos na aplicação é pública, embora a landing ainda não exista.

## Perfis e módulos

- Individual cria tenant individual e usuário com perfil `INDIVIDUAL`.
- Criador de organização cria tenant organizacional e usuário `ORGANIZATION_MANAGER`.
- Admin da plataforma não pode ser registrado publicamente; a criação futura terá fluxo separado.
- `frontend/` é interface; `backend/` valida tudo e persiste; PostgreSQL armazena tenants, usuários e aceites. `docs/legal/` é a fonte editorial dos Termos. `landing/` não recebe código nesta entrega.

## Requisitos funcionais

| ID | Requisito | Critérios de aceite |
|---|---|---|
| RF001 | Exibir login e seleção de cadastro individual/organização. | Formulários acessíveis por teclado, legíveis no celular e desktop; links cruzados entre login, cadastro e Termos. |
| RF002 | Cadastrar usuário individual. | Nome, e-mail, senha, confirmação e aceite obrigatório válidos criam tenant individual e usuário; erros de campos são apresentados sem expor senha. |
| RF003 | Cadastrar organização e primeiro gestor. | Nome da organização e dados do gestor válidos criam um único tenant organizacional com o criador como gestor; não criam membros extras. |
| RF004 | Publicar e referenciar os Termos. | Página `/app/termos` é acessível sem login, contém o texto aprovado, inclui avaliação de sete dias e contato; cadastro exige checkbox desmarcado inicialmente; versão e instante UTC do aceite são persistidos. |
| RF005 | Autenticar e encerrar sessão. | E-mail/senha corretos antes do vencimento abrem a área inicial; senha incorreta não autentica; saída invalida a sessão. |
| RF006 | Aplicar avaliação de sete dias. | Prazo começa no cadastro, expira após exatamente sete dias; expirado não faz login nem acessa recurso autenticado com sessão antiga. Interface comunica o prazo e o motivo do bloqueio. Sem cobrança automática. |
| RF007 | Mostrar contexto autenticado mínimo. | Área inicial exibe nome, tipo de conta/organização e vencimento; não mostra dados de outro tenant; não simula captura ou transcrição. |
| RF008 | Impedir duplicidade e cadastros indevidos. | E-mail normalizado é único globalmente; duplicata retorna mensagem segura; payload não pode escolher papel administrativo, tenant nem data de vencimento. |

## Regras de negócio

- RN001: um cadastro individual cria um tenant exclusivo; um cadastro organizacional cria um tenant exclusivo e seu primeiro gestor. Todas as relações são atribuídas no servidor.
- RN002: e-mail é único globalmente após trim e normalização para minúsculas.
- RN003: senha é armazenada apenas como hash adaptativo; tamanho mínimo 12 caracteres e máximo 128, sem truncamento silencioso.
- RN004: o aceite da versão atual `2026-10-10` é condição para ambos os cadastros; registrar usuário, versão e instante UTC, sem aceitar versão arbitrária.
- RN005: teste gratuito inicia na criação do tenant e termina exatamente 168 horas depois. O limite é exclusivo: em `now >= trial_ends_at`, acesso autenticado é negado.
- RN006: tentativas de login com credenciais inválidas não revelam se o e-mail existe; prazo expirado só é comunicado depois de credenciais corretas.
- RN007: não existe autoinscrição de admin nem de membro comum de organização nesta entrega. O cadastro público de organização gera somente o gestor inicial.
- RN008: não há cobrança nem renovação automática. Após expiração, contato público dos Termos permanece acessível para solicitações legais.

## Requisitos não funcionais

- RNF001 Segurança: sessão no servidor com cookie HttpOnly, SameSite=Lax e Secure em HTTPS; CSRF em requisições mutáveis; CORS apenas para origem configurada; erros de autenticação sem vazamento; senhas e cookies nunca em logs. HTTPS é obrigatório em produção.
- RNF002 Multi-tenancy: toda resposta autenticada deriva usuário e `tenant_id` da sessão validada, não do payload. Nenhuma API de cliente aceita tenant arbitrário. Testes cobrem dois tenants.
- RNF003 Compatibilidade: Chrome e Edge desktop, com layout responsivo; Java 21, PostgreSQL e Node compatível com Vite. A rota `/app/*` precisa de fallback para SPA no servidor estático.
- RNF004 Observabilidade: logs técnicos para cadastro, login, falhas e bloqueio de avaliação sem e-mail completo, senha, token ou dados de outros tenants. Falhas previsíveis retornam códigos estáveis.
- RNF005 Integridade: criação de tenant, usuário e aceite é uma transação; e-mail único por índice; migrations versionadas e reversão documentada.
- RNF006 Desempenho: cadastro/login com consultas indexadas por e-mail/ID; sem chamadas externas no caminho crítico.

## Fluxos

Principal: visitante abre `/app/cadastro`, escolhe individual ou organização, informa dados, abre os Termos, marca o aceite, envia; API cria registros e devolve confirmação; visitante faz login e vê a área inicial com o vencimento. Alternativo: usuário já cadastrado entra diretamente em `/app/login`; pode sair. Erros: campos inválidos, senha divergente, termo não aceito, e-mail duplicado, credenciais inválidas, avaliação expirada ou falha de rede. Em todos, a interface apresenta mensagem clara sem criar sessão indevida.

## Contratos e dados

- `GET /api/auth/csrf`: token de proteção para cliente web.
- `POST /api/auth/register`: nome, e-mail, senha, `accountType`, nome da organização quando aplicável, `termsAccepted`, `termsVersion`. Sem campo de role, tenant ou prazo.
- `POST /api/auth/login`: e-mail e senha.
- `GET /api/auth/me`: identidade, papel, tenant mínimo e fim da avaliação da sessão ativa.
- `POST /api/auth/logout`: invalida sessão.
- Tabelas `tenants`, `users`, `terms_acceptances`; FK e índices versionados por Flyway. Em caso de rollback, desativar aplicação anterior à migration ou restaurar backup testado; não apagar dados de clientes automaticamente.

## UX e conteúdo

Português brasileiro, identidade visual Orientador, textos explícitos “7 dias grátis, sem cobrança automática” e aviso de bloqueio após o período. Checkbox de aceite não pré-marcado e link que abre os Termos sem perder o cadastro. Campo de senha com autocomplete apropriado, foco visível, rótulos reais e erros associados aos campos. Após login, área inicial honesta sobre as próximas funcionalidades.

## Estratégia de testes e aceite

Unitários para normalização, prazo e validação de domínio; integração API+PostgreSQL efêmero para criação atômica, unicidade, autenticação, CSRF, expiração e isolamento; testes React para formulários, aceite e erros; E2E do fluxo principal e de expiração. Builds frontend e backend, execução local e validação visual. A implementação reprova se qualquer RF/RN falhar, se acesso expirar apenas na tela, ou se surgir cadastro público de admin.

## Dependências e riscos

Sem serviço de e-mail, o endereço não é verificado e não há recuperação automática; suporte deve ser informado. Sem cobrança/renovação, avaliação vencida não tem reativação automática. O domínio da API apresenta problema de certificado TLS observado no bootstrap, bloqueando publicação segura até correção operacional. O texto dos Termos é publicado conforme aprovação de produto do usuário, mas recomenda-se revisão jurídica antes da venda.

## Decisão de integração

Backend, frontend e Termos formam um único fluxo vertical de cadastro/login sem valor utilizável isoladamente nesta primeira implantação. A entrega cabe em uma integração segura na `main`, com build e testes de todos os módulos; não há tickets separados nesta etapa.
