# Test Plan — Orientação ágil e contextual
2026-10-15; Codex. Referências: orientacao-agil-contextual.md, _prd.md e _impact.md.

## Matriz de Cobertura
| RF/RN | Feliz | Alternativo / erro | Evidência |
|---|---|---|---|
| RF001/RN001 | bloco 8 s e pausa após 5 s | silêncio, pausa curta, parada, detector ausente | Vitest fake clock |
| RF002/RN005 | geração em 300 ms | única pendente, throttle/coalescência e falha | Vitest |
| RF003/RN002/003/004 | Resposta/Comentário/Pergunta | Ouvir válido, contrato inválido recusado | JUnit contrato/prompt + E2E |
| RF004 | descarta obsoleta | mic, ordem invertida, expiração, encerramento | Vitest |
| RF005 | declaração substancial e manual | saudação curta ignorada | Vitest/E2E |
| RF006 | buffer limitado e tempos | nenhum conteúdo, teto preservado | Vitest/JUnit |

## Integração / Segurança / Regressão
Maven verify Java 21, PostgreSQL efêmero Testcontainers exclusivamente. Reexecutar testes existentes de autorização/tenant. Npm test/build. Playwright Chromium com frontend executando após builds; API simulada para áudio/sugestões, sem alegar teste do fornecedor real. Recuperação de erro em call longa, parada e botões continuam.

## Performance / Evidências
Medir espera local com relógio controlado e comparar 15 s + 1,8 s anteriores a 5–8 s + 0,3 s novos; não confundir com medição de transcrição/modelo externo. Saídas .scratch/orientacao-agil-contextual; report sumariza resultados. Auditoria scripts/governance-audit.sh obrigatória. Todos RF/RN têm cenários, incluídos negativos e E2E.
