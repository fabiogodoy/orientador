# Test Plan — Transcrição e sugestões econômicas

## Metadados

| Campo | Valor |
|---|---|
| Slug | `transcricao-e-sugestoes-economicas` |
| Data | 2026-10-13 |
| Autor | Codex |
| Intent | `intent/transcricao-e-sugestoes-economicas.md` |
| PRD | `intent/transcricao-e-sugestoes-economicas_prd.md` |
| Impact Analysis | `intent/transcricao-e-sugestoes-economicas_impact.md` |

## Resumo

Validar que blocos temporários de áudio são criados e enviados por fonte sem WebRTC, que o backend só encaminha blocos autorizados à Groq e só persiste texto, e que sugestões usam gatilho local mais resumo interno efêmero. Banco de integração é exclusivamente PostgreSQL efêmero via Testcontainers; fornecedor externo é simulado, nunca chamado com credencial real durante testes.

## Matriz de cobertura

| RF | Cenário feliz | Alternativo | Erro | Evidência |
|---|---|---|---|---|
| RF001 | CT001 | CT002 | CT003 | Vitest e inspeção de blobs/requisições |
| RF002 | CT004 | CT005 | CT006 | JUnit/MockWebServer e integração HTTP |
| RF003 | CT007 | CT008 | CT009 | Vitest e E2E |
| RF004 | CT010 | CT011 | CT012 | Vitest e E2E |
| RF005 | CT013 | CT014 | CT015 | Vitest/JUnit e inspeção de contrato |
| RF006 | CT016 | CT017 | CT018 | JUnit e Vitest |

## Testes unitários

### CT001 — Gravador por fonte em blocos de 15 segundos

Simular `MediaRecorder` para microfone e aba. Confirmar criação de blob/solicitação independente em intervalo configurado de 15 segundos e associação correta de fonte/locutor.

### CT002 — Parada limpa da fonte

Parar microfone ou aba antes do próximo intervalo. Confirmar parada do gravador/tracks, ausência de timer residual e que a outra fonte continua ativa.

### CT003 — Captura/arquivo incompatível

Simular ausência de `MediaRecorder`, blob vazio ou erro de gravador. Confirmar mensagem segura, nenhum upload e call recuperável.

### CT004 — Cliente Groq multipart

Com servidor HTTP simulado, validar `POST /openai/v1/audio/transcriptions`, cabeçalho de autorização somente server-side, `model=whisper-large-v3-turbo`, `language` suportado, arquivo WebM e timeout.

### CT005 — Texto final persiste com fonte autorizada

Mockar cliente Groq com texto e validar que o serviço cria um único segmento, na call ativa do tenant, com fonte convertida corretamente; nenhum byte de áudio é enviado a JDBC/log.

### CT006 — Rejeição/timeout Groq

Simular status não-2xx, resposta malformada e timeout. Esperar exceção sanitizada, ausência de segmento e preservação da call.

### CT007 — Exibição de texto por fonte

Simular retorno de transcrição de microfone e aba. Esperar mensagens finais “Você” e “Cliente” sem dependência de eventos WebRTC.

### CT008 — Respostas de blocos fora de ordem

Finalizar dois uploads em ordem inversa. Confirmar sequência/ordem definida pelo contrato e ausência de duplicação de segmento.

### CT009 — Texto vazio

Fornecedor retorna texto em branco. Confirmar que não há mensagem visual nem persistência.

### CT010 — Pergunta/objeção reconhecida localmente

Testar interrogação e vocabulário PT/EN de pergunta/objeção em segmento do cliente. Confirmar uma única chamada automática, após persistência, sem chamada de classificação remota.

### CT011 — Geração manual

Com call ativa e contexto disponível, acionar “Sugerir agora” sem regra automática. Confirmar requisição e estado de carregamento acessível.

### CT012 — Fala comum

Enviar fala de cliente sem regra. Confirmar que a sugestão automática não é chamada e o botão manual permanece disponível.

### CT013 — Primeiro resumo de contexto

Na primeira sugestão, validar que os segmentos disponíveis participam do contexto e a resposta estruturada contém sugestão mais resumo interno válido, que fica somente no estado de memória.

### CT014 — Resumo atualizado evita reenvio

