---
name: security-review
description: "Revisa mudanças quanto a autenticação, autorização, exposição de dados, credenciais, multi-tenancy, tratamento de entrada e regressões de segurança. Use antes da entrega quando dados protegidos ou permissões estiverem envolvidos."
---

# Skill: Security Review

## Objetivo

Realizar uma revisão completa de segurança da solução proposta e da implementação realizada.

Esta skill atua como Security Engineer. Se o projeto for multi-tenant (ver `.ai/context/architecture.md`), a pergunta central é:

```text
Um usuário mal-intencionado conseguiria acessar dados de outro tenant/organização?
```

Se a resposta for potencialmente sim: STATUS = REPROVADO.

## Princípio Fundamental

Funcionalidade sem segurança não é funcionalidade. Segurança tem prioridade sobre conveniência.

---

## Referências Obrigatórias

* `AGENTS.md`
* `.ai/context/architecture.md`
* `.ai/context/coding-standards.md`
* `.ai/context/testing-standards.md`
* Intent, PRD, Impact Analysis, ADR (quando existir), código implementado

## Entrada / Saída

Entrada: `intent/<slug>.md`, `intent/<slug>_prd.md`, `intent/<slug>_impact.md`, mais a implementação.
Saída: `intent/<slug>_security-review.md`

---

## Processo

1. **Classificar o risco** da alteração: baixo / médio / alto / crítico. Alto risco típico: login, permissões, dados financeiros, pagamentos, APIs públicas, dados pessoais, integrações externas.
2. **Multi-tenancy** (quando aplicável) — existe qualquer possibilidade de um tenant acessar dados de outro? Checklist: identificador de tenant validado, isolamento preservado.
3. **Autenticação** — o usuário realmente é quem diz ser? Existe bypass?
4. **Autorização** — o usuário só pode executar ações permitidas ao seu perfil? Existe escalonamento de privilégios?
5. **IDOR** — um usuário pode alterar IDs/parâmetros para acessar recursos que não são seus?
6. **APIs/endpoints** — toda validação crítica está no servidor, nunca só no cliente? A API confia cegamente em dados enviados pelo cliente?
7. **Banco de dados** — toda consulta possui filtro de isolamento correto quando aplicável?
8. **Dados sensíveis** — identificação, contato, dados financeiros, tokens: estão protegidos, não expostos, não logados?
9. **Logs** — o sistema registra senha, token ou segredo em algum ponto? Se sim, reprovar.
10. **Segredos** — existe segredo hardcoded no código? Se sim, reprovar.
11. **Integrações externas** — autenticação, assinatura, validação de origem; é possível falsificar uma chamada?
12. **Uploads** (quando aplicável) — validação de tipo e tamanho de arquivo.
13. **Frontend/cliente** — nunca é mecanismo de segurança; toda regra crítica deve estar validada no servidor.

---

## Classificação de Vulnerabilidades

Crítica (acesso indevido, vazamento, escalonamento) / Alta (compromete segurança/integridade) / Média (mitigação parcial) / Baixa (impacto reduzido).

## Checklist Final

* [ ] autenticação validada
* [ ] autorização validada
* [ ] multi-tenancy validada (quando aplicável)
* [ ] APIs revisadas
* [ ] consultas revisadas
* [ ] dados sensíveis revisados
* [ ] segredos revisados
* [ ] integrações revisadas

## Critérios de Reprovação

IDOR, vazamento entre tenants, escalonamento de privilégios, segredo hardcoded, exposição de dados sensíveis, autenticação inadequada.

## Critérios de Aprovação

Nenhuma vulnerabilidade crítica ou alta; isolamento, autenticação e autorização corretos.

---

## Parecer Final

Status (APROVADO / APROVADO COM RESSALVAS / REPROVADO), nível de risco, vulnerabilidades encontradas, recomendações.

## Próxima Etapa

Se aprovado, executar `$observability-review`.

---

## Regra Suprema

A maior ameaça não é uma falha de código isolada — é uma falha de isolamento entre usuários/tenants. Toda revisão de segurança deve começar verificando: "existe alguma forma de um usuário acessar dados de outro?" Se a resposta não for um "não" absoluto: STATUS = REPROVADO.
