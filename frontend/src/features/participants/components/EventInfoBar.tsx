import { ArrowLeft, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'

import { formatDate } from '@/lib/date-time'
import { EventType, WEEKDAYS, weekdayRank } from '@/shared/constants'
import { buttonVariants } from '@/shared/components/ui/button'
import type { EventDetail } from '@/shared/types'

function formatRangeLabel(event: EventDetail): string {
  if (event.eventType === EventType.Weekdays) {
    const days = [...event.availableWeekdays].sort((a, b) => weekdayRank(a) - weekdayRank(b))
    return days.map((day) => WEEKDAYS[day].label).join(', ')
  }
  const dates = [...event.availableDates].sort()
  if (dates.length <= 1) return dates.map(formatDate).join('')
  return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])} · ${dates.length} days`
}

/** Tên event, các ngày và nút quay lại Overview */
export function EventInfoBar({ event, locked }: { event: EventDetail; locked: boolean }) {
  return (
    <div className="flex flex-col gap-1 px-4 pt-4 pb-2 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-bold sm:text-xl">{event.title}</h1>
          {locked && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <Lock className="size-3" aria-hidden="true" />
              <span className="sm:hidden">Finalized</span>
              <span className="hidden sm:inline">Finalized - schedule is read-only</span>
            </span>
          )}
        </div>
        <Link to=".." relative="path" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'shrink-0' })}>
          <ArrowLeft className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Back to Overview</span>
          <span className="sm:hidden">Back</span>
        </Link>
      </div>
      <p className="text-xs text-muted-foreground">{formatRangeLabel(event)}</p>
    </div>
  )
}
