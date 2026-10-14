# Intent — Resumo executivo exportável

## Metadados
Slug: resumo-executivo-pdf. Data: 2026-10-14. Autor: Codex, a pedido do usuário. Status: Aprovada.

## Problema e evidências
O resumo executivo só pode ser consultado na aplicação; reaproveitá-lo exige copiar e formatar o conteúdo. O rótulo “Participantes” sugere uma lista de presença, embora os dados sejam apenas nomes identificados na transcrição. Solicitação explícita do usuário e inspeção de MeetingAnalysisPanel confirmam ambos os pontos.

## Contexto, processo atual e usuários
Individuais, usuários de organização, gestores e administradores consultam reuniões conforme suas permissões. Hoje abrem o histórico e leem a análise imutável, sem exportação. Precisam de um documento legível com identidade do Orientador para consultar fora da aplicação, reduzindo trabalho manual.

## Objetivo e resultado esperado
Identificar corretamente os nomes apresentados e permitir obter um resumo completo, legível e reconhecível como Orientador em uma ação, preservando o conteúdo autorizado.

## Benefícios e módulos
Frontend e glossário de domínio afetados. Benefício para todos os perfis com acesso à reunião. Sem impacto em backend, landing, banco ou geração por IA. Indicadores quantitativos ainda não definidos pelo negócio.

## Restrições e regras conhecidas
RN001: conteúdo exportado é a análise concluída já autorizada, sem alteração ou nova inferência.
RN002: não incluir transcrição completa. Nenhuma transmissão a serviços externos para exportar.
Preservar alteração local preexistente em GroqTranscriptionClient.java.

## Riscos
Cortes de texto ou acentos, logo ausente e nomes confundidos com presença. Validar arquivo real curto/longo e listas vazias. Arquivo baixado contém os dados solicitados pelo usuário.

## Critérios de sucesso
CS001: interface e documento usam “Nomes Identificados”.
CS002: usuário obtém documento com logo, metadados, todas as seções e paginação, sem transcrição.
CS003: erros recuperáveis têm feedback, e análise indisponível não permite exportação.

## Alternativas, hipóteses e aprovação
Copiar texto manualmente mantém o atrito. Usuário confirmou download direto com cores da marca e páginas numeradas em 2026-10-14. Sem perguntas abertas; entendimento confirmado. Intent pronta para PRD.
