import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

class TestMediaRecorder {
  static instances: TestMediaRecorder[] = []
  state: RecordingState = 'inactive'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null

  constructor(_stream: MediaStream, _options?: MediaRecorderOptions) { TestMediaRecorder.instances.push(this) }
  start() { this.state = 'recording' }
  stop() {
    if (this.state === 'inactive') return
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) } as BlobEvent)
    this.onstop?.()
  }
}

class TestMediaStream {
  constructor(private readonly tracks: MediaStreamTrack[] = []) {}
  getTracks() { return this.tracks }
  getAudioTracks() { return this.tracks }
}

beforeEach(() => {
  window.history.replaceState({}, '', '/app/cadastro')
  TestMediaRecorder.instances = []
  vi.stubGlobal('MediaRecorder', TestMediaRecorder)
  vi.stubGlobal('MediaStream', TestMediaStream)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('cadastro', () => {
  it('mostra as duas opções e exige aceite dos Termos', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Crie sua conta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Para mim/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('checkbox')).not.toBeChecked()
    expect(screen.getAllByRole('link', { name: 'Termos de Uso' })[0]).toHaveAttribute('href', '/app/termos')
    expect(screen.getByText(/bloqueado após sete dias/)).toBeInTheDocument()
  })

  it('exibe campo da organização apenas para gestor inicial', () => {
    render(<App />)
    expect(screen.queryByLabelText('Nome da organização')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Organização/ }))
    expect(screen.getByLabelText('Nome da organização')).toBeRequired()
  })

  it('não envia senhas divergentes', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    render(<App />)
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Pessoa Teste' } })
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'pessoa@example.com' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-segura-123' } })
    fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: 'outra-senha-123' } })
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Criar conta grátis/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem.')
    expect(fetch).not.toHaveBeenCalled()
  })
})

it('disponibiliza os Termos completos sem login', () => {
  window.history.replaceState({}, '', '/app/termos')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Termos de Uso do Orientador' })).toBeInTheDocument()
  expect(screen.getByText(/sete dias \(168 horas\)/)).toBeInTheDocument()
  expect(screen.getByText(/19\.655\.073\/0001-40/)).toBeInTheDocument()
})

it('exibe login e contato para senha esquecida', () => {
  window.history.replaceState({}, '', '/app/login')
  render(<App />)
  expect(screen.getByRole('heading', { name: 'Entre no seu espaço' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'contato@connectas.com.br' })).toHaveAttribute('href', 'mailto:contato@connectas.com.br')
})

