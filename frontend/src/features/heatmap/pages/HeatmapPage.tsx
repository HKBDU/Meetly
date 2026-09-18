import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AdminSuggestionControls } from '../components/AdminSuggestionControls';
import { EventHeader } from '../components/EventHeader';
import { HeatmapWorkspace } from '../components/HeatmapWorkspace';
import { useEventRealtime } from '../hooks/useEventRealtime';
import { DEFAULT_MEETING_DURATION } from '../constants';
import { getSuggestionParams } from '../suggestions';
import { formatDay } from '../time';
import {
  HeatmapPendingAction,
  type EventFinalizedPayload,
  type EventUpdatedPayload,
  type HeatmapPageProps,
  type HeatmapUpdatedPayload,
  type SuggestedSlot,
  type UpdateEventPayload,
} from '../types';

function EventOverview({
  initialEvent,
  accessToken,
  isAdmin = false,
  loading = false,
  loadError,
  onSuggestions,
  onFinalize,
  onUpdateEvent,
  onOpenMySchedule,
}: HeatmapPageProps) {
  const [event, setEvent] = useState(initialEvent);
  const [duration, setDuration] = useState<number | undefined>(DEFAULT_MEETING_DURATION);
  const [keyParticipant, setKeyParticipant] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestionsUpdating, setSuggestionsUpdating] = useState(false);
  const [pending, setPending] = useState<HeatmapPendingAction | null>(null);
  const busy = useRef(false);
  const active = useRef(true);
  const suggestionRequest = useRef(0);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  useEffect(() => {
    const requestId = ++suggestionRequest.current;
    const params = getSuggestionParams(duration, keyParticipant);
    if (!event || !isAdmin || event.status !== 1 || !onSuggestions || !params) {
      const timeout = window.setTimeout(() => {
        if (!active.current || suggestionRequest.current !== requestId) return;
        setSuggestions([]);
        setSuggestionsLoaded(false);
        setSuggestionsUpdating(false);
      }, 0);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      setSuggestions([]);
      setSuggestionsLoaded(false);
      setSuggestionsUpdating(true);

      void onSuggestions(params, event)
        .then((result) => {
          if (!active.current || suggestionRequest.current !== requestId) return;
          setSuggestions(result);
          setSuggestionsLoaded(true);
        })
        .catch((failure: unknown) => {
          if (!active.current || suggestionRequest.current !== requestId) return;
          const message = failure instanceof Error
            ? failure.message
            : 'Unable to update suggestions. Please try again.';
          toast.error(message);
        })
        .finally(() => {
          if (active.current && suggestionRequest.current === requestId) {
            setSuggestionsUpdating(false);
          }
        });
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [duration, event, isAdmin, keyParticipant, onSuggestions]);

  useEventRealtime({
    shortCode: event?.shortCode ?? '',
    accessToken: event ? accessToken : undefined,
    revision: event?.revision ?? -1,
    onHeatmapUpdated: (payload: HeatmapUpdatedPayload) => {
      setEvent((current) => current ? {
        ...current,
        heatmapGrid: payload.heatmapGrid,
        revision: payload.revision,
      } : current);
    },
    onEventUpdated: (payload: EventUpdatedPayload) => {
      setEvent((current) => current ? {
        ...current,
        title: payload.title,
        eventType: payload.eventType,
        availableDates: payload.availableDates,
        availableWeekdays: payload.availableWeekdays,
        dailyStartTime: payload.dailyStartTime,
        dailyEndTime: payload.dailyEndTime,
        revision: payload.revision,
      } : current);
    },
    onEventFinalized: (payload: EventFinalizedPayload) => {
      setEvent((current) => current ? {
        ...current,
        status: payload.status,
        finalSchedule: payload.finalSchedule,
        revision: payload.revision,
      } : current);
      setSuggestions([]);
      setSuggestionsLoaded(false);
      setSuggestionsUpdating(false);
    },
  });

  async function updateEventDetails(payload: UpdateEventPayload, adminPassword: string) {
    if (!event || !isAdmin || event.status !== 1 || !onUpdateEvent || busy.current) {
      throw new Error('Event editing is not available.');
    }
    busy.current = true;
    setPending(HeatmapPendingAction.Update);
    try {
      const result = await onUpdateEvent(payload, event, adminPassword);
      if (!Number.isFinite(result.revision)) throw new Error('Invalid update event response.');
      if (!active.current) return;
      setEvent((current) =>
        current && result.revision >= current.revision
          ? { ...current, ...payload, revision: result.revision }
          : current,
      );
      toast.success('Event updated successfully.');
    } finally {
      busy.current = false;
      if (active.current) setPending(null);
    }
  }

  if (loading) return <p role="status" className="p-8 text-center text-slate-500">Loading event…</p>;
  if (loadError) return <p role="alert" className="p-8 text-center text-rose-700">{loadError}</p>;
  if (!event) return <p className="p-8 text-center text-slate-500">Event not found.</p>;

  const canEdit = isAdmin && event.status === 1;
  const workspaceKey = [
    event.eventType,
    event.availableDates.join(','),
    event.availableWeekdays.join(','),
    event.dailyStartTime,
    event.dailyEndTime,
    event.status,
  ].join(':');

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 text-slate-900 sm:px-8">
      <EventHeader
        event={event}
        canEdit={canEdit}
        duration={duration}
        disabled={pending !== null}
        canUpdate={Boolean(onUpdateEvent)}
        onOpenMySchedule={onOpenMySchedule}
        onDurationChange={setDuration}
        onUpdateEvent={updateEventDetails}
      />

      {event.status === 2 && (
        <section className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-800">Final Meeting Time</h2>
          {event.finalSchedule ? (
            <p className="mt-2 text-lg font-semibold">{formatDay(event.finalSchedule)} · {event.finalSchedule.startTime} – {event.finalSchedule.endTime}</p>
          ) : (
            <p className="mt-2 text-sm">Final meeting details are not available.</p>
          )}
        </section>
      )}

      {canEdit && (
        <AdminSuggestionControls
          participants={event.participants}
          keyParticipant={keyParticipant}
          disabled={pending !== null}
          updating={suggestionsUpdating}
          loaded={suggestionsLoaded}
          suggestionCount={suggestions.length}
          onKeyParticipantChange={setKeyParticipant}
        />
      )}

      <HeatmapWorkspace
        key={workspaceKey}
        event={event}
        canEdit={canEdit}
        suggestions={suggestions}
        keyParticipant={keyParticipant}
        pending={pending}
        onFinalize={onFinalize}
        onPendingChange={setPending}
        onFinalized={(result) => {
          setEvent((current) =>
            current && result.revision >= current.revision
              ? { ...current, ...result }
              : current,
          );
          setSuggestions([]);
          setSuggestionsLoaded(false);
          setSuggestionsUpdating(false);
          toast.success('Meeting finalized. This event is now read-only.');
        }}
      />
    </div>
  );
}

export function HeatmapPage(props: HeatmapPageProps) {
  return <EventOverview key={`${props.initialEvent?.shortCode}:${props.initialEvent?.revision}:${props.isAdmin}`} {...props} />;
}
