# Intent — Organização da barra de reunião

## Metadados
Slug: organizar-barra-reuniao. Data: 2026-10-15. Autor: Codex. Status: Aprovada.
Entendimento confirmado pelo usuário nesta conversa em 2026-10-15.

## Problema e evidências
Durante reuniões, título, identidade, estado e ações disputam espaço na barra superior, como mostra a captura enviada. O símbolo da marca aparece como bloco branco no menu e o usuário perdeu a informação dos dias gratuitos. A inspeção confirmou filtro CSS sobre a marca e remoção do card de avaliação no commit 7cf07b8.

## Contexto, processo atual e objetivo
Usuários individuais e de organização entram na reunião e precisam distinguir identidade da conta, contexto da reunião e ações de captura. O prazo de sete dias continua vigente, mas não é informado na área autenticada. Objetivo: tornar essas informações legíveis e recuperar a transparência do prazo sem alterar o acesso.

## Benefícios e sistemas
Frontend autenticado: menor esforço para localizar controles e saber quando a avaliação termina. Gestores e usuários individuais se beneficiam; admin recebe a apresentação do prazo fornecido pela conta, sem mudança de privilégios. Backend, landing e banco não requerem alterações.

## Restrições e regras conhecidas
Avaliação de 168 horas, sem cobrança automática e com autorização de acesso feita no backend. Preservar ferramentas, comportamento de captura e dados. Sem novos custos/dependências.

## Riscos e critérios de sucesso
CS001: identidade e reunião visualmente separadas, com ferramentas acessíveis em desktop e mobile.
CS002: símbolo e nome da marca legíveis no menu.
CS003: dias gratuitos e data de término visíveis no menu autenticado.
Riscos: overflow em telas pequenas, edição do título e controles afetados por reorganização, prazo desatualizado durante uma sessão longa.

## Alternativas, indicadores e aprovação
Manter a barra atual perpetua a dor; não há alternativa operacional que restaure os elementos ausentes. Não há indicadores formais no projeto; espera-se reduzir dúvidas de uso/prazo. Sem perguntas em aberto. Problema, valor e objetivo aprovados; próxima etapa: PRD.

## Refinamento confirmado em 2026-10-15
O usuário pediu retirar a duplicação da marca no topo e mantê-la apenas no menu da área autenticada. Refinamento da mesma Intent, sem decisão aberta.
