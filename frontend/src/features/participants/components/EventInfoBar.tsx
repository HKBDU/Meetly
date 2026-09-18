import { ArrowLeft } from "lucide-react"

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

  return (
    <div className="mb-6 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {config.eventName}
        </h1>

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
