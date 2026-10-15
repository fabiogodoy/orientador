import { writeFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

test('captura WebM real em pausa e alterna resposta de entrevista com momento de ouvir', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    // Use the browser's real MediaRecorder/Web Audio with a synthetic signal, never a person's audio.
    Object.defineProperty(navigator, 'mediaDevices', { value: { getDisplayMedia: async () => {
      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const destination = context.createMediaStreamDestination()
      oscillator.connect(gain).connect(destination)
      gain.gain.value = 0.2
      oscillator.start()
      await context.resume()
      document.addEventListener('test-audio-pause', () => { gain.gain.value = 0 })
      return destination.stream
    } } })
  })
  let uploaded = 0
  let attempts = 0
  let startedAt = 0
  let firstUploadAt = 0
  let prepared = ''
  await page.route('**/api/**', async route => {
    const url = route.request().url()
    if (url.endsWith('/auth/me')) return route.fulfill({ json: { id: 'test-user', name: 'Pessoa Teste', email: 'test@example.com', role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-30T12:00:00Z', avatarUpdatedAt: null } })
    if (url.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'test-csrf' } })
    if (url.includes('/knowledge-bases')) return route.fulfill({ json: [] })
    if (url.endsWith('/api/calls')) {
      startedAt = Date.now()
      prepared = route.request().postDataJSON().meetingContext
      return route.fulfill({ json: { sessionId: 'test-call', title: 'Entrevista de emprego' } })
    }
    if (url.includes('/audio/')) {
      uploaded++
      if (uploaded === 1) firstUploadAt = Date.now()
      const audio = route.request().postDataBuffer()!
      expect(audio.length).toBeGreaterThan(100)
      expect(audio.subarray(0, 4).toString('hex')).toBe('1a45dfa3')
      return route.fulfill({ json: { sequenceNumber: uploaded, speaker: 'CLIENT', text: 'Conte sobre a sua experiência profissional.' } })
    }
    if (url.endsWith('/suggestions')) {
      attempts++
      return route.fulfill({ json: { acao: attempts === 1 ? 'FALAR' : 'OUVIR', tipo: attempts === 1 ? 'Resposta' : 'Ouvir', trechoCliente: 'Conte sobre a sua experiência profissional.', proximaFala: attempts === 1 ? 'Posso explicar minha trajetória com um exemplo relevante para a vaga.' : '', pontosChave: attempts === 1 ? ['Usar um exemplo real'] : [], contextSummary: 'Usuário candidato; entrevista em andamento.', summarizedThrough: uploaded } })
    }
    return route.fulfill({ status: 204 })
  })
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Escutar áudio da aba' }).click()
  await page.getByLabel('Contexto da reunião', { exact: true }).fill('Sou candidato em entrevista de emprego. Quero respostas breves e só fazer perguntas quando houver abertura.')
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Parar de escutar áudio da aba' })).toBeVisible()
  await page.evaluate(() => { window.setTimeout(() => document.dispatchEvent(new Event('test-audio-pause')), 1200) })
  await expect(page.getByText('Posso explicar minha trajetória com um exemplo relevante para a vaga.')).toBeVisible({ timeout: 10000 })
  expect(prepared).toContain('Sou candidato')
  expect(firstUploadAt - startedAt).toBeGreaterThanOrEqual(4900)
  expect(firstUploadAt - startedAt).toBeLessThan(7500)
  await expect(page.getByText('Interlocutor', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Sugerir agora' }).click()
  await expect(page.getByText('Continue ouvindo. Não é necessário intervir agora.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copiar resposta' })).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('entrevista-ouvir.png'), fullPage: true })
  await page.getByRole('button', { name: 'Encerrar call' }).click()
  await expect(page.getByText('Call encerrada')).toBeVisible()
  expect(uploaded).toBe(1)
  const metrics = await page.evaluate(() => performance.getEntriesByType('measure').filter(entry => entry.name.startsWith('orientador.')).map(entry => ({ name: entry.name, durationMs: entry.duration })))
  expect(metrics.some(entry => entry.name === 'orientador.capture' && entry.durationMs >= 4900 && entry.durationMs < 7500)).toBe(true)
  const path = testInfo.outputPath('capture-timing.json')
  await writeFile(path, JSON.stringify({ firstUploadAfterMs: firstUploadAt - startedAt, uploads: uploaded, suggestions: attempts, provider: 'mocked', recorder: 'real Chromium WebM', metrics }, null, 2))
  await testInfo.attach('capture-timing.json', { path, contentType: 'application/json' })
})
