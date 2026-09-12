import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { EventType } from '../types'
import { formatDateForDisplay, getDateKey, getMonthDays, isFutureDate } from '../utils/date.utils'

const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_SHORT = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

type AvailabilitySelectorProps = { eventType: EventType; value: string[]; onChange: (value: string[]) => void; error?: string }

export function AvailabilitySelector({ eventType, value, onChange, error }: AvailabilitySelectorProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [isDragging, setIsDragging] = useState(false)
  const today = useMemo(() => new Date(), [])
  const monthDays = useMemo(() => getMonthDays(visibleMonth), [visibleMonth])

  useEffect(() => {
    const stopDragging = () => setIsDragging(false)
    window.addEventListener('mouseup', stopDragging)
    return () => window.removeEventListener('mouseup', stopDragging)
  }, [])

  function toggle(item: string) {
    onChange(value.includes(item) ? value.filter((current) => current !== item) : [...value, item])
  }

  function selectDate(date: Date) {
    if (!isFutureDate(date)) return
    const key = getDateKey(date)
    const next = new Set(value)
    if (isDragging) {
      next.add(key)
    } else if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    onChange([...next].sort())
  }

  function startDateDrag(date: Date) {
    if (!isFutureDate(date)) return
    setIsDragging(true)
    const key = getDateKey(date)
    onChange(value.includes(key) ? value.filter((current) => current !== key) : [...value, key].sort())
  }

  function dragOverDate(date: Date) {
    if (isDragging && isFutureDate(date)) selectDate(date)
  }

  function resetDates() {
    onChange([])
  }

  function changeMonth(offset: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  if (eventType === 2) {
    return <div className="form-field availability-selector">
      <div className="availability-selector__heading"><div><label>Weekdays <span className="required-mark">*</span></label><p>Choose one or more weekdays for this event.</p></div><span>{value.length} selected</span></div>
      <div className="weekday-options">
        {WEEKDAY_OPTIONS.map((item) => <button className={'weekday-option' + (value.includes(item) ? ' is-selected' : '')} key={item} onClick={() => toggle(item)} type="button">{item}</button>)}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  }

  return <div className="form-field availability-selector">
    <div className="availability-selector__heading"><div><label>Date selection <span className="required-mark">*</span></label></div><span className="selection-help">Drag or click to select multiple dates</span></div>
    <div className="calendar" onMouseLeave={() => setIsDragging(false)}>
      <div className="calendar__toolbar">
        <button aria-label="Previous month" disabled={visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() <= today.getMonth()} onClick={() => changeMonth(-1)} type="button"><ChevronLeft size={16} /></button>
        <strong>{visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
        <button aria-label="Next month" onClick={() => changeMonth(1)} type="button"><ChevronRight size={16} /></button>
      </div>
      <div className="calendar__grid">
        {WEEKDAY_SHORT.map((day) => <span className="calendar__weekday" key={day}>{day}</span>)}
        {monthDays.map((date) => {
          const key = getDateKey(date)
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth()
          const isDisabled = !isCurrentMonth || !isFutureDate(date)
          return <button aria-label={formatDateForDisplay(key)} className={'calendar__day' + (value.includes(key) ? ' is-selected' : '') + (!isCurrentMonth ? ' is-outside' : '')} disabled={isDisabled} key={key} onMouseDown={() => startDateDrag(date)} onMouseEnter={() => dragOverDate(date)} onClick={(event) => event.preventDefault()} type="button">{date.getDate()}</button>
        })}
      </div>
      <button className="calendar__reset" onClick={resetDates} type="button"><RotateCcw size={13} /> Reset dates</button>
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
}
