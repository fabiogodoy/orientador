---
name: observability-review
description: "Revisa logs, métricas, rastreamento, diagnósticos e prontidão para troubleshooting em produção. Use quando a mudança afetar fluxos, integrações ou comportamento operacional."
---

# Skill: Observability Review

## Objetivo

Validar se a funcionalidade possui observabilidade suficiente para operação em produção. Esta skill atua como um SRE.

```text
Se isso quebrar amanhã em produção, conseguiremos descobrir o motivo?
```

Se a resposta for não: STATUS = REPROVADO.

## Princípio Fundamental

Funcionalidade sem observabilidade gera suporte caro.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/architecture.md`
* `.ai/context/coding-standards.md`
* Intent, PRD, Impact Analysis, implementação

## Entrada / Saída

Entrada: `intent/<slug>.md`, `intent/<slug>_prd.md`, `intent/<slug>_impact.md`, implementação.
Saída: `intent/<slug>_observability-review.md`

---

## Processo

1. **Identificar fluxos críticos** — a funcionalidade impacta autenticação, pagamentos, integrações ou outro fluxo classificado como crítico em `.ai/context/business.md`/`architecture.md`? Classificar baixo/médio/alto/crítico impacto.
2. **Logs** — existe log suficiente para entender início, sucesso, falha e exceção da operação?
3. **Contexto dos logs** — permitem identificar usuário, tenant/organização, operação e recurso afetado? O suporte conseguiria diagnosticar só com os logs?
4. **Dados sensíveis nos logs** — senha, token, segredo, dado financeiro completo não podem aparecer.
5. **Tratamento de exceções** — são tratadas, registradas e propagadas corretamente? `catch` vazio é proibido.
6. **Auditoria** — a operação precisa registrar quem fez o quê (ex.: exclusão de registro, alteração financeira, mudança de permissão)?
7. **Integrações externas** — requisição, resposta e erro são registrados o suficiente para diagnosticar uma falha da integração?
8. **Banco de dados** — em caso de inconsistência, é possível rastrear a origem?
9. **APIs** — uma chamada problemática pode ser reproduzida depois?
10. **Frontend/cliente** — mensagens de erro e feedback visual são úteis para o usuário e rastreáveis para o suporte?
11. **Métricas** — existe algum indicador operacional relevante a monitorar (volume de execuções, falhas, tempo de resposta)?

---

## Checklist de Observabilidade

* [ ] logs adequados
* [ ] erros e exceções registrados
* [ ] contexto suficiente nos logs
* [ ] integrações rastreáveis
* [ ] auditoria avaliada
* [ ] métricas avaliadas

## Critérios de Reprovação

Falhas críticas não registradas, exceções ignoradas, integrações não rastreáveis, auditoria necessária ausente.

## Critérios de Aprovação

Problemas podem ser investigados, logs suficientes, integrações rastreáveis, auditoria adequada.

---

## Parecer Final

Status (APROVADO / APROVADO COM RESSALVAS / REPROVADO), capacidade de diagnóstico, risco operacional, recomendações.

## Próxima Etapa

Se aprovado, seguir para `$implementation-review` ou `$validate-delivery`, conforme o fluxo.

---

## Regra Suprema

O problema mais caro não é o erro — é não conseguir descobrir por que ele aconteceu. Toda funcionalidade deve deixar rastros suficientes para investigar qualquer incidente em produção.
