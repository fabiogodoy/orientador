# Architecture Review — Transcrição de microfone em tempo real

## Parecer: APROVADA COM RESSALVAS

O módulo correto é `frontend/` para captura local e WebRTC, `backend/` para identidade, emissão de segredo efêmero, persistência e integração de confiança, e PostgreSQL para texto final. A abordagem WebRTC é a recomendada para navegador pela documentação oficial e preserva a chave principal no servidor.

Há migration, integração externa e alteração de modelo de dados; ADR-0002 é obrigatória e foi registrada. Não será adicionada dependência de SDK: o backend pode usar `HttpClient` do Java 21 e o navegador APIs nativas. A complexidade é alta, mas justificada pela proposta central do produto.

Ressalvas: acesso só em HTTPS/localhost e Chromium inicialmente; segredos efêmeros expiram e a recuperação precisa ser previsível. Persistência de segmento deve usar `tenant_id` derivado da identidade, nunca de payload cliente.
