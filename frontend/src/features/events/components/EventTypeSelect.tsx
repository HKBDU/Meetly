import type { EventType } from '../types'

type EventTypeSelectProps = { value: EventType; onChange: (value: EventType) => void }

export function EventTypeSelect({ value, onChange }: EventTypeSelectProps) {
  return <div className="segmented-control event-type-control" role="tablist">
    <button className={value === 1 ? 'is-active' : ''} onClick={() => onChange(1)} role="tab" type="button">Dates</button>
    <button className={value === 2 ? 'is-active' : ''} onClick={() => onChange(2)} role="tab" type="button">Weekdays</button>
  </div>
}
