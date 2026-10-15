# ADR-0011 — Custos por operação e conversão PTAX

Data: 2026-10-15. Status: Aprovada. Relacionado: intent/tela-custos.md, tela-custos_prd.md e tela-custos_impact.md.

## Contexto e decisão
Não há uso persistido e duração da call não representa cobrança. Persistir ledger por tentativa autenticada no backend, antes da requisição externa, complementado por metadados retornados e tarifa decimal preservada. Não armazenar conteúdo de sugestões/áudio. Custo desconhecido é NULL. Marcar calls criadas após ativação para separar zero conhecido de histórico não medido.

## Alternativas
LocalStorage foi rejeitado porque perde histórico e não permite agregação por gestor. Estimar retrospectivamente por duração/texto foi rejeitado por falsa precisão. Integração com fatura global não atribui custos por call. Ledger mínimo no PostgreSQL reutiliza persistência e autorização existentes.

## Câmbio
PTAX venda do último fechamento publicado pelo BCB, buscada pelo backend com cache persistido e timeout. Toda tela converte pelo mesmo câmbio atual e informa data/fonte; não reconstruímos câmbio histórico. Sem taxa disponível, apenas US$; fallback antigo explicitamente sinalizado. Não acrescentar SDK.

## Segurança e consequências
FK composta call/tenant/user; acesso como histórico, admin global auditado. Custo do ledger é duas escritas por tentativa; falhar inserção antes do provedor impede consumo não registrado. Atualização posterior falha deixa tentativa desconhecida. Respostas inválidas com uso informado ainda têm custo. Valores são estimativas, não cobrança, sem impostos/descontos/créditos. Análise executiva fora dessas duas categorias.

## Fontes de tarifas e manutenção
Verificadas em 2026-10-15: Groq whisper-large-v3-turbo US$0,04/h, mínimo 10s por request — https://console.groq.com/docs/speech-to-text. OpenAI gpt-6-luna US$0,10 entrada, 0,01 cache, 0,50 saída por milhão; contexto >272k usa 2x entrada/cache e 1,5x saída — https://developers.openai.com/api/docs/models/gpt-6-luna. Catálogo versionado no código; revisão necessária ao trocar modelo/tarifa. PTAX: https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/documentacao.

## Reversão e revisão
Rollback de aplicação preserva tabelas e auditoria. Reavaliar ao adicionar faturamento, outro provedor, descontos ou alto volume. Não incluir a alteração local de fallback de transcrição nesta entrega.
