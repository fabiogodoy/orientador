# PRD — Orientação ágil e contextual

## Metadados / Origem
2026-10-15; Codex; status Aprovado; Intent: orientacao-agil-contextual.md.

## Problema / Objetivos / Escopo
Reduzir atrasos controláveis e adequar a próxima intervenção ao papel do usuário. Inclui captura, agendamento, contrato de ouvir, prompt e rótulos. Fora: deploy, troca de modelos/fornecedores, streaming novo, migrações, gestão comercial e credenciais. Uma integração atômica frontend/backend basta; não requer tickets.

## Perfis / Módulos
Individuais e organização durante calls; frontend React e backend Spring. Landing, schema, autenticação e regras de histórico não mudam.

## Requisitos Funcionais / Aceite
- RF001: blocos de até 8 s; após pelo menos 5 s, finalizar em pausa de 750 ms (amostra de 250 ms). Sem detector, fallback 8 s; silêncio detectado não enviado; parada libera timer/recursos e envia trecho final com voz.
- RF002: esperar 300 ms após transcrição elegível; no máximo uma geração pendente, intervalo automático mínimo de 5 s entre inícios, coalescendo para o último segmento. Clique manual ignora intervalo, nunca sobrepõe chamada.
- RF003: sugestões aceitam Resposta, Comentário, Pergunta e Ouvir. Inferir papel a partir da preparação e falas, com postura neutra se incerto. Candidato responde ao entrevistador sem perguntas automáticas; perguntas somente com abertura/necessidade. Ouvir mostra estado discreto, sem fala para copiar. Contrato antigo continua legível.
- RF004: fala local invalida orientação pendente; nova fala remota invalida orientação antiga; resposta de requisição obsoleta não altera orientação ou resumo. Transcrições exibidas por sequência, e resumo não avança sobre upload ainda pendente. Descartar orientação após 12 s desde fechamento do bloco que a originou. Manual pode solicitar novamente.
- RF005: botão manual disponível após qualquer fala remota transcrita, inclusive comentário. Automático cobre perguntas/objeções, convites a responder e declarações substantivas; ignora saudações/confirmações curtas.
- RF006: preservar modelos, teto 1.200 tokens, resumo máximo compatível 1.200 caracteres; pedir normalmente resumo até 600 caracteres, fala de 1–2 frases até 240 caracteres e 1–2 pontos. Medir tempos locais de captura/transcrição/sugestão em buffer efêmero limitado, sem conteúdo; manter durationMs server-side.

## Regras de Negócio
RN001: áudio não persistido e silêncio não encaminhado quando detector disponível. RN002: CLIENT é código técnico legado, não papel comercial; usuário é quem usa o produto. RN003: referências não autorizam inventar qualificações, valores ou compromissos. RN004: ouvir é resultado válido; não forçar pergunta. RN005: sem retry automático de inferência; reduzir duplicação; orçamento controlado por blocos mínimos e throttle.

## Não Funcionais
RNF001: metas são esperas locais, não SLA de terceiros. Blocos 5–8 s implicam até 12 envios/min/fonte contínua, com cobrança mínima Groq de 10 s/envio (até 2x duração capturada, exceto trecho final); silêncio reduz envios. RNF002/003: sessão/CSRF/tenant e autorização no servidor preservados; nunca logar texto, áudio ou segredos. RNF004: Chromium/MediaRecorder/Web Audio; contrato aditivo para ouvir, fallback por tipo para versões antigas. RNF005: erros recuperáveis visíveis, medidas limitadas apenas na memória do navegador.

## Fluxo / Alternativos / Erros / UX
Capturar → fechar bloco em pausa ou teto → transcrever → avaliar se há conteúdo útil → gerar uma orientação contextual → exibir se ainda atual. Enquanto usuário fala, não disparar automático. Ouvir mostra “Continue ouvindo” sem cartão de fala. Falha mantém transcrição/call e permite tentar novamente manualmente; encerramento invalida respostas tardias. Rótulos visíveis usam Interlocutor.

## Integrações / Dados / Segurança
Mesmas APIs autenticadas; resposta de sugestão recebe campo opcional acao (FALAR/OUVIR). Sem migration/dependência. Clientes antigos recebem texto compatível no caso Ouvir; cliente novo reconhece acao ou tipo. Queries permanecem tenant-scoped. Rollback: reverter commit completo frontend/backend; nenhum dado a migrar.

## Testes / Evidências / Aceite Final
Testes com relógio controlado para RF001/002/004/005/006, contrato/prompt backend RF003/006, E2E de entrevista/estado ouvir, regressão recuperação e chamadas longas; Maven verify (PostgreSQL Testcontainers), npm test/build e Playwright. Logs em .scratch/orientacao-agil-contextual. Sem alegar qualidade semântica ou latência real de provedor com mocks. Todos RF/RN, builds, testes e reviews devem passar; registrar validação final e push.

## Riscos / Dependências / Aprovação
Risco de cortar frase, ruído de microfone e variação do modelo. Mitigação por mínimo de bloco, pausa, prompt condicional, expiração e regressões. Sem decisões pendentes. PRD aprovado conforme direção confirmada; detalhes técnicos definidos pelo agente.

## Refinamentos de robustez
Instante da última voz detectada é distinto do fechamento do bloco; a fala local já ocorrida impede orientação automática daquele trecho remoto. Falha ao retomar Web Audio volta à captura por teto, sem descartar todos os blocos como silêncio. Pedidos HTTP no navegador têm limite de 20 s para sugestão e 25 s para áudio. User Timing expõe as medidas limitadas para diagnóstico local, sem conteúdo.