describe('tela principal de call', () => {
  const account = {
    id: 'user-1', name: 'Vanessa Oliveira', email: 'vanessa@example.com', role: 'INDIVIDUAL' as const,
    accountType: 'INDIVIDUAL' as const, organizationName: null, trialEndsAt: '2026-10-18T12:00:00Z', avatarUpdatedAt: null,
  }

  beforeEach(() => {
    window.history.replaceState({}, '', '/app/')
  })

  it('exibe a transcrição vazia, orientação e controles de captura sem iniciar a mídia', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próxima melhor resposta' })).toBeInTheDocument()
    expect(screen.getByText('Inicie o microfone ou compartilhe o áudio da aba. As falas transcritas aparecerão aqui.')).toBeInTheDocument()
    expect(screen.queryByText('A gente está crescendo rápido e eu sinto que cada vendedor conduz as calls de um jeito.')).not.toBeInTheDocument()
    expect(screen.getByText(/Microfone e áudio compartilhado são transcritos de forma independente/)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Escutar microfone' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Escutar áudio da aba' })).toHaveAttribute('aria-pressed', 'false')

    expect(screen.getByRole('button', { name: 'Iniciar call' })).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('avisa imediatamente quando a seleção não fornece áudio da aba', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 }))
    const stop = vi.fn()
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getDisplayMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }], getAudioTracks: () => [] }) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: class {} })
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar áudio da aba' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nenhum áudio foi compartilhado'))
    expect(stop).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('preserva a mensagem segura da API e encerra o stream quando a call não inicia', async () => {
    const stop = vi.fn()
    const stream = { getTracks: () => [{ stop }], getAudioTracks: () => [{ id: 'audio-1' }] }
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: class {} })
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(account), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'REALTIME_UNAVAILABLE', message: 'A transcrição em tempo real não está disponível agora.' }), { status: 503 }))
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('A transcrição em tempo real não está disponível agora.'))
    expect(stop).toHaveBeenCalled()
  })

  it.skip('mantém o trecho parcial e a reunião ativos ao pausar uma fonte', async () => {
    const stop = vi.fn()
    const track = { addEventListener: vi.fn(), stop }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    const channel: { onmessage: ((event: MessageEvent) => void) | null; onopen: (() => void) | null; readyState: string; send: ReturnType<typeof vi.fn> } = { onmessage: null, onopen: null, readyState: 'connecting', send: vi.fn() }
    class TestPeerConnection {
      addTrack = vi.fn()
      close = vi.fn()
      createDataChannel = vi.fn(() => channel)
      createOffer = vi.fn().mockResolvedValue({ sdp: 'offer' })
      setLocalDescription = vi.fn().mockResolvedValue(undefined)
      setRemoteDescription = vi.fn().mockResolvedValue(undefined)
    }
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: TestPeerConnection })
    const fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', clientSecret: 'secret', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('api.openai.com')) return Promise.resolve(new Response('answer', { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(channel.onmessage).not.toBeNull())
    channel.onmessage?.({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.delta', delta: 'Trecho que estava sendo falado' }) } as MessageEvent)
    expect(await screen.findByText('Trecho que estava sendo falado')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Parar de escutar microfone' }))
    await waitFor(() => expect(screen.getByText('Trecho que estava sendo falado')).toBeInTheDocument())
    expect(screen.getByText('Call em pausa')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Encerrar call' })).toBeInTheDocument()
    expect(fetch.mock.calls.some(([input]) => String(input).includes('/segments'))).toBe(true)
    expect(fetch.mock.calls.filter(([input]) => String(input).endsWith('/api/calls'))).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' }))
    await screen.findByRole('button', { name: 'Iniciar call' })
    const requestPaths = fetch.mock.calls.map(([input]) => String(input))
    expect(requestPaths.findIndex(path => path.includes('/segments'))).toBeLessThan(requestPaths.findIndex(path => path.endsWith('/end')))
  })

  it('permite ajustar manualmente o título sugerido da reunião', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 })))
    render(<App />)

    await screen.findByRole('button', { name: 'Editar título da reunião' })
    fireEvent.click(screen.getByRole('button', { name: 'Editar título da reunião' }))
    fireEvent.change(screen.getByLabelText('Título da reunião'), { target: { value: 'Discovery · Grupo Aurora' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(await screen.findByText('Discovery · Grupo Aurora')).toBeInTheDocument()
  })

  it('aguarda uma fala do cliente em vez de mostrar sugestões demonstrativas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 })))
    render(<App />)

    await screen.findByRole('heading', { name: 'Próxima melhor resposta' })
    expect(screen.getByText('Aguardando a primeira fala do cliente para orientar sua próxima resposta.')).toBeInTheDocument()
    expect(screen.queryByText(/Antes de comparar apenas o valor/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sugerir agora' })).toBeDisabled()
  })

  it.skip('mostra uma falha segura quando a transcrição rejeita uma fala', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    const channel: { onmessage: ((event: MessageEvent) => void) | null; onopen: (() => void) | null; readyState: string; send: ReturnType<typeof vi.fn> } = { onmessage: null, onopen: null, readyState: 'connecting', send: vi.fn() }
    class TestPeerConnection {
      addTrack = vi.fn()
      close = vi.fn()
      createDataChannel = vi.fn(() => channel)
      createOffer = vi.fn().mockResolvedValue({ sdp: 'offer' })
      setLocalDescription = vi.fn().mockResolvedValue(undefined)
      setRemoteDescription = vi.fn().mockResolvedValue(undefined)
    }
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: TestPeerConnection })
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', clientSecret: 'secret', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('api.openai.com')) return Promise.resolve(new Response('answer', { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    }))
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(channel.onmessage).not.toBeNull())
    channel.onmessage?.({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.failed' }) } as MessageEvent)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível transcrever esta fala')
    expect(channel.send).not.toHaveBeenCalled()
  })

  it.skip('confirma o turno depois de uma fala seguida de silêncio', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    const channel: { onmessage: ((event: MessageEvent) => void) | null; onopen: (() => void) | null; readyState: string; send: ReturnType<typeof vi.fn> } = { onmessage: null, onopen: null, readyState: 'open', send: vi.fn() }
    let sample = 160
    const analyser = { fftSize: 0, getByteTimeDomainData: vi.fn((samples: Uint8Array) => samples.fill(sample)), disconnect: vi.fn() }
    const audioSource = { connect: vi.fn(), disconnect: vi.fn() }
    const audioContext = { createAnalyser: () => analyser, createMediaStreamSource: () => audioSource, resume: vi.fn().mockResolvedValue(undefined), close: vi.fn().mockResolvedValue(undefined) }
    Object.defineProperty(window, 'AudioContext', { configurable: true, writable: true, value: class { constructor() { return audioContext } } })
    class TestPeerConnection {
      addTrack = vi.fn()
      close = vi.fn()
      createDataChannel = vi.fn(() => channel)
      createOffer = vi.fn().mockResolvedValue({ sdp: 'offer' })
      setLocalDescription = vi.fn().mockResolvedValue(undefined)
      setRemoteDescription = vi.fn().mockResolvedValue(undefined)
    }
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: TestPeerConnection })
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', clientSecret: 'secret', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('api.openai.com')) return Promise.resolve(new Response('answer', { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    }))
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(channel.onopen).not.toBeNull())
    channel.onopen?.()
    await waitFor(() => expect(audioContext.resume).toHaveBeenCalled())
    sample = 128

    await waitFor(() => expect(channel.send).toHaveBeenCalledWith(JSON.stringify({ type: 'input_audio_buffer.commit' })), { timeout: 1800 })
    fireEvent.click(screen.getByRole('button', { name: 'Parar de escutar microfone' }))
    await waitFor(() => expect(audioContext.close).toHaveBeenCalled())
  })

  it('oferece retorno ao fim sem mover quem está lendo a transcrição anterior', async () => {
    const scrollTo = vi.fn()
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: scrollTo })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 })))
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    const transcript = document.querySelector('.transcript-scroll') as HTMLDivElement
    Object.defineProperties(transcript, {
      scrollHeight: { configurable: true, value: 600 },
      clientHeight: { configurable: true, value: 200 },
      scrollTop: { configurable: true, writable: true, value: 80 },
    })
    fireEvent.scroll(transcript)

    const latest = screen.getByRole('button', { name: /Voltar ao mais recente/ })
    fireEvent.click(latest)
    expect(scrollTo).toHaveBeenCalledWith({ top: 600, behavior: 'smooth' })
  })

  it.skip('mantém sugestões anteriores da call e destaca a mais recente', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track], getVideoTracks: () => [] } as unknown as MediaStream
    const channel: { onmessage: ((event: MessageEvent) => void) | null; onopen: (() => void) | null; readyState: string; send: ReturnType<typeof vi.fn> } = { onmessage: null, onopen: null, readyState: 'connecting', send: vi.fn() }
    class TestPeerConnection {
      addTrack = vi.fn()
      close = vi.fn()
      createDataChannel = vi.fn(() => channel)
      createOffer = vi.fn().mockResolvedValue({ sdp: 'offer' })
      setLocalDescription = vi.fn().mockResolvedValue(undefined)
      setRemoteDescription = vi.fn().mockResolvedValue(undefined)
    }
    let suggestions = 0
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getDisplayMedia: vi.fn().mockResolvedValue(stream) } })
    Object.defineProperty(window, 'RTCPeerConnection', { configurable: true, writable: true, value: TestPeerConnection })
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', clientSecret: 'secret', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('/transcription-secret')) return Promise.resolve(new Response(JSON.stringify({ clientSecret: 'secret' }), { status: 200 }))
      if (url.includes('/suggestions')) {
        suggestions += 1
        return Promise.resolve(new Response(JSON.stringify({ tipo: `Sugestão ${suggestions}`, trechoCliente: `Dúvida ${suggestions}`, proximaFala: `Resposta ${suggestions}`, pontosChave: ['Ouvir'] }), { status: 200 }))
      }
      if (url.includes('api.openai.com')) return Promise.resolve(new Response('answer', { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    }))
    render(<App />)

    await screen.findByRole('heading', { name: 'Próxima melhor resposta' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar áudio da aba' }))
    await waitFor(() => expect(channel.onmessage).not.toBeNull())
    channel.onmessage?.({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'Dúvida um' }) } as MessageEvent)
    expect(await screen.findByText('Resposta 1', {}, { timeout: 3000 })).toBeInTheDocument()
    channel.onmessage?.({ data: JSON.stringify({ type: 'conversation.item.input_audio_transcription.completed', transcript: 'Dúvida dois' }) } as MessageEvent)
    expect(await screen.findByText('Resposta 2', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText('Resposta 1')).toBeInTheDocument()
    expect(screen.getAllByText('O que vale manter na resposta')).toHaveLength(2)
  })

  it('fecha um WebM por intervalo, abre o próximo gravador e envia o último bloco antes de encerrar', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    const fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('/audio/microphone/')) return Promise.resolve(new Response(JSON.stringify({ sequenceNumber: 1, speaker: 'USER', text: 'Bloco válido.' }), { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(TestMediaRecorder.instances).toHaveLength(1))

    TestMediaRecorder.instances[0].stop()
    await waitFor(() => expect(fetch.mock.calls.some(([input]) => String(input).includes('/audio/microphone/1'))).toBe(true))
    expect(TestMediaRecorder.instances).toHaveLength(2)

    fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' }))
    await screen.findByRole('button', { name: 'Iniciar call' })
    const paths = fetch.mock.calls.map(([input]) => String(input))
    expect(paths.filter(path => path.includes('/audio/microphone/'))).toHaveLength(2)
    expect(paths.findIndex(path => path.includes('/audio/microphone/2'))).toBeLessThan(paths.findIndex(path => path.endsWith('/end')))
  })

  it('exibe a mensagem segura da API quando um bloco é rejeitado', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', title: 'Reunião sem título' }), { status: 200 }))
      if (url.includes('/audio/microphone/')) return Promise.resolve(new Response(JSON.stringify({ code: 'TRANSCRIPTION_UNAVAILABLE', message: 'A transcrição não está disponível agora.' }), { status: 503 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    }))
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(TestMediaRecorder.instances).toHaveLength(1))
    TestMediaRecorder.instances[0].stop()
    expect(await screen.findByRole('alert')).toHaveTextContent('A transcrição não está disponível agora.')
  })

  it('não envia bloco silencioso ao provedor de transcrição', async () => {
    const track = { addEventListener: vi.fn(), stop: vi.fn() }
    const stream = { getTracks: () => [track], getAudioTracks: () => [track] } as unknown as MediaStream
    const close = vi.fn().mockResolvedValue(undefined)
    const analyser = { fftSize: 0, getByteTimeDomainData: (samples: Uint8Array) => samples.fill(128) }
    vi.stubGlobal('AudioContext', class {
      createAnalyser() { return analyser }
      createMediaStreamSource() { return { connect: vi.fn() } }
      resume() { return Promise.resolve() }
      close() { return close() }
    })
    Object.defineProperty(window.navigator, 'mediaDevices', { configurable: true, writable: true, value: { getUserMedia: vi.fn().mockResolvedValue(stream) } })
    const fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.endsWith('/api/calls')) return Promise.resolve(new Response(JSON.stringify({ sessionId: 'call-1', title: 'Reunião sem título' }), { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' }))
    await waitFor(() => expect(TestMediaRecorder.instances).toHaveLength(1))
    TestMediaRecorder.instances[0].stop()

    expect(fetch.mock.calls.some(([input]) => String(input).includes('/audio/microphone/'))).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' }))
    await screen.findByRole('button', { name: 'Iniciar call' })
    expect(close).toHaveBeenCalled()
  })

  it('usa a identidade da conta e permite editar o nome pelo perfil', async () => {
    const renamed = { ...account, name: 'Vanessa Costa' }
    const fetch = vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      if (url.includes('/api/auth/csrf')) return Promise.resolve(new Response(JSON.stringify({ token: 'csrf-test' }), { status: 200 }))
      if (url.includes('/api/profile')) return Promise.resolve(new Response(JSON.stringify(renamed), { status: 200 }))
      return Promise.resolve(new Response(null, { status: 204 }))
    })
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
    expect(screen.getByText('Vanessa Oliveira')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir seu perfil' }))
    expect(screen.getByRole('dialog', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toHaveValue('vanessa@example.com')
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Vanessa Costa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))
    expect(await screen.findByText('Vanessa Costa')).toBeInTheDocument()
    expect(fetch.mock.calls.some(([input]) => String(input).includes('/api/profile'))).toBe(true)
  })
})

