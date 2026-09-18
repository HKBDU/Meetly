import { Button, Card, CardContent, CardHeader } from '@/shared/components/ui';
import type { ScheduleControlsProps } from '../types';
import { formatDay } from '../time';

export function ScheduleControls({
  selected,
  selecting,
  disabled,
  onBegin,
  onCancel,
  onConfirm,
}: ScheduleControlsProps) {
  return (
    <Card
      className="border-2 border-blue-700 shadow-none"
      aria-labelledby="schedule-heading"
    >
      <CardHeader>
        <h2 id="schedule-heading" className="text-lg font-semibold">Select Event Time</h2>
      </CardHeader>
      <CardContent>
      {!selecting && (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enable selection to drag a continuous time range within one day.
          </p>
          <Button
            disabled={disabled}
            onClick={onBegin}
            className="mt-4 w-full"
          >
            Select Final Time
          </Button>
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
          <Button
            disabled={disabled || !selected}
            onClick={onConfirm}
            className="mt-4 w-full"
          >
            Confirm
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={onCancel}
            className="mt-2 w-full"
          >
            Cancel Selection
          </Button>
        </>
      )}
      </CardContent>
    </Card>
  );
}