Após segunda sugestão, capturar payload e confirmar uso de resumo anterior mais segmentos ainda não consolidados, sem repetir os já representados no resumo.

### CT015 — Limpeza do resumo

Encerrar/recarregar call e confirmar limpeza do resumo, inexistência em DTO de histórico, DOM, local/session storage, request de análise executiva e banco.

### CT016 — Contrato e limite de saída de sugestão

Validar schema estruturado que contém a orientação e resumo atualizado; inspecionar `max_output_tokens=400` e validações de campos.

### CT017 — Resposta estruturada inválida

Resumo ausente/excessivo ou sugestão inválida deve resultar em falha segura sem sobrescrever sugestão/resumo válido anterior.

### CT018 — Falha de sugestão

Simular indisponibilidade da OpenAI. Confirmar que transcrição/captura seguem ativas e que erro não expõe payload, segredo ou detalhes do fornecedor.

## Testes de integração

### CT019 — Endpoint multipart autenticado e CSRF

Com Spring Boot e banco PostgreSQL efêmero, enviar bloco válido com sessão/CSRF. Confirmar texto persistido e resposta contratada. Repetir sem sessão e sem CSRF: esperar negação antes de cliente Groq ser chamado.

### CT020 — Isolamento de tenant/call

Usuário de outro tenant e usuário sem posse da call tentam enviar bloco e gerar sugestão. Esperar 404, nenhum segmento e zero chamadas ao fornecedor.

### CT021 — Call encerrada e fonte inválida

Enviar bloco para call encerrada ou fonte não reconhecida. Esperar rejeição segura, sem forwarding/persistência.

### CT022 — Limite de upload e tipo inválido

Enviar multipart acima do limite e arquivo não-WebM. Esperar 400/413 seguro e nenhuma chamada externa.

### CT023 — Idempotência e ordem

Reenviar identificador de bloco autorizado e enviar blocos concorrentes. Esperar um segmento por bloco e ordem determinística, sem cruzar tenant.

## E2E e validação manual

### CT024 — Microfone em Chromium

Após `npm run build`, executar E2E com `MediaRecorder` simulado ou ambiente Chromium que permita áudio. Confirmar texto por bloco, encerramento de fonte e nenhuma tentativa de WebRTC/OpenAI Realtime.

### CT025 — Áudio de aba e coexistência de fontes

Validar compartilhamento de aba com áudio em Chromium, texto como cliente, continuidade do microfone e interrupção isolada de uma fonte.

### CT026 — Gatilhos e UX invisível

Simular pergunta, objeção e fala comum; validar sugestão automática apenas nos dois primeiros, botão manual e ausência completa do resumo interno na interface e árvore de acessibilidade.

### CT027 — Histórico e análise executiva

Encerrar call e verificar que apenas segmentos textuais permanecem no detalhe; análise executiva continua usando a transcrição e não recebe resumo interno/áudio.

## Regressão, segurança e desempenho

* **CT028:** título automático/manual, encerramento de call e histórico permanecem funcionais após remoção da resposta de segredo Realtime.
* **CT029:** PT/EN continua aceito para transcrição e orientação segue idioma da última fala do cliente.
* **CT030:** logs capturados em falha/sucesso não contêm texto, bytes, resumo, token OpenAI ou token Groq.
* **CT031:** teste de carga controlado com duas fontes e oito uploads/minuto confirma limite de concorrência e timeout, sem arquivos temporários.

## Comandos e evidências esperadas

1. `frontend/npm run build` e `frontend/npm test` — saída de build e Vitest sem falhas.
2. `backend/./mvnw verify` com Java 21 — JUnit e Testcontainers aprovados.
3. `frontend/npm run test:e2e` após builds, frontend/API e PostgreSQL efêmero ativos — relatório Playwright/screenshot quando aplicável.
4. Validação manual Chromium de microfone/aba, documentando resultado e limitações de permissão de hardware.

## Checklist

* [x] Todos os RF e RN possuem cenário feliz, alternativo e de erro.
* [x] Multi-tenancy, CSRF e autorização são cobertos.
* [x] Não persistência de áudio/resumo e sanitização de logs são cobertas.
* [x] Regressões de captura, histórico, idioma e análise executiva são cobertas.
* [x] E2E e validação manual estão definidos.
