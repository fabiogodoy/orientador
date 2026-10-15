export type CostPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL'
export interface CostDay { date: string; transcriptionUsd: number; suggestionsUsd: number }
export interface CostCall {
  sessionId: string; title: string; startedAt: string; status: string; ownerName: string
  durationSeconds: number; partial: boolean; transcriptionUsd: number | null; suggestionsUsd: number | null
}
export interface CostReport {
  period: CostPeriod; from: string; to: string; timezone: string; scope: 'PERSONAL' | 'ORGANIZATION' | 'PLATFORM'
  totals: { transcriptionUsd: number; suggestionsUsd: number; transcriptionCount: number; suggestionCount: number; unknownOperations: number }
  calls: { count: number; durationSeconds: number; legacyCount: number }
  exchangeRate: { usdBrl: number; date: string; source: string; fallback: boolean } | null
  days: CostDay[]; recentCalls: CostCall[]; page: number; pageSize: number
}
