import { useEffect } from 'react'
import { CalendarCheck } from 'lucide-react'

import { Button } from '@/shared/components/ui'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import { useT } from '@/shared/i18n'

/**
 * Bản nháp nhập từ Google Calendar gồm 2 phần: dòng thông báo nhỏ phía trên lưới và cụm nút
 * Huỷ / Áp dụng dính ở giữa đáy màn hình. Người dùng xem, sửa trên lưới rồi bấm Áp dụng mới lưu.
 * Không có bản nháp (hoặc lịch đã khoá) thì cả hai không hiện gì.
 */

const useActiveDraft = (grid: ScheduleGrid) =>
  useParticipantStore((s) => s.draftFreeSlotIds !== null) && !grid.isLocked

/** Dòng thông báo phía trên lưới */
export function BusyImportDraftNotice({ grid }: { grid: ScheduleGrid }) {
  const t = useT()
  if (!useActiveDraft(grid)) return null

  return (
    <p role="status" className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 px-3 pb-1 text-xs sm:px-4">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 font-medium text-brand">
        <CalendarCheck className="size-3.5" aria-hidden="true" />
        {t('import.draftTitle')}
      </span>
      <span className="text-muted-foreground">{t('import.draftHint')}</span>
    </p>
  )
}

interface BusyImportDraftActionsProps {
  grid: ScheduleGrid
  triggerAutoSave: () => void
}

/**
 * Cụm nút dính đáy màn hình. Đặt ngay sau lưới: khi cuộn qua lưới thì dính ở đáy,
 * hết lưới thì nằm yên dưới lưới (sticky, không che footer).
 */
export function BusyImportDraftActions({ grid, triggerAutoSave }: BusyImportDraftActionsProps) {
  const t = useT()
  const hasDraft = useParticipantStore((s) => s.draftFreeSlotIds !== null)
  const applyDraft = useParticipantStore((s) => s.applyDraft)
  const discardDraft = useParticipantStore((s) => s.discardDraft)

  // Event bị chốt trong lúc đang xem bản nháp thì lịch đã khoá, bản nháp không còn ý nghĩa
  useEffect(() => {
    if (hasDraft && grid.isLocked) discardDraft()
  }, [hasDraft, grid.isLocked, discardDraft])

  if (!hasDraft || grid.isLocked) return null

  return (
    <div className="pointer-events-none sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 flex justify-center px-3 pb-4">
      <div
        role="toolbar"
        aria-label={t('import.draftTitle')}
        className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur"
      >
        <Button variant="ghost" size="sm" className="rounded-full px-4" onClick={discardDraft}>
          {t('import.discard')}
        </Button>
        <Button
          size="sm"
          className="rounded-full px-5"
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
