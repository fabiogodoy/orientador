export const AUDIO_CHUNK_MAX_MS = 8000
export const AUDIO_CHUNK_MIN_MS = 5000
export const AUDIO_PAUSE_MS = 750
export const SUGGESTION_DELAY_MS = 300
export const SUGGESTION_INTERVAL_MS = 5000
export const SUGGESTION_MAX_AGE_MS = 12000

type Stage = 'capture' | 'transcription' | 'suggestion' | 'guidance'
type TimingReason = 'session_changed' | 'local_speech' | 'expired' | 'speak' | 'listen'
type Timing = { stage: Stage; durationMs: number; outcome: 'completed' | 'discarded' | 'failed'; reason?: TimingReason }
const timings: Timing[] = []

// Diagnostic data stays in memory and contains no call identifiers or content.
export function recordCallTiming(stage: Stage, startedAt: number, outcome: Timing['outcome'] = 'completed', reason?: TimingReason) {
  const durationMs = Math.max(0, Date.now() - startedAt)
  timings.push({ stage, durationMs, outcome, ...(reason ? { reason } : {}) })
  const name = `orientador.${stage}`
  if (performance.getEntriesByName(name, 'measure').length >= 50) performance.clearMeasures(name)
  performance.measure(name, { start: Math.max(0, performance.now() - durationMs), duration: durationMs, detail: { outcome, ...(reason ? { reason } : {}) } })
  if (timings.length > 200) timings.shift()
}
export function getCallTimings(): readonly Timing[] { return timings.map(timing => ({ ...timing })) }

export function hasUsefulSpeech(text: string) {
  const value = text.trim().toLocaleLowerCase()
  return /[?？]|\b(como|quando|quanto|por que|porque|qual|quais|duvida|caro|orcamento|how|when|what|why|price|expensive|budget)\b/.test(value)
    || /(?:dúvida|não consigo|não temos|me conte|fale sobre|explique|tell me|describe|not sure)/.test(value)
    || value.split(/\s+/).filter(Boolean).length >= 5
}
