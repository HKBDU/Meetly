import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarCheck2, Check, Clock3, Copy, Globe2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { timeToMinutes } from '@/lib/date-time';
import { AddToCalendarActions } from '@/shared/components/AddToCalendarActions';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui';
import { describeRange, useTimeView } from '@/shared/grid/time-view';
import { useT } from '@/shared/i18n';
import type { EventDetail } from '@/shared/types';

interface FinalizedSchedulePopoverProps {
  event: EventDetail;
  children: ReactNode;
}

const MOBILE_MEDIA_QUERY = '(max-width: 639px)';
const HOVER_MEDIA_QUERY = '(hover: hover) and (pointer: fine)';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const updateMatches = (event: MediaQueryListEvent) => setMatches(event.matches);

    mediaQuery.addEventListener('change', updateMatches);
    return () => mediaQuery.removeEventListener('change', updateMatches);
  }, [query]);

  return matches;
}

export function FinalizedSchedulePopover({ event, children }: FinalizedSchedulePopoverProps) {
  const t = useT();
  const view = useTimeView();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const isMobile = useMediaQuery(MOBILE_MEDIA_QUERY);
  const canHover = useMediaQuery(HOVER_MEDIA_QUERY);

  function cancelClose() {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function openFromHover() {
    if (!canHover) return;
    cancelClose();
    setOpen(true);
  }

  function closeFromHover() {
    if (!canHover) return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 160);
  }

  useEffect(() => () => {
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
  }, []);

  const schedule = event.finalSchedule;
  if (!schedule) return children;
  const finalizedSchedule = schedule;

  const duration = timeToMinutes(finalizedSchedule.endTime) - timeToMinutes(finalizedSchedule.startTime);
  const display = describeRange(view, finalizedSchedule, event.timezone, true);

  async function copyTime() {
    try {
      await navigator.clipboard.writeText(
        `${event.title}: ${display.day}, ${display.time} (${display.zone})`,
      );
      toast.success(t('final.copied'));
    } catch {
      toast.error(t('final.copyFailed'));
    }
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        cancelClose();
        setOpen(nextOpen);
      }}
    >
      <span className="block h-full w-full" onMouseEnter={openFromHover} onMouseLeave={closeFromHover}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
      </span>
      <PopoverContent
        side={isMobile ? 'bottom' : 'right'}
        align={isMobile ? 'center' : 'start'}
        sideOffset={isMobile ? 8 : 4}
        collisionPadding={12}
        sticky="always"
        className="flex max-h-[var(--radix-popover-content-available-height)] w-[calc(100vw-1.5rem)] max-w-[22rem] flex-col overflow-hidden rounded-2xl border-finalized/30 p-0 shadow-xl sm:w-[min(22rem,calc(100vw-2rem))]"
        onMouseEnter={openFromHover}
        onMouseLeave={closeFromHover}
      >
        <div className="flex shrink-0 items-start gap-3 bg-finalized px-4 py-4 text-finalized-foreground">
          <span className="rounded-xl bg-finalized-foreground/15 p-2.5">
            <CalendarCheck2 className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-finalized-foreground/80">{t('final.title')}</p>
            <p className="mt-1 truncate font-semibold">{event.title}</p>
          </div>
          <Button type="button" size="icon-sm" variant="ghost" aria-label={t('final.closeDetails')} className="text-finalized-foreground hover:bg-finalized-foreground/15 hover:text-finalized-foreground" onClick={() => setOpen(false)}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain p-4">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 text-sm">
            <CalendarCheck2 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">{t('final.date')}</dt><dd className="font-medium">{display.day}</dd></div>
            <Clock3 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">{t('final.time')}</dt><dd className="font-medium tabular-nums">{display.time}</dd></div>
            <Globe2 className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">{t('final.timezone')}</dt><dd className="font-medium">{display.zone}</dd></div>
            <Users className="mt-0.5 size-4 text-finalized" aria-hidden="true" />
            <div><dt className="text-xs text-muted-foreground">{t('final.meeting')}</dt><dd className="font-medium">{t('duration.minutes', { count: duration })} · {t('common.participants', { count: event.participants.length })}</dd></div>
          </dl>
          <p className="flex items-center gap-2 rounded-lg bg-finalized-muted px-3 py-2 text-xs font-medium text-finalized">
            <Check className="size-4 shrink-0" aria-hidden="true" />
            {t('final.done')}
          </p>
          <AddToCalendarActions event={event} source="heatmap" compact />
          <div className="flex justify-end border-t border-border pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => void copyTime()}><Copy aria-hidden="true" />{t('final.copyTime')}</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
