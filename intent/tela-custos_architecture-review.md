# Architecture Review — tela-custos
2026-10-15. APROVADA.

Intent/PRD/Impact e ADR-0011 revisados. Backend faz autorização, cálculo decimal, ledger e integração BCB; frontend apresenta snapshot com dialog preservando captura. Reutiliza JDBC, HttpClient, sessão/CSRF e histórico; sem bibliotecas novas. Complexidade média/alta justificada pela medição inexistente. Migration aditiva, FK composta e índices, lista paginada. Metadados financeiros não violam proibição de guardar conteúdo de sugestões. Testes devem comprovar uso retornado mesmo com resposta inválida e escopo global auditado. Débito: catálogo de tarifas requer manutenção explícita; reconciliar com fatura não faz parte do escopo. Solução mais simples (tempo da call) não atende precisão mínima.

## Revisão de navegação — 2026-10-15 — APROVADA
Pedido substitui a apresentação em dialog. Reutilizar link nativo e rota autenticada existentes, sem biblioteca/estado global/migration/ADR adicional. Remover código e estilos mortos do modal. Escopo exclusivamente frontend; regras financeiras e autorização no servidor preservadas. Complexidade e risco baixos.
