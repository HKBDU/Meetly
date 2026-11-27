import { useMemo, useState, type ReactNode } from 'react'
import { Globe2 } from 'lucide-react'

import { addIsoDays, dateFormatter, fromIsoDate, getViewerTimeZone } from '@/lib/date-time'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui'
import { EventType } from '@/shared/constants'
import { formatDay } from '@/shared/grid/model'
import { useT } from '@/shared/i18n'
import { TimeViewContext, describeLocalRange, useTimeView, type TimeView } from './time-view'
import { buildViewerGrid, formatUtcOffset, getReferenceWeekStart, resolveScheduleDisplay, type GridEvent } from './viewer-grid'

export function EventTimeView({ event, children }: { event: GridEvent; children: ReactNode }) {
  const [mode, setMode] = useState<TimeView['mode']>('viewer')
  const [now] = useState(Date.now)
  const [viewerZone] = useState(getViewerTimeZone)
  const { timezone, eventType, availableDates, availableWeekdays, dailyStartTime, dailyEndTime } = event
  const weekStart = getReferenceWeekStart(timezone, now)
  const grid = useMemo(
    () => buildViewerGrid({ timezone, eventType, availableDates, availableWeekdays, dailyStartTime, dailyEndTime }, viewerZone, weekStart),
    [timezone, eventType, availableDates, availableWeekdays, dailyStartTime, dailyEndTime, viewerZone, weekStart],
  )
  const usesViewerZone = mode === 'viewer' && !grid.unavailableSourceTimes
  const displayZone = usesViewerZone ? viewerZone : timezone
  const recurring = eventType === EventType.Weekdays
  const weekEnd = addIsoDays(weekStart, 6)
  const firstDate = grid.columns[0]?.specificDate ?? weekStart
  const lastDate = grid.columns.at(-1)?.specificDate ?? weekEnd
  const displayWeek = recurring ? {
    start: usesViewerZone && firstDate < weekStart ? firstDate : weekStart,
    end: usesViewerZone && lastDate > weekEnd ? lastDate : weekEnd,
  } : undefined
  const value: TimeView = {
    mode: usesViewerZone ? 'viewer' : 'event',
    setMode,
    viewerZone,
    eventZone: timezone,
    weekStart: recurring ? weekStart : undefined,
    displayWeek,
    projected: usesViewerZone && (!grid.matchesEvent || recurring) ? grid : null,
    canSwitch: !grid.matchesEvent && !grid.unavailableSourceTimes,
    formatRange(range, finalized = false) {
      const display = resolveScheduleDisplay(range, timezone, displayZone, now, finalized ? undefined : weekStart)
      if (!display) {
        return { day: formatDay(range), time: `${range.startTime} – ${range.endTime}`, zone: timezone }
      }
      const start = display.showOffsets ? `${display.startTime} ${formatUtcOffset(display.startOffset)}` : display.startTime
      const end = display.showOffsets ? `${display.endTime} ${formatUtcOffset(display.endOffset)}` : display.endTime
      return { ...describeLocalRange(display.date, start, display.endDate, end), zone: displayZone }
    },
  }
  return <TimeViewContext.Provider value={value}>{children}</TimeViewContext.Provider>
}

export function TimeViewLabel({ hideStaticZone = false }: { hideStaticZone?: boolean }) {
  const t = useT()
  const view = useTimeView()
  if (!view) return null
  const zoneLabel = (zone: string) => zone.split('/').at(-1)!.replaceAll('_', ' ')
  const week = view.displayWeek
  if (!view.canSwitch && hideStaticZone && !week) return null

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {view.canSwitch ? (
        <Select value={view.mode} onValueChange={view.setMode}>
          <SelectTrigger aria-label={t('tz.change')} size="sm" className="max-w-full rounded-full text-xs">
            <Globe2 aria-hidden="true" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem value="viewer">{t('tz.viewer')} · {zoneLabel(view.viewerZone)}</SelectItem>
            <SelectItem value="event">{t('tz.event')} · {zoneLabel(view.eventZone)}</SelectItem>
          </SelectContent>
        </Select>
      ) : !hideStaticZone && (
        <span className="inline-flex items-center gap-1.5">
          <Globe2 className="size-3.5" aria-hidden="true" />
          {view.eventZone}
        </span>
      )}
      {week && (
        <span>{t('tz.week', {
          range: dateFormatter({ month: 'short', day: 'numeric', year: 'numeric' })
            .formatRange(fromIsoDate(week.start), fromIsoDate(week.end)),
        })}</span>
      )}
    </div>
  )
}
