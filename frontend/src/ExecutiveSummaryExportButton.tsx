import { useRef, useState } from 'react'
import type { MeetingAnalysis } from './api'
import type { SummaryMetadata } from './executiveSummaryDocument'

export function ExecutiveSummaryExportButton({ meeting, analysis }: { meeting: SummaryMetadata; analysis: MeetingAnalysis }) {
  const inProgress = useRef(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadStarted, setDownloadStarted] = useState(false)

  async function exportPdf() {
    if (inProgress.current) return
    inProgress.current = true
    setExporting(true)
    setError(null)
    setDownloadStarted(false)
    let phase: 'load' | 'generate' = 'load'
    try {
      const { exportExecutiveSummary } = await import('./exportExecutiveSummary')
      phase = 'generate'
      await exportExecutiveSummary(meeting, analysis)
      setDownloadStarted(true)
    } catch {
      console.error(`[executive-summary-pdf] Falha na etapa: ${phase}.`)
      setError(phase === 'load'
        ? 'Não foi possível carregar a exportação. Atualize a página e tente novamente.'
        : 'Não foi possível exportar o PDF. Tente novamente.')
    } finally {
      inProgress.current = false
      setExporting(false)
    }
  }

  return <div className="summary-export">
    <button className="meeting-analysis-retry" type="button" disabled={exporting} onClick={exportPdf}>
      {exporting ? 'Exportando…' : 'Exportar PDF'}
    </button>
    {error && <p role="alert">{error}</p>}
    <span className="summary-export-status" role="status">{exporting ? 'Preparando PDF…' : downloadStarted ? 'PDF pronto. O download foi iniciado.' : ''}</span>
  </div>
}
