# PRD — Sugestões descartadas em conversa contínua
Origem: sugestoes-descartadas-em-conversa.md. 2026-10-16. Aprovado. Correção pontual pelo orchestrator, uma integração segura, sem tickets.

RF001: nova amostra de voz remota ou novo bloco remoto não invalida por si só uma inferência da mesma call ainda dentro dos 12s desde fechamento de origem. Resposta concluída pode atualizar resumo e ser exibida apesar de haver segmento remoto mais recente. Substitui apenas a invalidação remota estrita de RF004 de orientacao-agil-contextual. A UI diz “Baseada em fala recente”, sem prometer último segmento.
RF002: encerramento/troca de call, voz local posterior à fala de origem e expiração continuam impedindo publicação; upload pendente continua limitando marcador de resumo. Nenhuma requisição sobreposta, throttle automático de 5s preservado, fila contém só o último segmento.
RF003: no fallback sem detector de áudio, bloco de microfone vazio/falho não é evidência de fala. Usar texto não vazio confirmado; com detector, voz local continua invalidando imediatamente.
RF004: somente ação OUVIR do modelo mostra “Continue ouvindo. Não é necessário intervir agora.” Invalidação local mostra espera pela próxima fala, sem atribuir decisão ao modelo. Diagnósticos efêmeros registram resultado de exibição FALAR/OUVIR e motivo fixo de descarte, sem texto/IDs.
RF005: regressão com áudio remoto contínuo e resposta de 9s durante 120s apresenta sucessivas orientações; novas calls e expiração não recebem retorno antigo. Reproduzir falha antes da correção e executar componentes, build e E2E com mídia/API sintéticas.

RN001: custos/modelo/prompt/contrato/limites atuais mantidos; sem novas chamadas de retry. RN002: sem persistência de áudio/sugestões e sem conteúdo/segredos nos diagnósticos. RN003: não prometer SLA real ou que todas as 264 respostas eram FALAR: logs históricos não contêm esse dado.

Fluxo: transcrever → agendar → receber → validar sessão/fala local/idade → publicar ou registrar descarte. Erro mantém retry manual existente. Riscos: orientação sobre trecho anterior (janela limitada e rótulo honesto); ruído confundido com voz pelo detector continua sendo limite a investigar. Fora: recalibrar detecção sem evidência, trocar IA, mudar limite de idade, forçar intervenções. Autorização e multi-tenancy permanecem no servidor. Rollback: revert do commit.
