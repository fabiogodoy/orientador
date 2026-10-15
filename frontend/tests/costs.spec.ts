import { expect, test, type Page } from '@playwright/test'
const account = { id: 'cost-user', name: 'Vanessa Oliveira', email: 'cost@example.com', role: 'INDIVIDUAL', accountType: 'INDIVIDUAL', organizationName: null, trialEndsAt: '2026-10-18T12:00:00Z', avatarUpdatedAt: null }
function fixture(period = 'WEEK') {
  const days = Array.from({ length: period === 'TODAY' ? 1 : 7 }, (_, i) => ({ date: `2026-10-${String(15 - (period === 'TODAY' ? 0 : 6) + i).padStart(2, '0')}`, transcriptionUsd: [.08,.05,.12,.07,.14,.09,.06][i], suggestionsUsd: [.12,.08,.19,.11,.21,.15,.10][i] }))
  return { period, from: days[0].date, to: '2026-10-15', timezone: 'America/Sao_Paulo', scope: 'PERSONAL',
    totals: { transcriptionUsd: days.reduce((s,d)=>s+d.transcriptionUsd,0), suggestionsUsd: days.reduce((s,d)=>s+d.suggestionsUsd,0), transcriptionCount: 438, suggestionCount: 86, unknownOperations: 0 },
    calls: { count: 4, durationSeconds: 11400, legacyCount: 0 }, exchangeRate: { usdBrl: 5.0441, date: '2026-10-14', source: 'BCB · PTAX venda', fallback: false }, days,
    recentCalls: ['Alinhamento de prioridades','Apresentação da proposta','Planejamento da próxima etapa','Conversa com a equipe'].map((title,i)=>({sessionId:`call-${i}`, title, startedAt:`2026-10-${15-i}T14:00:00Z`,status:'ENDED',ownerName:'Vanessa Oliveira',durationSeconds:2400+i*300,partial:false,transcriptionUsd:[.16,.17,.14,.14][i],suggestionsUsd:[.26,.28,.22,.20][i]})), page:0,pageSize:20 }
}
async function mock(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-15T15:00:00Z'))
  await page.route('**/api/**', route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/api/auth/me') return route.fulfill({ json: account })
    if (url.pathname === '/api/auth/csrf') return route.fulfill({ json: { token: 'test' } })
    if (url.pathname === '/api/costs') return route.fulfill({ json: fixture(url.searchParams.get('period') ?? 'WEEK') })
    if (url.pathname.includes('/knowledge-bases/options')) return route.fulfill({ json: [] })
    if (url.pathname === '/api/calls') return route.fulfill({ json: { sessionId: 'cost-call', title: 'Reunião em andamento' } })
    return route.fulfill({ status: 204 })
  })
}
test('cost screen filters, accessible chart and responsive layout', async ({ page }, info) => {
  await mock(page)
  await page.goto('/app/custos')
  await expect(page.getByRole('heading', { name: 'Custos', exact: true })).toBeVisible()
  await expect(page.getByText('Alinhamento de prioridades')).toBeVisible()
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'Tudo', exact: true })).toBeVisible()
    await page.screenshot({ path: info.outputPath(`custos-${width}.png`),fullPage:true,animations:'disabled' })
  }
  await page.getByRole('button', { name:'Hoje',exact:true }).click()
  await expect(page.getByRole('button',{name:'Hoje',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(page.getByText('Seu consumo · 15/10/2026 — 15/10/2026')).toBeVisible()
  await page.getByText('Ver valores por dia').click()
  await expect(page.getByRole('columnheader',{name:'Sugestões (US$)'})).toBeVisible()
  await page.getByRole('button', { name:'30 dias',exact:true }).click()
  await page.getByRole('button', { name:'Tudo',exact:true }).click()
  await expect(page.getByText(/US\$ 1 =/)).toBeVisible()
})
test('opening and closing costs keeps the live call and restores focus', async ({ page }) => {
  await mock(page)
  await page.addInitScript(() => {
    class Stream { getTracks() { return [{ stop() {}, addEventListener() {}, label: '' }] }; getAudioTracks() { return this.getTracks() } }
    class Recorder { state='inactive';onstop:(()=>void)|null=null; start(){this.state='recording'} stop(){if(this.state==='inactive')return;this.state='inactive';this.onstop?.()} }
    Object.defineProperty(window,'MediaStream',{value:Stream})
    Object.defineProperty(window,'MediaRecorder',{value:Recorder})
    Object.defineProperty(window,'AudioContext',{value:undefined})
    Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>new Stream()}})
  })
  await page.goto('/app/')
  await page.getByRole('button',{name:'Iniciar call',exact:true}).click()
  await page.getByRole('button',{name:'Ignorar e iniciar'}).click()
  await expect(page.getByText('Microfone sendo transcrito')).toBeVisible()
  const costs=page.getByRole('button',{name:'Custos',exact:true})
  await costs.click()
  await expect(page.getByRole('dialog',{name:'Custos'})).toBeVisible()
  await expect(page.getByText('Alinhamento de prioridades')).toBeVisible()
  expect(page.url()).toMatch(/\/app\/$/)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(costs).toBeFocused()
  await expect(page.getByText('Microfone sendo transcrito')).toBeVisible()
  await expect(page.getByRole('button',{name:'Parar de escutar microfone'})).toHaveAttribute('aria-pressed','true')
  await costs.click()
  await page.getByRole('button',{name:'Fechar custos'}).click()
  await expect(costs).toBeFocused()
  await page.getByRole('button',{name:'Encerrar call',exact:true}).click()
})
test('error, retry, partial costs and unavailable exchange rate', async ({ page }, info) => {
  await mock(page)
  let fail=true
  await page.route('**/api/costs?**',route=> {
    if(fail) return route.fulfill({status:503,json:{message:'offline'}})
    const data=fixture(); return route.fulfill({json:{...data,exchangeRate:null,totals:{...data.totals,unknownOperations:1},calls:{...data.calls,legacyCount:1},recentCalls:[{...data.recentCalls[0],partial:true,transcriptionUsd:null,suggestionsUsd:null}]}})
  })
  await page.goto('/app/custos')
  await expect(page.getByRole('alert')).toContainText('Não foi possível carregar')
  fail=false
  await page.getByRole('button',{name:'Tentar novamente'}).click()
  await expect(page.getByText('Custo não disponível')).toBeVisible()
  await expect(page.getByText('Estimativa parcial.')).toBeVisible()
  await expect(page.getByText(/Cotação indisponível/)).toBeVisible()
  await page.screenshot({path:info.outputPath('custos-parciais.png'),fullPage:true})
})
