import { CalendarCheck2 } from 'lucide-react'

import { AddToCalendarActions } from '@/shared/components/AddToCalendarActions'
import { EventStatus } from '@/shared/constants'
import { describeRange, useTimeView } from '@/shared/grid/time-view'
import { useT } from '@/shared/i18n'
import type { EventDetail } from '@/shared/types'

export function FinalizedScheduleSummary({ event }: { event: EventDetail }) {
  const t = useT()
  const view = useTimeView()
  if (event.status !== EventStatus.Finalized || !event.finalSchedule) return null
  const display = describeRange(view, event.finalSchedule, event.timezone, true)

  return (
    <section aria-labelledby="finalized-overview-title" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-finalized/30 bg-finalized-muted p-3 sm:p-4">
      <div className="flex min-w-0 items-start gap-2">
        <CalendarCheck2 className="mt-0.5 size-5 shrink-0 text-finalized" aria-hidden="true" />
        <div className="min-w-0">
          <h2 id="finalized-overview-title" className="text-sm font-semibold">{t('final.title')}</h2>
          <p className="text-sm tabular-nums text-muted-foreground">{display.day} · {display.time}</p>
        </div>
      </div>
      <AddToCalendarActions event={event} source="overview" />
    </section>
  )
}
