import { ArrowUpRight, CalendarPlus, Download, Video } from 'lucide-react'

import { env } from '@/lib/env'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui'
import { EventStatus } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { buildCalendarDownloadUrl, buildGoogleCalendarUrl } from '@/shared/lib/calendar'
import type { EventDetail } from '@/shared/types'

export function AddToCalendarActions({
  event,
  source,
}: {
  event: EventDetail
  source: 'overview' | 'heatmap'
}) {
  const t = useT()
  if (event.status !== EventStatus.Finalized || !event.finalSchedule) return null
  const { meetingUrl } = event.finalSchedule
  const googleUrl = buildGoogleCalendarUrl(event, event.finalSchedule)
  const stacked = source === 'heatmap'
  const actionClass = 'group/calendar h-auto min-h-11 min-w-0 justify-start rounded-lg whitespace-normal px-4 py-2.5 text-left'
  const iconMotion = 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out'

  return (
    <div className={cn('grid w-full gap-2', !stacked && 'sm:w-auto sm:flex sm:flex-wrap')}>
      {meetingUrl && (
        <Button className={cn(actionClass, 'font-semibold')} asChild>
          <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
            <Video aria-hidden="true" />
            {t('calendar.joinMeet')}
          </a>
        </Button>
      )}
      {googleUrl && (
        <Button className={cn(actionClass, 'font-semibold')} asChild>
          <a href={googleUrl} target="_blank" rel="noopener noreferrer"
            onClick={() => trackEvent('add_to_google_calendar', { source })}>
            <CalendarPlus aria-hidden="true" />
            <span>{t('calendar.google')}</span>
            <ArrowUpRight
              className={cn('ms-auto opacity-75', iconMotion, 'motion-safe:group-hover/calendar:translate-x-0.5 motion-safe:group-hover/calendar:-translate-y-0.5 motion-safe:group-focus-visible/calendar:translate-x-0.5 motion-safe:group-focus-visible/calendar:-translate-y-0.5')}
              aria-hidden="true"
            />
          </a>
        </Button>
      )}
      <Button variant="secondary" className={cn(actionClass, 'border border-border hover:border-foreground/25')} asChild>
        <a href={buildCalendarDownloadUrl(env.apiBaseUrl, event.shortCode)} target="_blank" rel="noopener noreferrer"
          onClick={() => trackEvent('download_calendar_ics', { source })}>
          <Download className={cn(iconMotion, 'motion-safe:group-hover/calendar:translate-y-0.5 motion-safe:group-focus-visible/calendar:translate-y-0.5')} aria-hidden="true" />
          {t('calendar.download')}
        </a>
      </Button>
    </div>
  )
}
