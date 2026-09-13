import type { CreateEventRequest, CreateEventResponse, EventFormValues } from './types'

export type CreateEventPayload = CreateEventRequest

const WEEKDAY_CODES: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

export function toCreateEventPayload(values: EventFormValues): CreateEventPayload {
  return {
    title: values.title.trim(),
    eventType: values.eventType,
    availableDates: values.eventType === 1 ? values.availableDates : [],
    availableWeekdays: values.eventType === 2 ? values.availableDates.map((day) => WEEKDAY_CODES[day]).filter((day) => day !== undefined) : [],
    dailyStartTime: values.dailyStartTime,
    dailyEndTime: values.dailyEndTime,
    admin: { username: values.adminUsername?.trim() ?? '', password: values.adminPassword || null },
  }
}

export async function createEvent(values: EventFormValues): Promise<CreateEventResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toCreateEventPayload(values)),
  })
  const body = await response.json() as CreateEventResponse
  if (!response.ok || !body.isSuccess || !body.value) throw new Error(body.message || 'Unable to create event.')
  return body
}
