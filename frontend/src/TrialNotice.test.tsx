import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TrialNotice } from './TrialNotice'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-15T12:00:00Z'))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it.each([
  ['2026-10-22T12:00:00Z', '7 dias grátis restantes'],
  ['2026-10-16T12:00:01Z', '2 dias grátis restantes'],
  ['2026-10-16T12:00:00Z', '1 dia grátis restante'],
  ['2026-10-15T12:00:01Z', '1 dia grátis restante'],
  ['2026-10-15T12:00:00Z', 'Período gratuito encerrado'],
  ['2026-10-14T12:00:00Z', 'Período gratuito encerrado'],
  ['invalid', 'Prazo indisponível'],
  ['', 'Prazo indisponível'],
])('apresenta o prazo %s como %s', (trialEndsAt, text) => {
  render(<TrialNotice trialEndsAt={trialEndsAt} />)
  expect(screen.getByText(text)).toBeInTheDocument()
  expect(screen.getByText('Sem cobrança automática.')).toBeInTheDocument()
  expect(screen.queryByText(/NaN|Invalid Date/)).not.toBeInTheDocument()
})

it('mostra vencimento no horário de Brasília', () => {
  render(<TrialNotice trialEndsAt="2026-10-22T01:30:00Z" />)
  expect(screen.getByText('21/10/2026, 22:30')).toHaveAttribute('dateTime', '2026-10-22T01:30:00Z')
})

it('atualiza sem recarregar a página e remove timer ao desmontar', () => {
  const { unmount } = render(<TrialNotice trialEndsAt="2026-10-16T12:00:30Z" />)
  expect(screen.getByText('2 dias grátis restantes')).toBeInTheDocument()
  act(() => vi.advanceTimersByTime(60_000))
  expect(screen.getByText('1 dia grátis restante')).toBeInTheDocument()
  act(() => {
    vi.setSystemTime(new Date('2026-10-16T12:00:30Z'))
    window.dispatchEvent(new Event('focus'))
  })
  expect(screen.getByText('Período gratuito encerrado')).toBeInTheDocument()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('atualiza ao retornar à aba e ao trocar a conta', () => {
  const { rerender } = render(<TrialNotice trialEndsAt="2026-10-16T12:00:00Z" />)
  act(() => {
    vi.setSystemTime(new Date('2026-10-16T12:00:00Z'))
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(screen.getByText('Período gratuito encerrado')).toBeInTheDocument()
  rerender(<TrialNotice trialEndsAt="2026-10-19T12:00:00Z" />)
  expect(screen.getByText('3 dias grátis restantes')).toBeInTheDocument()
})
