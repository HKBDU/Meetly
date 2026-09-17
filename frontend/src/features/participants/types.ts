/** 3 màn hình chính của luồng participant, do ParticipantPage điều phối */
export type ParticipantView = 'AUTH' | 'OVERVIEW' | 'PERSONAL';

export type PaintMode = 'FREE' | 'BUSY';

/** Nhãn hiển thị cho từng `PaintMode` - khai báo 1 lần, dùng chung mọi nơi cần hiện text (thay vì so sánh chuỗi lặp lại ở từng component). */
export const PAINT_MODE_LABEL: Record<PaintMode, string> = {
  FREE: 'availability',
  BUSY: 'busy time',
};

/**
 * Kiểu lịch của sự kiện (giống When2Meet):
 * - SPECIFIC_DATES: chọn các ngày cụ thể trên lịch (VD: 12/09, 13/09...)
 * - DAYS_OF_WEEK: chọn theo thứ trong tuần, lặp lại hàng tuần (VD: Thứ 2, Thứ 3...),
 *   không gắn với ngày cụ thể nào.
 * Do tổ chức sự kiện (organizer) chọn khi tạo event (feature khác đảm nhận) -
 * participant chỉ xem theo đúng kiểu BE đã trả về trong `EventScheduleConfig`,
 * không tự chọn được (khớp `Meetly.Repository.Enum.EventType`: Dates=1, Weekdays=2).
 */
export type ScheduleDateMode = 'SPECIFIC_DATES' | 'DAYS_OF_WEEK';

/* Access (định danh participant) */

export interface ParticipantRequest {
  username: string;
  password?: string;
}

/**
 * Khớp `TimeSlotsRequest`/`ParticipantTimeSlotResponse` bên BE khi đọc VỀ (GET/access) -
 * MỘT OBJECT = MỘT KHOẢNG THỜI GIAN LIÊN TỤC đã lưu trước đó, không phải từng
 * ô rời rạc. Dùng `expandTimeSlotRangesToIds` (gridUtils.ts) để bung ngược
 * thành tập slotId rời rạc mà lưới (`selectedSlotIds`) cần.
 */
