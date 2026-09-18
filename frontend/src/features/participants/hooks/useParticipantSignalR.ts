import { useEffect } from "react"
import { toast } from "sonner"

import { useEventHubConnection } from "@/shared/hooks"
import { useParticipantStore } from "@/features/participants/store"
import type { EventFinalizedPayload } from "@/features/participants/types"

/** Lắng nghe "EventFinalized" trên connection dùng chung của event (xem `useEventHubConnection`) */
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
}
