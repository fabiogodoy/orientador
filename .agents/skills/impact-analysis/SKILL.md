---
name: impact-analysis
description: "Analisa impactos técnicos, de produto, negócio, dados, segurança e operacionais de uma mudança. Use antes da Architecture Review ou da implementação para descobrir riscos e módulos afetados."
---

# Skill: Impact Analysis

## Objetivo

Identificar todos os impactos técnicos, operacionais, funcionais e de negócio de uma alteração antes da implementação.

Não valida requisitos. Descobre: o que será afetado, o que pode quebrar, quais riscos existem, quais sistemas precisam ser considerados.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/business.md`
* `.ai/context/architecture.md`
* `.ai/context/coding-standards.md`
* `.ai/context/testing-standards.md`
* Intent e PRD relacionados

## Entrada

`intent/<slug>.md`, `intent/<slug>_prd.md`

## Saída

`intent/<slug>_impact.md`, usando `.ai/templates/impact_analysis_template.md`.

---

## Processo

1. **Compreender a mudança** — ler Intent e PRD.
2. **Identificar sistemas/módulos impactados** — percorrer cada item listado em `.ai/context/architecture.md` e marcar sim/não.
3. **Identificar usuários/perfis impactados** — percorrer os perfis de `.ai/context/business.md`.
4. **Avaliar impacto em produção** — como isso afeta usuários/clientes já usando o sistema hoje? Muda comportamento, fluxo, exige treinamento?
5. **Avaliar compatibilidade** — existe risco de quebrar API, contrato ou integração já usada?
6. **Avaliar multi-tenancy** (quando aplicável) — identificador de tenant, consultas e permissões afetadas.
7. **Avaliar segurança** — autenticação, autorização, permissões, dados sensíveis, logs.
8. **Avaliar dados/banco** — novas estruturas, índices, volume, risco de degradação de performance.
9. **Avaliar performance** — leituras, escritas, relatórios, dashboards, APIs.
10. **Avaliar impacto operacional** — suporte, financeiro, comercial, o que for relevante conforme `.ai/context/business.md`.
11. **Avaliar impacto nos indicadores** definidos em `.ai/context/business.md`.
12. **Identificar regressões potenciais** — "o que pode parar de funcionar?"
13. **Definir estratégia de rollback**.

Todo risco identificado deve ter descrição, probabilidade, impacto e mitigação.

---

## Checklist Obrigatório

* [ ] Sistemas impactados identificados
* [ ] Usuários impactados identificados
* [ ] Módulos impactados identificados
* [ ] Multi-tenancy analisada (quando aplicável)
* [ ] Segurança analisada
* [ ] Banco analisado
* [ ] Performance analisada
* [ ] Regressões identificadas
* [ ] Estratégia de rollback definida

## Critérios de Reprovação

Ignorar sistemas impactados, usuários já em produção, multi-tenancy, segurança ou regressões.

## Critérios de Aprovação

Todos os impactos visíveis, todos os riscos documentados, plano de mitigação e de rollback existentes.

---

## Decisão de ADR

Ao final, responder: esta alteração exige ADR? Critérios (ver também `.agents/skills/domain-modeling/ADR-FORMAT.md`): nova estrutura de dados relevante, nova integração, alteração arquitetural, alteração de autenticação/autorização/multi-tenancy, nova dependência relevante, débito técnico consciente.

---

## Próxima Etapa

Se aprovado, executar `$architecture-review`.

---

## Regra Suprema

Toda alteração parece simples até que alguém descubra quem mais depende dela. A missão desta skill é descobrir isso antes da produção.
