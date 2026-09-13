import type {
  CellDetails,
  FinalSchedule,
  HeatmapCellData,
  SelectedCell,
  SuggestedSlot,
} from '../types';
import { containsCell, formatDay } from '../time';

interface Props {
  point: SelectedCell;
  cell: HeatmapCellData | undefined;
  total: number;
  suggestions: SuggestedSlot[];
  selected: FinalSchedule | null;
  selecting: boolean;
  onInspect: (details: CellDetails) => void;
  onStart: (point: SelectedCell) => void;
  onExtend: (point: SelectedCell) => void;
  onKeyboardSelect: (point: SelectedCell, extendRange?: boolean) => void;
}

function availabilityClass(count: number, total: number): string {
  const ratio = total === 0 ? 0 : count / total;
  if (ratio === 0) return 'bg-slate-100';
  if (ratio <= 0.25) return 'bg-emerald-50';
  if (ratio <= 0.5) return 'bg-emerald-100';
  if (ratio <= 0.75) return 'bg-emerald-200';
  if (ratio < 1) return 'bg-emerald-300';
  return 'bg-emerald-500';
}

export function HeatmapCell({
  point,
  cell,
  total,
  suggestions,
  selected,
  selecting,
  onInspect,
  onStart,
  onExtend,
  onKeyboardSelect,
}: Props) {
  const count = total === 0 ? 0 : (cell?.count ?? 0);
  const { column, row } = point;
  const matchingSuggestions = suggestions.filter((slot) => containsCell(slot, column, row));
  const isSelected = selected !== null && containsCell(selected, column, row);

  function inspect() {
    onInspect({
      dayLabel: formatDay(column),
      startTime: row.startTime,
      endTime: row.endTime,
      availableNames: cell?.participants ?? [],
      count,
    });
  }

  return (
    <td className="relative p-0.5">
      <button
        type="button"
        className={`h-8 w-full rounded text-xs font-semibold text-emerald-950 outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-blue-800 ${availabilityClass(count, total)} ${selecting ? 'touch-none select-none cursor-crosshair' : 'cursor-pointer'}`}
        aria-label={`${formatDay(column)}, ${row.startTime} – ${row.endTime}: ${count}/${total} available${matchingSuggestions.length ? ', suggested time' : ''}`}
        aria-pressed={isSelected}
        aria-controls="availability-details"
        onMouseEnter={inspect}
        onFocus={inspect}
        onPointerDown={(event) => {
          if (!selecting || event.button !== 0) return;
          event.preventDefault();
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
          onStart(point);
        }}
        onPointerEnter={() => {
          if (selecting) onExtend(point);
        }}
        onKeyDown={(event) => {
          if (selecting && event.shiftKey && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onKeyboardSelect(point, true);
          }
        }}
        onClick={(event) => {
          inspect();
          if (selecting && event.detail === 0) onKeyboardSelect(point);
        }}
      >
        {count}/{total}
      </button>
      {matchingSuggestions.map((slot, index) => (
        <span
          key={`${slot.startTime}:${slot.endTime}:${index}`}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-x-2 border-red-500 ${slot.startTime === row.startTime ? 'rounded-t border-t-2' : ''} ${slot.endTime === row.endTime ? 'rounded-b border-b-2' : ''}`}
        />
      ))}
      {isSelected && selected && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 inset-x-1 border-x-2 border-blue-700 ${selected.startTime === row.startTime ? 'rounded-t border-t-2' : ''} ${selected.endTime === row.endTime ? 'rounded-b border-b-2' : ''}`}
        />
      )}
    </td>
  );
}
