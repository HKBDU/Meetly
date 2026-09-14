import type {
  CellDetails,
  FinalSchedule,
  HeatmapEvent,
  SelectedCell,
  SuggestedSlot,
} from '../types';
import { buildRows, getColumns } from '../time';
import { HeatmapCell } from './HeatmapCell';

interface Props {
  event: HeatmapEvent;
  suggestions: SuggestedSlot[];
  selected: FinalSchedule | null;
  selecting: boolean;
  onInspect: (details: CellDetails) => void;
  onStart: (point: SelectedCell) => void;
  onExtend: (point: SelectedCell) => void;
  onKeyboardSelect: (point: SelectedCell, extendRange?: boolean) => void;
}

const legendColors = [
  'bg-white',
  'bg-[#d8f0e1]',
  'bg-[#b7e4c7]',
  'bg-[#8fd3a8]',
  'bg-[#55bd7c]',
  'bg-[#00a844]',
];

function formatHourLabel(time: string): string {
  const hour = Number(time.slice(0, 2));
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function Heatmap({ event, ...interaction }: Props) {
  const columns = getColumns(event);
  const rows = buildRows(event.dailyStartTime, event.dailyEndTime);

  if (columns.length === 0)
    return (
      <p className="rounded-xl bg-slate-50 p-6 text-slate-500">
        No dates available for the heatmap.
      </p>
    );
  if (rows.length === 0)
    return (
      <p className="rounded-xl bg-slate-50 p-6 text-slate-500">No valid time slots available.</p>
    );

  return (
    <section className="min-w-0" aria-labelledby="heatmap-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="heatmap-heading"
          className="text-sm font-semibold uppercase tracking-wide text-slate-500"
        >
          Group Availability
        </h2>
        <div
          className="flex items-center gap-1 text-xs text-slate-500"
          aria-label="Availability scale from fewer to more participants"
        >
          <span className="mr-1">Less</span>
          {legendColors.map((color) => (
            <span key={color} className={`h-4 w-4 rounded-sm ${color}`} />
          ))}
          <span className="ml-1">More</span>
        </div>
      </div>
      {event.participants.length === 0 && (
        <p className="mb-3 text-sm text-slate-500">No participants yet.</p>
      )}
      {event.heatmapGrid.length === 0 && (
        <p className="mb-3 text-sm text-slate-500">No availability data yet.</p>
      )}
      <div className="w-full overflow-hidden border border-slate-300 bg-white">
        <table className="w-full table-fixed border-collapse">
          <caption className="sr-only">
            Availability grid with 15-minute slots. Hover, tap, or use Tab to view details.
          </caption>
          <thead className="bg-white">
            <tr>
              <th
                scope="col"
                className="w-16 border-b border-r border-slate-200 p-2 text-xs text-slate-500 sm:w-20"
              >
                Time
              </th>
              {columns.map((column) => (
                <th
                  scope="col"
                  key={column.key}
                  className="border-b border-r border-slate-200 px-1 py-3 text-xs font-semibold last:border-r-0 sm:text-sm"
                >
                  {column.label}
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {column.detail}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hourBoundary = row.startTime.endsWith(':00');
              return (
                <tr key={row.startTime}>
                  <th
                    scope="row"
                    aria-label={row.startTime}
                    className={`w-16 border-r border-slate-200 bg-white px-1 text-left text-xs font-medium text-slate-500 sm:w-20 sm:px-2 ${hourBoundary ? 'border-t border-t-slate-300 align-top pt-1' : 'border-t border-t-transparent'}`}
                  >
                    {hourBoundary ? formatHourLabel(row.startTime) : null}
                  </th>
                  {columns.map((column) => {
                    const cell = event.heatmapGrid.find(
                      (cell) =>
                        cell.startTime === row.startTime &&
                        cell.specificDate === column.specificDate &&
                        cell.dayOfWeek === column.dayOfWeek,
                    );
                    return (
                      <HeatmapCell
                        key={column.key}
                        point={{ column, row }}
                        cell={cell}
                        total={event.participants.length}
                        {...interaction}
                      />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
