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
 * Tên sự kiện (dòng lớn, cùng hàng với "Back to Overview") + khoảng ngày và
 * link chia sẻ (dòng nhỏ, meta - KHÔNG còn là 1 nút bo viền/nền riêng như bản
 * cũ, chỉ là text link cùng cỡ/màu với khoảng ngày để đỡ tranh chỗ với tiêu
 * đề). Không có border-bottom riêng (ranh giới với lưới bên dưới là viền của
 * chính khung lưới, không phải thêm 1 đường kẻ ngang nữa).
 *
 * KHÔNG đặt `bg-card` (trắng) - để lộ nền `bg-background` từ khối cha
 * (PersonalScheduleView), GIỐNG HỆT với ScheduleActionsBar/grid bên dưới -
 * feedback: tách 2 màu trắng/xám giữa tiêu đề và lưới nhìn còn xấu hơn, thôi
 * gộp lại 1 màu nền DUY NHẤT cho toàn bộ phần nội dung dưới header.
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
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-2 sm:px-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">{config.eventName}</h1>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{formatDateRangeLabel(config)}</span>
          <span aria-hidden className="text-border">
            •
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 transition-colors hover:text-primary"
          >
            <Link2 className="size-3 shrink-0" />
            <span className="max-w-35 truncate font-mono sm:max-w-none">{shareLink}</span>
            {copied ? (
              <Check className="size-3 shrink-0 text-primary" />
            ) : (
              <Copy className="size-3 shrink-0" />
            )}
          </button>
        </div>
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
