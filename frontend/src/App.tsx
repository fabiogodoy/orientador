import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import logoUrl from '../../assets/brand/orientador-logo.svg'
import logoLightUrl from '../../assets/brand/orientador-logo-light.svg'
import termsMarkdown from '../../docs/legal/termos-de-uso.md?raw'
import { api, ApiError, TERMS_VERSION, type Account, type AccountType } from './api'

const routes = {
  home: '/app/',
  login: '/app/login',
  register: '/app/cadastro',
  terms: '/app/termos',
}

function Brand({ light = false }: { light?: boolean }) {
  return <a className={`brand ${light ? 'brand-light' : ''}`} href={routes.home} aria-label="Orientador — início">
    <img src={light ? logoLightUrl : logoUrl} alt="Orientador" />
  </a>
}

function AuthLayout({ children, eyebrow, title, description }: {
  children: ReactNode; eyebrow: string; title: string; description: string
}) {
  return <div className="auth-page">
    <aside className="story-panel">
      <Brand light />
      <div className="story-content">
        <div className="story-mark" aria-hidden="true">“</div>
        <h2>Converse com mais clareza. Decida com mais confiança.</h2>
        <p>Um espaço para se preparar para cada conversa — e, em breve, acompanhar suas reuniões com apoio em tempo real.</p>
        <div className="story-foot"><span className="pulse-dot" /> Seu próximo passo começa aqui</div>
      </div>
      <div className="story-decoration" aria-hidden="true"><span /><span /><span /></div>
    </aside>
    <main className="form-panel">
      <div className="mobile-brand"><Brand /></div>
      <div className="form-wrap">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="lead">{description}</p>
        {children}
      </div>
      <footer className="form-footer">© {new Date().getFullYear()} Connectas Software · <a href={routes.terms}>Termos de Uso</a></footer>
    </main>
  </div>
}

function ErrorNotice({ message }: { message: string | null }) {
  return message ? <div className="alert alert-error" role="alert">{message}</div> : null
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const created = new URLSearchParams(window.location.search).has('created')
  const expired = new URLSearchParams(window.location.search).has('expired')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await api.login(email.trim(), password)
      window.location.assign(routes.home)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout eyebrow="BEM-VINDO DE VOLTA" title="Entre no seu espaço" description="Acesse sua conta para acompanhar seu período gratuito e preparar o próximo passo.">
    {created && <div className="alert alert-success" role="status">Conta criada! Agora entre com seu e-mail e senha.</div>}
    {expired && <div className="alert alert-error" role="alert">Seu período gratuito terminou. Entre em contato com a Connectas.</div>}
    <ErrorNotice message={error} />
    <form onSubmit={submit} className="auth-form">
      <label htmlFor="login-email">E-mail</label>
      <input id="login-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required value={email} onChange={event => setEmail(event.target.value)} />
      <label htmlFor="login-password">Senha</label>
      <input id="login-password" type="password" autoComplete="current-password" placeholder="Sua senha" required value={password} onChange={event => setPassword(event.target.value)} />
      <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar na minha conta'} <span aria-hidden="true">↗</span></button>
    </form>
    <p className="switch-link">Ainda não tem uma conta? <a href={routes.register}>Comece grátis</a></p>
    <p className="support-note">Esqueceu a senha? Por enquanto, escreva para <a href="mailto:contato@connectas.com.br">contato@connectas.com.br</a>.</p>
  </AuthLayout>
}

