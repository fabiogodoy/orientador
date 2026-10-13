# Security Review — Transcrição e sugestões econômicas

## Parecer

**APROVADA.**

* O navegador não recebe a chave Groq; o backend lê a configuração operacional.
* Áudio é validado por usuário, call ativa e `tenant_id` antes da chamada externa.
* Logs de transcrição/sugestão registram IDs, fonte, duração e categoria, sem áudio, texto, resumo ou segredo.
* Blocos acima do limite e calls não autorizadas são recusados antes do encaminhamento.
* O resumo retornado pelo navegador é limitado e tratado como conteúdo não confiável; não é usado para autorização nem persistido.

Risco residual: a ativação produtiva exige confirmação operacional de retenção de dados do fornecedor, conforme ADR-0007.
