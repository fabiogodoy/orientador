export const TERMS_VERSION = '2026-10-10'

export type AccountType = 'INDIVIDUAL' | 'ORGANIZATION'
export type Account = {
  id: string
  name: string
  email: string
  role: 'INDIVIDUAL' | 'ORGANIZATION_MANAGER'
  accountType: AccountType
  organizationName: string | null
  trialEndsAt: string
}

export type Registration = {
  name: string
  email: string
  password: string
  accountType: AccountType
  organizationName: string | null
  termsAccepted: boolean
  termsVersion: string
}
export type CallSession = { sessionId: string; clientSecret: string; title: string }
export type TranscriptionSpeaker = 'USER' | 'CLIENT'
export type CallSuggestion = { tipo: string; trechoCliente: string; proximaFala: string; pontosChave: string[] }

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD
  ? 'https://api-orientador.connectas.com.br' : 'http://localhost:8080')
let csrfToken: string | null = null

export class ApiError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  const response = await fetch(`${API_URL}/api/auth/csrf`, { credentials: 'include' })
  if (!response.ok) throw new ApiError('NETWORK_ERROR', 'Não foi possível iniciar uma sessão segura. Tente novamente.')
  const data = (await response.json()) as { token: string }
  csrfToken = data.token
  return csrfToken
}

async function request<T>(path: string, method: 'GET' | 'POST' | 'PATCH', body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json'
    headers['X-CSRF-TOKEN'] = await getCsrfToken()
  }
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Não foi possível conectar. Confira sua internet e tente novamente.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { code?: string; message?: string }
    throw new ApiError(data.code ?? 'REQUEST_ERROR', data.message ?? 'Não foi possível concluir a solicitação.')
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export const api = {
  register: (data: Registration) => request<Account>('/api/auth/register', 'POST', data),
  login: (email: string, password: string) => request<Account>('/api/auth/login', 'POST', { email, password }),
  me: () => request<Account>('/api/auth/me', 'GET'),
  logout: async () => {
    await request<void>('/api/auth/logout', 'POST')
    csrfToken = null
  },
  startCall: (title: string) => request<CallSession>('/api/calls', 'POST', { title }),
  createTranscriptionSecret: (sessionId: string) => request<{ clientSecret: string }>(`/api/calls/${sessionId}/transcription-secret`, 'POST'),
  saveTranscriptSegment: (sessionId: string, sequenceNumber: number, text: string, speaker: TranscriptionSpeaker) => request<void>(`/api/calls/${sessionId}/segments`, 'POST', { sequenceNumber, text, speaker }),
  generateSuggestion: (sessionId: string) => request<CallSuggestion>(`/api/calls/${sessionId}/suggestions`, 'POST'),
  updateCallTitle: (sessionId: string, title: string, automatic = false) => request<{ title: string }>(`/api/calls/${sessionId}/title`, 'PATCH', { title, automatic }),
  endCall: (sessionId: string) => request<void>(`/api/calls/${sessionId}/end`, 'POST'),
}
