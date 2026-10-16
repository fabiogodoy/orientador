import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { api, ApiError } from './api'
import { getCallTimings } from './callTiming'

vi.mock('./api', async importOriginal => {
  const original = await importOriginal<typeof import('./api')>()
  return { ...original, api: { ...original.api, me: vi.fn(), startCall: vi.fn(), endCall: vi.fn(), knowledgeBaseOptions: vi.fn(), transcribeAudio: vi.fn(), generateSuggestion: vi.fn(), updateCallTitle: vi.fn() } }
})

class Recorder {
  static instances: Recorder[] = []
  state: RecordingState = 'inactive'
  ondataavailable: ((event: BlobEvent) => void) | null = null
  onstop: (() => void) | null = null
  constructor() { Recorder.instances.push(this) }
  start() { this.state = 'recording' }
  emit() { this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) } as BlobEvent) }
  stop() { if (this.state === 'inactive') return; this.state = 'inactive'; this.emit(); this.onstop?.() }
}
class Stream {
  getTracks() { return [{ stop: vi.fn(), addEventListener: vi.fn(), label: '' }] }
  getAudioTracks() { return this.getTracks() }
  getVideoTracks() { return [] }
}
const suggestionError = 'Não foi possível gerar a sugestão agora. Tente novamente em instantes.'
const suggestion = (through: number) => ({ tipo: 'Pergunta', trechoCliente: 'Qual é o prazo?', proximaFala: `Orientação ${through}`, pontosChave: ['Confirmar prazo'], contextSummary: `Resumo ${through}`, summarizedThrough: through })

beforeEach(() => {
  window.history.replaceState({}, '', '/app/')
  Recorder.instances = []
  vi.stubGlobal('MediaRecorder', Recorder); vi.stubGlobal('MediaStream', Stream)
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue(new Stream()), getDisplayMedia: vi.fn().mockResolvedValue(new Stream()) } })
  vi.mocked(api.me).mockResolvedValue({ id: 'u', name: 'Pessoa', email: 'test@example.com', role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-30T12:00:00Z', avatarUpdatedAt: null })
  vi.mocked(api.startCall).mockResolvedValue({ sessionId: 'call-1', title: 'Teste' })
  vi.mocked(api.endCall).mockResolvedValue(undefined)
  vi.mocked(api.knowledgeBaseOptions).mockResolvedValue([])
  vi.mocked(api.transcribeAudio).mockImplementation(async (_id, _source, sequenceNumber) => ({ sequenceNumber, speaker: 'CLIENT', text: 'Qual é o prazo?' }))
  vi.mocked(api.generateSuggestion).mockImplementation(async (_id, _summary, through) => suggestion(through + 1))
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.resetAllMocks(); vi.unstubAllGlobals() })

it('continua exibindo orientações com blocos de 8s e inferências de 9s', async () => {
  await start('tab', true)
  let attempts = 0
  let active = 0
  let maxActive = 0
  vi.mocked(api.generateSuggestion).mockImplementation(() => {
    const number = ++attempts
    active++
    maxActive = Math.max(maxActive, active)
    return new Promise(resolve => window.setTimeout(() => { active--; resolve(suggestion(number)) }, 9000))
  })
  await act(async () => { await vi.advanceTimersByTimeAsync(17300) })
  expect(screen.getByText('Orientação 1')).toBeVisible()
  await act(async () => { await vi.advanceTimersByTimeAsync(72700) })
  const beforeFinalWindow = screen.getAllByText(/^Orientação \d+$/).length
  await act(async () => { await vi.advanceTimersByTimeAsync(30000) })
  // Some coalesced requests can expire at 12s, but continuous speech must make progress.
  expect(screen.getAllByText(/^Orientação \d+$/).length).toBeGreaterThanOrEqual(5)
  expect(screen.getAllByText(/^Orientação \d+$/).length).toBeGreaterThan(beforeFinalWindow)
  expect(maxActive).toBe(1)
  expect(vi.mocked(api.generateSuggestion).mock.calls[1][1]).toBe('Resumo 1')
  expect(getCallTimings().some(timing => timing.stage === 'suggestion' && timing.outcome === 'completed' && timing.reason === 'speak')).toBe(true)
})

