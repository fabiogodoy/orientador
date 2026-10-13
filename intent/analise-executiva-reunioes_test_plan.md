# Test Plan — Análise executiva de reuniões encerradas

**Data:** 2026-10-13  
**Intent:** `intent/analise-executiva-reunioes.md`  
**PRD:** `intent/analise-executiva-reunioes_prd.md`  
**Impact:** `intent/analise-executiva-reunioes_impact.md`

## Matriz de cobertura

| Requisito | Feliz | Alternativo | Erro | Evidência |
| --- | --- | --- | --- | --- |
| RF001 | CT001, CT009 | CT010 | CT011 | JUnit, RTL e screenshot E2E |
| RF002 | CT002, CT009 | CT003 | CT004 | JUnit/integração e RTL |
| RF003 | CT005 | — | CT006 | Mock da integração e integração DB |
| RF004 | CT007 | CT008 | — | Unitário e RTL |
| RF005 | CT007 | — | CT011 | Unitário e RTL |
| RF006 | CT004 | CT003 | CT012 | Integração e RTL/E2E |
| RF007 | CT013 | CT014 | CT015 | Integração com Testcontainers |

## Testes unitários

* **CT001 — Contrato de análise válida:** resposta da IA com todos os blocos obrigatórios, nomes únicos e temperatura permitida é normalizada e aceita.
* **CT002 — Transições de estado:** ausente → gerando → concluída é válida; concluída não pode iniciar nova geração; uma falha permite retry.
* **CT003 — Idempotência em geração:** solicitação para análise já gerando não chama o provedor novamente e retorna o estado atual.
* **CT004 — Falha segura:** timeout, exceção ou JSON inválido do provedor produz estado falho e não persiste conteúdo parcial nem vazado.
* **CT005 — Reuso de concluída:** solicitação posterior retorna a análise persistida sem chamada OpenAI.
* **CT006 — Rejeição de reunião ativa:** tentativa de gerar para sessão não `ENDED` é recusada como recurso indisponível/não encontrado conforme o contrato de consulta.
* **CT007 — Participantes e temperatura:** remove duplicatas, preserva apenas nomes retornados pelo contrato estruturado e aceita apenas positiva/neutra/tensa; `USER`/`CLIENT` não são convertidos em nomes.
* **CT008 — Sem participantes:** lista vazia é serializada e exibida como “Nenhum nome identificado na transcrição”.

## Testes de integração

Usar exclusivamente PostgreSQL efêmero por Testcontainers, nunca `desenv_orientador` ou banco persistente.

* **CT009 — Migration e detalhe:** Flyway cria a estrutura; GET autorizado de reunião encerrada retorna estado ausente/gerando/concluída e o resultado persistido sem alterar segmentos.
* **CT010 — Geração e persistência:** operação autenticada coleta apenas segmentos da sessão, persiste uma análise completa com `tenant_id` e retorna o estado concluído.
* **CT011 — Saída inválida/erro:** simular cliente OpenAI inválido ou indisponível; estado falho é persistido sem conteúdo, GET segue funcional e retry conclui depois.
* **CT012 — Concorrência:** duas solicitações paralelas para mesma sessão originam uma única geração lógica e uma única análise no banco.
* **CT013 — Isolamento:** usuário/gestor de outro tenant não lê, inicia nem repete análise; a resposta não revela o estado.
* **CT014 — Papéis autorizados:** owner, gestor do mesmo tenant e admin global seguem as regras vigentes; membro/individual não acessa reunião de outro usuário, ainda que seja do mesmo tenant.
* **CT015 — Sessão inexistente/ativa:** não gera nem expõe análise.
* **CT016 — Logs seguros:** testes de logging verificam identificadores técnicos e ausência de texto de transcrição, resumo, participantes e justificativa.

## Testes de frontend

* **CT017 — Análise pronta:** a tela mostra a seção “Gerado por IA”, todos os blocos de resumo, participantes e rótulo/justificativa de temperatura.
* **CT018 — Geração em andamento:** transcrição continua legível e o estado “Gerando análise…” é anunciado/renderizado.
* **CT019 — Ausência de nomes:** a mensagem definida aparece sem `USER`/`CLIENT` como pessoas.
* **CT020 — Falha e retry:** erro mostra mensagem e botão; retry atualiza a análise ao sucesso.
* **CT021 — Sem nova geração:** análise concluída não dispara a operação de escrita ao montar a página.
* **CT022 — Acessibilidade/responsividade:** rótulos são textuais, estados possuem descrição acessível e layout mantém leitura em desktop/mobile.

## Testes E2E

Após `./mvnw verify` com Java 21 e `npm run build`/`npm test`, iniciar o ambiente efêmero previsto e executar Playwright:

* **CT023:** pessoa autorizada abre sessão encerrada sem análise, vê geração sem perder a transcrição e recebe resultado persistido.
* **CT024:** sessão com análise pronta abre sem reprocessar; sessão falha mostra retry recuperável.
* **CT025:** pessoa sem permissão não encontra a sessão/análise e não há dados expostos na interface.

## Regressão e desempenho

* **CT026:** suíte backend completa preserva login, sessão/CSRF, transcrição, encerramento de call e sugestões ativas.
* **CT027:** suíte frontend completa preserva autenticação, perfil, call e consulta de reuniões.
* **CT028:** transcrição extensa respeita o limite definido, não bloqueia o GET de detalhe e deixa duração/falha observável sem conteúdo nos logs.

## Evidências de execução esperadas

Saída de `./mvnw verify` sob Java 21, `npm run build`, `npm test`, `npm run test:e2e`, logs de Testcontainers e screenshots/vídeo Playwright quando disponível. O Validation Report apontará as evidências realmente executadas e registrará limitações verificáveis.

## Cobertura

* [x] Todos os RF cobertos.
* [x] Todas as RN cobertas.
* [x] Caminhos positivo, alternativo e de falha definidos.
* [x] Regressão, segurança, multi-tenancy e E2E definidos.
