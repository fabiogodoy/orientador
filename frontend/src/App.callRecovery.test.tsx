import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { api, ApiError } from './api'

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

async function start(source: 'tab' | 'microphone' = 'tab', simulatedClock = false) {
  render(<App />)
  await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })
  if (simulatedClock) vi.useFakeTimers()
  fireEvent.click(screen.getByRole('button', { name: source === 'tab' ? 'Escutar áudio da aba' : 'Escutar microfone' }))
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Ignorar e iniciar' })) })
  if (simulatedClock) expect(Recorder.instances).toHaveLength(1)
  else await waitFor(() => expect(Recorder.instances).toHaveLength(1))
}

it('mantém sugestões por mais de 32 minutos simulados e preserva contexto durante erro', async () => {
  await start('tab', true)
  let attempts = 0
  vi.mocked(api.generateSuggestion).mockImplementation(async () => {
    attempts++
    if (attempts === 90) throw new ApiError('SUGGESTION_UNAVAILABLE', suggestionError)
    return suggestion(attempts)
  })
  for (let block = 1; block <= 130; block++) await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
  await act(async () => { await vi.advanceTimersByTimeAsync(1800) })
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
    await act(async () => { await vi.advanceTimersByTimeAsync(1800) })
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
