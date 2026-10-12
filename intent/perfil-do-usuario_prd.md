# PRD — Perfil do usuário autenticado

## Metadados

* **Slug:** `perfil-do-usuario`
* **Status:** Aprovado
* **Origem:** `intent/perfil-do-usuario.md`
* **Data:** 2026-10-12

## Escopo

### Dentro

* Área “Meu perfil” aberta pelo avatar/nome da conta autenticada.
* Exibição do nome real, e-mail em modo leitura e contexto factual de organização/papel quando existente.
* Alteração do próprio nome.
* Escolha, crop quadrado local, zoom/reposicionamento, persistência e remoção de foto.
* JPG, PNG e WebP de até 10 MB na seleção local; o crop no navegador produz PNG quadrado, que é a única representação aceita e normalizada pelo servidor.
* Avatar/nome reais no cabeçalho da call após carregar a sessão.

### Fora

* Edição de e-mail, senha, papel, organização ou tenant.
* Fotos de outros usuários, foto do cliente da call, galeria, redes sociais, CDN/armazenamento externo e avatares de participantes de transcrição.

## Requisitos funcionais

### RF001 — Identidade real no topo

O cabeçalho deve exibir nome e avatar da conta autenticada em vez de dados demonstrativos.

* Sem foto, exibir iniciais derivadas do nome real.
* Para organização, exibir o papel e o nome da organização disponíveis; não inventar cargo.

### RF002 — Abrir e consultar perfil

O bloco de identidade deve abrir “Meu perfil”, com preview da foto, nome editável, e-mail somente leitura e ações acessíveis por teclado.

### RF003 — Atualizar nome

A própria pessoa pode salvar nome não vazio, aparado e limitado a 120 caracteres; a resposta atualiza imediatamente o cabeçalho e a sessão corrente.

### RF004 — Recortar e salvar foto

A pessoa seleciona JPG, PNG ou WebP de até 10 MB, ajusta uma área quadrada com zoom e posição, e confirma o envio. O navegador produz PNG quadrado; o backend aceita somente esse formato normalizado, valida seu conteúdo e o associa à conta autenticada.

### RF005 — Remover foto

A própria pessoa pode remover a foto. O topo volta a mostrar iniciais, e a imagem não é mais retornada pelo endpoint autenticado.

### RF006 — Proteção e isolamento

Nenhuma operação recebe ou confia em `userId` enviado pelo navegador. Perfil e bytes da foto são sempre obtidos pela sessão autenticada; CSRF continua obrigatório para escritas.

## Requisitos não funcionais

* **RNF001 — Segurança:** rejeitar SVG, tipo não permitido, arquivo acima de 10 MB, imagem inválida ou dimensão/pixel excessivos; não registrar bytes, conteúdo ou dados de imagem em logs.
* **RNF002 — Multi-tenancy:** a foto é propriedade da conta autenticada; não há rota para escolher conta/tenant alheio.
* **RNF003 — Compatibilidade:** Chrome e Edge desktop; usar Canvas e APIs de arquivo nativas sem nova dependência de crop.
* **RNF004 — Performance:** normalizar avatar para 512×512 e servir resposta privada/cacheável, evitando enviar o original de até 10 MB em cada renderização.
* **RNF005 — Observabilidade:** logs sanitizados de atualização/remoção por identificador interno e categoria de falha, sem imagem, nome ou e-mail.

## Regras de negócio

* RN001 — O perfil pertence à conta de acesso, não ao tenant, organização ou sessão de call.
* RN002 — E-mail é identificador somente leitura neste escopo.
* RN003 — A imagem é opcional; ausência ou remoção usa iniciais do nome.
* RN004 — A seleção local aceita JPG, PNG ou WebP até 10 MB. O upload resultante é PNG; o servidor valida conteúdo real, não somente nome ou Content-Type.
* RN005 — A foto não aparece nos avatares do cliente/transcrição nesta entrega.

## Fluxo principal

1. A conta autenticada entra na call e vê seu nome/avatares reais.
2. Seleciona o bloco de identidade e abre “Meu perfil”.
3. Ajusta nome e/ou escolhe foto; no caso da foto, recorta o quadrado e confirma.
4. O navegador envia a atualização autenticada; o backend valida e persiste dados pertencentes à sessão.
5. O frontend atualiza o perfil e cabeçalho sem interromper captura ou call.

## Erros

* Arquivo inválido/grande: não envia ou não persiste; apresenta mensagem segura.
* Imagem rejeitada no servidor: mantém foto anterior e informa falha sem expor detalhes internos.
* Sessão ausente/expirada: mantém proteção atual de autenticação.

## Dados e APIs

Uma migration Flyway adiciona campos de avatar normalizado à conta de acesso. Operações autenticadas recuperam/atualizam o próprio perfil, obtêm o avatar privado e removem-no. A resposta de identidade inclui versão/URL autenticada da foto, sem expor blob em JSON.

## Testes exigidos

Cobrir atualização de nome, validação de imagem, remoção, ausência de foto, tentativa não autenticada, isolamento, regressão de login/call e fluxo visual de crop.
