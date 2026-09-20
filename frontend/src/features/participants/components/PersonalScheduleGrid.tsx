import { memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Lock } from "lucide-react"

import { MOBILE_COLUMNS_PER_PAGE } from "@/features/heatmap/constants"
import { getColumnPage, getPageCount } from "@/features/heatmap/time"
import { formatDateLabel, getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import { useParticipantStore } from "@/features/participants/store"
import { ColumnPager } from "@/shared/components/ColumnPager"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui"
import { cn } from "@/lib/utils"
import { formatDate, formatHourLabel } from "@/lib/date-time"

/** Cột ngày không được nhỏ hơn mức này trước khi lưới chuyển sang trang kế tiếp. */
const TIME_COLUMN_WIDTH = 44
const MIN_DAY_COLUMN_WIDTH = 75
/** Từ 1-3 ngày trên desktop, lưới không rộng hơn vùng table tối đa của heatmap tổng. */
const COMPACT_LAYOUT_MAX_COLUMNS = 3
const GROUP_HEATMAP_MAX_WIDTH = 1052
const MOBILE_BREAKPOINT_QUERY = "(max-width: 767px)"

interface ScheduleCellProps {
  slotId: string
  date: string
  row: number
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
  date,
  row,
  isHourStart,
  isHalfHourStart,
  onPointerDown,
  onPointerEnter,
}: ScheduleCellProps) {
  // "Được tô" chỉ là rảnh hay bận tuỳ paintMode, xem useAutoSaveSchedule
  const isPainted = useParticipantStore((s) => s.selectedSlotIds.has(slotId))
  const isFinalized = useParticipantStore((s) => s.isFinalized)

  return (
    <td
      data-slot-id={slotId}
      data-date={date}
      data-row={row}
      onPointerDown={isFinalized ? undefined : onPointerDown}
      onPointerEnter={isFinalized ? undefined : onPointerEnter}
      className={cn(
        "h-5 border-r border-slate-300/60 p-0 transition-colors duration-75",
        // Thiếu touch-none thì kéo ngang trên mobile bị hiểu thành cuộn trang
        !isFinalized && "touch-none select-none",
        isHourStart && "border-t border-solid border-slate-300",
        isHalfHourStart && "border-t border-dashed border-slate-200/70",
        isFinalized
          ? cn("cursor-not-allowed", isPainted ? "availability-level-5 opacity-50" : "bg-muted")
          : cn(
              "cursor-pointer",
              isPainted
                ? "availability-level-5 hover:brightness-95"
                : "availability-level-0 hover:bg-accent"
            )
      )}
    />
  )
})

interface PersonalScheduleGridProps {
  /** Nhận từ cha để kéo chuột, "Chọn thủ công" và "Xoá hết" dùng chung 1 debounce lưu */
  triggerAutoSave: () => void
}

export function PersonalScheduleGrid({ triggerAutoSave }: PersonalScheduleGridProps) {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const finalizedMessage = useParticipantStore((s) => s.finalizedMessage)

  const { handleCellPointerDown, handleCellPointerEnter } = useOptimizedDrag({
    onDragEnd: triggerAutoSave,
  })

  const times = useMemo(() => (config ? getGridTimes(config) : []), [config])

  const gridContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  )
  const [containerWidth, setContainerWidth] = useState(0)
  const [page, setPage] = useState(0)
  const dates = config?.dates ?? []
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

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading schedule...
      </div>
    )
  }

  return (
    <section className="p-3 sm:p-4" aria-label="My schedule">
      {isFinalized && (
        <Alert className="mb-3 w-fit max-w-full border-primary/30 bg-primary/5">
          <Lock className="size-4 text-primary" />
          <AlertTitle>This event has been finalized</AlertTitle>
          <AlertDescription>
            {finalizedMessage ?? "The schedule can no longer be edited."}
          </AlertDescription>
        </Alert>
      )}

      <ColumnPager
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
        label="Schedule date pages"
      />

      <div ref={gridContainerRef} className="overflow-x-auto">
        <div
          className="mx-auto w-full border border-slate-300 bg-white"
          style={
            usesCompactLayout
              ? {
                  maxWidth: GROUP_HEATMAP_MAX_WIDTH,
                }
              : undefined
          }
        >
        <table className="w-full table-fixed border-collapse select-none">
          <thead className="bg-white">
            <tr>
              <th
                scope="col"
                style={{ width: TIME_COLUMN_WIDTH }}
                className="border-b border-r border-slate-200 p-1 text-xs text-slate-500"
              >
                Time
              </th>
              {visibleDates.map((date) => {
                const { weekday } = formatDateLabel(date)
                const detail =
                  config.dateMode === "SPECIFIC_DATES" ? formatDate(date) : "Weekly"
                return (
                  <th
                    scope="col"
                    key={date}
                    title={`${weekday} ${detail}`}
                    className="border-b border-r border-slate-200 px-1 py-2 text-xs font-semibold last:border-r-0 sm:py-3 sm:text-sm"
                  >
                    <span className="sm:hidden">{weekday.slice(0, 3)}</span>
                    <span className="hidden sm:inline">{weekday}</span>
                    <span className="mt-1 block truncate text-[10px] font-normal text-slate-500 sm:text-xs">
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
                      "border-r border-slate-200 bg-white px-1 text-left text-xs font-medium text-slate-500",
                      isHourStart
                        ? "border-t border-t-slate-300 align-top pt-1"
                        : "border-t border-t-transparent"
                    )}
                  >
                    {isHourStart ? formatHourLabel(time) : null}
                  </th>
                  {visibleDates.map((date) => {
                    const slotId = getSlotId(date, time)
                    return (
                      <ScheduleCell
                        key={slotId}
                        slotId={slotId}
                        date={date}
                        row={rowIndex}
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
