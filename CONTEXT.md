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
Texto apresentado ao usuário durante a reunião para apoiar sua próxima fala ou resposta a uma objeção.
_Evitar_: resposta obrigatória, decisão automática

**Conta de acesso:**
Identidade de uma pessoa que entra no Orientador. Não é sinônimo de tenant: uma organização pode ter várias contas de acesso.
_Evitar_: conta como sinônimo de organização ou espaço de dados

**Período de avaliação:**
Intervalo gratuito de sete dias concedido ao tenant quando ele é criado. Ao terminar, seus usuários não entram na área autenticada até existir uma forma futura de reativação.
_Evitar_: assinatura ativa, pagamento ou prazo individual de cada membro

**Sessão de call:**
Registro técnico que representa uma reunião e mantém seu título, estado e segmentos. É encerrada explicitamente pelo usuário autenticado.
_Evitar_: fonte de captura como sinônimo de sessão

**Segmento de transcrição:**
Trecho textual finalizado por detecção de fala dentro de uma sessão de call. É persistido; áudio bruto não é.
_Evitar_: chunk de áudio

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
