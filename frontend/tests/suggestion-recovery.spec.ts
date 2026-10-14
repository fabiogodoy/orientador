import { expect, test } from '@playwright/test'

test('call longa preserva contexto após falha, recupera e limpa erros ao encerrar', async ({ page }, testInfo) => {
  test.setTimeout(90000)
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
  let attempts = 0
  let forceError = false
  const inputs: { contextSummary: string; summarizedThrough: number }[] = []
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.endsWith('/auth/me')) return route.fulfill({ json: { id: 'test-user', name: 'Pessoa Teste', email: 'test@example.com', role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-30T12:00:00Z', avatarUpdatedAt: null } })
    if (url.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'test-csrf' } })
    if (url.includes('/knowledge-bases')) return route.fulfill({ json: [] })
    if (url.endsWith('/api/calls')) return route.fulfill({ json: { sessionId: 'test-call', title: 'Reunião de validação' } })
    if (url.includes('/audio/')) {
      chunks++
      return route.fulfill({ json: { sequenceNumber: chunks, speaker: 'CLIENT', text: `Qual é o prazo da integração ${chunks}?` } })
    }
    if (url.endsWith('/suggestions')) {
      inputs.push(route.request().postDataJSON())
      attempts++
      if (attempts === 90 || forceError) return route.fulfill({ status: 503, json: { code: 'SUGGESTION_UNAVAILABLE', message: 'Não foi possível gerar a sugestão agora. Tente novamente em instantes.' } })
      return route.fulfill({ json: { tipo: 'Pergunta', trechoCliente: `Prazo ${chunks}`, proximaFala: `Orientação ${chunks}`, pontosChave: ['Confirmar disponibilidade'], contextSummary: `Resumo ${chunks}`, summarizedThrough: chunks } })
    }
    return route.fulfill({ status: 204 })
  })
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Escutar áudio da aba' }).click()
  await page.getByRole('button', { name: 'Ignorar e iniciar' }).click()
  await expect(page.getByRole('button', { name: 'Parar de escutar áudio da aba' })).toBeVisible()
  for (let block = 1; block <= 130; block++) {
    await page.clock.runFor(block === 1 ? 15000 : 13200)
    await expect(page.getByText(`Qual é o prazo da integração ${block}?`, { exact: true })).toBeVisible()
    await page.clock.runFor(1800)
    if (block === 90) await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
    else await expect(page.getByText(`Orientação ${block}`, { exact: true })).toBeVisible()
  }
  expect(attempts).toBe(130)
  expect(inputs[90]).toEqual({ contextSummary: 'Resumo 89', summarizedThrough: 89 })
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('recuperacao-call-longa.png'), fullPage: true, animations: 'disabled' })
  forceError = true
  await page.getByRole('button', { name: 'Sugerir agora' }).click()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await page.getByRole('button', { name: 'Encerrar call' }).click()
  await expect(page.getByText('Call encerrada')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Sugerir agora' })).toBeDisabled()
})
