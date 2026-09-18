import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatHourLabel } from '@/lib/date-time';
import { Button } from '@/shared/components/ui';
import {
  AVAILABILITY_LEVELS,
  DESKTOP_COLUMNS_PER_PAGE,
  MOBILE_COLUMNS_PER_PAGE,
} from '../constants';
import { getAvailabilityLevelClass } from '../availability';
import type { HeatmapProps, TimeColumn, TimeRow } from '../types';
import { buildRows, getColumnPage, getColumns, getPageCount } from '../time';
import { HeatmapCell } from './HeatmapCell';

interface HeatmapTableProps extends Omit<HeatmapProps, 'event'> {
  columns: TimeColumn[];
  rows: TimeRow[];
  event: HeatmapProps['event'];
  compactHeaders?: boolean;
}

function HeatmapTable({ columns, rows, event, compactHeaders = false, ...interaction }: HeatmapTableProps) {
  return (
    <div className="w-full overflow-hidden border border-slate-300 bg-white">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Availability grid with 15-minute slots. Hover, tap, or use Tab to view details.
        </caption>
        <thead className="bg-white">
          <tr>
            <th
              scope="col"
              className="w-14 border-b border-r border-slate-200 p-2 text-xs text-slate-500 sm:w-20"
            >
              Time
            </th>
            {columns.map((column) => (
              <th
                scope="col"
                key={column.key}
                title={`${column.label} ${column.detail}`}
                className="border-b border-r border-slate-200 px-1 py-2 text-xs font-semibold last:border-r-0 sm:py-3 sm:text-sm"
              >
                {compactHeaders ? column.label.slice(0, 3) : column.label}
                <span className="mt-1 block truncate text-[10px] font-normal text-slate-500 sm:text-xs">
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
                  className={`w-14 border-r border-slate-200 bg-white px-1 text-left text-xs font-medium text-slate-500 sm:w-20 sm:px-2 ${hourBoundary ? 'border-t border-t-slate-300 align-top pt-1' : 'border-t border-t-transparent'}`}
                >
                  {hourBoundary ? formatHourLabel(row.startTime) : null}
                </th>
                {columns.map((column) => {
                  const cell = event.heatmapGrid.find(
                    (candidate) =>
                      candidate.startTime === row.startTime &&
                      candidate.specificDate === column.specificDate &&
                      candidate.dayOfWeek === column.dayOfWeek,
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
  );
}

interface PaginatedHeatmapProps extends HeatmapTableProps {
  pageSize: number;
}

function PaginatedHeatmap({ columns, pageSize, ...tableProps }: PaginatedHeatmapProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = getPageCount(columns.length, pageSize);
  const currentPage = Math.min(pageIndex, pageCount - 1);
  const visibleColumns = getColumnPage(columns, currentPage, pageSize);

  return (
    <>
      {pageCount > 1 && (
        <div className="mb-3 flex items-center justify-between gap-3" aria-label="Heatmap date pages">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === 0}
            onClick={() => setPageIndex(Math.max(0, currentPage - 1))}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="text-xs font-medium text-muted-foreground">
            {currentPage + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage === pageCount - 1}
            onClick={() => setPageIndex(Math.min(pageCount - 1, currentPage + 1))}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
      <HeatmapTable columns={visibleColumns} {...tableProps} />
    </>
  );
}

export function Heatmap({ event, ...interaction }: HeatmapProps) {
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
          {AVAILABILITY_LEVELS.map((level) => (
            <span key={level} className={`h-4 w-4 rounded-sm ${getAvailabilityLevelClass(level)}`} />
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
      <div className="md:hidden">
        <PaginatedHeatmap
          key={`mobile:${columns.map((column) => column.key).join('|')}`}
          columns={columns}
          rows={rows}
          event={event}
          pageSize={MOBILE_COLUMNS_PER_PAGE}
          compactHeaders
          {...interaction}
        />
      </div>
      <div className="hidden md:block">
        <PaginatedHeatmap
          key={`desktop:${columns.map((column) => column.key).join('|')}`}
          columns={columns}
          rows={rows}
          event={event}
          pageSize={DESKTOP_COLUMNS_PER_PAGE}
          {...interaction}
        />
      </div>
    </section>
  );
}
