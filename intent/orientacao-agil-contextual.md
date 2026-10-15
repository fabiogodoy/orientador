# Intent — Orientação ágil e contextual

## Metadados
Slug: orientacao-agil-contextual. Data: 2026-10-15. Autor: usuário e Codex. Status: Aprovada.
Entendimento confirmado pelo usuário: adaptação automática ao papel/momento, equilibrando custo e tempo.

## Resumo Executivo / Problema
A transcrição e a orientação chegam tarde e atrapalham a resposta durante conversas ao vivo. Sugestões comerciais e perguntas inadequadas prejudicam especialmente quem participa de entrevista como candidato. Relato direto do usuário; diagnóstico encontrou espera fixa de 15 s, atraso adicional de 1,8 s e instrução fixa de vendedor.

## Contexto de Negócio / Processo Atual
Usuários individuais e de organizações acompanham uma reunião, aguardam transcrição e consultam orientações. A sugestão pode chegar depois da resposta do usuário. Manter isso compromete utilidade e confiança. Inserir contexto manual não elimina o viés comercial fixo.

## Objetivo / Resultado Esperado
Receber apoio breve enquanto ainda é útil; distinguir responder, comentar, perguntar e ouvir conforme a conversa e o papel informado ou evidenciado. Reduzir a espera controlável sem mudança de fornecedor/modelo e sem multiplicação desnecessária de gerações.

## Benefícios / Perfis / Módulos
Benefício direto para individuais e membros/gestores em calls. Suporte/admin ganham diagnóstico; histórico e permissões permanecem. Frontend e backend afetados; landing e schema não.

## Restrições / Regras Conhecidas
RN001: manter áudio apenas em memória, transcrição persistida e sugestões efêmeras. RN002: isolamento tenant/usuário e credenciais existentes preservados. RN003: equilibrar custo e tempo, sem inventar experiência ou fatos do usuário.

## Hipóteses / Riscos
Pausas ajudam a segmentar, mas não provam fim de turno. Blocos menores podem reduzir contexto e elevar cobrança mínima; classificação contextual é probabilística. Latência dos provedores não foi medida e não é garantia de SLA.

## Indicadores / Critérios de Sucesso
CS001: reduzir janela máxima de captura de 15 s e espera artificial de 1,8 s, comprovado por relógio controlado. CS002: orientação não presume vendedor; aceita resposta, comentário, pergunta contextual e ouvir. CS003: não exibir resposta tardia após fala do usuário; não sobrepor gerações. CS004: testes de erro, ordem e regressão executados.
Indicadores comerciais não definidos; melhoria esperada de utilidade, sem alegar retenção medida.

## Alternativas / Não Implementar
Voltar a streaming ou trocar modelos aumenta escopo e custo; adiado. Não implementar caso exija perda de isolamento, persistência de áudio ou gastos sem limite de chamadas.

## Perguntas em Aberto / Aprovação
Nenhuma decisão de produto pendente. Problema, valor, objetivo e direção confirmados. Próximo passo: PRD.
