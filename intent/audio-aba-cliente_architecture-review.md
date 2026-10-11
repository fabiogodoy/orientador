# Architecture Review — Áudio da aba do cliente

## Parecer: APROVADA

Frontend é o lugar correto para autorização de `getDisplayMedia` e para administrar tracks. Backend continua responsável por emitir segredos, validar sessão/tenant e persistir somente texto final. Reutilizar o contrato de segmento com um campo de falante fechado é mais simples que criar outra sessão ou outra tabela. Duas conexões WebRTC evitam acoplamento entre fontes e usam APIs nativas; não adicionam dependências.

Migration Flyway é necessária para dar significado persistente à fala do cliente. A maior ressalva é a disponibilidade de áudio variar no navegador; a UI não anuncia sucesso sem `audioTrack`.
