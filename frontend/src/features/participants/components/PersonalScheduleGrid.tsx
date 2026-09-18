import { memo, useLayoutEffect, useMemo, useState } from "react"
import { Lock } from "lucide-react"

import {
  DESKTOP_COLUMNS_PER_PAGE,
  MOBILE_COLUMNS_PER_PAGE,
} from "@/features/heatmap/constants"
import { getColumnPage, getPageCount } from "@/features/heatmap/time"
import { formatDateLabel, getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import { useParticipantStore } from "@/features/participants/store"
import { ColumnPager } from "@/shared/components/ColumnPager"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui"
import { cn } from "@/lib/utils"
import { formatDate, formatHourLabel } from "@/lib/date-time"

/** Cùng breakpoint `md` với heatmap tổng để hai lưới đổi bố cục cùng lúc */
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

  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  )
  const [page, setPage] = useState(0)
  const dates = config?.dates ?? []
  const pageSize = isMobile ? MOBILE_COLUMNS_PER_PAGE : DESKTOP_COLUMNS_PER_PAGE
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

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading schedule...
      </div>
    )
  }

  return (
    <section className="min-w-0" aria-label="My schedule">
      {isFinalized && (
        <Alert className="mb-3 border-primary/30 bg-primary/5">
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

      <div className="w-full overflow-hidden border border-slate-300 bg-white">
        <table className="w-full table-fixed border-collapse select-none">
          <thead className="bg-white">
            <tr>
              <th
                scope="col"
                className="w-14 border-b border-r border-slate-200 p-2 text-xs text-slate-500 sm:w-20"
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
                    {isMobile ? weekday.slice(0, 3) : weekday}
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
                      "w-14 border-r border-slate-200 bg-white px-1 text-left text-xs font-medium text-slate-500 sm:w-20 sm:px-2",
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
    </section>
  )
}
