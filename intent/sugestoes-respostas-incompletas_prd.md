# PRD — Continuidade das sugestões

Status: Aprovado. Origem: sugestoes-respostas-incompletas.md.

## Escopo
Correção de cliente OpenAI e feedback da call. Substitui apenas o teto de 400 tokens da RN007/RF006 do PRD transcricao-e-sugestoes-economicas por 1.200, conforme autorização. Fora: troca de modelo, novas políticas de transcrição, retry automático remoto, alteração de permissões/banco e deploy de produção.

## Requisitos e aceite
- RF001: enviar max_output_tokens=1200, mantendo modelo/contrato e uma chamada por tentativa. Orientar resumo compacto de até 1.200 caracteres (objetivo, fatos úteis, objeções e próximos passos), sem histórico cumulativo literal. Schema limita resumo, trecho, tipo e pontos; próxima fala segue até 500 caracteres.
- RF002: verificar status da resposta antes de interpretar JSON. incomplete, refusal, output ausente, JSON inválido e campos inválidos geram erro seguro com categoria técnica; nenhum contexto parcial é aceito. Token usage pode ser registrado sem conteúdo. Resposta válida posterior volta a funcionar.
- RF003: falha de transcrição aparece por fonte; sucesso posterior da mesma fonte limpa o alerta. Sucesso da outra fonte não oculta falha pendente. Respostas antigas de outra call não mudam erros da call atual.
- RF004: encerrar/abortar call limpa erro de sugestão, erros de transcrição e resumo efêmero; cancela geração agendada. Retry não aparece sem sessão ativa. Falha ao finalizar histórico continua visível.
- RF005: sequência de pelo menos 130 blocos (mais de 32 minutos simulados) continua gerando sugestões, preserva contexto anterior durante erro e retoma após sucesso. Sem requisito de teste de 32min reais nem chamada de IA com dados reais.

## Regras de negócio
RN001: novo teto 1.200 tokens; não cobrar chamadas extras automáticas de recuperação.
RN002: apenas resposta concluída/validada atualiza resumo e marcador; falha preserva anterior.
RN003: dados/segredos não aparecem nos logs; autorização tenant/user/call continua no servidor.
RN004: contexto é efêmero; novo teto não altera o resumo executivo persistido.

## Não funcionais e fluxos
Manter timeout atual de 15s, estado ocupado e histórico de sugestões. Mensagens da API seguras, diagnósticos com categorias fixas. Chromium desktop; um ciclo de integração basta, sem tickets. Fluxo: fala → sugestão → validar resposta concluída → atualizar; erro → preservar → tentativa posterior. Encerramento invalida retornos antigos.

## Migração, rollback e validação
Sem migration/dependência. Reverter commit de código restaura comportamento anterior. Build frontend/backend, unitários de request/response e UI, integração Testcontainers, E2E de sequência longa com API/mídia simuladas. Nunca usar banco persistente para testes de escrita. Reiniciar API local após validação para disponibilizar correção autorizada.

Data: 2026-10-14. Autor: Codex. Slug: sugestoes-respostas-incompletas.
