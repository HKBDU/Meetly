import { useEffect, useRef, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { DayButton, type DayButtonProps } from 'react-day-picker'
import { eventUi } from './styles'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar } from '@/shared/components/ui/calendar'
import type { EventType } from '../types'
import { getDateKey } from '../utils/date.utils'

const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type AvailabilitySelectorProps = {
  eventType: EventType
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export function AvailabilitySelector({
  eventType,
  value,
  onChange,
  error,
}: AvailabilitySelectorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const valueRef = useRef(value)
  const dragModeRef = useRef<'add' | 'remove' | null>(null)
  const dragVisitedRef = useRef<Set<string>>(new Set())

  const firstSelectableDate = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 1)
    return date
  }, [])

  const startMonth = useMemo(
    () => new Date(firstSelectableDate.getFullYear(), firstSelectableDate.getMonth(), 1),
    [firstSelectableDate],
  )

  const [month, setMonth] = useState(startMonth)

  const selectedDates = useMemo(
    () => value.map((date) => new Date(`${date}T00:00:00`)),
    [value],
  )

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    function finishDrag() {
      dragModeRef.current = null
      dragVisitedRef.current = new Set()
      setIsDragging(false)
    }
    window.addEventListener('mouseup', finishDrag)
    return () => window.removeEventListener('mouseup', finishDrag)
  }, [])

  function applyDay(dateKey: string, mode: 'add' | 'remove') {
    const current = valueRef.current
    const has = current.includes(dateKey)
    if (mode === 'add' && !has) {
      const next = [...current, dateKey]
      valueRef.current = next
      onChange(next)
    } else if (mode === 'remove' && has) {
      const next = current.filter((d) => d !== dateKey)
      valueRef.current = next
      onChange(next)
    }
  }

  function startDrag(date: Date) {
    if (date < firstSelectableDate) return
    const dateKey = getDateKey(date)
    const mode = valueRef.current.includes(dateKey) ? 'remove' : 'add'
    dragModeRef.current = mode
    dragVisitedRef.current = new Set([dateKey])
    setIsDragging(true)
    applyDay(dateKey, mode)
  }

  function extendDrag(date: Date) {
    const mode = dragModeRef.current
    if (!mode || date < firstSelectableDate) return
    const dateKey = getDateKey(date)
    if (dragVisitedRef.current.has(dateKey)) return
    dragVisitedRef.current.add(dateKey)
    applyDay(dateKey, mode)
  }

  function resetDates() {
    onChange([])
  }

  function shiftMonth(diff: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + diff, 1))
  }

  const isPrevDisabled =
    month.getFullYear() === startMonth.getFullYear() &&
    month.getMonth() === startMonth.getMonth()

  function startItemDrag(item: string) {
    const mode = valueRef.current.includes(item) ? 'remove' : 'add'
    dragModeRef.current = mode
    dragVisitedRef.current = new Set([item])
    setIsDragging(true)
    applyDay(item, mode)
  }

  function extendItemDrag(item: string) {
    const mode = dragModeRef.current
    if (!mode) return
    if (dragVisitedRef.current.has(item)) return
    dragVisitedRef.current.add(item)
    applyDay(item, mode)
  }

  if (eventType === 2) {
    return (
      <div className={eventUi.field}>
        <div className="flex items-center justify-between">
          <div>
            <label className={eventUi.label}>
              Weekdays <span className={eventUi.requiredMark}>*</span>
            </label>
            <p className="hidden">Choose one or more weekdays for this event.</p>
          </div>
          <span className={eventUi.fieldHint}>{value.length} selected</span>
        </div>
        <div className={cn(eventUi.weekdayOptions, 'select-none')}>
          {WEEKDAY_OPTIONS.map((item) => (
            <Button
              className={cn(
                eventUi.weekdayOption,
                value.includes(item) && eventUi.weekdayOptionSelected,
              )}
              key={item}
              onMouseDown={() => startItemDrag(item)}
              onMouseEnter={() => isDragging && extendItemDrag(item)}
              type="button"
              variant="ghost"
            >
              {item}
            </Button>
          ))}
        </div>
        {error && <span className={eventUi.fieldError}>{error}</span>}
      </div>
    )
  }

  function DragDayButton({ onMouseDown, ...props }: DayButtonProps) {
    return (
      <DayButton
        {...props}
        onMouseDown={(event) => {
          onMouseDown?.(event)
          if (!props.modifiers.disabled) startDrag(props.day.date)
        }}
      />
    )
  }

  return (
    <div className={eventUi.field}>
      <div className="flex items-center justify-between">
        <label className={eventUi.label}>
          Date selection <span className={eventUi.requiredMark}>*</span>
        </label>
        <span className={eventUi.fieldHint}>{value.length} selected</span>
      </div>
      <div className={eventUi.calendar}>
        <div className={eventUi.calendarMonthCaption}>
          <button
            className={eventUi.calendarToolbarButton}
            disabled={isPrevDisabled}
            onClick={() => shiftMonth(-1)}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <span className={eventUi.calendarToolbarTitle}>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            className={eventUi.calendarToolbarButton}
            onClick={() => shiftMonth(1)}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <Calendar
          classNames={{
            root: eventUi.calendarRoot,
            months: eventUi.calendarMonths,
            month: eventUi.calendarMonth,
            month_caption: 'hidden',
            month_grid: eventUi.calendarGrid,
            weekday: eventUi.calendarWeekday,
            day: eventUi.calendarDay,
            day_button: eventUi.calendarDayButton,
            selected: eventUi.calendarDaySelected,
            outside: eventUi.calendarDayOutside,
            disabled: eventUi.calendarDayDisabled,
          }}
          components={{ DayButton: DragDayButton }}
          disabled={{ before: firstSelectableDate }}
          hideNavigation
          mode="multiple"
          month={month}
          onDayMouseEnter={(date) => isDragging && extendDrag(date)}
          onMonthChange={setMonth}
          onSelect={() => undefined}
          selected={selectedDates}
          showOutsideDays={false}
          weekStartsOn={1}
        />
        <button className={eventUi.calendarReset} onClick={resetDates} type="button">
          <RotateCcw size={13} /> Reset dates
        </button>
      </div>
      {error && <span className={eventUi.fieldError}>{error}</span>}
    </div>
  )
}