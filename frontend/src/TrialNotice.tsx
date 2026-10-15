import { useEffect, useState } from 'react'

const dayInMilliseconds = 86_400_000
const trialDateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo',
})

export function TrialNotice({ trialEndsAt }: { trialEndsAt: string }) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const interval = window.setInterval(refresh, 60_000)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const endsAt = new Date(trialEndsAt).getTime()
  const valid = Number.isFinite(endsAt)
  const daysLeft = valid ? Math.max(0, Math.ceil((endsAt - now) / dayInMilliseconds)) : 0

  return <section className="sidebar-trial" aria-label="Período gratuito">
    <span>Período gratuito</span>
    <strong>{!valid ? 'Prazo indisponível' : daysLeft === 0 ? 'Período gratuito encerrado' : `${daysLeft} ${daysLeft === 1 ? 'dia grátis restante' : 'dias grátis restantes'}`}</strong>
    {valid && <p>{endsAt > now ? 'Termina' : 'Terminou'} em <time dateTime={trialEndsAt}>{trialDateFormat.format(endsAt)}</time> (Brasília).</p>}
    <small>Sem cobrança automática.</small>
  </section>
}
