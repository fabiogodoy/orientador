---
name: business-review
description: "Revisa uma mudança quanto a valor de negócio, impacto no usuário, retenção, redução de suporte, valor percebido e utilidade operacional. Use para validar se vale a pena entregar a solução."
---

# Skill: Business Review

## Objetivo

Validar se a solução proposta gera valor real para os usuários e para o projeto/negócio, com base em `.ai/context/business.md`.

Esta skill atua como Product Manager / Head de Produto. Seu papel é garantir que a solução não seja apenas tecnicamente correta — ela precisa ser útil.

## Princípio Fundamental

Código não gera valor. Funcionalidades não geram valor. Valor é gerado quando um problema real do usuário é resolvido.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/business.md`
* Intent, PRD, Impact Analysis

## Entrada / Saída

Entrada: `intent/<slug>.md`, `intent/<slug>_prd.md`, `intent/<slug>_impact.md`
Saída: `intent/<slug>_business-review.md`

---

## Processo

1. **Entender o problema** — a Intent deixa claro qual problema real está sendo resolvido? Se não, reprovar.
2. **Validar a dor** — intensidade (baixa/média/alta/crítica) e frequência (rara/ocasional/frequente/diária).
3. **Avaliar público impactado** — por perfil, conforme `.ai/context/business.md`.
4. **Avaliar valor** — o que melhora após a implementação (menos trabalho manual, menos suporte, mais retenção, mais organização)?
5. **Complexidade x benefício** — classificar ambos e cruzar. Alta complexidade + baixo benefício normalmente é reprovado; baixa complexidade + alto benefício é prioridade máxima.
6. **Impacto operacional** — reduz ou aumenta trabalho para quem opera o sistema?
7. **Impacto nos indicadores** definidos em `.ai/context/business.md`.
8. **Compatibilidade estratégica** — a funcionalidade aproxima ou afasta o produto da visão descrita em `.ai/context/business.md`?
9. **Impacto em usuários existentes** — necessidade de treinamento, mudança de comportamento, resistência à adoção.
10. **Alternativas** — existe forma mais simples de resolver o problema?
11. **Prioridade** — baixa/média/alta/estratégica.

---

## Checklist de Produto

* [ ] problema real identificado
* [ ] valor identificado
* [ ] público impactado identificado
* [ ] impacto operacional identificado
* [ ] compatibilidade estratégica validada

## Critérios de Reprovação

Problema não claro, benefício baixo, complexidade excessiva, impacto operacional negativo, sem valor perceptível.

## Critérios de Aprovação

Resolve problema relevante, gera valor claro, boa relação custo-benefício, alinhado à estratégia do produto.

---

## Classificação Final

Valor para o usuário (muito baixo → muito alto), valor para o negócio (muito baixo → muito alto), prioridade recomendada.

## Parecer Final

APROVADO / APROVADO COM RESSALVAS / REPROVADO, com justificativa e recomendações.

## Próxima Etapa

Se aprovado, seguir para `$generate-tests` ou implementação, conforme definido pelo `$orchestrator`.

---

## Regra Suprema

Uma funcionalidade não deve existir porque pode ser construída. Ela deve existir porque resolve um problema relevante de forma economicamente justificável. Toda linha de código gera custo — somente problemas importantes justificam esse custo.
