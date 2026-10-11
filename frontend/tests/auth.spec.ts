import { expect, test } from '@playwright/test'

const password = 'senha-segura-123'

test('cadastro individual, termos, login e saída', async ({ page }) => {
  const email = `individual-${Date.now()}@example.com`
  await page.goto('/app/termos')
  await expect(page.getByRole('heading', { name: 'Termos de Uso do Orientador' })).toBeVisible()
  await expect(page.getByText(/sete dias \(168 horas\)/)).toBeVisible()
  await page.goto('/app/cadastro')
  await expect(page.getByRole('checkbox')).not.toBeChecked()
  await page.getByLabel('Seu nome').fill('Pessoa Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirme a senha').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /Criar conta grátis/ }).click()
  await expect(page).toHaveURL(/\/app\/login\?created=1/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /Entrar na minha conta/ }).click()
  await expect(page.getByRole('heading', { name: 'A conversa, no ritmo da call.' })).toBeVisible()
  await expect(page.getByText('Rafaela Costa')).toBeVisible()
  await expect(page.getByRole('status')).toContainText('As falas transcritas aparecerão aqui.')
  await page.getByRole('button', { name: 'Abrir configurações da call' }).click()
  await page.getByRole('button', { name: /Sair da conta/ }).click()
  await expect(page).toHaveURL(/\/app\/login$/)
})

test('cadastro organizacional cria o primeiro gestor', async ({ page }) => {
  const email = `gestor-${Date.now()}@example.com`
  await page.goto('/app/cadastro')
  await page.getByRole('button', { name: /Organização/ }).click()
  await page.getByLabel('Nome da organização').fill('Equipe Aurora')
  await page.getByLabel('Seu nome').fill('Gestora Teste')
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirme a senha').fill(password)
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: /Criar conta grátis/ }).click()
  await expect(page).toHaveURL(/\/app\/login\?created=1/)
  await page.getByLabel('E-mail').fill(email)
  await page.getByLabel('Senha').fill(password)
  await page.getByRole('button', { name: /Entrar na minha conta/ }).click()
  await expect(page.getByRole('heading', { name: 'Próxima melhor resposta' })).toBeVisible()
  await expect(page.getByText(/Microfone e áudio compartilhado são transcritos de forma independente/)).toBeVisible()
})

test('cadastro móvel não envia sem aceite e não tem rolagem horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/app/cadastro')
  await page.getByLabel('Seu nome').fill('Pessoa Teste')
  await page.getByLabel('E-mail').fill(`sem-aceite-${Date.now()}@example.com`)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByLabel('Confirme a senha').fill(password)
  await page.getByRole('button', { name: /Criar conta grátis/ }).click()
  await expect(page.getByRole('alert')).toContainText('aceite os Termos')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByRole('link', { name: 'Termos de Uso' }).first()).toBeVisible()
})

test('tela da call alterna controles e adapta o layout sem depender da API real', async ({ page }, testInfo) => {
  await page.route('**/api/auth/me', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      id: 'visual-test', name: 'Pessoa Teste', email: 'pessoa@example.com', role: 'INDIVIDUAL',
      accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-18T12:00:00Z',
    }),
  }))
  await page.goto('/app/')
  await expect(page.getByRole('heading', { name: 'A conversa, no ritmo da call.' })).toBeVisible()
  await expect(page.getByRole('status')).toContainText('As falas transcritas aparecerão aqui.')
  await expect(page.getByRole('heading', { name: 'Próxima melhor resposta' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Escutar microfone' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'Escutar áudio da aba' })).toHaveAttribute('aria-pressed', 'false')
  await page.getByRole('button', { name: 'Gerar outra' }).click()
  await expect(page.getByText(/Antes de comparar apenas o valor/)).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('tela-call-desktop.png'), fullPage: true })

  await page.setViewportSize({ width: 375, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await expect(page.getByText('Sugestões anteriores')).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('tela-call-mobile.png'), fullPage: true })
})
