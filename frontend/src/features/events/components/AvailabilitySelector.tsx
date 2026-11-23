import { createContext, useContext, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { DayButton, type DayButtonProps } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { fromIsoDate, toIsoDate } from '@/lib/date-time'
import { WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import { Button } from '@/shared/components/ui/button'
import { Calendar } from '@/shared/components/ui/calendar'
import { FieldError } from '@/shared/components/ui/field'
import { useDragSelection } from '../hooks/useDragSelection'

function tomorrow(): Date {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 1)
  return date
}

interface WeekdayPickerProps {
  value: number[]
  onChange: (value: number[]) => void
  error?: string
}

/** Thanh 7 viên Mon … Sun trên nền xám nhạt; bấm hoặc kéo ngang để chọn nhiều thứ */
export function WeekdayPicker({ value, onChange, error }: WeekdayPickerProps) {
  const drag = useDragSelection<number>({ value, onChange, dataAttribute: 'data-weekday', parseKey: Number })

  return (
    <div className="grid gap-2">
      <div
        role="group"
        aria-label="Days of the week"
        className="grid w-full touch-pan-y grid-cols-7 gap-1 rounded-full bg-muted p-1 select-none"
        onTouchMove={drag.onContainerTouchMove}
      >
        {WEEKDAYS_MONDAY_FIRST.map((day) => {
          const selected = value.includes(day.value)
          return (
            <button
              key={day.value}
              type="button"
              data-weekday={day.value}
              aria-pressed={selected}
              aria-label={day.label}
              title={day.label}
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
                'h-10 rounded-full text-sm font-medium transition-all duration-200 sm:h-11',
                'focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
                selected
                  ? 'bg-primary text-primary-foreground shadow-soft'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground',
              )}
            >
              <span aria-hidden="true" className="sm:hidden">
                {day.shortLabel.slice(0, 2)}
              </span>
              <span aria-hidden="true" className="hidden sm:inline">
                {day.shortLabel}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {value.length === 0 ? 'Tap or drag across the days.' : `${value.length} ${value.length === 1 ? 'day' : 'days'} a week`}
      </p>
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
        'mx-auto grid aspect-square w-full max-w-10 place-items-center rounded-full text-sm tabular-nums transition-colors duration-200',
        'focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
        modifiers.selected ? 'bg-primary font-medium text-primary-foreground' : 'text-foreground hover:bg-muted',
        modifiers.today && !modifiers.selected && 'font-semibold text-brand',
        disabled && 'cursor-not-allowed text-muted-foreground/40 hover:bg-transparent',
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

/** Lịch tháng; bấm hoặc kéo qua nhiều ngày để chọn, không chọn được ngày đã qua */
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
      <div className="rounded-2xl border bg-card p-3 shadow-soft sm:p-5">
        <div className="mb-2 flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Previous month" disabled={isFirstMonth} onClick={() => shiftMonth(-1)}>
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium" aria-live="polite">
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => shiftMonth(1)}>
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
                month_grid: 'w-full border-separate border-spacing-y-1',
                weekday: 'pb-2 text-center text-[11px] font-medium text-muted-foreground',
                day: 'p-0 text-center',
              }}
            />
          </div>
        </DayDragContext.Provider>
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {value.length === 0 ? 'Tap or drag across dates.' : `${value.length} ${value.length === 1 ? 'date' : 'dates'} picked`}
          </span>
          {value.length > 0 && (
            <Button type="button" variant="ghost" size="xs" onClick={() => onChange([])}>
              <RotateCcw /> Clear
            </Button>
          )}
        </div>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
