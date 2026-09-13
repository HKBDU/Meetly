import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Copy, Globe2, Users } from 'lucide-react';
import type {
  CellDetails,
  FinalizeResult,
  FinalSchedule,
  HeatmapEvent,
  SuggestedSlot,
  SuggestionParams,
} from '../types';
import { formatDay, getColumns, isValidSchedule } from '../time';
import { useHeatmapSelection } from '../hooks/useHeatmapSelection';
import { Heatmap } from '../components/Heatmap';
import { AvailabilityDetails } from '../components/AvailabilityDetails';
import { KeyParticipantSelector } from '../components/KeyParticipantSelector';
import { ScheduleControls } from '../components/ScheduleControls';
import { FinalizeDialog } from '../components/FinalizeDialog';

export interface HeatmapPageProps {
  initialEvent: HeatmapEvent | null;
  isAdmin?: boolean;
  loading?: boolean;
  loadError?: string;
  onSuggestions?: (params: SuggestionParams) => Promise<SuggestedSlot[]>;
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>;
  myScheduleHref?: string;
}

function EventOverview({
  initialEvent,
  isAdmin = false,
  loading = false,
  loadError,
  onSuggestions,
  onFinalize,
  myScheduleHref,
}: HeatmapPageProps) {
  const [event, setEvent] = useState(initialEvent);
  const [duration, setDuration] = useState(60);
  const [keyParticipant, setKeyParticipant] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedSlot[]>([]);
  const [searched, setSearched] = useState(false);
  const [details, setDetails] = useState<CellDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState<'suggestions' | 'finalize' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const busy = useRef(false);
  const active = useRef(true);
  const selection = useHeatmapSelection();
  const canEdit = isAdmin && event?.status === 1;

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  function clearSuggestions() {
    setSuggestions([]);
    setSearched(false);
    setError(null);
  }

  async function findSuggestions() {
    if (!canEdit || busy.current || !onSuggestions) return;
    busy.current = true;
    setPending('suggestions');
    clearSuggestions();
    try {
      const result = await onSuggestions({
        minDuration: duration,
        ...(keyParticipant ? { keyParticipant } : {}),
      });
      if (!active.current) return;
      setSuggestions(result);
      setSearched(true);
    } catch (failure) {
      if (active.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Unable to find suggestions. Please try again.',
        );
    } finally {
      busy.current = false;
      if (active.current) setPending(null);
    }
  }

  async function confirmSchedule() {
    if (!canEdit || !event || !selection.selected || !dialogOpen || busy.current || !onFinalize)
      return;
    if (!isValidSchedule(event, selection.selected)) {
      setError('The selected time range is invalid.');
      return;
    }
    busy.current = true;
    setPending('finalize');
    setError(null);
    try {
      const result = await onFinalize(selection.selected);
      if (!active.current) return;
      if (result.status !== 2 || !isValidSchedule(event, result.finalSchedule))
        throw new Error('The final schedule response is invalid.');
      setEvent({ ...event, ...result });
      setDialogOpen(false);
      setSuggestions([]);
      selection.cancel();
      setNotice('Meeting finalized. This event is now read-only.');
    } catch (failure) {
      if (active.current)
        setError(
          failure instanceof Error
            ? failure.message
            : 'Unable to finalize the meeting. Please try again.',
        );
    } finally {
      busy.current = false;
      if (active.current) setPending(null);
    }
  }

  async function copyLink() {
    if (!event?.url) return;
    try {
      await navigator.clipboard.writeText(event.url);
      setNotice('Event link copied.');
    } catch {
      setNotice('Unable to copy. Select and copy the link from the field.');
    }
  }

  if (loading)
    return (
      <p role="status" className="p-8 text-center text-slate-500">
        Loading event…
      </p>
    );
  if (loadError)
    return (
      <p role="alert" className="p-8 text-center text-rose-700">
        {loadError}
      </p>
    );
  if (!event) return <p className="p-8 text-center text-slate-500">Event not found.</p>;

  const columns = getColumns(event);
  const selectedDayLabels = columns.map((column) => formatDay(column)).join(' · ');
  const interactive = canEdit && pending === null && !dialogOpen;
  const canOpenMySchedule =
    Boolean(myScheduleHref) && event.status === 1 && pending === null && !dialogOpen;

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 text-slate-900 sm:px-8">
      <header className="mb-8 flex flex-wrap justify-between gap-6">
        <div>
          <h1 id="event-title" tabIndex={-1} className="text-3xl font-bold tracking-tight">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {canEdit ? (
              <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
                MEETING DURATION
                <select
                  value={duration}
                  disabled={pending !== null}
                  onChange={(e) => {
                    setDuration(Number(e.target.value));
                    clearSuggestions();
                  }}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-800"
                >
                  {[15, 30, 45, 60, 75, 90, 120].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <span className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
                {event.status === 1 ? 'Overview · Read-only' : 'Event locked · Read-only'}
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <CalendarDays size={15} aria-hidden="true" />
              {selectedDayLabels || 'No dates'}
            </span>
            <span className="flex items-center gap-2">
              <Users size={15} aria-hidden="true" />
              {event.participants.length} participants
            </span>
            <span className="flex items-center gap-2">
              <Globe2 size={15} aria-hidden="true" />
              {event.timezone}
            </span>
          </div>
        </div>
        <div className="w-full space-y-3 sm:w-72">
          {event.url && (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
              <input
                aria-label="Event share link"
                value={event.url}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 bg-transparent text-xs text-slate-600"
              />
              <button
                type="button"
                onClick={() => void copyLink()}
                className="flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-medium text-emerald-700"
              >
                <Copy size={13} aria-hidden="true" />
                Copy
              </button>
            </div>
          )}
          <a
            href={canOpenMySchedule ? myScheduleHref : undefined}
            role="link"
            aria-disabled={!canOpenMySchedule}
            tabIndex={canOpenMySchedule ? undefined : -1}
            title={
              event.status !== 1
                ? 'This event is locked.'
                : !myScheduleHref
                  ? 'My Schedule is not available yet.'
                  : undefined
            }
            className="block w-full rounded-lg bg-[#24cc27] px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-[#20b923] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
          >
            My Schedule
          </a>
        </div>
      </header>

      {notice && (
        <p role="status" className="mb-5 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {error && !dialogOpen && (
        <p role="alert" className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {event.status === 2 && (
        <section className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
          <h2 className="font-semibold text-emerald-800">Final Meeting Time</h2>
          {event.finalSchedule ? (
            <p className="mt-2 text-lg font-semibold">
              {formatDay(event.finalSchedule)} · {event.finalSchedule.startTime} –{' '}
              {event.finalSchedule.endTime}
            </p>
          ) : (
            <p className="mt-2 text-sm">Final meeting details are not available.</p>
          )}
        </section>
      )}

      {canEdit && (
        <KeyParticipantSelector
          participants={event.participants}
          selected={keyParticipant}
          disabled={pending !== null}
          onChange={(name) => {
            setKeyParticipant(name);
            clearSuggestions();
          }}
        />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {canEdit && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending !== null || !onSuggestions}
                onClick={() => void findSuggestions()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pending === 'suggestions' ? 'Finding suggestions…' : 'Find Suggested Times'}
              </button>
              {suggestions.length > 0 && (
                <span className="text-xs text-slate-500">
                  {suggestions.length} suggestions · Red outline
                </span>
              )}
              {searched && suggestions.length === 0 && (
                <p role="status" className="text-sm text-slate-500">
                  No suggested times found.
                </p>
              )}
            </div>
          )}
          <Heatmap
            event={event}
            suggestions={suggestions}
            selected={selection.selected}
            selecting={interactive && selection.mode === 'select-final'}
            onInspect={setDetails}
            onStart={(point) => {
              if (interactive) selection.start(point);
            }}
            onExtend={(point) => {
              if (interactive) selection.extend(point);
            }}
            onKeyboardSelect={(point, extendRange) => {
              if (interactive) selection.chooseCell(point, extendRange);
            }}
          />
        </div>
        <div className="space-y-5">
          {canEdit && (
            <ScheduleControls
              selected={selection.selected}
              selecting={selection.mode === 'select-final'}
              disabled={pending !== null || !onFinalize || columns.length === 0}
              onBegin={selection.begin}
              onCancel={selection.cancel}
              onConfirm={() => {
                setError(null);
                setDialogOpen(true);
              }}
            />
          )}
          <AvailabilityDetails
            details={details}
            participants={event.participants}
            keyParticipant={keyParticipant}
          />
        </div>
      </div>
      <FinalizeDialog
        open={dialogOpen && canEdit}
        selected={selection.selected}
        timezone={event.timezone}
        pending={pending === 'finalize'}
        error={error}
        onClose={() => setDialogOpen(false)}
        onConfirm={() => void confirmSchedule()}
      />
    </main>
  );
}

export function HeatmapPage(props: HeatmapPageProps) {
  return (
    <EventOverview
      key={`${props.initialEvent?.shortCode}:${props.initialEvent?.revision}:${props.isAdmin}`}
      {...props}
    />
  );
}
