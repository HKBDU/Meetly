import type {
  EventScheduleConfig,
  PaintMode,
  ScheduleDateMode,
  TimeSlot,
  TimeSlotRangeRequest,
} from '@/features/participants/types';

/**
 * Hàm thuần (pure function) thao tác trên lưới thời gian - KHÔNG gọi API.
 * Tách riêng khỏi services.ts để file đó chỉ còn các hàm gọi API.
 */

/** Danh sách nhãn giờ trong 1 ngày, VD: ["09:00", "09:30", ..., "20:30"] */
export function getGridTimes(config: EventScheduleConfig): string[] {
  const times: string[] = [];
  const totalMinutes = (config.endHour - config.startHour) * 60;
  for (let m = 0; m < totalMinutes; m += config.slotMinutes) {
    const hour = config.startHour + Math.floor(m / 60);
    const minute = m % 60;
    times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return times;
}

export function getSlotId(date: string, time: string): string {
  return `${date}T${time}`;
}

const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long' });
const weekdayShortFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const monthDayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

/** "2026-09-14" -> { weekday: "Monday", weekdayShort: "Mon", dayMonth: "Sep 14" } - dùng cho header cột lưới */
export function formatDateLabel(
  dateISO: string,
): { weekday: string; weekdayShort: string; dayMonth: string } {
  const date = new Date(`${dateISO}T00:00:00`);
  return {
    weekday: weekdayFormatter.format(date),
    weekdayShort: weekdayShortFormatter.format(date).toUpperCase(),
    dayMonth: monthDayFormatter.format(date),
  };
}

/** Bung cấu hình lưới thành danh sách phẳng tất cả các slot (ngày x giờ) */
export function buildTimeSlots(config: EventScheduleConfig): TimeSlot[] {
  const times = getGridTimes(config);
  const slots: TimeSlot[] = [];
  for (const date of config.dates) {
    for (const time of times) {
      slots.push({ id: getSlotId(date, time), date, time });
    }
  }
  return slots;
}

/**
 * Diễn giải `selectedSlotIds` (tập ô đang TÔ, chưa chắc là "rảnh") thành
 * danh sách slotId RẢNH thật theo `paintMode` - dùng chung cho cả auto-save
 * (useAutoSaveSchedule) và lúc đăng ký email (EmailPromptDialog, xem comment
 * ở đó vì sao phải tính lại danh sách này khi gửi email).
 */
export function resolveFreeSlotIds(
  selectedSlotIds: Set<string>,
  paintMode: PaintMode,
  config: EventScheduleConfig,
): string[] {
  return paintMode === 'FREE'
    ? Array.from(selectedSlotIds)
    : buildTimeSlots(config)
        .map((slot) => slot.id)
        .filter((slotId) => !selectedSlotIds.has(slotId));
}

// luôn được gọi trước khi lưu, bất kể paintMode nào — mode FREE lấy thẳng
// tập đã tô, mode BUSY lấy phần bù (toàn bộ slot trừ đi tập đã tô). Cả useAutoSaveSchedule
// lẫn EmailPromptDialog đều đi qua đúng 1 hàm này trước khi gọi mergeFreeSlotIdsIntoRanges
// → BE luôn chỉ nhận đúng danh sách RẢNH, dù đang tô ở mode nào.

/**
 * Danh sách mốc giờ KẾT THÚC hợp lệ cho "Chọn thủ công" - lệch với danh sách
 * giờ BẮT ĐẦU (`getGridTimes`) đúng 1 slot: VD slotMinutes=15, bắt đầu có thể
 * là 09:00..20:45, thì kết thúc phải là 09:15..21:00 (mốc cuối cùng luôn là
 * endHour:00, không nằm trong getGridTimes vì đó là điểm ĐÓNG của lưới).
 */
export function getManualRangeEndTimeOptions(config: EventScheduleConfig): string[] {
  const startTimes = getGridTimes(config)
  const closingTime = `${String(config.endHour).padStart(2, "0")}:00`
  return [...startTimes.slice(1), closingTime]
}

/**
 * Sinh danh sách slotId cho 1 ngày, từ `startTime` (bao gồm) tới `endTime`
 * (không bao gồm) - dùng cho "Chọn thủ công": người dùng nhập 1 ngày + giờ
 * bắt đầu/kết thúc, hàm này trả về đúng các slotId 15 phút tương ứng để tô
 * lên lưới (xem `addPaintedSlots` trong store).
 */
export function buildSlotIdsInRange(
  date: string,
  startTime: string,
  endTime: string,
  config: EventScheduleConfig
): string[] {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  const slotIds: string[] = []

  for (let minutes = startMinutes; minutes < endMinutes; minutes += config.slotMinutes) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0")
    const minute = String(minutes % 60).padStart(2, "0")
    slotIds.push(getSlotId(date, `${hour}:${minute}`))
  }

  return slotIds
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

/** VD: 570 phút -> "09:30:00" - đúng định dạng `TimeOnly` mà BE cần (HH:mm:ss) */
function minutesToTimeOnlyString(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function buildTimeSlotRange(
  dateMode: ScheduleDateMode,
  date: string,
  startMinutes: number,
  endMinutes: number,
): TimeSlotRangeRequest {
  const startTime = minutesToTimeOnlyString(startMinutes);
  const endTime = minutesToTimeOnlyString(endMinutes);

  if (dateMode === 'DAYS_OF_WEEK') {
    // 0 = CN...6 = Th7, khớp enum DayOfWeek bên BE - `date` chỉ là ngày thật
    // "mượn tạm" để tính lưới (xem comment ở EventScheduleConfig.dates).
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    return { dayOfWeek, startTime, endTime };
  }

  return { specificDate: date, startTime, endTime };
}

/**
 * Gộp các slotId RỜI RẠC (dạng "date+T+time", từ `getSlotId`) thành các
 * `TimeSlotRangeRequest` đúng hình dạng BE cần: mỗi KHOẢNG LIÊN TỤC (cùng
 * ngày/thứ, các ô nối tiếp nhau không hở) gộp thành 1 object start-end DUY
 * NHẤT; hễ đổi ngày HOẶC bị đứt quãng (có khoảng trống ở giữa) thì tách
 * thành object MỚI.
 *
 * VD: tô liền "09:00 -> 10:30" ngày A ra 1 object {startTime: "09:00:00",
 * endTime: "10:30:00"}; tô thêm rời "14:00 -> 15:00" cùng ngày A -> có thêm
 * 1 object nữa (KHÔNG gộp chung vì có khoảng trống giữa 10:30 và 14:00).
 */
export function mergeFreeSlotIdsIntoRanges(
  freeSlotIds: string[],
  config: EventScheduleConfig,
): TimeSlotRangeRequest[] {
  if (freeSlotIds.length === 0) return [];

  // Sort tăng dần theo ngày rồi theo giờ, để bước gộp bên dưới chỉ cần so
  // sánh với phần tử ngay trước đó (không cần tìm kiếm/group riêng).
  const sortedSlots = freeSlotIds
    .map((slotId) => {
      const [date, time] = slotId.split('T');
      return { date, minutes: timeToMinutes(time) };
    })
    .sort((a, b) => (a.date === b.date ? a.minutes - b.minutes : a.date.localeCompare(b.date)));

  const ranges: TimeSlotRangeRequest[] = [];
  let currentRangeDate = '';
  let currentRangeStartMinutes = -1;
  let currentRangeEndMinutes = -1;

  const closeCurrentRange = () => {
    if (currentRangeStartMinutes === -1) return;
    ranges.push(
      buildTimeSlotRange(
        config.dateMode,
        currentRangeDate,
        currentRangeStartMinutes,
        currentRangeEndMinutes,
      ),
    );
  };

  for (const slot of sortedSlots) {
    const continuesCurrentRange =
      slot.date === currentRangeDate && slot.minutes === currentRangeEndMinutes;
    if (continuesCurrentRange) {
      currentRangeEndMinutes += config.slotMinutes;
      continue;
    }

    closeCurrentRange();
    currentRangeDate = slot.date;
    currentRangeStartMinutes = slot.minutes;
    currentRangeEndMinutes = slot.minutes + config.slotMinutes;
  }
  closeCurrentRange();

  return ranges;
}
