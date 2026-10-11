# Architecture Review — Transcrição operacional da call

**Status: APROVADA.**

Frontend é o local correto para estado vazio e mensagens de captura; backend é o local correto para emissão de segredo, logs seguros e persistência. A alteração reutiliza API, serviço, migrations V02/V03 e WebRTC existentes, sem dependência nova ou alteração de arquitetura. A estrutura de dados não muda; Flyway continua responsável por aplicar migrations. O isolamento por `tenant_id` e usuário deve permanecer no serviço, não no navegador.
