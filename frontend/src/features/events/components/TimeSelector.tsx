
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { generateTimeSlots } from '../utils/time.utils'
import { eventUi } from '../../../shared/components/ui/styles'

interface TimePickerSelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
}

export function TimeSelector({
  value,
  onChange,
  id,
  placeholder = 'Select time',
}: TimePickerSelectProps) {
  const hours = generateTimeSlots('00:00', '23:00', 60)
  return (
    <div className="w-full">
      <Select onValueChange={onChange} value={value ? value : '08:00'}>
        <SelectTrigger className={eventUi.timeSelectTrigger} id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={eventUi.timeSelectContent}
          position="popper"
          sideOffset={4}
        >
          {hours.map((h) => (
            <SelectItem className={eventUi.timeSelectItem} key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

