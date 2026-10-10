# Impact Analysis Report

> Este documento identifica todos os impactos potenciais da funcionalidade antes da implementação.
>
> Nenhuma implementação deve iniciar sem uma análise de impacto concluída.
>
> O objetivo não é aprovar a solução. O objetivo é descobrir o que pode quebrar.

---

# Metadados

## Título

## Slug

## Data

## Autor

## Intent

`intent/<slug>.md`

## PRD

`intent/<slug>_prd.md`

---

# Resumo Executivo

Resumo da alteração proposta.

---

# Complexidade Estimada

## Técnica

* Baixa / Média / Alta / Muito Alta

## Negócio

* Baixa / Média / Alta / Muito Alta

## Operacional

* Baixa / Média / Alta / Muito Alta

---

# Sistemas/Módulos Impactados

Marcar todos os sistemas afetados, conforme listados em `.ai/context/architecture.md`.

| Sistema/Módulo | Impacto   |
| -------------- | --------- |
| [preencher]    | Sim / Não |

---

# Impacto Por Sistema/Módulo

Para cada sistema impactado, descrever:

## [Nome do Sistema]

### Componentes Impactados

### APIs/Contratos Impactados

### Risco

* Baixo / Médio / Alto — Justificativa.

---

# Impacto em Dados / Banco de Dados (quando aplicável)

## Estruturas Impactadas

## Novas Estruturas

## Índices Necessários

## Volume de Dados

## Risco

* Baixo / Médio / Alto

---

# Impacto em Multi-Tenancy (quando aplicável)

* [ ] identificador de tenant validado
* [ ] isolamento preservado
* [ ] consultas revisadas
* [ ] permissões revisadas

---

# Impacto em Segurança

* [ ] autenticação revisada
* [ ] autorização revisada
* [ ] permissões revisadas
* [ ] dados sensíveis protegidos
* [ ] logs adequados

---

# Impacto em Performance

Avaliar leituras, escritas, relatórios, dashboards, APIs conforme aplicável.

## Risco

* Baixo / Médio / Alto

---

# Impacto em Integrações

Para cada integração externa relevante (ver `.ai/context/architecture.md`), avaliar o impacto.

---

# Impacto Operacional

Impacto esperado em suporte, operação, comercial, financeiro — conforme perfis definidos em `.ai/context/business.md`.

---

# Impacto no Cliente / Usuário

Descrever por perfil de usuário relevante.

---

# Impacto nos Indicadores

Avaliar impacto (positivo/neutro/negativo) e justificar, conforme os indicadores definidos em `.ai/context/business.md`.

---

# Riscos Identificados

## Risco 01

### Descrição

### Probabilidade

* Baixa / Média / Alta

### Impacto

* Baixo / Médio / Alto

### Mitigação

---

# Regressões Potenciais

O que pode parar de funcionar?

## RP001

---

# Estratégia de Rollback

Caso a implementação falhe, descrever.

---

# Estratégia de Testes

## Unitários

## Integração

## E2E

---

# Aprovação para Implementação

* [ ] Todos os impactos foram identificados?
* [ ] Os riscos possuem mitigação?
* [ ] Existe estratégia de rollback?
* [ ] Os testes estão definidos?

---

# Parecer Final

## Recomendação

* Implementar
* Implementar com ajustes
* Reavaliar
* Não implementar

## Justificativa

## Próxima Etapa

Executar `$architecture-review` antes da implementação.
