import { Globe2, UserPlus, Users } from 'lucide-react';
import { CopyButton } from '@/shared/components/CopyButton';
import { eventShareUrl } from '@/shared/lib/share';
import { Button } from '@/shared/components/ui';
import { useT } from '@/shared/i18n';
import type { EventHeaderProps } from '../types';
import { EditEventDialog } from './EditEventDialog';

export function EventHeader({
  event,
  canEdit,
  disabled,
  canUpdate,
  onOpenMySchedule,
  onInvite,
  onUpdateEvent,
}: EventHeaderProps) {
  const t = useT();
  const canOpenMySchedule = Boolean(onOpenMySchedule);
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
      <div className="min-w-0 flex-[1_1_32rem]">
        <h1 id="event-title" tabIndex={-1} className="text-3xl font-bold tracking-tight">
          {event.title}
        </h1>
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3">
          {!canEdit && (
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              {event.status === 1 ? t('overview.readOnly') : t('overview.locked')}
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
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Users size={15} aria-hidden="true" />
            {t('common.participants', { count: event.participants.length })}
          </span>
          <span className="flex items-center gap-2">
            <Globe2 size={15} aria-hidden="true" />
            {event.timezone}
          </span>
        </div>
      </div>
      <div className="grid w-full min-w-0 shrink-0 gap-2 sm:w-72">
        <button
          type="button"
          disabled={!canOpenMySchedule}
          onClick={onOpenMySchedule}
          title={!onOpenMySchedule ? t('overview.myScheduleUnavailable') : undefined}
          className="block h-11 w-full rounded-full bg-primary px-5 text-center text-sm font-medium text-primary-foreground shadow-soft transition-all hover:bg-primary-hover hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('overview.mySchedule')}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" onClick={onInvite} disabled={!onInvite}>
            <UserPlus aria-hidden="true" />
            {t('overview.invite')}
          </Button>
          <CopyButton value={eventShareUrl(event.shortCode)} successMessage={t('common.eventLinkCopied')} variant="outline" label={t('common.copyLink')} />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t('overview.eventCode')} <span className="font-semibold tracking-wide text-foreground">{event.shortCode}</span>
        </p>
      </div>
    </header>
  );
}
