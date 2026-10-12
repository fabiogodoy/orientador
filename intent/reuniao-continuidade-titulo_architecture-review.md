# Architecture Review — Continuidade e título das reuniões

## Parecer: APROVADA

O frontend permanece responsável somente por captura local e apresentação. O backend continua responsável por criar, encerrar e autorizar mutações de `call_sessions`; PostgreSQL recebe migration Flyway versionada. A alteração reutiliza a sessão e o isolamento já existentes, sem dependência nova e sem transportar áudio pela API.

O título é atributo da reunião, não de uma fonte de captura, e a regra de primeiro título é aplicada no frontend como conveniência; o servidor valida o valor e a propriedade. A transição para encerramento explícito é compatível com a ADR-0003: as fontes seguem independentes e escrevem na mesma sessão. Complexidade média, justificada pela preservação de dados de conversa.
