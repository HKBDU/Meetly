import { z } from 'zod'

import { timeToMinutes } from '@/lib/date-time'
import { EventType, INPUT_LIMITS } from '@/shared/constants'
import type { EventFieldsRequest } from '@/shared/api/events'
import type { DayOfWeek, EditableEvent } from '@/shared/types'

/** Tối đa ~2 tháng ngày cụ thể; khớp `InputLimits.MaxAvailableDates` bên BE */
export const MAX_AVAILABLE_DATES = 62

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty.')
      .max(INPUT_LIMITS.titleMaxLength, `Title must be at most ${INPUT_LIMITS.titleMaxLength} characters.`),
    eventType: z.union([z.literal(EventType.Dates), z.literal(EventType.Weekdays)]),
    /** "YYYY-MM-DD", dùng khi eventType = Dates */
    dates: z.array(z.string()).max(MAX_AVAILABLE_DATES, `Select at most ${MAX_AVAILABLE_DATES} dates.`),
    /** 0 = CN ... 6 = T7, dùng khi eventType = Weekdays */
    weekdays: z.array(z.number().int().min(0).max(6)),
    dailyStartTime: z.string().min(1, 'Please select a start time.'),
    dailyEndTime: z.string().min(1, 'Please select an end time.'),
  })
  .superRefine((data, ctx) => {
    if (data.eventType === EventType.Dates && data.dates.length === 0)
      ctx.addIssue({ code: 'custom', path: ['dates'], message: 'Please select at least one date.' })
    if (data.eventType === EventType.Weekdays && data.weekdays.length === 0)
      ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Please select at least one weekday.' })
    if (!(timeToMinutes(data.dailyStartTime) < timeToMinutes(data.dailyEndTime)))
      ctx.addIssue({ code: 'custom', path: ['dailyEndTime'], message: 'End time must be later than start time.' })
  })

export type EventFormValues = z.infer<typeof eventFormSchema>

export const credentialsSchema = z.object({
  adminUsername: z
    .string()
    .trim()
    .min(1, 'Username is required.')
    .max(INPUT_LIMITS.usernameMaxLength, `Username must be at most ${INPUT_LIMITS.usernameMaxLength} characters.`),
  // BE bắt buộc mật khẩu admin để không ai mạo danh admin chỉ bằng username
  adminPassword: z
    .string()
    .min(INPUT_LIMITS.passwordMinLength, `Password must be at least ${INPUT_LIMITS.passwordMinLength} characters.`)
    .max(INPUT_LIMITS.passwordMaxLength, `Password must be at most ${INPUT_LIMITS.passwordMaxLength} characters.`),
})

export type CredentialsFormValues = z.infer<typeof credentialsSchema>

export const DEFAULT_EVENT_VALUES: EventFormValues = {
  title: '',
  eventType: EventType.Weekdays,
  dates: [],
  weekdays: [1],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
}

/** Chỉ gửi ngày hoặc thứ theo loại event; BE từ chối nếu gửi cả hai */
export function toEventFields(values: EventFormValues): EventFieldsRequest {
  const isDates = values.eventType === EventType.Dates
  return {
    title: values.title.trim(),
    eventType: values.eventType,
    availableDates: isDates ? [...values.dates].sort() : [],
    availableWeekdays: isDates ? [] : ([...values.weekdays].sort() as DayOfWeek[]),
    dailyStartTime: values.dailyStartTime,
    dailyEndTime: values.dailyEndTime,
  }
}

export function toFormValues(event: EditableEvent): EventFormValues {
  return {
    title: event.title,
    eventType: event.eventType,
    dates: event.availableDates,
    weekdays: event.availableWeekdays,
    dailyStartTime: event.dailyStartTime.slice(0, 5),
    dailyEndTime: event.dailyEndTime.slice(0, 5),
  }
}
