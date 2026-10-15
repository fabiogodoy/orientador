import { useEffect, useRef, useState } from 'react'
import { api } from './api'
import type { CostDay, CostPeriod, CostReport } from './costTypes'
import './costs.css'

const periods: [CostPeriod, string][] = [['TODAY', 'Hoje'], ['WEEK', '7 dias'], ['MONTH', '30 dias'], ['ALL', 'Tudo']]
const dateLabel = (date: string) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(date.length === 10 ? `${date}T12:00:00Z` : date))
export function costMoney(value: number, currency: 'USD' | 'BRL' = 'USD') {
  if (value > 0 && value < 0.0001) return currency === 'USD' ? '< US$ 0,0001' : '< R$ 0,0001'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: value > 0 && value < 0.01 ? 4 : 2 }).format(value)
}
const minutes = (seconds: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(seconds / 60)

export function CostsButton() {
  const [open, setOpen] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    dialog.current?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous; window.requestAnimationFrame(() => trigger.current?.focus()) }
  }, [open])
  return <>
    <button ref={trigger} className="costs-top-button" type="button" onClick={() => setOpen(true)}><WalletIcon />Custos</button>
    {open && <dialog ref={dialog} className="costs-dialog" aria-labelledby="costs-title" onCancel={() => setOpen(false)} onClose={() => setOpen(false)}>
      <CostsPage onClose={() => { dialog.current?.close(); setOpen(false) }} embedded />
    </dialog>}
  </>
}

function WalletIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18M17 13h4v4h-4a2 2 0 0 1 0-4ZM5 5V3h13" /></svg>
}

export function CostsPage({ onClose, embedded = false }: { onClose?: () => void; embedded?: boolean }) {
  const [period, setPeriod] = useState<CostPeriod>('WEEK')
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<CostReport | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let active = true
    api.costs(period, page).then(result => { if (active) setData(result) }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [period, page, revision])
  function changePeriod(value: CostPeriod) { setData(null); setError(false); setPage(0); setPeriod(value) }
  function reload() { setData(null); setError(false); setRevision(value => value + 1) }
  function changePage(value: number) { setData(null); setError(false); setPage(value) }
  return <main className="costs-page">
    <header className="costs-heading">
      <div className="costs-heading-copy">
        {onClose ? <button className="costs-back" type="button" onClick={onClose} aria-label="Fechar custos" autoFocus>←</button> : <a className="costs-back" href="/app/" aria-label="Voltar à call">←</a>}
        <div><span className="costs-eyebrow">CONSUMO DE IA</span><h1 id="costs-title">Custos</h1><p>Acompanhe o gasto estimado com transcrição e sugestões.</p></div>
      </div>
      <div className="costs-periods" role="group" aria-label="Período dos custos">{periods.map(([value, label]) => <button type="button" key={value} aria-pressed={period === value} onClick={() => { if (value !== period) changePeriod(value) }}>{label}</button>)}</div>
    </header>
    {error ? <div className="costs-state" role="alert"><strong>Não foi possível carregar os custos.</strong><p>Tente novamente em instantes.</p><button className="costs-outline-button" onClick={reload}>Tentar novamente</button></div>
      : !data ? <div className="costs-state" role="status">Carregando seus custos…</div>
        : <CostContent data={data} embedded={embedded} onReload={reload} onPage={changePage} />}
  </main>
}

