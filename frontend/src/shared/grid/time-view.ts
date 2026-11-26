import { createContext, useContext } from 'react'

import { formatDate } from '@/lib/date-time'
import { formatDay } from '@/shared/grid/model'
import type { ViewerGrid } from '@/shared/grid/viewer-grid'
import type { FinalSchedule } from '@/shared/types'

export interface TimeView {
  mode: 'viewer' | 'event'
  setMode: (mode: 'viewer' | 'event') => void
  viewerZone: string
  eventZone: string
  weekStart?: string
  displayWeek?: { start: string; end: string }
  projected: ViewerGrid | null
  canSwitch: boolean
  formatRange: (range: FinalSchedule, finalized?: boolean) => { day: string; time: string; zone: string }
}

export const TimeViewContext = createContext<TimeView | null>(null)

export function useTimeView() {
  return useContext(TimeViewContext)
}

export function describeRange(view: TimeView | null, range: FinalSchedule, timeZone = '', finalized = false) {
  return view?.formatRange(range, finalized) ?? {
    day: formatDay(range), time: `${range.startTime} – ${range.endTime}`, zone: timeZone,
  }
}

export function describeLocalRange(date: string, startTime: string, endDate: string, endTime: string) {
  return {
    day: formatDate(date),
    time: `${startTime} – ${endDate === date ? '' : `${formatDate(endDate)} · `}${endTime}`,
  }
}
