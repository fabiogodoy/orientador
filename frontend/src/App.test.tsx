import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { App } from './App'

beforeEach(() => {
  window.history.replaceState({}, '', '/app/cadastro')
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
    accountType: 'INDIVIDUAL' as const, organizationName: null, trialEndsAt: '2026-10-18T12:00:00Z',
  }

  beforeEach(() => {
    window.history.replaceState({}, '', '/app/')
  })

  it('exibe a conversa, orientação e controles de captura sem iniciar a mídia', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 }))
    vi.stubGlobal('fetch', fetch)
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'A conversa, no ritmo da call.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Próxima melhor resposta' })).toBeInTheDocument()
    expect(screen.getAllByText('Rafaela').length).toBeGreaterThan(0)
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
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Nenhum áudio foi compartilhado'))
    expect(stop).toHaveBeenCalled()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('troca a sugestão e expande uma orientação anterior localmente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(account), { status: 200 })))
    render(<App />)

    await screen.findByRole('heading', { name: 'Próxima melhor resposta' })
    fireEvent.click(screen.getByRole('button', { name: 'Gerar outra' }))
    expect(screen.getByText(/Antes de comparar apenas o valor/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Aprofundar a dor/ }))
    await waitFor(() => expect(screen.getByText(/Quando isso acontece, o que normalmente se perde primeiro/)).toBeInTheDocument())
  })
})
