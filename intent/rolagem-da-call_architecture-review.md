# Architecture Review — Rolagem acompanhada na call

Status: APROVADA.

A alteração pertence exclusivamente ao componente React que já detém o estado transitório da call. Reutiliza os contêineres `.transcript-scroll` e `.guidance-scroll` existentes e não adiciona biblioteca, endpoint ou persistência. Complexidade baixa; não exige ADR. O histórico em memória respeita a decisão de não persistir sugestões.
