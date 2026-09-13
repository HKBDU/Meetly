import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { CloudCheck, Loader2, Lock } from "lucide-react"

import { formatDateLabel, getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import { useParticipantStore } from "@/features/participants/store"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui"
import { cn } from "@/lib/utils"

/** Chiều cao 1 ô - 4 ô/giờ (15p) cộng lại vẫn bằng đúng 1 khung giờ "gọn" như bản 30p/2-ô cũ */
const CELL_HEIGHT_CLASS = "h-3"

/** Độ rộng cột nhãn giờ bên trái (cột đầu tiên của grid) */
const TIME_LABEL_COLUMN_WIDTH = 44
const MIN_DAY_COLUMN_WIDTH = 40
/** Khớp với `gap-x-px` trên container - PHẢI cộng vào khi tính tổng độ rộng lưới */
const GAP_WIDTH_PX = 1

/**
 * Làm tròn độ rộng cột ngày về BỘI SỐ CỦA 4px.
 *
 * Lý do: trước đây các cột ngày dùng `1fr` (co giãn tự động theo trình
 * duyệt) nên biên mỗi cột rơi vào toạ độ CSS lẻ (không phải số nguyên) tuỳ
 * theo độ rộng khung nhìn hiện có. Trên màn hình scale khác 100%
 * (devicePixelRatio lẻ như 1.25/1.5/1.75 - rất phổ biến trên Windows), biên
 * cột ở toạ độ lẻ có lúc rơi gọn vào ĐÚNG 1 pixel vật lý (nét mảnh), có lúc
 * rơi vắt qua 2 pixel vật lý kề nhau (bị khử răng cưa mờ ra -> nhìn ĐẬM hơn
 * hẳn) - tuỳ ngẫu nhiên theo độ rộng khung nhìn, nên 1-2 đường kẻ dọc trông
 * đậm/nhạt khác nhau dù cùng 1 style.
 *
 * 4px là bội số chung nhỏ nhất để `4 * dpr` luôn ra số nguyên với MỌI mức
 * scale phổ biến (100%, 125%, 150%, 175%, 200% - tức dpr = 1, 1.25, 1.5,
 * 1.75, 2). Vì mọi cột đều rộng bằng bội số của 4px, biên cột thứ i luôn
 * cách biên cột đầu tiên đúng `i * (bội số 4)` px - tức LUÔN lệch cùng một
 * mức lẻ pixel vật lý so với điểm bắt đầu (dù điểm bắt đầu đó có lẻ hay
 * không) -> mọi đường kẻ dọc được trình duyệt bo tròn/khử răng cưa GIỐNG HỆT
 * nhau, không còn đường nào đậm hơn đường nào nữa.
 */
function snapDayColumnWidth(rawWidth: number): number {
  const snapped = Math.floor(rawWidth / 4) * 4
  return Math.max(MIN_DAY_COLUMN_WIDTH, snapped)
}

interface ScheduleCellProps {
  slotId: string
  date: string
  row: number
  /** true nếu đây là ô đầu tiên của 1 khung giờ tròn mới (VD: đúng 09:00, 10:00...) */
  isHourStart: boolean
  /** true nếu đây là ô đầu tiên của mốc nửa giờ (VD: đúng 09:30, 10:30...) */
  isHalfHourStart: boolean
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void
  onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => void
}

/**
 * Ô lưới - được memo hoá và tự subscribe đúng 1 giá trị boolean của
 * riêng nó. Đây là chốt chặn quan trọng nhất giúp kéo thả mượt: khi 1 ô
 * đổi trạng thái, chỉ mình nó re-render, các ô khác (và component cha)
 * hoàn toàn đứng yên.
 *
 * data-date/data-row cho phép useOptimizedDrag lấp đầy các ô bị "nhảy
 * cóc" khi chuột di chuyển nhanh hơn tần suất sự kiện mouseenter.
 */
const ScheduleCell = memo(function ScheduleCell({
  slotId,
  date,
  row,
  isHourStart,
  isHalfHourStart,
  onMouseDown,
  onMouseEnter,
}: ScheduleCellProps) {
  // isPainted = ô đang được tô, KHÔNG có nghĩa cố định là "rảnh":
  // ý nghĩa thật (rảnh/bận) chỉ được diễn giải lúc lưu, xem useAutoSaveSchedule.
  const isPainted = useParticipantStore((s) => s.selectedSlotIds.has(slotId))
  const isFinalized = useParticipantStore((s) => s.isFinalized)

  return (
    <div
      data-slot-id={slotId}
      data-date={date}
      data-row={row}
      onMouseDown={isFinalized ? undefined : onMouseDown}
      onMouseEnter={isFinalized ? undefined : onMouseEnter}
      className={cn(
        CELL_HEIGHT_CLASS,
        "w-full transition-colors duration-75",
        // Đường kẻ DỌC phân cách cột ngày KHÔNG dùng border nữa (xem
        // container `.grid` ở dưới - dùng column-gap + nền đen lộ qua khe hở
        // để vẽ 1 đường LIỀN DUY NHẤT suốt chiều cao lưới). Border-right vẽ
        // riêng cho từng ô (48 ô xếp chồng theo chiều dọc) từng bị lệch
        // pixel nhỏ giữa các hàng khi trình duyệt bo tròn kích thước, nhìn
        // như đường đứt đoạn - kỹ thuật gap tránh hẳn vấn đề này.
        //
        // Đường kẻ NGANG có 2 cấp - nét liền đậm ở đầu mỗi khung giờ tròn
        // (09:00, 10:00...), nét liền NHẠT hơn (đen 40%) ở mốc nửa giờ
        // (09:30...) để phân biệt mà không cắt vụn ô. Không kẻ gì ở các mốc
        // phút lẻ còn lại (15p, 45p) - giữ 4 ô trong 1 giờ nhìn liền khối.
        isHourStart && "border-t border-black",
        isHalfHourStart && "border-t border-black/40",
        isFinalized
          ? cn("cursor-not-allowed", isPainted ? "bg-primary/50" : "bg-muted")
          : cn(
              "cursor-pointer",
              isPainted ? "bg-primary hover:bg-primary/90" : "bg-white hover:bg-accent"
            )
      )}
    />
  )
})

interface PersonalScheduleGridProps {
  /**
   * Nhận từ component cha (PersonalScheduleView) thay vì tự gọi
   * `useAutoSaveSchedule()` ở đây - để "Chọn thủ công" và "Xoá hết" (các nơi
   * KHÁC cũng làm thay đổi lịch, không qua kéo chuột) dùng CHUNG đúng 1 đồng
   * hồ debounce + 1 trạng thái "Đang lưu/Đã đồng bộ" duy nhất, thay vì mỗi
   * nơi tự có 1 bản debounce riêng (dễ gây gọi API trùng lặp hoặc UI hiển thị
   * sai trạng thái lưu).
   */
  triggerAutoSave: () => void
  isSaving: boolean
}

export function PersonalScheduleGrid({ triggerAutoSave, isSaving }: PersonalScheduleGridProps) {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const finalizedMessage = useParticipantStore((s) => s.finalizedMessage)

  const { handleCellMouseDown, handleCellMouseEnter } = useOptimizedDrag({
    onDragEnd: triggerAutoSave,
  })

  const times = useMemo(() => (config ? getGridTimes(config) : []), [config])
  // Số ô trong 1 khung giờ tròn (VD: slotMinutes=15 -> 4 ô/giờ) - dùng để
  // nhãn giờ bên trái chiếm đúng `slotsPerHour` hàng (gridRow: span), thay vì
  // kéo lệch bằng CSS transform như bản cũ (nguyên nhân gây đường kẻ giờ bị
  // lệch/cắt ngang không đồng bộ).
  const slotsPerHour = config ? Math.round(60 / config.slotMinutes) : 1

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [dayColumnWidth, setDayColumnWidth] = useState<number | null>(null)
  const dateCount = config?.dates.length ?? 0

  // Đo độ rộng cột ngày bằng JS (thay vì để CSS Grid tự co giãn `1fr`) - xem
  // comment ở `snapDayColumnWidth` để hiểu vì sao cần làm tròn về bội số 4px.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el || dateCount === 0) return

    function recompute() {
      // Trừ luôn tổng độ rộng các khe hở `gap-x-px` giữa các cột (dateCount
      // khe, mỗi khe 1px) - thiếu bước này khiến tổng độ rộng lưới THỰC TẾ
      // (đã cộng thêm các khe) vượt quá độ rộng khung nhìn vài px, lòi ra 1
      // thanh cuộn ngang không mong muốn.
      const available = el!.clientWidth - TIME_LABEL_COLUMN_WIDTH - dateCount * GAP_WIDTH_PX
      setDayColumnWidth(snapDayColumnWidth(available / dateCount))
    }

    recompute()
    const observer = new ResizeObserver(recompute)
    observer.observe(el)
    return () => observer.disconnect()
  }, [dateCount])

  if (!config) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading schedule...
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:p-4">
      {isFinalized && (
        <Alert className="border-primary/30 bg-primary/5">
          <Lock className="size-4 text-primary" />
          <AlertTitle>This event has been finalized</AlertTitle>
          <AlertDescription>
            {finalizedMessage ?? "The schedule can no longer be edited."}
          </AlertDescription>
        </Alert>
      )}

      <span
        className={cn(
          "flex shrink-0 items-center justify-end gap-1 self-end text-xs font-medium",
          isSaving ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {isSaving ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <CloudCheck className="size-3.5" />
            Synced
          </>
        )}
      </span>

      {/*
       * Khung "card" bọc ngoài (viền + đổ bóng nhẹ) TÁCH BIỆT với đường kẻ
       * bên trong lưới (là ranh giới giữa các ô, xem ScheduleCell) - 2 hệ
       * viền khác vai trò nên khác màu/độ đậm là đúng, không phải thiếu nhất
       * quán.
       *
       * `flex-1 min-h-0` (thay vì chiều cao cố định trước đây) để lưới CHIẾM
       * ĐÚNG phần không gian còn lại của màn hình - vừa đủ cho ca thường gặp
       * (~7 cột ngày x 12 tiếng/ngày) mà không cần cuộn dọc; chỉ khi sự kiện
       * có nhiều ngày/giờ hơn mức đó thì `overflow-auto` mới thật sự cần cuộn.
       */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div ref={scrollContainerRef} className="min-h-0 flex-1 overflow-auto">
          <div
            // gap-x-px + bg-black: khe hở 1px giữa các cột để lộ ra nền đen
            // của chính container - vẽ đường kẻ DỌC LIỀN DUY NHẤT suốt chiều
            // cao lưới (bất kể có bao nhiêu hàng), thay vì border-right riêng
            // lẻ trên từng ô (xem comment ở ScheduleCell). Không đặt gap theo
            // hàng (row-gap) vì đa số các hàng vẫn cần liền khít nhau, chỉ
            // một số hàng mốc giờ mới có đường kẻ ngang (qua border-t riêng).
            //
            // Cột ngày dùng độ rộng CỐ ĐỊNH đo bằng JS (`dayColumnWidth`, xem
            // `snapDayColumnWidth`) thay vì `1fr` co giãn tự động - để MỌI
            // biên cột lệch cùng 1 mức lẻ pixel vật lý so với điểm bắt đầu,
            // tránh 1-2 đường kẻ dọc bị khử răng cưa mờ/đậm khác các đường
            // còn lại trên màn hình scale khác 100% (fallback `1fr` chỉ dùng
            // trong khoảnh khắc đầu tiên trước khi đo xong kích thước thật).
            //
            // `w-fit` (thay vì `w-full`) một khi đã đo xong - vì tổng độ
            // rộng các cột cố định thường KHÔNG khớp tuyệt đối với độ rộng
            // khung nhìn (đã làm tròn về bội số 4px) - nếu vẫn ép `w-full`,
            // phần dư ra bên phải sẽ lộ nền ĐEN của chính container này
            // (thay vì màu nền trắng của khung cuộn bên ngoài), nhìn như 1
            // vệt đen thừa xấu ở rìa phải.
            className={cn("grid select-none gap-x-px bg-black", dayColumnWidth ? "w-fit" : "w-full")}
            style={{
              gridTemplateColumns: dayColumnWidth
                ? `${TIME_LABEL_COLUMN_WIDTH}px repeat(${config.dates.length}, ${dayColumnWidth}px)`
                : `${TIME_LABEL_COLUMN_WIDTH}px repeat(${config.dates.length}, minmax(${MIN_DAY_COLUMN_WIDTH}px, 1fr))`,
            }}
          >
            {/* Hàng tiêu đề: ô góc + tên các ngày (hoặc tên thứ, nếu dateMode = DAYS_OF_WEEK).
                Không cần border-b riêng: hàng giờ đầu tiên (09:00) luôn là
                isHourStart nên border-t của chính nó đã vẽ đúng 1 đường kẻ
                ranh giới header/lưới - thêm border-b ở đây sẽ CHỒNG lên
                border-t đó, khiến đường này nhìn đậm gấp đôi các đường kẻ
                giờ khác trong lưới. */}
            <div className="sticky top-0 left-0 z-20 bg-muted" />
            {config.dates.map((date) => {
              const { weekday, weekdayShort, dayMonth } = formatDateLabel(date)
              return (
                <div
                  key={date}
                  className="sticky top-0 z-10 bg-muted py-1.5 text-center sm:py-2"
                >
                  <div className="text-[10px] font-medium tracking-wide text-muted-foreground">
                    {weekdayShort}
                  </div>
                  {/* DAYS_OF_WEEK lặp lại hàng tuần, không gắn ngày cụ thể nào -> hiện tên thứ đầy đủ thay vì ngày/tháng */}
                  <div className="text-sm font-bold text-foreground">
                    {config.dateMode === "SPECIFIC_DATES" ? dayMonth : weekday}
                  </div>
                </div>
              )
            })}

            {/* Các hàng khung giờ */}
            {times.map((time, rowIndex) => {
              const isHourStart = time.endsWith(":00")
              const isHalfHourStart = time.endsWith(":30")
              return (
                <Fragment key={time}>
                  {isHourStart && (
                    // Nhãn giờ chiếm `slotsPerHour` hàng liền để nằm gọn trong đúng
                    // khung giờ đó (VD: "09:00" bao trọn hết các ô 15 phút của giờ 9h).
                    // Nhờ CSS grid auto-flow, các hàng phụ (không phải isHourStart)
                    // KHÔNG render div này -> trình duyệt tự đẩy các ô lịch của hàng
                    // đó sang đúng cột kế tiếp, không cần tính toán vị trí thủ công.
                    <div
                      className="sticky left-0 z-10 border-t border-black bg-card px-1.5 pt-0.5 text-right"
                      style={{ gridRow: `span ${slotsPerHour}` }}
                    >
                      <span className="text-[10px] text-muted-foreground">{time}</span>
                    </div>
                  )}
                  {config.dates.map((date) => {
                    const slotId = getSlotId(date, time)
                    return (
                      <ScheduleCell
                        key={slotId}
                        slotId={slotId}
                        date={date}
                        row={rowIndex}
                        isHourStart={isHourStart}
                        isHalfHourStart={isHalfHourStart}
                        onMouseDown={handleCellMouseDown}
                        onMouseEnter={handleCellMouseEnter}
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
  )
}