function RegisterPage() {
  const [accountType, setAccountType] = useState<AccountType>('INDIVIDUAL')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    if (!accepted) {
      setError('Leia e aceite os Termos de Uso para continuar.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await api.register({
        name: name.trim(), email: email.trim(), password, accountType,
        organizationName: accountType === 'ORGANIZATION' ? organizationName.trim() : null,
        termsAccepted: accepted, termsVersion: TERMS_VERSION,
      })
      window.location.assign(`${routes.login}?created=1`)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível criar a conta. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  return <AuthLayout eyebrow="COMECE POR AQUI" title="Crie sua conta" description="Sete dias para conhecer o Orientador, sem cobrança automática.">
    <div className="account-choice" role="group" aria-label="Tipo de conta">
      <button type="button" className={accountType === 'INDIVIDUAL' ? 'selected' : ''} aria-pressed={accountType === 'INDIVIDUAL'} onClick={() => setAccountType('INDIVIDUAL')}>
        <span className="choice-icon" aria-hidden="true">◉</span><span><strong>Para mim</strong><small>Uso individual</small></span>
      </button>
      <button type="button" className={accountType === 'ORGANIZATION' ? 'selected' : ''} aria-pressed={accountType === 'ORGANIZATION'} onClick={() => setAccountType('ORGANIZATION')}>
        <span className="choice-icon" aria-hidden="true">▦</span><span><strong>Organização</strong><small>Comece como gestor</small></span>
      </button>
    </div>
    <ErrorNotice message={error} />
    <form onSubmit={submit} className="auth-form">
      {accountType === 'ORGANIZATION' && <><label htmlFor="organization-name">Nome da organização</label><input id="organization-name" maxLength={160} autoComplete="organization" required value={organizationName} onChange={event => setOrganizationName(event.target.value)} placeholder="Nome da sua organização" /></>}
      <label htmlFor="register-name">Seu nome</label>
      <input id="register-name" maxLength={120} autoComplete="name" required value={name} onChange={event => setName(event.target.value)} placeholder="Como podemos chamar você?" />
      <label htmlFor="register-email">E-mail</label>
      <input id="register-email" type="email" maxLength={254} autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@exemplo.com" />
      <div className="field-row">
        <div><label htmlFor="register-password">Senha</label><input id="register-password" type="password" minLength={12} maxLength={128} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo 12 caracteres" /></div>
        <div><label htmlFor="register-confirmation">Confirme a senha</label><input id="register-confirmation" type="password" minLength={12} maxLength={128} autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Repita sua senha" /></div>
      </div>
      <label className="terms-check" htmlFor="terms-accepted">
        <input id="terms-accepted" type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} />
        <span>Li e aceito os <a href={routes.terms} target="_blank" rel="noopener noreferrer">Termos de Uso</a> (versão {TERMS_VERSION}). Entendo que o acesso é bloqueado após sete dias, sem cobrança automática.</span>
      </label>
      <button className="primary-button" type="submit" disabled={busy}>{busy ? 'Criando conta…' : 'Criar conta grátis'} <span aria-hidden="true">↗</span></button>
    </form>
    <p className="switch-link">Já tem conta? <a href={routes.login}>Entrar</a></p>
  </AuthLayout>
}

function TermsPage() {
  return <div className="terms-page">
    <header className="terms-header"><Brand /><a className="text-button" href={routes.register}>Criar conta <span aria-hidden="true">↗</span></a></header>
    <main className="terms-content"><span className="eyebrow">TRANSPARÊNCIA DESDE O INÍCIO</span><ReactMarkdown>{termsMarkdown}</ReactMarkdown></main>
    <footer className="terms-footer">Connectas Software · <a href="mailto:contato@connectas.com.br">contato@connectas.com.br</a></footer>
  </div>
}

