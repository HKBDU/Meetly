import { Globe2, UserPlus, Users } from 'lucide-react';
import { CopyButton } from '@/shared/components/CopyButton';
import { Button } from '@/shared/components/ui';
import { eventShareUrl } from '@/shared/lib/share';
import { useTimeView } from '@/shared/grid/time-view';
import { useT } from '@/shared/i18n';
import type { EventHeaderProps } from '../types';
import { EditEventDialog } from './EditEventDialog';
import { LiveActivity } from './LiveActivity';
import { MeetingLinkDialog } from './MeetingLinkDialog';
import { MeetingRoomAction } from './MeetingRoomAction';
import { normalizeMeetingLink } from '../meetingLink';

export function EventHeader({
  event,
  canEdit,
  disabled,
  canUpdate,
  onOpenMySchedule,
  onInvite,
  onUpdateMeetingUrl,
  onUpdateEvent,
  currentUsername,
}: EventHeaderProps) {
  const t = useT();
  const timeView = useTimeView();
  const canOpenMySchedule = Boolean(onOpenMySchedule);
  const meetingUrl = normalizeMeetingLink(event.meetingUrl ?? '').url;
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
          {canEdit && canUpdate && (
            <EditEventDialog
              event={event}
              disabled={disabled}
              onSave={onUpdateEvent}
            />
          )}
        </div>
        <div className="mt-5">
          <LiveActivity shortCode={event.shortCode} participants={event.participants} currentUsername={currentUsername} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <Users size={15} aria-hidden="true" />
            {t('common.participants', { count: event.participants.length })}
          </span>
          {!timeView?.canSwitch && (
            <span className="flex items-center gap-2">
              <Globe2 size={15} aria-hidden="true" />
              {event.timezone}
            </span>
          )}
        </div>
        {meetingUrl && (
          <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="shrink-0">Meeting room:</span>
            <MeetingRoomAction meetingUrl={meetingUrl} mode="copy" className="w-56 max-w-full" />
          </div>
        )}
      </div>
      <div className="grid w-full min-w-0 shrink-0 gap-2 sm:w-80">
        <button
          type="button"
          disabled={!canOpenMySchedule}
          onClick={onOpenMySchedule}
          title={!onOpenMySchedule ? t('overview.myScheduleUnavailable') : undefined}
          className="block h-11 w-full rounded-full bg-primary px-5 text-center text-sm font-medium text-primary-foreground shadow-soft transition-all hover:bg-primary-hover hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('overview.mySchedule')}
        </button>
        <div className={onUpdateMeetingUrl ? 'grid grid-cols-[auto_minmax(0,1fr)] gap-2' : 'grid gap-2'}>
          <Button type="button" variant="outline" onClick={onInvite} disabled={!onInvite}>
            <UserPlus aria-hidden="true" />
            {t('overview.invite')}
          </Button>
          {onUpdateMeetingUrl && (
            <MeetingLinkDialog
              meetingUrl={event.meetingUrl}
              onSave={onUpdateMeetingUrl}
              disabled={disabled}
            />
          )}
        </div>
        <div className="grid w-max max-w-full grid-cols-[max-content_max-content] items-center justify-self-center gap-x-2 gap-y-2 text-xs text-muted-foreground">
          <span>{t('overview.eventCode')}:</span>
          <CopyButton
            value={eventShareUrl(event.shortCode)}
            successMessage={t('common.eventLinkCopied')}
            variant="outline"
            size="sm"
            iconPosition="end"
            aria-label={`${t('common.copyLink')}: ${event.shortCode}`}
            className="w-28 font-semibold tracking-wide text-foreground"
          >
            {event.shortCode}
          </CopyButton>
        </div>
      </div>
    </header>
  );
}
