import { minutesToTime, timeToMinutes } from '@/lib/date-time'
import { SLOT_MINUTES } from '@/shared/constants'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Slider } from '@/shared/components/ui/slider'

/** Mốc 00:00 ... 23:45: BE dùng TimeOnly nên không có "24:00" */
const LAST_STEP = (24 * 60) / SLOT_MINUTES - 1

const toStep = (time: string, fallback: number) => {
  const minutes = timeToMinutes(time)
  return Number.isFinite(minutes) ? Math.min(LAST_STEP, Math.round(minutes / SLOT_MINUTES)) : fallback
}

interface TimeRangeFieldProps {
  start: string
  end: string
  onChange: (start: string, end: string) => void
  error?: string
}

export function TimeRangeField({ start, end, onChange, error }: TimeRangeFieldProps) {
  const startStep = toStep(start, 36)
  const endStep = toStep(end, 68)

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <FieldLabel>
          Time range <span className="text-destructive">*</span>
        </FieldLabel>
        <span className="text-xs text-muted-foreground">{SLOT_MINUTES}-minute steps</span>
      </div>
      <div className="px-1 pt-1">
        <div className="mb-3 flex items-center justify-between text-sm font-medium tabular-nums">
          <span>{minutesToTime(startStep * SLOT_MINUTES)}</span>
          <span>{minutesToTime(endStep * SLOT_MINUTES)}</span>
        </div>
        <Slider
          aria-label="Daily time range"
          min={0}
          max={LAST_STEP}
          step={1}
          minStepsBetweenThumbs={1}
          value={[startStep, endStep]}
          onValueChange={([nextStart, nextEnd]) =>
            onChange(minutesToTime(nextStart * SLOT_MINUTES), minutesToTime(nextEnd * SLOT_MINUTES))
          }
        />
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
