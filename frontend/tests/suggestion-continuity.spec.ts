import { expect, test, type Route } from '@playwright/test'

test('exibe resposta de 9s mesmo com novo bloco remoto e mantém fila única', async ({ page }, info) => {
  await page.clock.install()
  await page.addInitScript(() => {
    class Stream {
      getTracks() { return [{ stop() {}, addEventListener() {}, label: '' }] }
      getAudioTracks() { return this.getTracks() }
      getVideoTracks() { return [] }
    }
    class Recorder {
      state = 'inactive'
      ondataavailable: ((event: { data: Blob }) => void) | null = null
      onstop: (() => void) | null = null
      start() { this.state = 'recording' }
      stop() { if (this.state === 'inactive') return; this.state = 'inactive'; this.ondataavailable?.({ data: new Blob(['audio'], { type: 'audio/webm' }) }); this.onstop?.() }
    }
    Object.defineProperty(window, 'MediaStream', { value: Stream })
    Object.defineProperty(window, 'MediaRecorder', { value: Recorder })
    Object.defineProperty(window, 'AudioContext', { value: undefined })
    Object.defineProperty(navigator, 'mediaDevices', { value: { getDisplayMedia: async () => new Stream(), getUserMedia: async () => new Stream() } })
  })

  let chunks = 0
  const pending: Route[] = []
  const inputs: { contextSummary: string; summarizedThrough: number }[] = []
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.endsWith('/auth/me')) return route.fulfill({ json: { id: 'test-user', name: 'Pessoa Teste', email: 'test@example.com', role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-30T12:00:00Z', avatarUpdatedAt: null } })
    if (url.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'test-csrf' } })
    if (url.includes('/knowledge-bases')) return route.fulfill({ json: [] })
    if (url.endsWith('/api/calls')) return route.fulfill({ json: { sessionId: 'test-call', title: 'Conversa contínua' } })
    if (url.includes('/audio/')) {
      chunks++
      return route.fulfill({ json: { sequenceNumber: chunks, speaker: 'CLIENT', text: `Como organizar a próxima etapa ${chunks}?` } })
    }
    if (url.endsWith('/suggestions')) {
      inputs.push(route.request().postDataJSON())
      pending.push(route)
      return
    }
    return route.fulfill({ status: 204 })
  })
  const reply = (number: number) => ({ acao: 'FALAR', tipo: 'Resposta', trechoCliente: `Etapa ${number}`, proximaFala: `Orientação recente ${number}`, pontosChave: ['Confirmar próximos passos'], contextSummary: `Resumo ${number}`, summarizedThrough: number })
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Escutar áudio da aba' }).click()
  await page.getByRole('button', { name: 'Ignorar e iniciar' }).click()
  await expect(page.getByRole('button', { name: 'Parar de escutar áudio da aba' })).toBeVisible()
  await page.clock.runFor(8000)
  await expect(page.getByText('Como organizar a próxima etapa 1?', { exact: true })).toBeVisible()
  await page.clock.runFor(300)
  await expect.poll(() => pending.length).toBe(1)
  await page.clock.runFor(8000)
  await expect(page.getByText('Como organizar a próxima etapa 2?', { exact: true })).toBeVisible()
  await page.clock.runFor(1000)
  expect(pending).toHaveLength(1)
  await pending.shift()!.fulfill({ json: reply(1) })
  await expect(page.getByText('Orientação recente 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Baseada em fala recente', { exact: true })).toBeVisible()
  await page.clock.runFor(300)
  await expect.poll(() => pending.length).toBe(1)
  expect(inputs[1]).toEqual({ contextSummary: 'Resumo 1', summarizedThrough: 1 })
  await pending.shift()!.fulfill({ json: reply(2) })
  await expect(page.getByText('Orientação recente 2', { exact: true })).toBeVisible()
  await page.screenshot({ path: info.outputPath('sugestoes-conversa-continua.png'), fullPage: true })
  await page.getByRole('button', { name: 'Encerrar call' }).click()
  await expect(page.getByText('Call encerrada')).toBeVisible()
})
