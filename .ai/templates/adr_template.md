# Architecture Decision Record (ADR)

> Este documento registra decisões arquiteturais relevantes do projeto.
>
> O objetivo é preservar o contexto da decisão para futuras manutenções. ADRs não descrevem funcionalidades — ADRs descrevem decisões.
>
> Para decisões pequenas e reversíveis, use o formato leve descrito em `.agents/skills/domain-modeling/ADR-FORMAT.md` em vez deste template completo. Use este template completo para decisões de maior porte que se beneficiam de registrar alternativas consideradas.

---

# Metadados

## ADR

ADR-XXXX

Consultar `docs/adr/README.md` para o próximo número livre antes de criar o arquivo. Nunca reutilizar um número já registrado nesse índice.

## Título

## Data

[YYYY-MM-DD]

## Autor

[Usuário | Agente | Desenvolvedor]

## Status

* Proposto / Aprovado / Implementado / Substituído / Obsoleto

## Relacionado

Intent: `intent/<slug>.md`
PRD: `intent/<slug>_prd.md`
Impact Analysis: `intent/<slug>_impact.md`

---

# Resumo Executivo

Resumo da decisão.

---

# Contexto

Descrever o cenário que motivou a decisão: qual problema/limitação/necessidade existia.

---

# Problema

Descrever claramente o problema.

---

# Objetivos

O que a decisão busca alcançar?

---

# Restrições

Descrever restrições conhecidas (técnicas, de prazo, de custo, de compatibilidade).

---

# Opções Consideradas

## Opção A

### Vantagens

### Desvantagens

## Opção B

### Vantagens

### Desvantagens

---

# Decisão

Descrever claramente a decisão escolhida.

---

# Justificativa

Por que esta opção foi escolhida? Por que as demais foram descartadas?

---

# Impactos Esperados

## Positivos

## Negativos

---

# Impacto Arquitetural

Descrever impacto por sistema/módulo relevante (ver `.ai/context/architecture.md`).

---

# Impacto em Segurança

---

# Impacto em Multi-Tenancy (quando aplicável)

---

# Impacto em Performance

---

# Débito Técnico

A decisão gera débito técnico? Se sim, descrever motivo, impacto e plano futuro.

---

# Consequências

## Curto Prazo

## Médio Prazo

## Longo Prazo

---

# Riscos

## Risco 01

Descrição. Mitigação.

---

# Plano de Reversão

Caso a decisão precise ser revertida, descrever.

---

# Critérios de Revisão

Quando esta ADR deve ser revisitada? (ex.: crescimento de usuários, troca de tecnologia, novo problema de performance)

---

# Decisão Final

## Status

* Aprovada / Rejeitada

## Justificativa Final

---

# Lições Aprendidas

Preencher posteriormente — o que aprendemos após a implementação?

---

# Regra de Ouro

Toda decisão arquitetural relevante deve possuir ADR. Se alguém perguntar "por que fizemos isso?", a resposta deve estar neste documento.
