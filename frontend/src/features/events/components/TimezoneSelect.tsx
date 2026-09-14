import { eventUi } from './styles'

type TimezoneSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function TimezoneSelect({ value, onChange, disabled = true }: TimezoneSelectProps) {
  return (
    <div className={eventUi.field}>
      <label className={eventUi.label} htmlFor="event-timezone">
        Timezone
      </label>
      <select
        className={eventUi.input}
        disabled={disabled}
        id="event-timezone"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+07:00)</option>
      </select>
      <span className={eventUi.fieldHint}>Vietnam (GMT+07:00)</span>
    </div>
  )
}

