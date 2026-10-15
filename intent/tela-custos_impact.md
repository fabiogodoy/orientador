# Impact Analysis — tela-custos
2026-10-15. Intent: tela-custos.md. PRD: tela-custos_prd.md.

## Complexidade e módulos
Técnica média/alta; negócio médio; operação média. Frontend: tela/rota/topo/API. Backend: instrumentação de clientes, ledger e consulta agregada/câmbio. PostgreSQL: migration aditiva e índices. Landing: não. Provedores atuais: leitura adicional de metadados. BCB: integração pública sem credencial.

## Sincronização e isolamento
Monorepo único. Fetch origin concluído; main/origin/main 1d596bbd52261bb00655e0a38f22c2c3a85ebadf. Worktree isolado tela-custos, branch codex/tela-custos contém origin/main. Original possui alteração externa GroqTranscriptionClient.java e .scratch/; preservar fora do commit. Esta conversa está dedicada à Intent; sem criação de outra conversa porque isso exige pedido explícito nas ferramentas.

## Dados, segurança e performance
Ledger guarda IDs/horário/categoria/provedor/modelo/unidades/tarifa/custo, não conteúdo. FK composta de call/tenant/usuário e scope validado pelo backend. Índices por call e data. Cresce por operação; queries agregadas em SQL, lista de 20. Credenciais existentes intactas. Cache PTAX é público e global; timeout limitado e fallback persistido. Nenhuma integração lê dados pessoais externos.

## Riscos e mitigação
| Risco | Probabilidade/impacto | Mitigação |
|---|---|---|
| Cobrança parcial/metadata ausente | média/alto | registrar tentativa antes, null não zero, aviso de incompletude |
| Falha ou tarifa alterada | média/médio | tarifa versionada por evento, documentação e atualização futura |
| Cotação indisponível | média/médio | cache persistido, timeout, transparência e US$ preservado |
| Regressão de transcrição/sugestões | média/alto | callbacks opcionais, testes de contrato/falha, nenhuma mudança de prompt/modelo |
| Navegação encerra call | média/alto | dialog sem desmontar call, teste funcional |
| Vazamento entre tenants | baixa/alto | scope derivado da sessão, FK e testes por perfil |
| Conflito com mudança local | média/médio | worktree e preservação explícita durante reintegração |

## Produto e operação
Todos os perfis ganham visibilidade correspondente à autorização atual. Não é faturamento nem medida de economia; indicadores ainda não definidos. Estimativas podem divergir de descontos/créditos do provedor; UI informa limites. Regressores: captura, sugestões inválidas, histórico e barra móvel.

## Rollback e testes
Reverter aplicação mantendo estruturas aditivas; exclusão de dados financeiros só por migration planejada. Unitários, integração Testcontainers exclusivamente, E2E e auditoria de governança. ADR exigida para novo ledger e integração de câmbio. Recomendação: implementar.

## Revisão de navegação — 2026-10-15
Somente frontend: App.tsx (menu/remoção dos botões), CostsPage.tsx (remoção do wrapper modal e modo embedded), costs.css e testes. Reutilizar CostsRoute e autenticação existentes. Navegação tem o ciclo de vida das demais páginas; não mantém captura em segundo plano na mesma aba (RN005 atualizado pelo pedido). API, banco e ADR-0011 intactos. Sincronização: main contém origin/main 94f55e86796b1635254add37ecdb20fc5829e13c após fetch. Preservar GroqTranscriptionClient.java modificado e .scratch/ fora do staging. Risco baixo; validar menu móvel, reload/back, login, erros e toolbar. Rollback pelo revert do commit de frontend.
