
import { Slider } from '@/shared/components/ui/slider'
import type { TimeRangeSliderProps } from '../types'
import { TIME_BOUNDARIES, timeToBoundaryIndex } from '../utils/time.utils'

export function TimeSelector({
  start,
  end,
  onStartChange,
  onEndChange,
}: TimeRangeSliderProps) {
  const startIndex = timeToBoundaryIndex(start, timeToBoundaryIndex('08:00', 32))
  const endIndex = timeToBoundaryIndex(end, timeToBoundaryIndex('17:00', 68))

  return (
    <div className="w-full px-1 pt-1">
      <div className="mb-3 flex items-center justify-between text-sm font-medium text-[#0b1c30]">
        <span>{TIME_BOUNDARIES[startIndex]}</span>
        <span>{TIME_BOUNDARIES[endIndex]}</span>
      </div>
      <Slider
        aria-label="Select time range"
        minStepsBetweenThumbs={1}
        className="h-5"
        max={TIME_BOUNDARIES.length - 1}
        min={0}
        step={1}
        value={[startIndex, endIndex]}
        onValueChange={(value) => {
          const [nextStart, nextEnd] = value
          onStartChange(TIME_BOUNDARIES[nextStart])
          onEndChange(TIME_BOUNDARIES[nextEnd])
        }}
      />
    </div>
  )
}
