import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr"

import { env } from "@/lib/env"

/**
 * Quản lý connection SignalR DÙNG CHUNG cho hub "/hubs/events".
 * ---------------------------------------------------------------------
 * Theo SIGNALR_CONTRACT: 1 event (`shortCode`) có 3 sự kiện server->client
 * (`HeatmapUpdated`, `EventFinalized`, `EventUpdated`) nhưng cả 3 đều bắn
 * trên CÙNG 1 hub, CÙNG 1 group (`event:{shortCode}` - xem `EventHub` BE).
 * Nếu mỗi feature (participants, heatmap, events) tự mở
 * `HubConnectionBuilder` + tự `invoke("JoinEvent", ...)` riêng, trình duyệt
 * sẽ mở NHIỀU WebSocket song song tới cùng 1 hub cho cùng 1 tab - lãng phí
 * và BE thấy nhiều `ConnectionId` khác nhau cho cùng 1 participant.
 *
 * Module này giữ 1 `HubConnection` duy nhất cho mỗi `shortCode` (đếm
 * refCount theo số feature đang dùng), việc connect + join group chỉ làm 1
 * lần. Mỗi feature chỉ cần lấy connection ra rồi tự `.on()/.off()` đúng tên
 * sự kiện của mình - KHÔNG tự tạo connection mới.
 *
 * KHÔNG dùng thẳng module này từ component - dùng qua hook
 * `useEventHubConnection` (xem shared/hooks), hook đó đã lo đúng vòng đời
 * subscribe/unsubscribe theo chuẩn React (`useSyncExternalStore`).
 */

type Listener = () => void;

interface HubEntry {
  connection: HubConnection;
  refCount: number;
  listeners: Set<Listener>;
}

const entries = new Map<string, HubEntry>();

async function joinGroup(connection: HubConnection, shortCode: string) {
  try {
    await connection.invoke("JoinEvent", shortCode);
  } catch (error) {
    console.error("SignalR JoinEvent failed:", error);
  }
}

function getOrCreateEntry(shortCode: string, accessToken: string): HubEntry {
  const existing = entries.get(shortCode);
  if (existing) return existing;

  const connection = new HubConnectionBuilder()
    .withUrl(env.signalRHubUrl, { accessTokenFactory: () => accessToken })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  const entry: HubEntry = { connection, refCount: 0, listeners: new Set() };
  entries.set(shortCode, entry);

  connection
    .start()
    .then(() => joinGroup(connection, shortCode))
    .catch((error) => console.error("SignalR connection failed:", error));

  // withAutomaticReconnect() tự nối lại KẾT NỐI khi rớt mạng, nhưng không tự
  // join lại GROUP cũ - phải tự invoke lại mỗi lần "reconnected".
  connection.onreconnected(() => joinGroup(connection, shortCode));

  return entry;
}

/** Snapshot hiện tại (đọc thuần, không side-effect) - dùng làm `getSnapshot` cho `useSyncExternalStore`. */
export function getEventHubConnection(shortCode: string): HubConnection | null {
  return entries.get(shortCode)?.connection ?? null;
}

/**
 * Đăng ký giữ 1 connection cho `shortCode` (tạo mới nếu chưa có, tăng
 * refCount nếu đã có) - dùng làm `subscribe` cho `useSyncExternalStore`.
 * Trả về hàm hủy đăng ký; connection chỉ thật sự đóng khi không còn ai giữ.
 */
export function subscribeEventHubConnection(
  shortCode: string,
  accessToken: string,
  onChange: Listener,
): () => void {
  const entry = getOrCreateEntry(shortCode, accessToken);
  entry.refCount += 1;
  entry.listeners.add(onChange);
  // Connection vừa tạo (hoặc đã có sẵn) khác snapshot lúc `getSnapshot` được
  // gọi trước khi subscribe (render đầu luôn thấy `null`) - báo ngay để
  // React re-render lấy giá trị mới, không cần chờ sự kiện gì khác.
  onChange();

  return () => {
    entry.listeners.delete(onChange);
    entry.refCount -= 1;
    if (entry.refCount > 0) return;

    entries.delete(shortCode);
    entry.connection
      .invoke("LeaveEvent", shortCode)
      .catch(() => {})
      .finally(() => entry.connection.stop());
  };
}
