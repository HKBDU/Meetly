import { buildRows, getColumns } from '@/features/heatmap/time';
import type { HeatmapEvent } from '@/features/heatmap/types';

const participants = ['Dương', 'An', 'Bình', 'Chi', 'Duy', 'Huyền', 'Khoa', 'Linh'].map(
  (username) => ({ username }),
);

const baseEvent: HeatmapEvent = {
  title: 'Meetly Team Meeting',
  shortCode: 'DEMO26',
  url: 'https://meetly.example/DEMO26',
  eventType: 1,
  timezone: 'Asia/Ho_Chi_Minh',
  availableDates: ['2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15'],
  availableWeekdays: [],
  dailyStartTime: '08:00',
  dailyEndTime: '14:00',
  status: 1,
  revision: 12,
  participants,
  heatmapGrid: [],
  finalSchedule: null,
};

const levels = [0, 2, 4, 5, 6, 7, 8];

/** Sự kiện chọn ngày cụ thể với độ rảnh mẫu, chỉ dùng cho test */
export const mockDatesEvent: HeatmapEvent = {
  ...baseEvent,
  heatmapGrid: getColumns(baseEvent).flatMap((column, dayIndex) =>
    buildRows(baseEvent.dailyStartTime, baseEvent.dailyEndTime).map((row, rowIndex) => {
      const count = dayIndex === 0 && rowIndex >= 4 ? 8 : levels[(rowIndex + dayIndex) % levels.length];
      return {
        specificDate: column.specificDate,
        dayOfWeek: column.dayOfWeek,
        startTime: row.startTime,
        participants: participants.slice(0, count).map((person) => person.username),
        count,
      };
    }),
  ),
};
