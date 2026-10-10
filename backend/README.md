# API do Orientador

Área reservada à API Java 21/Spring Boot em https://api-orientador.connectas.com.br.

Há API de cadastro, login, sessão e avaliação gratuita, com migrations Flyway. O banco PostgreSQL local informado para desenvolvimento é `desenv_orientador`, usuário `postgres`, sem senha. Os testes de integração usam exclusivamente PostgreSQL efêmero de Testcontainers, nunca esse banco persistente.

O terminal atual usa Java 8 por padrão; selecione Java 21 antes de `./mvnw verify` ou `./mvnw spring-boot:run`. Para a API local, exporte `SESSION_COOKIE_SECURE=false`; em HTTPS de produção deixe `true`. `FRONTEND_ORIGIN` define a origem exata permitida no CORS. `DB_URL`, `DB_USER` e `DB_PASSWORD` configuram o banco. O arquivo `.env.example` preserva também os nomes `SPRING_DATASOURCE_*`, aceitos pelo Spring.

Rotas: `GET /api/auth/csrf`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`. Escritas exigem `X-CSRF-TOKEN` e cookie de sessão. Cadastro aceita somente `INDIVIDUAL` ou `ORGANIZATION`, nunca papel administrativo.

Antes de produção, corrigir o certificado TLS da API e definir persistência compartilhada de sessões se houver mais de uma instância. Sem provedor de e-mail, não há verificação de endereço nem recuperação automática de senha.
