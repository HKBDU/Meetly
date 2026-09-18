import { Fragment, memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"

import { formatDateLabel, getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useOptimizedDrag } from "@/features/participants/hooks/useOptimizedDrag"
import { useParticipantStore } from "@/features/participants/store"
import { Alert, AlertDescription, AlertTitle, Button } from "@/shared/components/ui"
import { cn } from "@/lib/utils"

/** Chiều cao 1 ô - 4 ô/giờ (15p) cộng lại vẫn bằng đúng 1 khung giờ "gọn" như bản 30p/2-ô cũ */
const CELL_HEIGHT_CLASS = "h-3"

/** Độ rộng cột nhãn giờ bên trái (cột đầu tiên của grid) */
const TIME_LABEL_COLUMN_WIDTH = 44
/**
 * Chặn 2 đầu độ rộng cột ngày: ít ngày (VD 1-2 ngày) thì KHÔNG cho cột giãn
 * hết chiều ngang màn hình (xấu, ô quá to) - dừng lại ở `MAX` rồi để cả lưới
 * tự canh giữa (`mx-auto` ở div grid bên dưới). Nhiều ngày thì KHÔNG cho cột
 * hẹp hơn `MIN` - hẹp hơn nữa thì lưới sẽ rộng hơn khung nhìn, cuộn NGANG
 * (`overflow-x-auto` ở container) thay vì ép chữ/ô nhỏ tới mức khó bấm.
 */
const MIN_DAY_COLUMN_WIDTH = 75
const MAX_DAY_COLUMN_WIDTH = 139
const MOBILE_DAYS_PER_PAGE = 3
const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)"
/** Khớp với `gap-x-px` trên container - PHẢI cộng vào khi tính tổng độ rộng lưới */
const GAP_WIDTH_PX = 1

/**
 * Đường kẻ DỌC ranh giới cột giờ/cột ngày đầu tiên (dùng cho cả ô góc "Time"
 * lẫn từng ô nhãn giờ bên dưới nó) KHÔNG dùng chung kỹ thuật gap-x-px+bg-black
 * như các đường kẻ dọc còn lại giữa các cột ngày - đo trực tiếp bằng
 * `getBoundingClientRect` phát hiện đúng 1px gap đó luôn hiển thị ĐẬM HƠN hẳn
 * so với các gap khác (đã thử: không phải do `position: sticky`, không phải do
 * border/box-shadow lạ - chỉ còn lại là do gap 1px raster hoá không đều ở các
 * mức scale hệ điều hành lẻ, cụ thể đã tái hiện ở 125%). Sửa bằng cách "xoá"
 * đoạn gap đen đó bằng `shadow` màu `--card` rồi tự vẽ 1 đường viền NHẠT
 * (`border-border`, không phải đen) đè lên - vừa hết đậm vừa nhẹ mắt hơn hẳn,
 * đã kiểm chứng trực tiếp bằng cách patch style live trên DOM trước khi đưa
 * vào code.
 */
const TIME_COLUMN_DIVIDER_CLASS = "border-r border-border shadow-[1px_0_0_0_var(--card)]"

