# Test Plan

> Este documento traduz o PRD em cenários de teste verificáveis. Nenhum requisito é considerado coberto sem um cenário aqui e evidência de execução real.

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

## Impact Analysis

`intent/<slug>_impact.md`

---

# Resumo

Resumo do que será validado.

---

# Matriz de Cobertura

Para cada Requisito Funcional do PRD, mapear os cenários de teste.

| RF    | Cenário Feliz | Cenário Alternativo | Cenário de Erro | Evidência Esperada |
| ----- | ------------- | -------------------- | ---------------- | ------------------- |
| RF001 | CT001         | CT002                 | CT003             | [log/screenshot/…]  |

---

# Testes Unitários

Obrigatórios para toda regra de negócio nova ou alterada.

## CT001

### Regra validada

### Entrada

### Resultado esperado

---

# Testes de Integração

Obrigatórios quando houver integração entre camadas (serviço + persistência, endpoint + regra de negócio) ou com sistemas externos.

Se o teste acessar banco de dados, usar exclusivamente o banco autorizado em `.ai/context/testing-standards.md`. Divergência bloqueia o teste.

## CT0XX

---

# Testes E2E

Obrigatórios para alteração com impacto visual ou de fluxo. Ferramenta definida em `.ai/context/testing-standards.md`.

Antes da execução: rodar o build do projeto afetado; se falhar, interromper.

## CT0XX

---

# Testes de Regressão

O que pode parar de funcionar após esta alteração? Criar cenário específico para cada risco identificado no Impact Analysis.

## CT0XX

---

# Multi-Tenancy (quando aplicável)

## CT0XX

Usuário/tenant A não pode visualizar dados do tenant B.

---

# Segurança

## CT0XX

Usuário sem permissão não pode acessar recurso protegido.

---

# Performance (quando aplicável)

Cenários para consultas, relatórios ou dashboards sensíveis a volume/latência.

---

# Evidências

Para cada teste executado, indicar onde a evidência (log, screenshot, vídeo, saída de comando) está registrada.

---

# Checklist

* [ ] Todos os RF cobertos
* [ ] Todas as RN cobertas
* [ ] Cenários positivos e negativos definidos
* [ ] Regressão definida
* [ ] Multi-tenancy definida (quando aplicável)
* [ ] Segurança definida
* [ ] E2E definido quando aplicável

---

# Próxima Etapa

Após a implementação, executar os testes deste plano com evidência real e seguir para `$implementation-review` e `$validate-delivery`.