it.each(['empty', 'failed'])('microfone sem detector com resultado %s não cancela sugestão remota', async result => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' })))
  if (result === 'failed') vi.mocked(api.transcribeAudio).mockRejectedValueOnce(new ApiError('TRANSCRIPTION_UNAVAILABLE', 'Sem fala reconhecida'))
  else vi.mocked(api.transcribeAudio).mockResolvedValueOnce({ sequenceNumber: 2, speaker: 'USER', text: '   ' })
  await act(async () => Recorder.instances[1].emit())
  await act(async () => resolve(suggestion(1)))
  expect(screen.getByText('Orientação 1')).toBeVisible()
})

async function start(source: 'tab' | 'microphone' = 'tab', simulatedClock = false) {
  render(<App />)
  await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
  if (simulatedClock) vi.useFakeTimers()
  fireEvent.click(screen.getByRole('button', { name: source === 'tab' ? 'Escutar áudio da aba' : 'Escutar microfone' }))
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' })) })
  if (simulatedClock) expect(Recorder.instances).toHaveLength(1)
  else await waitFor(() => expect(Recorder.instances).toHaveLength(1))
}

it('mantém sugestões em 130 blocos simulados e preserva contexto durante erro', async () => {
  await start('tab', true)
  let attempts = 0
  vi.mocked(api.generateSuggestion).mockImplementation(async () => {
    attempts++
    if (attempts === 90) throw new ApiError('SUGGESTION_UNAVAILABLE', suggestionError)
    return suggestion(attempts)
  })
  for (let block = 1; block <= 130; block++) await act(async () => { await vi.advanceTimersByTimeAsync(8000) })
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(api.generateSuggestion).toHaveBeenCalledTimes(130)
  expect(vi.mocked(api.generateSuggestion).mock.calls[90]).toEqual(['call-1', 'Resumo 89', 89])
  expect(screen.getByText('Orientação 130')).toBeInTheDocument()
  expect(screen.queryByText(suggestionError)).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Encerrar call' })).toBeInTheDocument()
}, 15000)

describe('recuperação de erros', () => {
  it('limpa erro somente quando a mesma fonte se recupera', async () => {
    await start('microphone')
    vi.mocked(api.transcribeAudio).mockRejectedValueOnce(new ApiError('TRANSCRIPTION_UNAVAILABLE', 'Falha temporária'))
    await act(async () => Recorder.instances[0].emit())
    expect(screen.getByRole('alert')).toHaveTextContent('Microfone: Falha temporária')
    fireEvent.click(screen.getByRole('button', { name: 'Escutar áudio da aba' }))
    await waitFor(() => expect(Recorder.instances).toHaveLength(2))
    await act(async () => Recorder.instances[1].emit())
    expect(screen.getByRole('alert')).toHaveTextContent('Microfone: Falha temporária')
    await act(async () => Recorder.instances[0].emit())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('encerra limpando erro de sugestão e ignora falha tardia de transcrição', async () => {
    await start()
    vi.useFakeTimers()
    vi.mocked(api.generateSuggestion).mockRejectedValue(new ApiError('SUGGESTION_UNAVAILABLE', suggestionError))
    await act(async () => Recorder.instances[0].emit())
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    let reject!: (error: Error) => void
    vi.mocked(api.transcribeAudio).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' })) })
    await act(async () => { reject(new ApiError('TRANSCRIPTION_UNAVAILABLE', 'Falha tardia')) })
    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(screen.queryByText(suggestionError)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(api.endCall).toHaveBeenCalledWith('call-1')
  })

  it('não limpa erro de finalização do histórico', async () => {
    await start('microphone')
    vi.mocked(api.endCall).mockRejectedValue(new Error('network'))
    fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('não foi possível finalizar o histórico')
  })
})

it('gera após 300 ms, coalesce o último segmento e não sobrepõe chamadas', async () => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(299) })
  expect(api.generateSuggestion).not.toHaveBeenCalled()
  await act(async () => { await vi.advanceTimersByTimeAsync(1) })
  expect(api.generateSuggestion).toHaveBeenCalledTimes(1)
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); Recorder.instances[0].emit() })
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  expect(api.generateSuggestion).toHaveBeenCalledTimes(1)
  await act(async () => resolve(suggestion(1)))
  expect(screen.getByText('Orientação 1')).toBeInTheDocument()
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(api.generateSuggestion).toHaveBeenCalledTimes(2)
  expect(vi.mocked(api.generateSuggestion).mock.calls[1]).toEqual(['call-1', 'Resumo 1', 1])
})

