type EventTitleFieldProps = { value: string; onChange: (value: string) => void; error?: string }

export function EventTitleField({ value, onChange, error }: EventTitleFieldProps) {
  return <div className="form-field">
    <label htmlFor="event-title">Event name</label>
    <input aria-invalid={Boolean(error)} id="event-title" onChange={(event) => onChange(event.target.value)} value={value} />
    {error && <span className="field-error">{error}</span>}
  </div>
}
