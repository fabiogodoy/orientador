# PRD — Análise executiva de reuniões encerradas

**Status:** Aprovado  
**Origem:** `intent/analise-executiva-reunioes.md`  
**Data:** 2026-10-13

## Resumo e objetivo

O histórico de uma reunião encerrada exibirá uma análise executiva persistida, para reduzir a necessidade de leitura integral da transcrição. A análise é produzida exclusivamente pelo backend com IA, contém resumo executivo, participantes identificados e temperatura da reunião e nunca é editável nesta versão.

## Escopo

**Dentro:** geração sob demanda na primeira abertura autorizada, persistência por reunião e tenant, apresentação do estado e resultado no detalhe da reunião, nova tentativa explícita após falha, testes e observabilidade.

**Fora:** edição manual, reprocessamento de análise concluída, identificação de locutores individuais, classificação de sucesso comercial, análise de reuniões ativas, gravação de áudio/vídeo, processamento em lote ou exclusivo das reuniões de um usuário.

## Perfis e módulos impactados

Os perfis de consulta existentes são mantidos: individual e membro consultam as próprias reuniões; gestor consulta reuniões do próprio tenant; admin da plataforma mantém o acesso global autorizado e auditável. São impactados `frontend/`, `backend/`, PostgreSQL e a integração textual OpenAI do backend.

## Requisitos funcionais

### RF001 — Exibição da análise executiva

O detalhe de uma reunião encerrada retorna e exibe o estado da análise e, quando concluída, seus três campos: resumo executivo, participantes identificados e temperatura da reunião.

**Aceite:** uma análise concluída mostra todos os blocos de resumo (visão geral, decisões/acordos, pendências/próximos passos, riscos/objeções e pontos-chave), a indicação “Gerado por IA”, os nomes identificados ou a mensagem de ausência, e o rótulo de temperatura com justificativa breve.

### RF002 — Geração sob demanda

Ao abrir uma reunião encerrada autorizada sem análise, o frontend inicia uma solicitação explícita de geração e mantém a transcrição disponível enquanto o estado “Gerando análise…” é mostrado.

**Aceite:** abrir o detalhe não bloqueia a visualização da transcrição; apenas uma solicitação de geração é aceita para uma análise pendente/em execução; após êxito, o resultado passa a ser exibido sem recarregamento manual da página.

### RF003 — Reutilização do resultado

Uma análise concluída é consultada e exibida sem nova chamada de geração para a mesma reunião.

**Aceite:** novas aberturas da mesma reunião retornam o conteúdo persistido; a integração de IA não é acionada outra vez.

### RF004 — Participantes identificados com segurança semântica

Participantes identificados contém exclusivamente nomes que a IA consegue extrair com confiança da transcrição; os papéis técnicos de captura não são convertidos em nomes.

**Aceite:** quando nenhum nome confiável for encontrado, o campo mostra “Nenhum nome identificado na transcrição”; nunca mostra `USER` ou `CLIENT` como se fossem pessoas.

### RF005 — Temperatura relacional

A temperatura é exatamente uma de `POSITIVA`, `NEUTRA` ou `TENSA`, com justificativa curta baseada no clima relacional da conversa.

**Aceite:** o resultado não contém nota numérica, previsão de resultado comercial ou avaliação individual de participantes.

### RF006 — Falha e nova tentativa

Se a geração falhar, o detalhe continua mostrando a transcrição e disponibiliza uma mensagem compreensível e ação “Tentar novamente”.

**Aceite:** a nova tentativa é possível para a mesma reunião autorizada e uma falha não substitui nem apaga uma análise previamente concluída.

### RF007 — Autorização e isolamento

O backend aplica as mesmas regras de consulta de reuniões à leitura, início e nova tentativa de análise.

**Aceite:** reunião inexistente, ativa ou fora do escopo retorna ausência de recurso sem revelar estado ou conteúdo de análise; gestor não cruza tenant; membro e individual não cruzam `user_id`; admin global é auditado sem registrar conteúdo da transcrição ou análise.

## Regras de negócio

* **RN001** — Somente sessão `ENDED` pode ter análise executiva.
* **RN002** — Uma análise concluída é imutável e prevalece sobre qualquer tentativa posterior; não há edição manual nem reprocessamento nesta entrega.
* **RN003** — A análise é baseada somente nos segmentos persistidos da própria sessão e não cria nem persiste áudio ou vídeo.
* **RN004** — O campo de resumo deve conter visão geral, decisões/acordos, pendências/próximos passos, riscos/objeções e pontos-chave; o conteúdo deve ser rotulado como gerado por IA.
* **RN005** — A lista de participantes é uma lista sem duplicatas de nomes confiáveis e não infere identidade por `USER` ou `CLIENT`.
* **RN006** — Temperatura avalia tom, colaboração, objeções e conflitos da conversa; seus únicos valores são positiva, neutra e tensa.
* **RN007** — Estado falho é reprocessável por ação explícita; estado concluído não é reprocessável.
* **RN008** — Criação, leitura, atualização de estado e recuperação da análise usam a reunião e o `tenant_id` autorizados no backend.

