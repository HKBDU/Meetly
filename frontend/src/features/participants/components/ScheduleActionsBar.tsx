import { useState } from 'react'
import { BellRing, CloudCheck, Loader2, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, ToggleGroup, ToggleGroupItem } from '@/shared/components/ui'
import { ManualRangeDialog } from '@/features/participants/components/ManualRangeDialog'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import type { PaintMode } from '@/features/participants/types'
import { useT } from '@/shared/i18n'

interface ScheduleActionsBarProps {
  grid: ScheduleGrid
  triggerAutoSave: () => void
  isSaving: boolean
  onManualRangeApplied: (columnKey: string) => void
}

const modeItemClass = cn(
  'h-8 rounded-full px-4 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground',
  'data-[state=on]:bg-card data-[state=on]:text-foreground data-[state=on]:shadow-soft',
)

/** Hàng điều khiển phía trên lưới: chọn thủ công, xoá hết, trạng thái lưu và chế độ Busy/Available */
export function ScheduleActionsBar({ grid, triggerAutoSave, isSaving, onManualRangeApplied }: ScheduleActionsBarProps) {
  const t = useT()
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setPaintMode = useParticipantStore((s) => s.setPaintMode)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)
  const hasEmailSubscribed = useParticipantStore((s) => s.hasEmailSubscribed)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const locked = grid.isLocked

  return (
    <>
      <div className="flex flex-col gap-3 px-3 pt-1 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={locked} onClick={() => setIsManualDialogOpen(true)}>
            <SlidersHorizontal />
            {t('actions.selectRange')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={locked}
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

        <div className="flex items-center justify-between gap-3">
          <ToggleGroup
            type="single"
            value={paintMode}
            disabled={locked}
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
                <Loader2 className="size-3.5 animate-spin" /> {t('common.saving')}
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
