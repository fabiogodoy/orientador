# Orientador

Este glossário define os termos do produto usados em requisitos, interface e regras de acesso.

## Linguagem

**Tenant:**
Espaço de dados isolado de uma organização ou de um usuário individual. Nenhum cliente comum acessa dados de outro tenant.
_Evitar_: conta, cliente, organização como sinônimos de tenant

**Organização:**
Cliente que reúne mais de três usuários sob uma mesma administração e um mesmo tenant.
_Evitar_: empresa como único tipo de organização

**Usuário individual:**
Pessoa que contrata e usa o Orientador fora de uma organização, em um tenant próprio.
_Evitar_: usuário avulso

**Gestor de organização:**
Usuário que administra as pessoas e consulta as transcrições do seu tenant organizacional.
_Evitar_: admin como sinônimo de gestor

**Admin da plataforma:**
Operador da Connectas com acesso administrativo a todos os tenants.
_Evitar_: gestor, dono da organização

**Reunião:**
Unidade de consulta que agrupa todos os segmentos de uma mesma conversa acompanhada pelo Orientador. Começa quando o usuário inicia uma call ou a primeira fonte de captura e termina somente quando ele a encerra explicitamente. Pausar ou retomar uma fonte não cria outra reunião.
_Evitar_: gravação como sinônimo de reunião

**Transcrição:**
Texto produzido a partir da fala capturada durante uma reunião e guardado para consulta autorizada.
_Evitar_: gravação

**Sugestão:**
Orientação transitória apresentada ao vendedor durante a reunião para apoiar sua próxima fala ou resposta a uma objeção, baseada exclusivamente na transcrição da própria reunião.
_Evitar_: resposta obrigatória, decisão automática

**Sugestão em tempo real:**
Sugestão produzida após uma fala final do cliente e exibida para uso imediato pelo vendedor; não compõe o histórico persistido da reunião.
_Evitar_: resposta definitiva, registro de transcrição

**Histórico de orientação da call:**
Conjunto transitório de sugestões de fala geradas durante a call ativa. A mais recente recebe destaque e as anteriores permanecem consultáveis até o encerramento; não é persistido nem faz parte da transcrição.
_Evitar_: histórico permanente de sugestões, transcrição

**Conta de acesso:**
Identidade de uma pessoa que entra no Orientador. Não é sinônimo de tenant: uma organização pode ter várias contas de acesso.
_Evitar_: conta como sinônimo de organização ou espaço de dados

**Perfil do usuário:**
Informações pessoais editáveis da conta de acesso autenticada, incluindo nome e foto de perfil. O perfil pertence à pessoa, não ao tenant, organização ou reunião.
_Evitar_: perfil do cliente da call, perfil da organização

**Foto de perfil:**
Imagem quadrada associada à conta de acesso, exibida como avatar circular. É opcional, pode ser removida pela própria pessoa e não é reutilizada como imagem de participante da reunião.
_Evitar_: foto do cliente, gravação de vídeo

**Período de avaliação:**
Intervalo gratuito de sete dias concedido ao tenant quando ele é criado. Ao terminar, seus usuários não entram na área autenticada até existir uma forma futura de reativação.
_Evitar_: assinatura ativa, pagamento ou prazo individual de cada membro

**Sessão de call:**
Registro técnico que representa uma reunião e mantém seu título, estado e segmentos. É encerrada explicitamente pelo usuário autenticado.
_Evitar_: fonte de captura como sinônimo de sessão

**Segmento de transcrição:**
Trecho textual finalizado por detecção de fala dentro de uma sessão de call. É persistido; áudio bruto não é.
_Evitar_: chunk de áudio

**Bloco de áudio temporário:**
Recorte em memória, de duração limitada, produzido por uma fonte de captura e encaminhado uma única vez para transcrição. Não é um segmento de transcrição, não entra no histórico e não pode ser persistido pela aplicação.
_Evitar_: gravação, anexo de reunião, segmento de transcrição

**Resumo interno de contexto:**
Síntese transitória mantida somente na memória da call para dar contexto acumulado à próxima sugestão. Não é exibida, exportada, persistida, nem integra a análise executiva da reunião.
_Evitar_: resumo executivo, histórico de orientação, ata

**Transcrição parcial:**
Texto transitório recebido enquanto a pessoa fala. Quando uma fonte é parada antes do evento de conclusão do provedor, o texto recebido até então é finalizado como segmento interrompido para não desaparecer da reunião.
_Evitar_: transcrição salva

**Segredo efêmero:**
Credencial de curta duração e escopo de uma sessão, emitida pelo backend para o navegador conectar ao provedor de transcrição sem receber a chave permanente.
_Evitar_: chave OpenAI

**Fonte de captura:**
Origem independente de áudio dentro de uma sessão de call: microfone do usuário ou áudio compartilhado de aba/janela.
_Evitar_: call como sinônimo de uma única fonte

**Título da reunião:**
Nome consultável atribuído à reunião. O primeiro título aproveitável da aba compartilhada é sugerido automaticamente; se não houver um, usa-se “Reunião sem título”. A pessoa sempre pode substituí-lo manualmente.
_Evitar_: rótulo técnico da mídia como título definitivo

**Consulta de reuniões:**
Área somente leitura que permite localizar uma reunião encerrada e consultar seus metadados e transcrição conforme a permissão do perfil autenticado.
_Evitar_: gravação, painel de call ativa

**Análise executiva da reunião:**
Síntese persistida e gerada por IA a partir da transcrição de uma reunião encerrada, composta por resumo executivo, participantes identificados e temperatura da reunião. Não possui edição manual.
_Evitar_: avaliação manual, gravação analisada

**Resumo executivo:**
Síntese em linguagem clara da reunião que reúne visão geral, decisões ou acordos, pendências e próximos passos, riscos ou objeções e pontos-chave.
_Evitar_: transcrição resumida, ata obrigatória

**Participantes identificados:**
Nomes de pessoas explicitamente identificados na transcrição de uma reunião. A ausência de nomes confiáveis é registrada sem inferir identidade a partir do papel técnico do locutor.
_Evitar_: usuário e cliente como nomes de participantes

**Temperatura da reunião:**
Classificação qualitativa do clima relacional da conversa como positiva, neutra ou tensa, acompanhada de uma justificativa breve baseada em tom, colaboração, objeções e conflitos.
_Evitar_: nota de sucesso comercial, pontuação de desempenho

**Preparação da reunião:**
Informações opcionais escolhidas antes de iniciar a captura: contexto específico daquela reunião e, no máximo, uma base de conhecimento preexistente. Não é parte da transcrição, do resumo executivo ou do histórico exibido.
_Evitar_: prompt livre durante a call, configuração posterior à captura

**Contexto da reunião:**
Texto pontual fornecido pela pessoa antes de uma call para situar seu objetivo, cenário ou restrições. Pertence somente àquela sessão de call e é preservado com ela sem ser exibido no histórico.
_Evitar_: base de conhecimento, resumo interno de contexto

**Base de conhecimento:**
Referência textual reutilizável, pertencente a um tenant, que uma pessoa pode selecionar para orientar sugestões em uma call. É compartilhada para leitura dentro do tenant; sua administração é limitada ao criador ou gestor organizacional, conforme o perfil.
_Evitar_: documento anexado, fonte de fatos automaticamente confirmados
