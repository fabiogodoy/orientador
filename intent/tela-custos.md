# Intent — Tela de Custos

## Metadados
Slug: tela-custos. Data: 2026-10-15. Autor: Codex / solicitante. Status: Aprovada.

## Problema e evidências
Usuários não conseguem acompanhar o gasto com transcrição e sugestões de suas calls. O solicitante pediu visualização por período e anexou referência visual. Inspeção confirmou ausência de consumo persistido; duração da reunião não permite reconstruir cobrança de duas fontes de áudio.

## Contexto, objetivo e benefícios
Dar transparência ao custo operacional em US$ e equivalente em R$, distinguindo as duas categorias e permitindo localizar calls recentes. Beneficia usuário individual/membro, gestor e administrador. Hoje a alternativa é consultar provedores manualmente, sem atribuição por call ou tenant. Sem mudança permanece a falta de visibilidade. Indicadores quantitativos ainda não definidos no projeto.

## Módulos e restrições
Frontend, backend e PostgreSQL. Preservar captura, histórico, credenciais, isolamento e ausência de persistência de áudio/conteúdo das sugestões. Landing e cobrança comercial fora do escopo.

## Regras e entendimento aprovado
Em 2026-10-15 o usuário confirmou todas as recomendações: estimativas a partir desta entrega; calls antigas sem custo disponível; cotação diária automática com taxa/data; usuário vê próprios gastos, gestor os da organização, admin todos. A imagem orienta composição, não introduz OpenRouter nem armazenamento no navegador.

## Riscos e hipóteses
Tarifas e câmbio podem mudar; respostas sem consumo impedem estimativa completa. Custos representam consumo identificado, não uma fatura. Histórico sem medição não pode ser reconstruído fielmente.

## Critérios de sucesso
CS001: consultar em um acesso pelo topo os totais, categorias, gráfico e calls filtrados.
CS002: estimativas coerentes entre cartões/gráfico/lista, sem substituir desconhecido por zero.
CS003: permissões comprovadas por testes, sem interromper call ao abrir Custos.

## Alternativas e critérios para não implementar
Consulta manual não atribui custos ao usuário. Não implementar valores fictícios ou exposição entre tenants. Nenhuma decisão de negócio pendente. Intent aprovada para PRD.
