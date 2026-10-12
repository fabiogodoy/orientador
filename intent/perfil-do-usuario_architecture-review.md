# Architecture Review — Perfil do usuário autenticado

## Parecer: APROVADA COM RESSALVAS

`frontend/` é o local correto para seleção/crop e apresentação; `backend/` é a fronteira correta para validar arquivo, derivar identidade e normalizar bytes. PostgreSQL é uma escolha adequada ao avatar único e pequeno por conta nesta fase, evitando novo provedor. A migration é obrigatória e deve adicionar apenas campos nullable a `users`.

Ressalvas: não aceitar `userId` no contrato, não confiar em Content-Type/extensão, limitar pixels antes de alocar imagem e servir o blob apenas por rota autenticada com cache privado. O navegador Chromium decodifica JPG/PNG/WebP e o Canvas envia somente PNG após o crop; o backend aceita apenas PNG validado com `ImageIO`. Assim não introduzimos dependência de decoder WebP no servidor nem aceitamos o original do usuário.
