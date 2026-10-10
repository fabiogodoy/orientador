---
name: create-prd
description: "Cria um PRD a partir de uma Intent aprovada, traduzindo a necessidade de negócio em requisitos, regras, critérios de aceite e restrições. Use quando a solicitação precisa de requisitos de produto antes da implementação."
---

# Skill: Create PRD

## Objetivo

Transformar uma Intent aprovada em um Product Requirements Document (PRD) completo, detalhado, testável e implementável.

O PRD é a fonte oficial de verdade para a implementação. Toda implementação deve ser validada contra o PRD.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/business.md`
* `.ai/context/architecture.md`
* `.ai/context/coding-standards.md`
* `.ai/context/testing-standards.md`
* A Intent relacionada

## Entrada

`intent/<slug>.md`

## Saída

`intent/<slug>_prd.md`, usando `.ai/templates/prd_template.md`.

---

## Responsabilidades

Detalhar a solução; definir requisitos funcionais, não funcionais e regras de negócio; definir critérios de aceite; definir estratégia de testes; definir escopo e fora do escopo.

## Não é responsabilidade desta skill

Implementar código, criar migrations, alterar banco, escolher classes específicas, escrever testes.

---

## Processo

### Etapa 1 — Ler a Intent

Compreender problema, contexto, objetivo, impacto, riscos.

### Etapa 2 — Validar Qualidade da Intent

Se a Intent não responder claramente qual problema existe, quem é impactado e qual resultado é esperado, interromper e solicitar refinamento. Não gerar PRD a partir de Intent incompleta.

### Etapa 3 — Definir Escopo

O que será feito, e explicitamente o que NÃO será feito.

### Etapa 4 — Requisitos Funcionais

Todo comportamento observável vira um RF, com identificador, descrição e critério de aceite.

Ruim: "O sistema deve ser rápido." Bom: "RF005 — O sistema deve exibir [resultado] em até N segundos."

### Etapa 5 — Regras de Negócio

Toda regra recebe identificador (RN001, RN002, …), objetiva, verificável, independente.

### Etapa 6 — Requisitos Não Funcionais

Avaliar obrigatoriamente: performance, segurança, observabilidade, compatibilidade e, quando o projeto for multi-tenant (ver `.ai/context/architecture.md`), isolamento entre tenants e validação de permissões.

### Etapa 7 — Fluxos

Fluxo principal (passo a passo), fluxos alternativos, casos de erro.

### Etapa 8 — Sistemas/Módulos Impactados

Conferir contra `.ai/context/architecture.md` e marcar todos os afetados.

### Etapa 9 — Estratégia de Testes

Para cada RF, definir cenário positivo e negativo, conforme `.ai/context/testing-standards.md`. Incluir cenários E2E quando houver impacto visual/de fluxo, e considerar que a implementação será validada com o comando de build definido em `.ai/context/testing-standards.md`.

---

## Critérios de Aceite

Todo requisito deve ter critério objetivo. Ruim: "Interface amigável." Bom: "O usuário consegue concluir [ação] em N passos, sem erro."

---

## Checklist de Qualidade do PRD

* [ ] Todos RF têm identificador e critério de aceite
* [ ] Todas RN têm identificador
* [ ] Fluxo principal, alternativos e casos de erro definidos
* [ ] Sistemas impactados identificados
* [ ] Testes definidos
* [ ] Multi-tenancy analisada (quando aplicável)
* [ ] Segurança analisada
* [ ] Fora do escopo definido

## Critérios de Reprovação

Requisito ambíguo ou não testável, regra de negócio faltando, critério de aceite ausente, análise de impacto ausente.

## Critérios de Aprovação

Outro desenvolvedor ou agente consegue implementar sem perguntas; QA consegue validar sem perguntas.

---

## Heurísticas Obrigatórias

Isso resolve o problema original? Adiciona complexidade desnecessária? Existe solução mais simples? Existe impacto em usuários/dados/integrações existentes?

---

## Artefato Produzido

`intent/<slug>_prd.md`, pronto para `$impact-analysis`.

---

## Regra Suprema

A qualidade da implementação nunca será melhor que a qualidade do PRD. Um PRD incompleto inevitavelmente gera código incompleto. Antes de escrever código, tornar o PRD impossível de interpretar de forma ambígua.