it('invalida orientação pendente quando o usuário começa a responder', async () => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' })) })
  await act(async () => Recorder.instances[1].emit())
  await act(async () => resolve(suggestion(1)))
  expect(screen.queryByText('Orientação 1')).not.toBeInTheDocument()
  expect(screen.getByText('Aguardando uma nova fala do interlocutor.')).toBeVisible()
  expect(screen.queryByText('Continue ouvindo. Não é necessário intervir agora.')).not.toBeInTheDocument()
})

it('permite manual após confirmação curta e representa Ouvir sem fala para copiar', async () => {
  await start('tab', true)
  vi.mocked(api.transcribeAudio).mockResolvedValueOnce({ sequenceNumber: 1, speaker: 'CLIENT', text: 'Obrigado.' })
  vi.mocked(api.generateSuggestion).mockResolvedValueOnce({ ...suggestion(1), acao: 'OUVIR', tipo: 'Ouvir', proximaFala: '', pontosChave: [] })
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(api.generateSuggestion).not.toHaveBeenCalled()
  const button = screen.getByRole('button', { name: 'Sugerir agora' })
  expect(button).toBeEnabled()
  await act(async () => fireEvent.click(button))
  expect(screen.getByText('Continue ouvindo. Não é necessário intervir agora.')).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Copiar resposta' })).not.toBeInTheDocument()
  expect(getCallTimings().filter(timing => timing.stage === 'suggestion').at(-1)).toMatchObject({ outcome: 'completed', reason: 'listen' })
})

it('ordena transcrições e não avança resumo sobre upload pendente', async () => {
  await start('tab', true)
  let resolveFirst!: (value: { sequenceNumber: number; speaker: 'CLIENT'; text: string }) => void
  vi.mocked(api.transcribeAudio).mockImplementationOnce(() => new Promise(done => { resolveFirst = done }))
  vi.mocked(api.transcribeAudio).mockResolvedValueOnce({ sequenceNumber: 2, speaker: 'CLIENT', text: 'Conte sobre a sua experiência profissional.' })
  vi.mocked(api.generateSuggestion).mockResolvedValue(suggestion(2))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  await act(async () => resolveFirst({ sequenceNumber: 1, speaker: 'CLIENT', text: 'Primeira fala.' }))
  const messages = screen.getAllByText(/Primeira fala\.|Conte sobre a sua experiência profissional\./)
  expect(messages.map(element => element.textContent)).toEqual(['Primeira fala.', 'Conte sobre a sua experiência profissional.'])
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Sugerir agora' })))
  expect(vi.mocked(api.generateSuggestion).mock.calls[1]).toEqual(['call-1', 'Resumo 2', 0])
})

it('descarta orientação que ultrapassou a janela útil', async () => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  // Keep subsequent recorder blocks from triggering another request.
  vi.mocked(api.transcribeAudio).mockImplementation(() => new Promise(() => undefined))
  await act(async () => { await vi.advanceTimersByTimeAsync(12000); resolve(suggestion(1)) })
  expect(screen.queryByText('Orientação 1')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Sugerir agora' })).toBeEnabled()
  expect(getCallTimings().filter(timing => timing.stage === 'suggestion').at(-1)).toMatchObject({ outcome: 'discarded', reason: 'expired' })
})

