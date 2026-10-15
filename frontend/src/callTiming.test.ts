import { describe, it, expect, vi } from 'vitest'
import { hasUsefulSpeech, recordCallTiming, getCallTimings } from './callTiming'

describe('gatilhos e medidas locais', () => {
  it('inclui comentários e convites sem transformar todo texto em pergunta', () => {
    expect(hasUsefulSpeech('Conte sobre sua experiência anterior.')).toBe(true)
    expect(hasUsefulSpeech('Nossa equipe está crescendo e precisa de autonomia.')).toBe(true)
    expect(hasUsefulSpeech('Obrigado.')).toBe(false)
    expect(hasUsefulSpeech('Sim.')).toBe(false)
    expect(hasUsefulSpeech('Qual prazo?')).toBe(true)
  })
  it('limita medidas e mantém somente duração, etapa e resultado', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1000)
    for (let i = 0; i < 250; i++) recordCallTiming('transcription', 500)
    expect(getCallTimings()).toHaveLength(200)
    expect(getCallTimings()[0]).toEqual({ stage: 'transcription', durationMs: 500, outcome: 'completed' })
    expect(performance.getEntriesByName('orientador.transcription', 'measure').length).toBeLessThanOrEqual(50)
    vi.restoreAllMocks()
  })
})
