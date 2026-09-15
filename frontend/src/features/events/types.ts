import type { z } from 'zod'
import type { eventFormSchema } from './schema'

export type EventType = 1 | 2


export const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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


export type EventFormValues = z.infer<typeof eventFormSchema>
