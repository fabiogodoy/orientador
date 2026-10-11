# Test Plan — Tela de call ao vivo

## Metadados

| Campo | Valor |
| --- | --- |
| Slug | `tela-call-ao-vivo` |
| Data | 2026-10-11 |
| Intent | `intent/tela-call-ao-vivo.md` |
| PRD | `intent/tela-call-ao-vivo_prd.md` |
| Impact | `intent/tela-call-ao-vivo_impact.md` |

## Matriz de cobertura

| RF | Cenário feliz | Alternativo/erro | Evidência |
| --- | --- | --- | --- |
| RF001 | CT001 home autenticada mostra a call | CT002 usuário sem sessão segue redirecionamento existente | Vitest e E2E |
| RF002 | CT003 todos os controles estão rotulados | CT004 configurações/controles não usam APIs de mídia | Vitest |
| RF003 | CT005 transcrição contém falas e autoria | — | Vitest/screenshot |
| RF004 | CT006 gerar outra altera sugestão e histórico expande | CT007 copiar sem Clipboard API não quebra interface | Vitest |
| RF005 | CT008 alternâncias e encerrar/iniciar alteram apenas estado local | CT009 nenhum `getUserMedia`/requisição é disparado | Vitest |
| RF006 | CT010 layout não cria overflow em 375 px | — | E2E/screenshot |

## Testes unitários e de componente

* CT001 — Mockar `api.me`; verificar título da call, transcrição e sugestão ao renderizar `/app/`.
* CT003 — Verificar botões por nome acessível e estado `aria-pressed` quando aplicável.
* CT005 — Verificar que “Você” e “Cliente” aparecem em falas distintas e em conteúdo mockado.
* CT006 — Acionar “Gerar outra” e expansão do histórico; verificar mudança de conteúdo/estado.
* CT008 — Acionar microfone, áudio de aba e encerrar/iniciar; verificar estado exibido sem efeito externo.
* CT009 — Espionar `fetch` e APIs de mídia; verificar que controles locais não os invocam.

## Integração

Não aplicável: não há serviço, persistência ou contrato novo.

## E2E e responsividade

* CT002 — Com frontend, API e PostgreSQL efêmero, login de usuário válido abre `/app/`; sessão expirada/não autenticada mantém o redirecionamento atual.
* CT010 — Em Chromium em 375 px, a página exibe transcrição e sugestão em uma coluna sem rolagem horizontal.

## Regressão, segurança e multi-tenancy

* CT011 — Executar os testes existentes de cadastro, login e Termos.
* CT012 — Confirmar que a proteção de `/app/` é mantida para usuário não autenticado.
* CT013 — Confirmar por inspeção/teste que o mock não carrega nem expõe dados de tenants.

## Evidências esperadas

Saídas de `npm run build` e `npm test`; resultado de Playwright quando o ambiente completo estiver disponível; screenshot local da viewport desktop/móvel quando possível.
