import { TimeSelector } from './TimeSelector'
import { eventUi } from './styles'
import { cn } from '@/lib/utils'

interface TimeRangeFieldsProps {
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  error?: string
}

export function TimeRangeFields({
  start,
  end,
  onStartChange,
  onEndChange,
  error,
}: TimeRangeFieldsProps) {
  return (
    <div className={eventUi.timeRange}>
      <div className={eventUi.field}>
        <label className={eventUi.label} htmlFor="daily-start-time">
          Start time <span className={eventUi.requiredMark}>*</span>
        </label>
        <TimeSelector id="daily-start-time" onChange={onStartChange} value={start} />
      </div>

      <div className={eventUi.field}>
        <label className={eventUi.label} htmlFor="daily-end-time">
          End time <span className={eventUi.requiredMark}>*</span>
        </label>
        <TimeSelector id="daily-end-time" onChange={onEndChange} value={end} />
      </div>

      {error && <span className={cn(eventUi.fieldError, eventUi.timeRangeError)}>{error}</span>}
    </div>
  )
}

