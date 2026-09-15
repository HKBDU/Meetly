import { api } from '@/lib/axios';
import type {
  EventScheduleConfig,
  ParticipantRequest,
  ParticipantResponse,
  SaveAvailabilityRequest,
  SaveAvailabilityResponse,
  ScheduleDateMode,
} from '@/features/participants/types';

/**
 * SERVICE LAYER - gọi API thật qua `@/lib/axios` (đã gắn sẵn Bearer token +
 * bóc `ApiResponse<T>.value`, xem interceptor ở đó). Chỉ chứa các hàm gọi API
 * + map response BE về đúng shape FE cần (`EventScheduleConfig`,
 * `ParticipantResponse`) - hàm xử lý lưới thời gian (không gọi API) nằm ở
 * `./gridUtils.ts`.
 */

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * `Events.EventType` bên BE (Dates=1, Weekdays=2) - đọc GHI CHÚ ở
 * `EventScheduleConfig.dateMode` để hiểu vì sao participant không tự chọn được.
 */
const EVENT_TYPE_TO_DATE_MODE: Record<number, ScheduleDateMode> = {
  1: 'SPECIFIC_DATES',
  2: 'DAYS_OF_WEEK',
};

/** "09:15" hoặc "09:15:30" -> 9 - BE luôn trả `dailyStartTime`/`dailyEndTime` tròn giờ nên chỉ cần lấy phần giờ */
function parseHour(hhmm: string): number {
  return Number(hhmm.slice(0, 2));
}

/**
 * Quy các thứ (0 = CN...6 = Th7) admin đã chọn thành ngày thật của TUẦN HIỆN
 * TẠI, theo đúng thứ tự Thứ 2 -> CN - lịch DAYS_OF_WEEK lặp lại hàng tuần nên
 * tuần cụ thể nào không quan trọng; vẫn cần ngày thật (không chỉ số thứ) để
 * tái dùng chung logic sinh slot id với SPECIFIC_DATES (xem comment ở
 * `EventScheduleConfig.dates`).
 */
function resolveDaysOfWeekDates(weekdays: number[]): string[] {
  const today = new Date();
  const currentWeekday = today.getDay(); // 0 = CN, 1 = Th2, ..., 6 = Th7
  const daysSinceMonday = currentWeekday === 0 ? 6 : currentWeekday - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  const weekdayOrderFromMonday = [1, 2, 3, 4, 5, 6, 0];
  return weekdayOrderFromMonday
    .filter((day) => weekdays.includes(day))
    .map((day) => {
      const mondayOffset = day === 0 ? 6 : day - 1;
      const d = new Date(monday);
      d.setDate(monday.getDate() + mondayOffset);
      return formatDateISO(d);
    });
}

/** Response thô của `GET /events/{shortCode}` - CHỈ khai báo field feature này thật sự dùng (heatmap/participants list thuộc scope khác) */
interface EventApiResponse {
  title: string;
  shortCode: string;
  eventType: number;
  availableDates: string[];
  availableWeekdays: number[];
  dailyStartTime: string;
  dailyEndTime: string;
  status: number;
}

/** Độ dài mỗi ô lưới hiển thị - lựa chọn UX của FE, BE không ràng buộc granularity của availability */
const SLOT_MINUTES = 15;

function toScheduleConfig(response: EventApiResponse): EventScheduleConfig {
  const dateMode = EVENT_TYPE_TO_DATE_MODE[response.eventType] ?? 'SPECIFIC_DATES';
  return {
    shortCode: response.shortCode,
    eventName: response.title,
    dateMode,
    dates:
      dateMode === 'DAYS_OF_WEEK'
        ? resolveDaysOfWeekDates(response.availableWeekdays)
        : response.availableDates,
    startHour: parseHour(response.dailyStartTime),
    endHour: parseHour(response.dailyEndTime),
    slotMinutes: SLOT_MINUTES,
    status: response.status,
  };
}

/* ------------------------------------------------------------------ */
/* 1. Access - đăng nhập định danh participant                        */
/* ------------------------------------------------------------------ */
export async function accessParticipant(
  shortCode: string,
  payload: ParticipantRequest,
): Promise<ParticipantResponse> {
  const { data } = await api.post<ParticipantResponse>(
    `/events/${shortCode}/participants/access`,
    payload,
  );
  return data;
}

/* ------------------------------------------------------------------ */
/* 2. Lấy cấu hình lưới thời gian của sự kiện                         */
/* ------------------------------------------------------------------ */
export async function fetchEventScheduleConfig(shortCode: string): Promise<EventScheduleConfig> {
  const { data } = await api.get<EventApiResponse>(`/events/${shortCode}`);
  return toScheduleConfig(data);
}

/* ------------------------------------------------------------------ */
/* 3. Lưu lịch rảnh (auto-save khi nhả chuột)                         */
/* ------------------------------------------------------------------ */
/**
 * @param eventShortCode Route param `shortCode` của BE (VD: /events/{shortCode}/...) -
 * KHÔNG phải GUID eventId. participantId không truyền ở đây vì BE lấy từ JWT.
 */
export async function saveAvailability(
  eventShortCode: string,
  payload: SaveAvailabilityRequest,
): Promise<SaveAvailabilityResponse> {
  const { data } = await api.put<SaveAvailabilityResponse>(
    `/events/${eventShortCode}/participants/me/availability`,
    payload,
  );
  return data;
}

/*
 * Heatmap tổng của cả nhóm (nằm sẵn trong `GET /events/{shortCode}`) KHÔNG thuộc scope
 * của feature này - do phần khác trong team đảm nhận (xem OverviewMockup),
 * nên không gọi ở đây nữa.
 */
