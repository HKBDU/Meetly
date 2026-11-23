import { createContext, useContext, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { DayButton, type DayButtonProps } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { fromIsoDate, toIsoDate } from '@/lib/date-time'
import { WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { useDragSelection } from '../hooks/useDragSelection'

function tomorrow(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1)
  return date
}

function SelectorHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <FieldLabel>
        {label} <span className="text-destructive">*</span>
      </FieldLabel>
      <span className="text-xs font-semibold text-primary">{count} selected</span>
    </div>
  )
}

interface WeekdayPickerProps {
  value: number[]
  onChange: (value: number[]) => void
  error?: string
}

export function WeekdayPicker({ value, onChange, error }: WeekdayPickerProps) {
  const drag = useDragSelection<number>({ value, onChange, dataAttribute: 'data-weekday', parseKey: Number })

  return (
    <div className="grid gap-2">
      <SelectorHeader label="Weekdays" count={value.length} />
      <div className="grid touch-pan-y select-none grid-cols-7 gap-1.5 sm:gap-2" onTouchMove={drag.onContainerTouchMove}>
        {WEEKDAYS_MONDAY_FIRST.map((day) => {
          const selected = value.includes(day.value)
          return (
            <button
              key={day.value}
              type="button"
              data-weekday={day.value}
              aria-pressed={selected}
              onMouseDown={() => drag.onItemMouseDown(day.value)}
              onMouseEnter={() => drag.onItemMouseEnter(day.value)}
              onTouchStart={(event) => drag.onItemTouchStart(day.value, event)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onChange(selected ? value.filter((item) => item !== day.value) : [...value, day.value])
                }
              }}
              className={cn(
                'aspect-square min-h-9 rounded-md border text-sm font-medium transition-colors',
                'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-card text-foreground hover:bg-accent',
              )}
            >
              {day.shortLabel}
            </button>
          )
        })}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}

/** Handler kéo chọn cho các ô ngày; qua context để `DragDayButton` khai báo ngoài component, không bị mount lại mỗi lần render */
const DayDragContext = createContext<ReturnType<typeof useDragSelection<string>> | null>(null)

function DragDayButton({ day, modifiers, className, ...props }: DayButtonProps) {
  const drag = useContext(DayDragContext)
  const key = toIsoDate(day.date)
  const disabled = Boolean(modifiers.disabled)

  return (
    <DayButton
      {...props}
      day={day}
      modifiers={modifiers}
      data-date={key}
      className={cn(
        'grid h-9 w-full place-items-center rounded-md text-sm transition-colors sm:h-10',
        'focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
        modifiers.selected
          ? 'bg-primary font-semibold text-primary-foreground'
          : 'text-foreground hover:bg-accent',
        disabled && 'cursor-not-allowed text-muted-foreground opacity-50 hover:bg-transparent',
        className,
      )}
      onMouseDown={(event) => {
        props.onMouseDown?.(event)
        if (!disabled) drag?.onItemMouseDown(key)
      }}
      onMouseEnter={(event) => {
        props.onMouseEnter?.(event)
        if (!disabled) drag?.onItemMouseEnter(key)
      }}
      onTouchStart={(event) => {
        props.onTouchStart?.(event)
        if (!disabled) drag?.onItemTouchStart(key, event)
      }}
    />
  )
}

interface DatePickerProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export function DatePicker({ value, onChange, error }: DatePickerProps) {
  const [firstSelectable] = useState(tomorrow)
  const firstMonth = useMemo(
    () => new Date(firstSelectable.getFullYear(), firstSelectable.getMonth(), 1),
    [firstSelectable],
  )
  const [month, setMonth] = useState(firstMonth)
  const selected = useMemo(() => value.map(fromIsoDate), [value])
  const drag = useDragSelection<string>({
    value,
    onChange,
    dataAttribute: 'data-date',
    parseKey: (raw) => raw,
    isSelectable: (key) => fromIsoDate(key) >= firstSelectable,
  })

  const isFirstMonth =
    month.getFullYear() === firstMonth.getFullYear() && month.getMonth() === firstMonth.getMonth()
  const shiftMonth = (diff: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + diff, 1))

  return (
    <div className="grid gap-2">
      <SelectorHeader label="Dates" count={value.length} />
      <div className="rounded-lg bg-muted p-3 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" aria-label="Previous month" disabled={isFirstMonth} onClick={() => shiftMonth(-1)}>
            <ChevronLeft />
          </Button>
          <span className="text-base font-semibold" aria-live="polite">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button type="button" variant="ghost" size="icon" aria-label="Next month" onClick={() => shiftMonth(1)}>
            <ChevronRight />
          </Button>
        </div>
        <DayDragContext.Provider value={drag}>
          <div className="touch-pan-y select-none" onTouchMove={drag.onContainerTouchMove}>
            <Calendar
              mode="multiple"
              month={month}
              onMonthChange={setMonth}
              selected={selected}
              onSelect={() => undefined}
              disabled={{ before: firstSelectable }}
              hideNavigation
              showOutsideDays={false}
              weekStartsOn={1}
              components={{ DayButton: DragDayButton }}
              classNames={{
                root: 'w-full',
                months: 'w-full',
                month: 'w-full',
                month_caption: 'hidden',
                month_grid: 'w-full border-separate border-spacing-1',
                weekday: 'py-1 text-center text-xs font-semibold text-muted-foreground',
                day: 'p-0 text-center',
              }}
            />
          </div>
        </DayDragContext.Provider>
        <Button type="button" variant="ghost" size="sm" className="mt-2 text-primary" onClick={() => onChange([])}>
          <RotateCcw /> Reset dates
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
