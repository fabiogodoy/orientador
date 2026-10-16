# implementation review — sugestoes-descartadas-em-conversa
2026-10-16.

APROVADA. Revisão do diff e revisão factual independente pelo agente diagnose_suggestion_gating: sem bloqueadores. Removidas somente invalidações remotas; pedido mantém snapshot originSpeechAt, sessão/contador/TTL e watermark. Uma inferência e fila do último trecho preservadas. Estado de espera separado de ação OUVIR; diagnósticos categóricos. Complexidade média pelo estado temporal, sem dependência nova. Regressões mostram zero cartões antes e publicação contínua após; cobertura de encerramento/nova call, microfone com/sem VAD, expiração e upload pendente. Limitação: sem VAD, fala local só pode ser confirmada quando texto retorna; resposta remota pode aparecer antes disso. VAD mantém proteção imediata.
