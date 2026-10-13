# Architecture Review — Análise executiva de reuniões encerradas

## Parecer

**APROVADA COM RESSALVAS.**

## Aderência arquitetural

A mudança está nos módulos corretos: React apresenta dados e estados; Spring Boot reconstrói a identidade, aplica autorização, obtém segmentos, chama a IA, valida a saída e persiste; PostgreSQL mantém o estado com migration Flyway. A landing e a captura em tempo real não participam. A análise de uma sessão encerrada não deve ser adicionada ao fluxo de sugestões de call ativa, pois seus requisitos de ciclo de vida e contrato são distintos.

## Reutilização e simplicidade

Devem ser reutilizados o mecanismo atual de sessão/autorização por papel, o escopo de `CallService`, a infraestrutura do cliente textual OpenAI e as convenções de persistência/migration. Não deve ser reutilizado o contrato de sugestões: ele representa orientação transitória e só aceita reunião ativa. Não há necessidade de nova biblioteca, fila, serviço externo ou extensão do navegador.

A operação de escrita explícita após a leitura do detalhe é mais simples e correta que dar efeito colateral ao GET. A tabela única por sessão/tenant, com estado explícito e unicidade, é proporcional ao requisito de persistência e concorrência.

## Dados, segurança e desempenho

A migration Flyway é obrigatória, incluindo referência de `tenant_id`, chave de sessão, unicidade, estados e estratégia de rollback documentada. Consultas devem partir da sessão autorizada no serviço e jamais receber `tenant_id` ou proprietário do frontend. A resposta da IA precisa ter contrato estruturado validado antes de persistência; logs não incluem conteúdo de reunião/análise.

O primeiro processamento pode ser mais lento, mas não pode bloquear a transcrição. Reutilizar resultado concluído reduz custo e latência. Limites explícitos para transcrições extensas e métricas de duração/falha são condições para implementação.

## Ressalvas obrigatórias

1. Modelar transições atômicas de estado e unicidade no banco para impedir duas gerações da mesma reunião.
2. Manter a autorização por papel e o `tenant_id` em todos os caminhos: detalhe, iniciar e retry.
3. Testar saída inválida, indisponibilidade do provedor, transcrição extensa e concorrência.
4. Não inventar atribuição de fala/nome a partir de `USER` e `CLIENT`.

## ADR e débito técnico

ADR-0006 é adequada e obrigatória: explica uma estrutura persistente multi-tenant e a semântica de geração imutável, decisão não evidente nem trivial de reverter. O futuro versionamento/reprocessamento de IA é débito conscientemente fora do escopo, registrado na ADR; não deve ser antecipado.
