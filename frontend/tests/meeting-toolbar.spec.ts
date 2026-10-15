import { expect, test, type Locator, type Page } from '@playwright/test'

const account = {
  id: 'layout-user', name: 'Vanessa Oliveira de Albuquerque', email: 'layout@example.com',
  role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null,
  trialEndsAt: '2026-10-18T12:00:00Z', avatarUpdatedAt: null,
}

async function mockAccount(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-15T12:00:00Z'))
  await page.route('**/api/**', route => {
    const url = route.request().url()
    if (url.endsWith('/auth/me')) return route.fulfill({ json: account })
    if (url.endsWith('/auth/csrf')) return route.fulfill({ json: { token: 'layout-csrf' } })
    if (url.includes('/knowledge-bases/options')) return route.fulfill({ json: [] })
    if (url.includes('/knowledge-bases') || url.includes('/api/calls?')) return route.fulfill({ json: { items: [], page: 0, pageSize: 20, total: 0 } })
    if (url.endsWith('/api/calls')) return route.fulfill({ json: { sessionId: 'layout-call', title: 'Reunião de planejamento' } })
    return route.fulfill({ status: 204 })
  })
}

async function expectNoOverlap(locators: Locator[]) {
  const boxes = await Promise.all(locators.map(locator => locator.boundingBox()))
  for (let i = 0; i < boxes.length; i++) {
    expect(boxes[i]).not.toBeNull()
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i]!, b = boxes[j]!
      expect(a.x + a.width <= b.x + 1 || b.x + b.width <= a.x + 1 || a.y + a.height <= b.y + 1 || b.y + b.height <= a.y + 1).toBe(true)
    }
  }
}

