# Plano de testes — Rolagem acompanhada na call

| RF | Cenário feliz | Erro/regressão |
| --- | --- | --- |
| RF001 | nova fala no fim move apenas a rolagem interna da transcrição | parcial frequente não cria comportamento suave repetido |
| RF002 | rolagem manual mostra retorno ao mais recente | nova fala não muda `scrollTop` enquanto usuário lê acima |
| RF003 | nova sugestão preserva a anterior e destaca a atual | regenerar mesma fala não cria card duplicado |
| RF004 | nova call limpa sugestão e histórico | encerrar call mantém comportamento de captura existente |

Testes de componente: simular dimensões/scroll dos dois painéis, disparar novos itens e acionar “voltar ao mais recente”. Regressão: manter os testes atuais de captura/transcrição/sugestão e executar `npm test -- --run` e `npm run build`.
