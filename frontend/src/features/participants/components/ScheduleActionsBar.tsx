import { useState } from "react"
import { BellRing, CloudCheck, Loader2, SlidersHorizontal } from "lucide-react"

import { ManualRangeDialog } from "@/features/participants/components/ManualRangeDialog"
import { useParticipantStore } from "@/features/participants/store"
import type { PaintMode } from "@/features/participants/types"
import { Button, ToggleGroup, ToggleGroupItem } from "@/shared/components/ui"
import { cn } from "@/lib/utils"

interface ScheduleActionsBarProps {
  triggerAutoSave: () => void
  isSaving: boolean
}

/** Hàng điều khiển phía trên lưới: Chọn thủ công, Xoá hết, trạng thái lưu và chế độ Busy/Available */
export function ScheduleActionsBar({ triggerAutoSave, isSaving }: ScheduleActionsBarProps) {
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setPaintMode = useParticipantStore((s) => s.setPaintMode)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const hasEmailSubscribed = useParticipantStore((s) => s.hasEmailSubscribed)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

  function handleResetDates() {
    clearAllPainted()
    triggerAutoSave()
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 pt-1 pb-3 sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isFinalized}
            onClick={() => setIsManualDialogOpen(true)}
          >
            <SlidersHorizontal className="size-4" />
            Select Manual
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            disabled={isFinalized}
            onClick={handleResetDates}
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
            aria-label={hasEmailSubscribed ? "Notifications on" : "Notify me by email"}
          >
            <BellRing className="size-4" />
            <span className="hidden sm:inline">
              {hasEmailSubscribed ? "Notifications on" : "Notify me by email"}
            </span>
          </Button>

          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-xs font-medium",
              isSaving ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CloudCheck className="size-3.5" />
                Synced
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
              onValueChange={(value) => value && setPaintMode(value as PaintMode)}
              disabled={isFinalized}
              className="w-auto"
            >
              <ToggleGroupItem
                value="BUSY"
                aria-label="Record busy"
                className={cn(
                  "h-8 w-24 border-2 text-xs sm:h-9",
                  "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Busy
              </ToggleGroupItem>
              <ToggleGroupItem
                value="FREE"
                aria-label="Record available"
                className={cn(
                  "h-8 w-24 border-2 text-xs sm:h-9",
                  "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                Available
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </div>

      <ManualRangeDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        triggerAutoSave={triggerAutoSave}
      />
    </>
  )
}