type IconName = 'microphone' | 'tabAudio' | 'sparkles' | 'phone' | 'settings' | 'copy' | 'chevron' | 'transcript' | 'clock' | 'sound'

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (name === 'microphone') return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" /></svg>
  if (name === 'tabAudio') return <svg {...common}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4M8.5 10.5h2l2-2v5l-2-2h-2zM15.5 9.5a3 3 0 0 1 0 4" /></svg>
  if (name === 'sparkles') return <svg {...common}><path d="m12 3 1.45 4.55L18 9l-4.55 1.45L12 15l-1.45-4.55L6 9l4.55-1.45L12 3ZM19 15l.72 2.28L22 18l-2.28.72L19 21l-.72-2.28L16 18l2.28-.72L19 15Z" /><path d="m5 15 .55 1.45L7 17l-1.45.55L5 19l-.55-1.45L3 17l1.45-.55L5 15Z" /></svg>
  if (name === 'phone') return <svg {...common}><path d="M7.3 3.5 4.9 4.6c-.8.38-1.18 1.28-.87 2.12 2.02 5.58 5.82 9.38 11.4 11.4.84.31 1.74-.07 2.12-.87l1.08-2.4a1.5 1.5 0 0 0-.57-1.84l-2.17-1.43a1.5 1.5 0 0 0-1.83.12l-1.04.88a11.45 11.45 0 0 1-2.64-2.64l.88-1.04a1.5 1.5 0 0 0 .12-1.83L9.14 4.07a1.5 1.5 0 0 0-1.84-.57Z" /></svg>
  if (name === 'settings') return <svg {...common}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.13 2.13-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55v.09h-3v-.09A1.7 1.7 0 0 0 10.67 18.7a1.7 1.7 0 0 0-1.88.34l-.06.06-2.13-2.13.06-.06A1.7 1.7 0 0 0 7 15.03a1.7 1.7 0 0 0-1.55-1.03h-.09v-3h.09A1.7 1.7 0 0 0 7 9.97a1.7 1.7 0 0 0-.34-1.88L6.6 8.03 8.73 5.9l.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.03-1.55v-.09h3v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.13 2.13-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.55 1.03h.09v3h-.09A1.7 1.7 0 0 0 19.4 15Z" /></svg>
  if (name === 'copy') return <svg {...common}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" /></svg>
  if (name === 'chevron') return <svg {...common}><path d="m7 10 5 5 5-5" /></svg>
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.25 2" /></svg>
  if (name === 'sound') return <svg {...common}><path d="M4 10h3l4-3v10l-4-3H4zM15 9.5a4 4 0 0 1 0 5M18 7a7 7 0 0 1 0 10" /></svg>
  return <svg {...common}><path d="M5 5h14v11H9l-4 3V5Z" /><path d="M8 9h8M8 12h5" /></svg>
}

const transcript = [
  { speaker: 'you', time: '00:12', text: 'Oi, Rafaela! Que bom falar com você. Para começarmos, me conta: o que motivou vocês a olhar para o Orientador agora?' },
  { speaker: 'client', time: '00:26', text: 'A gente está crescendo rápido e eu sinto que cada vendedor conduz as calls de um jeito. Fica difícil manter uma conversa consistente.' },
  { speaker: 'you', time: '01:04', text: 'Entendo. E quando uma conversa foge do roteiro ou surge uma objeção mais difícil, como o time costuma reagir hoje?' },
  { speaker: 'client', time: '01:22', text: 'Normalmente pedem ajuda no Slack ou deixam para falar com o gestor depois. Às vezes a oportunidade já esfriou.' },
  { speaker: 'you', time: '02:18', text: 'Faz sentido. A ideia é apoiar a pessoa no momento da conversa, sem transformar a call em algo engessado.' },
  { speaker: 'client', time: '02:47', text: 'Gostei da ideia, mas sinceramente achei o investimento um pouco acima do que tínhamos planejado para este trimestre.' },
]

const suggestions = [
  {
    label: 'Objeção de preço',
    quote: '“Gostei da ideia, mas sinceramente achei o investimento um pouco acima do que tínhamos planejado para este trimestre.”',
    answers: [
      'Faz todo sentido olhar para o investimento com cuidado, Rafaela. Posso te fazer uma pergunta? Quanto custa hoje para vocês quando uma oportunidade esfria por falta de apoio no momento da call? A proposta do Orientador é justamente encurtar esse intervalo entre a dúvida e uma boa resposta.',
      'Entendo, Rafaela. Antes de comparar apenas o valor, vale olharmos para o retorno: se o time conseguir recuperar uma oportunidade a mais por mês com mais consistência nas calls, como isso se compara ao investimento? Podemos começar com o grupo que mais precisa desse apoio.',
    ],
    points: ['Valide a preocupação antes de argumentar.', 'Retome a dor que ela trouxe: oportunidades que esfriam.', 'Convide para comparar impacto e não apenas preço.'],
  },
]

