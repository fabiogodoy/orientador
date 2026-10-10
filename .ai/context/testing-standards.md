# Testing Standards

> Base genérica válida para qualquer stack. A seção "Configuração Específica do Projeto", no final, é preenchida pelo `$bootstrap-project` com as ferramentas, comandos e ambiente reais (framework de teste, comando de build, como subir o ambiente local, banco de testes autorizado, etc.).

## Objetivo

Garantir que toda alteração seja validada antes da entrega. A implementação não é considerada concluída até que os testes definidos neste documento sejam executados com sucesso.

---

## Filosofia

Confiamos em evidências. Não confiamos apenas em: compilação, revisão visual, suposição do desenvolvedor ou suposição do agente.

Toda funcionalidade deve ser validada através de testes reais, executados.

---

## Pirâmide de Testes

Ordem de prioridade:

1. Testes unitários
2. Testes de integração
3. Testes end-to-end (E2E)

---

## Regra Obrigatória

Toda funcionalidade nova deve possuir pelo menos: testes unitários das regras que introduziu e validação funcional do fluxo principal.

---

## Tipos de Teste

### Testes Unitários

Validam regras isoladas. Obrigatório para: regras de negócio, funções puras, utilitários.

### Testes de Integração

Validam integração entre componentes (ex.: camada de serviço + persistência, endpoint + regra de negócio).

Se o projeto acessar banco de dados em testes de integração, o banco autorizado e as regras de proteção contra ambientes de produção/homologação são definidos na seção "Configuração Específica do Projeto" abaixo — e são absolutas: nenhum teste pode rodar contra um banco fora do configurado ali.

### Testes End-to-End (E2E)

Validam o comportamento real do usuário, do início ao fim. A ferramenta oficial (Playwright, Cypress, etc.) é definida no bootstrap.

---

## Processo Obrigatório Antes de Executar E2E

1. Executar o build do projeto afetado (comando definido na seção específica abaixo).
2. Se o build falhar: **interromper a execução**. Não seguir para E2E com build quebrado.
3. Subir o ambiente local necessário (comando/procedimento definidos na seção específica abaixo).
4. Validar que a aplicação está disponível e sem erros críticos nos logs.
5. Após a conclusão, encerrar o ambiente, se aplicável.

---

## Regra para Agentes

O agente não pode afirmar que algo funciona sem executar os testes correspondentes.

Expressões proibidas: "deve funcionar", "provavelmente funciona", "parece correto".

Expressões aceitáveis: "validado via teste", "validado via execução E2E", "testes executados com sucesso" — sempre com a evidência anexada (log, saída do comando, screenshot).

---

## Cenários Obrigatórios

Toda funcionalidade nova ou alterada deve possuir, no mínimo:

* **Cenário feliz** — o fluxo esperado.
* **Cenário de erro** — entrada ou estado inválido.
* **Cenário de regressão** — garantir que funcionalidades existentes relacionadas continuam funcionando.

---

## Evidências

Toda execução de teste relevante (especialmente E2E) deve produzir evidências: saída de comando, screenshots, vídeos ou logs, conforme o que a stack do projeto permitir.

---

## Processo de Entrega

Nenhuma entrega é considerada concluída sem:

* Build executado
* Testes unitários executados
* Testes E2E executados quando aplicável
* Evidências geradas
* Validation Report aprovado (`$validate-delivery`)

---

## Regra Suprema

Código sem teste é hipótese. Código validado por testes é evidência. Somente evidências podem ser utilizadas para aprovar uma entrega.

---

## Configuração Específica do Projeto

> Definida no bootstrap de 2026-10-10. Os módulos ainda não têm manifests nem testes; comandos abaixo são o contrato para quando forem criados, não evidência de execução atual.

### Ferramentas previstas

* frontend/ e landing/: Vitest e React Testing Library para testes unitários e de componentes.
* backend/: JUnit 5 e Spring Boot Test; Testcontainers com PostgreSQL para testes de integração.
* Fluxos completos da aplicação: Playwright em navegador desktop com suporte a captura de áudio de aba. A automação de permissões de captura pode exigir validação manual complementar.

### Build e testes planejados

* frontend/: npm run build e npm test, após a criação do package.json.
* landing/: npm run build e npm test, após a criação do package.json.
* backend/: ./mvnw verify, após a criação do Maven Wrapper e do pom.xml.
* E2E: comando Playwright a ser fixado no package.json quando os primeiros fluxos forem implementados.

Os comandos ainda não podem ser executados porque os módulos de aplicação serão criados em entregas posteriores. Nenhum sucesso de build ou teste deve ser declarado antes da execução real.

### Ambiente local e banco autorizado

O usuário informou PostgreSQL local com banco desenv_orientador, usuário postgres e senha vazia para desenvolvimento manual. Não há script de subida da aplicação nem serviço de backend/frontend implementado nesta fase. A CLI psql não foi encontrada no PATH durante o bootstrap, então a conexão com o banco ainda não foi verificada.

Testes de integração que escrevem no banco devem usar exclusivamente um PostgreSQL efêmero de Testcontainers. É proibido apontá-los para desenv_orientador, homologação, produção ou qualquer banco persistente. Docker precisa estar disponível para esses testes. Antes de build do backend, o terminal deve selecionar Java 21; Java 8 é o padrão atual do PATH.

### Cobertura e cenários prioritários

Não foi definida uma porcentagem mínima de cobertura. Na implementação, priorizar testes de isolamento entre tenants, permissões de gestor e admin, ausência de áudio/vídeo persistido, tratamento de queda de captura/streaming e direitos de exclusão de transcrições.
