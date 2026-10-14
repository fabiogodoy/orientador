export const TERMS_VERSION = '2026-10-10'

export type AccountType = 'INDIVIDUAL' | 'ORGANIZATION'
export type Account = {
  id: string
  name: string
  email: string
  role: 'INDIVIDUAL' | 'ORGANIZATION_MANAGER' | 'ORGANIZATION_MEMBER' | 'PLATFORM_ADMIN'
  accountType: AccountType
  organizationName: string | null
  trialEndsAt: string
  avatarUpdatedAt: string | null
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
export type CallSession = { sessionId: string; title: string }
export type KnowledgeBase = { id: string; name: string; content: string; createdByUserId: string; updatedAt: string }
export type KnowledgeBasePage = { items: KnowledgeBase[]; page: number; pageSize: number; total: number }
export type CallPreparation = { meetingContext?: string; knowledgeBaseId?: string }
export type TranscriptionSpeaker = 'USER' | 'CLIENT'
export type CallSuggestion = { tipo: string; trechoCliente: string; proximaFala: string; pontosChave: string[]; contextSummary: string; summarizedThrough: number }
export type CallHistoryItem = { sessionId: string; title: string; startedAt: string; endedAt: string; durationSeconds: number; ownerId: string; ownerName: string }
export type CallHistoryPage = { items: CallHistoryItem[]; page: number; pageSize: number; total: number }
export type TranscriptHistorySegment = { sequenceNumber: number; speaker: TranscriptionSpeaker; text: string; finalizedAt: string }
export type MeetingAnalysis = { overview: string; decisions: string[]; nextSteps: string[]; risks: string[]; keyPoints: string[]; participants: string[]; temperature: 'POSITIVA' | 'NEUTRA' | 'TENSA'; temperatureReason: string }
export type MeetingAnalysisState = { status: 'ABSENT' | 'GENERATING' | 'COMPLETED' | 'FAILED'; analysis: MeetingAnalysis | null }
export type CallHistoryDetail = CallHistoryItem & { segments: TranscriptHistorySegment[]; analysis: MeetingAnalysisState }

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

async function request<T>(path: string, method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
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

async function upload(path: string, file: Blob): Promise<Account> {
  const form = new FormData()
  form.append('avatar', file, 'avatar.png')
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'X-CSRF-TOKEN': await getCsrfToken() }, body: form,
    })
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Não foi possível enviar a foto. Tente novamente.')
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({})) as { code?: string; message?: string }
    throw new ApiError(data.code ?? 'REQUEST_ERROR', data.message ?? 'Não foi possível enviar a foto.')
  }
  return (await response.json()) as Account
}

async function uploadAudio(sessionId: string, source: 'microphone' | 'tab', sequenceNumber: number, audio: Blob): Promise<{ sequenceNumber: number; speaker: TranscriptionSpeaker; text: string }> {
  const response = await fetch(`${API_URL}/api/calls/${sessionId}/audio/${source}/${sequenceNumber}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'audio/webm', 'X-CSRF-TOKEN': await getCsrfToken() }, body: audio })
  if (!response.ok) { const data = await response.json().catch(() => ({})) as { code?: string; message?: string }; throw new ApiError(data.code ?? 'REQUEST_ERROR', data.message ?? 'Não foi possível transcrever este bloco.') }
  return response.json()
}

export const api = {
  register: (data: Registration) => request<Account>('/api/auth/register', 'POST', data),
  login: (email: string, password: string) => request<Account>('/api/auth/login', 'POST', { email, password }),
  me: () => request<Account>('/api/auth/me', 'GET'),
  updateProfile: (name: string) => request<Account>('/api/profile', 'PATCH', { name }),
  uploadAvatar: (file: Blob) => upload('/api/profile/avatar', file),
  removeAvatar: () => request<Account>('/api/profile/avatar', 'DELETE'),
  avatarUrl: (updatedAt: string) => `${API_URL}/api/profile/avatar?v=${encodeURIComponent(updatedAt)}`,
  logout: async () => {
    await request<void>('/api/auth/logout', 'POST')
    csrfToken = null
  },
  startCall: (title: string, preparation: CallPreparation = {}) => request<CallSession>('/api/calls', 'POST', { title, ...preparation }),
  knowledgeBases: async (page = 0, query = '') => {
    const params = new URLSearchParams({ page: String(page) })
    if (query.trim()) params.set('query', query.trim())
    const data = await request<KnowledgeBasePage | KnowledgeBase[]>(`/api/knowledge-bases?${params}`, 'GET')
    return Array.isArray(data) ? { items: data, page, pageSize: 20, total: data.length } : data
  },
  knowledgeBaseOptions: (query = '') => request<KnowledgeBase[]>(`/api/knowledge-bases/options?query=${encodeURIComponent(query.trim())}`, 'GET'),
  createKnowledgeBase: (name: string, content: string) => request<KnowledgeBase>('/api/knowledge-bases', 'POST', { name, content }),
  updateKnowledgeBase: (id: string, name: string, content: string) => request<KnowledgeBase>(`/api/knowledge-bases/${id}`, 'PUT', { name, content }),
  deleteKnowledgeBase: (id: string) => request<void>(`/api/knowledge-bases/${id}`, 'DELETE'),
  callHistory: (page: number) => request<CallHistoryPage>(`/api/calls?page=${page}`, 'GET'),
  callHistoryDetail: (sessionId: string) => request<CallHistoryDetail>(`/api/calls/${sessionId}`, 'GET'),
  generateExecutiveAnalysis: (sessionId: string) => request<MeetingAnalysisState>(`/api/calls/${sessionId}/executive-analysis`, 'POST'),
  transcribeAudio: (sessionId: string, source: 'microphone' | 'tab', sequenceNumber: number, audio: Blob) => uploadAudio(sessionId, source, sequenceNumber, audio),
  saveTranscriptSegment: (sessionId: string, sequenceNumber: number, text: string, speaker: TranscriptionSpeaker) => request<void>(`/api/calls/${sessionId}/segments`, 'POST', { sequenceNumber, text, speaker }),
  generateSuggestion: (sessionId: string, contextSummary: string, summarizedThrough: number) => request<CallSuggestion>(`/api/calls/${sessionId}/suggestions`, 'POST', { contextSummary, summarizedThrough }),
  updateCallTitle: (sessionId: string, title: string, automatic = false) => request<{ title: string }>(`/api/calls/${sessionId}/title`, 'PATCH', { title, automatic }),
  endCall: (sessionId: string) => request<void>(`/api/calls/${sessionId}/end`, 'POST'),
}
