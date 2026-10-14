# ADR-0010 — Exportação PDF no navegador

Status: aceita. Data: 2026-10-14. Intent: resumo-executivo-pdf.

O PDF do resumo executivo será criado localmente com pdfmake, importado sob demanda, fontes embutidas e logo oficial. Reutiliza exclusivamente metadados e análise já autorizados pela API, sem nova chamada de IA, endpoint ou cópia persistida. O motor de paginação evita cortes de texto e mantém o conteúdo pesquisável; impressão do navegador não atende download direto e captura como imagem compromete qualidade. O custo é um chunk adicional carregado apenas ao exportar. Dados da reunião entram como texto, nunca como HTML ou recursos remotos.

Referência: [documentação oficial de uso no cliente](https://pdfmake.github.io/docs/0.3/getting-started/client-side/). Versões fixadas: pdfmake 0.3.11 e @types/pdfmake 0.3.3.
