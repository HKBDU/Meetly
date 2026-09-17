import { useEffect } from "react"
import { toast } from "sonner"

import { useEventHubConnection } from "@/shared/hooks"
import { useParticipantStore } from "@/features/participants/store"
import type { EventFinalizedPayload } from "@/features/participants/types"

/**
 * Lắng nghe realtime sự kiện "EventFinalized" từ hub (BE) cho event đang
 * xem. Connection thật (connect + join group `event:{shortCode}`) được
 * quản lý dùng chung ở `useEventHubConnection` (xem `lib/signalr.ts`) - ở
 * đây chỉ đăng ký/hủy đăng ký đúng tên sự kiện thuộc scope của feature này.
 *
 * `HeatmapUpdated` và `EventUpdated` (2 sự kiện còn lại trong
 * SIGNALR_CONTRACT) KHÔNG thuộc scope của feature này - do feature
 * `heatmap`/`events` đảm nhận, mỗi feature đó tự `.on()` sự kiện của mình
 * trên CÙNG connection lấy từ `useEventHubConnection(shortCode, ...)`.
 */
export function useParticipantSignalR(shortCode: string) {
  const auth = useParticipantStore((s) => s.auth)
  const finalizeEvent = useParticipantStore((s) => s.finalizeEvent)
  const connection = useEventHubConnection(shortCode, auth?.accessToken)

  useEffect(() => {
    if (!connection) return

    function handleEventFinalized(payload: EventFinalizedPayload) {
      finalizeEvent(payload.message)
      toast.info(payload.message, {
        description: "The schedule grid has been locked and can no longer be edited.",
        duration: 6000,
      })
    }

    connection.on("EventFinalized", handleEventFinalized)
    return () => connection.off("EventFinalized", handleEventFinalized)
  }, [connection, finalizeEvent])

  /** Dev-only: mô phỏng BE bắn sự kiện "EventFinalized" để xem trọn luồng UI mà không cần chờ host chốt lịch thật. */
  function simulateEventFinalized() {
    finalizeEvent("The meeting time has been finalized!")
    toast.info("The meeting time has been finalized!", {
      description: "The schedule grid has been locked and can no longer be edited.",
      duration: 6000,
    })
  }

  return { simulateEventFinalized }
}
