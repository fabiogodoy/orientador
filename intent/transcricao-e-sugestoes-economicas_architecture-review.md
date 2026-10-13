# Architecture Review — Transcrição e sugestões econômicas

## Metadados

| Campo | Valor |
|---|---|
| Data | 2026-10-13 |
| Slug | `transcricao-e-sugestoes-economicas` |
| Referências | Intent, PRD, Impact Analysis e ADR-0007 |

## Parecer

**APROVADA COM RESSALVAS.** A mudança pertence aos módulos corretos e reutiliza APIs e convenções já adotadas. A aprovação é condicionada à autorização antes de chamada externa, ausência comprovada de persistência de áudio/resumo e validação operacional de retenção da Groq antes de produção.

## Módulos corretos e responsabilidades

* `frontend/` é o lugar correto para capturar áudio autorizado, criar blocos em memória, aplicar regras puras de intenção e reter resumo somente durante a call. Essas ações dependem de APIs do navegador e não podem migrar ao backend.
* `backend/` é o lugar correto para autenticar, verificar `tenant_id`, validar a call, controlar tamanho/tipo, chamar a Groq e persistir exclusivamente texto. A chave do fornecedor não pode ir ao navegador.
* `CallService` deve continuar sendo a fronteira de regra de negócio e autorização; controller só recebe multipart validado e delega. O cliente de cada fornecedor deve permanecer isolado em componente próprio.
* PostgreSQL não recebe nova estrutura: `transcript_segments` já representa o único dado persistível deste fluxo, o texto final.

## Reutilização e simplicidade

O projeto já usa `FormData` para avatar e Spring MVC já aceita `MultipartFile`; ambos devem ser reutilizados no contrato de bloco. O backend já usa `java.net.http.HttpClient` para OpenAI; o cliente Groq deve reutilizar essa biblioteca nativa, sem SDK novo. O frontend já centraliza chamadas autenticadas e CSRF em `api.ts`.

`MediaRecorder` é uma API nativa apropriada para Chrome/Edge, os navegadores já definidos pelo contexto do projeto. Não é justificável introduzir biblioteca de gravação para uma única fonte/intervalo.

## Aderência a convenções

* DTOs explícitos e validação de entrada permanecem no contrato HTTP.
* `CallService` resolve identidade e aplica tenant; não aceitar `tenantId`, texto final ou sequência como autoridade do navegador.
* O cliente Groq trata timeout/status/parse e lança exceção de domínio sanitizada; `ApiExceptionHandler` traduz para mensagem segura.
* A regra de pergunta/objeção deve ser função pura e testável no frontend; não vira regra remota ou comportamento de controller.
* O contrato de sugestão estruturada deve acrescentar estado interno sem o expor no componente de apresentação.

## Dados e migration

Não há migration justificável: persistir resumo ou áudio contrariaria PRD e arquitetura. A maior atenção é sequência e idempotência de segmentos: a ordem não pode depender da chegada de respostas HTTP concorrentes. O backend deve atribuir ou validar de forma atômica a sequência de um bloco autorizado.

## Dependências e débito técnico

Não serão adicionadas dependências de código. A Groq é uma nova dependência operacional e deve ser encapsulada para permitir rollback. A perda de resumo após reload é débito técnico deliberado, aceitável porque reduz retenção; uma continuidade posterior exigirá nova decisão e avaliação de dados.

## Segurança, multi-tenancy e desempenho

O upload é dado externo e potencialmente grande. O limite atual de multipart de 10 MB é ponto de partida, mas a entrega deve adotar teto por bloco compatível com 15 segundos de WebM e rejeitar tipos não aceitos. A autorização `call_session_id + tenant_id + user_id + ACTIVE` deve ocorrer antes de instanciar/chamar o cliente Groq.

O resumo de contexto que volta do navegador é conteúdo não confiável, limitado e destinado somente ao prompt. Ele não pode selecionar sessão, alterar segmento ou produzir consulta. Logs usam apenas IDs internos, fonte, modelo, duração e categoria.

Até oito uploads por minuto em uma call com duas fontes é aceitável para uma primeira versão somente se houver timeout, cancelamento/limpeza de fontes e limite de concorrência. Falha de uma fonte não pode encerrar a outra.

## ADR

ADR-0007 foi corretamente criada: a decisão adiciona fornecedor de áudio, substitui o canal de transcrição e fixa uma escolha de estado/retencão difícil de inferir no futuro.

## Recomendações obrigatórias para implementação

1. Remover o caminho de segredo/WebRTC da inicialização normal, evitando custo residual.
2. Não usar `MultipartFile.transferTo`, arquivos temporários ou storage para o bloco.
3. Implementar idempotência/ordenação e rejeição de bloco repetido.
4. Cobrir em testes que call/tenant não autorizado não gera chamada Groq.
5. Usar contrato estruturado para devolver `suggestion` e resumo interno atualizado; validar ambos e limitar o resumo.
6. Bloquear publicação em produção sem validar `GROQ_API_KEY`, gasto/limites e Zero Data Retention ou base contratual equivalente.
