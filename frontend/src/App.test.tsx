import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { App } from './App'

beforeEach(() => {
  window.history.replaceState({}, '', '/app/cadastro')
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
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
