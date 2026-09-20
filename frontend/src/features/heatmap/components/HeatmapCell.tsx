import { CalendarCheck2 } from 'lucide-react';
import { timeToMinutes } from '@/lib/date-time';
import { getAvailabilityClass } from '../availability';
import { SLOT_MINUTES } from '../constants';
import type { HeatmapCellProps } from '../types';
import { containsCell, formatDay } from '../time';
import { FinalizedSchedulePopover } from './FinalizedSchedulePopover';

export function HeatmapCell({
  point,
  event,
  cell,
  total,
  suggestions,
  selected,
  selecting,
  onInspect,
  onInspectEnd,
  onStart,
  onExtend,
  onKeyboardSelect,
}: HeatmapCellProps) {
  const count = total === 0 ? 0 : (cell?.count ?? 0);
  const { column, row } = point;
  const matchingSuggestions = suggestions.filter((slot) => containsCell(slot, column, row));
  const isSelected = selected !== null && containsCell(selected, column, row);
  const finalizedSchedule = event.status === 2 ? event.finalSchedule : null;
  const isFinalized = finalizedSchedule !== null && containsCell(finalizedSchedule, column, row);
  const isFinalizedStart = isFinalized && finalizedSchedule?.startTime === row.startTime;
  const finalizedCellCount = finalizedSchedule
    ? Math.max(1, Math.ceil((timeToMinutes(finalizedSchedule.endTime) - timeToMinutes(finalizedSchedule.startTime)) / SLOT_MINUTES))
    : 0;

  function inspect() {
    onInspect({
      dayLabel: formatDay(column),
      startTime: row.startTime,
      endTime: row.endTime,
      availableNames: cell?.participants ?? [],
      count,
    });
  }

  const accessibilityLabel = `${formatDay(column)}, ${row.startTime} – ${row.endTime}: ${count} of ${total} participants available${matchingSuggestions.length ? ', suggested time' : ''}${isFinalized ? ', finalized meeting time' : ''}`;
  const minute = row.startTime.slice(3);
  const timeBoundaryClass = minute === '00'
    ? 'border-t border-solid border-slate-300'
    : minute === '30'
      ? 'border-t border-dashed border-slate-200/70'
      : '';

  const cellButton = (
    <button
      type="button"
      className={`relative block h-5 w-full outline-offset-[-2px] hover:brightness-[0.98] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-blue-700 ${isFinalized ? 'z-10 bg-blue-600 text-white' : 'bg-transparent'} ${selecting ? 'touch-none cursor-crosshair select-none' : 'cursor-pointer'}`}
      aria-label={accessibilityLabel}
      title={accessibilityLabel}
      aria-pressed={isSelected || isFinalized}
      aria-controls="availability-details"
      onPointerMove={(pointerEvent) => {
        if (pointerEvent.pointerType !== 'touch') inspect();
      }}
      onMouseLeave={onInspectEnd}
      onFocus={inspect}
      onBlur={onInspectEnd}
      onPointerDown={(pointerEvent) => {
        if (!selecting || pointerEvent.button !== 0) return;
        pointerEvent.preventDefault();
        if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId))
          pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
        onStart(point);
      }}
      onPointerEnter={() => {
        if (selecting) onExtend(point);
      }}
      onKeyDown={(keyboardEvent) => {
        if (selecting && keyboardEvent.shiftKey && (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ')) {
          keyboardEvent.preventDefault();
          onKeyboardSelect(point, true);
        }
      }}
      onClick={(clickEvent) => {
        inspect();
        if (selecting && clickEvent.detail === 0) onKeyboardSelect(point);
      }}
    >
      {isFinalizedStart && finalizedSchedule && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-0 z-30 flex items-start gap-2 overflow-hidden rounded-md bg-gradient-to-b from-blue-500 to-blue-700 px-2 py-1 text-left text-[10px] font-semibold leading-tight text-white shadow-sm sm:text-xs"
          style={{ height: `calc(${finalizedCellCount} * 1.25rem)` }}
        >
          <CalendarCheck2 className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="block whitespace-nowrap">{finalizedSchedule.startTime} – {finalizedSchedule.endTime}</span>
            <span className="block text-blue-100">Finalized</span>
          </span>
        </span>
      )}
    </button>
  );

  return (
    <td className={`relative border-r border-slate-300/60 p-0 ${getAvailabilityClass(count, total)} ${timeBoundaryClass}`}>
      {isFinalized
        ? <FinalizedSchedulePopover event={event}>{cellButton}</FinalizedSchedulePopover>
        : cellButton}
      {matchingSuggestions.map((slot, index) => (
        <span
          key={`${slot.startTime}:${slot.endTime}:${index}`}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-x-2 border-red-500 ${slot.startTime === row.startTime ? 'border-t-2' : ''} ${slot.endTime === row.endTime ? 'border-b-2' : ''}`}
        />
      ))}
      {isSelected && selected && !isFinalized && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-x-2 border-blue-700 ${selected.startTime === row.startTime ? 'border-t-2' : ''} ${selected.endTime === row.endTime ? 'border-b-2' : ''}`}
        />
      )}
      {isFinalized && finalizedSchedule && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-20 border-x-2 border-blue-400 ${finalizedSchedule.startTime === row.startTime ? 'border-t-2' : ''} ${finalizedSchedule.endTime === row.endTime ? 'border-b-2' : ''}`}
        />
      )}
    </td>
  );
}
