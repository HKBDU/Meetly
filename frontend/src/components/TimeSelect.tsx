import { Clock3 } from 'lucide-react'
import { clock } from '@/shared/schedule'

const DAY_TIMES_15 = Array.from({ length: 96 }, (_, i) => clock(i * 15))

export function TimeSelect({
  value,
  onChange,
  required,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}) {
  return (
    <div className={`time-select-wrap ${className}`}>
      <Clock3 size={15} className="time-select-icon" />
      <select
        required={required}
        className="time-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {DAY_TIMES_15.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  )
}
