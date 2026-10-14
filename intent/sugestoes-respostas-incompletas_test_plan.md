# Test Plan

Referências: Intent, PRD e Impact do mesmo slug.

| RF/RN | Cenários |
|---|---|
| RF001/RN001 | Capturar request HttpClient e conferir 1200, modelo, schema/compactação; uma chamada |
| RF002/RN002 | completed válido; incomplete por tokens com JSON cortado e com JSON aparentemente válido; refusal; ausente; malformado; resumo excedido; recuperação após falha |
| RF003 | Falha/sucesso por fonte; outra fonte não limpa; retorno tardio ignorado |
| RF004/RN004 | Erro de sugestão e áudio → encerrar → sem retry/erro; nova call com resumo vazio; erro de histórico preservado |
| RF005 | 130 blocos com relógio simulado, falha intermediária e recuperação mantendo resumo anterior |
| RN003 | Logs sem payload; suíte de autorização/isolamento Testcontainers existente |

Backend: Java 21 ./mvnw verify, somente PostgreSQL efêmero Testcontainers. Front: npm run build, npm test, E2E focal Chromium com mídia/API simuladas depois dos builds. Teste de contrato do fornecedor usa respostas sintéticas; não prova qualidade semântica de uma reunião real. Auditoria de governança, revisão do diff, health local após restart. Evidências em tmp/sugestoes-respostas-incompletas e frontend/test-results.

Data: 2026-10-14. Autor: Codex. Slug: sugestoes-respostas-incompletas.
