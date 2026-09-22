import { ArrowLeft, Lock } from "lucide-react"

import { monthDayFormatter, monthDayYearFormatter, weekdayShortFormatter } from "@/lib/date-format"
import { formatDateLabel } from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"
import type { EventScheduleConfig } from "@/features/participants/types"
import { Button } from "@/shared/components/ui"

interface EventInfoBarProps {
  config: EventScheduleConfig
}

/** "2026-09-09".."2026-09-11" -> "Wed, Sep 9 - Fri, Sep 11, 2026" (SPECIFIC_DATES) or "Monday - Friday" (DAYS_OF_WEEK) */
function formatDateRangeLabel(config: EventScheduleConfig): string {
  const dates = config.dates

  if (config.dateMode === "DAYS_OF_WEEK") {
    const first = formatDateLabel(dates[0]).weekday
    const last = formatDateLabel(dates[dates.length - 1]).weekday
    return dates.length === 1 ? first : `${first} - ${last}`
  }

  const firstDate = new Date(`${dates[0]}T00:00:00`)
  const lastDate = new Date(`${dates[dates.length - 1]}T00:00:00`)
  if (dates.length === 1) {
    return `${weekdayShortFormatter.format(firstDate)}, ${monthDayYearFormatter.format(firstDate)}`
  }
  return `${weekdayShortFormatter.format(firstDate)}, ${monthDayFormatter.format(firstDate)} - ${weekdayShortFormatter.format(lastDate)}, ${monthDayYearFormatter.format(lastDate)}`
}

/** Tên event, khoảng ngày và nút quay lại Overview */
export function EventInfoBar({ config }: EventInfoBarProps) {
  const setView = useParticipantStore((s) => s.setView)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const finalizedMessage = useParticipantStore((s) => s.finalizedMessage)

  return (
    <div className="flex flex-col gap-1 px-4 pt-4 pb-2 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">
            {config.eventName}
          </h1>
          {isFinalized && (
            <span
              title={finalizedMessage ?? "This event has been finalized. The schedule can no longer be edited."}
              className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-muted-foreground"
            >
              <Lock className="size-3" aria-hidden="true" />
              <span className="sm:hidden">Finalized</span>
              <span className="hidden sm:inline">Finalized - schedule is read-only</span>
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setView("OVERVIEW")}
          className="shrink-0 text-foreground hover:text-primary"
        >
          <ArrowLeft className="size-3.5 sm:size-4" />
          <span className="hidden sm:inline">Back to Overview</span>
          <span className="sm:hidden">Back</span>
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{formatDateRangeLabel(config)}</p>
    </div>
  )
}
