import { HubConnectionBuilder, LogLevel, type HubConnection } from '@microsoft/signalr'
import type {
  ApiResponse,
  CreateEventInput,
  EventData,
  FinalSchedule,
  Session,
  Suggestion,
  TimeSlot,
} from '@/shared/types'

const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, '')
export const API_BASE = configuredBase ?? 'http://localhost:5000'
const hubUrl = import.meta.env.VITE_SIGNALR_HUB_URL?.trim() || `${API_BASE}/hubs/events`

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null
  if (!response.ok || !body?.isSuccess) throw new Error(body?.message || `Yêu cầu thất bại (${response.status})`)
  return body.value
}

export const api = {
  createEvent: (input: CreateEventInput) =>
    request<Omit<Session, 'username' | 'timeSlots'> & { shortCode: string; url: string; status: number; revision: number }>(
      '/api/v1/events',
      { method: 'POST', body: JSON.stringify(input) },
    ),
  getEvent: (code: string) => request<EventData>(`/api/v1/events/${code}`),
  accessEvent: (code: string, username: string, password: string) =>
    request<Session & { isNewParticipant: boolean; eventStatus: number; revision: number }>(
      `/api/v1/events/${code}/participants/access`,
      { method: 'POST', body: JSON.stringify({ username, password: password || null }) },
    ),
  getMe: (code: string, token: string) =>
    request<Omit<Session, 'accessToken' | 'expiresAt'> & { eventStatus: number; revision: number }>(
      `/api/v1/events/${code}/participants/me`,
      undefined,
      token,
    ),
  saveAvailability: (code: string, token: string, timeSlots: TimeSlot[], email: string) =>
    request<{ revision: number }>(
      `/api/v1/events/${code}/participants/me/availability`,
      { method: 'PUT', body: JSON.stringify({ timeSlots, email: email || null }) },
      token,
    ),
  suggestions: (code: string, token: string, keyParticipant: string, minDuration: number) => {
    const query = new URLSearchParams()
    if (keyParticipant) query.set('keyParticipant', keyParticipant)
    if (minDuration) query.set('minDuration', String(minDuration))
    return request<{ suggestedSlots: Suggestion[] }>(`/api/v1/events/${code}/suggestions?${query}`, undefined, token)
  },
  updateEvent: (code: string, token: string, input: Omit<CreateEventInput, 'admin'>) =>
    request<{ revision: number }>(
      `/api/v1/events/${code}`,
      { method: 'PUT', body: JSON.stringify(input) },
      token,
    ),
  finalize: (code: string, token: string, slot: FinalSchedule) =>
    request<{ status: number; finalSchedule: FinalSchedule; revision: number }>(
      `/api/v1/events/${code}/finalize`,
      { method: 'POST', body: JSON.stringify(slot) },
      token,
    ),
}

type RealtimeHandlers = {
  heatmapUpdated: (payload: { revision: number }) => void
  eventChanged: () => void
}

export async function connectRealtime(code: string, token: string | undefined, handlers: RealtimeHandlers): Promise<HubConnection> {
  const connection = new HubConnectionBuilder()
    .withUrl(hubUrl, token ? { accessTokenFactory: () => token } : {})
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: ({ previousRetryCount }) => Math.min(1000 * 2 ** previousRetryCount, 30000) })
    .configureLogging(LogLevel.Warning)
    .build()
  connection.on('HeatmapUpdated', handlers.heatmapUpdated)
  connection.on('EventUpdated', handlers.eventChanged)
  connection.on('EventFinalized', handlers.eventChanged)
  connection.onreconnected(() => connection.invoke('JoinEvent', code).catch(() => undefined))
  await connection.start()
  await connection.invoke('JoinEvent', code)
  return connection
}
