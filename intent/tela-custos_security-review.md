# Security Review — tela-custos
2026-10-15. APROVADA. Risco inerente médio; nenhuma vulnerabilidade crítica/alta identificada.

GET /api/costs segue sessão autenticada/expiração e não aceita tenant/user alvo. Identidade vem do servidor. Usuário comum recebe filtro tenant+user; gestor tenant; admin global explícito com log. Testes isolam colega, outro tenant, gestor e admin; FK composta impede associar evento de outro tenant/usuário. Não autenticado recebe 401, expirado 403. Intervalo e página validados; SQL parametrizado. Autorizar call precede tentativa/custo/provedor, comprovado no teste de serviço.

Ledger retém apenas metadados/unidades/custos; áudio, transcrições, sugestões, chave e payload completo não são adicionados. PTAX usa host fixo HTTPS e datas do servidor, sem entrada de URL nem credencial. JSON na UI renderiza como texto; histórico por link segue autorização existente. Credenciais/configurações preexistentes preservadas. Não foram chamadas APIs de IA reais na validação. Alteração local externa de fallback não pertence ao commit.
