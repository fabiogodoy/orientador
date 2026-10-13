# Intent

## Metadados

| Campo | Valor |
| --- | --- |
| Título | Análise executiva de reuniões encerradas |
| Slug | analise-executiva-reunioes |
| Data | 2026-10-13 |
| Autor | Fabio Godoy e Codex |
| Status | Aprovada |

## Resumo executivo

Quem consulta uma reunião encerrada precisa compreender rapidamente seu conteúdo e clima, sem reler toda a transcrição. A consulta passará a apresentar uma análise executiva persistida, gerada sob demanda quando ainda ausente.

## Problema

### Problema principal

O histórico atual apresenta somente metadados e a transcrição integral. Para encontrar decisões, pendências, nomes mencionados e o clima da conversa, a pessoa precisa interpretar manualmente muitos segmentos de texto.

### Sintomas e evidências

As reuniões encerradas de `fabio.godoy@gmail.com` já possuem transcrições, mas não possuem resumo, participantes identificados ou temperatura. A estrutura atual distingue apenas os papéis técnicos `USER` e `CLIENT`, que não identificam pessoas pelo nome.

### Se nada for feito

O histórico continuará exigindo leitura integral para entendimento e terá menor valor como memória operacional de reuniões.

## Objetivo

Permitir que uma pessoa autorizada compreenda rapidamente uma reunião encerrada por meio de uma análise executiva confiável, consultável junto à transcrição e preservada para acessos futuros.

## Benefícios esperados

* Usuários individuais e usuários de organização reduzem o esforço de revisar reuniões anteriores.
* Gestores de organização obtêm contexto das reuniões do próprio tenant de forma mais rápida.
* Aumenta o valor percebido do histórico sem persistir áudio ou vídeo.

## Usuários impactados

* Usuário individual.
* Usuário de organização.
* Gestor de organização.
* Admin da plataforma, exclusivamente no acesso global autorizado e auditável.

## Módulos e sistemas impactados

* `frontend/` — consulta de reuniões.
* `backend/` — autorização, geração de análise e API.
* PostgreSQL — dados persistidos da análise, submetidos ao isolamento por tenant.
* OpenAI — geração textual feita somente pelo backend.

## Processo atual e dores

1. A pessoa abre uma reunião encerrada.
2. O sistema mostra metadados e segmentos transcritos.
3. A pessoa lê e sintetiza mentalmente a conversa.

Esse processo é demorado e não evidencia decisões, próximos passos, nomes mencionados ou clima relacional.

## Resultado esperado

Ao consultar qualquer reunião encerrada à qual tenha acesso, a pessoa visualiza resumo executivo, participantes identificados e temperatura da reunião. Se a análise ainda não existir, ela é gerada e persistida sem bloquear a leitura da transcrição; falhas oferecem nova tentativa explícita.

## Restrições conhecidas

* A análise usa somente a transcrição da própria reunião; não usa nem persiste áudio ou vídeo.
* Nomes só são exibidos quando identificados com confiança no texto; papéis `USER` e `CLIENT` não são nomes.
* A temperatura reflete o clima relacional, não sucesso comercial ou desempenho das pessoas.
* Toda leitura, geração e persistência deve respeitar `tenant_id` e as permissões existentes.
* A chave permanente da OpenAI não pode ser exposta ao navegador.

## Regras de negócio conhecidas

* RN001 — A análise executiva é gerada somente para reunião encerrada.
* RN002 — A análise já persistida é reutilizada; a geração não ocorre novamente em cada abertura.
* RN003 — O resumo inclui visão geral, decisões/acordos, pendências/próximos passos, riscos/objeções e pontos-chave, com indicação de que foi gerado por IA.
* RN004 — Participantes identificados contém somente nomes confiáveis mencionados na transcrição; sem nomes, a interface informa essa ausência.
* RN005 — A temperatura assume um único valor: positiva, neutra ou tensa, e traz justificativa breve.
* RN006 — Em falha de geração, a pessoa pode solicitar nova tentativa sem perder acesso à transcrição.

## Riscos

* A IA pode sintetizar ou identificar nomes de forma imprecisa.
* A geração sob demanda pode demorar ou falhar por indisponibilidade externa.
* Uma implementação inadequada pode expor dados entre tenants ou processar reunião sem autorização.
* Dados de reuniões existentes precisam continuar acessíveis sem migração manual.

## Impacto esperado nos indicadores

Não existem indicadores definidos. Espera-se impacto positivo em valor percebido, ativação e retenção; os efeitos deverão ser mensurados quando os indicadores forem estabelecidos.

## Critérios de sucesso

* CS001 — Uma reunião encerrada sem análise passa a exibir o estado de geração e, quando concluída, mostra os três campos definidos.
* CS002 — Uma análise pronta é reapresentada sem nova geração.
* CS003 — Uma reunião cuja transcrição não contenha nomes confiáveis informa a ausência de participantes identificados.
* CS004 — A consulta, geração e nova tentativa não acessam nem gravam análise de outro tenant.
* CS005 — Falha de geração é visível e permite nova tentativa, preservando a transcrição.

## Critérios para não implementar

A necessidade deixa de existir se a consulta de transcrições for removida ou se o produto deixar de persistir transcrições de reuniões encerradas.

## Alternativas consideradas

* Manter apenas a transcrição integral — rejeitada por preservar o esforço manual.
* Gerar uma análise toda vez que a reunião é aberta — rejeitada por custo, latência e inconsistência entre consultas.
* Inferir identidades a partir dos papéis de captura — rejeitada por não haver evidência suficiente.

## Perguntas em aberto

Nenhuma no escopo da Intent.

## Aprovação da Intent

* [x] Problema e valor de negócio claros.
* [x] Objetivo e perfis impactados identificados.
* [x] Pronta para gerar PRD.

## Próximo passo

Gerar `intent/analise-executiva-reunioes_prd.md`.
