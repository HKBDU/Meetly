import { useEffect, useState, type ReactNode } from 'react';
import { CalendarCheck2, Check, Clock3, Copy, Globe2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { timeToMinutes } from '@/lib/date-time';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui';
import { formatDay } from '../time';
import type { HeatmapEvent } from '../types';

interface FinalizedSchedulePopoverProps {
  event: HeatmapEvent;
  children: ReactNode;
}

const MOBILE_MEDIA_QUERY = '(max-width: 639px)';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
    const updateIsMobile = (event: MediaQueryListEvent) => setIsMobile(event.matches);

    mediaQuery.addEventListener('change', updateIsMobile);
    return () => mediaQuery.removeEventListener('change', updateIsMobile);
  }, []);

  return isMobile;
}

export function FinalizedSchedulePopover({ event, children }: FinalizedSchedulePopoverProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
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
        side={isMobile ? 'bottom' : 'right'}
        align={isMobile ? 'center' : 'start'}
        sideOffset={isMobile ? 8 : 4}
        collisionPadding={12}
        sticky="always"
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[calc(100vw-1.5rem)] max-w-[22rem] flex-col overflow-hidden rounded-2xl border-blue-200 p-0 shadow-xl sm:w-[min(22rem,calc(100vw-2rem))]"
      >
        <div className="flex shrink-0 items-start gap-3 bg-blue-600 px-4 py-4 text-white">
          <span className="rounded-xl bg-white/15 p-2.5">
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">Finalized schedule</p>
            <p className="mt-1 truncate font-semibold">{event.title}</p>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" aria-label="Close final schedule details" className="text-white hover:bg-white/15 hover:text-white" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
            <CalendarCheck2 className="mt-0.5 size-4 text-blue-600" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Date</dt><dd className="font-medium">{formatDay(finalizedSchedule)}</dd></div>
            <Clock3 className="mt-0.5 size-4 text-blue-600" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Time</dt><dd className="font-medium tabular-nums">{timeText}</dd></div>
            <Globe2 className="mt-0.5 size-4 text-blue-600" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Time zone</dt><dd className="font-medium">{event.timezone}</dd></div>
            <Users className="mt-0.5 size-4 text-blue-600" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">Meeting</dt><dd className="font-medium">{duration} min · {event.participants.length} participants</dd></div>
          </dl>
          <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-800">
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
