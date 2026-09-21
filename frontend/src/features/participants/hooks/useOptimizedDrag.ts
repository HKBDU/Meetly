import { useCallback, useEffect, useRef, useState } from "react"

import { usePaintSlots } from "@/features/participants/hooks/usePaintSlots"
import { useParticipantStore } from "@/features/participants/store"

interface UseOptimizedDragOptions {
  /** Gọi khi nhả chuột để trigger auto-save */
  onDragEnd: () => void
}

interface LastCell {
  slotId: string
  date: string
  row: number
}

/**
 * Xử lý kéo thả tô lịch mà không re-render cả lưới: trạng thái kéo nằm trong
 * ref, handler có tham chiếu ổn định, mỗi ô tự subscribe boolean của mình.
 *
 * - Tô hay xoá cả lượt kéo được chốt lúc pointerdown theo trạng thái ô đầu tiên.
 * - Khi con trỏ nhảy cóc, tự lấp đầy các ô bị bỏ sót cùng cột ngày.
 * - Dùng Pointer Events để chạy được cả cảm ứng; phải `releasePointerCapture`
 *   ngay pointerdown, nếu không `pointerenter` không bắn sang ô khác.
 */
export function useOptimizedDrag({ onDragEnd }: UseOptimizedDragOptions) {
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const lastCellRef = useRef<LastCell | null>(null)
  /** true = lượt kéo đang tô, false = đang xoá */
  const dragPaintValueRef = useRef(true)

  const { paintSlot, paintRowRange } = usePaintSlots()

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    lastCellRef.current = null
    setIsDragging(false)
    onDragEnd()
  }, [onDragEnd])

  const handleCellPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const { isFinalized, selectedSlotIds } = useParticipantStore.getState()
      if (isFinalized || event.button !== 0) return
      const { slotId, date, row } = event.currentTarget.dataset
      if (!slotId || !date || row === undefined) return

      event.preventDefault()
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId)
      }

      const paintValue = !selectedSlotIds.has(slotId)
      dragPaintValueRef.current = paintValue

      isDraggingRef.current = true
      lastCellRef.current = { slotId, date, row: Number(row) }
      setIsDragging(true)
      paintSlot(slotId, paintValue)
    },
    [paintSlot]
  )

  const handleCellPointerEnter = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current) return

      // Nhả chuột/nhấc tay ngoài cửa sổ thì kết thúc kéo
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
        paintRowRange(date, last.row, rowIndex, paintValue)
      } else {
        paintSlot(slotId, paintValue)
      }

      lastCellRef.current = { slotId, date, row: rowIndex }
    },
    [paintSlot, paintRowRange, endDrag]
  )

  // Bắt trên window để không kẹt trạng thái kéo khi nhả ngoài lưới
  useEffect(() => {
    window.addEventListener("pointerup", endDrag)
    window.addEventListener("pointercancel", endDrag)
    return () => {
      window.removeEventListener("pointerup", endDrag)
      window.removeEventListener("pointercancel", endDrag)
    }
  }, [endDrag])

  return {
    isDragging,
    handleCellPointerDown,
    handleCellPointerEnter,
  }
}
