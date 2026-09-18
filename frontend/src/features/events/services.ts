import axios from 'axios'

import type {
  CreateEventRequest,
  CreateEventResponse,
  EventFormValues,
  UpdateEventRequest,
  UpdateEventResponse,
} from './types'

export type CreateEventPayload = CreateEventRequest

const WEEKDAY_CODES: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}
const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? ''

export function toCreateEventPayload(values: EventFormValues): CreateEventPayload {
  return {
    title: values.title.trim(),
    eventType: values.eventType,
    availableDates: values.eventType === 1 ? values.availableDates : [],
    availableWeekdays:
      values.eventType === 2
        ? values.availableDates
            .map((day) => WEEKDAY_CODES[day])
            .filter((day) => day !== undefined)
        : [],
    dailyStartTime: values.dailyStartTime,
    dailyEndTime: values.dailyEndTime,
    admin: {
      username: values.adminUsername?.trim() ?? '',
      password: values.adminPassword || null,
    },
  }
}

export async function createEvent(values: EventFormValues): Promise<CreateEventResponse> {
  const response = await axios.post<CreateEventResponse>(`${API_BASE_URL}/api/v1/events`, toCreateEventPayload(values), {
    headers: { 'Content-Type': 'application/json' },
    validateStatus: () => true,
  })
  const body = response.data
  if (response.status !== 201 || !body?.isSuccess || !body.value) {
    throw new Error(body?.message || `Unable to create event (${response.status}).`)
  }
  return body
}

export function toUpdateEventPayload(values: EventFormValues): UpdateEventRequest {
  return {
    title: values.title.trim(),
    eventType: values.eventType,
    availableDates: values.eventType === 1 ? values.availableDates : [],
    availableWeekdays:
      values.eventType === 2
        ? values.availableDates
            .map((day) => WEEKDAY_CODES[day])
            .filter((day) => day !== undefined)
        : [],
    dailyStartTime: values.dailyStartTime,
    dailyEndTime: values.dailyEndTime,
  }
}

export async function updateEvent(
  shortCode: string,
  values: EventFormValues,
  accessToken: string,
): Promise<UpdateEventResponse['value']> {
  const response = await axios.put<UpdateEventResponse>(
    `${API_BASE_URL}/api/v1/events/${encodeURIComponent(shortCode)}`,
    toUpdateEventPayload(values),
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    },
  )
  const body = response.data
  if (response.status !== 200 || !body?.isSuccess || body.code !== 200 || !body.value) {
    throw new Error(body?.message || `Unable to update event (${response.status}).`)
  }
  return body.value
}
