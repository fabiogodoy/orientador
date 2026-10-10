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

function HomePage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [error, setError] = useState<string | null>(null)
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

  async function logout() {
    try {
      await api.logout()
      window.location.assign(routes.login)
    } catch {
      setError('Não foi possível sair agora. Tente novamente.')
    }
  }

  if (!account) return <div className="loading-page" role="status">{error ?? 'Carregando seu espaço…'}</div>
  const daysLeft = Math.max(0, Math.ceil((new Date(account.trialEndsAt).getTime() - Date.now()) / 86_400_000))
  return <div className="home-page">
    <header className="home-header"><Brand /><button type="button" onClick={logout} className="text-button">Sair da conta <span aria-hidden="true">↗</span></button></header>
    <main className="home-main">
      <span className="eyebrow">SEU ESPAÇO NO ORIENTADOR</span>
      <h1>Olá, {account.name.split(' ')[0]}<span className="heading-dot">.</span></h1>
      <p className="home-lead">Sua conta está pronta. Este é o começo de conversas mais claras.</p>
      <div className="home-grid">
        <section className="home-card trial-card"><div className="card-icon" aria-hidden="true">↗</div><span className="card-label">PERÍODO GRATUITO</span><strong>{daysLeft} {daysLeft === 1 ? 'dia restante' : 'dias restantes'}</strong><p>Seu acesso termina em {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(account.trialEndsAt))}. Depois disso, o login será bloqueado. Não haverá cobrança automática.</p></section>
        <section className="home-card"><div className="card-icon" aria-hidden="true">◉</div><span className="card-label">SUA CONTA</span><strong>{account.accountType === 'ORGANIZATION' ? account.organizationName : 'Uso individual'}</strong><p>{account.accountType === 'ORGANIZATION' ? 'Você é o gestor inicial desta organização.' : 'Um espaço criado só para você.'}</p><small>{account.email}</small></section>
      </div>
      <div className="coming-next"><span className="pulse-dot" /><div><strong>O acompanhamento de reuniões vem em breve.</strong><p>Por enquanto, você já pode acessar sua conta e consultar os <a href={routes.terms}>Termos de Uso</a>.</p></div></div>
      <ErrorNotice message={error} />
    </main>
  </div>
}

export function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === routes.terms) return <TermsPage />
  if (path === routes.register) return <RegisterPage />
  if (path === routes.login) return <LoginPage />
  return <HomePage />
}
