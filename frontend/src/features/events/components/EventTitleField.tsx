import { eventUi } from '../../../shared/components/ui/styles'
import type { EventTitleFieldProps } from '../types'

export function EventTitleField({ value, onChange, error }: EventTitleFieldProps) {
  return (
    <div className={eventUi.field}>
      <label className={eventUi.label} htmlFor="event-title">
        Event name <span className={eventUi.requiredMark}>*</span>
      </label>
      <input
        aria-invalid={Boolean(error)}
        className={eventUi.input}
        id="event-title"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error && <span className={eventUi.fieldError}>{error}</span>}
    </div>
  )
}
