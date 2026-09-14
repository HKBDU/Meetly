import type { EventType } from '../types'
import { eventUi } from './styles'
import { cn } from '@/lib/utils'

type EventTypeSelectProps = { value: EventType; onChange: (value: EventType) => void }

export function EventTypeSelect({ value, onChange }: EventTypeSelectProps) {
  return <div className={eventUi.typeControl} role="tablist">
    <button className={cn(eventUi.typeControlButton, value === 1 && eventUi.typeControlButtonActive)} onClick={() => onChange(1)} role="tab" type="button">Dates and times</button>
    <button className={cn(eventUi.typeControlButton, value === 2 && eventUi.typeControlButtonActive)} onClick={() => onChange(2)} role="tab" type="button">Weekdays</button>
  </div>
}
