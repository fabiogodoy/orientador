# Test Plan — Resumo executivo PDF

Data: 2026-10-14. Slug: resumo-executivo-pdf. Autor: Codex.
Referências: Intent, PRD, Impact de mesmo slug.

| Requisito | Cenários / evidências |
|---|---|
| RF001 | Componente e PDF com novo rótulo, nomes e ausência |
| RF002 / RN001 | Download Chromium; não exporta estados não concluídos; nenhuma chamada de geração |
| RF003 / RN002 | PDF real com logo/metadados/seções, acentos, vazios, texto extraído sem transcrição |
| RF004 | Documento longo com último bloco presente, páginas numeradas, texto dentro das margens; renderização de páginas |
| RF005 | Falha de exportação seguida de sucesso; botão ocupado, retry, resumo preservado |
| RN003 | Texto com marcação/URLs tratado literalmente, sem imagens ou links remotos |

Unitários: documento e nome seguro; estados do botão; erro de importação/exportação. Integração: motor PDF real via browser e fixtures. E2E focal: API simulada, sem backend/banco pois endpoints não mudam. Negativo de acesso: detalhe negado não apresenta exportação. Regressão: suíte Vitest existente, resumo vazio, transcrição e retry.

Build npm run build antes de E2E. npm test; npm run test:e2e -- tests/executive-summary-pdf.spec.ts. Executar servidor preview local, finalizar ao concluir. PDFs/screenshots/logs em frontend/test-results e tmp/resumo-executivo-pdf. Inspeção com pdftoppm e pypdf/pdfplumber. scripts/governance-audit.sh e npm audit. Sem testes em banco persistente.
