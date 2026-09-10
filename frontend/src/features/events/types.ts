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
  value: { shortCode: string; url: string } | null
}

export type CreateEventRequest = {
  title: string
  eventType: EventType
  availableDates: string[]
  dailyStartTime: string
  dailyEndTime: string
}

export type FieldErrors = Partial<Record<keyof EventFormValues, string>>
