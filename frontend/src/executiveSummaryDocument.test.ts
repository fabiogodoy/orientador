import { describe, expect, it } from 'vitest'
import { createSummaryDocument, summaryFilename } from './executiveSummaryDocument'
import type { MeetingAnalysis } from './api'

const analysis: MeetingAnalysis = {
  overview: 'Reunião sobre expansão, preço e objeções.', decisions: ['Aprovar proposta'],
  nextSteps: ['Retorno terça-feira'], risks: [], keyPoints: ['Integração'], participants: ['João', 'Érica'],
  temperature: 'POSITIVA', temperatureReason: 'Tom colaborativo.',
}
const meeting = { title: 'Reunião São Paulo', date: '14 de out. de 2026, 10:00', duration: '42:00' }

describe('documento executivo', () => {
  it('preserva conteúdo e acentos e usa mensagens para seções vazias', () => {
    const doc = createSummaryDocument(meeting, analysis, 'data:image/png;base64,logo')
    const content = JSON.stringify(doc.content)
    for (const text of [meeting.title, meeting.date, meeting.duration, analysis.overview, ...analysis.participants, 'Nomes Identificados', 'Não identificado na transcrição.', 'Temperatura: Positiva']) {
      expect(content).toContain(text)
    }
    expect(doc.images).toEqual({ orientador: 'data:image/png;base64,logo' })
    expect(content).not.toContain('Participantes')
  })

  it('mantém texto não confiável como texto literal e nomes ausentes sem inferência', () => {
    const overview = '<img src="https://example.invalid/segredo"> [clique](javascript:alert(1))'
    const doc = createSummaryDocument(meeting, { ...analysis, overview, participants: [] }, 'logo')
    expect(doc.content).toContainEqual({ text: overview })
    expect(JSON.stringify(doc.content)).toContain('Nenhum nome identificado na transcrição')
    expect(JSON.stringify(doc.content)).not.toContain('"link":')
  })

  it('gera nomes de arquivo seguros, curtos e com fallback', () => {
    expect(summaryFilename('../../Reunião: São Paulo?')).toBe('resumo-executivo-reuniao-sao-paulo.pdf')
    expect(summaryFilename('/// 🗣')).toBe('resumo-executivo-reuniao.pdf')
    expect(summaryFilename('a'.repeat(500))).toHaveLength('resumo-executivo-'.length + 80 + 4)
  })
})