/**
 * Làm tròn độ rộng cột ngày về dạng `4k - 1` (39, 43, 47, 51...) - LỆCH 1px
 * so với bội số 4 "thuần", vì lý do sau:
 *
 * Biên (đường kẻ dọc) giữa 2 cột NGÀY thứ i và i+1 không cách nhau đúng
 * `dayColumnWidth` px - nó cách nhau `dayColumnWidth + GAP_WIDTH_PX` (1px gap
 * CŨNG cộng dồn mỗi cột). Bản trước chỉ làm tròn `dayColumnWidth` về bội số
 * 4px mà quên mất phần gap 1px cộng dồn NÀY không phải bội số 4 -> mỗi cột
 * thực tế lệch pha đi 1px so với bội-số-4, khiến biên cột thứ i cách biên cột
 * đầu tiên đúng `i * (dayColumnWidth + 1)` px - một số bội số của 4, một số
 * thì không (tuỳ i) -> vẫn có 1-2 đường kẻ dọc GIỮA CÁC CỘT NGÀY (không chỉ
 * riêng biên cột giờ, xem `TIME_COLUMN_DIVIDER_CLASS`) bị khử răng cưa mờ ra
 * nhìn đậm hơn hẳn các đường còn lại, tuỳ vị trí cột - lỗi này được phát hiện
 * sau khi user báo tiếp 1 đường kẻ đậm bất thường ở 1 cặp cột ngày bất kỳ
 * (không phải Time/cột đầu, đã xử lý riêng), chứng tỏ bản chặn theo bội số 4
 * "thuần" là chưa đủ.
 *
 * Sửa đúng gốc: làm tròn sao cho `dayColumnWidth + GAP_WIDTH_PX` (chính là
 * khoảng cách LẶP LẠI thực tế giữa các biên cột) mới là bội số của 4 - tức
 * `dayColumnWidth` phải ≡ 3 (mod 4), tức dạng `4k - 1`. Khi đó biên cột thứ i
 * luôn cách biên cột đầu tiên (mốc `TIME_LABEL_COLUMN_WIDTH`, cũng là bội số
 * 4) đúng `i * (bội số 4)` px - LUÔN lệch cùng 1 mức lẻ pixel vật lý so với
 * điểm bắt đầu ở MỌI mức scale phổ biến (100/125/150/175/200%, dpr =
 * 1/1.25/1.5/1.75/2 - 4px vẫn là bội số chung nhỏ nhất an toàn cho cả 5 mức
 * này) -> mọi đường kẻ dọc giữa các cột ngày được trình duyệt bo tròn/khử
 * răng cưa GIỐNG HỆT nhau.
 */
function snapDayColumnWidth(rawWidth: number): number {
  const snapped = Math.floor((rawWidth + 1) / 4) * 4 - 1
  return Math.min(MAX_DAY_COLUMN_WIDTH, Math.max(MIN_DAY_COLUMN_WIDTH, snapped))
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
        // Đường kẻ NGANG có 2 cấp, CÙNG 1 độ đậm (đen, không chênh opacity
        // như bản cũ - bị chê "chỗ đậm chỗ nhạt") - phân biệt hoàn toàn bằng
        // KIỂU nét: liền ở đầu mỗi khung giờ tròn (09:00, 10:00...), đứt nét
        // ở mốc nửa giờ (09:30...). Không kẻ gì ở các mốc phút lẻ còn lại
        // (15p, 45p) - giữ 4 ô trong 1 giờ nhìn liền khối.
        isHourStart && "border-t border-black",
        isHalfHourStart && "border-t border-dashed border-black",
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
}

