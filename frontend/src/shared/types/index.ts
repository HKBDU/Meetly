export type ApiResponse<T> = {
  isSuccess: boolean
  code: number
  message: string
  value: T
}

export type EventStatus = 1 | 2 | 3

export type TimeSlot = {
  specificDate: string | null
  dayOfWeek: number | null
  startTime: string
  endTime: string
}

export type HeatmapCell = {
  specificDate: string | null
  dayOfWeek: number | null
  startTime: string
  participants: string[]
  count: number
}

export type FinalSchedule = TimeSlot

export type EventData = {
  title: string
  shortCode: string
  url: string
  eventType: 1 | 2
  timezone: string
  availableDates: string[]
  availableWeekdays: number[]
  dailyStartTime: string
  dailyEndTime: string
  status: EventStatus
  revision: number
  participants: { username: string }[]
  heatmapGrid: HeatmapCell[]
  finalSchedule: FinalSchedule | null
}

export type Session = {
  participantId: string
  username: string
  isAdmin: boolean
  accessToken: string
  expiresAt: string
  timeSlots: TimeSlot[]
}

export type CreateEventInput = {
  title: string
  eventType: 1 | 2
  availableDates: string[]
  availableWeekdays: number[]
  dailyStartTime: string
  dailyEndTime: string
  admin: { username: string; password: string | null }
}

export type Suggestion = TimeSlot & {
  participantCount: number
  totalParticipants: number
}
