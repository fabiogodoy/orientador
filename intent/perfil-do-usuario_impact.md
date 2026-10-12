# Análise de impacto — Perfil do usuário autenticado

## Resumo

Mudança média/alta: acrescenta dados de imagem à conta, migration, upload autenticado e interface de crop. Frontend, backend e PostgreSQL são afetados; landing e OpenAI não são. A maior superfície nova é upload de arquivo, mitigada por limite de 10 MB, decodificação/normalização no servidor e rotas estritamente ligadas à sessão.

## Sistemas impactados

| Sistema | Impacto |
| --- | --- |
| frontend | Perfil, crop local, nome/avatar reais e estados de erro. |
| backend | Contratos autenticados, validação/normalização de imagem e logs sanitizados. |
| PostgreSQL | Campos de avatar e data de alteração na tabela `users`; migration reversível por nulidade. |
| landing/OpenAI | Não. |

## Dados, segurança e tenancy

Foto e nome são dados pessoais. A consulta/escrita usa exclusivamente o `userId` da sessão; a foto não é buscada por identificador controlado pelo cliente e não atravessa tenants. O navegador aceita JPEG/PNG/WebP para o crop e produz PNG; o servidor aceita e valida somente PNG, rejeitando SVG e qualquer outro conteúdo. O servidor normaliza para PNG 512×512, descartando metadados e arquivo original. A imagem é entregue apenas por rota autenticada com `Cache-Control: private`.

## Riscos e mitigação

* **Imagem-bomba/memória — média/alta:** limitar bytes, dimensões e pixels antes de normalizar.
* **Arquivo disfarçado — média/alta:** validar com decoder, não por extensão/Content-Type.
* **Crescimento do banco — média/média:** armazenar somente avatar normalizado e pequeno; não manter original/histórico.
* **Regressão da call — média/média:** atualização de perfil não cria/encerra fontes de captura ou sessão.
* **Cache indevido — média/alta:** rota privada, sem URL externa pública, cache privado.

## Rollback

Ocultar a área e parar de carregar avatar; colunas nullable não afetam contas existentes. A migration de rollback documenta remoção dos campos após backup/remoção consciente dos dados de avatar.

## Decisão de ADR

Sim. Persistir imagem normalizada no PostgreSQL em vez de filesystem/object storage é uma escolha de fronteira e retenção de dados que precisa permanecer explícita.

## Parecer

Implementar com controles de upload, migration e testes de integração/isolamento.