export function PersonalScheduleGrid({ triggerAutoSave }: PersonalScheduleGridProps) {
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

  // Đo độ rộng cột ngày bằng JS (thay vì để CSS Grid tự co giãn `1fr`) - xem
  // comment ở `snapDayColumnWidth` để hiểu vì sao cần làm tròn về bội số 4px.
  useLayoutEffect(() => {
    const el = scrollContainerRef.current
    if (!el || visibleDateCount === 0) return

    function recompute() {
      // Trừ luôn tổng độ rộng các khe hở `gap-x-px` giữa các cột đang hiển thị
      // (mỗi khe 1px) - thiếu bước này khiến tổng độ rộng lưới THỰC TẾ
      // (đã cộng thêm các khe) vượt quá độ rộng khung nhìn vài px, lòi ra 1
      // thanh cuộn ngang không mong muốn.
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

      {/*
       * `scrollContainerRef` nằm trên 1 khung NGOÀI CÙNG luôn `w-full` riêng,
       * TÁCH khỏi khung "card" bên trong nó - card đó mới là cái co giãn/canh
       * giữa theo nội dung (xem bên dưới). Đo `clientWidth` từ khung luôn giữ
       * nguyên chiều rộng này để tránh vòng lặp phản hồi: nếu đo ngay trên
       * chính cái card đang co giãn, mỗi lần card co lại sẽ làm số đo giảm
       * theo, khiến `dayColumnWidth` bị tính sai ở lần đo tiếp theo.
       */}
      <div ref={scrollContainerRef} className="w-full">
        {/*
         * Khung "card" bọc ngoài (viền + đổ bóng nhẹ) TÁCH BIỆT với đường kẻ
         * bên trong lưới (là ranh giới giữa các ô, xem ScheduleCell) - 2 hệ
         * viền khác vai trò nên khác màu/độ đậm là đúng, không phải thiếu
         * nhất quán.
         *
         * `w-fit mx-auto` - card BỌC SÁT lấy đúng chiều rộng thật của lưới
         * (không còn kiểu lưới co lại nằm giữa còn viền/khung thì vẫn kéo dài
         * hết màn hình, để trống 2 bên nhìn xấu - feedback trực tiếp) rồi tự
         * canh giữa nếu lưới hẹp hơn khung nhìn (VD: sự kiện chỉ có 1-2
         * ngày). `max-w-full` chặn lại khi lưới RỘNG HƠN khung nhìn (nhiều
         * ngày, mỗi cột đã dừng ở `MIN_DAY_COLUMN_WIDTH`) - lúc đó card lấp
         * đầy khung nhìn, phần lưới dư ra cuộn ngang bên trong nhờ
         * `overflow-x-auto` ở khung con.
         *
         * KHÔNG còn `overflow-auto` theo chiều dọc nữa - chiều cao lưới giờ
         * hoàn toàn TỰ NHIÊN theo nội dung (bao nhiêu giờ thì cao bấy nhiêu),
         * để khi lưới dài hơn 1 màn hình thì CẢ TRANG tự cuộn (xem App.tsx)
         * thay vì tạo thanh cuộn dọc riêng bên trong.
         */}
        <div className="mx-auto w-fit max-w-full overflow-hidden rounded-md border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
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
              // `w-fit` (thay vì `w-full`) một khi đã đo xong - đây chính là
              // chiều rộng "thật" mà card cha ở trên bọc sát theo (grid có
              // track cố định bằng px nên min-content = max-content = đúng
              // tổng độ rộng này, `w-fit` không thể ép nó nhỏ hơn được, chỉ có
              // thể tràn ra ngoài rồi cuộn - xem comment ở card cha).
              className={cn("grid select-none gap-x-px bg-black", dayColumnWidth ? "w-fit" : "w-full")}
              style={{
                gridTemplateColumns: dayColumnWidth
                  ? `${TIME_LABEL_COLUMN_WIDTH}px repeat(${visibleDateCount}, ${dayColumnWidth}px)`
                  : `${TIME_LABEL_COLUMN_WIDTH}px repeat(${visibleDateCount}, minmax(${MIN_DAY_COLUMN_WIDTH}px, ${MAX_DAY_COLUMN_WIDTH}px))`,
              }}
            >
              {/* Hàng tiêu đề: ô góc + tên các ngày (hoặc tên thứ, nếu dateMode = DAYS_OF_WEEK).
                  Không cần border-b riêng: hàng giờ đầu tiên (09:00) luôn là
                  isHourStart nên border-t của chính nó đã vẽ đúng 1 đường kẻ
                  ranh giới header/lưới - thêm border-b ở đây sẽ CHỒNG lên
                  border-t đó, khiến đường này nhìn đậm gấp đôi các đường kẻ
                  giờ khác trong lưới.
                  Padding giảm nhẹ (`py-1 sm:py-1.5`, trước là `py-1.5 sm:py-2`)
                  để hàng tiêu đề gọn lại, đường kẻ đầu tiên (09:00) nằm khít
                  hơn ngay dưới tiêu đề thay vì cách xa. Ô góc đổi từ `bg-muted`
                  (xám, trống) sang `bg-card` (trắng, giống cột giờ bên dưới nó)
                  + chữ "Time" - đồng bộ màu với cột giờ, không còn là 1 ô xám
                  trống lạc lõng. */}
              <div
                className={cn(
                  "sticky top-0 left-0 z-20 flex items-center justify-end bg-card px-1.5",
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
                    className="sticky top-0 z-10 bg-muted py-1 text-center sm:py-1.5"
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
                      //
                      // `flex items-start` + `pt-0.5` ghim nhãn SÁT MÉP TRÊN của khối
                      // (đúng ngay đường kẻ isHourStart, VD "09:00" nằm khớp đường kẻ
                      // đầu khung giờ 9h) - trước đây dùng `items-center` canh nhãn
                      // vào GIỮA khối 4 ô khiến "09:00" trông như đang ở mốc 09:30,
                      // tạo cảm giác lưới thừa/lệch 30p ở đầu và cuối ngày (feedback).
                      <div
                        className={cn(
                          "sticky left-0 z-10 flex items-start justify-end bg-card px-1.5 pt-0.5",
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
    </div>
  )
}
