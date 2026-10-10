---
name: create-intent
description: "Transforma uma solicitação bruta em um documento de intenção claro, focado no problema, usuários afetados, resultado esperado, riscos e critérios de sucesso. Use antes do PRD ou de qualquer implementação."
---

# Skill: Create Intent

## Objetivo

Transformar uma solicitação bruta em um documento de intenção claro, objetivo e acionável.

A Intent é a primeira etapa obrigatória do processo de desenvolvimento. Nenhuma implementação deve iniciar sem uma Intent. Nenhum PRD deve ser criado sem uma Intent.

---

## Pré-requisito

`.ai/context/project-status.md` deve indicar `bootstrap: done`. Se não indicar, interromper e executar `$bootstrap-project` primeiro.

---

## Missão

Compreender o problema antes de discutir a solução.

Esta skill não define requisitos, não define arquitetura. Ela descobre:

* Qual é o problema?
* Quem é afetado?
* Qual resultado é esperado?
* Por que isso é importante?

---

## Referências Obrigatórias

Antes de executar, consultar:

* `AGENTS.md`
* `.ai/context/business.md`
* `.ai/context/architecture.md`

---

## Entrada

Uma solicitação: nova funcionalidade, correção de bug, integração, refatoração, alteração operacional.

## Saída

`intent/<slug>.md`, usando `.ai/templates/intent_template.md`.

---

## Responsabilidades

Entender o problema, o contexto, identificar envolvidos, impacto e riscos, definir objetivo e critérios de sucesso.

## Não é responsabilidade desta skill

Não definir arquitetura, esquema de dados, endpoints, classes, componentes, tecnologias ou implementação. Isso pertence ao PRD e às etapas posteriores.

---

## Processo

1. Identificar o problema real. Pergunta obrigatória: "Qual problema está sendo resolvido?"
2. Identificar os usuários/perfis impactados, com base em `.ai/context/business.md`.
3. Identificar os módulos/sistemas impactados, com base em `.ai/context/architecture.md`.
4. Identificar o processo atual: como funciona hoje, quais são as dores, onde existe atrito.
5. Identificar o resultado esperado. Pergunta obrigatória: "Como saberemos que o problema foi resolvido?"
6. Identificar riscos técnicos, operacionais, de produto e de regressão.
7. Definir critérios de sucesso mensuráveis.

Ruim: "Melhorar experiência." Bom: "Reduzir número de cliques para concluir a ação X."

---

## Regras Obrigatórias

1. Descrever o problema, nunca a solução. Ruim: "O sistema deve ter um botão." Bom: "O usuário tem dificuldade para concluir a tarefa."
2. Focar em resultado, não em tecnologia.
3. Registrar contexto suficiente para que outro agente consiga gerar um PRD sem conversar de novo com o usuário.
4. Toda afirmação deve ter justificativa.

---

## Checklist de Qualidade

* [ ] Problema está claro
* [ ] Contexto está claro
* [ ] Objetivo está claro
* [ ] Usuários impactados identificados
* [ ] Módulos impactados identificados
* [ ] Riscos identificados
* [ ] Critérios de sucesso definidos
* [ ] Não existe discussão de implementação

## Critérios de Reprovação

Faltar problema claro, existir apenas solução proposta, faltar contexto, objetivo, impacto ou critérios de sucesso.

## Critérios de Aprovação

Qualquer desenvolvedor ou agente consegue gerar um PRD a partir dela, sem ambiguidades relevantes.

---

## Heurísticas Obrigatórias

Por quê é necessário? Para quem? O que acontece hoje? O que acontece se nada for feito? Existe alternativa operacional (sem código)?

Perguntas de produto, adaptadas aos indicadores definidos em `.ai/context/business.md`: isso reduz suporte/trabalho manual? Aumenta valor percebido? Aumenta retenção/ativação? O benefício é maior que a complexidade?

---

## Resultado Esperado

Gerar `intent/<slug>.md`, pronto para `$create-prd`.

---

## Regra Suprema

A Intent existe para garantir que estamos resolvendo o problema correto. Implementar a solução errada perfeitamente é pior do que não implementar nada. Entender o problema sempre tem prioridade sobre escrever código.
