# Intent — Consulta de reuniões

Status: Aprovada
Data: 2026-10-12
Slug: `consulta-reunioes`

## Problema

Depois de encerrar uma reunião, não há caminho para encontrá-la ou consultar a transcrição que o produto já guarda. Usuários, gestores e admins não conseguem recuperar contexto de conversas realizadas sem recorrer ao banco ou ao suporte.

## Objetivo

Permitir que pessoas autorizadas localizem reuniões encerradas e leiam seus metadados e transcrição, respeitando a visibilidade definida para cada perfil.

## Pessoas impactadas

- Usuário individual e membro de organização: próprias reuniões.
- Gestor de organização: reuniões do seu tenant.
- Admin da plataforma: reuniões de todos os tenants, para operação, suporte e segurança.

## Resultado esperado e critérios de sucesso

- Há acesso navegável à lista de reuniões encerradas.
- A lista é ordenada da mais recente para a mais antiga e dividida em páginas de 20 itens.
- Cada item leva a uma consulta somente leitura com título, data/hora, duração, responsável quando aplicável e transcrição cronológica.
- O backend aplica a matriz de visibilidade sem confiar no frontend.
- Dados de outro tenant nunca são devolvidos a gestor, membro ou usuário individual.

## Riscos

- Exposição indevida de transcrições por consulta sem escopo de tenant/papel.
- Consulta degradar com o crescimento de sessões encerradas.
- Confundir consulta histórica com uma call ativa ou com áudio gravado.

## Fora do objetivo

Editar/excluir reuniões, reproduzir áudio, persistir sugestões, busca/filtros e gestão de membros.
