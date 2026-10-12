# Test Plan — Consulta de reuniões

## Matriz de cobertura

| Requisito | Cenários e evidência |
| --- | --- |
| RF001 | Testes de componente e Playwright verificam navegação e guarda da rota. |
| RF002 | Integração valida somente `ENDED`, ordem, 20 itens, total/páginas e estado vazio; componente renderiza metadados. |
| RF003 | Integração valida segmentos por sequência e detalhe não autorizado; E2E valida leitura sem controles de escrita. |
| RF004/RN001–RN005 | Integração cobre owner, gestor do tenant, membro/individual, admin global, outro tenant, ativo e logs sem texto. |

## Testes de backend

- Serviço/controlador com banco efêmero: owner vê somente suas encerradas; membro/individual não vê call de outro usuário; gestor vê seu tenant; admin vê tenants distintos.
- Detalhe de sessão ativa, inexistente ou fora do escopo responde como não encontrado.
- Paginação com 21+ reuniões prova limite 20, ordenação decrescente e ausência de duplicação.
- Segmentos retornam por sequência e nunca incluem áudio ou sugestões.
- Logs de consulta incluem somente identificadores/escopo, não texto transcrito.

## Testes de frontend e E2E

- React Testing Library cobre carregamento, vazio, paginação, erro e detalhe somente leitura.
- Playwright cobre acesso pela barra, lista simulada e abertura do detalhe em desktop/mobile.

## Regressão e segurança

- Executar a suíte backend e frontend completas para preservar login, perfil, captura, encerramento e fluxo de call.
- Validar que nenhum parâmetro do navegador expande tenant, usuário ou papel.
- Executar build de ambos os módulos antes do E2E.
