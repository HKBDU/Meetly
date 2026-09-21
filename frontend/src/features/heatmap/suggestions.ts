import { minutesToTime, timeToMinutes } from '@/lib/date-time';
import { DEFAULT_MEETING_DURATION, SLOT_MINUTES } from './constants';
import type { HeatmapCellData, HeatmapEvent, SuggestedSlot, SuggestionParams } from './types';

export function getSuggestionParams(
  duration: number | undefined,
  keyParticipant: string | null,
): SuggestionParams | null {
  if (duration === undefined && keyParticipant === null) return null;
  return {
    ...(duration === undefined ? {} : { minDuration: duration }),
    ...(keyParticipant === null ? {} : { keyParticipant }),
  };
}

interface CandidateWindow {
  start: number;
  end: number;
  count: number;
  score: number;
}

const columnKey = (cell: HeatmapCellData) => `${cell.specificDate ?? ''}|${cell.dayOfWeek ?? ''}`;

function isContiguous(cells: HeatmapCellData[]): boolean {
  return cells.every(
    (cell, index) =>
      index === 0 ||
      timeToMinutes(cell.startTime) - timeToMinutes(cells[index - 1].startTime) === SLOT_MINUTES,
  );
}

/** Giữ cửa sổ đầu tiên trong một cụm đồng hạng bị chồng lấn để mỗi viền luôn đúng duration. */
function removeOverlapping(windows: CandidateWindow[]): CandidateWindow[] {
  return windows.reduce<CandidateWindow[]>((kept, window) => {
    const last = kept[kept.length - 1];
    if (!last || window.start >= last.end) kept.push(window);
    return kept;
  }, []);
}

/**
 * Khung giờ có mật độ tham gia cao nhất: cộng lượng người rảnh ở từng ô trong toàn bộ
 * `minDuration`. Không dùng giao của các tập người để xếp hạng, vì cách đó ưu tiên một nhóm
 * nhỏ cố định và bỏ qua một khoảng có nhiều người rảnh hơn ở phần lớn thời gian. Mỗi kết quả
 * luôn dài đúng duration; các cửa sổ đồng hạng chồng nhau không bị gộp thành một khoảng dài hơn.
 */
export function findBestSlots(event: HeatmapEvent, params: SuggestionParams): SuggestedSlot[] {
  const duration = params.minDuration ?? DEFAULT_MEETING_DURATION;
  const cellsNeeded = Math.max(1, Math.ceil(duration / SLOT_MINUTES));
  const keyParticipant = params.keyParticipant?.trim().toLowerCase();

  const columns = new Map<string, HeatmapCellData[]>();
  for (const cell of event.heatmapGrid) {
    columns.set(columnKey(cell), [...(columns.get(columnKey(cell)) ?? []), cell]);
  }

  const perColumn = [...columns.values()].map((column) => {
    const cells = [...column].sort((a, b) => a.startTime.localeCompare(b.startTime));
    const windows: CandidateWindow[] = [];
    for (let index = 0; index + cellsNeeded <= cells.length; index++) {
      const span = cells.slice(index, index + cellsNeeded);
      if (!isContiguous(span)) continue;
      if (
        keyParticipant &&
        !span.every((cell) =>
          cell.participants.some((name) => name.toLowerCase() === keyParticipant),
        )
      )
        continue;
      const start = timeToMinutes(span[0].startTime);
      const score = span.reduce((total, cell) => total + cell.count, 0);
      windows.push({
        start,
        end: start + cellsNeeded * SLOT_MINUTES,
        count: Math.min(...span.map((cell) => cell.count)),
        score,
      });
    }
    return { cell: cells[0], windows };
  });

  const bestScore = Math.max(0, ...perColumn.flatMap(({ windows }) => windows.map((w) => w.score)));
  if (bestScore === 0) return [];

  return perColumn.flatMap(({ cell, windows }) =>
    removeOverlapping(windows.filter((window) => window.score === bestScore)).map((window) => ({
      specificDate: cell.specificDate,
      dayOfWeek: cell.dayOfWeek,
      startTime: minutesToTime(window.start),
      endTime: minutesToTime(window.end),
      participantCount: window.count,
      totalParticipants: event.participants.length,
    })),
  );
}
