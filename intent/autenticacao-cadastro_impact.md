# Impact Analysis — Autenticação e cadastro

- Data: 2026-10-10
- Intent: `intent/autenticacao-cadastro.md`
- PRD: `intent/autenticacao-cadastro_prd.md`
- Parecer: implementar com controles de sessão, tenant e prazo descritos abaixo.

## Complexidade e módulos

Complexidade técnica alta (primeira implementação de identidade, sessão e banco), de negócio média e operacional média. `frontend/` e `backend/` são afetados; PostgreSQL recebe o primeiro schema; `docs/legal/termos-de-uso.md` será atualizado e disponibilizado como página pública. `landing/` continua sem código. A xAI, áudio, servidor remoto e domínio de produção não são alterados.

## Usuários, produção e compatibilidade

Individuais e gestores de organização ganham autoinscrição e login. Outros membros e admin não ganham fluxo nesta etapa. Não existem usuários ou APIs em produção neste repositório para migrar; contudo, os identificadores de tenant, papéis e formato de sessão passam a ser base para futuras funcionalidades. Publicação da aplicação dependerá de roteamento `/app/*`, CORS e certificado válido da API, ainda não confirmados.

## Dados, segurança e multi-tenancy

Novas tabelas para tenants, usuários e aceites, com chave única de e-mail normalizado, FK de usuário para tenant e FK de aceite para usuário. Cadastro deve ser atômico. O backend emite IDs e papéis; qualquer tenant ou papel enviado pelo cliente é ignorado/rejeitado. Endpoints autenticados revalidam o vencimento no servidor, inclusive sessões já existentes. Cookie de sessão é HttpOnly; operações mutáveis exigem CSRF e origem permitida. Não há transcrições nesta entrega, mas as próximas entidades deverão referenciar `tenant_id` validado. Logs não armazenam credenciais nem conteúdo pessoal. Termos públicos revelam apenas conteúdo aprovado.

## Desempenho e operação

Login consulta e-mail indexado; leitura de sessão consulta usuário/tenant por chave. Sem integração externa no caminho crítico. Sem e-mail, recuperação de senha depende de suporte futuro. Após sete dias, nenhum usuário consegue entrar ou ver a área autenticada; pedidos de acesso a dados seguem pelo contato público. Não há cobrança ou renovação. A equipe deve corrigir o certificado TLS e configurar HTTPS/cookies/CORS antes de publicar.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Conta com e-mail de terceiro não verificado | Média | Médio | Não tratar e-mail como verificado; não expor dados de terceiros; futura verificação por e-mail antes de recursos sensíveis. |
| Força bruta de senhas | Média | Alto | Hash adaptativo, mensagens genéricas e limitação de tentativas de login por origem e conta, com log seguro. |
| Fuga entre tenants | Baixa | Alto | Tenant sempre servidor-side, FKs, testes de dois tenants e sem endpoint que aceite tenant arbitrário. |
| Sessão ativa após prazo | Média | Alto | Checagem de prazo em cada rota autenticada e testes com relógio controlado. |
| Bloqueio sem pagamento disponível | Alta | Médio | Comunicar claramente antes do cadastro e durante avaliação; manter Termos e contato públicos. |
| Falha em CORS/CSRF/cookie ou TLS de produção | Média | Alto | Testes de fluxo real local; configuração explícita por ambiente; não publicar antes de TLS válido. |
| Migration sobre base inesperada | Baixa | Alto | Flyway; teste em PostgreSQL efêmero; backup antes de deploy; rollback por restauração, nunca DROP automático. |

## Regressões e rollback

Como não há código do produto, não há regressão funcional existente. Há risco de quebrar as convenções do harness ou da marca; executar auditoria de governança e conferir assets. Em falha de release, retornar versão anterior da aplicação e restaurar banco a partir de backup se a migration já tiver produzido dados incompatíveis; nunca remover contas recém-criadas automaticamente. Antes de deploy, executar migration em ambiente de teste.

## Estratégia de teste

Unitários: normalização, prazo, validação de cadastro. Integração: PostgreSQL Testcontainers para atomicidade, unicidade, login, sessão/CSRF e expiração. Componentes: validação, navegação e estados. E2E: cadastro individual e organizacional, login, Termos e bloqueio. Testes de performance direcionados não são necessários nesta primeira escala, mas os índices devem ser confirmados.

## ADR

Sim. Esta entrega estabelece autenticação por sessão, papéis e fronteira multi-tenant, decisões caras de substituir e essenciais para todo código futuro. Registrar em `ADR-0001` antes da implementação.
