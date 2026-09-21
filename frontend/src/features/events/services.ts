import { api, getApiErrorMessage } from '@/lib/axios'

import type {
  CreateEventRequest,
  CreatedEvent,
  EventFormValues,
  UpdateEventRequest,
} from './types'

const WEEKDAY_CODES: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

function toEventFields(values: EventFormValues): UpdateEventRequest {
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

export const toUpdateEventPayload = toEventFields

export function toCreateEventPayload(values: EventFormValues): CreateEventRequest {
  return {
    ...toEventFields(values),
    admin: {
      username: values.adminUsername?.trim() ?? '',
      password: values.adminPassword || null,
    },
  }
}

export async function createEvent(values: EventFormValues): Promise<CreatedEvent> {
  try {
    const { data } = await api.post<CreatedEvent>('/events', toCreateEventPayload(values))
    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to create the event. Please try again.'), {
      cause: error,
    })
  }
}
