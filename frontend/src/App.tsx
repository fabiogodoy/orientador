import { CostsPage } from './CostsPage'
import { AUDIO_CHUNK_MAX_MS, AUDIO_CHUNK_MIN_MS, AUDIO_PAUSE_MS, SUGGESTION_DELAY_MS, SUGGESTION_INTERVAL_MS, SUGGESTION_MAX_AGE_MS, recordCallTiming, hasUsefulSpeech } from './callTiming'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { TrialNotice } from './TrialNotice'
import { ExecutiveSummaryExportButton } from './ExecutiveSummaryExportButton'
import type { SummaryMetadata } from './executiveSummaryDocument'
import logoUrl from '../../assets/brand/orientador-logo.svg'
import logoLightUrl from '../../assets/brand/orientador-logo-light.svg'
import termsMarkdown from '../../docs/legal/termos-de-uso.md?raw'
import { api, ApiError, TERMS_VERSION, type Account, type AccountType, type CallHistoryDetail, type CallHistoryItem, type CallHistoryPage, type CallSuggestion, type KnowledgeBase, type KnowledgeBasePage, type MeetingAnalysisState } from './api'

const routes = {
  home: '/app/',
  login: '/app/login',
  register: '/app/cadastro',
  terms: '/app/termos',
  meetings: '/app/reunioes',
  costs: '/app/custos',
  knowledgeBases: '/app/bases-de-conhecimento',
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

function AuthenticatedShell({ account, onAccountChange, children }: { account: Account; onAccountChange: (account: Account) => void; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const path = window.location.pathname.replace(/\/$/, '')
  useEffect(() => {
    if (!menuOpen) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])
    window.requestAnimationFrame(() => focusable()[0]?.focus())
    function keepFocus(event: KeyboardEvent) {
      if (event.key === 'Escape') { setMenuOpen(false); return }
      if (event.key !== 'Tab') return
      const targets = focusable()
      if (!targets.length) return
      const first = targets[0]
      const last = targets[targets.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', keepFocus)
    return () => { window.removeEventListener('keydown', keepFocus); previousFocus.current?.focus() }
  }, [menuOpen])
  async function logout() {
    try { await api.logout() } finally { window.location.assign(routes.login) }
  }
  function closeMenu() { setMenuOpen(false) }
  return <>
    <div className="authenticated-shell">
      <button type="button" className="sidebar-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>☰</button>
      {menuOpen && <button type="button" className="sidebar-backdrop" aria-label="Fechar menu" onClick={closeMenu} />}
      <aside ref={sidebarRef} className={`app-sidebar ${menuOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
        <div><a className="sidebar-brand" href={routes.home} onClick={closeMenu}><img src={logoLightUrl} alt="Orientador" /></a><button type="button" className="sidebar-close" aria-label="Fechar menu" onClick={closeMenu}>×</button></div>
        <nav><a href={routes.meetings} aria-current={path === routes.meetings ? 'page' : undefined} onClick={closeMenu}>Reuniões</a><a href={routes.knowledgeBases} aria-current={path === routes.knowledgeBases ? 'page' : undefined} onClick={closeMenu}>Bases de conhecimento</a><a href={routes.costs} aria-current={path === routes.costs ? 'page' : undefined} onClick={closeMenu}>Custos</a><button type="button" onClick={() => { closeMenu(); setProfileOpen(true) }}>Perfil</button></nav>
        <TrialNotice trialEndsAt={account.trialEndsAt} />
        <button type="button" className="sidebar-logout" onClick={() => void logout()}>Sair</button>
      </aside>
      <div className="authenticated-content">{children}</div>
    </div>
    {profileOpen && <ProfileDialog account={account} onClose={() => setProfileOpen(false)} onAccountChange={onAccountChange} />}
  </>
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

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

type AudioSource = 'microphone' | 'tab'
type TranscriptSpeaker = 'you' | 'client'
type SourceCapture = {
  stream: MediaStream
  audioStream: MediaStream
  recorder: MediaRecorder | null
  rotationTimer: number | null
  stopCompletion: Promise<void> | null
  audioContext: AudioContext | null
  audioActivityTimer: number | null
  usesAudioActivityDetection: boolean
  hasAudibleSignal: boolean
  chunkStartedAt: number
  lastSpeechAt: number
  speaking: boolean
}
type ScrollPanel = 'transcript' | 'guidance'
type SuggestionEntry = { segmentNumber: number; suggestion: CallSuggestion }
type DisplayAudioOptions = DisplayMediaStreamOptions & { preferCurrentTab?: boolean; selfBrowserSurface?: 'exclude'; systemAudio?: 'include'; windowAudio?: 'system' }
const FALLBACK_MEETING_TITLE = 'Reunião sem título'
const SCROLL_FOLLOW_THRESHOLD = 48
const AUDIO_ACTIVITY_SAMPLE_MS = 250
const SPEECH_RMS_THRESHOLD = 5

const speakerForSource: Record<AudioSource, TranscriptSpeaker> = { microphone: 'you', tab: 'client' }

function initials(name: string) {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || '?'
}

function ProfileDialog({ account, onClose, onAccountChange }: { account: Account; onClose: () => void; onAccountChange: (account: Account) => void }) {
  const [name, setName] = useState(account.name)
  const [cropUrl, setCropUrl] = useState<string | null>(null)
  const [cropSize, setCropSize] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [positionX, setPositionX] = useState(0)
  const [positionY, setPositionY] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => () => { if (cropUrl) URL.revokeObjectURL(cropUrl) }, [cropUrl])

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Escolha uma imagem JPG, PNG ou WebP.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('A foto deve ter até 10 MB.'); return }
    if (cropUrl) URL.revokeObjectURL(cropUrl)
    setCropUrl(URL.createObjectURL(file)); setCropSize(null); setZoom(1); setPositionX(0); setPositionY(0); setError(null)
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setError(null)
    try { onAccountChange(await api.updateProfile(name.trim())) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível salvar seu nome.') }
    finally { setBusy(false) }
  }

  async function savePhoto() {
    if (!cropUrl || !cropSize) return
    setBusy(true); setError(null)
    try {
      const image = new Image()
      image.src = cropUrl
      await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error()) })
      const cropSide = Math.min(cropSize.width, cropSize.height) / zoom
      const extraX = (cropSize.width - cropSide) / 2
      const extraY = (cropSize.height - cropSide) / 2
      const sourceX = Math.max(0, Math.min(cropSize.width - cropSide, extraX + positionX * extraX))
      const sourceY = Math.max(0, Math.min(cropSize.height - cropSide, extraY + positionY * extraY))
      const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512
      const context = canvas.getContext('2d')
      if (!context) throw new Error()
      context.drawImage(image, sourceX, sourceY, cropSide, cropSide, 0, 0, 512, 512)
      const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error()), 'image/png'))
      onAccountChange(await api.uploadAvatar(png))
      URL.revokeObjectURL(cropUrl); setCropUrl(null); setCropSize(null)
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível salvar a foto. Tente outra imagem.') }
    finally { setBusy(false) }
  }

  async function removePhoto() {
    setBusy(true); setError(null)
    try { onAccountChange(await api.removeAvatar()) }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível remover a foto.') }
    finally { setBusy(false) }
  }

  const avatarUrl = account.avatarUpdatedAt ? api.avatarUrl(account.avatarUpdatedAt) : null
  const role = account.accountType === 'ORGANIZATION' ? `Gestor(a) · ${account.organizationName}` : 'Conta individual'
  return <div className="profile-backdrop" role="presentation" onMouseDown={event => { if (event.currentTarget === event.target) onClose() }}>
    <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-title">
      <header><div><span className="profile-kicker">SUA CONTA</span><h2 id="profile-title">Perfil</h2></div><button className="profile-close" type="button" onClick={onClose} aria-label="Fechar perfil">×</button></header>
      <ErrorNotice message={error} />
      <div className="profile-avatar-section">
        <div className="profile-avatar-large">{avatarUrl ? <img src={avatarUrl} alt="Sua foto de perfil" /> : initials(account.name)}</div>
        <div><strong>Foto de perfil</strong><p>JPG, PNG ou WebP, até 10 MB.</p><label className="subtle-button file-picker">Escolher foto<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} /></label>{avatarUrl && <button className="text-danger" type="button" disabled={busy} onClick={() => void removePhoto()}>Remover foto</button>}</div>
      </div>
      {cropUrl && <div className="crop-editor"><div className="crop-preview">{cropSize && <img src={cropUrl} alt="Prévia do recorte da foto" style={{ transform: `translate(${positionX * 16}%, ${positionY * 16}%) scale(${zoom})` }} />}</div><img className="crop-loader" src={cropUrl} alt="" onLoad={event => setCropSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} /><label>Zoom<input aria-label="Zoom da foto" type="range" min="1" max="3" step="0.01" value={zoom} onChange={event => setZoom(Number(event.target.value))} /></label><label>Horizontal<input aria-label="Posição horizontal da foto" type="range" min="-1" max="1" step="0.01" value={positionX} onChange={event => setPositionX(Number(event.target.value))} /></label><label>Vertical<input aria-label="Posição vertical da foto" type="range" min="-1" max="1" step="0.01" value={positionY} onChange={event => setPositionY(Number(event.target.value))} /></label><button className="primary-button crop-save" type="button" disabled={busy || !cropSize} onClick={() => void savePhoto()}>{busy ? 'Salvando…' : 'Aplicar recorte'}</button></div>}
      <form className="profile-form" onSubmit={saveName}><label htmlFor="profile-name">Nome</label><input id="profile-name" maxLength={120} required value={name} onChange={event => setName(event.target.value)} /><label htmlFor="profile-email">E-mail</label><input id="profile-email" value={account.email} readOnly aria-readonly="true" /><small>{role}</small><button className="primary-button" type="submit" disabled={busy || name.trim() === account.name}> {busy ? 'Salvando…' : 'Salvar nome'} </button></form>
    </section>
  </div>
}

function KnowledgeBasesPage({ account }: { account: Account }) {
  const [bases, setBases] = useState<KnowledgeBasePage | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { setBases(null); setError(null); api.knowledgeBases(page, query).then(setBases).catch(cause => setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as bases.')) }, [page, query])
  const canManage = (base: KnowledgeBase) => account.role === 'ORGANIZATION_MANAGER' || base.createdByUserId === account.id
  function resetForm() { setName(''); setContent(''); setEditingId(null); setError(null) }
  function reload(targetPage = page) { api.knowledgeBases(targetPage, query).then(setBases).catch(cause => setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as bases.')) }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null)
    try {
      await (editingId ? api.updateKnowledgeBase(editingId, name, content) : api.createKnowledgeBase(name, content))
      resetForm(); setPage(0); reload(0)
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível salvar a base agora.') } finally { setBusy(false) }
  }
  async function remove(base: KnowledgeBase) {
    if (!window.confirm(`Excluir a base “${base.name}”? Ela não estará disponível para novas reuniões.`)) return
    setBusy(true); setError(null)
    try { await api.deleteKnowledgeBase(base.id); if (editingId === base.id) resetForm(); reload() }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Não foi possível excluir a base agora.') } finally { setBusy(false) }
  }
  const totalPages = bases ? Math.ceil(bases.total / bases.pageSize) : 0
  return <main className="knowledge-page"><header><span className="eyebrow">SUA BIBLIOTECA</span><h1>Bases de conhecimento</h1><p>Organize os textos que orientam suas respostas. Eles permanecem disponíveis apenas para seu tenant.</p></header><ErrorNotice message={error} />
    <section className="knowledge-admin-grid"><form className="knowledge-form knowledge-editor" onSubmit={save}><h2>{editingId ? 'Editar base' : 'Nova base'}</h2><label htmlFor="knowledge-base-name">Nome da base</label><input id="knowledge-base-name" required maxLength={120} value={name} onChange={event => setName(event.target.value)} placeholder="Ex.: Produtos e preços" /><label htmlFor="knowledge-base-content">Conteúdo</label><textarea id="knowledge-base-content" required maxLength={12000} value={content} onChange={event => setContent(event.target.value)} placeholder="Políticas, experiências, diferenciais e informações que a IA pode consultar…" /><small>{content.length.toLocaleString('pt-BR')}/12.000 caracteres</small><div className="dialog-actions"><button type="button" className="subtle-button" onClick={resetForm} disabled={busy}>Limpar</button><button className="primary-button compact-primary" type="submit" disabled={busy}>{busy ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Criar base'}</button></div></form>
      <section className="knowledge-results" aria-labelledby="knowledge-results-title"><div className="knowledge-results-heading"><div><h2 id="knowledge-results-title">Bases disponíveis</h2><p>Encontre e mantenha o conhecimento do seu tenant.</p></div><label className="knowledge-search">Buscar por nome<input value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} placeholder="Ex.: produtos" /></label></div>
        {!bases && !error && <p className="history-state" role="status">Carregando bases…</p>}{bases?.items.length === 0 && <p className="history-state">{query ? 'Nenhuma base encontrada para essa busca.' : 'Nenhuma base cadastrada ainda.'}</p>}
        <div className="knowledge-list">{bases?.items.map(base => <article key={base.id}><div><strong>{base.name}</strong><p>{base.content}</p><small>Atualizada em {formatDateTime(base.updatedAt)}</small></div>{canManage(base) && <div className="knowledge-item-actions"><button type="button" onClick={() => { setEditingId(base.id); setName(base.name); setContent(base.content); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Editar</button><button type="button" className="text-danger" onClick={() => void remove(base)} disabled={busy}>Excluir</button></div>}</article>)}</div>
        {bases && totalPages > 1 && <nav className="history-pagination" aria-label="Paginação de bases"><button type="button" disabled={page === 0} onClick={() => setPage(current => current - 1)}>Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(current => current + 1)}>Próxima</button></nav>}
      </section>
    </section>
  </main>
}

function PreparationDialog({ onStart }: { onStart: (context: string, knowledgeBaseId: string | undefined) => void }) {
  const [bases, setBases] = useState<KnowledgeBase[]>([])
  const [context, setContext] = useState('')
  const [selectedBaseId, setSelectedBaseId] = useState('')
  const [baseQuery, setBaseQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api.knowledgeBaseOptions(baseQuery).then(setBases).catch(cause => setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar as bases. Você ainda pode iniciar sem elas.')) }, [baseQuery])
  return <div className="profile-backdrop"><section className="profile-dialog preparation-dialog" role="dialog" aria-modal="true" aria-labelledby="preparation-title">
    <header><div><span className="profile-kicker">ANTES DE COMEÇAR</span><h2 id="preparation-title">Preparar reunião</h2></div></header>
    <p className="dialog-description">Opcional: dê um contexto para esta conversa e escolha uma base. Você pode ignorar e seguir como está.</p><ErrorNotice message={error} />
    <label htmlFor="meeting-context">Contexto da reunião</label><textarea id="meeting-context" maxLength={6000} value={context} onChange={event => setContext(event.target.value)} placeholder="Objetivo, pessoa com quem você falará, cenário ou restrições…" /><small>{context.length.toLocaleString('pt-BR')}/6.000 caracteres</small>
    <label htmlFor="knowledge-base-search">Buscar base de conhecimento</label><input id="knowledge-base-search" value={baseQuery} onChange={event => { setBaseQuery(event.target.value); setSelectedBaseId('') }} placeholder="Digite parte do nome" /><label htmlFor="knowledge-base-select">Base de conhecimento</label><select id="knowledge-base-select" value={selectedBaseId} onChange={event => setSelectedBaseId(event.target.value)}><option value="">Nenhuma — usar somente a conversa</option>{bases.map(base => <option key={base.id} value={base.id}>{base.name}</option>)}</select>
    <div className="dialog-actions preparation-actions"><button type="button" className="subtle-button" onClick={() => onStart('', undefined)}>Ignorar e iniciar</button><button type="button" className="primary-button compact-primary" onClick={() => onStart(context, selectedBaseId || undefined)}>Continuar</button></div>
  </section></div>
}

function HomePage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transcriptionErrors, setTranscriptionErrors] = useState<Record<AudioSource, string | null>>({ microphone: null, tab: null })
  const transcriptionOutcome = useRef<Record<AudioSource, number>>({ microphone: 0, tab: 0 })
  const [isCallActive, setIsCallActive] = useState(false)
  const [microphoneOn, setMicrophoneOn] = useState(false)
  const [tabAudioOn, setTabAudioOn] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(1002)
  const [suggestions, setSuggestions] = useState<SuggestionEntry[]>([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [preparationOpen, setPreparationOpen] = useState(false)
  const [meetingTitle, setMeetingTitle] = useState(FALLBACK_MEETING_TITLE)
  const [meetingTitleDraft, setMeetingTitleDraft] = useState(FALLBACK_MEETING_TITLE)
  const [editingMeetingTitle, setEditingMeetingTitle] = useState(false)
  const [liveMessages, setLiveMessages] = useState<{ speaker: TranscriptSpeaker; time: string; text: string; source: AudioSource; sequenceNumber: number }[]>([])
  const [partialTranscripts, setPartialTranscripts] = useState<Record<AudioSource, string>>({ microphone: '', tab: '' })
  const [scrollFollowing, setScrollFollowing] = useState<Record<ScrollPanel, boolean>>({ transcript: true, guidance: true })
  const sourceCaptures = useRef<Record<AudioSource, SourceCapture | null>>({ microphone: null, tab: null })
  const callSessionId = useRef<string | null>(null)
  const lastCallSessionId = useRef<string | null>(null)
  const sessionStart = useRef<Promise<{ sessionId: string; title: string }> | null>(null)
  const nextSegment = useRef(1)
  const elapsedSecondsRef = useRef(elapsedSeconds)
  const partialTranscriptsRef = useRef(partialTranscripts)
  const meetingTitleRef = useRef(meetingTitle)
  const preparation = useRef<{ meetingContext?: string; knowledgeBaseId?: string }>({})
  const preparationConfirmed = useRef(false)
  const pendingStartSource = useRef<AudioSource | null>(null)
  const hasManualMeetingTitle = useRef(false)
  const hasCapturedTabTitle = useRef(false)
  const pendingSegmentWrites = useRef(new Set<Promise<void>>())
  const latestClientSegment = useRef<number | null>(null)
  const contextSummary = useRef({ value: '', through: 0 })
  const suggestionRequest = useRef(0)
  const suggestionInFlight = useRef(false)
  const queuedSuggestion = useRef<{ sessionId: string; sequenceNumber: number } | null>(null)
  const lastSuggestionStartedAt = useRef(-Infinity)
  const latestRemoteClosedAt = useRef(0)
  const latestRemoteSpeechAt = useRef(0)
  const latestUserSpeechAt = useRef(-Infinity)
  const completedSegments = useRef(new Set<number>())
  const completedThrough = useRef(0)
  const [guidanceListening, setGuidanceListening] = useState(false)
  const pendingSuggestionTimer = useRef<number | null>(null)
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  const guidanceScrollRef = useRef<HTMLDivElement>(null)
  const scrollFollowingRef = useRef(scrollFollowing)
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

  useEffect(() => { elapsedSecondsRef.current = elapsedSeconds }, [elapsedSeconds])
  useEffect(() => { scrollFollowingRef.current = scrollFollowing }, [scrollFollowing])
  useEffect(() => {
    scrollToLatest('transcript', partialTranscripts.microphone || partialTranscripts.tab ? 'auto' : 'smooth')
  }, [liveMessages, partialTranscripts])
  useEffect(() => { scrollToLatest('guidance', 'smooth') }, [suggestions])

  function setSourceListening(source: AudioSource, listening: boolean) {
    if (source === 'microphone') setMicrophoneOn(listening)
    else setTabAudioOn(listening)
  }

  function setPartialTranscript(source: AudioSource, text: string) {
    partialTranscriptsRef.current = { ...partialTranscriptsRef.current, [source]: text }
    setPartialTranscripts(partialTranscriptsRef.current)
  }

  function setDisplayedMeetingTitle(title: string) {
    meetingTitleRef.current = title
    setMeetingTitle(title)
    setMeetingTitleDraft(title)
  }

  function scrollElement(panel: ScrollPanel) {
    return panel === 'transcript' ? transcriptScrollRef.current : guidanceScrollRef.current
  }

  function handlePanelScroll(panel: ScrollPanel) {
    const element = scrollElement(panel)
    if (!element) return
    const following = element.scrollHeight - element.scrollTop - element.clientHeight <= SCROLL_FOLLOW_THRESHOLD
    scrollFollowingRef.current = { ...scrollFollowingRef.current, [panel]: following }
    setScrollFollowing(current => current[panel] === following ? current : { ...current, [panel]: following })
  }

  function scrollToLatest(panel: ScrollPanel, behavior: ScrollBehavior, force = false) {
    if (!force && !scrollFollowingRef.current[panel]) return
    const element = scrollElement(panel)
    if (!element) return
    if (force) {
      scrollFollowingRef.current = { ...scrollFollowingRef.current, [panel]: true }
      setScrollFollowing(current => ({ ...current, [panel]: true }))
    }
    if (typeof element.scrollTo === 'function') element.scrollTo({ top: element.scrollHeight, behavior })
    else element.scrollTop = element.scrollHeight
  }

  async function releaseSource(source: AudioSource) {
    const capture = sourceCaptures.current[source]
    if (!capture) return false
    sourceCaptures.current[source] = null
    if (capture.rotationTimer !== null) window.clearTimeout(capture.rotationTimer)
    capture.rotationTimer = null
    if (capture.audioActivityTimer !== null) window.clearInterval(capture.audioActivityTimer)
    capture.audioActivityTimer = null
    if (capture.audioContext) void capture.audioContext.close().catch(() => undefined)
    const stopCompletion = capture.stopCompletion
    if (capture.recorder?.state !== 'inactive') capture.recorder?.stop()
    capture.stream.getTracks().forEach(track => track.stop())
    setSourceListening(source, false)
    await stopCompletion
    return true
  }

  function hasActiveSources() {
    return sourceCaptures.current.microphone !== null || sourceCaptures.current.tab !== null
  }

  async function abortSessionIfUnused() {
    if (hasActiveSources()) return
    const sessionId = callSessionId.current
    callSessionId.current = null
    latestClientSegment.current = null
    contextSummary.current = { value: '', through: 0 }
    invalidateSuggestion()
    setGuidanceListening(false)
    setSuggestions([])
    setSuggestionLoading(false)
    setSuggestionError(null)
    setTranscriptionErrors({ microphone: null, tab: null })
    transcriptionOutcome.current = { microphone: 0, tab: 0 }
    cancelScheduledSuggestion()
    setIsCallActive(false)
    await waitForPendingSegments()
    if (sessionId) await api.endCall(sessionId).catch(() => setError('A captura foi encerrada localmente, mas não foi possível finalizar o histórico agora.'))
  }

  async function stopSource(source: AudioSource, message?: string) {
    if (!await releaseSource(source)) return
    if (message) setError(message)
  }

  async function endCall() {
    await stopSource('microphone')
    await stopSource('tab')
    const sessionId = callSessionId.current
    callSessionId.current = null
    latestClientSegment.current = null
    contextSummary.current = { value: '', through: 0 }
    invalidateSuggestion()
    setGuidanceListening(false)
    setSuggestions([])
    setSuggestionLoading(false)
    setSuggestionError(null)
    setTranscriptionErrors({ microphone: null, tab: null })
    transcriptionOutcome.current = { microphone: 0, tab: 0 }
    cancelScheduledSuggestion()
    lastCallSessionId.current = sessionId
    setIsCallActive(false)
    preparationConfirmed.current = false
    preparation.current = {}
    await waitForPendingSegments()
    if (sessionId) await api.endCall(sessionId).catch(() => setError('A captura foi encerrada localmente, mas não foi possível finalizar o histórico agora.'))
  }

  async function ensureSession() {
    if (callSessionId.current) return { sessionId: callSessionId.current }
    if (!sessionStart.current) {
      if (lastCallSessionId.current) {
        lastCallSessionId.current = null
        hasManualMeetingTitle.current = false
        hasCapturedTabTitle.current = false
        setDisplayedMeetingTitle(FALLBACK_MEETING_TITLE)
        setLiveMessages([])
        setSuggestions([])
        setSuggestionError(null)
        latestClientSegment.current = null
        contextSummary.current = { value: '', through: 0 }
        setPartialTranscript('microphone', '')
        setPartialTranscript('tab', '')
        nextSegment.current = 1
        completedSegments.current.clear()
        completedThrough.current = 0
        latestRemoteClosedAt.current = 0
        latestRemoteSpeechAt.current = 0
        latestUserSpeechAt.current = -Infinity
        lastSuggestionStartedAt.current = -Infinity
        setGuidanceListening(false)
      }
      sessionStart.current = api.startCall(meetingTitleRef.current, preparation.current)
    }
    try {
      const session = await sessionStart.current
      callSessionId.current = session.sessionId
      setDisplayedMeetingTitle(session.title)
      setElapsedSeconds(0)
      return session
    } finally {
      sessionStart.current = null
    }
  }

  function captureErrorMessage(cause: unknown, source: AudioSource) {
    if (cause instanceof ApiError) return cause.message
    if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
      return source === 'microphone' ? 'Permita o microfone para iniciar a transcrição.' : 'A escolha da aba foi cancelada ou não foi permitida.'
    }
    return source === 'microphone' ? 'Não foi possível acessar o microfone agora. Tente novamente.' : 'Não foi possível iniciar o áudio da aba agora. Tente novamente.'
  }

  function updateTranscriptionError(source: AudioSource, sessionId: string, sequence: number, message: string | null) {
    if (callSessionId.current !== sessionId || sequence < transcriptionOutcome.current[source]) return
    transcriptionOutcome.current[source] = sequence
    setTranscriptionErrors(current => ({ ...current, [source]: message }))
  }

  function invalidateSuggestion() {
    cancelScheduledSuggestion()
    queuedSuggestion.current = null
    suggestionRequest.current += 1
    setSuggestionLoading(suggestionInFlight.current)
    setGuidanceListening(true)
    setSuggestionError(null)
  }

  function noteUserSpeech(at: number) {
    latestUserSpeechAt.current = Math.max(latestUserSpeechAt.current, at)
    if (at >= latestRemoteSpeechAt.current) {
      invalidateSuggestion()
      setGuidanceListening(true)
    }
  }

  function receiveAudioChunk(source: AudioSource, sessionId: string, audio: Blob, speechEndedAt = Date.now()) {
    if (!audio.size) return
    const closedAt = Date.now()
    const sequenceNumber = nextSegment.current++
    if (source === 'microphone') noteUserSpeech(speechEndedAt)
    const write = api.transcribeAudio(sessionId, source, sequenceNumber, audio).then(response => {
      recordCallTiming('transcription', closedAt)
      if (callSessionId.current !== sessionId) return
      updateTranscriptionError(source, sessionId, sequenceNumber, null)
      const speaker = speakerForSource[source]
      setLiveMessages(current => [...current, { speaker, time: formatDuration(elapsedSecondsRef.current), text: response.text, source, sequenceNumber }].sort((a, b) => a.sequenceNumber - b.sequenceNumber))
      if (source === 'tab' && sequenceNumber > (latestClientSegment.current ?? 0)) {
        latestClientSegment.current = sequenceNumber
        latestRemoteClosedAt.current = closedAt
        latestRemoteSpeechAt.current = speechEndedAt
        invalidateSuggestion()
        if (hasUsefulSpeech(response.text) && speechEndedAt > latestUserSpeechAt.current) scheduleSuggestion(sessionId, sequenceNumber)
      }
    }).catch(cause => {
      recordCallTiming('transcription', closedAt, 'failed')
      updateTranscriptionError(source, sessionId, sequenceNumber, cause instanceof ApiError ? cause.message : 'Não foi possível transcrever este bloco. A call continua normalmente.')
    })
    pendingSegmentWrites.current.add(write)
    void write.finally(() => {
      pendingSegmentWrites.current.delete(write)
      if (callSessionId.current !== sessionId) return
      completedSegments.current.add(sequenceNumber)
      while (completedSegments.current.delete(completedThrough.current + 1)) completedThrough.current += 1
    })
  }

  function cancelScheduledSuggestion() {
    if (pendingSuggestionTimer.current !== null) window.clearTimeout(pendingSuggestionTimer.current)
    pendingSuggestionTimer.current = null
  }

  function scheduleSuggestion(sessionId: string, sequenceNumber: number) {
    cancelScheduledSuggestion()
    const delay = Math.max(SUGGESTION_DELAY_MS, lastSuggestionStartedAt.current + SUGGESTION_INTERVAL_MS - Date.now())
    pendingSuggestionTimer.current = window.setTimeout(() => {
      pendingSuggestionTimer.current = null
      if (latestClientSegment.current === sequenceNumber && callSessionId.current === sessionId
          && latestRemoteSpeechAt.current > latestUserSpeechAt.current && !sourceCaptures.current.microphone?.speaking
          && Date.now() - latestRemoteClosedAt.current <= SUGGESTION_MAX_AGE_MS) void generateSuggestion(sessionId, sequenceNumber)
    }, delay)
  }

  async function waitForPendingSegments() {
    await Promise.all([...pendingSegmentWrites.current])
  }

  async function generateSuggestion(sessionId: string, segmentNumber: number, manual = false) {
    if (suggestionInFlight.current) {
      if (!manual) queuedSuggestion.current = { sessionId, sequenceNumber: segmentNumber }
      return
    }
    cancelScheduledSuggestion()
    queuedSuggestion.current = null
    suggestionInFlight.current = true
    const requestNumber = ++suggestionRequest.current
    const startedAt = Date.now()
    const originAt = manual ? startedAt : latestRemoteClosedAt.current
    const summaryThrough = completedThrough.current
    lastSuggestionStartedAt.current = startedAt
    setSuggestionLoading(true)
    setSuggestionError(null)
    const stillCurrent = () => requestNumber === suggestionRequest.current && latestClientSegment.current === segmentNumber
      && callSessionId.current === sessionId && Date.now() - originAt <= SUGGESTION_MAX_AGE_MS
      && (manual || !sourceCaptures.current.microphone?.speaking)
    try {
      const response = await api.generateSuggestion(sessionId, contextSummary.current.value, contextSummary.current.through)
      const current = stillCurrent()
      recordCallTiming('suggestion', startedAt, current ? 'completed' : 'discarded')
      if (current) {
        // Never advance past an upload that was still pending when this request started.
        contextSummary.current = { value: response.contextSummary, through: Math.min(response.summarizedThrough, summaryThrough) }
        const listening = response.acao === 'OUVIR' || response.tipo === 'Ouvir'
        setGuidanceListening(listening)
        if (!listening) setSuggestions(current => [...current.filter(entry => entry.segmentNumber !== segmentNumber), { segmentNumber, suggestion: response }])
        recordCallTiming('guidance', originAt)
      }
    } catch (cause) {
      recordCallTiming('suggestion', startedAt, 'failed')
      if (stillCurrent()) setSuggestionError(cause instanceof ApiError ? cause.message : 'Não foi possível gerar a sugestão agora. Tente novamente em instantes.')
    } finally {
      suggestionInFlight.current = false
      setSuggestionLoading(false)
      const queued = queuedSuggestion.current as { sessionId: string; sequenceNumber: number } | null
      queuedSuggestion.current = null
      if (queued && queued.sessionId === callSessionId.current && queued.sequenceNumber === latestClientSegment.current) scheduleSuggestion(queued.sessionId, queued.sequenceNumber)
    }
  }

  function regenerateSuggestion() {
    const sessionId = callSessionId.current
    const segmentNumber = latestClientSegment.current
    if (sessionId && segmentNumber) void generateSuggestion(sessionId, segmentNumber, true)
  }

  async function copySuggestion() {
    const suggestion = suggestions.at(-1)?.suggestion
    if (!suggestion) return
    try {
      await navigator.clipboard?.writeText(suggestion.proximaFala)
      setCopied(true)
    } catch {
      setError('Não foi possível copiar a sugestão agora.')
    }
  }

  function tabTitleFrom(stream: MediaStream) {
    const title = stream.getVideoTracks().map(track => track.label.trim()).find(Boolean)
    return title && !/^screen\s+\d+$/i.test(title) ? title : null
  }

  function suggestFirstTabTitle(sessionId: string, title: string | null) {
    if (!title || hasCapturedTabTitle.current || hasManualMeetingTitle.current) return
    hasCapturedTabTitle.current = true
    setDisplayedMeetingTitle(title)
    void api.updateCallTitle(sessionId, title, true)
      .then(response => { if (!hasManualMeetingTitle.current) setDisplayedMeetingTitle(response.title) })
      .catch(() => setError('A call continua sendo transcrita, mas não foi possível salvar o título sugerido.'))
  }

  async function saveMeetingTitle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = meetingTitleDraft.trim()
    if (!title) { setError('Informe um título para a reunião.'); return }
    const sessionId = callSessionId.current ?? lastCallSessionId.current
    try {
      if (sessionId) {
        const response = await api.updateCallTitle(sessionId, title)
        setDisplayedMeetingTitle(response.title)
      } else {
        setDisplayedMeetingTitle(title)
      }
      hasManualMeetingTitle.current = true
      setEditingMeetingTitle(false)
      setError(null)
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Não foi possível salvar o título da reunião agora.')
    }
  }

  function startAudioChunk(source: AudioSource, sessionId: string, capture: SourceCapture) {
    if (sourceCaptures.current[source] !== capture) return
    const recorder = new MediaRecorder(capture.audioStream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 })
    let finishRecording: () => void = () => undefined
    capture.chunkStartedAt = Date.now()
    capture.lastSpeechAt = 0
    capture.hasAudibleSignal = !capture.usesAudioActivityDetection
    capture.recorder = recorder
    capture.stopCompletion = new Promise(resolve => { finishRecording = resolve })
    recorder.ondataavailable = event => {
      recordCallTiming('capture', capture.chunkStartedAt, capture.hasAudibleSignal ? 'completed' : 'discarded')
      if (capture.hasAudibleSignal) receiveAudioChunk(source, sessionId, event.data, capture.usesAudioActivityDetection ? capture.lastSpeechAt : Date.now())
    }
    recorder.onstop = () => {
      if (capture.recorder === recorder) {
        capture.recorder = null
        if (capture.rotationTimer !== null) window.clearTimeout(capture.rotationTimer)
        capture.rotationTimer = null
      }
      finishRecording()
      if (sourceCaptures.current[source] === capture) startAudioChunk(source, sessionId, capture)
    }
    recorder.start()
    capture.rotationTimer = window.setTimeout(() => {
      if (capture.recorder === recorder && recorder.state !== 'inactive') recorder.stop()
    }, AUDIO_CHUNK_MAX_MS)
  }

  function observeAudioActivity(source: AudioSource, capture: SourceCapture) {
    try {
      const audioContext = new AudioContext()
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      const samples = new Uint8Array(analyser.fftSize)
      audioContext.createMediaStreamSource(capture.audioStream).connect(analyser)
      capture.audioContext = audioContext
      capture.usesAudioActivityDetection = true
      const sample = () => {
        analyser.getByteTimeDomainData(samples)
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + (value - 128) ** 2, 0) / samples.length)
        const now = Date.now()
        if (rms >= SPEECH_RMS_THRESHOLD) {
          capture.hasAudibleSignal = true
          capture.lastSpeechAt = now
          if (source === 'tab' && !capture.speaking) invalidateSuggestion()
          if (source === 'microphone') {
            if (!capture.speaking) noteUserSpeech(now)
            latestUserSpeechAt.current = now
          }
          capture.speaking = true
        } else if (now - capture.lastSpeechAt >= AUDIO_PAUSE_MS) {
          capture.speaking = false
          if (capture.hasAudibleSignal && now - capture.chunkStartedAt >= AUDIO_CHUNK_MIN_MS
              && capture.recorder?.state === 'recording') capture.recorder.stop()
        }
      }
      sample()
      capture.audioActivityTimer = window.setInterval(sample, AUDIO_ACTIVITY_SAMPLE_MS)
      void audioContext.resume().catch(() => {
        capture.usesAudioActivityDetection = false
        capture.hasAudibleSignal = true
        if (capture.audioActivityTimer !== null) window.clearInterval(capture.audioActivityTimer)
        capture.audioActivityTimer = null
        console.warn('Audio activity detection unavailable; using timed capture.')
      })
    } catch {
      // Browsers without Web Audio support keep the capture path available.
    }
  }

  async function connectSource(source: AudioSource, stream: MediaStream, session: { sessionId: string }) {
    const capture: SourceCapture = { stream, audioStream: new MediaStream(stream.getAudioTracks()), recorder: null, rotationTimer: null, stopCompletion: null, audioContext: null, audioActivityTimer: null, usesAudioActivityDetection: false, hasAudibleSignal: true, chunkStartedAt: 0, lastSpeechAt: 0, speaking: false }
    sourceCaptures.current[source] = capture
    stream.getTracks().forEach(track => track.addEventListener('ended', () => {
      if (sourceCaptures.current[source]?.stream === stream) {
        void stopSource(source, source === 'tab' ? 'O compartilhamento de áudio da aba foi interrompido.' : 'O microfone foi interrompido.')
      }
    }))
    observeAudioActivity(source, capture)
    startAudioChunk(source, session.sessionId, capture)
    setSourceListening(source, true)
    setIsCallActive(true)
  }

  async function startMicrophone() {
    if (!preparationConfirmed.current && !callSessionId.current) { pendingStartSource.current = 'microphone'; setPreparationOpen(true); return }
    if (!window.navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Este navegador não suporta a captura de microfone.'); return }
    let stream: MediaStream | null = null
    try {
      setError(null)
      stream = await window.navigator.mediaDevices.getUserMedia({ audio: true })
      const session = await ensureSession()
      await connectSource('microphone', stream, session)
    } catch (cause) {
      await releaseSource('microphone')
      stream?.getTracks().forEach(track => track.stop())
      await abortSessionIfUnused()
      setError(captureErrorMessage(cause, 'microphone'))
    }
  }

  async function startTabAudio() {
    if (!preparationConfirmed.current && !callSessionId.current) { pendingStartSource.current = 'tab'; setPreparationOpen(true); return }
    if (!window.navigator.mediaDevices?.getDisplayMedia || !window.MediaRecorder) { setError('Este navegador não suporta compartilhar áudio de uma aba ou janela.'); return }
    let stream: MediaStream | null = null
    try {
      setError(null)
      const displayOptions: DisplayAudioOptions = { audio: true, video: true, preferCurrentTab: false, selfBrowserSurface: 'exclude', systemAudio: 'include', windowAudio: 'system' }
      stream = await window.navigator.mediaDevices.getDisplayMedia(displayOptions)
      if (!stream.getAudioTracks().length) {
        stream.getTracks().forEach(track => track.stop())
        setError('Nenhum áudio foi compartilhado. Escolha a aba ou janela da reunião e ative “Compartilhar áudio”.')
        return
      }
      const session = await ensureSession()
      suggestFirstTabTitle(session.sessionId, tabTitleFrom(stream))
      await connectSource('tab', stream, session)
    } catch (cause) {
      await releaseSource('tab')
      stream?.getTracks().forEach(track => track.stop())
      await abortSessionIfUnused()
      setError(captureErrorMessage(cause, 'tab'))
    }
  }

  async function toggleMicrophone() {
    if (sourceCaptures.current.microphone) await stopSource('microphone')
    else await startMicrophone()
  }

  async function toggleTabAudio() {
    if (sourceCaptures.current.tab) await stopSource('tab')
    else await startTabAudio()
  }

  async function toggleCall() {
    if (isCallActive) await endCall()
    else await startMicrophone()
  }

  function startWithPreparation(meetingContext: string, knowledgeBaseId: string | undefined) {
    preparation.current = { meetingContext: meetingContext.trim() || undefined, knowledgeBaseId }
    preparationConfirmed.current = true
    setPreparationOpen(false)
    const source = pendingStartSource.current
    pendingStartSource.current = null
    if (source === 'tab') void startTabAudio()
    else void startMicrophone()
  }

  if (!account) return <div className="loading-page" role="status">{error ?? 'Carregando seu espaço…'}</div>
  const callStatus = !isCallActive ? 'Call encerrada' : microphoneOn && tabAudioOn ? 'Você e cliente sendo transcritos' : microphoneOn ? 'Microfone sendo transcrito' : tabAudioOn ? 'Áudio da aba sendo transcrito' : 'Call em pausa'
  const displayedTranscript = liveMessages
  const currentSuggestion = suggestions.at(-1)?.suggestion ?? null
  const avatarUrl = account.avatarUpdatedAt ? api.avatarUrl(account.avatarUpdatedAt) : null
  const accountContext = account.accountType === 'ORGANIZATION' ? `Gestor(a) · ${account.organizationName}` : 'Conta individual'

  return <AuthenticatedShell account={account} onAccountChange={setAccount}><div className="call-page">
    <ErrorNotice message={error} />
    <ErrorNotice message={transcriptionErrors.microphone ? `Microfone: ${transcriptionErrors.microphone}` : null} />
    <ErrorNotice message={transcriptionErrors.tab ? `Áudio da aba: ${transcriptionErrors.tab}` : null} />
    <header className="call-topbar" aria-label="Sua conta">
      <button type="button" className="client-identity" onClick={() => setProfileOpen(true)} aria-label="Abrir seu perfil"><span className="client-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : initials(account.name)}</span><span><strong>{account.name}</strong><small>{accountContext}</small></span></button>
    </header>
    <section className="meeting-toolbar" aria-label="Controles da reunião">
      <div className="call-context">
        <div className="meeting-title">
          {editingMeetingTitle ? <form onSubmit={saveMeetingTitle}><label htmlFor="meeting-title">Título da reunião</label><input id="meeting-title" value={meetingTitleDraft} maxLength={160} onChange={event => setMeetingTitleDraft(event.target.value)} autoFocus /><button type="submit">Salvar</button></form> : <><span>Reunião</span><strong title={meetingTitle}>{meetingTitle}</strong><button type="button" onClick={() => { setMeetingTitleDraft(meetingTitle); setEditingMeetingTitle(true) }}>Editar título da reunião</button></>}
        </div>
        <div className="meeting-status">
          <span className={`live-status ${isCallActive ? 'is-live' : 'is-ended'}`}><span />{callStatus}</span>
          <span className="call-timer"><Icon name="clock" size={16} />{formatDuration(elapsedSeconds)}</span>
        </div>
      </div>
      <div className="call-actions">
        <button type="button" className={`icon-control ${microphoneOn ? 'is-on' : ''}`} aria-label={microphoneOn ? 'Parar de escutar microfone' : 'Escutar microfone'} aria-pressed={microphoneOn} onClick={() => void toggleMicrophone()}><Icon name="microphone" /></button>
        <button type="button" className={`icon-control ${tabAudioOn ? 'is-on' : ''}`} aria-label={tabAudioOn ? 'Parar de escutar áudio da aba' : 'Escutar áudio da aba'} aria-pressed={tabAudioOn} onClick={() => void toggleTabAudio()}><Icon name="tabAudio" /></button>
        <button type="button" className="suggest-button" disabled={!latestClientSegment.current || suggestionLoading} onClick={regenerateSuggestion}><Icon name="sparkles" />Sugerir agora</button>
        <button type="button" className={`end-button ${isCallActive ? '' : 'restart-button'}`} onClick={() => void toggleCall()}><Icon name="phone" />{isCallActive ? 'Encerrar call' : 'Iniciar call'}</button>
        <div className="settings-wrap"><button type="button" className="icon-control" aria-label="Abrir configurações da call" aria-expanded={settingsOpen} onClick={() => setSettingsOpen(value => !value)}><Icon name="settings" /></button>{settingsOpen && <div className="settings-popover"><strong>Privacidade da call</strong><span>O áudio serve apenas à transcrição em tempo real; o Orientador mantém somente o texto final.</span><a className="settings-link" href={routes.knowledgeBases}>Bases de conhecimento</a></div>}</div>
      </div>
    </section>

    <main className="call-workspace">
      <section className="workspace-panel transcript-panel" aria-labelledby="transcript-title">
        <header className="panel-header"><div><span className="panel-kicker"><Icon name="transcript" size={17} />Transcrição ao vivo</span><h1 id="transcript-title">A conversa, no ritmo da call.</h1></div></header>
        <div className="transcript-scroll" ref={transcriptScrollRef} onScroll={() => handlePanelScroll('transcript')}>
          <p className="call-start">Hoje · 09:30 <span>•</span> {isCallActive ? 'Transcrição em tempo real' : 'Aguardando início da call'}</p>
          {!displayedTranscript.length && !partialTranscripts.microphone && !partialTranscripts.tab && <p className="transcript-empty" role="status">Inicie o microfone ou compartilhe o áudio da aba. As falas transcritas aparecerão aqui.</p>}
          {displayedTranscript.map((message, index) => <article className={`message-row ${message.speaker === 'you' ? 'from-you' : 'from-client'}`} key={`${message.time}-${index}`}>
            {message.speaker === 'client' && <span className="message-avatar" aria-hidden="true">RC</span>}
            <div className="message-content"><div className="message-meta"><strong>{message.speaker === 'you' ? 'Você' : 'Interlocutor'}</strong><time>{message.time}</time></div><p>{message.text}</p></div>
            {message.speaker === 'you' && <span className="message-avatar you-avatar" aria-hidden="true">VO</span>}
          </article>)}
          {partialTranscripts.microphone && <article className="message-row from-you"><div className="message-content"><div className="message-meta"><strong>Você</strong><time>agora</time></div><p>{partialTranscripts.microphone}</p></div><span className="message-avatar you-avatar" aria-hidden="true">VO</span></article>}
          {partialTranscripts.tab && <article className="message-row from-client"><span className="message-avatar" aria-hidden="true">RC</span><div className="message-content"><div className="message-meta"><strong>Interlocutor</strong><time>agora</time></div><p>{partialTranscripts.tab}</p></div></article>}
          {isCallActive && <div className="typing-line"><span /><span /><span /> {microphoneOn && tabAudioOn ? 'Escutando você e o interlocutor…' : microphoneOn ? 'Escutando seu microfone…' : 'Escutando o áudio da aba…'}</div>}
          {!scrollFollowing.transcript && <button type="button" className="scroll-latest-button" onClick={() => scrollToLatest('transcript', 'smooth', true)}>Voltar ao mais recente <span aria-hidden="true">↓</span></button>}
        </div>
        <footer className="panel-footer"><span><Icon name="sound" size={16} />{tabAudioOn ? 'Escutando áudio da aba' : 'Áudio da aba desativado'}</span><span>Português (Brasil)</span></footer>
      </section>

      <section className="workspace-panel guidance-panel" aria-labelledby="guidance-title">
        <header className="panel-header"><div><span className="panel-kicker ai-kicker"><Icon name="sparkles" size={17} />Orientação da IA</span><h2 id="guidance-title">Próxima melhor resposta</h2></div><span className="last-speech">Com base na última fala</span></header>
        <div className="guidance-scroll" ref={guidanceScrollRef} onScroll={() => handlePanelScroll('guidance')}>
          {!currentSuggestion && !guidanceListening && !suggestionLoading && !suggestionError && <p className="guidance-empty" role="status">Aguardando a primeira fala do interlocutor para orientar sua próxima resposta.</p>}
          {guidanceListening && !suggestionLoading && <p className="guidance-empty" role="status">Continue ouvindo. Não é necessário intervir agora.</p>}
          {suggestionLoading && <p className="guidance-empty" role="status">Preparando uma sugestão para a última fala do interlocutor…</p>}
          {isCallActive && suggestionError && <div className="guidance-empty guidance-error" role="status"><p>{suggestionError}</p><button type="button" className="subtle-button" onClick={regenerateSuggestion}>Tentar novamente</button></div>}
          {suggestions.map((entry, index) => <article className="suggestion-card" key={entry.segmentNumber}>
            <div className="client-quote"><span aria-hidden="true">“</span><div><small>INTERLOCUTOR DISSE</small><p>{entry.suggestion.trechoCliente}</p></div></div>
            <div className="suggestion-topline"><span className="suggestion-tag">{entry.suggestion.tipo}</span><span className="suggestion-context">{index === suggestions.length - 1 && !guidanceListening ? 'Baseada na última fala' : 'Sugestão anterior'}</span></div>
            <p className="suggested-response">{entry.suggestion.proximaFala}</p>
            <div className="key-points"><h3>O que vale manter na resposta</h3><ul>{entry.suggestion.pontosChave.map(point => <li key={point}>{point}</li>)}</ul></div>
            {index === suggestions.length - 1 && !guidanceListening && <footer className="suggestion-actions"><button type="button" className="subtle-button" onClick={() => void copySuggestion()}><Icon name="copy" size={16} />{copied ? 'Copiado' : 'Copiar resposta'}</button><button type="button" className="subtle-button" onClick={regenerateSuggestion}><Icon name="sparkles" size={16} />Gerar outra</button><small>Gerada agora</small></footer>}
          </article>)}
          {!scrollFollowing.guidance && <button type="button" className="scroll-latest-button" onClick={() => scrollToLatest('guidance', 'smooth', true)}>Voltar ao mais recente <span aria-hidden="true">↓</span></button>}
        </div>
      </section>
    </main>
    <div className="call-bottom-note">Microfone e áudio compartilhado são transcritos de forma independente. O Orientador salva somente o texto final.</div>
    {profileOpen && <ProfileDialog account={account} onClose={() => setProfileOpen(false)} onAccountChange={setAccount} />}
    {preparationOpen && <PreparationDialog onStart={startWithPreparation} />}
  </div></AuthenticatedShell>
}

function HistoryHeader({ account }: { account: Account }) {
  return <header className="history-topbar">
    <span className="history-account">{account.name}</span>
  </header>
}

function CostsRoute() {
  const [account, setAccount] = useState<Account | null>(null)
  useEffect(() => { api.me().then(setAccount).catch(() => window.location.replace(routes.login)) }, [])
  if (!account) return <div className="loading-page" role="status">Carregando custos…</div>
  return <AuthenticatedShell account={account} onAccountChange={setAccount}><CostsPage /></AuthenticatedShell>
}

function KnowledgeBasesRoute() {
  const [account, setAccount] = useState<Account | null>(null)
  useEffect(() => { api.me().then(setAccount).catch(() => window.location.replace(routes.login)) }, [])
  if (!account) return <div className="loading-page" role="status">Carregando bases de conhecimento…</div>
  return <AuthenticatedShell account={account} onAccountChange={setAccount}><KnowledgeBasesPage account={account} /></AuthenticatedShell>
}

function MeetingHistoryPage() {
  const [account, setAccount] = useState<Account | null>(null)
  const [history, setHistory] = useState<CallHistoryPage | null>(null)
  const [page, setPage] = useState(0)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api.me().then(setAccount).catch(() => window.location.replace(routes.login)) }, [])
  useEffect(() => {
    if (!account) return
    setHistory(null); setError(null)
    api.callHistory(page).then(setHistory).catch(cause => setError(cause instanceof ApiError ? cause.message : 'Não foi possível carregar suas reuniões.'))
  }, [account, page])
  if (!account) return <div className="loading-page" role="status">Carregando suas reuniões…</div>
  const totalPages = history ? Math.ceil(history.total / history.pageSize) : 0
  return <AuthenticatedShell account={account} onAccountChange={setAccount}><div className="history-page"><HistoryHeader account={account} /><main className="history-main"><span className="eyebrow">HISTÓRICO</span><h1>Reuniões realizadas</h1><p className="history-lead">Consulte as reuniões encerradas e retome o contexto da conversa quando precisar.</p><ErrorNotice message={error} />
    {!history && !error && <p className="history-state" role="status">Carregando reuniões…</p>}
    {history?.items.length === 0 && <p className="history-state">Ainda não há reuniões encerradas para consultar.</p>}
    {history?.items.map(item => <MeetingRow key={item.sessionId} item={item} account={account} />)}
    {history && totalPages > 1 && <nav className="history-pagination" aria-label="Paginação de reuniões"><button type="button" disabled={page === 0} onClick={() => setPage(current => current - 1)}>Anterior</button><span>Página {page + 1} de {totalPages}</span><button type="button" disabled={page + 1 >= totalPages} onClick={() => setPage(current => current + 1)}>Próxima</button></nav>}
  </main></div></AuthenticatedShell>
}

function MeetingRow({ item, account }: { item: CallHistoryItem; account: Account }) {
  return <a className="meeting-row" href={`${routes.meetings}/${item.sessionId}`}><span className="meeting-row-mark"><Icon name="transcript" size={19} /></span><span className="meeting-row-copy"><strong>{item.title}</strong><small>{formatDateTime(item.startedAt)} · {formatDuration(item.durationSeconds)}</small>{item.ownerId !== account.id && <em>Realizada por {item.ownerName}</em>}</span><span aria-hidden="true">→</span></a>
}

function MeetingDetailPage({ sessionId }: { sessionId: string }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [meeting, setMeeting] = useState<CallHistoryDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  useEffect(() => { api.me().then(setAccount).catch(() => window.location.replace(routes.login)) }, [])
  useEffect(() => {
    if (!account) return
    api.callHistoryDetail(sessionId).then(detail => {
      const analysis = detail.analysis ?? { status: 'ABSENT' as const, analysis: null }
      setMeeting({ ...detail, analysis })
      if (analysis.status === 'ABSENT') generateAnalysis()
    }).catch(() => setError('Esta reunião não está disponível.'))
  }, [account, sessionId])
  function generateAnalysis() {
    setAnalysisError(null)
    setMeeting(current => current ? { ...current, analysis: { status: 'GENERATING', analysis: null } } : current)
    api.generateExecutiveAnalysis(sessionId).then(analysis => setMeeting(current => current ? { ...current, analysis } : current)).catch(() => {
      setAnalysisError('Não foi possível gerar a análise. Tente novamente.')
      setMeeting(current => current ? { ...current, analysis: { status: 'FAILED', analysis: null } } : current)
    })
  }
  if (!account) return <div className="loading-page" role="status">Carregando reunião…</div>
  return <AuthenticatedShell account={account} onAccountChange={setAccount}><div className="history-page"><HistoryHeader account={account} /><main className="history-main detail-main"><a className="back-link" href={routes.meetings}>← Todas as reuniões</a><ErrorNotice message={error} />
    {!meeting && !error && <p className="history-state" role="status">Carregando transcrição…</p>}
    {meeting && <><span className="eyebrow">REUNIÃO ENCERRADA</span><h1>{meeting.title}</h1><div className="meeting-meta"><span>{formatDateTime(meeting.startedAt)}</span><span>{formatDuration(meeting.durationSeconds)}</span>{meeting.ownerId !== account.id && <span>Realizada por {meeting.ownerName}</span>}</div><MeetingAnalysisPanel meeting={{ title: meeting.title, date: formatDateTime(meeting.startedAt), duration: formatDuration(meeting.durationSeconds) }} state={meeting.analysis} error={analysisError} onRetry={generateAnalysis} /><section className="history-transcript" aria-labelledby="history-transcript-title"><header><span className="panel-kicker"><Icon name="transcript" size={17} />Transcrição</span><h2 id="history-transcript-title">A conversa registrada</h2></header>{meeting.segments.length === 0 ? <p className="history-state">Esta reunião foi encerrada sem transcrição final.</p> : meeting.segments.map(segment => <article className={`history-segment ${segment.speaker === 'USER' ? 'from-user' : 'from-client'}`} key={segment.sequenceNumber}><small>{segment.speaker === 'USER' ? meeting.ownerName : 'Cliente'} · {formatDateTime(segment.finalizedAt)}</small><p>{segment.text}</p></article>)}</section></>}
  </main></div></AuthenticatedShell>
}

function MeetingAnalysisPanel({ meeting, state, error, onRetry }: { meeting: SummaryMetadata; state: MeetingAnalysisState; error: string | null; onRetry: () => void }) {
  if (state.status === 'ABSENT' || state.status === 'GENERATING') return <section className="meeting-analysis" aria-label="Análise gerada por IA"><span className="panel-kicker">ANÁLISE GERADA POR IA</span><p role="status">Gerando análise…</p></section>
  if (state.status === 'FAILED' || !state.analysis) return <section className="meeting-analysis" aria-label="Análise gerada por IA"><span className="panel-kicker">ANÁLISE GERADA POR IA</span><p role="alert">{error ?? 'Não foi possível gerar a análise. Tente novamente.'}</p><button className="meeting-analysis-retry" type="button" onClick={onRetry}>Tentar novamente</button></section>
  const analysis = state.analysis!
  const temperature = { POSITIVA: 'Positiva', NEUTRA: 'Neutra', TENSA: 'Tensa' }[analysis.temperature]
  return <section className="meeting-analysis" aria-label="Análise gerada por IA"><span className="panel-kicker">ANÁLISE GERADA POR IA</span><div className="meeting-analysis-heading"><h2>Resumo executivo</h2><ExecutiveSummaryExportButton meeting={meeting} analysis={analysis} /></div><p>{analysis.overview}</p><AnalysisList title="Decisões e acordos" items={analysis.decisions} /><AnalysisList title="Pendências e próximos passos" items={analysis.nextSteps} /><AnalysisList title="Riscos e objeções" items={analysis.risks} /><AnalysisList title="Pontos-chave" items={analysis.keyPoints} /><h3>Nomes Identificados</h3>{analysis.participants.length ? <ul>{analysis.participants.map(name => <li key={name}>{name}</li>)}</ul> : <p>Nenhum nome identificado na transcrição</p>}<h3>Temperatura: {temperature}</h3><p>{analysis.temperatureReason}</p></section>
}

function AnalysisList({ title, items }: { title: string; items: string[] }) { return <><h3>{title}</h3>{items.length ? <ul>{items.map(item => <li key={item}>{item}</li>)}</ul> : <p>Não identificado na transcrição.</p>}</> }

export function App() {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path === routes.terms) return <TermsPage />
  if (path === routes.register) return <RegisterPage />
  if (path === routes.login) return <LoginPage />
  if (path === routes.knowledgeBases) return <KnowledgeBasesRoute />
  if (path === routes.costs) return <CostsRoute />
  if (path === routes.meetings) return <MeetingHistoryPage />
  const meetingDetail = path.match(/^\/app\/reunioes\/([^/]+)$/)
  if (meetingDetail) return <MeetingDetailPage sessionId={meetingDetail[1]} />
  return <HomePage />
}
