# Intent — Perfil do usuário autenticado

## Problema

A área autenticada identifica uma pessoa com nome, cargo, organização e iniciais fictícios (por exemplo, “Rafaela Costa”), embora a sessão já conheça a conta realmente autenticada. A pessoa não consegue reconhecer sua própria conta visualmente, corrigir seu nome nem usar uma foto de perfil entre sessões e dispositivos.

## Objetivo

Permitir que cada pessoa autenticada veja e edite o próprio nome e foto de perfil, e que o topo da call represente a conta real autenticada.

## Usuários e valor

Usuários individuais e de organização passam a reconhecer claramente a própria sessão. Para a organização, o perfil continua pertencendo à pessoa e não altera administração, permissões ou dados de outros membros. A mudança aumenta confiança e reduz a aparência de conteúdo demonstrativo.

## Resultado esperado

A pessoa abre “Meu perfil” pelo bloco de avatar/nome, vê e-mail somente para consulta, altera o próprio nome e escolhe uma foto de até 10 MB. Ela pode recortar a imagem em formato quadrado, ajustar zoom/posição, salvar ou remover a foto. Ao concluir, o avatar e o nome reais aparecem no topo e permanecem após novo login.

## Riscos

Upload de imagem pode introduzir conteúdo malformado, consumo excessivo de banco ou acesso indevido a fotos de outros usuários. A funcionalidade deve manter autenticação, CSRF, validação de tipo/conteúdo e isolamento do perfil da própria conta.

## Critérios de sucesso

* O nome fictício do topo deixa de aparecer para uma conta autenticada.
* Nome e foto persistem e são recuperados somente para o usuário autenticado.
* A foto pode ser recortada, salva e removida sem quebrar a call ou a sessão.
* Arquivos inválidos, acima de 10 MB ou não suportados não são persistidos e recebem mensagem segura.

## Aprovação

Entendimento confirmado pelo solicitante em 2026-10-12: nome editável, e-mail somente leitura, perfil aberto pelo avatar/nome, foto persistida, crop quadrado exibido circularmente; JPG, PNG e WebP até 10 MB, com remoção.
