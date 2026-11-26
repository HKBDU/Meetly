import { EventType } from '@/shared/constants'
import type { EventDetail } from '@/shared/types'
import type { TimeColumn, TimeRow } from '@/shared/grid/model'
import { addIsoDays, busyToFreeSlotIds, todayInTimeZone, type BusyInterval } from '@/features/participants/busyImport'

/**
 * Hỏi Google Calendar giờ bận của người dùng (freeBusy) cho đúng khoảng ngày của event.
 * Chỉ nhận access token có sẵn; việc xin token (scope `calendar.freebusy`) nằm ở `lib/google.ts`.
 * Gọi thẳng từ trình duyệt tới Google, không đi qua server Meetly.
 */

const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy'

/** Scope chỉ xem giờ bận/rảnh, không đọc được tiêu đề hay nội dung lịch */
export const FREEBUSY_SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy'

/** Xin access token Google cho một scope (mở popup cấp quyền nếu cần); từ chối hoặc lỗi thì reject */
export type GoogleTokenProvider = (scope: string) => Promise<string>

/**
 * Nguồn token cho nút "Nhập từ Google Calendar". Đang `null` nên nút bị ẩn.
 * TODO: khi `lib/google.ts` (Google Identity Services) được merge, gán bằng hàm xin token ở đó,
 * và để `null` khi không có `VITE_GOOGLE_CLIENT_ID`.
 */
export const googleCalendarTokenProvider: GoogleTokenProvider | null = null

/** Event lặp theo tuần không có ngày thật: lấy số tuần tới tính từ hôm nay làm tham chiếu */
export const WEEKLY_REFERENCE_WEEKS = 2

export interface FreeBusyWindow {
  /** RFC 3339, theo UTC */
  timeMin: string
  timeMax: string
  /** Chỉ có với event lặp tuần: các ngày thật dùng làm tham chiếu */
  weeklyDates?: string[]
}

type WindowSource = Pick<EventDetail, 'eventType' | 'availableDates' | 'availableWeekdays' | 'timezone'>

const paddedRange = (firstDate: string, lastDate: string) => ({
  timeMin: `${addIsoDays(firstDate, -1)}T00:00:00Z`,
  timeMax: `${addIsoDays(lastDate, 2)}T00:00:00Z`,
})

/**
 * Khoảng thời gian cần hỏi Google. Lấy rộng thêm 1 ngày mỗi bên theo UTC để khỏi phải quy đổi
 * múi giờ (các múi lệch UTC tối đa 14 giờ); phần thừa bị `busyToFreeSlotIds` lọc theo ngày và giờ của lưới.
 * Trả `null` khi event không có ngày hay thứ nào.
 */
export function buildFreeBusyWindow(event: WindowSource, now: Date = new Date()): FreeBusyWindow | null {
  if (event.eventType === EventType.Weekdays) {
    if (event.availableWeekdays.length === 0) return null
    const today = todayInTimeZone(event.timezone, now)
    const weeklyDates = Array.from({ length: WEEKLY_REFERENCE_WEEKS * 7 }, (_, index) => addIsoDays(today, index))
    return { ...paddedRange(weeklyDates[0], weeklyDates[weeklyDates.length - 1]), weeklyDates }
  }
  const dates = [...event.availableDates].sort()
  if (dates.length === 0) return null
  return paddedRange(dates[0], dates[dates.length - 1])
}

export type GoogleBusyErrorKind =
  /** Token sai hoặc hết hạn: xin token mới rồi thử lại */
  | 'unauthorized'
  /** Không đủ quyền hoặc Google chặn (VD vượt hạn mức) */
  | 'forbidden'
  /** Google trả lỗi riêng cho lịch chính (VD không đọc được lịch) */
  | 'calendar'
  /** Không kết nối được Google */
  | 'network'
  | 'unknown'

export class GoogleBusyError extends Error {
  readonly kind: GoogleBusyErrorKind

  constructor(kind: GoogleBusyErrorKind) {
    super(`Google Calendar freeBusy failed: ${kind}`)
    this.name = 'GoogleBusyError'
    this.kind = kind
  }
}

interface FreeBusyResponse {
  calendars?: {
    primary?: {
      busy?: unknown[]
      errors?: unknown[]
    }
  }
}

const isBusyInterval = (value: unknown): value is BusyInterval =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as BusyInterval).start === 'string' &&
  typeof (value as BusyInterval).end === 'string'

/** Gọi `freeBusy.query` cho lịch chính của người dùng; lỗi luôn ném `GoogleBusyError` (trừ khi bị huỷ qua `signal`) */
export async function queryFreeBusy(
  accessToken: string,
  window: Pick<FreeBusyWindow, 'timeMin' | 'timeMax'>,
  signal?: AbortSignal,
): Promise<BusyInterval[]> {
  let response: Response
  try {
    response = await fetch(FREEBUSY_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ timeMin: window.timeMin, timeMax: window.timeMax, items: [{ id: 'primary' }] }),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new GoogleBusyError('network')
  }

  if (response.status === 401) throw new GoogleBusyError('unauthorized')
  if (response.status === 403 || response.status === 429) throw new GoogleBusyError('forbidden')
  if (!response.ok) throw new GoogleBusyError('unknown')

  const data = (await response.json().catch(() => null)) as FreeBusyResponse | null
  const calendar = data?.calendars?.primary
  if (!calendar || (calendar.errors?.length ?? 0) > 0) throw new GoogleBusyError('calendar')
  return (calendar.busy ?? []).filter(isBusyInterval)
}

export interface FetchGoogleFreeSlotIdsInput {
  event: WindowSource
  grid: { columns: readonly TimeColumn[]; rows: readonly TimeRow[] }
  accessToken: string
  now?: Date
  signal?: AbortSignal
}

/** Hỏi Google rồi đổi ngay ra các ô rảnh của lưới, sẵn để mở bản nháp */
export async function fetchGoogleFreeSlotIds({
  event,
  grid,
  accessToken,
  now,
  signal,
}: FetchGoogleFreeSlotIdsInput): Promise<string[]> {
  const window = buildFreeBusyWindow(event, now)
  if (!window) return []
  const busy = await queryFreeBusy(accessToken, window, signal)
  return busyToFreeSlotIds({
    busy,
    columns: grid.columns,
    rows: grid.rows,
    timeZone: event.timezone,
    weeklyDates: window.weeklyDates,
  })
}
