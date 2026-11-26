import { useEffect } from 'react'
import { CalendarCheck } from 'lucide-react'

import { Button } from '@/shared/components/ui'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import { useT } from '@/shared/i18n'

interface BusyImportDraftBarProps {
  grid: ScheduleGrid
  triggerAutoSave: () => void
}

/**
 * Thanh xác nhận bản nháp nhập từ Google Calendar: người dùng xem và sửa trên lưới,
 * bấm Áp dụng mới lưu. Không có bản nháp thì không hiện gì.
 */
export function BusyImportDraftBar({ grid, triggerAutoSave }: BusyImportDraftBarProps) {
  const t = useT()
  const draftFreeCount = useParticipantStore((s) => s.draftFreeSlotIds?.size ?? null)
  const applyDraft = useParticipantStore((s) => s.applyDraft)
  const discardDraft = useParticipantStore((s) => s.discardDraft)
  const hasDraft = draftFreeCount !== null

  // Event bị chốt trong lúc đang xem bản nháp thì lịch đã khoá, bản nháp không còn ý nghĩa
  useEffect(() => {
    if (hasDraft && grid.isLocked) discardDraft()
  }, [hasDraft, grid.isLocked, discardDraft])

  if (!hasDraft || grid.isLocked) return null

  return (
    <div
      role="region"
      aria-label={t('import.draftTitle')}
      className="mx-3 mb-1 flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand-soft px-3 py-2.5 sm:mx-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-2">
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{t('import.draftTitle')}</p>
          <p className="text-xs text-muted-foreground">
            {t('import.draftSummary', { free: draftFreeCount, busy: grid.allSlotIds.length - draftFreeCount })}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2 self-end sm:self-auto">
        <Button variant="ghost" size="sm" onClick={discardDraft}>
          {t('import.discard')}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            applyDraft()
            triggerAutoSave()
          }}
        >
          {t('import.apply')}
        </Button>
      </div>
    </div>
  )
}
