import { Copy, Globe2, Link2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui';
import type { EventHeaderProps } from '../types';
import { EditEventDialog } from './EditEventDialog';

const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120];

export function EventHeader({
  event,
  canEdit,
  duration,
  disabled,
  canUpdate,
  onOpenMySchedule,
  onDurationChange,
  onUpdateEvent,
}: EventHeaderProps) {
  const canOpenMySchedule = Boolean(onOpenMySchedule) && event.status === 1 && !disabled;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(event.url);
      toast.success('Event link copied.');
    } catch {
      toast.error('Unable to copy. Select and copy the link from the field.');
    }
  }

  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0 flex-[1_1_32rem]">
        <h1 id="event-title" tabIndex={-1} className="text-3xl font-bold tracking-tight">
          {event.title}
        </h1>
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
          {canEdit ? (
            <div className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500">
              <span>MEETING DURATION</span>
              <Select
                value={duration === undefined ? '' : String(duration)}
                disabled={disabled}
                onValueChange={(value) =>
                  onDurationChange(value === 'clear' ? undefined : Number(value))
                }
              >
                <SelectTrigger aria-label="Meeting duration" className="h-8 w-40 text-sm">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent position="popper" side="bottom" align="start" sideOffset={6}>
                  {DURATION_OPTIONS.map((minutes) => (
                    <SelectItem key={minutes} value={String(minutes)}>
                      {minutes} min
                    </SelectItem>
                  ))}
                  <SelectItem value="clear">Clear duration</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <span className="rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
              {event.status === 1 ? 'Overview · Read-only' : 'Event locked · Read-only'}
            </span>
          )}
          {canEdit && (
            <EditEventDialog
              event={event}
              disabled={disabled || !canUpdate}
              onSave={onUpdateEvent}
            />
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
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
      <div className="min-w-0 w-full shrink-0 space-y-3 sm:w-72">
        {event.url && (
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
            <Link2 size={14} className="shrink-0 text-primary" aria-hidden="true" />
            <Input
              aria-label="Event share link"
              title={event.url}
              value={event.url}
              readOnly
              onFocus={(focusEvent) => focusEvent.currentTarget.select()}
              className="h-auto min-w-0 flex-1 truncate border-0 bg-transparent p-0 text-xs text-slate-600 focus:ring-0"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void copyLink()}
              className="bg-white text-primary hover:bg-white hover:text-primary"
            >
              <Copy size={13} aria-hidden="true" />
              Copy
            </Button>
          </div>
        )}
        <button
          type="button"
          disabled={!canOpenMySchedule}
          onClick={onOpenMySchedule}
          title={
            event.status !== 1
              ? 'This event is locked.'
              : !onOpenMySchedule
                ? 'My Schedule is not available yet.'
                : undefined
          }
          className="block w-full rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          My Schedule
        </button>
      </div>
    </header>
  );
}
