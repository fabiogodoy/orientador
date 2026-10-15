# PRD — Organização da barra de reunião

## Metadados e origem
2026-10-15 · Codex · Aprovado · Slug: organizar-barra-reuniao.
Intent: `intent/organizar-barra-reuniao.md`.

## Objetivo e escopo
Restaurar clareza da interface autenticada para individuais e organizações. Uma única integração segura cobre a mudança de apresentação; tickets não necessários. Fluxo proporcional de correção de UI, com Impact Analysis e todas as reviews exigidas por AGENTS.md. Fora do escopo: backend, regras de avaliação/cobrança, captura/transcrição, novos recursos e deploy de produção.

## Requisitos funcionais e aceite
- RF001: topos autenticados exibem somente a identidade do usuário à direita; a marca aparece apenas no menu lateral; título, estado, duração e ferramentas ficam fora dele, em faixa logo abaixo. Perfil continua abrindo por clique.
- RF002: faixa da reunião apresenta título editável, status, duração, microfone, áudio da aba, sugerir, iniciar/encerrar e configurações. Mantém handlers e estados atuais. Textos longos e viewport entre 320 e 1920 px não sobrepõem controles nem provocam overflow horizontal. Edição funciona antes/durante a reunião, incluindo erro da API.
- RF003: menu usa logo clara existente sem filtro que apague o desenho. Símbolo e texto legíveis no fundo escuro.
- RF004: menu mostra acima de Sair os dias grátis restantes e data/hora de término, também em histórico/bases. No mobile o aviso fica dentro do menu expansível.

## Regras de negócio
- RN001: dias = teto da diferença positiva entre trialEndsAt e horário atual em períodos de 24 h, singular/plural corretos. Data/hora em pt-BR, America/Sao_Paulo. Não prolonga o acesso.
- RN002: atualizar aviso ao menos a cada minuto enquanto página ativa e ao recuperar foco. Prazo expirado informa avaliação encerrada; valor inválido informa prazo indisponível, nunca NaN/data inválida.
- RN003: manter ausência de cobrança automática e autorização de acesso exclusivamente no backend. Somente dados da conta autenticada já retornados por /auth/me.

## Requisitos não funcionais
RNF001: sem novas dependências ou requisições; um timer local limpo ao desmontar.
RNF002/003: preservar sessão, CSRF, permissões e tenant_id; não persistir dados novos nem registrar dados pessoais.
RNF004: React/TypeScript/CSS existentes; teclado, nomes acessíveis e responsividade mantidos. Topo reserva espaço ao menu mobile.
RNF005: preservar erros da captura/edição; estado inválido de prazo diagnosticável visualmente. Sem nova telemetria necessária.

## Fluxos e erros
Entrar → identificar conta no topo → ler título/estado abaixo → editar título ou usar captura. Abrir menu no mobile para consultar prazo. Falha de edição mantém feedback existente; prazo inválido não derruba a tela. Sessão negada segue fluxo atual de login.

## Dados, migração e rollback
Reutilizar Account.trialEndsAt e assets existentes. Sem contrato novo, migration ou ADR. Rollback: reverter commit desta entrega e reconstruir frontend.

## Testes e aprovação
Vitest para limite de dias, vencimento, dados inválidos e atualização; suíte existente para regressão de ações. Playwright com API simulada para geometria/ausência de overflow, menus, edição, perfil e erro; captura real sintética nos testes existentes. Build antes do navegador; evidências em test-results e relatório. Nenhuma decisão aberta.

## Ajuste confirmado em 2026-10-15
Solicitação direta do usuário: retirar a logo da barra e mantê-la apenas no menu. Aplica-se à reunião e ao cabeçalho compartilhado do histórico/detalhe. Demais requisitos preservados.
