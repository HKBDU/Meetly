import { ArrowUpRight, CalendarPlus, Download, Video } from 'lucide-react'

import { env } from '@/lib/env'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui'
import { EventStatus } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { buildCalendarDownloadUrl, buildGoogleCalendarUrl } from '@/shared/lib/calendar'
import type { EventDetail } from '@/shared/types'

const iconMotion = 'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out'

/**
 * "Thêm vào Google Calendar" (mở trang tạo sự kiện của Google, điền sẵn) và "Tải .ics"
 * (Apple Calendar, Outlook...). Hai nút gọn theo nội dung, cùng hàng, hết chỗ thì xuống dòng.
 * `compact`: chỗ hẹp như popover, nút tải chỉ ghi ".ics" (tên đầy đủ vẫn ở aria-label/tooltip) để vừa một hàng.
 */
export function AddToCalendarActions({
  event,
  source,
  compact = false,
  className,
}: {
  event: EventDetail
  source: 'overview' | 'heatmap'
  compact?: boolean
  className?: string
}) {
  const t = useT()
  if (event.status !== EventStatus.Finalized || !event.finalSchedule) return null
  const { meetingUrl } = event.finalSchedule
  const googleUrl = buildGoogleCalendarUrl(event, event.finalSchedule)

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {meetingUrl && (
        <Button size="sm" className="hover-shine rounded-full" asChild>
          <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
            <Video aria-hidden="true" />
            {t('calendar.joinMeet')}
          </a>
        </Button>
      )}
      {googleUrl && (
        <Button size="sm" className="group/calendar hover-shine rounded-full" asChild>
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('add_to_google_calendar', { source })}
          >
            <CalendarPlus aria-hidden="true" />
            {t('calendar.google')}
            <ArrowUpRight
              className={cn(
                'opacity-70',
                iconMotion,
                'motion-safe:group-hover/calendar:translate-x-0.5 motion-safe:group-hover/calendar:-translate-y-0.5 motion-safe:group-focus-visible/calendar:translate-x-0.5 motion-safe:group-focus-visible/calendar:-translate-y-0.5',
              )}
              aria-hidden="true"
            />
          </a>
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="group/calendar hover-shine rounded-full border-foreground/20 hover:border-foreground/35 [--shine:color-mix(in_oklab,var(--foreground)_14%,transparent)]"
        asChild
      >
        <a
          href={buildCalendarDownloadUrl(env.apiBaseUrl, event.shortCode)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={compact ? t('calendar.download') : undefined}
          title={compact ? t('calendar.download') : undefined}
          onClick={() => trackEvent('download_calendar_ics', { source })}
        >
          <Download
            className={cn(
              iconMotion,
              'motion-safe:group-hover/calendar:translate-y-0.5 motion-safe:group-focus-visible/calendar:translate-y-0.5',
            )}
            aria-hidden="true"
          />
          {compact ? '.ics' : t('calendar.download')}
        </a>
      </Button>
    </div>
  )
}
