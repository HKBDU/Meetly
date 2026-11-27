import type { ReactNode } from 'react'
import { ArrowUpRight, CalendarPlus, Download, Video } from 'lucide-react'

import { env } from '@/lib/env'
import { trackEvent } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui'
import { EventStatus } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { buildCalendarDownloadUrl, buildGoogleCalendarUrl } from '@/shared/lib/calendar'
import type { EventDetail } from '@/shared/types'
import { meetingProvider } from '@/features/heatmap/meetingLink'

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
  showJoin = true,
  extra,
  className,
}: {
  event: EventDetail
  source: 'overview' | 'heatmap'
  compact?: boolean
  /** Tắt ở chỗ đã có dòng "Meeting room" để link họp không lặp lại */
  showJoin?: boolean
  /** Nút phụ đặt cùng hàng với .ics (VD "Chép giờ" trong popover) */
  extra?: ReactNode
  className?: string
}) {
  const t = useT()
  if (event.status !== EventStatus.Finalized || !event.finalSchedule) return null
  const { meetingUrl } = event
  const googleUrl = buildGoogleCalendarUrl(event, event.finalSchedule)
  const provider = meetingUrl ? meetingProvider(meetingUrl) : null
  const joinLabel = provider === 'google' ? 'calendar.joinMeet' : provider === 'jitsi' ? 'calendar.joinJitsi' : 'calendar.joinMeeting'

  return (
    <div className={cn(compact ? 'grid gap-2' : 'flex flex-wrap items-center gap-2', className)}>
      {showJoin && meetingUrl && (
        <Button size="sm" className={cn('hover-shine rounded-full', compact && 'w-full')} asChild>
          <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
            <Video aria-hidden="true" />
            {t(joinLabel)}
          </a>
        </Button>
      )}
      <div className={cn('flex items-center gap-2', compact ? 'min-w-0' : 'contents')}>
      {googleUrl && (
        <Button
          size="sm"
          variant={compact ? 'outline' : 'default'}
          className={cn('group/calendar hover-shine rounded-full', compact && 'min-w-0 flex-1')}
          asChild
        >
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('add_to_google_calendar', { source })}
          >
            <CalendarPlus aria-hidden="true" />
            {t(compact ? 'calendar.googleShort' : 'calendar.google')}
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
      {extra}
      </div>
    </div>
  )
}
