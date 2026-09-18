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
}

const columnKey = (cell: HeatmapCellData) => `${cell.specificDate ?? ''}|${cell.dayOfWeek ?? ''}`;

/** Người có mặt suốt cả `cells` liên tiếp (giao của các tập người theo từng ô) */
function attendeesAcross(cells: HeatmapCellData[]): Set<string> {
  return cells
    .map((cell) => new Set(cell.participants))
    .reduce((common, next) => new Set([...common].filter((name) => next.has(name))));
}

function isContiguous(cells: HeatmapCellData[]): boolean {
  return cells.every(
    (cell, index) =>
      index === 0 ||
      timeToMinutes(cell.startTime) - timeToMinutes(cells[index - 1].startTime) === SLOT_MINUTES,
  );
}

function mergeOverlapping(windows: CandidateWindow[]): CandidateWindow[] {
  return windows.reduce<CandidateWindow[]>((merged, window) => {
    const last = merged[merged.length - 1];
    if (last && window.start <= last.end) last.end = Math.max(last.end, window.end);
    else merged.push({ ...window });
    return merged;
  }, []);
}

/**
 * Khung giờ nhiều người rảnh nhất: với mỗi khoảng liên tục dài `minDuration`, đếm số người
 * rảnh trong suốt khoảng đó, chỉ giữ các khoảng có số người cao nhất (rồi gộp khoảng chồng
 * nhau). Tính từ `heatmapGrid` nên luôn khớp với heatmap và tự cập nhật theo realtime.
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
      const attendees = attendeesAcross(span);
      if (attendees.size === 0) continue;
      if (keyParticipant && ![...attendees].some((name) => name.toLowerCase() === keyParticipant))
        continue;
      const start = timeToMinutes(span[0].startTime);
      windows.push({ start, end: start + cellsNeeded * SLOT_MINUTES, count: attendees.size });
    }
    return { cell: cells[0], windows };
  });

  const best = Math.max(0, ...perColumn.flatMap(({ windows }) => windows.map((w) => w.count)));
  if (best === 0) return [];

  return perColumn.flatMap(({ cell, windows }) =>
    mergeOverlapping(windows.filter((window) => window.count === best)).map((window) => ({
      specificDate: cell.specificDate,
      dayOfWeek: cell.dayOfWeek,
      startTime: minutesToTime(window.start),
      endTime: minutesToTime(window.end),
      participantCount: best,
      totalParticipants: event.participants.length,
    })),
  );
}
