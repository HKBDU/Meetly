type TimezoneSelectProps = { value: string; onChange: (value: string) => void; disabled?: boolean }

export function TimezoneSelect({ value, onChange, disabled = true }: TimezoneSelectProps) {
  return <div className="form-field">
    <label htmlFor="event-timezone">Timezone</label>
    <select disabled={disabled} id="event-timezone" onChange={(event) => onChange(event.target.value)} value={value}>
      <option value="Asia/Ho_Chi_Minh">Vietnam (GMT+07:00)</option>
    </select>
    <span className="field-hint">Vietnam (GMT+07:00)</span>
  </div>
}
