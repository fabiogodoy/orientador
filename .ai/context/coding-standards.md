# Coding Standards

> Este arquivo tem uma base genérica (Clean Code) válida para qualquer stack. A seção "Convenções Específicas do Projeto", no final, é preenchida/expandida pelo `$bootstrap-project` e por ADRs posteriores com as regras concretas da stack escolhida (nomenclatura, camadas, frameworks).

## Objetivo

Definir os padrões obrigatórios de desenvolvimento para este projeto.

O objetivo não é produzir código acadêmico. O objetivo é produzir código:

* Legível
* Seguro
* Testável
* Manutenível
* Consistente
* Compatível com a arquitetura existente

---

## Filosofia

Sempre priorizar, nesta ordem:

1. Clareza
2. Simplicidade
3. Manutenção
4. Segurança
5. Performance

Código é lido muito mais vezes do que é escrito.

---

## Regra Principal

Todo código deve ser compreensível por outro desenvolvedor (ou outro agente) em poucos minutos.

Se precisar de muita explicação, provavelmente o código está complexo demais.

---

## Nomes

Nomes devem explicar intenção.

Ruim: `x`, `data`, `process()`, `handleStuff()`

Bom: `totalActiveUsers`, `calculateInvoiceTotal()`, `notifyCustomer()`

---

## Métodos e Funções

Devem fazer apenas uma coisa. Responsabilidades separadas ficam em funções separadas.

Tamanho preferencial: até ~30 linhas. Acima disso, avaliar extração — mas legibilidade importa mais do que seguir esse número cegamente.

Evitar aninhamento profundo (`if` dentro de `if` dentro de `if`); preferir guard clauses.

---

## Classes e Módulos

Devem ter responsabilidade clara. Sinal de alerta: mais de ~1000 linhas ou dezenas de responsabilidades misturadas.

---

## Comentários

Primeiro melhore o código. Depois adicione comentários quando necessário.

Aceitável comentar: regras de negócio complexas, integrações externas, motivações históricas/decisões não óbvias (considere um ADR em vez disso quando a decisão for importante — ver `$domain-modeling`).

---

## Duplicação

Antes de criar código novo, pesquisar implementações semelhantes já existentes no projeto. Reutilização tem prioridade sobre criação.

---

## Tratamento de Erros

Nunca ignorar exceções silenciosamente (`catch { }` vazio é proibido). Sempre registrar (log) ou propagar de forma explícita.

---

## Logging

Logs devem ajudar suporte e diagnóstico (ver `$observability-review`). Nunca registrar senhas, tokens ou dados sensíveis.

---

## Segurança

Toda entrada externa é não confiável. Sempre validar permissões, identidade do usuário/tenant e dados recebidos no servidor — nunca confiar apenas em validação de frontend.

---

## Multi-Tenancy (quando aplicável)

Se o projeto for multi-tenant, toda consulta/operação deve respeitar o isolamento entre tenants (ex.: `owner_id`, `tenant_id`, `organization_id` — o nome exato é definido no bootstrap). Nenhum dado pode atravessar tenants. Isso deve ser tratado como regra absoluta, não como boa prática.

---

## Migrations de Banco de Dados (quando aplicável)

Toda alteração estrutural de banco deve possuir migration versionada (a ferramenta específica — Liquibase, Flyway, Prisma Migrate, Alembic, etc. — é definida no bootstrap). Nunca alterar schema manualmente em produção. Toda migration deve ter rollback documentado ou ser reversível.

---

## Testes

Toda funcionalidade nova deve possuir testes (ver `.ai/context/testing-standards.md`).

---

## Refatoração

Ao tocar um código, aplicar a Boy Scout Rule: "deixe o código melhor do que encontrou." Pequenas melhorias são incentivadas; grandes refatorações exigem Intent/ADR próprios.

---

## Performance

Antes de otimizar, medir. Não criar complexidade para resolver problemas hipotéticos.

---

## Dependências

Antes de adicionar uma biblioteca nova, perguntar:

1. O problema já pode ser resolvido com o que existe?
2. O ganho compensa o custo (peso, manutenção, superfície de ataque)?
3. O time/projeto conseguirá manter isso a longo prazo?

---

## Checklist Obrigatório Antes de Finalizar Qualquer Implementação

* [ ] Código compila/roda sem erros
* [ ] Testes passam
* [ ] Sem código duplicado desnecessário
* [ ] Sem warnings relevantes
* [ ] Sem logs de debug esquecidos
* [ ] Isolamento multi-tenant validado (quando aplicável)
* [ ] Segurança validada
* [ ] Padrões do projeto (seção abaixo) respeitados

---

## Regra Suprema

Sempre preferir código simples funcionando a código sofisticado difícil de manter. O sistema existe para atender usuários reais, não para demonstrar conhecimento técnico.

---

## Convenções Específicas do Projeto

> Definidas no bootstrap de 2026-10-10 e atualizadas com a primeira entrega de autenticação.

### Módulos e linguagem

* frontend/ e landing/: React com TypeScript, inicialmente com Vite e npm.
* backend/: Java 21 com Spring Boot e Maven.
* PostgreSQL: persistência relacional; migrations versionadas com Flyway.

### Organização e nomes

* Componentes React e tipos usam PascalCase; funções, hooks e variáveis usam camelCase. Hooks começam com use. Separar interface, estado, acesso à API e regras de apresentação conforme a complexidade real da funcionalidade.
* No backend, classes Java usam PascalCase, métodos e campos usam camelCase e pacotes usam letras minúsculas. Organizar controlador, serviço, domínio, persistência e configuração com responsabilidades claras, sem criar camadas vazias.
* APIs e mensagens em tempo real devem ter contratos explícitos. A autorização e o tenant_id são validados no backend em toda operação.
* Colunas e tabelas PostgreSQL usam snake_case. Toda tabela de dados de clientes deve incluir a referência de tenant necessária ao isolamento.
* Migrations Flyway seguem a convenção de versão VNN__descricao.sql. Cada mudança de schema precisa de rollback documentado ou estratégia reversível.

### Dependências e credenciais

Usar npm nos módulos web e Maven no backend. Adicionar bibliotecas apenas quando houver necessidade concreta, manutenção viável e avaliação de segurança. A chave permanente da xAI e segredos de produção ficam somente no backend e fora do Git. Exemplos versionados devem conter apenas placeholders ou valores locais não secretos. Credenciais existentes nunca são removidas ou substituídas automaticamente, conforme AGENTS.md.

### Estado atual do ambiente

O banco local informado é desenv_orientador, com usuário postgres e senha vazia. Essa configuração é apenas de desenvolvimento; produção e homologação terão credenciais e bases próprias. O terminal atual encontra Java 8 por padrão, embora Java 21 esteja instalado: selecionar explicitamente o JDK 21 antes de compilar o backend. A aplicação usa Spring Boot 4.1.1, Vite 8 e sessão HttpOnly com CSRF conforme ADR-0001.
