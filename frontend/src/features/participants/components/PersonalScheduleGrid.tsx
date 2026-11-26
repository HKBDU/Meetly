import { memo } from 'react'

import { cn } from '@/lib/utils'
import { rowBoundaryClass } from '@/shared/grid/rowBoundary'
import { TimeGrid } from '@/shared/grid/TimeGrid'
import { useTimeView } from '@/shared/grid/time-view'
import { getSlotId } from '@/features/participants/gridUtils'
import { useOptimizedDrag } from '@/features/participants/hooks/useOptimizedDrag'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import { useT } from '@/shared/i18n'

interface ScheduleCellProps {
  slotId: string
  column: string
  row: number
  startTime: string
  locked: boolean
  onPointerDown: (event: React.PointerEvent<HTMLTableCellElement>) => void
  onPointerEnter: (event: React.PointerEvent<HTMLTableCellElement>) => void
}

/**
 * Memo hoá và chỉ subscribe boolean của riêng ô, nên khi kéo thả chỉ ô đổi trạng thái
 * mới vẽ lại. `data-column`/`data-row` để `useOptimizedDrag` lấp các ô bị bỏ sót.
 */
const ScheduleCell = memo(function ScheduleCell({
  slotId,
  column,
  row,
  startTime,
  locked,
  onPointerDown,
  onPointerEnter,
}: ScheduleCellProps) {
  // "Được tô" là rảnh hay bận tuỳ paintMode, xem `resolveFreeSlotIds`
  const isPainted = useParticipantStore((s) => s.selectedSlotIds.has(slotId))

  return (
    <td
      data-slot-id={slotId}
      data-column={column}
      data-row={row}
      onPointerDown={locked ? undefined : onPointerDown}
      onPointerEnter={locked ? undefined : onPointerEnter}
      className={cn(
        'h-5 border-r border-grid-line/60 p-0 transition-colors duration-75',
        // Thiếu touch-none thì kéo trên mobile bị hiểu thành cuộn trang
        !locked && 'touch-none select-none',
        rowBoundaryClass(startTime),
        locked
          ? cn('cursor-not-allowed', isPainted ? 'bg-heat-5 opacity-50' : 'bg-muted')
          : cn('cursor-pointer', isPainted ? 'bg-heat-5 hover:brightness-95' : 'bg-heat-0 hover:bg-accent'),
      )}
    />
  )
})

interface PersonalScheduleGridProps {
  grid: ScheduleGrid
  /** Từ cha để kéo chuột, "Chọn thủ công" và "Xoá hết" dùng chung 1 debounce lưu */
  triggerAutoSave: () => void
  manualSelection: { columnKey: string; requestId: number; startTime?: string } | null
}

export function PersonalScheduleGrid({ grid, triggerAutoSave, manualSelection }: PersonalScheduleGridProps) {
  const t = useT()
  const projected = useTimeView()?.projected
  const { handleCellPointerDown, handleCellPointerEnter } = useOptimizedDrag({
    times: grid.times,
    getSlotIdsBetween: projected ? (column, from, to) =>
      projected.rows.slice(from, to + 1).flatMap(({ key }) => {
        const cell = projected.cells.get(`${column}|${key}`)
        return cell ? [getSlotId(cell.source.column, cell.source.row.startTime)] : []
      }) : undefined,
    locked: grid.isLocked,
    onDragEnd: triggerAutoSave,
  })

  return (
    <section className="p-3 sm:p-4" aria-label={t('schedule.label')}>
      <TimeGrid
        columns={grid.columns}
        rows={grid.rows}
        caption={t('schedule.caption')}
        pagerLabel={t('schedule.pager')}
        revealColumn={manualSelection ? { key: manualSelection.columnKey, requestId: manualSelection.requestId, startTime: manualSelection.startTime } : null}
        renderCell={(column, row, rowIndex, viewerCell) => {
          const slotId = getSlotId(column, row.startTime)
          return (
            <ScheduleCell
              key={slotId}
              slotId={slotId}
              column={viewerCell?.columnKey ?? column.key}
              row={viewerCell && projected ? projected.rowIndexByKey.get(viewerCell.rowKey)! : rowIndex}
              startTime={viewerCell?.startTime ?? row.startTime}
              locked={grid.isLocked}
              onPointerDown={handleCellPointerDown}
              onPointerEnter={handleCellPointerEnter}
            />
          )
        }}
      />
    </section>
  )
}
