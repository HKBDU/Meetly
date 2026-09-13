import { useState } from "react"
import { ArrowLeft, Check, Copy, Link2 } from "lucide-react"
import { toast } from "sonner"

import { formatDateLabel } from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"
import type { EventScheduleConfig } from "@/features/participants/types"

interface EventInfoBarProps {
  config: EventScheduleConfig
}

const weekdayShortFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" })
const monthDayFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })
const monthDayYearFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

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

/**
 * Tên sự kiện + khoảng ngày + link chia sẻ (copy) + nút quay lại Tổng quan -
 * TẤT CẢ trên CÙNG 1 hàng, không có border-bottom riêng (theo đúng ảnh mẫu:
 * chỉ 1 đường kẻ duy nhất ngay dưới header "Meetly/Join with ID" - phần này
 * chỉ cách nhau bằng khoảng trắng, ranh giới với lưới bên dưới là viền của
 * chính khung lưới, không phải thêm 1 đường kẻ ngang nữa).
 *
 * Link chia sẻ hiện là MOCK (chưa có route/shortCode thật - xem
 * `EventScheduleConfig.eventId` comment) - chỉ demo hành vi copy-to-clipboard.
 */
export function EventInfoBar({ config }: EventInfoBarProps) {
  const setView = useParticipantStore((s) => s.setView)
  const [copied, setCopied] = useState(false)
  const shareLink = `meetly.app/e/${config.eventId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`https://${shareLink}`)
      setCopied(true)
      toast.success("Link copied")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy - clipboard permission blocked")
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-card px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">{config.eventName}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatDateRangeLabel(config)}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-md border border-input bg-muted/60 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent"
        >
          <Link2 className="size-3.5 shrink-0" />
          <span className="max-w-35 truncate font-mono sm:max-w-none">{shareLink}</span>
          <span className="flex shrink-0 items-center gap-1 font-medium text-foreground">
            {copied ? (
              <>
                <Check className="size-3.5 text-primary" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Copy
              </>
            )}
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setView("OVERVIEW")}
        className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" />
        Back to Overview
      </button>
    </div>
  )
}
