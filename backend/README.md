# API do Orientador

Área reservada à API Java 21/Spring Boot em https://api-orientador.connectas.com.br.

Ainda não há pom.xml, classes ou migrations. O banco PostgreSQL local informado para desenvolvimento é desenv_orientador, usuário postgres, sem senha. Testes de integração deverão usar PostgreSQL efêmero de Testcontainers, nunca esse banco persistente.

O terminal atual usa Java 8 por padrão; será necessário selecionar Java 21 antes de compilar o backend quando ele for criado.
