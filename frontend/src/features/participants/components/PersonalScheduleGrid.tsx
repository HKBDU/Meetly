import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"

import { formatDateLabel, getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import { useParticipantStore } from "@/features/participants/store"
import { Alert, AlertDescription, AlertTitle, Button } from "@/shared/components/ui"
import { cn } from "@/lib/utils"

/** Khớp `HeatmapCell` để 2 lưới đồng bộ */
const CELL_HEIGHT_CLASS = "h-5"

const TIME_LABEL_COLUMN_WIDTH = 44
const MIN_DAY_COLUMN_WIDTH = 75
const MAX_DAY_COLUMN_WIDTH = 139
const MOBILE_DAYS_PER_PAGE = 3
const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)"
/** Khớp `gap-x-px` của container lưới */
const GAP_WIDTH_PX = 1

/**
 * Viền dọc giữa cột giờ và cột ngày đầu tiên. Không dùng gap đen như các cột
 * khác vì gap 1px này bị raster đậm hơn ở scale hệ điều hành lẻ (vd 125%).
 */
const TIME_COLUMN_DIVIDER_CLASS = "border-r border-slate-300 shadow-[1px_0_0_0_var(--card)]"

/**
 * Làm tròn độ rộng cột ngày về dạng `4k - 1` để `dayColumnWidth + gap` là bội
 * số của 4, giúp mọi đường kẻ dọc được khử răng cưa giống nhau ở các mức scale
 * 100-200%.
 */
function snapDayColumnWidth(rawWidth: number): number {
  const snapped = Math.floor((rawWidth + 1) / 4) * 4 - 1
  return Math.min(MAX_DAY_COLUMN_WIDTH, Math.max(MIN_DAY_COLUMN_WIDTH, snapped))
}

interface ScheduleCellProps {
  slotId: string
  date: string
  row: number
  /** Ô đầu của giờ tròn (09:00, 10:00...) */
  isHourStart: boolean
  /** Ô đầu của mốc nửa giờ (09:30, 10:30...) */
  isHalfHourStart: boolean
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
  onPointerEnter: (event: React.PointerEvent<HTMLDivElement>) => void
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
    <div
      data-slot-id={slotId}
      data-date={date}
      data-row={row}
      onPointerDown={isFinalized ? undefined : onPointerDown}
      onPointerEnter={isFinalized ? undefined : onPointerEnter}
      className={cn(
        CELL_HEIGHT_CLASS,
        "w-full transition-colors duration-75",
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
  const slotsPerHour = config ? Math.round(60 / config.slotMinutes) : 1

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [dayColumnWidth, setDayColumnWidth] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
  )
  const [mobilePage, setMobilePage] = useState(0)
  const dateCount = config?.dates.length ?? 0
  const mobilePageCount = Math.max(1, Math.ceil(dateCount / MOBILE_DAYS_PER_PAGE))
  const currentMobilePage = Math.min(mobilePage, mobilePageCount - 1)
  const visibleDates = useMemo(() => {
    if (!config) return []
    if (!isMobile) return config.dates

    const start = currentMobilePage * MOBILE_DAYS_PER_PAGE
    return config.dates.slice(start, start + MOBILE_DAYS_PER_PAGE)
  }, [config, currentMobilePage, isMobile])
  const visibleDateCount = visibleDates.length

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY)
    const updateViewportMode = () => setIsMobile(mediaQuery.matches)

