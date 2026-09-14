export type EventType = 1 | 2

export type EventFormValues = {
  title: string
  timezone: string
  eventType: EventType
  availableDates: string[]
  dailyStartTime: string
  dailyEndTime: string
  adminUsername?: string
  adminPassword?: string
}

export type CreateEventResponse = {
  isSuccess: boolean
  code: number
  message: string
  value: {
    shortCode: string
    url: string
    participantId: string
    isAdmin: boolean
    accessToken: string
    expiresAt: string
    status: number
    revision: number
  } | null
}

export type CreateEventRequest = {
  title: string
  eventType: EventType
  availableDates: string[]
  availableWeekdays: number[]
  dailyStartTime: string
  dailyEndTime: string
  admin: { username: string; password: string | null }
}

export type UpdateEventRequest = Omit<CreateEventRequest, 'admin'>

export type UpdateEventResponse = {
  isSuccess: boolean
  code: number
  message: string
  value: { revision: number }
}

export type FieldErrors = Partial<Record<keyof EventFormValues, string>>