test('separa conta e reunião, mantém título longo e controles sem sobreposição', async ({ page }, testInfo) => {
  await mockAccount(page)
  await page.goto('/app/')
  const header = page.getByRole('banner', { name: 'Sua conta' })
  const toolbar = page.getByRole('region', { name: 'Controles da reunião' })
  const title = 'Planejamento de expansão e alinhamento de prioridades com a equipe de atendimento e relacionamento com clientes'
  await toolbar.getByRole('button', { name: 'Editar título da reunião' }).click()
  await page.getByLabel('Título da reunião', { exact: true }).fill(title)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(toolbar.getByText(title, { exact: true })).toBeVisible()
  await expect(header.getByRole('button', { name: 'Abrir seu perfil' })).toBeVisible()
  await expect(header.getByRole('button')).toHaveCount(1)

  for (const width of [1920, 1440, 1180, 1024, 851, 850, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 })
    const top = (await header.boundingBox())!
    const band = (await toolbar.boundingBox())!
    expect(band.y).toBeGreaterThanOrEqual(top.y + top.height)
    const profile = header.getByRole('button', { name: 'Abrir seu perfil' })
    const profileBox = (await profile.boundingBox())!
    expect(top.x + top.width - profileBox.x - profileBox.width).toBeLessThan(65)
    await expect(header.getByRole('img', { name: 'Orientador' })).toHaveCount(0)
    if (width <= 850) await expectNoOverlap([page.getByRole('button', { name: 'Abrir menu' }), profile])
    await expectNoOverlap([
      toolbar.locator('.meeting-title'), toolbar.locator('.meeting-status'),
      toolbar.getByRole('button', { name: 'Escutar microfone', exact: true }),
      toolbar.getByRole('button', { name: 'Escutar áudio da aba', exact: true }),
      toolbar.getByRole('button', { name: 'Sugerir agora' }),
      toolbar.getByRole('button', { name: 'Iniciar call' }),
      toolbar.getByRole('button', { name: 'Abrir configurações da call' }),
    ])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await toolbar.getByRole('button', { name: 'Abrir configurações da call' }).click()
    await expect(page.getByText('Privacidade da call')).toBeVisible()
    const popover = (await page.locator('.settings-popover').boundingBox())!
    expect(popover.x).toBeGreaterThanOrEqual(0)
    expect(popover.x + popover.width).toBeLessThanOrEqual(width)
    await toolbar.getByRole('button', { name: 'Abrir configurações da call' }).click()
    if ([1440, 390, 320].includes(width)) await page.screenshot({ path: testInfo.outputPath(`layout-${width}.png`), fullPage: true })
  }
  await toolbar.getByRole('button', { name: 'Editar título da reunião' }).click()
  await page.getByLabel('Título da reunião', { exact: true }).fill('A'.repeat(160))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await header.getByRole('button', { name: 'Abrir seu perfil' }).click()
  await expect(page.getByRole('dialog', { name: 'Perfil' })).toBeVisible()
  await page.getByRole('button', { name: 'Fechar perfil' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('logo clara e período gratuito disponíveis no menu e nas rotas autenticadas', async ({ page }, testInfo) => {
  await mockAccount(page)
  await page.goto('/app/')
  const sidebar = page.getByRole('complementary', { name: 'Navegação principal' })
  const logo = sidebar.getByRole('img', { name: 'Orientador' })
  await expect(logo).toBeVisible()
  const svg = await logo.evaluate(async (element: HTMLImageElement) => (await fetch(element.src)).text())
  expect(svg).toMatch(/<text[^>]*fill="#F7FBFA"/)
  expect(svg).toContain('stroke="#5FE0C1"')
  await expect(logo).toHaveCSS('filter', 'none')
  expect(await logo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true)
  await expect(sidebar.getByText('3 dias grátis restantes')).toBeVisible()
  await expect(sidebar.getByText('18/10/2026, 09:00')).toBeVisible()
  for (const route of ['/app/reunioes', '/app/bases-de-conhecimento']) {
    await page.goto(route)
    await expect(sidebar.getByText('3 dias grátis restantes')).toBeVisible()
    await expect(page.getByRole('img', { name: 'Orientador', exact: true })).toHaveCount(1)
  }
  await page.goto('/app/')
  await page.setViewportSize({ width: 390, height: 600 })
  await page.getByRole('button', { name: 'Abrir menu' }).click()
  await expect(sidebar).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 0)')
  await expect(sidebar.getByText('3 dias grátis restantes')).toBeVisible()
  await expect(sidebar.getByRole('button', { name: 'Sair', exact: true })).toBeVisible()
  const trial = (await sidebar.getByRole('region', { name: 'Período gratuito' }).boundingBox())!
  const logout = (await sidebar.getByRole('button', { name: 'Sair', exact: true }).boundingBox())!
  expect(trial.y + trial.height).toBeLessThanOrEqual(logout.y)
  await page.screenshot({ path: testInfo.outputPath('menu-mobile.png'), animations: 'disabled' })
  await page.keyboard.press('Escape')
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused()
})

test('mantém controles, edição durante captura e feedback de erro', async ({ page }, testInfo) => {
  await mockAccount(page)
  await page.addInitScript(() => {
    class Stream {
      getTracks() { return [{ stop() {}, addEventListener() {}, label: '' }] }
      getAudioTracks() { return this.getTracks() }
    }
    class Recorder {
      state = 'inactive'
      onstop: (() => void) | null = null
      start() { this.state = 'recording' }
      stop() { if (this.state === 'inactive') return; this.state = 'inactive'; this.onstop?.() }
    }
    Object.defineProperty(window, 'MediaStream', { value: Stream })
    Object.defineProperty(window, 'MediaRecorder', { value: Recorder })
    Object.defineProperty(window, 'AudioContext', { value: undefined })
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => new Stream() } })
  })
  let failTitle = true
  await page.route('**/api/calls/layout-call/title', route => failTitle
    ? route.fulfill({ status: 503, json: { message: 'Não foi possível salvar o título.' } })
    : route.fulfill({ json: { title: route.request().postDataJSON().title } }))
  await page.goto('/app/')
  await page.getByRole('button', { name: 'Iniciar call' }).click()
  await page.getByRole('button', { name: 'Ignorar e iniciar' }).click()
  const toolbar = page.getByRole('region', { name: 'Controles da reunião' })
  await expect(toolbar.getByText('Microfone sendo transcrito')).toBeVisible()
  await expect(toolbar.getByRole('button', { name: 'Parar de escutar microfone' })).toHaveAttribute('aria-pressed', 'true')
  await toolbar.getByRole('button', { name: 'Editar título da reunião' }).click()
  await page.getByLabel('Título da reunião', { exact: true }).fill('Alinhamento semanal')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar o título.')
  failTitle = false
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(toolbar.getByText('Alinhamento semanal')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.screenshot({ path: testInfo.outputPath('reuniao-ativa.png'), fullPage: true })
  await toolbar.getByRole('button', { name: 'Encerrar call' }).click()
  await expect(toolbar.getByText('Call encerrada')).toBeVisible()
  await expect(toolbar.getByRole('button', { name: 'Iniciar call' })).toBeVisible()
})
