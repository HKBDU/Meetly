import { Clock3 } from 'lucide-react'
import { clock } from '@/shared/schedule'
import { CustomSelect } from './ui/select'

const DAY_TIMES_15 = Array.from({ length: 96 }, (_, i) => clock(i * 15))
const TIME_OPTIONS = DAY_TIMES_15.map((t) => ({ value: t, label: t }))

export function TimeSelect({
  value,
  onChange,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}) {
  return (
    <div className={`time-select-custom-wrapper ${className}`}>
      <CustomSelect
        value={value}
        onChange={onChange}
        options={TIME_OPTIONS}
        icon={<Clock3 size={15} />}
        className="time-select-custom"
        triggerClassName="time-select-trigger"
        menuClassName="time-select-menu"
        aria-label="Chọn giờ"
      />
    </div>
  )
}
