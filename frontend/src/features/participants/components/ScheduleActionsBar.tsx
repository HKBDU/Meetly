import { useState } from 'react'
import { BellRing, CloudCheck, Loader2, SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button, ToggleGroup, ToggleGroupItem } from '@/shared/components/ui'
import { ManualRangeDialog } from '@/features/participants/components/ManualRangeDialog'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import type { PaintMode } from '@/features/participants/types'

interface ScheduleActionsBarProps {
  grid: ScheduleGrid
  triggerAutoSave: () => void
  isSaving: boolean
  onManualRangeApplied: (columnKey: string) => void
}

const modeItemClass = cn(
  'h-8 w-24 border-2 text-xs sm:h-9',
  'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
)

/** Hàng điều khiển phía trên lưới: chọn thủ công, xoá hết, trạng thái lưu và chế độ Busy/Available */
export function ScheduleActionsBar({ grid, triggerAutoSave, isSaving, onManualRangeApplied }: ScheduleActionsBarProps) {
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setPaintMode = useParticipantStore((s) => s.setPaintMode)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)
  const hasEmailSubscribed = useParticipantStore((s) => s.hasEmailSubscribed)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const locked = grid.isLocked

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-1 pb-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={locked} onClick={() => setIsManualDialogOpen(true)}>
            <SlidersHorizontal />
            Select Manual
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
            Reset dates
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={openEmailDialog}
            aria-label={hasEmailSubscribed ? 'Notifications on' : 'Notify me by email'}
          >
            <BellRing />
            <span className="hidden sm:inline">{hasEmailSubscribed ? 'Notifications on' : 'Notify me by email'}</span>
          </Button>

          <span
            role="status"
            className={cn('flex shrink-0 items-center gap-1 text-xs font-medium', isSaving && 'text-muted-foreground')}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <CloudCheck className="size-3.5" /> Synced
              </>
            )}
          </span>

          <div className="flex h-8 items-center gap-2 rounded-md bg-muted px-2 sm:h-auto sm:py-1.5">
            <span className="text-xs font-medium text-muted-foreground">Mode</span>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={2}
              value={paintMode}
              disabled={locked}
              className="w-auto"
              // Đổi chế độ giữ nguyên lịch (lấy phần bù), nên không cần lưu lại
              onValueChange={(value) => value && setPaintMode(value as PaintMode, grid.allSlotIds)}
            >
              <ToggleGroupItem value="BUSY" aria-label="Record busy" className={modeItemClass}>
                Busy
              </ToggleGroupItem>
              <ToggleGroupItem value="FREE" aria-label="Record available" className={modeItemClass}>
                Available
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
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
