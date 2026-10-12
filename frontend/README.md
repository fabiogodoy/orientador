# Aplicação web do Orientador

Área reservada à aplicação React/TypeScript em https://orientador.connectas.com.br/app.

Esta primeira entrega contém login, cadastro individual/organizacional, Termos públicos e uma área autenticada com captura de microfone e áudio de aba para transcrição em tempo real. A orientação comercial é preenchida a partir da fala final do cliente.

Com Node.js compatível, rode `npm ci`, `npm run dev`, `npm run build` e `npm test`. O desenvolvimento abre em `http://localhost:5173/app/`. A API local padrão é `http://localhost:8080`; `VITE_API_URL` pode sobrescrever a URL pública da API. A build de produção usa `https://api-orientador.connectas.com.br` por padrão. O servidor estático precisa servir `/app/*` com fallback para o `index.html`.

Para E2E, execute `npx playwright install chromium` uma vez e `npm run test:e2e` com frontend, backend e um PostgreSQL efêmero ativos. A página de Termos renderiza diretamente o texto-fonte em `../docs/legal/termos-de-uso.md`, evitando divergência editorial.