function CostContent({ data, embedded, onReload, onPage }: { data: CostReport; embedded: boolean; onReload: () => void; onPage: (page: number) => void }) {
  const { totals, calls, exchangeRate: rate } = data
  const partial = totals.unknownOperations > 0 || calls.legacyCount > 0
  const brl = (value: number) => rate ? costMoney(value * rate.usdBrl, 'BRL') : 'R$ indisponível'
  const scopeLabel = { PERSONAL: 'Seu consumo', ORGANIZATION: 'Consumo da organização', PLATFORM: 'Consumo de toda a plataforma' }[data.scope]
  const cards = [
    { name: 'Total estimado', value: totals.transcriptionUsd + totals.suggestionsUsd, sub: 'Transcrição + sugestões', icon: 'wallet', color: 'mint' },
    { name: 'Transcrição', value: totals.transcriptionUsd, sub: `${totals.transcriptionCount} blocos enviados`, icon: 'mic', color: 'teal' },
    { name: 'Sugestões', value: totals.suggestionsUsd, sub: `${totals.suggestionCount} solicitações`, icon: 'spark', color: 'purple' },
  ]
  return <>
    <div className="costs-context"><span>{scopeLabel} <span aria-hidden="true">·</span> {dateLabel(data.from)} — {dateLabel(data.to)}</span><button type="button" onClick={onReload}>↻ Atualizar</button></div>
    {partial && <div className="costs-partial" role="status"><strong>Estimativa parcial.</strong> {calls.legacyCount > 0 && `${calls.legacyCount} call(s) começaram antes da medição. `}{totals.unknownOperations > 0 && `${totals.unknownOperations} operação(ões) sem custo disponível. `}Valores desconhecidos não são considerados gratuitos.</div>}
    <section className="costs-cards" aria-label="Resumo de custos">
      {cards.map(card => <article className={`costs-card ${card.color}`} key={card.name}><div className="costs-card-label"><span className="costs-card-icon">{card.icon === 'wallet' ? <WalletIcon /> : card.icon === 'mic' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5M8 22h8" /></svg> : <span aria-hidden="true">✦</span>}</span><h2>{card.name}</h2></div><strong className="costs-value">{costMoney(card.value)}</strong><p className="costs-converted">{brl(card.value)}</p><small>{card.sub}</small></article>)}
      <article className="costs-card"><div className="costs-card-label"><span className="costs-card-icon" aria-hidden="true">↗</span><h2>Calls</h2></div><strong className="costs-value">{calls.count}</strong><p className="costs-converted">{minutes(calls.durationSeconds)} min de conversa</p><small>Duração dentro do período</small></article>
    </section>
    <section className="costs-panel" aria-labelledby="daily-costs-title"><div className="costs-panel-heading"><div><h2 id="daily-costs-title">Gasto por dia <span>(US$)</span></h2><p>O consumo ao longo do período</p></div><div className="costs-legend"><span><i className="teal-dot" />Transcrição</span><span><i className="purple-dot" />Sugestões</span></div></div><DailyChart days={data.days} partial={partial} /></section>
    <section className="costs-panel" aria-labelledby="recent-costs-title"><div className="costs-panel-heading"><div><h2 id="recent-costs-title">Calls recentes</h2><p>Custos e duração referentes ao período selecionado</p></div><span className="costs-count">{calls.count} calls</span></div>
      {!data.recentCalls.length ? <div className="costs-empty">Nenhuma call neste período.</div> : <div className="costs-table-scroll"><table className="costs-table"><thead><tr><th>Reunião</th><th>Duração</th><th>Transcrição</th><th>Sugestões</th><th>Total estimado</th></tr></thead><tbody>{data.recentCalls.map(call => {
        const total = call.transcriptionUsd === null && call.suggestionsUsd === null ? null : (call.transcriptionUsd ?? 0) + (call.suggestionsUsd ?? 0)
        return <tr key={call.sessionId}><td><strong>{call.status === 'ENDED' && !embedded ? <a href={`/app/reunioes/${call.sessionId}`}>{call.title}</a> : call.title}</strong><small>{dateLabel(call.startedAt)} · {call.ownerName}{call.status === 'ACTIVE' ? ' · Em andamento' : ''}</small>{call.partial && <span className="costs-coverage">{total === null ? 'Custo não disponível' : 'Custo parcial'}</span>}</td><td>{minutes(call.durationSeconds)} min</td><td>{call.transcriptionUsd === null ? 'Não disponível' : costMoney(call.transcriptionUsd)}</td><td>{call.suggestionsUsd === null ? 'Não disponível' : costMoney(call.suggestionsUsd)}</td><td><strong>{total === null ? 'Não disponível' : costMoney(total)}</strong>{total !== null && <small>{brl(total)}</small>}</td></tr>
      })}</tbody></table></div>}
      {calls.count > data.pageSize && <nav className="costs-pagination" aria-label="Páginas de calls"><button type="button" disabled={data.page === 0} onClick={() => onPage(data.page - 1)}>Anterior</button><span>Página {data.page + 1} de {Math.ceil(calls.count / data.pageSize)}</span><button type="button" disabled={(data.page + 1) * data.pageSize >= calls.count} onClick={() => onPage(data.page + 1)}>Próxima</button></nav>}
      <footer className="costs-panel-footer">Dados salvos na sua conta. {embedded && 'Consulte os detalhes das calls em Reuniões.'}</footer>
    </section>
    <footer className="costs-notes"><p>{rate ? <>US$ 1 = {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 4 }).format(rate.usdBrl)} · {rate.source} · {dateLabel(rate.date)}.{rate.fallback && ' Cotação em cache: não foi possível atualizar agora.'} Conversão pela última cotação disponível, aplicada a todo o período.</> : 'Cotação indisponível no momento. Os custos em US$ continuam disponíveis.'}</p><p>Estimativas pelas tarifas dos provedores; não representam uma fatura. Não incluem análise executiva, impostos, descontos ou créditos. Dias no horário de Brasília.</p></footer>
  </>
}

function DailyChart({ days, partial }: { days: CostDay[]; partial: boolean }) {
  const container = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(900)
  useEffect(() => {
    const element = container.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const resize = () => setWidth(Math.max(260, Math.min(900, Math.round(element.clientWidth - 40))))
    const observer = new ResizeObserver(resize)
    observer.observe(element); resize()
    return () => observer.disconnect()
  }, [])
  const max = Math.max(...days.map(day => Math.max(day.transcriptionUsd, day.suggestionsUsd)), 0)
  const ceiling = max || 1
  const height = 200, left = width < 450 ? 48 : 75, right = 20, bottom = 32
  const plotWidth = width - left - right, plotHeight = height - bottom - 15
  const slot = plotWidth / Math.max(days.length, 1), bar = Math.min(22, slot * 0.3)
  return <div ref={container} className="costs-chart-wrap">
    {max === 0 && <p className="costs-chart-empty">{partial ? 'Nenhum gasto conhecido neste período' : 'Nenhum gasto neste período'}</p>}
    <svg className="costs-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de gasto diário em dólares, separado por transcrição e sugestões. Valores disponíveis na tabela abaixo.">
      {[0, 0.5, 1].map(part => <g key={part}><line x1={left} x2={width - right} y1={height - bottom - part * plotHeight} y2={height - bottom - part * plotHeight} stroke="#e7edeb" strokeDasharray={part ? '4 4' : undefined} /><text x={left - 12} y={height - bottom - part * plotHeight + 4} textAnchor="end">{max === 0 ? part === 0 ? '0' : '' : new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 5 }).format(ceiling * part)}</text></g>)}
      {days.map((day, index) => { const x = left + slot * (index + 0.5); return <g key={day.date}>
        {[day.transcriptionUsd, day.suggestionsUsd].map((value, category) => <rect key={category} x={x + (category ? 1 : -bar - 1)} y={height - bottom - value / ceiling * plotHeight} width={bar} height={value / ceiling * plotHeight} rx="2" fill={category ? '#9a78d0' : '#2c9b91'}><title>{dateLabel(day.date)} · {category ? 'Sugestões' : 'Transcrição'}: {costMoney(value)}</title></rect>)}
        {(index % Math.max(1, Math.ceil(days.length / (width < 450 ? 4 : 7))) === 0 || days.length === 1) && <text x={x} y={height - 8} textAnchor="middle">{dateLabel(day.date).slice(0, 5)}</text>}
      </g> })}
    </svg>
    <details className="costs-chart-data"><summary>Ver valores por dia</summary><div className="costs-table-scroll"><table className="costs-table"><thead><tr><th>Dia</th><th>Transcrição (US$)</th><th>Sugestões (US$)</th></tr></thead><tbody>{days.map(day => <tr key={day.date}><td>{dateLabel(day.date)}</td><td>{costMoney(day.transcriptionUsd)}</td><td>{costMoney(day.suggestionsUsd)}</td></tr>)}</tbody></table></div></details>
  </div>
}
