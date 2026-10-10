# intent/

Cada entrega gerada pelo fluxo do harness cria, com o mesmo `<slug>`, os arquivos:

```text
intent/<slug>.md                          # $create-intent
intent/<slug>_prd.md                      # $create-prd
intent/<slug>_impact.md                   # $impact-analysis
intent/<slug>_architecture-review.md      # $architecture-review
intent/<slug>_business-review.md          # $business-review
intent/<slug>_test_plan.md                # $generate-tests
intent/<slug>_implementation-review.md    # $implementation-review
intent/<slug>_security-review.md          # $security-review
intent/<slug>_observability-review.md     # $observability-review
intent/<slug>_validation_report.md        # $validate-delivery
```

Nem toda entrega gera todos os arquivos — bugs pequenos podem seguir o caminho simplificado da Matriz de Decisão em `.agents/skills/orchestrator/SKILL.md`. O `<slug>` é a fronteira de contexto de cada Intent: nunca misture arquivos de slugs diferentes em uma mesma entrega.

Esta pasta começa vazia. Este arquivo existe só para o Git rastrear o diretório — pode ser removido quando a primeira Intent for criada, se preferir.
