import { getAvailabilityClass } from '../availability';
import type { HeatmapCellProps } from '../types';
import { containsCell, formatDay } from '../time';

export function HeatmapCell({
  point,
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

  function inspect() {
    onInspect({
      dayLabel: formatDay(column),
      startTime: row.startTime,
      endTime: row.endTime,
      availableNames: cell?.participants ?? [],
      count,
    });
  }

  const accessibilityLabel = `${formatDay(column)}, ${row.startTime} – ${row.endTime}: ${count} of ${total} participants available${matchingSuggestions.length ? ', suggested time' : ''}`;
  const minute = row.startTime.slice(3);
  const timeBoundaryClass =
    minute === '00'
      ? 'border-t border-solid border-slate-300'
      : minute === '30'
        ? 'border-t border-dashed border-slate-200/70'
        : '';

  return (
    <td
      className={`relative border-r border-slate-300/60 p-0 ${getAvailabilityClass(count, total)} ${timeBoundaryClass}`}
    >
      <button
        type="button"
        className={`block h-5 w-full bg-transparent outline-offset-[-2px] hover:brightness-[0.98] focus-visible:relative focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-blue-700 ${selecting ? 'touch-none cursor-crosshair select-none' : 'cursor-pointer'}`}
        aria-label={accessibilityLabel}
        title={accessibilityLabel}
        aria-pressed={isSelected}
        aria-controls="availability-details"
        onMouseEnter={inspect}
        onMouseLeave={onInspectEnd}
        onFocus={inspect}
        onBlur={onInspectEnd}
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
      />
      {matchingSuggestions.map((slot, index) => (
        <span
          key={`${slot.startTime}:${slot.endTime}:${index}`}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-x-2 border-red-500 ${slot.startTime === row.startTime ? 'border-t-2' : ''} ${slot.endTime === row.endTime ? 'border-b-2' : ''}`}
        />
      ))}
      {isSelected && selected && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 border-x-2 border-blue-700 ${selected.startTime === row.startTime ? 'border-t-2' : ''} ${selected.endTime === row.endTime ? 'border-b-2' : ''}`}
        />
      )}
    </td>
  );
}
