import { t, type MessageKey } from '@/shared/i18n'
import type { DayOfWeek } from '@/shared/types'

/** Độ dài một ô lưới; khớp `InputLimits.SlotMinutes` bên BE */
export const SLOT_MINUTES = 15

/** `Events.EventType` bên BE */
export const EventType = {
  Dates: 1,
  Weekdays: 2,
} as const

/** `Events.EventStatus` bên BE */
export const EventStatus = {
  Open: 1,
  Finalized: 2,
  Closed: 3,
} as const

/** Giới hạn input; khớp `InputLimits` bên BE */
export const INPUT_LIMITS = {
  titleMaxLength: 255,
  usernameMinLength: 2,
  usernameMaxLength: 50,
  passwordMinLength: 4,
  passwordMaxLength: 100,
} as const

export interface WeekdayInfo {
  value: DayOfWeek
  label: string
  shortLabel: string
}

/** Đánh số theo JS `Date.getDay()` và BE: 0 = Chủ nhật; nhãn theo ngôn ngữ hiện tại */
export const WEEKDAYS: readonly WeekdayInfo[] = ([0, 1, 2, 3, 4, 5, 6] as const).map((value) => ({
  value,
  // Getter để nhãn luôn theo ngôn ngữ đang chọn
  get label() {
    return t(`weekday.${value}` as MessageKey)
  },
  get shortLabel() {
    return t(`weekdayShort.${value}` as MessageKey)
  },
}))

/** Thứ tự hiển thị: Thứ Hai đầu tuần */
export const WEEKDAYS_MONDAY_FIRST: readonly WeekdayInfo[] = [1, 2, 3, 4, 5, 6, 0].map(
  (day) => WEEKDAYS[day],
)

/** Hạng của một thứ khi xếp từ Thứ Hai tới Chủ nhật */
export const weekdayRank = (day: number) => (day + 6) % 7
