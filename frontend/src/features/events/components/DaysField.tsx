import { X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { fromIsoDate, toIsoDate } from '@/lib/date-time'
import { EventType } from '@/shared/constants'
import { WEEKDAY_PRESETS, type EventFormValues } from '../schema'
import { dateChipFormat } from '../summary'
import { DatePicker, WeekdayPicker } from './AvailabilitySelector'
import { QuickChip } from './QuickChip'

const MAX_VISIBLE_DATES = 10

/** Ngày bắt đầu từ ngày mai (event không chọn được ngày đã qua) */
function upcomingDates(count: number, weekdaysOnly: boolean): string[] {
  const result: string[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (result.length < count) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (!weekdaysOnly || (day !== 0 && day !== 6)) result.push(toIsoDate(cursor))
  }
  return result
}

const sameSet = (a: readonly (string | number)[], b: readonly (string | number)[]) =>
  a.length === b.length && a.every((item) => b.includes(item))

interface DaysFieldProps {
  eventType: EventFormValues['eventType']
  dates: string[]
  weekdays: number[]
  onEventTypeChange: (type: EventFormValues['eventType']) => void
  onDatesChange: (dates: string[]) => void
  onWeekdaysChange: (weekdays: number[]) => void
  error?: string
}

/** Chọn loại (ngày cụ thể / thứ hằng tuần), chọn nhanh và chọn chi tiết */
export function DaysField({
  eventType,
  dates,
  weekdays,
  onEventTypeChange,
  onDatesChange,
  onWeekdaysChange,
  error,
}: DaysFieldProps) {
  const sortedDates = [...dates].sort()
  const next7 = upcomingDates(7, false)
  const next5Weekdays = upcomingDates(5, true)

  return (
    <div className="grid gap-4">
      <div role="radiogroup" aria-label="Event type" className="grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
        {[
          { type: EventType.Dates, label: 'Specific dates', short: 'Dates' },
          { type: EventType.Weekdays, label: 'Days of the week', short: 'Weekly' },
        ].map((option) => {
          const checked = eventType === option.type
          return (
            <button
              key={option.type}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => onEventTypeChange(option.type)}
              className={cn(
                'rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200',
                'focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
                checked ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="sm:hidden">{option.short}</span>
              <span className="hidden sm:inline">{option.label}</span>
            </button>
          )
        })}
      </div>

      {eventType === EventType.Dates ? (
        <>
          <div className="flex flex-wrap gap-2" aria-label="Quick date picks">
            <QuickChip active={sameSet(dates, next7)} onClick={() => onDatesChange(next7)}>
              Next 7 days
            </QuickChip>
            <QuickChip active={sameSet(dates, next5Weekdays)} onClick={() => onDatesChange(next5Weekdays)}>
              Next 5 weekdays
            </QuickChip>
          </div>
          <DatePicker value={dates} onChange={onDatesChange} error={error} />
          {sortedDates.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Selected dates">
              {sortedDates.slice(0, MAX_VISIBLE_DATES).map((date) => (
                <li key={date}>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-card py-0.5 pr-0.5 pl-2.5 text-xs tabular-nums">
                    {dateChipFormat.format(fromIsoDate(date))}
                    <button
                      type="button"
                      aria-label={`Remove ${date}`}
                      onClick={() => onDatesChange(dates.filter((item) => item !== date))}
                      className="grid size-5 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                </li>
              ))}
              {sortedDates.length > MAX_VISIBLE_DATES && (
                <li className="self-center text-xs text-muted-foreground">
                  +{sortedDates.length - MAX_VISIBLE_DATES} more
                </li>
              )}
            </ul>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" aria-label="Quick weekday picks">
            {WEEKDAY_PRESETS.map((preset) => (
              <QuickChip
                key={preset.label}
                active={sameSet(weekdays, preset.days)}
                onClick={() => onWeekdaysChange([...preset.days])}
              >
                {preset.label}
              </QuickChip>
            ))}
          </div>
          <WeekdayPicker value={weekdays} onChange={onWeekdaysChange} error={error} />
        </>
      )}
    </div>
  )
}
