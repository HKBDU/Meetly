import { CalendarPlus, UserPlus } from 'lucide-react'

import { CopyButton } from '@/shared/components/CopyButton'
import { Button } from '@/shared/components/ui/button'
import { eventShareUrl } from '@/shared/lib/share'
import { useT } from '@/shared/i18n'
import type { EventDetail } from '@/shared/types'

interface GettingStartedBannerProps {
  event: EventDetail
  currentUsername?: string
  onInvite?: () => void
  onOpenMySchedule?: () => void
}

/** Thay cho heatmap trống: nói rõ bước tiếp theo (mời người, tự điền lịch) */
export function GettingStartedBanner({ event, currentUsername, onInvite, onOpenMySchedule }: GettingStartedBannerProps) {
  const t = useT()
  const othersJoined = event.participants.filter((person) => person.username !== currentUsername).length
  const hasMyAvailability =
    !currentUsername || event.heatmapGrid.some((cell) => cell.participants.includes(currentUsername))

  if (othersJoined > 0 && hasMyAvailability) return null

  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2" role="status">
      {othersJoined === 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <UserPlus className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t('start.noOne')}</p>
              <p className="text-sm text-muted-foreground">{t('start.shareText')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {onInvite && (
              <Button type="button" size="sm" onClick={onInvite}>
                {t('start.invite')}
              </Button>
            )}
            <CopyButton value={eventShareUrl(event.shortCode)} successMessage={t('common.eventLinkCopied')} size="sm" variant="outline" label={t('common.copyLink')} />
          </div>
        </div>
      )}
      {!hasMyAvailability && (
        <div className="flex flex-col gap-3 rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <CalendarPlus className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t('share.addAvailability')}</p>
              <p className="text-sm text-muted-foreground">{t('start.noTime')}</p>
            </div>
          </div>
          {onOpenMySchedule && (
            <Button type="button" size="sm" variant="outline" className="self-start" onClick={onOpenMySchedule}>
              {t('start.addMine')}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
