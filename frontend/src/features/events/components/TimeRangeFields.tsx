import { generateTimeSlots } from '../utils/time.utils'

type TimeRangeFieldsProps = { start: string; end: string; onStartChange: (value: string) => void; onEndChange: (value: string) => void; error?: string }

export function TimeRangeFields({ start, end, onStartChange, onEndChange, error }: TimeRangeFieldsProps) {
  const options = generateTimeSlots()
  return <div className="time-range-field">
    <div className="form-field"><label htmlFor="daily-start-time">Start time</label><select id="daily-start-time" onChange={(event) => onStartChange(event.target.value)} value={start}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>
    <div className="form-field"><label htmlFor="daily-end-time">End time</label><select id="daily-end-time" onChange={(event) => onEndChange(event.target.value)} value={end}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>
    {error && <span className="field-error time-range-error">{error}</span>}
  </div>
}
