import { minutesToTime, timeToMinutes } from '@/lib/date-time';
import { SLOT_MINUTES } from '@/shared/constants';
import type { EventDetail, HeatmapCellData } from '@/shared/types';
import { DEFAULT_MEETING_DURATION } from './constants';
import type { SuggestedSlot, SuggestionParams } from './types';

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
export function findBestSlots(event: EventDetail, params: SuggestionParams): SuggestedSlot[] {
  const duration = params.minDuration ?? DEFAULT_MEETING_DURATION;
  const cellsNeeded = Math.max(1, Math.ceil(duration / SLOT_MINUTES));
  const keyParticipant = params.keyParticipant?.trim().toLowerCase();

  const columns = new Map<string, HeatmapCellData[]>();
  for (const cell of event.heatmapGrid) {
    const key = columnKey(cell);
    const column = columns.get(key);
    if (column) column.push(cell);
    else columns.set(key, [cell]);
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

export interface RankedTime {
  specificDate: string | null;
  dayOfWeek: EventDetail['availableWeekdays'][number] | null;
  startTime: string;
  endTime: string;
  /** Rảnh trọn cả khung (giao của mọi ô 15 phút trong khung) */
  available: string[];
  /** Có trong event nhưng không rảnh trọn khung */
  missing: string[];
}

interface RankOptions {
  /** Độ dài cuộc họp (phút) */
  duration: number;
  /** Những người bắt buộc phải rảnh trọn khung */
  mustInclude?: readonly string[];
  limit?: number;
}

/**
 * Top các khung giờ tốt nhất để chốt, không chồng nhau trong cùng một ngày.
 * Xếp theo số người rảnh suốt cả cuộc họp, rồi tổng mật độ (ít người phải đến muộn/về sớm),
 * rồi khung sớm hơn. Khác `findBestSlots`: luôn trả về khung gần nhất kể cả khi không ai rảnh đủ.
 */
export function rankBestTimes(event: EventDetail, { duration, mustInclude = [], limit = 5 }: RankOptions): RankedTime[] {
  const cellsNeeded = Math.max(1, Math.ceil(duration / SLOT_MINUTES));
  const required = mustInclude.map((name) => name.toLowerCase());
  const everyone = event.participants.map((person) => person.username);

  const columns = new Map<string, HeatmapCellData[]>();
  for (const cell of event.heatmapGrid) {
    const key = columnKey(cell);
    const column = columns.get(key);
    if (column) column.push(cell);
    else columns.set(key, [cell]);
  }

  interface Candidate {
    column: string;
    first: HeatmapCellData;
    start: number;
    end: number;
    available: string[];
    density: number;
  }
  const candidates: Candidate[] = [];

  for (const [key, column] of columns) {
    const cells = [...column].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 0; index + cellsNeeded <= cells.length; index++) {
      const span = cells.slice(index, index + cellsNeeded);
      if (!isContiguous(span)) continue;
      let available = new Set(span[0].participants);
      for (const cell of span.slice(1)) available = new Set(cell.participants.filter((name) => available.has(name)));
      const lower = new Set([...available].map((name) => name.toLowerCase()));
      if (!required.every((name) => lower.has(name))) continue;
      const start = timeToMinutes(span[0].startTime);
      candidates.push({
        column: key,
        first: span[0],
        start,
        end: start + cellsNeeded * SLOT_MINUTES,
        available: [...available],
        density: span.reduce((total, cell) => total + cell.count, 0),
      });
    }
  }

  candidates.sort(
    (a, b) =>
      b.available.length - a.available.length ||
      b.density - a.density ||
      a.column.localeCompare(b.column) ||
      a.start - b.start,
  );

  const picked: Candidate[] = [];
  for (const candidate of candidates) {
    if (picked.length >= limit) break;
    if (candidate.available.length === 0) break;
    const overlaps = picked.some(
      (other) => other.column === candidate.column && candidate.start < other.end && other.start < candidate.end,
    );
    if (!overlaps) picked.push(candidate);
  }

  return picked.map((candidate) => {
    const availableSet = new Set(candidate.available);
    return {
      specificDate: candidate.first.specificDate,
      dayOfWeek: candidate.first.dayOfWeek,
      startTime: minutesToTime(candidate.start),
      endTime: minutesToTime(candidate.end),
      available: everyone.filter((name) => availableSet.has(name)),
      missing: everyone.filter((name) => !availableSet.has(name)),
    };
  });
}

/** Khoá ổn định của một khung, dùng để so khớp khung đang hover/chọn */
export const rankedKey = (slot: Pick<RankedTime, 'specificDate' | 'dayOfWeek' | 'startTime'>) =>
  `${slot.specificDate ?? slot.dayOfWeek}|${slot.startTime}`