const previousSuggestions = [
  { label: 'Aprofundar a dor', time: '01:26', quote: '“Às vezes a oportunidade já esfriou.”', answer: 'Quando isso acontece, o que normalmente se perde primeiro: velocidade de resposta, confiança do vendedor ou o contexto da conversa? Isso ajuda a entender onde um apoio em tempo real faria mais diferença.' },
  { label: 'Descoberta', time: '00:31', quote: '“Cada vendedor conduz as calls de um jeito.”', answer: 'O que vocês já tentaram para dar mais consistência ao time? Quero entender se o desafio é mais de processo, de treinamento ou de apoio durante a conversa.' },
]

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function HomePage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCallActive, setIsCallActive] = useState(true)
  const [microphoneOn, setMicrophoneOn] = useState(true)
  const [tabAudioOn, setTabAudioOn] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(1002)
  const [suggestionVersion, setSuggestionVersion] = useState(0)
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  useEffect(() => {
    api.me().then(setAccount).catch(cause => {
      if (cause instanceof ApiError && cause.code === 'TRIAL_EXPIRED') {
        window.location.replace(`${routes.login}?expired=1`)
      } else if (cause instanceof ApiError && cause.code === 'UNAUTHENTICATED') {
        window.location.replace(routes.login)
      } else {
        setError('Não foi possível carregar sua conta. Tente novamente.')
      }
    })
  }, [])

  useEffect(() => {
    if (!isCallActive) return
    const interval = window.setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000)
    return () => window.clearInterval(interval)
  }, [isCallActive])

  async function logout() {
    try {
      await api.logout()
      window.location.assign(routes.login)
    } catch {
      setError('Não foi possível sair agora. Tente novamente.')
    }
  }

  if (!account) return <div className="loading-page" role="status">{error ?? 'Carregando seu espaço…'}</div>
  const currentSuggestion = suggestions[0]
  const currentAnswer = currentSuggestion.answers[suggestionVersion]
  const callStatus = isCallActive ? 'Call em andamento' : 'Call encerrada'

  return <div className="call-page">
    <header className="call-topbar">
      <a className="call-brand" href={routes.home} aria-label="Orientador — tela da call"><img src={logoUrl} alt="Orientador" /></a>
      <div className="call-context">
        <span className={`live-status ${isCallActive ? 'is-live' : 'is-ended'}`}><span />{callStatus}</span>
        <span className="call-timer"><Icon name="clock" size={16} />{formatDuration(elapsedSeconds)}</span>
        <span className="context-divider" aria-hidden="true" />
        <div className="client-identity"><span className="client-avatar">RC</span><span><strong>Rafaela Costa</strong><small>Diretora comercial · Orbit</small></span></div>
      </div>
      <div className="call-actions">
        <button type="button" className={`icon-control ${microphoneOn ? 'is-on' : ''}`} aria-label={microphoneOn ? 'Desativar microfone simulado' : 'Ativar microfone simulado'} aria-pressed={microphoneOn} onClick={() => setMicrophoneOn(value => !value)}><Icon name="microphone" /></button>
        <button type="button" className={`icon-control ${tabAudioOn ? 'is-on' : ''}`} aria-label={tabAudioOn ? 'Desativar áudio da aba simulado' : 'Ativar áudio da aba simulado'} aria-pressed={tabAudioOn} onClick={() => setTabAudioOn(value => !value)}><Icon name="tabAudio" /></button>
        <button type="button" className="suggest-button" disabled={!isCallActive} onClick={() => setSuggestionVersion(value => (value + 1) % currentSuggestion.answers.length)}><Icon name="sparkles" />Sugerir agora</button>
        <button type="button" className={`end-button ${isCallActive ? '' : 'restart-button'}`} onClick={() => setIsCallActive(value => !value)}><Icon name="phone" />{isCallActive ? 'Encerrar call' : 'Iniciar call'}</button>
        <div className="settings-wrap"><button type="button" className="icon-control" aria-label="Abrir configurações da demonstração" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}><Icon name="settings" /></button>{settingsOpen && <div className="settings-popover"><strong>Modo demonstração</strong><span>Controles e conteúdo são simulados localmente.</span><button type="button" className="logout-button" onClick={logout}>Sair da conta <span aria-hidden="true">↗</span></button></div>}</div>
      </div>
    </header>

    <main className="call-workspace">
      <section className="workspace-panel transcript-panel" aria-labelledby="transcript-title">
        <header className="panel-header"><div><span className="panel-kicker"><Icon name="transcript" size={17} />Transcrição ao vivo</span><h1 id="transcript-title">A conversa, no ritmo da call.</h1></div><span className="demo-label">Demonstração</span></header>
        <div className="transcript-scroll">
          <p className="call-start">Hoje · 09:30 <span>•</span> Transcrição simulada</p>
          {transcript.map((message, index) => <article className={`message-row ${message.speaker === 'you' ? 'from-you' : 'from-client'}`} key={`${message.time}-${index}`}>
            {message.speaker === 'client' && <span className="message-avatar" aria-hidden="true">RC</span>}
            <div className="message-content"><div className="message-meta"><strong>{message.speaker === 'you' ? 'Você' : 'Rafaela'}</strong><time>{message.time}</time></div><p>{message.text}</p></div>
            {message.speaker === 'you' && <span className="message-avatar you-avatar" aria-hidden="true">VO</span>}
          </article>)}
          {isCallActive && <div className="typing-line"><span /><span /><span /> Escutando a conversa…</div>}
        </div>
        <footer className="panel-footer"><span><Icon name="sound" size={16} />{tabAudioOn ? 'Áudio da aba simulado' : 'Áudio da aba pausado'}</span><span>Português (Brasil)</span></footer>
      </section>

      <section className="workspace-panel guidance-panel" aria-labelledby="guidance-title">
        <header className="panel-header"><div><span className="panel-kicker ai-kicker"><Icon name="sparkles" size={17} />Orientação da IA</span><h2 id="guidance-title">Próxima melhor resposta</h2></div><span className="last-speech">Com base na última fala</span></header>
        <div className="guidance-scroll">
          <article className="suggestion-card">
            <div className="client-quote"><span aria-hidden="true">“</span><div><small>RAFAELA DISSE · 02:47</small><p>{currentSuggestion.quote.replaceAll('“', '').replaceAll('”', '')}</p></div></div>
            <div className="suggestion-topline"><span className="suggestion-tag">{currentSuggestion.label}</span><span className="confidence"><i /><b>94%</b> de aderência</span></div>
            <p className="suggested-response">{currentAnswer}</p>
            <div className="key-points"><h3>O que vale manter na resposta</h3><ul>{currentSuggestion.points.map(point => <li key={point}>{point}</li>)}</ul></div>
            <footer className="suggestion-actions"><button type="button" className="subtle-button" onClick={() => setCopied(true)}><Icon name="copy" size={16} />{copied ? 'Copiado na demonstração' : 'Copiar resposta'}</button><button type="button" className="subtle-button" onClick={() => setSuggestionVersion(value => (value + 1) % currentSuggestion.answers.length)}><Icon name="sparkles" size={16} />Gerar outra</button><small>Gerada agora</small></footer>
          </article>
          <section className="previous-suggestions" aria-labelledby="previous-title"><div className="previous-heading"><h3 id="previous-title">Sugestões anteriores</h3><span>{previousSuggestions.length}</span></div>{previousSuggestions.map((suggestion, index) => { const expanded = expandedSuggestion === index; return <article className={`previous-card ${expanded ? 'is-expanded' : ''}`} key={suggestion.time}><button type="button" className="previous-trigger" aria-expanded={expanded} onClick={() => setExpandedSuggestion(expanded ? null : index)}><span><b>{suggestion.label}</b><small>{suggestion.time}</small></span><Icon name="chevron" size={18} /></button>{expanded && <div className="previous-content"><q>{suggestion.quote}</q><p>{suggestion.answer}</p></div>}</article> })}</section>
        </div>
      </section>
    </main>
    <div className="call-bottom-note">Simulação visual — nenhum áudio é capturado, enviado ou armazenado nesta etapa.</div>
  </div>
}

export function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === routes.terms) return <TermsPage />
  if (path === routes.register) return <RegisterPage />
  if (path === routes.login) return <LoginPage />
  return <HomePage />
}
