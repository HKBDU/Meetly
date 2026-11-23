import { z } from 'zod'

import { timeToMinutes } from '@/lib/date-time'
import { EventType, INPUT_LIMITS } from '@/shared/constants'
import type { EventFieldsRequest } from '@/shared/api/events'
import type { DayOfWeek, EditableEvent } from '@/shared/types'

/** Tối đa ~2 tháng ngày cụ thể; khớp `InputLimits.MaxAvailableDates` bên BE */
export const MAX_AVAILABLE_DATES = 62

const eventFields = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give your event a name.')
    .max(INPUT_LIMITS.titleMaxLength, `Name must be at most ${INPUT_LIMITS.titleMaxLength} characters.`),
  eventType: z.union([z.literal(EventType.Dates), z.literal(EventType.Weekdays)]),
  /** "YYYY-MM-DD", dùng khi eventType = Dates */
  dates: z.array(z.string()).max(MAX_AVAILABLE_DATES, `Select at most ${MAX_AVAILABLE_DATES} dates.`),
  /** 0 = CN ... 6 = T7, dùng khi eventType = Weekdays */
  weekdays: z.array(z.number().int().min(0).max(6)),
  dailyStartTime: z.string().min(1, 'Pick a start time.'),
  dailyEndTime: z.string().min(1, 'Pick an end time.'),
})

const hostFields = z.object({
  adminUsername: z
    .string()
    .trim()
    .min(1, 'Enter your name.')
    .max(INPUT_LIMITS.usernameMaxLength, `Name must be at most ${INPUT_LIMITS.usernameMaxLength} characters.`),
  // BE bắt buộc mật khẩu admin để không ai mạo danh admin chỉ bằng username
  adminPassword: z
    .string()
    .min(INPUT_LIMITS.passwordMinLength, `Use at least ${INPUT_LIMITS.passwordMinLength} characters.`)
    .max(INPUT_LIMITS.passwordMaxLength, `Use at most ${INPUT_LIMITS.passwordMaxLength} characters.`),
})

function refineEvent(data: z.infer<typeof eventFields>, ctx: z.RefinementCtx) {
  if (data.eventType === EventType.Dates && data.dates.length === 0)
    ctx.addIssue({ code: 'custom', path: ['dates'], message: 'Pick at least one date.' })
  if (data.eventType === EventType.Weekdays && data.weekdays.length === 0)
    ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Pick at least one day of the week.' })
  if (!(timeToMinutes(data.dailyStartTime) < timeToMinutes(data.dailyEndTime)))
    ctx.addIssue({ code: 'custom', path: ['dailyEndTime'], message: 'End time must be after the start time.' })
}

/** Sửa event (không có thông tin host) */
export const eventFormSchema = eventFields.superRefine(refineEvent)
export type EventFormValues = z.infer<typeof eventFormSchema>

/** Tạo event: thông tin event + tài khoản host trên cùng một trang */
export const createEventSchema = eventFields.extend(hostFields.shape).superRefine(refineEvent)
export type CreateEventFormValues = z.infer<typeof createEventSchema>

export const DEFAULT_EVENT_VALUES: EventFormValues = {
  title: '',
  eventType: EventType.Dates,
  dates: [],
  weekdays: [1, 2, 3, 4, 5],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
}

export const DEFAULT_CREATE_VALUES: CreateEventFormValues = {
  ...DEFAULT_EVENT_VALUES,
  adminUsername: '',
  adminPassword: '',
}

/** Khung giờ chọn nhanh */
export const HOUR_PRESETS = [
  { label: 'Working hours', start: '09:00', end: '17:00' },
  { label: 'Morning', start: '08:00', end: '12:00' },
  { label: 'Afternoon', start: '13:00', end: '17:00' },
  { label: 'Evening', start: '18:00', end: '22:00' },
] as const

/** Thứ chọn nhanh (0 = CN) */
export const WEEKDAY_PRESETS = [
  { label: 'Mon – Fri', days: [1, 2, 3, 4, 5] },
  { label: 'Weekend', days: [0, 6] },
  { label: 'Every day', days: [0, 1, 2, 3, 4, 5, 6] },
] as const

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
