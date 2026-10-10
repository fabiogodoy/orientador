# Product Requirements Document (PRD)

> Este documento descreve detalhadamente a solução que será implementada.
>
> O PRD é derivado de uma Intent aprovada. O código deve ser validado contra este documento.
>
> Em caso de conflito: Intent → PRD → Código.

---

# Metadados

## Título

[Nome da funcionalidade]

## Slug

[slug-da-funcionalidade]

## Data

[YYYY-MM-DD]

## Autor

[Usuário | Agente | Desenvolvedor]

## Origem

Intent relacionada: `intent/<slug>.md`

## Status

* Draft
* Em Revisão
* Aprovado
* Implementado
* Validado
* Cancelado

---

# Resumo Executivo

Descrição resumida da funcionalidade, objetivo principal e valor gerado.

---

# Problema

Resumo do problema descrito na Intent.

---

# Objetivos

## Objetivo Principal

## Objetivos Secundários

## Objetivos Não Funcionais

Exemplos: melhorar performance, reduzir suporte, simplificar fluxo.

---

# Escopo

## Dentro do Escopo

Listar explicitamente.

## Fora do Escopo

Listar explicitamente. Tudo que não estiver aqui deve ser considerado fora do escopo.

---

# Personas/Perfis Impactados

Descrever impacto por perfil relevante (ver `.ai/context/business.md`).

---

# Sistemas/Módulos Impactados

Marcar todos os envolvidos (ver `.ai/context/architecture.md`).

---

# Requisitos Funcionais

Cada requisito deve ser testável.

## RF001

### Nome

### Descrição

### Critério de Aceite

* [ ]
* [ ]

## RF002

### Nome

### Descrição

### Critério de Aceite

* [ ]
* [ ]

---

# Requisitos Não Funcionais

## RNF001 - Performance

Descrição e métricas esperadas.

## RNF002 - Segurança

Descrição.

## RNF003 - Multi-Tenancy

Descrição — obrigatório quando o projeto for multi-tenant (ver `.ai/context/architecture.md`).

## RNF004 - Compatibilidade

Descrição.

## RNF005 - Observabilidade

Descrição. Logs e monitoramento necessários.

---

# Regras de Negócio

## RN001

## RN002

---

# Fluxo Principal

Descrever passo a passo.

## Passo 1

## Passo 2

---

# Fluxos Alternativos

## FA001

---

# Casos de Erro

## ER001

Condição. Comportamento esperado.

---

# UX / Interface

## Objetivo

Descrever a experiência esperada.

## Alterações de Tela

## Mensagens

## Responsividade / Acessibilidade

---

# Integrações

## Sistemas Envolvidos

## APIs Impactadas

## Contratos Impactados

---

# Dados / Banco de Dados (quando aplicável)

## Estruturas Impactadas

## Novas Estruturas

## Migração

Obrigatória para toda alteração estrutural (ver `.ai/context/coding-standards.md`).

---

# Impacto Técnico

Descrever por sistema/módulo relevante (ver `.ai/context/architecture.md`).

---

# Segurança

Checklist obrigatório:

* [ ] validação de tenant/permissão
* [ ] validação de autenticação/autorização
* [ ] proteção contra acesso indevido
* [ ] proteção de dados sensíveis
* [ ] logs adequados

---

# Multi-Tenancy (quando aplicável)

Checklist obrigatório:

* [ ] identificador de tenant validado
* [ ] isolamento garantido
* [ ] nenhuma consulta cruza tenants

---

# Estratégia de Migração

## Necessária?

* Sim
* Não

## Descrição

## Rollback

---

# Plano de Testes

Obrigatório — ver `.ai/context/testing-standards.md`.

## Testes Unitários

## Testes de Integração

## Testes E2E

---

# Evidências Esperadas

Listar: screenshots, vídeos, logs, relatórios, saída de comandos.

---

# Critérios de Aceite

A funcionalidade somente será considerada concluída quando:

* [ ] Todos RF implementados
* [ ] Todas RN implementadas
* [ ] Testes criados e executados
* [ ] Build executado com sucesso
* [ ] Validation Report aprovado

---

# Critérios de Reprovação

A funcionalidade deve ser reprovada caso exista requisito não implementado, regra de negócio ignorada, falhas críticas, ou ausência de testes/validação quando aplicável.

---

# Riscos Conhecidos

---

# Dependências

---

# Perguntas em Aberto

---

# Aprovação do PRD

* [ ] Escopo está claro?
* [ ] Critérios de aceite estão claros?
* [ ] Requisitos são testáveis?
* [ ] Está pronto para implementação?

---

# Próxima Etapa

1. `$impact-analysis`
2. `$architecture-review`
3. `$business-review`
4. implementação
5. `$generate-tests`
6. `$validate-delivery`
