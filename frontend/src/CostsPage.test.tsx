import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CostsPage, costMoney } from './CostsPage'
import { api } from './api'
import type { CostReport } from './costTypes'
vi.mock('./api', () => ({ api: { costs: vi.fn() } }))
export const report: CostReport = {
  period: 'WEEK', from: '2026-10-09', to: '2026-10-15', timezone: 'America/Sao_Paulo', scope: 'PERSONAL',
  totals: { transcriptionUsd: .012, suggestionsUsd: .031, transcriptionCount: 12, suggestionCount: 4, unknownOperations: 0 },
  calls: { count: 1, durationSeconds: 600, legacyCount: 0 }, exchangeRate: { usdBrl: 5, date: '2026-10-14', source: 'BCB · PTAX venda', fallback: false },
  days: [{ date: '2026-10-15', transcriptionUsd: .012, suggestionsUsd: .031 }],
  recentCalls: [{ sessionId: 'one', title: 'Alinhamento', startedAt: '2026-10-15T14:00:00Z', status: 'ENDED', ownerName: 'Ana', durationSeconds: 600, partial: false, transcriptionUsd: .012, suggestionsUsd: .031 }], page: 0, pageSize: 20,
}
afterEach(cleanup)
beforeEach(() => { vi.resetAllMocks(); vi.mocked(api.costs).mockResolvedValue(report) })
describe('Custos', () => {
  it('shows categories, conversion, daily data and recent calls', async () => {
    render(<CostsPage />)
    await screen.findByText('Alinhamento')
    expect(screen.getByRole('button', { name: '7 dias' })).toHaveAttribute('aria-pressed', 'true')
    const cards = screen.getByRole('region', { name: 'Resumo de custos' })
    expect(within(cards).getByText('Total estimado')).toBeVisible()
    expect(within(cards).getByText('12 blocos enviados')).toBeVisible()
    expect(screen.getByText(/US\$ 1 =/)).toHaveTextContent('14/10/2026')
    fireEvent.click(screen.getByText('Ver valores por dia'))
    expect(screen.getByRole('columnheader', { name: 'Sugestões (US$)' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Alinhamento' })).toHaveAttribute('href', '/app/reunioes/one')
  })
  it('ignores old requests when changing periods and retries failures', async () => {
    let resolveOld!: (value: CostReport) => void
    vi.mocked(api.costs).mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve })).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(report)
    render(<CostsPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    await screen.findByRole('alert')
    await act(async () => resolveOld(report))
    expect(screen.queryByText('Alinhamento')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    await screen.findByText('Alinhamento')
    expect(api.costs).toHaveBeenLastCalledWith('TODAY', 0)
    fireEvent.click(screen.getByRole('button', { name: '30 dias' }))
    await waitFor(() => expect(api.costs).toHaveBeenLastCalledWith('MONTH', 0))
    fireEvent.click(screen.getByRole('button', { name: 'Tudo' }))
    await waitFor(() => expect(api.costs).toHaveBeenLastCalledWith('ALL', 0))
  })
  it('distinguishes unavailable costs and missing FX from zero', async () => {
    vi.mocked(api.costs).mockResolvedValue({ ...report, exchangeRate: null, calls: { ...report.calls, legacyCount: 1 }, recentCalls: [{ ...report.recentCalls[0], partial: true, transcriptionUsd: null, suggestionsUsd: null }] })
    render(<CostsPage embedded />)
    await screen.findByText('Custo não disponível')
    expect(screen.getByText('Estimativa parcial.')).toBeVisible()
    expect(screen.getAllByText('R$ indisponível')).toHaveLength(3)
    expect(screen.queryByRole('link', { name: 'Alinhamento' })).not.toBeInTheDocument()
    expect(screen.getByText(/Cotação indisponível/)).toBeVisible()
  })
  it('shows empty state and resets page on period selection', async () => {
    vi.mocked(api.costs).mockResolvedValue({ ...report, calls: { ...report.calls, count: 21 }, recentCalls: [] })
    render(<CostsPage />)
    await screen.findByText('Nenhuma call neste período.')
    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await waitFor(() => expect(api.costs).toHaveBeenLastCalledWith('WEEK', 1))
    fireEvent.click(screen.getByRole('button', { name: 'Hoje' }))
    await waitFor(() => expect(api.costs).toHaveBeenLastCalledWith('TODAY', 0))
  })
  it('does not round tiny positive costs down to zero', () => {
    expect(costMoney(.000111)).toContain('0,0001')
    expect(costMoney(.00000001)).toBe('< US$ 0,0001')
    expect(costMoney(0)).toContain('0,00')
  })
})
