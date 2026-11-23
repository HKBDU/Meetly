import { Link } from 'react-router-dom'
import { ArrowRight, Check, Share2 } from 'lucide-react'

import { EventType, WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import { formatDate } from '@/lib/date-time'
import { CopyButton } from '@/shared/components/CopyButton'
import { Button } from '@/shared/components/ui/button'
import { canNativeShare, eventShareUrl, inviteMessage, nativeShare } from '@/shared/lib/share'
import type { EventDetail } from '@/shared/types'
import { useEventOutlet } from './eventOutlet'

function describeEventDays(event: EventDetail): string {
  if (event.eventType === EventType.Weekdays) {
    return `Every ${WEEKDAYS_MONDAY_FIRST.filter((day) => event.availableWeekdays.includes(day.value))
      .map((day) => day.shortLabel)
      .join(', ')}`
  }
  const dates = [...event.availableDates].sort()
  if (dates.length <= 1) return dates.map(formatDate).join('')
  return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
}

/** Sau khi tạo event: đưa link lên làm trọng tâm và gợi ý bước tiếp theo. Mở lại được từ nút Invite. */
export function SharePage() {
  const { shortCode, auth, event } = useEventOutlet()
  const url = eventShareUrl(shortCode)
  const message = inviteMessage(event.title, url)
  const othersJoined = event.participants.filter((person) => person.username !== auth.username).length

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-10 pb-20 sm:pt-16">
      <div className="text-center">
        <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
          <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm text-muted-foreground">Your event is ready</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl">{event.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground tabular-nums">
          {describeEventDays(event)} · {event.dailyStartTime} – {event.dailyEndTime}
        </p>
      </div>

      <section aria-label="Invite link" className="mt-10 rounded-2xl border bg-card p-2 shadow-lift">
        <div className="flex items-center gap-2 rounded-xl bg-muted py-1.5 pr-1.5 pl-4">
          <input
            aria-label="Event link"
            readOnly
            value={url}
            onFocus={(focusEvent) => focusEvent.currentTarget.select()}
            className="min-w-0 flex-1 truncate bg-transparent text-sm outline-none"
          />
          <CopyButton value={url} successMessage="Link copied." label="Copy link" />
        </div>

        <figure className="px-4 pt-4 pb-3">
          <figcaption className="text-xs text-muted-foreground">Invite message</figcaption>
          <blockquote className="mt-1.5 border-l-2 pl-3 text-sm text-pretty break-words">{message}</blockquote>
        </figure>

        <div className="flex flex-wrap gap-2 px-2 pb-2">
          {canNativeShare() && (
            <Button type="button" variant="outline" size="sm" onClick={() => void nativeShare({ title: event.title, text: message, url })}>
              <Share2 aria-hidden="true" />
              Share…
            </Button>
          )}
          <CopyButton value={message} successMessage="Invite message copied." variant="outline" size="sm" label="Copy message" />
          <CopyButton value={shortCode} successMessage="Event code copied." variant="ghost" size="sm" label={`Code ${shortCode}`} />
        </div>
      </section>

      <nav aria-label="Next steps" className="mt-8 divide-y rounded-2xl border bg-card shadow-soft">
        <Link to="../me" relative="path" className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
          <span>
            <span className="block text-sm font-medium">Add your availability</span>
            <span className="block text-sm text-muted-foreground">Mark when you're free, like everyone else.</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <Link to=".." relative="path" className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
          <span>
            <span className="block text-sm font-medium">{othersJoined > 0 ? `See responses · ${othersJoined} joined` : 'Go to overview'}</span>
            <span className="block text-sm text-muted-foreground">Watch the heatmap fill in as people respond.</span>
          </span>
          <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </nav>

      {auth.isAdmin && (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Keep your host password safe. You'll need it to edit or finalize this event.
        </p>
      )}
    </div>
  )
}
