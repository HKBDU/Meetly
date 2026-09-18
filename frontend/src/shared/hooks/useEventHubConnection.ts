import { useCallback, useSyncExternalStore } from "react";
import type { HubConnection } from "@microsoft/signalr";

import { getEventHubConnection, subscribeEventHubConnection } from "@/lib/signalr";

/**
 * Trả về `HubConnection` dùng chung của event (đã connect và join group), hoặc `null`
 * khi chưa có `accessToken` vì hub yêu cầu `[Authorize]`. Nơi gọi tự `.on()/.off()` sự kiện của mình.
 */
export function useEventHubConnection(shortCode: string, accessToken: string | undefined): HubConnection | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!accessToken) return () => {};
      return subscribeEventHubConnection(shortCode, accessToken, onChange);
    },
    [shortCode, accessToken],
  );

  const getSnapshot = useCallback(
    () => (accessToken ? getEventHubConnection(shortCode) : null),
    [shortCode, accessToken],
  );

  return useSyncExternalStore(subscribe, getSnapshot);
}
