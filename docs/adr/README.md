# Índice de ADRs

Este arquivo é a fonte única de verdade sobre quais números de ADR já estão em uso.

Antes de criar uma nova ADR, o agente deve:

1. Conferir o **próximo número livre** abaixo.
2. Criar `docs/adr/ADR-XXXX-<slug>.md` usando `.ai/templates/adr_template.md` (decisões grandes) ou o formato leve de `.agents/skills/domain-modeling/ADR-FORMAT.md` (decisões pequenas e reversíveis).
3. Adicionar uma linha nova na tabela abaixo, na mesma entrega que cria a ADR.

Nunca reutilizar um número já listado, mesmo que o trabalho tenha sido feito em thread/contexto isolado de outra Intent em andamento. Em caso de dúvida sobre o número mais atual, checar `docs/adr/` diretamente além deste índice.

## Próximo número livre

`ADR-0012`

## ADRs registradas

| ADR | Título | Relacionado |
|---|---|---|
| ADR-0001 | Identidade, sessão e tenants | `intent/autenticacao-cadastro.md` |
| ADR-0002 | Transcrição Realtime OpenAI com segredo efêmero | `intent/transcricao-microfone-tempo-real.md` |
| ADR-0003 | Duas fontes Realtime independentes por call | `intent/audio-aba-cliente.md` |
| ADR-0004 | Geração de sugestões comerciais no backend com OpenAI | `intent/sugestoes-fala-tempo-real.md` |
| ADR-0005 | Avatar de perfil normalizado no PostgreSQL | `intent/perfil-do-usuario.md` |
| ADR-0006 | Análise executiva imutável por reunião | `intent/analise-executiva-reunioes.md` |
| ADR-0007 | Transcrição econômica por blocos e contexto efêmero | `intent/transcricao-e-sugestoes-economicas.md` |
| ADR-0008 | Preparação por call e bases de conhecimento por tenant | `intent/preparacao-e-bases-de-conhecimento.md` |
| ADR-0009 | Exclusão lógica auditável de bases de conhecimento | `intent/administracao-bases-de-conhecimento.md` |
| ADR-0010 | Exportação PDF no navegador | `intent/resumo-executivo-pdf.md` |

| ADR-0011 | Custos por operação e conversão PTAX | `intent/tela-custos.md` |
