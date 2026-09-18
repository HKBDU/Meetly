import { HubConnectionBuilder, LogLevel, type HubConnection } from "@microsoft/signalr"

import { env } from "@/lib/env"

/**
 * Giữ 1 `HubConnection` duy nhất cho mỗi `shortCode` (đếm refCount) để các feature
 * dùng chung, tránh mở nhiều WebSocket tới cùng hub. Dùng qua `useEventHubConnection`.
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
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();

  const entry: HubEntry = { connection, refCount: 0, listeners: new Set() };
  entries.set(shortCode, entry);

  connection
    .start()
    .then(() => joinGroup(connection, shortCode))
    .catch((error) => console.error("SignalR connection failed:", error));

  // Reconnect không tự join lại group
  connection.onreconnected(() => joinGroup(connection, shortCode));

  return entry;
}

/** Snapshot cho `useSyncExternalStore` */
export function getEventHubConnection(shortCode: string): HubConnection | null {
  return entries.get(shortCode)?.connection ?? null;
}

/** Giữ 1 connection cho `shortCode`; chỉ đóng khi không còn ai giữ. Trả về hàm hủy đăng ký. */
export function subscribeEventHubConnection(
  shortCode: string,
  accessToken: string,
  onChange: Listener,
): () => void {
  const entry = getOrCreateEntry(shortCode, accessToken);
  entry.refCount += 1;
  entry.listeners.add(onChange);
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
