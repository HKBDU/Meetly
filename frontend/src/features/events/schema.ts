import { z } from 'zod'

import { timeToMinutes } from '@/lib/date-time'
import { EventType, INPUT_LIMITS } from '@/shared/constants'
import { t, type MessageKey, type TranslateParams } from '@/shared/i18n'
import type { EventFieldsRequest } from '@/shared/api/events'
import type { DayOfWeek, EditableEvent } from '@/shared/types'

/** Tối đa ~2 tháng ngày cụ thể; khớp `InputLimits.MaxAvailableDates` bên BE */
export const MAX_AVAILABLE_DATES = 62

/** Câu lỗi tính lúc kiểm tra (không phải lúc nạp module) để theo ngôn ngữ đang chọn */
const msg = (key: MessageKey, params?: TranslateParams) => ({ error: () => t(key, params) })

const eventFields = z.object({
  title: z
    .string()
    .trim()
    .min(1, msg('validation.nameRequired'))
    .max(INPUT_LIMITS.titleMaxLength, msg('validation.nameMax', { max: INPUT_LIMITS.titleMaxLength })),
  eventType: z.union([z.literal(EventType.Dates), z.literal(EventType.Weekdays)]),
  /** "YYYY-MM-DD", dùng khi eventType = Dates */
  dates: z.array(z.string()).max(MAX_AVAILABLE_DATES, msg('validation.datesMax', { max: MAX_AVAILABLE_DATES })),
  /** 0 = CN ... 6 = T7, dùng khi eventType = Weekdays */
  weekdays: z.array(z.number().int().min(0).max(6)),
  dailyStartTime: z.string().min(1, msg('validation.startRequired')),
  dailyEndTime: z.string().min(1, msg('validation.endRequired')),
})

const hostFields = z.object({
  adminUsername: z
    .string()
    .trim()
    .min(1, msg('validation.yourNameRequired'))
    .max(INPUT_LIMITS.usernameMaxLength, msg('validation.nameMax', { max: INPUT_LIMITS.usernameMaxLength })),
  // BE bắt buộc mật khẩu admin để không ai mạo danh admin chỉ bằng username
  adminPassword: z
    .string()
    .min(INPUT_LIMITS.passwordMinLength, msg('validation.passwordMin', { min: INPUT_LIMITS.passwordMinLength }))
    .max(INPUT_LIMITS.passwordMaxLength, msg('validation.passwordMax', { max: INPUT_LIMITS.passwordMaxLength })),
})

function refineEvent(data: z.infer<typeof eventFields>, ctx: z.RefinementCtx) {
  if (data.eventType === EventType.Dates && data.dates.length === 0)
    ctx.addIssue({ code: 'custom', path: ['dates'], message: t('validation.pickDate') })
  if (data.eventType === EventType.Weekdays && data.weekdays.length === 0)
    ctx.addIssue({ code: 'custom', path: ['weekdays'], message: t('validation.pickWeekday') })
  if (!(timeToMinutes(data.dailyStartTime) < timeToMinutes(data.dailyEndTime)))
    ctx.addIssue({ code: 'custom', path: ['dailyEndTime'], message: t('validation.endAfterStart') })
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

/** Khung giờ chọn nhanh; `labelKey` là khoá dịch */
export const HOUR_PRESETS = [
  { labelKey: 'preset.working', start: '09:00', end: '17:00' },
  { labelKey: 'preset.morning', start: '08:00', end: '12:00' },
  { labelKey: 'preset.afternoon', start: '13:00', end: '17:00' },
  { labelKey: 'preset.evening', start: '18:00', end: '22:00' },
] as const satisfies readonly { labelKey: MessageKey; start: string; end: string }[]

/** Thứ chọn nhanh (0 = CN) */
export const WEEKDAY_PRESETS = [
  { labelKey: 'preset.monFri', days: [1, 2, 3, 4, 5] },
  { labelKey: 'preset.weekend', days: [0, 6] },
  { labelKey: 'preset.everyDay', days: [0, 1, 2, 3, 4, 5, 6] },
] as const satisfies readonly { labelKey: MessageKey; days: readonly number[] }[]

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
