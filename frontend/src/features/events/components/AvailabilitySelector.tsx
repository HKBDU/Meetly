import type { EventType } from '../types'
import { generateDateRange, isFutureDate } from '../utils/date.utils'

const WEEKDAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

type AvailabilitySelectorProps = { eventType: EventType; value: string[]; onChange: (value: string[]) => void; error?: string }

export function AvailabilitySelector({ eventType, value, onChange, error }: AvailabilitySelectorProps) {
  const dates = generateDateRange(new Date(), 14).filter(isFutureDate)
  function toggle(item: string) {
    onChange(value.includes(item) ? value.filter((current) => current !== item) : [...value, item])
  }
  return <div className="form-field availability-selector">
    <div className="availability-selector__heading"><div><label>{eventType === 1 ? 'Available dates' : 'Available weekdays'}</label><p>{eventType === 1 ? 'Choose one or more future dates.' : 'Choose the weekdays that repeat for this event.'}</p></div><span>{value.length} selected</span></div>
    <div className="availability-options">
      {(eventType === 1 ? dates : WEEKDAY_OPTIONS).map((item) => <label className={'availability-option' + (value.includes(item) ? ' is-selected' : '')} key={item}><input checked={value.includes(item)} onChange={() => toggle(item)} type="checkbox" /><span>{item}</span></label>)}
    </div>
    {error && <span className="field-error">{error}</span>}
  </div>
}
