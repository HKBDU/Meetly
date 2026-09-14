import { eventUi } from './styles'

type EventTitleFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
}

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

