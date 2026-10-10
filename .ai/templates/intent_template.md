# Intent Template

> Este documento descreve o entendimento da necessidade de negócio.
>
> Nenhuma implementação deve iniciar sem uma Intent aprovada.
>
> A Intent descreve o problema. O PRD descreve a solução.

---

# Metadados

## Título

[Nome curto da funcionalidade]

## Slug

[slug-da-funcionalidade]

## Data

[YYYY-MM-DD]

## Autor

[Usuário | Agente | Desenvolvedor]

## Status

* Draft
* Em Análise
* Aprovada
* Cancelada
* Substituída

---

# Resumo Executivo

Descreva em poucas linhas o que está sendo solicitado.

---

# Problema

## Problema Principal

Qual problema real está sendo enfrentado? Descreva sem propor solução.

## Sintomas

Quais sintomas indicam a existência desse problema? (ex.: excesso de suporte, retrabalho, lentidão operacional, abandono de uso)

## Evidências

Quais evidências sustentam a existência do problema? (chamados, reclamações, métricas, feedbacks, observação operacional)

---

# Contexto de Negócio

Descreva o contexto necessário para compreender a solicitação, consultando `.ai/context/business.md`.

Perguntas obrigatórias:

* Por que isso é importante?
* O que acontece hoje?
* O que acontece se nada for feito?

---

# Objetivo

Qual resultado desejamos alcançar? Não descrever implementação, descrever resultado.

Ruim: "Adicionar botão de pagamento."
Bom: "Facilitar o pagamento pelo usuário final."

---

# Benefícios Esperados

Descrever por persona/perfil de usuário relevante (definidos em `.ai/context/business.md`).

---

# Usuários Impactados

Marcar todos os perfis de usuário envolvidos (ver `.ai/context/business.md`).

---

# Módulos/Sistemas Impactados

Marcar todos os módulos e sistemas/repositórios impactados (ver `.ai/context/architecture.md`).

---

# Processo Atual

Descrever como o usuário realiza a atividade atualmente, passo a passo.

---

# Dores do Processo Atual

Listar problemas do fluxo atual.

---

# Resultado Esperado

Descrever como o cenário ideal deve funcionar, sem detalhar implementação.

---

# Restrições

## Técnicas

## Operacionais

## Financeiras

## Legais

---

# Regras de Negócio Conhecidas

Listar regras já conhecidas, com identificador.

Exemplo:

RN001 — [descrição da regra]

---

# Hipóteses

Quais hipóteses estão sendo assumidas?

---

# Riscos

## Riscos Técnicos

## Riscos Operacionais

## Riscos de Produto

## Riscos de Regressão

---

# Impacto Esperado nos Indicadores

Avaliar impacto (positivo / neutro / negativo) nos indicadores relevantes definidos em `.ai/context/business.md` (ex.: churn, retenção, ativação, receita, suporte).

---

# Critérios de Sucesso

A funcionalidade será considerada bem-sucedida quando:

## CS001

## CS002

---

# Critérios para Não Implementar

Liste situações que invalidariam a necessidade.

---

# Alternativas Consideradas

Quais alternativas já foram avaliadas?

---

# Perguntas em Aberto

Liste dúvidas ainda não respondidas.

---

# Aprovação da Intent

* [ ] A Intent descreve claramente o problema?
* [ ] Existe valor de negócio?
* [ ] O objetivo está claro?
* [ ] Está pronta para gerar PRD?

---

# Próximo Passo

Se aprovada, gerar `intent/<slug>_prd.md` com `$create-prd`.