## Requisitos não funcionais

* **RNF001 — Segurança:** a chave OpenAI permanece apenas no backend; nenhum conteúdo de transcrição ou análise é gravado em logs.
* **RNF002 — Multi-tenancy:** cada estrutura e consulta de análise inclui e valida `tenant_id`; a autorização é decidida no backend.
* **RNF003 — Compatibilidade e acessibilidade:** o detalhe permanece utilizável em desktop, mobile e teclado; estados de geração/falha são perceptíveis.
* **RNF004 — Resiliência:** indisponibilidade ou resposta inválida da IA produz estado falho controlado e nova tentativa, sem impedir a consulta da transcrição.
* **RNF005 — Observabilidade:** logs estruturados registram início, conclusão e falha com identificadores técnicos mínimos, tenant/sessão quando permitido e sem conteúdo sensível; a consulta global do admin continua auditável.

## Fluxos

### Principal

1. A pessoa autorizada abre uma reunião encerrada.
2. O detalhe mostra metadados, transcrição e estado da análise.
3. Sem análise, a página dispara a geração e mostra “Gerando análise…”.
4. O backend valida o escopo, coleta somente os segmentos da sessão e persiste o resultado estruturado.
5. A página atualiza para mostrar resumo, participantes e temperatura.
6. Em nova abertura, o conteúdo persistido é mostrado sem gerar novamente.

### Alternativos e erros

* Sem nome confiável: exibe a mensagem de ausência de participantes identificados.
* Falha de IA: exibe mensagem e “Tentar novamente”; a transcrição continua disponível.
* Acesso sem permissão, sessão ativa ou inexistente: responde como recurso não encontrado, sem revelar análise.
* Duas aberturas simultâneas: o backend mantém uma única geração lógica para a mesma reunião.

## UX e mensagens

Os três campos ficam acima da transcrição, em seção claramente identificada como “Análise gerada por IA”. Durante o processamento, a seção mantém espaço reservado e a transcrição permanece navegável. A temperatura usa texto visível, não apenas cor. Mensagens obrigatórias: “Gerando análise…”, “Não foi possível gerar a análise. Tente novamente.” e “Nenhum nome identificado na transcrição”.

## Dados e integrações

É necessária migration Flyway para uma estrutura persistente de análise executiva associada de forma única à sessão e ao `tenant_id`, com estado de processamento, resultado estruturado, datas e informação de falha não sensível. A estratégia de rollback é remover a estrutura nova somente em reversão controlada da entrega; nenhuma tabela de reuniões ou transcrições existente será alterada destrutivamente.

O backend expõe o estado no contrato de detalhe e uma operação autenticada, explícita e idempotente para iniciar ou repetir geração quando permitida. A integração OpenAI recebe a transcrição já autorizada e devolve contrato estruturado validado antes da persistência.

## Estratégia de testes

* Unitários: validação do contrato estruturado da IA, regras de transição de estado, participantes únicos/confiáveis e temperatura permitida.
* Integração com Testcontainers PostgreSQL: migration, persistência, idempotência/concor­rência, escopo de tenant/perfil e casos de falha/retry.
* Frontend: renderização de análise pronta, estado gerando, ausência de nomes, falha/retry e não disparo para análise concluída.
* E2E: abertura de reunião encerrada, geração e exibição do resultado; acesso negado permanece não revelador.
* Builds: `./mvnw verify` com Java 21 e `npm run build`/`npm test` no frontend; E2E conforme ambiente efêmero definido no padrão de testes.

## Riscos e dependências

Há risco de latência, indisponibilidade e conteúdo impreciso da IA; por isso o resultado é estruturado, o erro é recuperável e a análise é apresentada como gerada por IA. A entrega depende da integração textual OpenAI já configurada no backend e não introduz nova credencial nem dependência de navegador.

## Decisão de integração

Backend, frontend, migration e testes compõem uma única fatia vertical e podem ser reintegrados juntos na `main`; não há necessidade de tickets separados.

## Aprovação

* [x] Escopo, critérios e requisitos são claros e testáveis.
* [x] Multi-tenancy, segurança e falhas foram especificados.
* [x] Pronto para análise de impacto, ADR e reviews.
