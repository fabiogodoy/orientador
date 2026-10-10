---
gerado por: $bootstrap-project
status: definido
ultima_revisao: 2026-10-10
---

# Contexto de Negócio — Orientador

## Visão geral

Orientador é um produto novo de assistência a reuniões online. Durante uma reunião realizada em uma aba do navegador, o serviço transcreve o áudio da aba e do microfone do usuário em tempo real e apresenta sugestões de fala e de resposta a objeções. A primeira versão deve funcionar com reuniões web, incluindo Google Meet, Zoom Web e Microsoft Teams Web, conforme a captura de áudio disponibilizada pelo navegador.

## Missão

Ajudar pessoas a acompanhar uma conversa e responder com mais clareza durante reuniões online, sem substituir o julgamento do usuário.

## Público e perfis

* **Usuário individual:** contrata o serviço para uso pessoal e pertence a um tenant individual.
* **Usuário de organização:** utiliza o serviço dentro do tenant da organização.
* **Gestor de organização:** administra os usuários e pode consultar as transcrições dos usuários da própria organização.
* **Admin da plataforma:** administra todos os tenants, organizações e usuários e pode acessar os dados dos clientes para operação, suporte e segurança, com acesso auditável.

Organizações são o plano para grupos com mais de três usuários. Os valores e regras comerciais detalhadas ainda não foram definidos.

## Modelo de negócio

Assinatura para usuários individuais e organizações, com custo por usuário menor no plano organizacional. Cobrança, planos, limites e cancelamento serão especificados antes da implementação comercial.

O cadastro inicial de individuais e organizações inicia uma avaliação gratuita de sete dias (168 horas), sem cobrança automática. Ao expirar, login e área autenticada são bloqueados; ainda não há contratação ou renovação implementada. A primeira pessoa que cadastra uma organização é seu gestor inicial. A gestão de outros membros virá depois.

## Dados e confiança

O produto guarda transcrições, mas não gravações de áudio ou vídeo. As sugestões em tempo real não serão persistidas na primeira versão. Não haverá exclusão automática das transcrições; os titulares poderão solicitar exclusão conforme a legislação aplicável. O serviço deve informar com clareza a captura, o uso da xAI/Grok e o acesso autorizado aos conteúdos.

## Indicadores

Nenhum indicador de negócio foi definido nesta fase. Métricas de produto e operação serão escolhidas quando houver fluxo utilizável e necessidade de medição.

## Princípios de produto

* As sugestões são apoio à decisão, não garantias de resultado.
* O usuário inicia conscientemente a captura e informa os participantes sobre a transcrição, quando aplicável.
* Cada tenant vê apenas seus próprios dados, exceto o acesso global do admin da plataforma.
* A interface deve deixar visíveis o estado da captura e as permissões de áudio.
