# Orientador

Orientador é um assistente para reuniões online. A proposta é transcrever, em tempo real, o áudio da aba da reunião e do microfone do usuário e sugerir falas e respostas a objeções.

O projeto está na fase inicial. O contexto de negócio e arquitetura foi definido, mas ainda não há telas nem código executável da aplicação.

## Estrutura

| Pasta | Finalidade |
| --- | --- |
| `landing/` | Site público em `https://orientador.connectas.com.br/` |
| `frontend/` | Aplicação React em `https://orientador.connectas.com.br/app` |
| `backend/` | API Java 21/Spring Boot em `https://api-orientador.connectas.com.br` |
| `assets/brand/` | Logo vetorial e ícone do Orientador |
| `.ai/context/` | Contexto oficial do produto, arquitetura, código e testes |
| `.agents/skills/` | Fluxo de trabalho assistido pelo God Harness |
| `docs/legal/` | Minuta de Termos de Uso |

O glossário do produto está em `CONTEXT.md`. As regras de trabalho estão em `AGENTS.md`.

## Ambiente local informado

* PostgreSQL: banco `desenv_orientador`, usuário `postgres`, sem senha.
* Java 21 está instalado, mas o terminal seleciona Java 8 por padrão.
* Node.js, npm, Maven e Docker estão disponíveis.
* A CLI `psql` não está no PATH; a conexão com o banco ainda não foi verificada.

O arquivo `backend/.env.example` documenta as variáveis previstas para o backend. Não há aplicação configurada para consumi-las nesta fase. Nunca versionar uma chave real da xAI.

## Próximas entregas

As telas, o backend, as migrations e os testes serão criados em demandas específicas. Cada entrega seguirá o processo de `AGENTS.md`. Nenhum comando de build ou teste da aplicação existe até que os módulos sejam implementados.

## Origem do processo

O projeto começou com o [God Harness](https://github.com/fabiogodoy/godharness), usado aqui como estrutura de governança. O código do Orientador mantém seu próprio repositório e histórico.