it('fecha em pausa após 5 s, ignora pausas curtas e não envia silêncio', async () => {
  let audible = true
  vi.stubGlobal('AudioContext', class {
    createAnalyser() { return { fftSize: 1024, getByteTimeDomainData: (data: Uint8Array) => data.fill(audible ? 140 : 128) } }
    createMediaStreamSource() { return { connect: vi.fn() } }
    resume() { return Promise.resolve() }
    close() { return Promise.resolve() }
  })
  await start('tab', true)
  await act(async () => { await vi.advanceTimersByTimeAsync(4000) })
  audible = false
  await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  expect(api.transcribeAudio).not.toHaveBeenCalled()
  audible = true
  await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  audible = false
  await act(async () => { await vi.advanceTimersByTimeAsync(750) })
  expect(api.transcribeAudio).toHaveBeenCalledTimes(1)
  expect(Recorder.instances).toHaveLength(2)
  await act(async () => { await vi.advanceTimersByTimeAsync(8000) })
  expect(api.transcribeAudio).toHaveBeenCalledTimes(1)
})

it('invalida na detecção do microfone antes de fechar ou transcrever seu bloco', async () => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  vi.stubGlobal('AudioContext', class {
    createAnalyser() { return { fftSize: 1024, getByteTimeDomainData: (data: Uint8Array) => data.fill(140) } }
    createMediaStreamSource() { return { connect: vi.fn() } }
    resume() { return Promise.resolve() }
    close() { return Promise.resolve() }
  })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' })))
  await act(async () => resolve(suggestion(1)))
  expect(api.transcribeAudio).toHaveBeenCalledTimes(1)
  expect(screen.queryByText('Orientação 1')).not.toBeInTheDocument()
})

it('não sugere fala remota antiga fechada depois de o usuário já responder', async () => {
  const levels = [140, 128]
  let nextAnalyser = 0
  vi.stubGlobal('AudioContext', class {
    createAnalyser() {
      const index = nextAnalyser++
      return { fftSize: 1024, getByteTimeDomainData: (data: Uint8Array) => data.fill(levels[index]) }
    }
    createMediaStreamSource() { return { connect: vi.fn() } }
    resume() { return Promise.resolve() }
    close() { return Promise.resolve() }
  })
  await start('tab', true)
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Escutar microfone' })))
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  levels[0] = 128
  levels[1] = 140
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  levels[1] = 128
  await act(async () => { await vi.advanceTimersByTimeAsync(3300) })
  expect(api.transcribeAudio).toHaveBeenCalledTimes(2)
  expect(api.generateSuggestion).not.toHaveBeenCalled()
})


it('ignora retorno da reunião anterior depois de iniciar outra', async () => {
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => Recorder.instances[0].emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Encerrar call' })))
  vi.mocked(api.startCall).mockResolvedValueOnce({ sessionId: 'call-2', title: 'Segunda reunião' })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Escutar áudio da aba' })))
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' })))
  await act(async () => resolve(suggestion(1)))
  expect(screen.queryByText('Orientação 1')).not.toBeInTheDocument()
  await act(async () => Recorder.instances.at(-1)!.emit())
  await act(async () => { await vi.advanceTimersByTimeAsync(300) })
  expect(vi.mocked(api.generateSuggestion).mock.calls.at(-1)).toEqual(['call-2', '', 0])
  expect(screen.getByText('Orientação 1')).toBeVisible()
})

it('retomar voz remota durante a inferência não descarta orientação recente', async () => {
  let audible = true
  vi.stubGlobal('AudioContext', class {
    createAnalyser() { return { fftSize: 1024, getByteTimeDomainData: (data: Uint8Array) => data.fill(audible ? 140 : 128) } }
    createMediaStreamSource() { return { connect: vi.fn() } }
    resume() { return Promise.resolve() }
    close() { return Promise.resolve() }
  })
  await start('tab', true)
  let resolve!: (value: ReturnType<typeof suggestion>) => void
  vi.mocked(api.generateSuggestion).mockImplementationOnce(() => new Promise(done => { resolve = done }))
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  audible = false
  await act(async () => { await vi.advanceTimersByTimeAsync(4300) })
  expect(api.generateSuggestion).toHaveBeenCalledTimes(1)
  audible = true
  await act(async () => { await vi.advanceTimersByTimeAsync(500) })
  await act(async () => resolve(suggestion(1)))
  expect(screen.getByText('Orientação 1')).toBeVisible()
})
