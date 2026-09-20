import { useCallback, useSyncExternalStore } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import {
  getEventHubConnection,
  subscribeEventHubConnection,
} from '@/lib/signalr';

export function useEventHubConnection(
  shortCode: string,
  accessToken: string | undefined,
): HubConnection | null {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!accessToken || !shortCode) return () => undefined;
      return subscribeEventHubConnection(shortCode, accessToken, onChange);
    },
    [shortCode, accessToken],
  );
  const getSnapshot = useCallback(
    () => (accessToken && shortCode ? getEventHubConnection(shortCode) : null),
    [shortCode, accessToken],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
