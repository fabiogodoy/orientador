# Test Plan — tela-custos
2026-10-15. Intent/PRD/Impact de mesmo slug.

| RF/RN | Feliz | Alternativo/erro | Evidência |
|---|---|---|---|
| RF001/RN005 | menu abre /app/custos sem modal | reload/back/mobile/login | Playwright |
| RF002/RN002 | Hoje/7/30/Tudo e limites de fuso | período inválido, resposta fora de ordem | Java + componentes |
| RF003/RN001 | soma decimal/audio mínimo/tokens cache | usage ausente/zero inválido | unitários + integração |
| RF004 | séries/dias/valores | vazio e somente desconhecido | componentes + E2E |
| RF005/RN003 | lista/duração/paginação | antigas, ativas e desconhecidas | integração + E2E |
| RF006 | operação registrada antes, uso persistido | incompleta/sem uso/erro e fornecedor negado | clientes HTTP mock + integração |
| RF007/RN004 | PTAX fechamento e conversão | cache antigo, indisponível, resposta inválida | Java + componentes |
| RF008 | usuário/gestor/admin | outro usuário/tenant, não autenticado | Testcontainers |

Regressão: testes existentes de call/histórico/sugestões/barra; remoção do botão de custos no topo. Builds frontend/backend antes do E2E. Banco exclusivamente PostgreSQL efêmero Testcontainers; validar URL. E2E com API simulada para layout/erros e API real coberta pela integração. Evidências em .scratch/tela-custos, target/surefire-reports e frontend/test-results. Auditoria de governança obrigatória. Aprovação depende da execução real.

Revisão pontual: build e suíte de componentes frontend; Playwright costs + meeting-toolbar com APIs simuladas, sem escrita no banco local. Backend não alterado, não exige nova execução de testes Java.
