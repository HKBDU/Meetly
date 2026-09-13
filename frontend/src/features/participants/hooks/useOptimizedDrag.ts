import { useCallback, useEffect, useRef, useState } from "react"

import { getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"

interface UseOptimizedDragOptions {
  /** Gọi khi 1 lượt kéo thả kết thúc (nhả chuột) - dùng để trigger auto-save */
  onDragEnd: () => void
}

interface LastCell {
  slotId: string
  date: string
  row: number
}

/**
 * Hook xử lý kéo thả tô lịch, tối ưu để KHÔNG re-render toàn bộ lưới.
 * ---------------------------------------------------------------------
 * Nguyên lý:
 * 1. Trạng thái "đang kéo" (dragging) nằm trong useRef, không phải
 *    useState -> di chuyển chuột qua từng ô không kích hoạt render.
 * 2. Mỗi ô tự subscribe vào đúng 1 giá trị boolean của riêng nó trong
 *    Zustand store (freeSlotIds.has(slotId)) -> khi tô 1 ô, chỉ ô đó
 *    (và ô trước đó nếu có) re-render, các ô còn lại đứng yên.
 * 3. Các handler trả về ở đây có tham chiếu (reference) không đổi giữa
 *    các lần render (useCallback, deps rỗng) nên có thể gắn thẳng cho
 *    hàng trăm ô mà không phá vỡ React.memo của ScheduleCell.
 * 4. Đọc isFinalized bằng store.getState() (không phải hook reactive)
 *    ngay tại thời điểm sự kiện xảy ra, để bản thân hook này (và
 *    component gọi nó) không phải re-render theo state đó.
 * 5. TÔ hay XOÁ trong 1 lượt kéo được quyết định NGAY LÚC MOUSEDOWN, dựa
 *    vào trạng thái của ô đầu tiên được nhấn: nếu ô đó đang RỖNG -> cả
 *    lượt kéo này sẽ TÔ; nếu ô đó đang ĐƯỢC TÔ SẴN -> cả lượt kéo này sẽ
 *    XOÁ. Giá trị này được chốt lại (dragPaintValueRef) và áp dụng thống
 *    nhất cho mọi ô chạm phải trong suốt lượt kéo đó - giống When2Meet
 *    (kéo qua vùng đã tô để xoá, kéo qua vùng trống để tô), tránh việc
 *    tô/xoá lẫn lộn từng ô một cách khó đoán khi kéo qua vùng hỗn hợp.
 * 6. Khi chuột di chuyển nhanh hơn tần suất sự kiện mouseenter (trình
 *    duyệt "nhảy cóc" qua vài ô), hook tự lấp đầy các ô bị bỏ sót trong
 *    cùng 1 cột ngày dựa vào data-row, để không bao giờ bị sót ô dù kéo
 *    rất nhanh.
 */
export function useOptimizedDrag({ onDragEnd }: UseOptimizedDragOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const lastCellRef = useRef<LastCell | null>(null)
  // true = lượt kéo hiện tại đang TÔ, false = đang XOÁ - chốt lúc mousedown, xem điểm 5 ở trên.
  const dragPaintValueRef = useRef(true)

  const paintSlot = useCallback((slotId: string, isPainted: boolean) => {
    const { setSlotPainted, isFinalized } = useParticipantStore.getState()
    if (isFinalized) return
    setSlotPainted(slotId, isPainted)
  }, [])

  // Lấp đầy các ô cùng cột ngày bị bỏ sót giữa hàng `fromRow` và `toRow`.
  const paintRowRange = useCallback(
    (date: string, fromRow: number, toRow: number, isPainted: boolean) => {
      const config = useParticipantStore.getState().scheduleConfig
      if (!config) return

      const times = getGridTimes(config)
      const [start, end] = fromRow <= toRow ? [fromRow, toRow] : [toRow, fromRow]
      for (let row = start; row <= end; row++) {
        const time = times[row]
        if (time) paintSlot(getSlotId(date, time), isPainted)
      }
    },
    [paintSlot]
  )

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    lastCellRef.current = null
    setIsDragging(false)
    onDragEnd()
  }, [onDragEnd])

  const handleCellMouseDown = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const { isFinalized, selectedSlotIds } = useParticipantStore.getState()
      if (isFinalized) return
      const { slotId, date, row } = event.currentTarget.dataset
      if (!slotId || !date || row === undefined) return

      // Ô đang trống -> lượt này TÔ; ô đã tô sẵn -> lượt này XOÁ.
      const paintValue = !selectedSlotIds.has(slotId)
      dragPaintValueRef.current = paintValue

      isDraggingRef.current = true
      lastCellRef.current = { slotId, date, row: Number(row) }
      setIsDragging(true)
      paintSlot(slotId, paintValue)
    },
    [paintSlot]
  )

  const handleCellMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!isDraggingRef.current) return

      // Phòng trường hợp người dùng nhả chuột ngoài cửa sổ trình duyệt:
      // nút chuột trái (buttons bit 1) không còn được giữ -> tự kết thúc kéo.
      if (event.buttons !== 1) {
        endDrag()
        return
      }

      const { slotId, date, row } = event.currentTarget.dataset
      if (!slotId || !date || row === undefined || slotId === lastCellRef.current?.slotId) {
        return
      }

      const rowIndex = Number(row)
      const last = lastCellRef.current
      const paintValue = dragPaintValueRef.current
      if (last && last.date === date) {
        // Cùng cột ngày: lấp đầy mọi ô giữa vị trí cũ và vị trí mới (nếu có
        // ô bị nhảy cóc do chuột di chuyển nhanh).
        paintRowRange(date, last.row, rowIndex, paintValue)
      } else {
        paintSlot(slotId, paintValue)
      }

      lastCellRef.current = { slotId, date, row: rowIndex }
    },
    [paintSlot, paintRowRange, endDrag]
  )

  // Lưới an toàn: bắt sự kiện mouseup trên toàn window để không bị "kẹt"
  // trạng thái đang kéo khi người dùng nhả chuột ngoài phạm vi lưới.
  useEffect(() => {
    window.addEventListener("mouseup", endDrag)
    return () => window.removeEventListener("mouseup", endDrag)
  }, [endDrag])

  return {
    isDragging,
    handleCellMouseDown,
    handleCellMouseEnter,
  }
}
