import { TimeSelector } from './TimeSelector'
import { eventUi } from '../../../shared/components/ui/styles'
import { cn } from '@/lib/utils'
import type { TimeRangeFieldsProps } from '../types'

export function TimeRangeFields({
  start,
  end,
  onStartChange,
  onEndChange,
  error,
}: TimeRangeFieldsProps) {
  return (
    <div className={eventUi.timeRange}>
      <div className={`${eventUi.field} col-span-2`}>
        <div className="flex items-center justify-between">
          <label className={eventUi.label}>Time range <span className={eventUi.requiredMark}>*</span></label>
          <span className="text-xs text-[#6c7a71]">15-minute steps</span>
        </div>
        <TimeSelector
          end={end}
          onEndChange={onEndChange}
          onStartChange={onStartChange}
          start={start}
        />
      </div>

      {error && <span className={cn(eventUi.fieldError, eventUi.timeRangeError)}>{error}</span>}
    </div>
  )
}
