import type {
  ParticipantRequest,
  ParticipantResponse,
  EventScheduleConfig,
  SaveAvailabilityRequest,
  SaveAvailabilityResponse,
  ScheduleDateMode,
} from '@/features/participants/types';

/**
 * MOCK SERVICE LAYER
 * -------------------------------------------------------------------------
 * CHỈ chứa các hàm gọi API (thật ra là giả lập gọi API - xem `delay`).
 * Toàn bộ hàm dưới đây giả lập độ trễ mạng (500ms) và trả về dữ liệu mẫu.
 * Khi Backend sẵn sàng: chỉ cần thay phần thân hàm bằng lệnh gọi `axios`
 * thật (đã cấu hình sẵn ở `@/lib/axios`), giữ nguyên chữ ký hàm (tên,
 * tham số, kiểu trả về) để không phải sửa các hook/component đang dùng.
 *
 * Các hàm xử lý lưới thời gian (không gọi API) nằm ở `./gridUtils.ts`.
 */

const MOCK_DELAY_MS = 500;

function delay<T>(value: T, ms: number = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Id sự kiện mock - thực tế sẽ lấy từ route param (VD: /events/:eventId) */
const MOCK_EVENT_ID = 'evt_mock_001';

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * QUAN TRỌNG: `dates` của 1 event KHÔNG phải do FE tự suy ra theo công thức
 * cố định (VD: "5 ngày liên tiếp kể từ hôm nay") - nó phải là ĐÚNG những gì
 * admin đã chọn lúc tạo event (xem backend: `Events.EventType` = Dates/Weekdays,
 * mỗi lựa chọn của admin lưu thành 1 dòng `EventAvailableDates.SpecificDate`
 * hoặc `.DayOfWeek`). Với kiểu Dates, admin có thể chọn NHIỀU NGÀY RỜI RẠC,
 * KHÔNG LIÊN TỤC, trải dài tới cả tháng; với kiểu Weekdays, admin có thể chỉ
 * chọn MỘT VÀI thứ trong tuần (không nhất thiết đủ 7 ngày). Vì FE hiện chưa
 * có API tạo event thật, 2 hàm dưới đây cố tình mock dữ liệu "khó" (rời rạc,
 * không liên tục, không đủ 7 ngày) thay vì "N ngày liên tiếp"/"cả 7 ngày" -
 * để chứng minh PersonalScheduleGrid render ĐÚNG BẤT KỲ danh sách `dates`
 * nào được truyền vào, không ngầm giả định số lượng hay tính liên tục.
 */

/** VD minh hoạ: admin chọn 6 ngày rời rạc, cách quãng không đều, trải dài ~1 tháng */
const MOCK_ADMIN_SPECIFIC_DATE_OFFSETS = [0, 3, 9, 16, 22, 29];

function buildSpecificDates(): string[] {
  const today = new Date();
  return MOCK_ADMIN_SPECIFIC_DATE_OFFSETS.map((offsetDays) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return formatDateISO(d);
  });
}

/** VD minh hoạ: admin chỉ chọn Thứ 2, Thứ 4, Thứ 6 - không phải cả 7 ngày */
const MOCK_ADMIN_WEEKDAY_OFFSETS_FROM_MONDAY = [0, 2, 4];

/**
 * Quy các thứ admin chọn thành ngày thật của 1 tuần bất kỳ (tuần hiện tại),
 * theo ĐÚNG THỨ TỰ Thứ 2 -> CN. Lịch lặp lại hàng tuần nên tuần cụ thể nào
 * không quan trọng; vẫn cần ngày thật (không chỉ label) để tái dùng chung
 * logic sinh slot id với SPECIFIC_DATES - xem comment ở `EventScheduleConfig.dates`.
 */
function buildDaysOfWeekDates(): string[] {
  const today = new Date();
  const currentWeekday = today.getDay(); // 0 = CN, 1 = Th2, ..., 6 = Th7
  const daysSinceMonday = currentWeekday === 0 ? 6 : currentWeekday - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysSinceMonday);

  return MOCK_ADMIN_WEEKDAY_OFFSETS_FROM_MONDAY.map((mondayOffset) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + mondayOffset);
    return formatDateISO(d);
  });
}

/** Tạo cấu hình lưới mock: 09:00 - 21:00, mỗi ô 15 phút, dates theo đúng dateMode */
function buildMockScheduleConfig(dateMode: ScheduleDateMode): EventScheduleConfig {
  return {
    eventId: MOCK_EVENT_ID,
    eventName: dateMode === 'DAYS_OF_WEEK' ? 'Meeting Schedule (every week)' : 'Meeting Schedule',
    dateMode,
    dates: dateMode === 'DAYS_OF_WEEK' ? buildDaysOfWeekDates() : buildSpecificDates(),
    startHour: 9,
    endHour: 21,
    slotMinutes: 15,
  };
}

/* ------------------------------------------------------------------ */
/* 1. Access - đăng nhập định danh participant                        */
/* ------------------------------------------------------------------ */
export async function accessParticipant(payload: ParticipantRequest): Promise<ParticipantResponse> {
  // Participant mới (hoặc chưa từng điền lịch) luôn bắt đầu với lịch RỖNG -
  // không tự tô sẵn dữ liệu giả, tránh gây hiểu lầm là dữ liệu thật đã lưu.
  return delay({
    participantId: `p_${payload.username.trim().toLowerCase()}`,
    username: payload.username.trim(),
    token: `mock-token-${Date.now()}`,
    freeSlotIds: [],
  });

  // Khi có BE:
  // const { data } = await api.post<AccessParticipantResponse>("/participants/access", payload)
  // return data
}

/* ------------------------------------------------------------------ */
/* 2. Lấy cấu hình lưới thời gian của sự kiện                         */
/* ------------------------------------------------------------------ */
/**
 * @param dateMode CHỈ dùng cho mock/demo (xem `ScheduleDateMode`) - thực tế BE
 * sẽ tự trả về đúng dateMode của event, FE không cần truyền lên.
 */
export async function fetchEventScheduleConfig(
  dateMode: ScheduleDateMode = 'SPECIFIC_DATES',
): Promise<EventScheduleConfig> {
  return delay(buildMockScheduleConfig(dateMode));

  // Khi có BE:
  // const { data } = await api.get<EventScheduleConfig>(`/events/${eventId}/schedule-config`)
  // return data
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
  void eventShortCode; // chưa dùng ở bản mock - giữ lại để khớp chữ ký API thật
  void payload;

  return delay({ revision: Date.now() });

  // Khi có BE:
  // const { data } = await api.put<ApiResponse<SaveAvailabilityResponse>>(
  //   `/api/v1/events/${eventShortCode}/participants/me/availability`,
  //   payload
  // )
  // return data.value!
}

/*
 * Heatmap tổng của cả nhóm (GET /events/{eventId}/heatmap) KHÔNG thuộc scope
 * của feature này - do phần khác trong team đảm nhận (xem OverviewMockup),
 * nên không mock ở đây nữa.
 */
