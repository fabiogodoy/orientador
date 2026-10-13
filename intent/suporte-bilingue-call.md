# Intent — Suporte bilíngue na call

## Metadados

* **Slug:** suporte-bilingue-call
* **Data:** 2026-10-13
* **Autor:** Usuário e Agente
* **Status:** Aprovada

## Resumo Executivo

O Orientador hoje é direcionado somente ao português. Isso prejudica a transcrição e torna as sugestões inadequadas em reuniões em inglês. O produto precisa apoiar português e inglês, inclusive quando os dois idiomas se alternam na mesma call.

## Problema

A sessão de transcrição informa apenas `pt` como idioma esperado e a instrução de geração obriga a próxima fala em português. Em uma reunião em inglês, o reconhecimento pode perder qualidade e a sugestão deixa de acompanhar a língua em que o cliente está falando.

## Objetivo

Permitir que vendedores recebam transcrição e orientação úteis em calls em português ou inglês, com cada sugestão no idioma da fala mais recente do cliente.

## Usuários Impactados

Usuários individuais e membros de organizações que fazem reuniões comerciais em português, inglês ou alternando entre ambos. Gestores se beneficiam indiretamente pelo valor da ferramenta para a equipe.

## Módulos/Sistemas Impactados

* `backend/` — configuração da sessão Realtime e instrução do gerador de sugestões.
* OpenAI Realtime e Responses APIs — integração existente, sem novo provedor.

## Processo Atual

Ao iniciar uma call, o backend cria um segredo Realtime com `pt` como único idioma. Após uma fala do cliente, o backend gera a orientação pedindo texto em português.

## Resultado Esperado

Uma sessão de call reconhece português e inglês. A sugestão usa o idioma da última fala do cliente, inclusive se a conversa alternar de idioma durante a sessão, sem seleção manual antes da reunião.

## Restrições

* Não gravar áudio ou vídeo e não ampliar a persistência de sugestões.
* Não expor a chave OpenAI nem conteúdo transcrito em logs.
* Preservar autenticação, CSRF e isolamento por `tenant_id` existentes.
* Manter o modelo econômico e a meta de latência já adotados.

## Regras de Negócio Conhecidas

* **RN001:** idiomas de transcrição suportados nesta entrega são português (`pt`) e inglês (`en`).
* **RN002:** a próxima fala e os pontos-chave devem usar o idioma da última fala do cliente.
* **RN003:** em uma call bilíngue, a regra é calculada novamente a cada nova fala de cliente; não existe idioma fixo para toda a reunião.
* **RN004:** fatos comerciais continuam restritos à transcrição, sem inventar preço, prazo ou funcionalidade.

## Riscos

* O idioma inferido a partir de fala curta ou ambígua pode ser incorreto.
* Um prompt pouco explícito pode devolver conteúdo em idioma diferente do desejado.
* Alterar indevidamente a configuração Realtime pode interromper a criação do segredo de transcrição.

## Critérios de Sucesso

* **CS001:** a sessão enviada à OpenAI inclui exatamente `pt` e `en` como idiomas possíveis.
* **CS002:** a instrução de geração exige que os campos textuais de orientação acompanhem o idioma da última fala do cliente.
* **CS003:** os testes comprovam os cenários português, inglês e alternância entre os dois, sem regressão de autorização ou tenant.

## Alternativas Consideradas

Manter apenas português ou exigir seleção manual de idioma antes da reunião. Ambas não atendem calls bilíngues e adicionam atrito; foram rejeitadas.

## Perguntas em Aberto

Nenhuma para este escopo. Idiomas além de português e inglês estão fora desta entrega.
