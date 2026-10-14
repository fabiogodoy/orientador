# Intent — Continuidade das sugestões em reuniões longas

Status: Aprovada pelo usuário nesta conversa, incluindo elevação para 1.200 tokens.

## Problema e contexto
Na reunião local de 14/10, 24 sugestões falharam ao interpretar resposta (20 JsonMappingException e 4 JsonEOFException), intercaladas com 19 sucessos. O cliente compartilha 400 tokens entre orientação e resumo acumulado sem compactação limitada; truncamento é a principal hipótese sustentada pelos erros, mas os logs antigos não registram incomplete_details para provar cada caso. Um erro isolado de transcrição permaneceu visível após recuperação, e o botão de retry da sugestão permaneceu após encerramento.

## Usuários, objetivo e benefícios
Todos os perfis que conduzem calls precisam de orientações contínuas e estado confiável. Reduzir falhas por resposta cortada, preservar contexto válido e evitar erros/ações obsoletos. Frontend e backend afetados; sem banco/landing. Sem indicador quantitativo de negócio definido.

## Resultado, regras e restrições
Elevar teto a 1.200 tokens, compactar contexto interno, tratar explicitamente resposta incompleta e corrigir alertas de ciclo da call. Preservar permissões, transcrições, modelo, credenciais e alterações externas. Não criar retry remoto automático ou nova integração.

## Sucesso e riscos
Resposta estruturada completa com contexto limitado, falhas recuperáveis sem corrupção de contexto, nenhuma ação de sugestão após fim. Cobertura automatizada para chamada longa, erro e recuperação. Risco: custo máximo de saída aumenta (aceito); respostas ainda podem falhar por rede/provedor. Alternativa de 400 tokens com resposta menor foi preterida pelo usuário. Sem decisão aberta.

Data: 2026-10-14. Autor: Codex. Slug: sugestoes-respostas-incompletas.
