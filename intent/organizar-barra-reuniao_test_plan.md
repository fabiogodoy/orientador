# Test Plan — organizar-barra-reuniao
2026-10-15 · Codex. Fontes: Intent, PRD e Impact Analysis do mesmo slug.

## Matriz de cobertura
| Requisito | Feliz / alternativo / erro | Evidência |
|---|---|---|
| RF001 | Topo e perfil / nome longo mobile / sem sobreposição | Playwright e screenshot |
| RF002 | Editar e iniciar/encerrar / título longo e menus / falha de edição | Playwright, suíte de captura existente |
| RF003 | Asset claro carrega / menu mobile / filtro ausente | Playwright e inspeção visual |
| RF004 | Contador no menu / histórico e bases / data inválida | Vitest e Playwright |
| RN001–003 | Sete dias, um dia, fração / limite e expirado / inválido | Vitest com relógio controlado |
| RNF | Sem overflow / 320–1920px / menu curto | Playwright |

## Execução
npm run build, npm test; após build, preview local em porta exclusiva e npm run test:e2e com specs de layout e regressão de captura/sugestões. API simulada para testes de interface, nenhuma escrita em banco ou chamada ao provedor. Integração de backend não aplicável: contratos e servidor inalterados. Segurança/tenant: apenas conta da sessão, sem novas consultas; revisar diff e manter testes de autorização existentes fora do escopo de reexecução backend.

## Evidências e regressão
Saídas dos comandos e screenshots em frontend/test-results, logs locais em .scratch/organizar-barra-reuniao. Conferir perfil, edição, controles e configurações. Testar atualização por relógio/foco e cleanup. Encerrar servidor próprio ao concluir. Aprovação depende de todos RF/RN cobertos e execução sem falhas.

## Refinamento — 2026-10-15
Atualizar cenário existente: nenhum logo nos cabeçalhos autenticados, logo presente no menu; usuário continua à direita e não sobrepõe o botão mobile. Executar build, Vitest e meeting-toolbar.spec.ts (três cenários), auditoria e revisão visual.
