# ADR-0005 — Avatar de perfil normalizado no PostgreSQL

**Status: aceita.** A foto de perfil da conta autenticada será armazenada como avatar normalizado (PNG 512×512 e metadados mínimos) em colunas nullable de `users`, e será servida apenas por rota autenticada. Para o primeiro escopo, isto preserva persistência entre dispositivos sem introduzir credenciais, bucket, URLs públicas ou volume persistente de filesystem. O original enviado e seus metadados não serão retidos; se volume/custo justificar armazenamento de objetos no futuro, a migração será tratada como decisão nova.
