import { useCallback, useEffect, useRef } from 'react'

import { getSlotId } from '@/features/participants/gridUtils'
import { useParticipantStore } from '@/features/participants/store'

interface UseOptimizedDragOptions {
  /** Giờ của từng hàng, để lấp đầy các ô bị bỏ sót khi con trỏ di chuyển nhanh */
  times: readonly string[]
  locked: boolean
  /** Gọi khi nhả chuột để trigger auto-save */
  onDragEnd: () => void
}

interface LastCell {
  slotId: string
  column: string
  row: number
}

/**
 * Kéo thả tô lịch mà không re-render cả lưới: trạng thái kéo nằm trong ref, handler
 * có tham chiếu ổn định, mỗi ô tự subscribe boolean của mình.
 *
 * - Tô hay xoá cả lượt kéo được chốt lúc pointerdown theo trạng thái ô đầu tiên.
 * - Khi con trỏ nhảy cóc, tự lấp đầy các ô bị bỏ sót cùng cột.
 * - Dùng Pointer Events để chạy được cả cảm ứng; phải `releasePointerCapture`
 *   ngay pointerdown, nếu không `pointerenter` không bắn sang ô khác.
 */
export function useOptimizedDrag({ times, locked, onDragEnd }: UseOptimizedDragOptions) {
  const isDraggingRef = useRef(false)
  const lastCellRef = useRef<LastCell | null>(null)
  /** true = lượt kéo đang tô, false = đang xoá */
  const paintValueRef = useRef(true)
  const optionsRef = useRef({ times, locked, onDragEnd })

  useEffect(() => {
    optionsRef.current = { times, locked, onDragEnd }
  })

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    lastCellRef.current = null
    optionsRef.current.onDragEnd()
  }, [])

  const handleCellPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (optionsRef.current.locked || event.button !== 0) return
    const { slotId, column, row } = event.currentTarget.dataset
    if (!slotId || !column || row === undefined) return

    event.preventDefault()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const { selectedSlotIds, setSlotPainted } = useParticipantStore.getState()
    paintValueRef.current = !selectedSlotIds.has(slotId)
    isDraggingRef.current = true
    lastCellRef.current = { slotId, column, row: Number(row) }
    setSlotPainted(slotId, paintValueRef.current)
  }, [])

  const handleCellPointerEnter = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current) return

      // Nhả chuột/nhấc tay ngoài cửa sổ thì kết thúc kéo
      if (event.buttons !== 1) {
        endDrag()
        return
      }

      const { slotId, column, row } = event.currentTarget.dataset
      const last = lastCellRef.current
      if (!slotId || !column || row === undefined || slotId === last?.slotId) return

      const rowIndex = Number(row)
      const { setSlotPainted, setSlotsPainted } = useParticipantStore.getState()
      if (last && last.column === column) {
        const [from, to] = last.row <= rowIndex ? [last.row, rowIndex] : [rowIndex, last.row]
        const ids = optionsRef.current.times
          .slice(from, to + 1)
          .map((time) => getSlotId({ key: column }, time))
        setSlotsPainted(ids, paintValueRef.current)
      } else {
        setSlotPainted(slotId, paintValueRef.current)
      }

      lastCellRef.current = { slotId, column, row: rowIndex }
    },
    [endDrag],
  )

  // Bắt trên window để không kẹt trạng thái kéo khi nhả ngoài lưới
  useEffect(() => {
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
    }
  }, [endDrag])

  return { handleCellPointerDown, handleCellPointerEnter }
}
