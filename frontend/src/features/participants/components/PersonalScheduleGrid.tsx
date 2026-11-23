import { memo, useLayoutEffect, useRef, useState } from "react"

import { getColumnPage, getPageCount, MOBILE_COLUMNS_PER_PAGE } from "@/shared/grid/model"
import { getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import type { ScheduleGrid } from "@/features/participants/hooks/useScheduleGrid"
import { useParticipantStore } from "@/features/participants/store"
import { ColumnPager } from "@/shared/components/ColumnPager"
import { cn } from "@/lib/utils"
import { formatHourLabel } from "@/lib/date-time"

/** Cột ngày không được nhỏ hơn mức này trước khi lưới chuyển sang trang kế tiếp. */
const TIME_COLUMN_WIDTH = 44
const MIN_DAY_COLUMN_WIDTH = 75
/** Từ 1-3 ngày trên desktop, lưới không rộng hơn vùng table tối đa của heatmap tổng. */
const COMPACT_LAYOUT_MAX_COLUMNS = 3
const GROUP_HEATMAP_MAX_WIDTH = 1052
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)"

interface ScheduleCellProps {
  slotId: string
  column: string
  row: number
  locked: boolean
  /** Ô đầu của giờ tròn (09:00, 10:00...) */
  isHourStart: boolean
  /** Ô đầu của mốc nửa giờ (09:30, 10:30...) */
  isHalfHourStart: boolean
  onPointerDown: (event: React.PointerEvent<HTMLTableCellElement>) => void
  onPointerEnter: (event: React.PointerEvent<HTMLTableCellElement>) => void
}

/**
 * Memo hoá và chỉ subscribe boolean của riêng ô để khi kéo thả chỉ ô đổi
 * trạng thái mới re-render. `data-date`/`data-row` để `useOptimizedDrag` lấp
 * đầy các ô bị bỏ sót khi chuột di chuyển nhanh.
 */
const ScheduleCell = memo(function ScheduleCell({
  slotId,
  column,
  row,
  locked: isFinalized,
  isHourStart,
  isHalfHourStart,
  onPointerDown,
  onPointerEnter,
}: ScheduleCellProps) {
  // "Được tô" chỉ là rảnh hay bận tuỳ paintMode, xem useAutoSaveSchedule
  const isPainted = useParticipantStore((s) => s.selectedSlotIds.has(slotId))

  return (
    <td
      data-slot-id={slotId}
      data-column={column}
      data-row={row}
      onPointerDown={isFinalized ? undefined : onPointerDown}
      onPointerEnter={isFinalized ? undefined : onPointerEnter}
      className={cn(
        "h-5 border-r border-grid-line/60 p-0 transition-colors duration-75",
        // Thiếu touch-none thì kéo ngang trên mobile bị hiểu thành cuộn trang
        !isFinalized && "touch-none select-none",
        isHourStart && "border-t border-solid border-grid-line",
        isHalfHourStart && "border-t border-dashed border-grid-line-soft",
        isFinalized
          ? cn("cursor-not-allowed", isPainted ? "bg-heat-5 opacity-50" : "bg-muted")
          : cn(
              "cursor-pointer",
              isPainted
                ? "bg-heat-5 hover:brightness-95"
                : "bg-heat-0 hover:bg-accent"
            )
      )}
    />
  )
})

interface PersonalScheduleGridProps {
  grid: ScheduleGrid
  /** Nhận từ cha để kéo chuột, "Chọn thủ công" và "Xoá hết" dùng chung 1 debounce lưu */
  triggerAutoSave: () => void
  manualSelection: { columnKey: string; requestId: number } | null
}

