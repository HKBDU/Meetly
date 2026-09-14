import { useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { CalendarDays, ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react';
import type { EditableEvent, UpdateEventPayload } from '../types';

interface Props {
  event: EditableEvent;
  disabled?: boolean;
  onSave: (payload: UpdateEventPayload) => Promise<void>;
}

const weekdays = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];
const calendarWeekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4)
    .toString()
    .padStart(2, '0');
  const minutes = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

function parseDate(value: string): Date | null {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(dates: string[]): Date {
  const firstDate = dates.map(parseDate).find((date): date is Date => date !== null);
  const date = firstDate ?? new Date();
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getCalendarDays(month: Date): Array<number | null> {
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const mondayOffset = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7;
  const cells: Array<number | null> = [
    ...Array.from({ length: mondayOffset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function EditEventDialog({ event, disabled = false, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [startTime, setStartTime] = useState(event.dailyStartTime);
  const [endTime, setEndTime] = useState(event.dailyEndTime);
  const [selectedDates, setSelectedDates] = useState(event.availableDates);
  const [selectedWeekdays, setSelectedWeekdays] = useState(event.availableWeekdays);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(event.availableDates));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setTitle(event.title);
    setStartTime(event.dailyStartTime);
    setEndTime(event.dailyEndTime);
    setSelectedDates(event.availableDates);
    setSelectedWeekdays(event.availableWeekdays);
    setVisibleMonth(startOfMonth(event.availableDates));
    setError(null);
  }

  function openDialog() {
    resetForm();
    setOpen(true);
  }

  function toggleDate(date: string) {
    setSelectedDates((current) =>
      current.includes(date)
        ? current.filter((selectedDate) => selectedDate !== date)
        : [...current, date].sort(),
    );
  }

  function toggleWeekday(day: number) {
    setSelectedWeekdays((current) =>
      current.includes(day)
        ? current.filter((selectedDay) => selectedDay !== day)
        : [...current, day],
    );
  }

  async function submit(eventSubmit: FormEvent<HTMLFormElement>) {
    eventSubmit.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Event name is required.');
      return;
    }
    if (toMinutes(startTime) >= toMinutes(endTime)) {
      setError('Start time must be earlier than end time.');
      return;
    }
    if (event.eventType === 1 && selectedDates.length === 0) {
      setError('Select at least one date.');
      return;
    }
    if (event.eventType === 2 && selectedWeekdays.length === 0) {
      setError('Select at least one weekday.');
      return;
    }

    setPending(true);
    setError(null);
    try {
      await onSave({
        title: cleanTitle,
        eventType: event.eventType,
        availableDates: event.eventType === 1 ? selectedDates : [],
        availableWeekdays: event.eventType === 2 ? selectedWeekdays : [],
        dailyStartTime: startTime,
        dailyEndTime: endTime,
      });
      setOpen(false);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to update the event.');
    } finally {
      setPending(false);
    }
  }

  const year = visibleMonth.getUTCFullYear();
  const month = visibleMonth.getUTCMonth();

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Pencil size={15} aria-hidden="true" />
        Edit Event
      </button>

      <Dialog.Root
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && pending) return;
          setOpen(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100vh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
            onEscapeKeyDown={(dialogEvent) => {
              if (pending) dialogEvent.preventDefault();
            }}
            onPointerDownOutside={(dialogEvent) => {
              if (pending) dialogEvent.preventDefault();
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <Dialog.Title className="text-xl font-semibold">Edit event</Dialog.Title>
              <Dialog.Close
                type="button"
                disabled={pending}
                aria-label="Close edit event dialog"
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={19} aria-hidden="true" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-2 text-sm text-slate-500">
              Update the event name, available hours, and {event.eventType === 1 ? 'dates' : 'weekdays'}.
            </Dialog.Description>

            <form className="mt-6 space-y-6" onSubmit={(formEvent) => void submit(formEvent)}>
              <label className="block text-sm font-medium text-slate-700">
                Event name
                <input
                  value={title}
                  disabled={pending}
                  onChange={(inputEvent) => setTitle(inputEvent.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <fieldset disabled={pending}>
                <legend className="text-sm font-medium text-slate-700">What times might work?</legend>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <select
                    aria-label="Event start time"
                    value={startTime}
                    onChange={(selectEvent) => setStartTime(selectEvent.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <span className="text-sm text-slate-500">to</span>
                  <select
                    aria-label="Event end time"
                    value={endTime}
                    onChange={(selectEvent) => setEndTime(selectEvent.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </fieldset>

              {event.eventType === 1 ? (
                <fieldset disabled={pending}>
                  <legend className="text-sm font-medium text-slate-700">What dates might work?</legend>
                  <p className="mt-1 text-xs text-slate-500">Select or deselect multiple dates.</p>
                  <div className="mt-3 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        aria-label="Previous month"
                        onClick={() => setVisibleMonth(new Date(Date.UTC(year, month - 1, 1)))}
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                      >
                        <ChevronLeft size={18} aria-hidden="true" />
                      </button>
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <CalendarDays size={16} className="text-emerald-600" aria-hidden="true" />
                        {monthFormatter.format(visibleMonth)}
                      </span>
                      <button
                        type="button"
                        aria-label="Next month"
                        onClick={() => setVisibleMonth(new Date(Date.UTC(year, month + 1, 1)))}
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                      >
                        <ChevronRight size={18} aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                      {calendarWeekdays.map((day, index) => (
                        <span key={`${day}:${index}`} className="py-1 text-xs font-medium text-slate-400">
                          {day}
                        </span>
                      ))}
                      {getCalendarDays(visibleMonth).map((day, index) => {
                        if (day === null) return <span key={`empty:${index}`} />;
                        const date = formatIsoDate(year, month, day);
                        const selected = selectedDates.includes(date);
                        return (
                          <button
                            key={date}
                            type="button"
                            aria-pressed={selected}
                            aria-label={date}
                            onClick={() => toggleDate(date)}
                            className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs ${selected ? 'bg-emerald-600 font-semibold text-white' : 'text-slate-700 hover:bg-emerald-50'}`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </fieldset>
              ) : (
                <fieldset disabled={pending}>
                  <legend className="text-sm font-medium text-slate-700">What days might work?</legend>
                  <div className="mt-3 grid grid-cols-7 overflow-hidden rounded-lg border border-slate-300">
                    {weekdays.map((day) => {
                      const selected = selectedWeekdays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleWeekday(day.value)}
                          className={`border-r border-slate-300 px-1 py-2 text-xs last:border-r-0 ${selected ? 'bg-emerald-100 font-semibold text-emerald-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Save edits'}
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
