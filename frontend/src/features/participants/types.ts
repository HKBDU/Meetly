export type ParticipantView = 'AUTH' | 'OVERVIEW' | 'PERSONAL';

export type PaintMode = 'FREE' | 'BUSY';

export const PAINT_MODE_LABEL: Record<PaintMode, string> = {
  FREE: 'availability',
  BUSY: 'busy time',
};

/** Khớp `Events.EventType` bên BE (Dates=1, Weekdays=2); do admin chọn khi tạo event */
export type ScheduleDateMode = 'SPECIFIC_DATES' | 'DAYS_OF_WEEK';

export interface ParticipantRequest {
  username: string;
  password?: string;
}

/** Một khoảng thời gian liên tục đã lưu; bung thành slotId bằng `expandTimeSlotRangesToIds` */
export interface TimeSlotRangeResponse {
  /** "YYYY-MM-DD", có khi dateMode = SPECIFIC_DATES */
  specificDate: string | null;
  /** 0 = CN...6 = Th7, có khi dateMode = DAYS_OF_WEEK */
  dayOfWeek: number | null;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

/** Khớp `ParticipantAccessResponse` bên BE */
export interface ParticipantResponse {
  participantId: string;
  username: string;
  isAdmin: boolean;
  isNewParticipant: boolean;
  accessToken: string;
  eventStatus: number;
  revision: number;
  timeSlots: TimeSlotRangeResponse[];
}

export interface ParticipantAuthInfo {
  /** Event mà token này thuộc về */
  shortCode: string;
  participantId: string;
  username: string;
  isAdmin: boolean;
  accessToken: string;
}

export interface EventScheduleConfig {
  /** Route param của BE, không phải GUID `Events.Id` */
  shortCode: string;
  eventName: string;
  dateMode: ScheduleDateMode;
  /**
   * Danh sách ngày "YYYY-MM-DD" theo thứ tự cột, do admin chọn nên có thể rời
   * rạc và độ dài bất kỳ. Với DAYS_OF_WEEK là các ngày của tuần hiện tại
   * (xem `resolveDaysOfWeekDates`) để dùng chung cách sinh slot id.
   */
  dates: string[];
  startHour: number;
  endHour: number;
  slotMinutes: number;
  /** `Events.EventStatus`: Open=1, Finalized=2, Closed=3 */
  status: number;
}

export interface TimeSlot {
  /** `${date}T${time}`, dùng làm key và id gửi API */
  id: string;
  date: string;
  time: string;
}

/** Khớp `TimeSlotsRequest` bên BE; các ô liền kề được gộp bằng `mergeFreeSlotIdsIntoRanges` */
export interface TimeSlotRangeRequest {
  /** "YYYY-MM-DD", loại trừ với `dayOfWeek` */
  specificDate?: string;
  /** 0 = CN...6 = Th7 */
  dayOfWeek?: number;
  /** "HH:mm", phải nhỏ hơn `endTime` */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
}

/** Khớp `SetAvailabilityRequest` bên BE; participantId lấy từ JWT, eventId từ URL */
export interface SaveAvailabilityRequest {
  /** Email nhận thông báo chốt lịch; BE nhận chung với request này và REPLACE toàn bộ lịch */
  email?: string;
  timeSlots: TimeSlotRangeRequest[];
}

export interface SaveAvailabilityResponse {
  revision: number;
}

export interface EventFinalizedPayload {
  finalizedAt: string;
  message: string;
  finalizedSlotIds: string[];
}
