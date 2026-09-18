import { eventUi } from '../../../shared/components/ui/styles'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import type { EventTypeSelectProps } from '../types'

export function EventTypeSelect({ value, onChange }: EventTypeSelectProps) {
  return (
    <div className={eventUi.typeControl} role="tablist">
      <Button
        className={cn(eventUi.typeControlButton, value === 1 && eventUi.typeControlButtonActive)}
        onClick={() => onChange(1)}
        role="tab"
        type="button"
        variant="ghost"
      >
        Dates and times
      </Button>
      <Button
        className={cn(eventUi.typeControlButton, value === 2 && eventUi.typeControlButtonActive)}
        onClick={() => onChange(2)}
        role="tab"
        type="button"
        variant="ghost"
      >
        Weekdays
      </Button>
    </div>
  )
}

