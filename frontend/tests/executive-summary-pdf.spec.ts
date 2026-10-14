import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { CallHistoryDetail, MeetingAnalysisState } from '../src/api'

const summary = {
  overview: 'A equipe discutiu a expansão do atendimento e aprovou a avaliação da proposta. A integração será validada antes da contratação.',
  decisions: ['Realizar um piloto com a equipe de atendimento.'],
  nextSteps: ['João enviará a proposta revisada até terça-feira.', 'Érica organizará a validação técnica.'],
  risks: ['O prazo depende da disponibilidade da equipe.'],
  keyPoints: ['Integração com o processo atual e qualidade do atendimento.'],
  participants: ['João Silva', 'Érica Souza'], temperature: 'POSITIVA' as const,
  temperatureReason: 'Houve colaboração e abertura para os próximos passos.',
}
const meeting: CallHistoryDetail = {
  sessionId: 'meeting-pdf', title: 'Planejamento de expansão', startedAt: '2026-10-14T13:00:00Z',
  endedAt: '2026-10-14T13:42:00Z', durationSeconds: 2520, ownerId: 'user-pdf', ownerName: 'João Silva',
  analysis: { status: 'COMPLETED', analysis: summary },
  segments: [{ sequenceNumber: 1, speaker: 'USER', text: 'TRANSCRICAO_PRIVADA_NAO_EXPORTAR', finalizedAt: '2026-10-14T13:01:00Z' }],
}

async function mockMeeting(page: Page, detail = meeting) {
  await page.route('**/api/auth/me', route => route.fulfill({ json: {
    id: 'user-pdf', name: 'João Silva', email: 'pdf@example.com', role: 'INDIVIDUAL',
    accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-20T12:00:00Z', avatarUpdatedAt: null,
  } }))
  await page.route('**/api/calls/meeting-pdf', route => route.fulfill({ json: detail }))
}

test('exporta PDF rico com download direto e layout responsivo', async ({ page }, testInfo) => {
  const requests: string[] = []
  page.on('request', request => requests.push(request.url()))
  await mockMeeting(page)
  await page.goto('/app/reunioes/meeting-pdf')
  await expect(page.getByRole('heading', { name: 'Nomes Identificados' })).toBeVisible()
  await expect(page.getByText('TRANSCRICAO_PRIVADA_NAO_EXPORTAR')).toBeVisible()
  expect(requests.some(url => /exportExecutiveSummary|vfs_fonts|pdfmake/.test(url))).toBe(false)
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('resumo-executivo-planejamento-de-expansao.pdf')
  const path = testInfo.outputPath('resumo-executivo.pdf')
  await download.saveAs(path)
  expect((await readFile(path)).subarray(0, 5).toString()).toBe('%PDF-')
  expect(await download.failure()).toBeNull()
  await expect(page.getByRole('status')).toHaveText('PDF pronto. O download foi iniciado.')
  expect(requests.filter(url => url.includes('/executive-analysis'))).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: true, animations: 'disabled' })
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const mobileDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  expect(await (await mobileDownload).failure()).toBeNull()
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true, animations: 'disabled' })
})

test('exporta texto longo, nomes ausentes e conteúdo literal sem imagens externas', async ({ page }, testInfo) => {
  const external: string[] = []
  await page.route('https://example.invalid/**', route => { external.push(route.request().url()); return route.abort() })
  await mockMeeting(page, { ...meeting, title: 'Relatório longo: operação São Paulo', analysis: { status: 'COMPLETED', analysis: {
    ...summary,
    overview: Array.from({ length: 30 }, (_, index) => `Parágrafo ${index + 1}. ${summary.overview} A análise considera objeções, condições comerciais e próximos passos.\n\n`).join(''),
    decisions: Array.from({ length: 18 }, (_, index) => `Decisão ${index + 1}: ${'Validar informações com a equipe. '.repeat(8)}`),
    risks: [], participants: [],
    keyPoints: ['<img src="https://example.invalid/segredo">', 'https://example.invalid/texto', 'Palavra longa: ' + 'A'.repeat(300)],
    temperatureReason: 'FIM_DO_RESUMO: colaboração, ação e conclusão preservadas.',
  } } })
  await page.goto('/app/reunioes/meeting-pdf')
  await expect(page.getByText('Nenhum nome identificado na transcrição')).toBeVisible()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const download = await downloading
  await download.saveAs(testInfo.outputPath('resumo-longo.pdf'))
  expect(await download.failure()).toBeNull()
  expect(external).toEqual([])
})

for (const status of ['ABSENT', 'GENERATING', 'FAILED', 'COMPLETED'] as const) {
  test(`não exporta análise ${status} sem conteúdo`, async ({ page }) => {
    const state: MeetingAnalysisState = { status, analysis: null }
    await mockMeeting(page, { ...meeting, analysis: state })
    await page.route('**/api/calls/meeting-pdf/executive-analysis', route => route.fulfill({ json: { status: 'GENERATING', analysis: null } }))
    await page.goto('/app/reunioes/meeting-pdf')
    await expect(page.getByRole('heading', { name: meeting.title })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Exportar PDF' })).toHaveCount(0)
    await expect(page.getByText('TRANSCRICAO_PRIVADA_NAO_EXPORTAR')).toBeVisible()
  })
}

test('detalhe negado não apresenta conteúdo nem exportação', async ({ page }) => {
  await mockMeeting(page)
  await page.route('**/api/calls/meeting-pdf', route => route.fulfill({ status: 403, json: { message: 'Acesso negado' } }))
  await page.goto('/app/reunioes/meeting-pdf')
  await expect(page.getByRole('alert')).toHaveText('Esta reunião não está disponível.')
  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toHaveCount(0)
})

test('falha ao carregar o gerador mantém o resumo e apresenta orientação', async ({ page }) => {
  await mockMeeting(page)
  await page.route('**/*exportExecutiveSummary*.js', route => route.abort())
  await page.goto('/app/reunioes/meeting-pdf')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  await expect(page.getByRole('alert')).toHaveText('Não foi possível carregar a exportação. Atualize a página e tente novamente.')
  await expect(page.getByText(summary.overview)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Exportar PDF' })).toBeEnabled()
})
