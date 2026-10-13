# Intent — Transcrição e sugestões econômicas

## Metadados

| Campo | Valor |
|---|---|
| Slug | `transcricao-e-sugestoes-economicas` |
| Data | 2026-10-13 |
| Autor | Usuário e Codex |
| Status | Aprovada |

## Resumo executivo

O custo variável da transcrição e das sugestões durante uma call tornou o fluxo atual financeiramente inviável. A entrega deve preservar o apoio ao usuário durante a reunião, mas com processamento de áudio em blocos e geração de sugestões somente quando houver sinal relevante ou ação explícita do usuário.

## Problema

### Problema principal

O fluxo atual mantém conexões de transcrição em tempo real e pode solicitar sugestões repetidamente à medida que a conversa cresce. Isso combina custo de áudio elevado com contexto textual crescente, impedindo uma operação sustentável do produto.

### Sintomas e evidências

* O solicitante relatou que o projeto está “gastando muito” e considera o custo atual inviável.
* A transcrição atual utiliza uma sessão Realtime durante a call.
* Cada sugestão atual recebe a transcrição acumulada, fazendo o volume de contexto crescer ao longo da reunião.

### Contexto de negócio

O Orientador existe para apoiar usuários em reuniões online com transcrição e sugestões de fala. Se o custo por reunião não for controlado, a funcionalidade central não poderá sustentar a futura oferta por assinatura. Sem a mudança, a operação continua exposta a custo crescente e imprevisível conforme a duração e a quantidade de pausas da conversa.

## Objetivo

Reduzir significativamente o custo operacional por reunião, mantendo transcrição utilizável e sugestões contextuais quando elas forem relevantes para o usuário.

## Benefícios esperados

* Usuários individuais e de organizações continuam acompanhando a conversa e recebendo apoio em perguntas ou objeções.
* A operação passa a ter um caminho de custo de áudio mais baixo e um volume de inferências textuais controlado.
* Gestores e a plataforma preservam a confiança de que áudio não é retido após o processamento.

## Usuários impactados

* Usuário individual.
* Usuário de organização.
* Gestor de organização.
* Administração e suporte da plataforma.

## Módulos e sistemas impactados

* `frontend/` — captura local de áudio, envio em blocos, exibição da transcrição e acionamento de sugestões.
* `backend/` — autorização, encaminhamento temporário de áudio, persistência de segmentos, contexto interno efêmero e integração de IA.
* Integrações externas de transcrição e geração textual.

## Processo atual

1. O navegador captura microfone e/ou áudio da aba.
2. Cada fonte mantém uma sessão de transcrição Realtime.
3. Segmentos finalizados são persistidos como texto.
4. Pausas de fala podem disparar sugestões que usam a transcrição acumulada.

## Dores do processo atual

* Custo de transcrição por minuto incompatível com a operação pretendida.
* Custo e latência de sugestão crescem com o tamanho da reunião.
* Pausas sem pergunta ou objeção podem consumir inferência sem valor proporcional.

## Resultado esperado

Durante uma call, o texto continua surgindo em intervalos curtos a partir de blocos de áudio enviados após sua captura. Sugestões são solicitadas somente para perguntas/objeções identificadas localmente ou por ação manual. Cada sugestão usa um resumo interno e efêmero do contexto completo da call, sem expor esse resumo na interface ou ao interlocutor.

## Restrições

* Áudio e vídeo não podem ser persistidos; o áudio só pode existir enquanto necessário para encaminhamento e transcrição.
* Chaves de provedores externos permanecem exclusivamente no backend.
* Todas as operações, inclusive estados internos, devem manter isolamento por `tenant_id`.
* O limite de saída das sugestões permanece em 400 tokens.
* O resumo técnico não é conteúdo visível, exportável ou parte do resumo executivo da reunião.

## Regras de negócio conhecidas

* RN001 — A transcrição deve usar blocos fechados de 15 segundos por fonte, sem sessão persistente de streaming.
* RN002 — A sugestão automática só pode ocorrer diante de pergunta ou objeção identificada localmente; o usuário conserva um acionamento manual.
* RN003 — O resumo de contexto é interno, efêmero e descartado ao encerrar ou recarregar a call.
* RN004 — As sugestões recebem o resumo de todo o contexto e os trechos ainda não consolidados.
* RN005 — O áudio não é armazenado pela aplicação.

## Riscos

* A transcrição chega por blocos, não por deltas contínuos, alterando a percepção de imediatismo.
* O novo fornecedor externo de áudio cria dependência, limites de conta e requisitos de proteção de dados próprios.
* Regras locais podem não reconhecer toda formulação de pergunta ou objeção; o acionamento manual é a mitigação.
* O resumo efêmero pode ser perdido em recarga da página, deliberadamente para não ampliar retenção.
* A migração pode regredir captura de microfone, áudio de aba, transcrições bilíngues ou isolamento entre tenants.

## Impacto esperado nos indicadores

Ainda não há métricas formais definidas. Espera-se impacto positivo em viabilidade operacional e futura margem por assinatura, sem reduzir a utilidade básica da assistência durante a call.

## Critérios de sucesso

* CS001 — Uma call transmite apenas blocos temporários de áudio e nunca persiste áudio ou vídeo.
* CS002 — A transcrição aparece para cada fonte com blocos de até 15 segundos em condições normais.
* CS003 — Uma pausa comum não gera sugestão automática; pergunta, objeção ou ação manual pode gerá-la.
* CS004 — A sugestão usa contexto acumulado sem reenviar a transcrição integral já consolidada.
* CS005 — O resumo interno não aparece em nenhuma interface nem persiste após encerramento ou recarga.
* CS006 — Consultas, escrita e chamadas associadas à call preservam o isolamento por tenant.

## Alternativas consideradas

* Manter sessões Realtime atuais: rejeitada pelo custo por minuto.
* Usar um modelo de transcrição OpenAI mais barato: rejeitada por custo ainda acima da meta e horizonte de descontinuação.
* Hospedar modelos locais de sugestão: adiado; por enquanto a geração textual continuará hospedada.
* Gerar sugestão a cada pausa: rejeitada por consumo sem relevância garantida.

## Perguntas em aberto

Nenhuma decisão de produto ou arquitetura está em aberto. A disponibilidade e a configuração da credencial do novo provedor serão validadas antes de ativação em ambiente.

## Aprovação

* [x] Problema e valor de negócio estão claros.
* [x] Objetivo e critérios de sucesso estão claros.
* [x] Pronta para gerar PRD.

## Próximo passo

Gerar `intent/transcricao-e-sugestoes-economicas_prd.md`.
