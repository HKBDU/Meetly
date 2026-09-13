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
  'bg-slate-100',
  'bg-emerald-50',
  'bg-emerald-100',
  'bg-emerald-200',
  'bg-emerald-300',
  'bg-emerald-500',
];

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
      <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white p-2">
        <table
          className="w-full table-fixed border-separate border-spacing-0"
          style={{ minWidth: 72 + columns.length * 155 }}
        >
          <caption className="sr-only">
            Availability grid with 15-minute slots. Hover, tap, or use Tab to view details.
          </caption>
          <thead className="sticky top-0 z-20 bg-white">
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-30 w-[72px] bg-white p-3 text-xs text-slate-500"
              >
                Time
              </th>
              {columns.map((column) => (
                <th scope="col" key={column.key} className="p-3 text-sm font-semibold">
                  {column.label}
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {column.detail}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.startTime}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white p-2 text-xs font-medium text-slate-500"
                >
                  {row.startTime}
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
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        15-minute slots · Ends at {event.dailyEndTime} · Hover or tap a slot to view details.
      </p>
    </section>
  );
}
