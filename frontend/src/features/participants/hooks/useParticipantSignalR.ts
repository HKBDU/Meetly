import { toast } from "sonner"

import { useParticipantStore } from "@/features/participants/store"
import type { EventFinalizedPayload } from "@/features/participants/types"

/**
 * MOCK SignalR hub cho participant.
 * ---------------------------------------------------------------------
 * Giả lập một HubConnection lắng nghe sự kiện "EventFinalized" mà không cần
 * Backend thật. Khi có BE, thay toàn bộ nội dung trong effect bằng:
 *
 *   import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"
 *   import { env } from "@/lib/env"
 *
 *   const connection = new HubConnectionBuilder()
 *     .withUrl(env.signalRHubUrl, { accessTokenFactory: () => auth?.token ?? "" })
 *     .withAutomaticReconnect()
 *     .configureLogging(LogLevel.Information)
 *     .build()
 *
 *   connection.on("EventFinalized", handleEventFinalized)
 *   connection.start()
 *
 *   return () => { connection.off("EventFinalized"); connection.stop() }
 *
 * -> Chỉ cần thay phần setup, handler bên dưới giữ nguyên.
 *
 * Heatmap tổng của cả nhóm (event "HeatmapUpdated") KHÔNG thuộc scope của
 * feature này - do phần khác trong team đảm nhận, nên hub mock ở đây chỉ
 * còn xử lý "EventFinalized" (ảnh hưởng trực tiếp tới lịch cá nhân).
 */
export function useParticipantSignalR() {
  const finalizeEvent = useParticipantStore((s) => s.finalizeEvent)

  function handleEventFinalized(payload: EventFinalizedPayload) {
    finalizeEvent(payload.message)
    toast.info(payload.message, {
      description: "The schedule grid has been locked and can no longer be edited.",
      duration: 6000,
    })
  }

  /** Dev-only: mô phỏng BE bắn sự kiện "EventFinalized" để xem trọn luồng UI. */
  function simulateEventFinalized() {
    handleEventFinalized({
      finalizedAt: new Date().toISOString(),
      message: "The meeting time has been finalized!",
      finalizedSlotIds: [],
    })
  }

  return { simulateEventFinalized }
}
