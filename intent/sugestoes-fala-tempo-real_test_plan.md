# Test Plan

# Metadados

## Título

Plano de testes — Sugestões de fala comerciais em tempo real

## Slug

sugestoes-fala-tempo-real

## Data

2026-10-12

## Autor

Agente

## Intent

`intent/sugestoes-fala-tempo-real.md`

## PRD

`intent/sugestoes-fala-tempo-real_prd.md`

## Impact Analysis

`intent/sugestoes-fala-tempo-real_impact.md`

---

# Resumo

O plano valida a geração transitória de uma orientação após fala final do cliente, o contrato e as regras de conteúdo no backend, isolamento por tenant, estados assíncronos no frontend e a não regressão da captura/transcrição. Testes com banco usam exclusivamente PostgreSQL efêmero de Testcontainers; o provedor OpenAI é simulado em testes automatizados para não enviar transcrições reais.

# Matriz de Cobertura

| RF | Cenário Feliz | Cenário Alternativo | Cenário de Erro | Evidência Esperada |
| --- | --- | --- | --- | --- |
| RF001 | CT001 — fala `CLIENT` salva dispara geração | CT002 — fala `USER` não dispara | CT003 — falha da geração não interrompe a transcrição | Vitest e testes de serviço |
| RF002 | CT004 — contexto ordenado da própria call | CT005 — contexto com ambos falantes | CT006 — sessão/call distinta não entra no contexto | JUnit/Testcontainers |
| RF003 | CT007 — contrato estruturado válido | CT008 — próxima fala com 500 caracteres | CT009 — saída inválida, longa ou proibida é recusada | JUnit |
| RF004 | CT010 — vazio, carregando e sucesso reais | CT011 — resposta atual substitui anterior | CT012 — erro sem conteúdo demonstrativo | Vitest/RTL e Playwright |
| RF005 | CT013 — regeneração manual | CT014 — nova fala invalida resposta pendente | CT015 — botão indisponível sem fala de cliente | Vitest/RTL |
| RF006 | CT016 — titular autenticado acessa sua call | CT017 — CSRF exigido | CT018 — anônimo/outro tenant recebem erro sem conteúdo | Testcontainers/HTTP |

# Testes Unitários

## CT001 — Gatilho após segmento do cliente

### Regra validada

RN002 e RF001.

### Entrada

Evento final de transcrição `CLIENT` já confirmado pelo endpoint de segmentos.

### Resultado esperado

O cliente web solicita uma única orientação para a mesma sessão; evento `USER` não solicita orientação.

## CT004 — Contexto ordenado e delimitado

### Regra validada

RF002, RN003 e RNF003.

### Entrada

Segmentos intercalados de cliente/vendedor, com sequências crescentes, e segmentos de outra call/tenant.

### Resultado esperado

O cliente de geração recebe somente os segmentos da call autorizada, ordenados, identificados pelo falante e delimitados como dados não confiáveis.

## CT007 — Resposta comercial válida

### Regra validada

RF003, RN003, RN004 e RN006.

### Entrada

Retorno estruturado simulado contendo tipo, trecho, próxima fala curta em português e pontos-chave.

### Resultado esperado

O serviço aceita somente objeto completo e devolve o formato esperado pela interface.

## CT008/CT009 — Respostas rejeitadas

### Regra validada

RF003 e RN004.

### Entrada

Campos ausentes, JSON inválido, `proximaFala` com mais de 500 caracteres ou texto que declara preço, prazo ou funcionalidade não presente no contexto controlado.

### Resultado esperado

O serviço devolve falha sanitizada e não registra sugestão, texto de prompt ou resposta.

## CT010/CT013/CT014/CT015 — Estados da orientação

### Regra validada

RF004 e RF005.

### Entrada

Sem fala do cliente, requisição pendente, retorno válido, regeneração e uma segunda fala enquanto a primeira requisição está pendente.

### Resultado esperado

Interface não mostra arrays demonstrativos, anuncia estado adequado, permite regenerar apenas com contexto, e descarta retorno do contexto anterior.

# Testes de Integração

## CT016 — Endpoint autorizado e transitório

