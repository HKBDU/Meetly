import { normalizeMeetingLink } from '../meetingLink'

/** Shared read-only line for participants and the finalized schedule popover. */
export function MeetingRoomLine({ meetingUrl }: { meetingUrl: string | null }) {
  if (!meetingUrl) return null
  const result = normalizeMeetingLink(meetingUrl)
  if (!result.url) return null

  return (
    <p className="min-w-0 text-sm">
      <span className="font-medium text-foreground">Meeting room: </span>
      <a
        href={result.url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-brand underline underline-offset-2 hover:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {result.url}
      </a>
    </p>
  )
}
