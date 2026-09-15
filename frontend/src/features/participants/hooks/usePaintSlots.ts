import { useCallback } from "react"

import { getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"

/**
 * Tách riêng phần đọc/ghi store khi tô lịch (biết về Zustand store + cấu
 * hình lưới), để `useOptimizedDrag` chỉ còn lo theo dõi CỬ CHỈ kéo thả
 * (mousedown/mouseenter/mouseup), không phải gánh luôn cả 2 việc.
 */
export function usePaintSlots() {
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

  return { paintSlot, paintRowRange }
}
