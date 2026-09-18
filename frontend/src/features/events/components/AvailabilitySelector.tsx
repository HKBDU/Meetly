import { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { DayButton, type DayButtonProps } from 'react-day-picker'
import { eventUi } from '../../../shared/components/ui/styles'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar } from '@/shared/components/ui/calendar'
import { WEEKDAY_OPTIONS } from '../types'
import type { AvailabilitySelectorProps } from '../types'
import { getDateKey } from '../utils/date.utils'

const getCurrentTime = () => Date.now()

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

  const touchStartPosRef = useRef<{ x: number; y: number; key: string; isCalendar: boolean } | null>(null)
  const gestureDirectionRef = useRef<'horizontal' | 'vertical' | null>(null)
  const lastTouchTimeRef = useRef<number>(0)

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

  const applyDay = useCallback((dateKey: string, mode: 'add' | 'remove') => {
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
  }, [onChange])

  function extendDragByKey(key: string) {
    const mode = dragModeRef.current
    if (!mode) return
    if (dragVisitedRef.current.has(key)) return
    dragVisitedRef.current.add(key)
    applyDay(key, mode)
  }

  useEffect(() => {
    function finishMouseDrag() {
      dragModeRef.current = null
      dragVisitedRef.current = new Set()
      setIsDragging(false)
    }

    function handleWindowTouchEnd() {
      const start = touchStartPosRef.current
      if (start && gestureDirectionRef.current === null) {
        const mode = valueRef.current.includes(start.key) ? 'remove' : 'add'
        applyDay(start.key, mode)
      }

      touchStartPosRef.current = null
      gestureDirectionRef.current = null
      dragModeRef.current = null
      dragVisitedRef.current = new Set()
      setIsDragging(false)
    }

    window.addEventListener('mouseup', finishMouseDrag)
    window.addEventListener('touchend', handleWindowTouchEnd)
    return () => {
      window.removeEventListener('mouseup', finishMouseDrag)
      window.removeEventListener('touchend', handleWindowTouchEnd)
    }
  }, [applyDay])

  function handleMouseDown(key: string, dateObj: Date | null) {
    if (getCurrentTime() - lastTouchTimeRef.current < 500) return
    if (dateObj && dateObj < firstSelectableDate) return
    const mode = valueRef.current.includes(key) ? 'remove' : 'add'
    dragModeRef.current = mode
    dragVisitedRef.current = new Set([key])
    setIsDragging(true)
    applyDay(key, mode)
  }

  function handleMouseEnter(key: string, dateObj: Date | null) {
    if (getCurrentTime() - lastTouchTimeRef.current < 500) return
    if (!dragModeRef.current) return
    if (dateObj && dateObj < firstSelectableDate) return
    extendDragByKey(key)
  }

  function handleTouchStart(key: string, dateObj: Date | null, e: React.TouchEvent, isCalendar: boolean) {
    if (dateObj && dateObj < firstSelectableDate) return
    const touch = e.touches[0]
    if (!touch) return

    lastTouchTimeRef.current = getCurrentTime()
    touchStartPosRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      key,
      isCalendar,
    }
    gestureDirectionRef.current = null
  }

  function handleTouchMove(e: React.TouchEvent) {
    const start = touchStartPosRef.current
    if (!start) return

    const touch = e.touches[0]
    if (!touch) return

    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (gestureDirectionRef.current === null) {
      if (absDx > 6 || absDy > 6) {
        if (absDx > absDy * 1.2) {
          gestureDirectionRef.current = 'horizontal'
          setIsDragging(true)
          const mode = valueRef.current.includes(start.key) ? 'remove' : 'add'
          dragModeRef.current = mode
          dragVisitedRef.current = new Set([start.key])
          applyDay(start.key, mode)
        } else {
          gestureDirectionRef.current = 'vertical'
        }
      }
    }

    if (gestureDirectionRef.current === 'horizontal') {
      if (e.cancelable) {
        e.preventDefault()
      }
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const attrName = start.isCalendar ? 'data-date' : 'data-weekday'
      const targetEl = el?.closest(`[${attrName}]`)
      if (targetEl) {
        const key = targetEl.getAttribute(attrName)
        if (key) {
          if (start.isCalendar) {
            const dateObj = new Date(`${key}T00:00:00`)
            if (dateObj >= firstSelectableDate) {
              extendDragByKey(key)
            }
          } else {
            extendDragByKey(key)
          }
        }
      }
    }
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
        <div
          className={cn(eventUi.weekdayOptions, 'select-none touch-pan-y')}
          onTouchMove={handleTouchMove}
        >
          {WEEKDAY_OPTIONS.map((item) => (
            <Button
              className={cn(
                eventUi.weekdayOption,
                value.includes(item) && eventUi.weekdayOptionSelected,
              )}
              data-weekday={item}
              key={item}
              onMouseDown={() => handleMouseDown(item, null)}
              onMouseEnter={() => isDragging && extendDragByKey(item)}
              onTouchStart={(e) => handleTouchStart(item, null, e, false)}
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
    const dateKey = getDateKey(props.day.date)
    const isDisabled = props.modifiers.disabled || props.day.date < firstSelectableDate

    return (
      <DayButton
        {...props}
        data-date={dateKey}
        onMouseDown={(event) => {
          onMouseDown?.(event)
          if (!isDisabled) handleMouseDown(dateKey, props.day.date)
        }}
        onMouseEnter={() => {
          if (!isDisabled) handleMouseEnter(dateKey, props.day.date)
        }}
        onTouchStart={(e) => {
          if (!isDisabled) handleTouchStart(dateKey, props.day.date, e, true)
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
          <Button
            className={eventUi.calendarToolbarButton}
            disabled={isPrevDisabled}
            onClick={() => shiftMonth(-1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className={eventUi.calendarToolbarTitle}>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            className={eventUi.calendarToolbarButton}
            onClick={() => shiftMonth(1)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        <div className="touch-pan-y select-none" onTouchMove={handleTouchMove}>
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
            onDayMouseEnter={(date) => isDragging && extendDragByKey(getDateKey(date))}
            onMonthChange={setMonth}
            onSelect={() => undefined}
            selected={selectedDates}
            showOutsideDays={false}
            weekStartsOn={1}
          />
        </div>
        <Button className={eventUi.calendarReset} onClick={resetDates} type="button" variant="ghost">
          <RotateCcw size={13} /> Reset dates
        </Button>
      </div>
      {error && <span className={eventUi.fieldError}>{error}</span>}
    </div>
  )
}
