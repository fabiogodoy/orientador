# Orientador

Orientador é um assistente para reuniões online. A proposta é transcrever, em tempo real, o áudio da aba da reunião e do microfone do usuário e sugerir falas e respostas a objeções.

O projeto está na fase inicial. Cadastro, login e Termos de Uso já foram implementados; captura de reuniões e transcrição ainda não foram.

## Estrutura

| Pasta | Finalidade |
| --- | --- |
| `landing/` | Site público em `https://orientador.connectas.com.br/` |
| `frontend/` | Aplicação React em `https://orientador.connectas.com.br/app` |
| `backend/` | API Java 21/Spring Boot em `https://api-orientador.connectas.com.br` |
| `assets/brand/` | Logo vetorial e ícone do Orientador |
| `.ai/context/` | Contexto oficial do produto, arquitetura, código e testes |
| `.agents/skills/` | Fluxo de trabalho assistido pelo God Harness |
| `docs/legal/` | Texto-fonte dos Termos de Uso exibidos em `/app/termos` |

O glossário do produto está em `CONTEXT.md`. As regras de trabalho estão em `AGENTS.md`.

## Ambiente local informado

* PostgreSQL: banco `desenv_orientador`, usuário `postgres`, sem senha.
* Java 21 está instalado, mas o terminal seleciona Java 8 por padrão.
* Node.js, npm, Maven e Docker estão disponíveis.
* A CLI `psql` não está no PATH; os testes de integração usam PostgreSQL efêmero de Testcontainers, não o banco `desenv_orientador`.

O arquivo `backend/.env.example` documenta as variáveis locais. Nunca versionar uma chave real da xAI.

## Executar localmente

1. Confira que `desenv_orientador` existe no PostgreSQL local. A API aplica a migration Flyway automaticamente ao iniciar.
2. No terminal do `backend/`, selecione Java 21, configure `SESSION_COOKIE_SECURE=false` e rode `./mvnw spring-boot:run`. O padrão local do banco é `jdbc:postgresql://localhost:5432/desenv_orientador`, usuário `postgres`, senha vazia. Para outra configuração, use `DB_URL`, `DB_USER` e `DB_PASSWORD` ou as propriedades `SPRING_DATASOURCE_*` existentes.
3. No terminal do `frontend/`, rode `npm ci` e `npm run dev`. Acesse `http://localhost:5173/app/cadastro` ou `http://localhost:5173/app/login`.

Em produção, mantenha `SESSION_COOKIE_SECURE=true`, configure `FRONTEND_ORIGIN` com a origem HTTPS exata e sirva todas as rotas `/app/*` com fallback para o `index.html` do frontend. O certificado HTTPS de `api-orientador.connectas.com.br` ainda precisa ser corrigido antes de qualquer publicação. Esta entrega **não** publica a aplicação em produção.

## Validar

* `backend/`: Java 21 e `./mvnw verify` (inclui testes com PostgreSQL efêmero e exige Docker).
* `frontend/`: `npm run build`, `npm test` e `npm run test:e2e` com API, frontend e PostgreSQL efêmero ativos. Para o primeiro E2E, instale o navegador com `npx playwright install chromium`.

## Próximas entregas

As próximas telas e funcionalidades serão criadas por demanda, seguindo `AGENTS.md`. Convites, outros membros, cobrança, renovação, e-mails e admin da plataforma permanecem fora desta primeira entrega.

## Origem do processo

O projeto começou com o [God Harness](https://github.com/fabiogodoy/godharness), usado aqui como estrutura de governança. O código do Orientador mantém seu próprio repositório e histórico.
