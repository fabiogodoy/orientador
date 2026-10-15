# Impact Analysis — Organização da barra de reunião

## Metadados
2026-10-15 · Codex · organizar-barra-reuniao.
Fontes: `organizar-barra-reuniao.md`, `organizar-barra-reuniao_prd.md`.

## Resumo e complexidade
Baixa complexidade técnica, de negócio e operacional. Ajuste de apresentação em frontend/src/App.tsx, styles.css e componente isolado de aviso de avaliação, com testes.

## Sistemas impactados
| Sistema | Impacto |
|---|---|
| Frontend | Sim: shell autenticado e tela da reunião |
| Backend | Não |
| Landing | Não |
| PostgreSQL | Não |
| Integrações de IA | Não |

## Contratos, segurança e dados
Account.trialEndsAt já existe; cálculo é apresentação, não autorização. Nenhuma consulta, escrita, tenant_id, permissão, cookie, credencial ou log alterado. Sem migration, índices ou aumento de volume. Timer local por minuto e foco sem tráfego extra.

## Usuários e operação
Individuais e organizações recuperam acesso visual ao prazo e controles legíveis; gestor mantém ações atuais. Não exige treinamento, configuração ou cobrança. Benefício esperado para suporte; sem indicadores numéricos definidos.

## Riscos e mitigação
| Risco | Probabilidade / impacto | Mitigação |
|---|---|---|
| Overflow com menu lateral e nomes longos | Média / médio | Flex wrap, min-width e Playwright em larguras diversas |
| Regressão de captura/edição/perfil | Baixa / médio | Preservar handlers e executar testes funcionais existentes e novos |
| Contagem fica antiga durante sessão | Média / baixo | Atualizar por minuto/foco com testes de relógio |
| Data inválida impede renderização | Baixa / médio | Validar timestamp e fallback explícito |
| Menu/aviso inacessível em tela curta | Média / médio | Sidebar rolável e teste mobile |

## Sincronização e pendências
Único repositório monorepo, sem submódulos. Fetch executado; HEAD contém origin/main 9232f6b163b9ce5f081769ee52dfee173a024144. Preservar fora da entrega GroqTranscriptionClient.java modificado e .scratch/ não versionado. Usar branch codex/organizar-barra-reuniao e esta conversa exclusiva da Intent.

## Rollback e decisão
Reverter commit da entrega e reconstruir frontend. Testes descritos no PRD/plano. ADR dispensado: sem decisão arquitetural, integração, dependência ou alteração de domínio. Impactos identificados e mitigados; recomendado implementar após Architecture Review.
