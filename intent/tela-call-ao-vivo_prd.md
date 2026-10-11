# PRD — Tela de call ao vivo

## Metadados

| Campo | Valor |
| --- | --- |
| Slug | `tela-call-ao-vivo` |
| Data | 2026-10-11 |
| Origem | `intent/tela-call-ao-vivo.md` |
| Status | Aprovado |

## Escopo

### Dentro do escopo

* Substituir a área autenticada inicial em `/app/` por uma tela de call em andamento.
* Exibir cabeçalho com marca, status, duração, participante e controles.
* Exibir uma transcrição mockada em estilo de conversa, distinguindo usuário e cliente.
* Exibir uma sugestão atual para a última fala do cliente e sugestões anteriores recolhíveis.
* Simular localmente o estado de microfone, áudio da aba, início/encerramento da call e solicitação de outra sugestão.
* Fornecer layout responsivo e controles acessíveis por teclado.

### Fora do escopo

* Captura de microfone ou de áudio de aba, permissões do navegador, streaming, WebSocket, transcrição real ou IA real.
* Persistência de transcrições, sugestões, duração ou preferências.
* API, backend, banco, migração, mudança de sessão/autorização ou novas bibliotecas.

## Requisitos funcionais

### RF001 — Home de call autenticada

Em `/app/`, após a autenticação existente, o sistema deve apresentar a tela de call mockada no lugar da home de conta anterior.

**Aceite:** a tela mantém o logout e não exibe o fluxo de login a usuários autenticados.

### RF002 — Contexto e controles da call

O cabeçalho deve apresentar status de demonstração/em andamento, cronômetro mockado, interlocutor e controles de microfone, áudio da aba, iniciar/encerrar e configurações.

**Aceite:** todos os controles possuem nome acessível e podem ser acionados sem APIs de mídia.

### RF003 — Transcrição mockada

A coluna esquerda deve apresentar falas sequenciais de “Você” e “Cliente”, com identificação visual, horário relativo e rolamento próprio quando necessário.

**Aceite:** há ao menos três falas de cada participante e a autoria é distinguível sem depender só de cor.

### RF004 — Sugestão atual e histórico

A coluna direita deve associar a última fala do cliente a uma resposta sugerida, pontos-chave e ações de copiar/gerar outra; sugestões anteriores aparecem abaixo.

**Aceite:** a ação “Gerar outra” atualiza localmente o texto; itens anteriores podem ser expandidos/recolhidos.

### RF005 — Simulação segura de estados

Os controles de microfone, áudio da aba e call devem refletir estados visuais locais. Encerrar a call deve interromper a simulação e permitir retomada.

**Aceite:** nenhuma interação pede permissão de dispositivo, envia requisição de mídia ou chama serviço externo.

### RF006 — Responsividade e acessibilidade

Em telas estreitas, os painéis devem se organizar verticalmente e os controles permanecer utilizáveis.

**Aceite:** não há rolagem horizontal em viewport de 375 px; foco visível, semântica de botão e rótulos acessíveis são preservados.

## Regras de negócio

* RN001 — Todo conteúdo desta etapa é local e simulado; não representa uma transcrição ou recomendação real.
* RN002 — A tela permanece dentro da área autenticada existente; identidade e sessão seguem sendo validadas pelo backend atual.
* RN003 — A interface não pode alegar captura ativa nem solicitar permissões enquanto não houver a implementação correspondente.

## Requisitos não funcionais

* RNF001 — Usar React, TypeScript, CSS e dependências já existentes.
* RNF002 — Não introduzir dados de outro tenant ou dados persistidos; o mock é constante no cliente.
* RNF003 — Compatível com navegadores desktop modernos e adaptável a viewport móvel.
* RNF004 — Não requer logs ou métricas nesta entrega estática; a futura integração deverá definir observabilidade própria.

## Fluxos

1. Usuário autenticado abre `/app/` e vê a demonstração de call.
2. Pode alternar microfone e áudio de aba; apenas a apresentação local muda.
3. Pode encerrar a call; o estado passa a encerrado e o botão permite iniciar a simulação novamente.
4. Pode gerar outra sugestão ou expandir sugestões anteriores sem comunicação remota.

## Casos de erro

* Sem sessão, a proteção atual redireciona para login.
* Se a conta não carregar, permanece o aviso de erro já existente.

## Integrações e dados

Não há integração, contrato, API, esquema ou migração. A futura implementação de tempo real será uma entrega própria.

## Estratégia de testes

Vitest/React Testing Library cobrirá conteúdo, controles e estados locais; o build verificará TypeScript/CSS; Playwright cobrirá a navegação autenticada e a responsividade quando o ambiente E2E estiver disponível.

## Decisão de entrega

Uma única integração é suficiente: ela altera somente a home do frontend e não possui dependências entre módulos. Tickets não são necessários.
