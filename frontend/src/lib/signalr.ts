import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';
import { env } from './env';

type Listener = () => void;

interface HubEntry {
  connection: HubConnection;
  token: { current: string };
  refCount: number;
  disposed: boolean;
  disposeTimer: ReturnType<typeof setTimeout> | null;
  retryTimer: ReturnType<typeof setTimeout> | null;
}

const entries = new Map<string, HubEntry>();
const INITIAL_RETRY_DELAYS = [1_000, 3_000] as const;

function eventKey(shortCode: string): string {
  return shortCode.trim().toUpperCase();
}

async function joinGroup(entry: HubEntry, shortCode: string) {
  if (entry.disposed || entry.connection.state !== HubConnectionState.Connected) return;
  try {
    await entry.connection.invoke('JoinEvent', shortCode);
  } catch (error) {
    if (!entry.disposed) console.error('SignalR JoinEvent failed:', error);
  }
}

function startConnection(entry: HubEntry, shortCode: string, attempt = 0) {
  if (entry.disposed || entry.connection.state !== HubConnectionState.Disconnected) return;

  void entry.connection
    .start()
    .then(() => joinGroup(entry, shortCode))
    .catch((error: unknown) => {
      if (entry.disposed) return;
      const delay = INITIAL_RETRY_DELAYS[attempt];
      if (delay === undefined) {
        console.error('SignalR connection failed:', error);
        return;
      }
      entry.retryTimer = setTimeout(() => startConnection(entry, shortCode, attempt + 1), delay);
    });
}

function disposeEntry(key: string, shortCode: string, entry: HubEntry) {
  if (entry.refCount > 0 || entries.get(key) !== entry) return;
  entries.delete(key);
  entry.disposed = true;
  if (entry.retryTimer) clearTimeout(entry.retryTimer);

  const leave = entry.connection.state === HubConnectionState.Connected
    ? entry.connection.invoke('LeaveEvent', shortCode).catch(() => undefined)
    : Promise.resolve();
  void leave.finally(() => entry.connection.stop());
}

function createEntry(shortCode: string, accessToken: string): HubEntry {
  const token = { current: accessToken };
  const connection = new HubConnectionBuilder()
    .withUrl(env.signalRHubUrl, {
      accessTokenFactory: () => token.current,
    })
    .withAutomaticReconnect()
    .configureLogging(import.meta.env.DEV ? LogLevel.Warning : LogLevel.Error)
    .build();

  const entry: HubEntry = {
    connection,
    token,
    refCount: 0,
    disposed: false,
    disposeTimer: null,
    retryTimer: null,
  };
  connection.onreconnected(() => joinGroup(entry, shortCode));
  startConnection(entry, shortCode);
  return entry;
}

function getOrCreateEntry(shortCode: string, accessToken: string): HubEntry {
  const key = eventKey(shortCode);
  const existing = entries.get(key);
  if (existing) {
    if (existing.disposeTimer) {
      clearTimeout(existing.disposeTimer);
      existing.disposeTimer = null;
    }
    if (existing.token.current !== accessToken) {
      existing.token.current = accessToken;
      if (existing.retryTimer) clearTimeout(existing.retryTimer);
      void existing.connection.stop().finally(() => startConnection(existing, shortCode));
    }
    return existing;
  }

  const entry = createEntry(shortCode, accessToken);
  entries.set(key, entry);
  return entry;
}

export function getEventHubConnection(shortCode: string): HubConnection | null {
  return entries.get(eventKey(shortCode))?.connection ?? null;
}

export function subscribeEventHubConnection(
  shortCode: string,
  accessToken: string,
  onChange: Listener,
): () => void {
  const key = eventKey(shortCode);
  const entry = getOrCreateEntry(shortCode, accessToken);
  entry.refCount += 1;
  onChange();

  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    entry.refCount = Math.max(0, entry.refCount - 1);
    if (entry.refCount > 0) return;

    // A zero-delay cleanup lets React StrictMode resubscribe to the same entry.
    entry.disposeTimer = setTimeout(() => disposeEntry(key, shortCode, entry), 0);
  };
}
