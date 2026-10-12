# Validation Report — Sugestões de fala comerciais em tempo real

## Metadados

* **Funcionalidade:** sugestões de fala comerciais em tempo real e finalização de turnos de transcrição
* **Slug:** `sugestoes-fala-tempo-real`
* **Data:** 2026-10-12
* **Intent:** `intent/sugestoes-fala-tempo-real.md`
* **PRD:** `intent/sugestoes-fala-tempo-real_prd.md`

## Status geral

**APROVADO COM RESSALVAS.** A implementação, contratos, isolamento, testes automatizados e E2E visual estão aprovados. A meta de p95 e uma call com a OpenAI real ainda não foram medidas; portanto não são declaradas validadas.

## Cobertura da Intent

O problema original foi tratado: a interface deixa de apresentar orientação fixa, gera orientação a partir de segmentos finais do cliente e passa a enviar o commit obrigatório depois do silêncio local, corrigindo a ausência de segmentos finais que impedia tanto transcrição persistida quanto sugestões.

## Validação dos requisitos funcionais

| Requisito | Status | Evidência |
| --- | --- | --- |
| RF001 — geração após fala de cliente | OK | `App.tsx` aguarda persistência do segmento `CLIENT`; `CallServiceSuggestionTest` valida o contexto autorizado. |
| RF002 — contexto da própria call | OK | consulta por sessão/tenant, ordenada; teste de serviço com segmentos intercalados. |
| RF003 — resposta estruturada e segura | OK com ressalva | JSON Schema estrito, validação de campos/tamanho e prompt comercial; sem resposta real do provedor. |
| RF004 — card dinâmico | OK | Vitest e Playwright Chromium verificam estado vazio, ausência de exemplos fixos e responsividade. |
| RF005 — regeneração e obsolescência | OK | controle de requisição/contexto no frontend; testes de componente existentes para estados assíncronos. |
| RF006 — proteção de acesso | OK | sessão/CSRF existentes e filtros `id`/`tenant_id`/`user_id`; revisão de segurança aprovada. |
| RF007 — finalização do turno | OK | teste Vitest simula fala, silêncio, `input_audio_buffer.commit` e limpeza do `AudioContext`. |

## Regras de negócio e requisitos não funcionais

* RN001–RN006: OK por contrato do prompt, schema, contexto tenant-scoped e estado transitório.
* Segurança e multi-tenancy: OK; nenhum dado de outro tenant compõe o contexto e a chave OpenAI não chega ao navegador.
* Compatibilidade: OK para o caminho Chromium testado; o produto continua limitado a navegadores Chromium desktop como definido pela arquitetura.
* Observabilidade: OK com ressalva; logs sanitizados de geração e mensagens de falha estão presentes, mas não há painel/alerta agregado.
* Performance p95 <= 3 s: **NOK como evidência operacional**. O timeout de 2,5 s foi implementado, mas não houve 20 gerações reais para calcular p95.

## Testes e builds executados

* `frontend/ npm test -- --run`: **13 aprovados**.
* `frontend/ npm run build`: **sucesso**.
* `backend/ JAVA_HOME=<JDK 21> ./mvnw test`: **13 aprovados**, incluindo PostgreSQL efêmero via Testcontainers.
* `frontend/ npm run test:e2e -- --grep 'tela da call alterna controles'`: **1 aprovado** no Chromium, com screenshots de desktop e mobile.
* `scripts/governance-audit.sh`: **sucesso**.

## Revisões

* Implementação: aprovado com ressalvas — `intent/sugestoes-fala-tempo-real_implementation-review.md`.
* Segurança: aprovado — `intent/sugestoes-fala-tempo-real_security-review.md`.
* Observabilidade: aprovado com ressalvas — `intent/sugestoes-fala-tempo-real_observability-review.md`.

## Reintegração na main

* **Branch de entrega:** `codex/sugestoes-fala-tempo-real`.
* **Main de origem:** `d68b49834f76aa63717510a52beae2a568396e5b`.
* **Tipo:** fast-forward.
* **Código integrado:** `9a57cee961662c00b64ef1f1834a64612219ed97`.
* **Publicação:** branch de entrega e `origin/main` enviados com sucesso.

## Pendências e próximo passo operacional

Validar uma reunião real em Chrome/Edge com a chave OpenAI e o backend efetivamente publicados; registrar pelo menos 20 gerações bem-sucedidas para calcular p95. A publicação de Git não atualiza automaticamente o serviço remoto, e a verificação HTTPS atual de `api-orientador.connectas.com.br` ainda apresenta incompatibilidade de certificado.
