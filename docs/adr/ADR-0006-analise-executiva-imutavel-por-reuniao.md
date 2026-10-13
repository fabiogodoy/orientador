# ADR-0006 — Análise executiva imutável por reunião

## Metadados

| Campo | Valor |
| --- | --- |
| Data | 2026-10-13 |
| Autor | Fabio Godoy e Codex |
| Status | Aprovado |
| Intent | `intent/analise-executiva-reunioes.md` |
| PRD | `intent/analise-executiva-reunioes_prd.md` |
| Impact Analysis | `intent/analise-executiva-reunioes_impact.md` |

## Contexto e problema

O Orientador persiste transcrições de reuniões encerradas, mas não possui síntese consultável. A análise exigida contém dados derivados sensíveis e precisa ser gerada somente a partir da transcrição autorizada, sem atrasar a consulta do histórico, sem se repetir a cada abertura e sem expor dados entre tenants.

## Decisão

Persistir uma única análise executiva imutável por reunião encerrada, associada tanto à sessão quanto ao `tenant_id`. A análise possui estado explícito de processamento e resultado estruturado: resumo executivo, participantes identificados e temperatura relacional com justificativa. O frontend lê o detalhe normalmente e inicia uma operação autenticada e idempotente de geração somente quando a análise está ausente ou falhou; não há edição manual nem reprocessamento de uma análise concluída.

O backend é o único responsável por autorizar, montar o contexto da transcrição, chamar a integração textual OpenAI, validar a resposta e persistir o resultado. Os papéis técnicos `USER` e `CLIENT` não podem ser promovidos a nomes de participantes.

## Opções consideradas

### Gerar a análise em cada abertura

Evita persistência adicional, mas aumenta custo e latência, torna o resultado variável e não oferece semântica clara para falhas. Rejeitada.

### Gerar em lote para todas as reuniões históricas

Preenche o histórico antecipadamente, mas cria custo e processamento surpresa de conversas sensíveis, inclusive quando jamais serão consultadas. Rejeitada.

### Gerar de forma síncrona no carregamento do detalhe

Simplifica a superfície de API, mas bloqueia o acesso à transcrição e torna uma indisponibilidade externa uma falha da consulta. Rejeitada.

### Uma análise persistida, sob demanda e com estado explícito

Preserva a leitura do histórico, limita a geração a uma vez por reunião e permite recuperação controlada após erro. Aceita.

## Justificativa

A análise se torna parte do histórico confiável da reunião, não uma sugestão transitória. O vínculo sessão + tenant e a imutabilidade tornam a consulta estável, facilitam isolamento, custos previsíveis e auditoria. Separar leitura e escrita mantém a semântica HTTP e a disponibilidade da transcrição mesmo se a IA falhar.

## Impactos

### Arquitetura e dados

Há uma nova estrutura Flyway para o estado e o resultado da análise, sem modificar destrutivamente sessões ou segmentos existentes. Uma restrição de unicidade e transições válidas evitam gerações concorrentes. O contrato do detalhe é ampliado aditivamente e uma nova operação autenticada trata início/retry.

### Segurança e multi-tenancy

Toda consulta e mudança de estado valida a reunião autorizada no backend e usa `tenant_id`; o frontend não informa tenant nem proprietário. A OpenAI recebe somente transcrição da reunião autorizada. Conteúdo de transcrição, análise e participantes não é escrito em logs; o acesso global do admin continua auditável por identificadores técnicos.

### Operação e desempenho

O primeiro acesso pode levar alguns segundos, mostrado como estado de geração, mas a transcrição continua disponível. A análise concluída elimina novas chamadas ao provedor. Falhas são recuperáveis por retry e observáveis por eventos técnicos sem conteúdo.

## Consequências e débito técnico

O produto passa a manter dados derivados de IA e, no futuro, poderá requerer versão de prompt/modelo, reprocessamento explícito ou política de exclusão associada à transcrição. Tais capacidades não fazem parte desta decisão e precisarão de nova Intent/PRD. A decisão deliberadamente não cria inferência de identidade de locutores, edição humana ou avaliação comercial.

## Riscos e mitigação

* Resposta imprecisa da IA: contrato estruturado, validação, rótulo de IA e extração conservadora de nomes.
* Falha ou latência externa: estado falho, retry e preservação da leitura.
* Acesso indevido: escopo centralizado, testes negativos por perfil/tenant e revisão de segurança.
* Crescimento de transcrições: geração única, limites explícitos e observabilidade de duração/erro.

## Plano de reversão

Desativar a operação de geração e a seção do detalhe em versão posterior preserva transcrições existentes. Após cessar todo uso do código, a estrutura de análise pode ser removida por migration reversível/controlada. Nenhum segmento ou dado de reunião existente é alterado para viabilizar a análise.

## Critérios de revisão

Revisar esta decisão ao introduzir exclusão de transcrições, reprocessamento/versionamento de IA, edição manual, processamento em lote, novo provedor ou sinais de custo/latência incompatíveis.

## Decisão final

**Aprovada.** A solução estabelece uma fronteira durável, segura e recuperável para análises executivas de reuniões encerradas.