    updateViewportMode()
    mediaQuery.addEventListener("change", updateViewportMode)
    return () => mediaQuery.removeEventListener("change", updateViewportMode)
  }, [])

  // Đo độ rộng cột bằng JS thay vì `1fr`, xem `snapDayColumnWidth`
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el || visibleDateCount === 0) return

    function recompute() {
      const available =
        el!.clientWidth - TIME_LABEL_COLUMN_WIDTH - visibleDateCount * GAP_WIDTH_PX
      setDayColumnWidth(snapDayColumnWidth(available / visibleDateCount))
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleDateCount, isMobile])

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading schedule...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4">
      {isFinalized && (
        <Alert className="border-primary/30 bg-primary/5">
          <Lock className="size-4 text-primary" />
          <AlertTitle>This event has been finalized</AlertTitle>
          <AlertDescription>
            {finalizedMessage ?? "The schedule can no longer be edited."}
          </AlertDescription>
        </Alert>
      )}

      {isMobile && dateCount > MOBILE_DAYS_PER_PAGE && (
        <nav
          aria-label={config.dateMode === "DAYS_OF_WEEK" ? "Weekday pages" : "Date pages"}
          className="flex items-center justify-between gap-3"
        >
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11"
            aria-label="Show previous three days"
            disabled={currentMobilePage === 0}
            onClick={() => setMobilePage(Math.max(0, currentMobilePage - 1))}
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <span className="text-center text-xs font-medium text-muted-foreground" aria-live="polite">
            {config.dateMode === "DAYS_OF_WEEK" ? "Weekdays" : "Days"}{" "}
            {currentMobilePage * MOBILE_DAYS_PER_PAGE + 1}
            {"–"}
            {Math.min((currentMobilePage + 1) * MOBILE_DAYS_PER_PAGE, dateCount)} of {dateCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11"
            aria-label="Show next three days"
            disabled={currentMobilePage === mobilePageCount - 1}
            onClick={() =>
              setMobilePage(Math.min(mobilePageCount - 1, currentMobilePage + 1))
            }
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </nav>
      )}

      {/* Khung ngoài luôn `w-full` để đo `clientWidth` mà không bị vòng lặp với card co giãn bên trong */}
      <div ref={scrollContainerRef} className="w-full">
        <div className="mx-auto w-fit max-w-full overflow-hidden border border-slate-300 bg-white">
          <div className="overflow-x-auto">
            <div
              // gap-x-px + nền tối tạo đường kẻ dọc liền mạch giữa các cột
              className={cn("grid select-none gap-x-px bg-slate-300", dayColumnWidth ? "w-fit" : "w-full")}
              style={{
                gridTemplateColumns: dayColumnWidth
                  ? `${TIME_LABEL_COLUMN_WIDTH}px repeat(${visibleDateCount}, ${dayColumnWidth}px)`
                  : `${TIME_LABEL_COLUMN_WIDTH}px repeat(${visibleDateCount}, minmax(${MIN_DAY_COLUMN_WIDTH}px, ${MAX_DAY_COLUMN_WIDTH}px))`,
              }}
            >
              <div
                className={cn(
                  "sticky top-0 left-0 z-20 flex items-center justify-end bg-white px-1.5",
                  TIME_COLUMN_DIVIDER_CLASS
                )}
              >
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                  Time
                </span>
              </div>
              {visibleDates.map((date) => {
                const { weekday, weekdayShort, dayMonth } = formatDateLabel(date)
                return (
                  <div
                    key={date}
                    className="sticky top-0 z-10 bg-white py-1 text-center sm:py-1.5"
                  >
                    <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
                      {weekdayShort}
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {config.dateMode === "SPECIFIC_DATES" ? dayMonth : weekday}
                    </div>
                  </div>
                )
              })}

              {times.map((time, rowIndex) => {
                const isHourStart = time.endsWith(":00")
                const isHalfHourStart = time.endsWith(":30")
                return (
                  <Fragment key={time}>
                    {isHourStart && (
                      // Nhãn giờ chiếm `slotsPerHour` hàng, ghim sát mép trên khối
                      <div
                        className={cn(
                          "sticky left-0 z-10 flex items-start justify-end bg-white px-1.5 pt-0.5",
                          TIME_COLUMN_DIVIDER_CLASS
                        )}
                        style={{ gridRow: `span ${slotsPerHour}` }}
                      >
                        <span className="text-[10px] text-muted-foreground">{time}</span>
                      </div>
                    )}
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
                  </Fragment>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
