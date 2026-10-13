# Architecture Review — Normalização da rota /app

**Parecer: APROVADA.**

O módulo correto é `frontend/`, pois a falha é produzida pelo Vite antes do React carregar. Um middleware mínimo do próprio Vite reutiliza a stack instalada, mantém `base: '/app/'`, não cria dependências e não contamina `App.tsx` com uma preocupação de servidor. Não há banco, API, tenant, autorização ou ADR envolvidos.
