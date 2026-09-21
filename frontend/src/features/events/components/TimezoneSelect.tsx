import { eventUi } from '../../../shared/components/ui/styles'
import type { TimezoneSelectProps } from '../types'

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
