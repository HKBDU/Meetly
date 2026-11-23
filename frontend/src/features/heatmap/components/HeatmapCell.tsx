import { memo } from 'react'
import { CalendarCheck2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDay } from '@/shared/grid/model'
import { rowBoundaryClass } from '@/shared/grid/rowBoundary'
import type { EventDetail } from '@/shared/types'
import { getAvailabilityClass } from '../availability'
import type { SelectedCell } from '../types'
import { FinalizedSchedulePopover } from './FinalizedSchedulePopover'

/** Vị trí của ô trong một khoảng dọc (để vẽ viền trên/dưới), null = ngoài khoảng */
export type RangeEdge = 'single' | 'top' | 'middle' | 'bottom' | null

export interface HeatmapCellHandlers {
  inspect: (point: SelectedCell, names: string[], count: number) => void
  inspectEnd: () => void
  start: (point: SelectedCell) => void
  extend: (point: SelectedCell) => void
  keyboardSelect: (point: SelectedCell, extendRange?: boolean) => void
}

export interface HeatmapCellProps {
  point: SelectedCell
  names: string[]
  total: number
  selecting: boolean
  selection: RangeEdge
  suggestion: RangeEdge
  /** Thứ hạng trong Best times (hiện nhãn ở ô đầu khung) */
  suggestionRank?: number
  suggestionHighlighted?: boolean
  finalized: RangeEdge
  /** Chỉ truyền cho ô thuộc lịch đã chốt (để mở popover chi tiết) */
  finalizedEvent?: EventDetail
  /** Số ô của lịch đã chốt, để nhãn ở ô đầu phủ hết khoảng */
  finalizedCellCount?: number
  handlers: HeatmapCellHandlers
}

const edgeClass = (edge: RangeEdge) =>
  edge === 'single' ? 'border-y-2' : edge === 'top' ? 'border-t-2' : edge === 'bottom' ? 'border-b-2' : ''

/** Memo hoá: props đều là giá trị nguyên thuỷ hoặc tham chiếu ổn định nên di chuột không làm cả lưới vẽ lại */
export const HeatmapCell = memo(function HeatmapCell({
  point,
  names,
  total,
  selecting,
  selection,
  suggestion,
  suggestionRank,
  suggestionHighlighted = false,
  finalized,
  finalizedEvent,
  finalizedCellCount = 0,
  handlers,
}: HeatmapCellProps) {
  const count = total === 0 ? 0 : names.length
  const { column, row } = point
  const isFinalizedStart = finalized === 'top' || finalized === 'single'
  const schedule = finalizedEvent?.finalSchedule

  const label = `${formatDay(column)}, ${row.startTime} – ${row.endTime}: ${count} of ${total} participants available${suggestion ? ', suggested time' : ''}${finalized ? ', finalized meeting time' : ''}`

  const button = (
    <button
      type="button"
      className={cn(
        'relative block h-5 w-full outline-offset-[-2px] hover:brightness-[0.98] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-selection',
        finalized ? 'z-10 bg-finalized text-finalized-foreground' : 'bg-transparent',
        selecting ? 'cursor-crosshair touch-none select-none' : 'cursor-pointer',
      )}
      aria-label={label}
      title={label}
      aria-pressed={Boolean(selection || finalized)}
      aria-controls="availability-details"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') handlers.inspect(point, names, count)
        if (selecting) handlers.extend(point)
      }}
      onMouseLeave={handlers.inspectEnd}
      onFocus={() => handlers.inspect(point, names, count)}
      onBlur={handlers.inspectEnd}
      onPointerDown={(event) => {
        if (!selecting || event.button !== 0) return
        event.preventDefault()
        // Bỏ capture ngầm của cảm ứng để `pointerenter` còn bắn sang ô khác khi kéo
        if (event.currentTarget.hasPointerCapture(event.pointerId))
          event.currentTarget.releasePointerCapture(event.pointerId)
        handlers.start(point)
      }}
      onKeyDown={(event) => {
        if (selecting && event.shiftKey && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          handlers.keyboardSelect(point, true)
        }
      }}
      onClick={(event) => {
        handlers.inspect(point, names, count)
        if (selecting && event.detail === 0) handlers.keyboardSelect(point)
      }}
    >
      {isFinalizedStart && schedule && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-0 z-30 flex items-start gap-2 overflow-hidden rounded-md bg-gradient-to-b from-finalized/90 to-finalized px-2 py-1 text-left text-[10px] leading-tight font-semibold text-finalized-foreground shadow-sm sm:text-xs"
          style={{ height: `calc(${finalizedCellCount} * 1.25rem)` }}
        >
          <CalendarCheck2 className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="block whitespace-nowrap">
              {schedule.startTime} – {schedule.endTime}
            </span>
            <span className="block text-finalized-foreground/80">Finalized</span>
          </span>
        </span>
      )}
    </button>
  )

  return (
    <td className={cn('relative border-r border-grid-line/60 p-0', getAvailabilityClass(count, total), rowBoundaryClass(row.startTime))}>
      {finalized && finalizedEvent ? <FinalizedSchedulePopover event={finalizedEvent}>{button}</FinalizedSchedulePopover> : button}
      {suggestion && !finalized && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 z-10 border-x-2 transition-colors duration-200',
            suggestionHighlighted ? 'border-solid border-primary bg-primary/25' : 'border-dashed border-primary/70',
            edgeClass(suggestion),
            (suggestion === 'top' || suggestion === 'single') && 'rounded-t-sm',
            (suggestion === 'bottom' || suggestion === 'single') && 'rounded-b-sm',
          )}
        >
          {suggestionRank !== undefined && (suggestion === 'top' || suggestion === 'single') && (
            <span
              className={cn(
                'absolute -top-2 -right-1.5 grid size-4 place-items-center rounded-full text-[10px] font-semibold tabular-nums shadow-soft',
                suggestionHighlighted || suggestionRank === 1 ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground',
              )}
            >
              {suggestionRank}
            </span>
          )}
        </span>
      )}
      {selection && !finalized && (
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 border-x-2 border-selection', edgeClass(selection))} />
      )}
      {finalized && (
        <span aria-hidden="true" className={cn('pointer-events-none absolute inset-0 z-20 border-x-2 border-finalized/60', edgeClass(finalized))} />
      )}
    </td>
  )
})
