import { useLayoutEffect, useRef, useState } from 'react'
import { BellRing, CalendarArrowDown, CloudCheck, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, ToggleGroup, ToggleGroupItem } from '@/shared/components/ui'
import { ManualRangeDialog } from '@/features/participants/components/ManualRangeDialog'
import { MeetingRoomAction } from '@/features/heatmap/components/MeetingRoomAction'
import { normalizeMeetingLink } from '@/features/heatmap/meetingLink'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import type { PaintMode } from '@/features/participants/types'
import { MeetlyLoader } from '@/shared/components/MeetlyLoader'
import { useT } from '@/shared/i18n'

interface ScheduleActionsBarProps {
  grid: ScheduleGrid
  meetingUrl: string | null
  triggerAutoSave: () => void
  isSaving: boolean
  onManualRangeApplied: (columnKey: string, startTime?: string) => void
  /** Nhập giờ bận từ Google Calendar; `canImport = false` thì ẩn nút */
  googleImport: { canImport: boolean; isImporting: boolean; importFromGoogle: () => void; prepareImport: () => void }
}

const modeItemClass = cn(
  'h-8 rounded-full px-4 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground',
  'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-soft',
)

/** Hàng điều khiển phía trên lưới: chọn thủ công, xoá hết, trạng thái lưu và chế độ Busy/Available */
export function ScheduleActionsBar({
  grid,
  meetingUrl,
  triggerAutoSave,
  isSaving,
  onManualRangeApplied,
  googleImport,
}: ScheduleActionsBarProps) {
  const t = useT()
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setPaintMode = useParticipantStore((s) => s.setPaintMode)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)
  const hasEmailSubscribed = useParticipantStore((s) => s.hasEmailSubscribed)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  const hasDraft = useParticipantStore((s) => s.draftFreeSlotIds !== null)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const rangeButtonRef = useRef<HTMLButtonElement>(null)
  const clearButtonRef = useRef<HTMLButtonElement>(null)
  const [actionPairWidth, setActionPairWidth] = useState<number>()
  const locked = grid.isLocked
  const validMeetingUrl = normalizeMeetingLink(meetingUrl ?? '').url

  useLayoutEffect(() => {
    const range = rangeButtonRef.current
    const clear = clearButtonRef.current
    if (!range || !clear) return
    const update = () => {
      const gap = Number.parseFloat(getComputedStyle(range.parentElement!).columnGap) || 8
      setActionPairWidth(range.getBoundingClientRect().width + clear.getBoundingClientRect().width + gap)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(range)
    observer.observe(clear)
    return () => observer.disconnect()
  }, [])
  // Đang xem bản nháp từ Google Calendar thì chỉ sửa bằng cách kéo trên lưới, xong mới Áp dụng / Huỷ
  const editLocked = locked || hasDraft

  return (
    <>
      <div className="flex flex-col gap-3 px-3 pt-1 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-col items-start gap-2">
          {validMeetingUrl && (
            <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <span className="shrink-0 text-xs font-medium text-foreground">Meeting room:</span>
              <MeetingRoomAction
                meetingUrl={validMeetingUrl}
                mode="open"
                className="max-w-[calc(100vw-2rem)]"
                style={{ width: actionPairWidth }}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button ref={rangeButtonRef} variant="outline" size="sm" disabled={editLocked} onClick={() => setIsManualDialogOpen(true)}>
              <SlidersHorizontal />
              {t('actions.selectRange')}
            </Button>
            {googleImport.canImport && (
              <Button
                variant="outline"
                size="sm"
                disabled={editLocked || googleImport.isImporting}
                onClick={googleImport.importFromGoogle}
                onPointerEnter={googleImport.prepareImport}
                onFocus={googleImport.prepareImport}
                aria-label={t('import.button')}
                title={t('import.button')}
              >
                {googleImport.isImporting ? <MeetlyLoader size="xs" decorative /> : <CalendarArrowDown />}
                {/* Mobile chật: chỉ hiện icon, tên nút nằm ở aria-label */}
                <span className="hidden sm:inline">{t('import.button')}</span>
              </Button>
            )}
            <Button
              ref={clearButtonRef}
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              disabled={editLocked}
              onClick={() => {
                clearAllPainted()
                triggerAutoSave()
              }}
            >
              {t('actions.clearAll')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto text-muted-foreground sm:ml-0"
              onClick={openEmailDialog}
              aria-label={hasEmailSubscribed ? t('actions.emailOn') : t('actions.emailOff')}
              title={hasEmailSubscribed ? t('actions.emailOn') : t('actions.emailOff')}
            >
              {hasEmailSubscribed ? <BellRing className="text-brand" /> : <BellRing />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={paintMode}
            disabled={editLocked}
            aria-label={t('actions.paintMode')}
            className="rounded-full bg-muted p-1"
            // Đổi chế độ giữ nguyên lịch (lấy phần bù), nên không cần lưu lại
            onValueChange={(value) => value && setPaintMode(value as PaintMode, grid.allSlotIds)}
          >
            <ToggleGroupItem value="FREE" aria-label={t('actions.paintFree')} className={modeItemClass}>
              {t('common.available')}
            </ToggleGroupItem>
            <ToggleGroupItem value="BUSY" aria-label={t('actions.paintBusy')} className={modeItemClass}>
              {t('actions.busy')}
            </ToggleGroupItem>
          </ToggleGroup>

          <span role="status" className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            {isSaving ? (
              <>
                <MeetlyLoader size="xs" decorative /> {t('common.saving')}
              </>
            ) : (
              <>
                <CloudCheck className="size-3.5 text-brand" /> {t('actions.saved')}
              </>
            )}
          </span>
        </div>
      </div>

      <ManualRangeDialog
        grid={grid}
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        triggerAutoSave={triggerAutoSave}
        onRangeApplied={onManualRangeApplied}
      />
    </>
  )
}
