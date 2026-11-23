import { api, getApiErrorMessage } from '@/lib/axios'
import type { DayOfWeek, EditableEvent, EventDetail, EventType, FinalSchedule } from '@/shared/types'

/**
 * Mọi request của một event. Token của participant hiện tại do interceptor trong
 * `lib/axios` gắn, nên các hàm ở đây không nhận token.
 */

const eventEndpoint = (shortCode: string, suffix = '') =>
  `/events/${encodeURIComponent(shortCode)}${suffix}`

/** Đổi lỗi axios thành `Error` với câu tiếng Anh để nơi gọi toast trực tiếp */
async function unwrap<T>(request: Promise<{ data: T }>, fallback: string): Promise<T> {
  try {
    return (await request).data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallback), { cause: error })
  }
}

export interface EventFieldsRequest {
  title: string
  eventType: EventType
  availableDates: string[]
  availableWeekdays: DayOfWeek[]
  dailyStartTime: string
  dailyEndTime: string
}

export interface CreateEventRequest extends EventFieldsRequest {
  admin: { username: string; password: string }
}

/** `accessToken` là token admin của người vừa tạo event */
export interface CreatedEvent {
  shortCode: string
  url: string
  participantId: string
  isAdmin: boolean
  accessToken: string
  expiresAt: string
  status: number
  revision: number
}

export interface FinalizeResult {
  status: 2
  finalSchedule: FinalSchedule
  revision: number
}

/** Một khoảng thời gian liên tục trong lịch rảnh */
export interface TimeSlotRange {
  specificDate: string | null
  dayOfWeek: DayOfWeek | null
  startTime: string
  endTime: string
}

export interface ParticipantAccess {
  participantId: string
  username: string
  isAdmin: boolean
  isNewParticipant: boolean
  accessToken: string
  eventStatus: number
  revision: number
  timeSlots: TimeSlotRange[]
}

export interface MyParticipant {
  participantId: string
  username: string
  isAdmin: boolean
  timeSlots: TimeSlotRange[]
  eventStatus: number
  revision: number
}

export interface SaveAvailabilityRequest {
  /** Email nhận thông báo chốt lịch; BE REPLACE toàn bộ lịch nên gửi kèm lịch hiện tại */
  email?: string
  timeSlots: TimeSlotRange[]
}

export function getEvent(shortCode: string): Promise<EventDetail> {
  return unwrap(api.get<EventDetail>(eventEndpoint(shortCode)), 'Unable to load the event.')
}

export function createEvent(payload: CreateEventRequest): Promise<CreatedEvent> {
  return unwrap(
    api.post<CreatedEvent>('/events', payload),
    'Unable to create the event. Please try again.',
  )
}

export async function updateEvent(shortCode: string, payload: EditableEvent): Promise<void> {
  await unwrap(
    api.put<null>(eventEndpoint(shortCode), payload),
    'Unable to update the event. Please try again.',
  )
}

export function finalizeEvent(shortCode: string, payload: FinalSchedule): Promise<FinalizeResult> {
  return unwrap(
    api.post<FinalizeResult>(eventEndpoint(shortCode, '/finalize'), payload),
    'Unable to finalize the meeting. Please try again.',
  )
}

export function accessParticipant(
  shortCode: string,
  credentials: { username: string; password?: string },
): Promise<ParticipantAccess> {
  return unwrap(
    api.post<ParticipantAccess>(eventEndpoint(shortCode, '/participants/access'), credentials, {
      keepSessionOn401: true,
    }),
    'Could not join, please try again',
  )
}

export function getMyParticipant(shortCode: string): Promise<MyParticipant> {
  return unwrap(
    api.get<MyParticipant>(eventEndpoint(shortCode, '/participants/me')),
    "Couldn't load your schedule, please try again",
  )
}

export function saveAvailability(
  shortCode: string,
  payload: SaveAvailabilityRequest,
): Promise<{ revision: number }> {
  return unwrap(
    api.put<{ revision: number }>(eventEndpoint(shortCode, '/participants/me/availability'), payload),
    'Failed to save, please try again',
  )
}
