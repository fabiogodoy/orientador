# Security Review — perfil-do-usuario

Status: APROVADO

Risco: médio, pois envolve dado pessoal e upload.

* Autenticação/autorização: todos os endpoints de perfil exigem sessão. O identificador é extraído de `SessionPrincipal`; o cliente não fornece nem controla o usuário-alvo.
* Isolamento: avatar e nome são consultados/escritos pelo UUID global da conta autenticada. Não há rota com ID arbitrário, portanto não há vetor IDOR nem cruzamento de tenant.
* Upload: o limite do multipart e da aplicação é 10 MB; a API lê apenas PNG, verifica dimensões/pixels antes de decodificar, normaliza para PNG 512×512 e limita o resultado a 2 MB. SVG e tipos disfarçados são rejeitados pela inspeção no servidor.
* Exposição: imagem não é pública; `GET /api/profile/avatar` exige autenticação e usa cache privado. E-mail continua somente leitura no cliente e não existe endpoint para alterá-lo.
* Segredos/logs: nenhuma credencial foi incluída. Logs de sucesso contêm IDs de usuário/tenant, sem bytes, nome, e-mail ou imagem.

Não foram encontradas vulnerabilidades crítica, alta ou média bloqueantes.
