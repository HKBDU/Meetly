import { WEEKDAYS } from '@/shared/schedule'

export function WeekdayPicker({
  value,
  onChange,
}: {
  value: number[]
  onChange: (days: number[]) => void
}) {
  return (
    <fieldset>
      <legend>Ngày trong tuần</legend>
      <div className="weekday-grid">
        {WEEKDAYS.map((day, index) => (
          <button
            type="button"
            key={day}
            className={value.includes(index) ? 'day active' : 'day'}
            onClick={() =>
              onChange(
                value.includes(index)
                  ? value.filter((item) => item !== index)
                  : [...value, index].sort()
              )
            }
          >
            {day}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
