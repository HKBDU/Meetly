import { useEffect, useRef } from 'react';
import { useEventHubConnection } from '@/shared/hooks';
import type {
  EventFinalizedPayload,
  EventUpdatedPayload,
  HeatmapUpdatedPayload,
} from '../types';

const REALTIME_EVENTS = {
  HeatmapUpdated: 'HeatmapUpdated',
  EventUpdated: 'EventUpdated',
  EventFinalized: 'EventFinalized',
} as const;

interface EventRealtimeHandlers {
  onHeatmapUpdated: (payload: HeatmapUpdatedPayload) => void;
  onEventUpdated: (payload: EventUpdatedPayload) => void;
  onEventFinalized: (payload: EventFinalizedPayload) => void;
}

interface UseEventRealtimeOptions extends EventRealtimeHandlers {
  shortCode: string;
  accessToken?: string;
  revision: number;
}

export function shouldApplyRealtimePayload(
  currentRevision: number,
  shortCode: string,
  payload: { shortCode: string; revision: number },
): boolean {
  return payload.shortCode.toUpperCase() === shortCode.toUpperCase()
    && Number.isFinite(payload.revision)
    && payload.revision > currentRevision;
}

export function useEventRealtime({
  shortCode,
  accessToken,
  revision,
  onHeatmapUpdated,
  onEventUpdated,
  onEventFinalized,
}: UseEventRealtimeOptions) {
  const connection = useEventHubConnection(shortCode, accessToken);
  const revisionRef = useRef(revision);
  const handlersRef = useRef<EventRealtimeHandlers>({
    onHeatmapUpdated,
    onEventUpdated,
    onEventFinalized,
  });

  useEffect(() => {
    revisionRef.current = Math.max(revisionRef.current, revision);
    handlersRef.current = { onHeatmapUpdated, onEventUpdated, onEventFinalized };
  }, [revision, onHeatmapUpdated, onEventUpdated, onEventFinalized]);

  useEffect(() => {
    if (!connection) return;

    function accept(payload: { shortCode: string; revision: number }): boolean {
      if (!shouldApplyRealtimePayload(revisionRef.current, shortCode, payload)) return false;
      revisionRef.current = payload.revision;
      return true;
    }
    const handleHeatmapUpdated = (payload: HeatmapUpdatedPayload) => {
      if (accept(payload)) handlersRef.current.onHeatmapUpdated(payload);
    };
    const handleEventUpdated = (payload: EventUpdatedPayload) => {
      if (accept(payload)) handlersRef.current.onEventUpdated(payload);
    };
    const handleEventFinalized = (payload: EventFinalizedPayload) => {
      if (accept(payload)) handlersRef.current.onEventFinalized(payload);
    };

    connection.on(REALTIME_EVENTS.HeatmapUpdated, handleHeatmapUpdated);
    connection.on(REALTIME_EVENTS.EventUpdated, handleEventUpdated);
    connection.on(REALTIME_EVENTS.EventFinalized, handleEventFinalized);
    return () => {
      connection.off(REALTIME_EVENTS.HeatmapUpdated, handleHeatmapUpdated);
      connection.off(REALTIME_EVENTS.EventUpdated, handleEventUpdated);
      connection.off(REALTIME_EVENTS.EventFinalized, handleEventFinalized);
    };
  }, [connection, shortCode]);
}