export interface TimeSlotRangeResponse {
  /** "YYYY-MM-DD" - có giá trị khi dateMode = SPECIFIC_DATES */
  specificDate: string | null;
  /** 0 = CN...6 = Th7 - có giá trị khi dateMode = DAYS_OF_WEEK */
  dayOfWeek: number | null;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

/** Khớp `ParticipantAccessResponse` bên BE (`POST .../participants/access`) */
export interface ParticipantResponse {
  participantId: string;
  username: string;
  isAdmin: boolean;
  isNewParticipant: boolean;
  accessToken: string;
  eventStatus: number;
  revision: number;
  /** Lịch rảnh đã lưu từ trước, nếu participant này đã từng điền (participant mới -> mảng rỗng) */
  timeSlots: TimeSlotRangeResponse[];
}

export interface ParticipantAuthInfo {
  participantId: string;
  username: string;
  accessToken: string;
}

/* Cấu hình lưới thời gian của sự kiện - suy ra từ `EventResponse` (GET /events/{shortCode}) */

export interface EventScheduleConfig {
  /** Route param định danh event (`GET/POST /events/{shortCode}/...`) - KHÔNG phải GUID `Events.Id` */
  shortCode: string;
  eventName: string;
  /** SPECIFIC_DATES hay DAYS_OF_WEEK - quyết định cách hiển thị header cột (xem PersonalScheduleGrid) */
  dateMode: ScheduleDateMode;
  /**
   * Danh sách ngày dạng "YYYY-MM-DD", theo đúng thứ tự hiển thị cột - ĐÂY LÀ
   * DỮ LIỆU ĐỘNG do ADMIN chọn lúc tạo event (backend: mỗi lựa chọn của admin
   * là 1 dòng `EventAvailableDates.SpecificDate`/`.DayOfWeek`), KHÔNG PHẢI
   * công thức FE tự suy ra. Participant chỉ hiển thị lại đúng danh sách này -
   * component lưới (PersonalScheduleGrid) phải render đúng với BẤT KỲ độ dài
   * và thứ tự nào của mảng, không được giả định số lượng cố định hay các
   * ngày liên tiếp nhau:
   *   - dateMode = SPECIFIC_DATES: có thể là các ngày RỜI RẠC, không liên
   *     tục, trải dài tới cả tháng (VD: admin chọn 12/09, 15/09, 21/09...).
   *   - dateMode = DAYS_OF_WEEK: có thể chỉ là MỘT VÀI thứ trong tuần, không
   *     nhất thiết đủ 7 ngày (VD: admin chỉ chọn Thứ 2, Thứ 4, Thứ 6). Mảng
   *     vẫn chứa ngày thật (không chỉ tên thứ, quy về tuần hiện tại - xem
   *     `resolveDaysOfWeekDates` trong services.ts) để dùng chung 1 logic
   *     sinh slot id với SPECIFIC_DATES - dateMode chỉ đổi NHÃN hiển thị trên
   *     header (ẩn phần ngày/tháng cụ thể, chỉ hiện tên thứ).
   */
  dates: string[];
  /** Giờ bắt đầu / kết thúc trong ngày, theo hệ 24h - BE hiện luôn trả `dailyStartTime`/`dailyEndTime` tròn giờ */
  startHour: number;
  endHour: number;
  /** Độ dài mỗi ô lưới, tính bằng phút - lựa chọn hiển thị của FE, BE không ràng buộc granularity này */
  slotMinutes: number;
  /** `Meetly.Repository.Enum.EventStatus`: Open=1, Finalized=2, Closed=3 - dùng để biết lịch đã bị chốt ngay từ lúc tải, không cần đợi SignalR */
  status: number;
}

/** Một ô thời gian trong lưới (1 ngày x 1 khung giờ) */
export interface TimeSlot {
  /** Định danh duy nhất, dạng `${date}T${time}`, dùng làm key & id gửi API */
  id: string;
  date: string;
  time: string;
}

/* Save Availability (auto-save khi nhả chuột) */

/**
 * Khớp `Meetly.Contract.DTOs.Participants.TimeSlotsRequest` bên BE. MỘT
 * OBJECT = MỘT KHOẢNG THỜI GIAN LIÊN TỤC (không phải từng ô 15 phút rời rạc)
 * - xem `mergeFreeSlotIdsIntoRanges` trong gridUtils.ts để hiểu cách gộp các
 * ô liền kề trên lưới thành các khoảng start-end trước khi gửi lên đây.
 */
export interface TimeSlotRangeRequest {
  /** "YYYY-MM-DD" - có giá trị khi dateMode = SPECIFIC_DATES (loại trừ lẫn nhau với dayOfWeek) */
  specificDate?: string;
  /** 0 = CN...6 = Th7 - khớp enum `DayOfWeek` bên BE (và trùng luôn với JS `Date.getDay()`) - có giá trị khi dateMode = DAYS_OF_WEEK */
  dayOfWeek?: number;
  /** "HH:mm" - BE validate startTime phải nhỏ hơn endTime */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

/**
 * Khớp `SetAvailabilityRequest` bên BE - gửi kèm
 * `PUT /api/v1/events/{shortCode}/participants/me/availability`.
 * participantId lấy từ JWT (claim "participantId"), eventId nằm trên URL
 * (route param `shortCode`) - CẢ HAI đều KHÔNG nằm trong body này.
 */
export interface SaveAvailabilityRequest {
  /**
   * Email nhận thông báo khi lịch được chốt - BE nhận email CHUNG với request
   * này, KHÔNG có endpoint đăng ký email riêng (xem `EmailPromptDialog` - gửi
   * lại nguyên lịch hiện tại kèm email vì BE dùng REPLACE, không có endpoint riêng).
   */
  email?: string;
  timeSlots: TimeSlotRangeRequest[];
}

/** Khớp `UpdateAvailabilityResponse` bên BE (nằm trong field `value` của `ApiResponse<T>`) */
export interface SaveAvailabilityResponse {
  revision: number;
}

/* SignalR payloads */

/**
 * Heatmap tổng của cả nhóm (event "HeatmapUpdated") KHÔNG thuộc scope của
 * feature này - do phần khác trong team đảm nhận (xem OverviewMockup), nên
 * không định nghĩa kiểu cho nó ở đây nữa.
 */

/** Payload của event "EventFinalized" - lịch họp đã được chốt */
export interface EventFinalizedPayload {
  finalizedAt: string;
  message: string;
  /** Khung giờ cuối cùng được chốt (nếu BE trả về) */
  finalizedSlotIds: string[];
}

/** Bảng ánh xạ tên event SignalR -> kiểu payload tương ứng, dùng cho hub mock */
export interface ParticipantHubEventMap {
  EventFinalized: EventFinalizedPayload;
}

export type ParticipantHubEventName = keyof ParticipantHubEventMap;
