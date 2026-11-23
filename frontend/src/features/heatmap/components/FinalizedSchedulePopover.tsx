import { useState, type ReactNode } from 'react';
import { CalendarCheck2, Check, Clock3, Copy, Globe2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { timeToMinutes } from '@/lib/date-time';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui';
import { formatDay } from '@/shared/grid/model';
import type { EventDetail } from '@/shared/types';

interface FinalizedSchedulePopoverProps {
  event: EventDetail;
  children: ReactNode;
}

export function FinalizedSchedulePopover({ event, children }: FinalizedSchedulePopoverProps) {
  const [open, setOpen] = useState(false);
  const schedule = event.finalSchedule;
  if (!schedule) return children;
  const finalizedSchedule = schedule;

  const duration = timeToMinutes(finalizedSchedule.endTime) - timeToMinutes(finalizedSchedule.startTime);
  const timeText = `${finalizedSchedule.startTime} – ${finalizedSchedule.endTime}`;

  async function copyTime() {
    try {
      await navigator.clipboard.writeText(
        `${event.title}: ${formatDay(finalizedSchedule)}, ${timeText} (${event.timezone})`,
      );
      toast.success('Final meeting time copied.');
    } catch {
      toast.error('Unable to copy the final meeting time.');
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        collisionPadding={16}
        className="w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-finalized/30 p-0 shadow-xl"
      >
        <div className="flex items-start gap-3 bg-finalized px-4 py-4 text-finalized-foreground">
          <span className="rounded-xl bg-card/15 p-2.5">
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-finalized-foreground/80">Finalized schedule</p>
            <p className="mt-1 truncate font-semibold">{event.title}</p>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Close final schedule details" className="text-finalized-foreground hover:bg-card/15 hover:text-finalized-foreground" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="space-y-4 p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
            <CalendarCheck2 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Date</dt><dd className="font-medium">{formatDay(finalizedSchedule)}</dd></div>
            <Clock3 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Time</dt><dd className="font-medium tabular-nums">{timeText}</dd></div>
            <Globe2 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Time zone</dt><dd className="font-medium">{event.timezone}</dd></div>
            <Users className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Meeting</dt><dd className="font-medium">{duration} min · {event.participants.length} participants</dd></div>
          </dl>
          <p className="flex items-center gap-2 rounded-lg bg-finalized-muted px-3 py-2 text-xs font-medium text-finalized">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            The meeting time has been finalized.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => void copyTime()}><Copy aria-hidden="true" />Copy time</Button>
            <Button type="button" size="sm" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
