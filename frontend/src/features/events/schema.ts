import type { EventFormValues, FieldErrors } from './types'
import { isValidTimeRange } from './utils/time.utils'

export function validateEventForm(values: EventFormValues): FieldErrors {
  const errors: FieldErrors = {}
  if (!values.title.trim()) errors.title = 'Event name is required.'
  if (!values.availableDates.length) errors.availableDates = values.eventType === 1 ? 'Choose at least one date.' : 'Choose at least one weekday.'
  if (!isValidTimeRange(values.dailyStartTime, values.dailyEndTime)) errors.dailyEndTime = 'End time must be later than start time.'
  return errors
}
