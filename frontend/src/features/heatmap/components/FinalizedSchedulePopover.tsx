import { useEffect, useRef, useState, type ReactNode } from 'react';
import { CalendarCheck2, Clock3, Copy, Globe2, Users, X, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { timeToMinutes } from '@/lib/date-time';
import { AddToCalendarActions } from '@/shared/components/AddToCalendarActions';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui';
import { describeRange, useTimeView } from '@/shared/grid/time-view';
import { useT } from '@/shared/i18n';
import type { EventDetail } from '@/shared/types';
import { cn } from '@/lib/utils';

interface FinalizedSchedulePopoverProps {
  event: EventDetail;
  children: ReactNode;
}

/** Một ô thông tin trong lưới 2 cột: icon, nhãn nhỏ, giá trị */
function DetailItem({ icon: Icon, label, className, children }: { icon: LucideIcon; label: string; className?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-finalized" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className={cn('font-medium', className)}>{children}</dd>
      </div>
    </div>
  );
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
          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <DetailItem icon={CalendarCheck2} label={t('final.date')}>{display.day}</DetailItem>
            <DetailItem icon={Clock3} label={t('final.time')} className="tabular-nums">{display.time}</DetailItem>
            <DetailItem icon={Globe2} label={t('final.timezone')} className="break-all">{display.zone}</DetailItem>
            <DetailItem icon={Users} label={t('final.meeting')}>
              {t('duration.minutes', { count: duration })} · {t('common.participants', { count: event.participants.length })}
            </DetailItem>
          </dl>
          {/* Tiêu đề đã ghi "Lịch đã chốt" nên không cần thêm dòng xác nhận; link họp nằm trong nút Tham gia */}
          <AddToCalendarActions
            event={event}
            source="heatmap"
            compact
            className="border-t border-border pt-3"
            extra={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 rounded-full"
                aria-label={t('final.copyTime')}
                title={t('final.copyTime')}
                onClick={() => void copyTime()}
              >
                <Copy aria-hidden="true" />
              </Button>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
