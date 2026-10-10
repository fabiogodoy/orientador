---
name: architecture-review
description: "Revisa uma mudança planejada quanto à aderência arquitetural, convenções da stack, multi-tenancy, segurança, performance e compatibilidade. Use antes da implementação ou quando houver risco arquitetural."
---

# Skill: Architecture Review

## Objetivo

Validar se a solução proposta respeita a arquitetura oficial do projeto, descrita em `.ai/context/architecture.md`.

Esta skill atua como um Arquiteto de Software Sênior. Sua missão não é encontrar a arquitetura perfeita — é impedir mudanças arquiteturais desnecessárias.

## Princípio Fundamental

Arquitetura existente tem prioridade sobre arquitetura idealizada.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/architecture.md`
* `.ai/context/coding-standards.md`
* `.ai/context/business.md`
* Intent, PRD, Impact Analysis

## Entrada

`intent/<slug>.md`, `intent/<slug>_prd.md`, `intent/<slug>_impact.md`

## Saída

`intent/<slug>_architecture-review.md`

---

## Processo

1. **Compreender a solução** — ler Intent, PRD, Impact Analysis.
2. **Identificar o módulo/sistema correto** — conferir contra `.ai/context/architecture.md`. Pergunta obrigatória: "a alteração está sendo proposta no lugar certo?"
3. **Reutilização** — existe implementação semelhante já existente? Reutilização tem prioridade sobre criação.
4. **Complexidade** — classificar baixa/média/alta; existe solução mais simples?
5. **Aderência à stack** — validar contra as convenções descritas em `.ai/context/coding-standards.md` (camadas, nomenclatura, framework). Reprovar regra de negócio na camada errada (ex.: em controller/endpoint em vez de serviço).
6. **Dados/banco** — a alteração exige migration? Existe impacto em performance de consulta?
7. **Dependências novas** — o problema já pode ser resolvido com o que existe? O ganho compensa o custo? O time consegue manter?
8. **Débito técnico** — a solução cria débito técnico? Se sim, documentar motivo, impacto e prazo de correção.
9. **Necessidade de ADR** — ver `.agents/skills/domain-modeling/ADR-FORMAT.md` e a Etapa 4 de `$impact-analysis`.

---

## Checklist Arquitetural

* [ ] módulo/sistema correto identificado
* [ ] reutilização avaliada
* [ ] complexidade avaliada
* [ ] aderência à stack e convenções do projeto
* [ ] dependências avaliadas
* [ ] débito técnico avaliado

## Critérios de Reprovação

Existir solução mais simples, duplicação desnecessária, framework/dependência desnecessária, quebra arquitetural, acoplamento excessivo.

## Critérios de Aprovação

Solução respeita a arquitetura existente, é simples, sustentável, compatível e reutilizável.

---

## Parecer Final

Classificar: APROVADA / APROVADA COM RESSALVAS / REPROVADA, com justificativa e recomendações.

## Próxima Etapa

Se aprovado, executar `$business-review`.

---

## Regra Suprema

O melhor código não é o mais moderno. É aquele que resolve o problema respeitando a arquitetura existente. Toda abstração deve se justificar. Toda complexidade deve se pagar. Toda mudança arquitetural deve ser tratada como exceção.
