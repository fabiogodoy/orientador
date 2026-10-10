# Security Review — Autenticação e cadastro

- Data: 2026-10-10
- Risco inerente: alto (identidade, sessões e multi-tenancy).
- Parecer: **APROVADO COM RESSALVAS** para o código desta entrega; publicação comercial ainda depende de infraestrutura e processos complementares.

## Controles verificados

- Cadastro aceita só os tipos individual/organização; cliente não escolhe `role`, `tenant_id`, prazo ou admin. Campos extras são rejeitados no contrato JSON. Tenant e usuário são criados em transação e a resposta autenticada deriva do usuário presente na sessão.
- Teste de dois tenants confirma IDs distintos; não existe endpoint de cliente que leia dados de outro tenant. O único recurso protegido atual é a identidade do próprio usuário. Novas entidades deverão repetir o filtro por tenant.
- Senha é hash adaptativo `{bcrypt}`, nunca retornada; sessão usa cookie HttpOnly/SameSite=Lax, com `Secure=true` por padrão e override local explícito. CSRF é exigido em escritas e CORS aceita somente origem exata configurada. ID de sessão é renovado no login e invalidado na saída.
- Fim da avaliação é validado no backend em cada rota autenticada; sessão antiga expirada é invalidada. Login inválido usa mensagem genérica e há limitação inicial de tentativas. Logs não incluem senhas, tokens, cookies ou e-mail completo. Não há segredo real versionado.
- Testes de integração cobrem duplicidade, aceite, papel administrativo indevido, CSRF, CORS, expiração e sessão; E2E cobre ambos os tipos de cadastro.

## Riscos residuais e condições de produção

- E-mail não é verificado por escolha de escopo: alguém pode reservar endereço ou nome de organização alheio. Não conceder benefícios, dados ou autoridade comercial com base apenas nesses campos antes de verificação futura. Classificação: média nesta fase sem compartilhamento de dados.
- O limitador de tentativas é por instância e não substitui defesa de borda/monitoramento contra abuso distribuído. Classificação: média.
- O certificado de `api-orientador.connectas.com.br` estava incompatível no bootstrap. Não publicar antes de corrigir TLS e configurar `FRONTEND_ORIGIN`, cookies seguros e fallback `/app/*`. Classificação: alta se ignorada; fora do código desta entrega.
- Sessões em memória precisam de estratégia compartilhada antes de múltiplas instâncias. E-mail sem recuperação automática demanda suporte.

Não foi encontrada via atual de IDOR, escalonamento de papel ou acesso entre tenants. A aprovação não cobre funcionalidades futuras de transcrição/admin.