Criar duas contas/tenants e calls ativas no PostgreSQL efêmero. Para o titular, criar segmentos e chamar `POST /api/calls/{id}/suggestions` com CSRF e cliente OpenAI simulado. Esperar resposta estruturada, sem inserção em tabela de sugestões (inexistente) ou alteração de segmentos.

## CT018 — Isolamento e autenticação

Chamar o endpoint sem sessão, sem CSRF, com sessão de outro tenant, call encerrada e ID desconhecido. Esperar os códigos sanitizados existentes e ausência de chamada ao cliente OpenAI em todos os casos não autorizados.

## CT003 — Falha externa sem regressão

Fazer o cliente OpenAI simulado exceder timeout ou devolver indisponibilidade. Confirmar erro apropriado e, em seguida, salvar novo segmento/transcrição normalmente na mesma call.

# Testes E2E

## CT019 — Fluxo visual completo

Após os builds de frontend e backend, em ambiente efêmero com OpenAI simulada: iniciar fontes simuladas, publicar fala final `CLIENT`, confirmar persistência antes do request de sugestão, observar carregamento e card preenchido. Verificar ausência de exemplos e de sugestões anteriores estáticas.

## CT020 — Regeneração e degradação

No mesmo ambiente, selecionar “Gerar outra”, simular erro de geração e continuar recebendo/mostrando segmento de transcrição. Capturar screenshot dos estados vazio, carregando, sucesso e erro.

# Testes de Regressão

## CT021 — Captura independente continua disponível

Executar a suíte existente que cobre microfone, áudio de aba, pausa de fonte, título e encerramento da call. A nova orientação não deve iniciar mídia, criar segunda sessão ou alterar a ordem de persistência/encerramento.

## CT026 — Commit ao fim de fala

Com `AudioContext` e data channel simulados, emitir áudio acima do limiar e depois silêncio além da janela configurada. Esperar exatamente um `input_audio_buffer.commit`; ao parar a fonte, confirmar limpeza de timer/`AudioContext` e ausência de novo commit.

## CT027 — Falha de transcrição visível e isolada

Publicar o evento `conversation.item.input_audio_transcription.failed` em uma fonte simulada. Esperar mensagem segura na interface, nenhuma persistência de segmento inválido e a outra fonte ainda operável.

## CT022 — Nenhuma sugestão fixa remanescente

Buscar e testar a ausência de textos demonstrativos anteriores no bundle/interface e confirmar que o primeiro render mostra somente o estado vazio definido no PRD.

# Multi-Tenancy

## CT023 — Tenant A não infere a call do Tenant B

Tenant A chama o endpoint com o UUID de sessão do tenant B. Esperar resposta indistinguível de call indisponível, nenhuma chamada à OpenAI e nenhuma transcrição retornada.

# Segurança

## CT024 — Dados e segredo não vazam

Inspecionar respostas, mensagens de erro e logs de teste para confirmar ausência de API key, conteúdo da transcrição, prompt e sugestão. Verificar que o navegador chama somente a API local autenticada, nunca a OpenAI para geração.

# Performance

## CT025 — Medição de latência

Com ambiente de teste controlado e credencial válida não exposta, registrar a duração de ao menos 20 gerações bem-sucedidas de contexto representativo e calcular p95 entre confirmação do segmento e card preenchido. Critério: p95 menor ou igual a 3 s. Se o ambiente/provedor não estiver disponível, registrar a limitação e não declarar o RNF001 validado.

# Evidências

* `npm run build`, `npm test` e `npm run test:e2e` em `frontend/`.
* `./mvnw verify` com Java 21 em `backend/` e Testcontainers.
* Saídas dos testes, logs sanitizados e screenshots Playwright para CT019/CT020.
* Amostras e cálculo de CT025, quando houver credencial/ambiente autorizado.

# Checklist

* [x] Todos RF cobertos.
* [x] Todas as RN cobertas.
* [x] Cenários positivos e negativos definidos.
* [x] Regressão definida.
* [x] Multi-tenancy definida.
* [x] Segurança definida.
* [x] E2E definido quando aplicável.

# Próxima Etapa

Sincronizar a branch de trabalho com `origin/main` e só então implementar, executar este plano e seguir para `$implementation-review`, `$security-review`, `$observability-review`, `$reintegrar-main` e `$validate-delivery`.
