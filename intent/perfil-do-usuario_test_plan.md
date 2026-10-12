# Plano de testes — Perfil do usuário autenticado

| RF | Cenário feliz | Erro/regressão |
| --- | --- | --- |
| RF001 | nome/iniciais reais no cabeçalho | ausência de avatar usa iniciais; call continua intacta |
| RF002/RF003 | abre perfil e salva nome válido | vazio/maior que 120 é rejeitado |
| RF004 | crop e upload JPG/PNG/WebP válido | navegador envia PNG quadrado; >10 MB, SVG, bytes inválidos e pixels excessivos são recusados |
| RF005 | remove avatar e retorna iniciais | foto anterior não é servida após remoção |
| RF006 | conta autenticada atualiza/consulta a si | anônimo é 401 e nenhuma rota aceita `userId` externo |

## Unitários

* Validação de nome, iniciais e estado do crop.
* Validação de tamanho/tipo/assinatura/dimensão de imagem e normalização.

## Integração

* PostgreSQL efêmero: migration, atualização de nome/avatar, endpoint privado, remoção e resposta de `me`.
* Tentativa sem sessão e acesso a avatar de outro contexto não retorna bytes.

## E2E

* Login, abrir perfil, recortar imagem fixture, salvar, recarregar e observar nome/avatar no topo.
* Remover a foto e observar iniciais; validar layout desktop/mobile.

## Evidências

`npm run build`, `npm test`, `./mvnw verify` com Java 21, Playwright Chromium e auditoria de governança.
