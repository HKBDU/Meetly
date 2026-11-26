import { memo } from 'react'

import { cn } from '@/lib/utils'
import { rowBoundaryClass } from '@/shared/grid/rowBoundary'
import { TimeGrid } from '@/shared/grid/TimeGrid'
import { getSlotId } from '@/features/participants/gridUtils'
import { useOptimizedDrag } from '@/features/participants/hooks/useOptimizedDrag'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { selectPaintedSlotIds, useParticipantStore } from '@/features/participants/store'
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
  // "Được tô" là rảnh hay bận tuỳ paintMode, xem `resolveFreeSlotIds`; đang có bản nháp thì là ô rảnh của bản nháp
  const isPainted = useParticipantStore((s) => selectPaintedSlotIds(s).has(slotId))
  const isDraft = useParticipantStore((s) => s.draftFreeSlotIds !== null)

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
        // Ô nháp nhạt màu và có sọc để phân biệt với lịch đã lưu
        isDraft && !locked && isPainted && 'bg-heat-3 bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(255_255_255/0.35)_4px_8px)]',
      )}
    />
  )
})

interface PersonalScheduleGridProps {
  grid: ScheduleGrid
  /** Từ cha để kéo chuột, "Chọn thủ công" và "Xoá hết" dùng chung 1 debounce lưu */
  triggerAutoSave: () => void
  manualSelection: { columnKey: string; requestId: number } | null
}

export function PersonalScheduleGrid({ grid, triggerAutoSave, manualSelection }: PersonalScheduleGridProps) {
  const t = useT()
  const { handleCellPointerDown, handleCellPointerEnter } = useOptimizedDrag({
    times: grid.times,
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
        revealColumn={manualSelection ? { key: manualSelection.columnKey, requestId: manualSelection.requestId } : null}
        renderCell={(column, row, rowIndex) => {
          const slotId = getSlotId(column, row.startTime)
          return (
            <ScheduleCell
              key={slotId}
              slotId={slotId}
              column={column.key}
              row={rowIndex}
              startTime={row.startTime}
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
