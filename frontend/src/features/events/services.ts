import type { CreateEventRequest, EventFormValues } from './types'

export type CreateEventPayload = CreateEventRequest

export function toCreateEventPayload(values: EventFormValues): CreateEventPayload {
  return {
    title: values.title.trim(),
    eventType: values.eventType,
    availableDates: values.availableDates,
    dailyStartTime: values.dailyStartTime,
    dailyEndTime: values.dailyEndTime,
  }
}
