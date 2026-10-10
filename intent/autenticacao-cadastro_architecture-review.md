# Architecture Review — Autenticação e cadastro

- Data: 2026-10-10
- Parecer: **APROVADA COM RESSALVAS**.

`frontend/` concentra apresentação e estado; `backend/` concentra identidade, tenant, autorização, prazo e persistência; Termos são públicos sem acesso a dados privados. A estrutura respeita `.ai/context/architecture.md` e usa a stack definida. Não há código anterior reutilizável além da identidade visual e do texto jurídico. A complexidade é alta por ser a primeira infraestrutura de autenticação, mas evita provedores e serviços externos sem necessidade.

Flyway é obrigatório para o primeiro schema. Spring Security e validação de entrada justificam-se pelo risco de contas e dados; bibliotecas de interface devem ser mínimas. A ADR-0001 registra a escolha de sessão e tenant. Ressalvas: sessão em memória não serve a múltiplas instâncias; sem verificação de e-mail e recuperação automática, a operação comercial exige evolução. Antes de produção, validar TLS da API, CORS, HTTPS e roteamento `/app/*`. Não se deve habilitar captura ou persistência de transcrições nesta entrega.
