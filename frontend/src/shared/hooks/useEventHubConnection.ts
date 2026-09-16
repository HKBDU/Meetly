import { useCallback, useSyncExternalStore } from "react";
import type { HubConnection } from "@microsoft/signalr";

import { getEventHubConnection, subscribeEventHubConnection } from "@/lib/signalr";

/**
 * Hook DÙNG CHUNG cho mọi feature cần lắng nghe SignalR của 1 event
 * (participants: "EventFinalized", heatmap: "HeatmapUpdated", events:
 * "EventUpdated" - xem SIGNALR_CONTRACT). Chỉ trả về 1 `HubConnection` đã
 * connect + join sẵn group của event (xem `lib/signalr.ts`) - nơi gọi tự
 * `.on()/.off()` đúng tên sự kiện của mình trong `useEffect`, KHÔNG tự tạo
 * `HubConnectionBuilder` mới.
 *
 * Dùng `useSyncExternalStore` (không phải `useState` + `useEffect`) vì
 * connection là 1 external system dùng CHUNG giữa nhiều component/feature -
 * đúng API React khuyến nghị cho việc "subscribe vào 1 nguồn dữ liệu ngoài
 * React" thay vì tự setState trong effect.
 *
 * Trả về `null` khi chưa có `accessToken` (chưa đăng nhập participant) - Hub
 * yêu cầu `[Authorize]` nên chưa connect được lúc này.
 *
 * Ví dụ dùng trong 1 feature khác:
 *   const connection = useEventHubConnection(shortCode, auth?.accessToken)
 *   useEffect(() => {
 *     if (!connection) return
 *     function handler(payload) { ... }
 *     connection.on("HeatmapUpdated", handler)
 *     return () => connection.off("HeatmapUpdated", handler)
 *   }, [connection])
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