describe('histórico de reuniões', () => {
  const account = {
    id: 'user-1', name: 'Vanessa Oliveira', email: 'vanessa@example.com', role: 'ORGANIZATION_MANAGER' as const,
    accountType: 'ORGANIZATION' as const, organizationName: 'Orbit', trialEndsAt: '2026-10-18T12:00:00Z', avatarUpdatedAt: null,
  }

  it('lista reuniões encerradas, pagina e informa a responsável quando necessário', async () => {
    window.history.replaceState({}, '', '/app/reunioes')
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      return Promise.resolve(new Response(JSON.stringify({ page: 0, pageSize: 20, total: 21, items: [
        { sessionId: 'meeting-1', title: 'Discovery Orbit', startedAt: '2026-10-12T13:00:00Z', endedAt: '2026-10-12T13:42:00Z', durationSeconds: 2520, ownerId: 'user-1', ownerName: 'Vanessa Oliveira' },
        { sessionId: 'meeting-2', title: 'Revisão comercial', startedAt: '2026-10-11T13:00:00Z', endedAt: '2026-10-11T13:20:00Z', durationSeconds: 1200, ownerId: 'user-2', ownerName: 'Rafael Costa' },
      ] }), { status: 200 }))
    }))
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Reuniões realizadas' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /Discovery Orbit/ })).toHaveAttribute('href', '/app/reunioes/meeting-1')
    expect(screen.getByText('Realizada por Rafael Costa')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('mostra o detalhe somente leitura com a transcrição cronológica', async () => {
    window.history.replaceState({}, '', '/app/reunioes/meeting-1')
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/auth/me')) return Promise.resolve(new Response(JSON.stringify(account), { status: 200 }))
      return Promise.resolve(new Response(JSON.stringify({ sessionId: 'meeting-1', title: 'Discovery Orbit', startedAt: '2026-10-12T13:00:00Z', endedAt: '2026-10-12T13:42:00Z', durationSeconds: 2520, ownerId: 'user-2', ownerName: 'Rafael Costa', analysis: { status: 'COMPLETED', analysis: { overview: 'A conversa apresentou o processo.', decisions: ['Agendar retorno'], nextSteps: ['Enviar proposta'], risks: ['Prazo'], keyPoints: ['Necessidade clara'], participants: ['Rafael'], temperature: 'POSITIVA', temperatureReason: 'Tom colaborativo.' } }, segments: [
        { sequenceNumber: 1, speaker: 'USER', text: 'Olá, obrigado pelo tempo.', finalizedAt: '2026-10-12T13:01:00Z' },
        { sequenceNumber: 2, speaker: 'CLIENT', text: 'Quero entender o processo.', finalizedAt: '2026-10-12T13:02:00Z' },
      ] }), { status: 200 }))
    }))
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Discovery Orbit' })).toBeInTheDocument()
    expect(screen.getByText('Olá, obrigado pelo tempo.')).toBeInTheDocument()
    expect(screen.getByText('Quero entender o processo.')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Resumo executivo' })).toBeInTheDocument()
    expect(screen.getByText('Participantes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Escutar microfone' })).not.toBeInTheDocument()
    expect(screen.queryByText('Sugerir agora')).not.toBeInTheDocument()
  })
})
