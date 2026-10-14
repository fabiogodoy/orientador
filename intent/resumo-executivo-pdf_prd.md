# PRD — Resumo executivo em PDF

## Metadados
Slug: resumo-executivo-pdf. Data: 2026-10-14. Autor: Codex. Status: Aprovado.
Origem: intent/resumo-executivo-pdf.md; formato confirmado pelo usuário nesta conversa.

## Objetivo e escopo
Exportar a análise concluída da reunião em PDF rico e renomear o rótulo. Frontend e governança; todos os perfis com acesso à reunião. Fora: transcrição no PDF, nova geração IA, alteração de contratos/permissões/banco, edição de análise e deploy em produção.

## Requisitos funcionais e aceite
- RF001: trocar “Participantes” por “Nomes Identificados” no painel e no PDF. Manter nomes existentes e mensagem de ausência.
- RF002: botão “Exportar PDF” no resumo concluído faz download direto de arquivo .pdf com nome seguro derivado do título. Inexistente para ABSENT, GENERATING, FAILED ou sem análise.
- RF003: PDF A4 com logo oficial, cores #123544/#5FE0C1, título/data/duração, visão geral, decisões/acordos, pendências/próximos passos, riscos/objeções, pontos-chave, nomes e temperatura/justificativa. Texto selecionável, acentos preservados, seções vazias explicitadas e páginas numeradas.
- RF004: conteúdo longo quebra em múltiplas páginas sem truncamento ou sobreposição. Cabeçalho/rodapé consistentes e títulos acompanhados de conteúdo.
- RF005: durante geração mostrar “Exportando…” e impedir cliques duplicados. Falha apresenta alerta acionável e permite tentar novamente; manter resumo e transcrição na tela.

## Regras de negócio
- RN001: exportar somente dados da análise COMPLETED e metadados já carregados pelo endpoint autorizado; não gerar outra análise nem persistir cópia.
- RN002: nenhum trecho da transcrição completa no PDF. Nomes não equivalem a presença confirmada; contrato participants permanece compatível.
- RN003: não interpretar conteúdo da análise como HTML, SVG, URL de imagem ou instruções PDF; somente texto.

## Requisitos não funcionais
RNF001: gerador/fontes carregados sob demanda, sem chamadas externas para processar conteúdo.
RNF002: recursos da marca locais; não registrar conteúdo, nomes, tokens ou segredos em logs.
RNF003: preservar isolamento existente por tenant/perfil, sem consultas adicionais ou novo endpoint.
RNF004: validar Chromium desktop e layout da ação em viewport móvel; PDF pesquisável com fonte embutida.
RNF005: falha visível ao usuário e diagnóstico estático por etapa, sem dados da reunião.

## Fluxos e UX
Abrir reunião autorizada → aguardar análise → Exportar PDF → estado ocupado → download → botão liberado. Falha de logo/geração: alerta e nova tentativa. Falha de carregamento do módulo: orientar atualização da página, pois o navegador pode manter a falha do import em cache. Sem conteúdo: mensagens existentes. Botão acessível por teclado e alerta role=alert; layout com quebra em telas pequenas.

## Integrações, dados e rollback
Sem mudança de API/banco/migration. Adicionar biblioteca local de geração PDF, sem serviço remoto. Reverter commit de frontend e dependências para rollback; não afeta dados.

## Entrega e testes
Uma integração segura na main: todas as mudanças no frontend e sem migração. Não precisa tickets. Testes unitários/componentes, geração real PDF, teste de download em Chromium com API simulada, inspeção de texto e páginas renderizadas. Build e auditoria de governança obrigatórios. Critérios de aprovação: RF/RN atendidos, testes aprovados, reviews e publicação em origin/main.