export function PersonalScheduleGrid({
  grid,
  triggerAutoSave,
  manualSelection,
}: PersonalScheduleGridProps) {
  const { times, isLocked } = grid

  const { handleCellPointerDown, handleCellPointerEnter } = useOptimizedDrag({
    times,
    locked: isLocked,
    onDragEnd: triggerAutoSave,
  })

  const gridContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  )
  const [containerWidth, setContainerWidth] = useState(0)
  const [page, setPage] = useState(0)
  const [appliedManualSelectionKey, setAppliedManualSelectionKey] = useState<string | null>(null)
  const dates = grid.columns
  const usesCompactLayout = !isMobile && dates.length <= COMPACT_LAYOUT_MAX_COLUMNS
  const columnsThatFit =
    containerWidth > TIME_COLUMN_WIDTH
      ? Math.max(1, Math.floor((containerWidth - TIME_COLUMN_WIDTH) / MIN_DAY_COLUMN_WIDTH))
      : Math.max(1, dates.length)
  const pageSize = isMobile
    ? MOBILE_COLUMNS_PER_PAGE
    : usesCompactLayout
      ? Math.max(1, dates.length)
      : columnsThatFit
  const pageCount = getPageCount(dates.length, pageSize)
  const currentPage = Math.min(page, pageCount - 1)
  const visibleDates = getColumnPage(dates, currentPage, pageSize)
  const manualSelectionKey = manualSelection
    ? `${manualSelection.requestId}:${manualSelection.columnKey}:${pageSize}`
    : null

  // Điều chỉnh state ngay trong render có điều kiện để lần paint kế tiếp đã ở đúng page,
  // tránh một frame hiển thị trang cũ sau khi dialog đóng.
  if (manualSelection && manualSelectionKey !== appliedManualSelectionKey) {
    const selectedDateIndex = dates.findIndex((column) => column.key === manualSelection.columnKey)
    setAppliedManualSelectionKey(manualSelectionKey)
    if (selectedDateIndex >= 0) {
      setPage(Math.floor(selectedDateIndex / pageSize))
    }
  }

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
    const updateViewportMode = () => setIsMobile(mediaQuery.matches)

    updateViewportMode()
    mediaQuery.addEventListener("change", updateViewportMode)
    return () => mediaQuery.removeEventListener("change", updateViewportMode)
  }, [])

  useLayoutEffect(() => {
    const container = gridContainerRef.current
    if (!container) return

    const updateContainerWidth = () => setContainerWidth(container.clientWidth)
    updateContainerWidth()

    const resizeObserver = new ResizeObserver(updateContainerWidth)
    resizeObserver.observe(container)

    return () => resizeObserver.disconnect()
  }, [])

  return (
    <section className="p-3 sm:p-4" aria-label="My schedule">
      <ColumnPager
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        label="Schedule date pages"
      />

      <div ref={gridContainerRef} className="overflow-x-auto">
        <div
          className="mx-auto w-full border border-grid-line bg-card"
          style={
            usesCompactLayout
              ? {
                  maxWidth: GROUP_HEATMAP_MAX_WIDTH,
                }
              : undefined
          }
        >
        <table className="w-full table-fixed border-collapse select-none">
          <thead className="bg-card">
            <tr>
              <th
                scope="col"
                style={{ width: TIME_COLUMN_WIDTH }}
                className="border-b border-r border-border p-1 text-xs text-muted-foreground"
              >
                Time
              </th>
              {visibleDates.map((column) => {
                const weekday = column.label
                const detail = column.detail
                return (
                  <th
                    scope="col"
                    key={column.key}
                    title={`${weekday} ${detail}`}
                    className="border-b border-r border-border px-1 py-2 text-xs font-semibold last:border-r-0 sm:py-3 sm:text-sm"
                  >
                    <span className="sm:hidden">{weekday.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{weekday}</span>
                    <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground sm:text-xs">
                      {detail}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {times.map((time, rowIndex) => {
              const isHourStart = time.endsWith(":00")
              const isHalfHourStart = time.endsWith(":30")
              return (
                <tr key={time}>
                  <th
                    scope="row"
                    aria-label={time}
                    className={cn(
                      "border-r border-border bg-card px-1 text-left text-xs font-medium text-muted-foreground",
                      isHourStart
                        ? "border-t border-t-grid-line align-top pt-1"
                        : "border-t border-t-transparent"
                    )}
                  >
                    {isHourStart ? formatHourLabel(time) : null}
                  </th>
                  {visibleDates.map((column) => {
                    const slotId = getSlotId(column, time)
                    return (
                      <ScheduleCell
                        key={slotId}
                        slotId={slotId}
                        column={column.key}
                        row={rowIndex}
                        locked={isLocked}
                        isHourStart={isHourStart}
                        isHalfHourStart={isHalfHourStart}
                        onPointerDown={handleCellPointerDown}
                        onPointerEnter={handleCellPointerEnter}
                      />
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  )
}
