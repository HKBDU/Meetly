import { Briefcase, Moon, Sun, Sunrise } from 'lucide-react'

import { cn } from '@/lib/utils'
import { minutesToTime, timeToMinutes } from '@/lib/date-time'
import { SLOT_MINUTES } from '@/shared/constants'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { HOUR_PRESETS } from '../schema'
import { dailyMinutes, describeDuration } from '../summary'
import { QuickChip } from './QuickChip'

/** 00:15 ... 23:45 theo bước 15 phút; không có mốc biên của ngày (BE dùng TimeOnly, không có "24:00") */
const TIME_OPTIONS = Array.from({ length: (24 * 60) / SLOT_MINUTES - 1 }, (_, index) =>
  minutesToTime((index + 1) * SLOT_MINUTES),
)

const PRESET_ICONS = [Briefcase, Sunrise, Sun, Moon]

const label12h = (time: string) => {
  const minutes = timeToMinutes(time)
  const hour = Math.floor(minutes / 60)
  return `${hour % 12 || 12}:${String(minutes % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`
}

interface HoursFieldProps {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  error?: string
}

/** Khung giờ mỗi ngày: chọn nhanh bằng chip hoặc chỉnh chi tiết bằng 2 dropdown */
export function HoursField({ start, end, onChange, error }: HoursFieldProps) {
  const minutes = dailyMinutes(start, end)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Quick time ranges">
        {HOUR_PRESETS.map((preset, index) => {
          const Icon = PRESET_ICONS[index]
          return (
            <QuickChip
              key={preset.label}
              active={start === preset.start && end === preset.end}
              onClick={() => onChange(preset.start, preset.end)}
              icon={<Icon className="size-4" aria-hidden="true" />}
            >
              {preset.label}
              {/* Màn hẹp ẩn giờ để 4 chip nằm gọn 2 dòng */}
              <span className={cn('hidden tabular-nums sm:inline', start === preset.start && end === preset.end ? 'opacity-70' : 'text-muted-foreground')}>
                {preset.start}–{preset.end}
              </span>
            </QuickChip>
          )
        })}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 sm:max-w-md">
        <TimeSelect id="daily-start" label="From" value={start} onChange={(next) => onChange(next, end)} />
        <span className="pb-3 text-muted-foreground" aria-hidden="true">
          –
        </span>
        <TimeSelect
          id="daily-end"
          label="To"
          value={end}
          onChange={(next) => onChange(start, next)}
          isDisabled={(time) => timeToMinutes(time) <= timeToMinutes(start)}
        />
      </div>

      {error ? (
        <FieldError>{error}</FieldError>
      ) : (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{describeDuration(minutes)}</span> each day, in 15-minute slots
        </p>
      )}
    </div>
  )
}

function TimeSelect({
  id,
  label,
  value,
  onChange,
  isDisabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  isDisabled?: (time: string) => boolean
}) {
  return (
    <div className="grid min-w-0 gap-1.5">
      <FieldLabel htmlFor={id} className="text-xs font-normal text-muted-foreground">
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full min-w-0 tabular-nums [&_.time-12h]:hidden">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64" position="popper">
          {TIME_OPTIONS.map((time) => (
            <SelectItem key={time} value={time} disabled={isDisabled?.(time)} className="tabular-nums">
              {time} <span className="time-12h text-muted-foreground">({label12h(time)})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
