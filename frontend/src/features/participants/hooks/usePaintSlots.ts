import { useCallback } from "react"

import { getGridTimes, getSlotId } from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"

export function usePaintSlots() {
  const paintSlot = useCallback((slotId: string, isPainted: boolean) => {
    const { setSlotPainted, isFinalized } = useParticipantStore.getState()
    if (isFinalized) return
    setSlotPainted(slotId, isPainted)
  }, [])

  /** Tô các ô cùng cột ngày từ hàng `fromRow` tới `toRow` */
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
