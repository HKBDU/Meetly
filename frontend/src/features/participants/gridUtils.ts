import { monthDayFormatter, weekdayFormatter, weekdayShortFormatter } from '@/lib/date-format';
import type {
  EventScheduleConfig,
  PaintMode,
  ScheduleDateMode,
  TimeSlot,
  TimeSlotRangeRequest,
  TimeSlotRangeResponse,
} from '@/features/participants/types';

/** Nhãn giờ bắt đầu của các ô trong 1 ngày, VD: ["09:00", "09:15", ...] */
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

/** "2026-09-14" -> { weekday: "Monday", weekdayShort: "MON", dayMonth: "Sep 14" } */
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

/** Đổi tập ô đang tô thành danh sách slotId RẢNH: FREE lấy thẳng, BUSY lấy phần bù */
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

/** Mốc giờ kết thúc hợp lệ, lệch 1 slot so với `getGridTimes` và kết thúc ở `endHour:00` */
export function getManualRangeEndTimeOptions(config: EventScheduleConfig): string[] {
  const startTimes = getGridTimes(config)
  const closingTime = `${String(config.endHour).padStart(2, "0")}:00`
  return [...startTimes.slice(1), closingTime]
}

/** Các slotId của 1 ngày từ `startTime` (gồm) tới `endTime` (không gồm) */
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

/** 570 -> "09:30" */
function minutesToTimeString(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function buildTimeSlotRange(
  dateMode: ScheduleDateMode,
  date: string,
  startMinutes: number,
  endMinutes: number,
): TimeSlotRangeRequest {
  const startTime = minutesToTimeString(startMinutes);
  const endTime = minutesToTimeString(endMinutes);

  if (dateMode === 'DAYS_OF_WEEK') {
    const dayOfWeek = new Date(`${date}T00:00:00`).getDay();
    return { dayOfWeek, startTime, endTime };
  }

  return { specificDate: date, startTime, endTime };
}

/** Gộp các ô liền kề cùng ngày thành 1 khoảng start-end; đổi ngày hoặc hở thì tách khoảng mới */
export function mergeFreeSlotIdsIntoRanges(
  freeSlotIds: string[],
  config: EventScheduleConfig,
): TimeSlotRangeRequest[] {
  if (freeSlotIds.length === 0) return [];

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

/** Chiều ngược của `mergeFreeSlotIdsIntoRanges`: bung khoảng BE trả về thành slotId trên lưới */
export function expandTimeSlotRangesToIds(
  ranges: TimeSlotRangeResponse[],
  config: EventScheduleConfig,
): string[] {
  const slotIds: string[] = [];

  for (const range of ranges) {
    const matchingDates = config.dates.filter((date) =>
      config.dateMode === 'DAYS_OF_WEEK'
        ? new Date(`${date}T00:00:00`).getDay() === range.dayOfWeek
        : date === range.specificDate,
    );

    const startMinutes = timeToMinutes(range.startTime);
    const endMinutes = timeToMinutes(range.endTime);

    for (const date of matchingDates) {
      for (let minutes = startMinutes; minutes < endMinutes; minutes += config.slotMinutes) {
        slotIds.push(getSlotId(date, minutesToTimeString(minutes)));
      }
    }
  }

  return slotIds;
}
