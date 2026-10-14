import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ExecutiveSummaryExportButton } from './ExecutiveSummaryExportButton'
import { exportExecutiveSummary } from './exportExecutiveSummary'
import type { MeetingAnalysis } from './api'

vi.mock('./exportExecutiveSummary', () => ({ exportExecutiveSummary: vi.fn() }))
const meeting = { title: 'Planejamento', date: '14/10/2026', duration: '42:00' }
const analysis: MeetingAnalysis = { overview: 'Resumo privado', decisions: [], nextSteps: [], risks: [], keyPoints: [], participants: [], temperature: 'NEUTRA', temperatureReason: 'Tom objetivo.' }

afterEach(() => { cleanup(); vi.resetAllMocks(); vi.restoreAllMocks() })

describe('exportação do resumo', () => {
  it('impede download duplicado enquanto exporta e informa conclusão', async () => {
    let finish!: () => void
    vi.mocked(exportExecutiveSummary).mockReturnValue(new Promise<void>(resolve => { finish = resolve }))
    render(<ExecutiveSummaryExportButton meeting={meeting} analysis={analysis} />)
    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    expect(screen.getByRole('button', { name: 'Exportando…' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Exportando…' }))
    await waitFor(() => expect(exportExecutiveSummary).toHaveBeenCalledExactlyOnceWith(meeting, analysis))
    await act(async () => finish())
    expect(screen.getByRole('button', { name: 'Exportar PDF' })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('O download foi iniciado')
  })

  it('exibe erro recuperável sem registrar conteúdo sensível e permite retry', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(exportExecutiveSummary).mockRejectedValueOnce(new Error('Resumo privado')).mockResolvedValueOnce(undefined)
    render(<ExecutiveSummaryExportButton meeting={meeting} analysis={analysis} />)
    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível exportar o PDF. Tente novamente.')
    expect(log.mock.calls.flat().join(' ')).not.toContain('Resumo privado')
    fireEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('O download foi iniciado'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(exportExecutiveSummary).toHaveBeenCalledTimes(2)
  })
})
