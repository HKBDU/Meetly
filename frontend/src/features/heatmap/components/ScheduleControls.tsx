import type { FinalSchedule } from '../types';
import { formatDay } from '../time';

interface Props {
  selected: FinalSchedule | null;
  selecting: boolean;
  disabled: boolean;
  onBegin: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ScheduleControls({
  selected,
  selecting,
  disabled,
  onBegin,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <section
      className="rounded-xl border-2 border-emerald-700 bg-white p-5"
      aria-labelledby="schedule-heading"
    >
      <h2 id="schedule-heading" className="text-lg font-semibold">
        Select Event Time
      </h2>
      {!selecting && (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enable selection to drag a continuous time range within one day.
          </p>
          <button
            type="button"
            disabled={disabled}
            onClick={onBegin}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Select Final Time
          </button>
        </>
      )}
      {selecting && (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Drag across the grid to select. Keyboard: Enter sets the first slot; Shift + Enter sets
            the last.
          </p>
          {selected && (
            <div className="mt-4 rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-medium">{formatDay(selected)}</p>
              <p className="mt-1 text-xl font-bold">
                {selected.startTime} – {selected.endTime}
              </p>
            </div>
          )}
          <button
            type="button"
            disabled={disabled || !selected}
            onClick={onConfirm}
            className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Confirm
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={onCancel}
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-50"
          >
            Cancel Selection
          </button>
        </>
      )}
    </section>
  );
}
