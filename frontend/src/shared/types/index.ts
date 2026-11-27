/**
 * Model dùng chung cho một event, khớp response `GET /api/v1/events/{shortCode}`.
 * Đây là nguồn dữ liệu duy nhất cho cả heatmap lẫn lưới cá nhân (xem `useEventQuery`).
 */

export type EventType = 1 | 2
export type EventStatus = 1 | 2 | 3
/** 0 = Chủ nhật ... 6 = Thứ Bảy */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Participant {
  username: string
}

export interface HeatmapCellData {
  specificDate: string | null
  dayOfWeek: DayOfWeek | null
  /** "HH:mm" */
  startTime: string
  participants: string[]
  count: number
}

export interface FinalSchedule {
  specificDate: string | null
  dayOfWeek: DayOfWeek | null
  startTime: string
  endTime: string
}

export interface EventDetail {
  title: string
  shortCode: string
  url: string
  eventType: EventType
  timezone: string
  availableDates: string[]
  availableWeekdays: DayOfWeek[]
  /** "HH:mm" */
  dailyStartTime: string
  dailyEndTime: string
  status: EventStatus
  revision: number
  participants: Participant[]
  heatmapGrid: HeatmapCellData[]
  finalSchedule: FinalSchedule | null
  meetingUrl: string | null
}

/** Phần event mà admin sửa được qua `PUT /events/{shortCode}` */
export type EditableEvent = Pick<
  EventDetail,
  'title' | 'eventType' | 'availableDates' | 'availableWeekdays' | 'dailyStartTime' | 'dailyEndTime'
>
