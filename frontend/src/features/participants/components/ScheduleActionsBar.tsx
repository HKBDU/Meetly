import { useState } from "react"
import { SlidersHorizontal } from "lucide-react"

import { ManualRangeDialog } from "@/features/participants/components/ManualRangeDialog"
import { useParticipantStore } from "@/features/participants/store"
import type { PaintMode } from "@/features/participants/types"
import { Button, ToggleGroup, ToggleGroupItem } from "@/shared/components/ui"
import { cn } from "@/lib/utils"

interface ScheduleActionsBarProps {
  /** "Reset dates"/"Select Manual" cũng làm thay đổi lịch như kéo chuột - phải tự lưu lên server */
  triggerAutoSave: () => void
}

/**
 * Hàng điều khiển dưới grid lịch - GỘP cả "Chọn thủ công" (trước ở
 * ScheduleToolbar) lẫn "Xoá hết"/chuyển chế độ tô (trước ở PaintModeControls)
 * thành 1 hàng duy nhất theo đúng ảnh mẫu: trái là 2 nút nhỏ (Select
 * Manual/Reset dates), phải là cặp Record Busy/Record Available chiếm 50%
 * width - không còn tràn hết chiều ngang như bản cũ.
 */
export function ScheduleActionsBar({ triggerAutoSave }: ScheduleActionsBarProps) {
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setPaintMode = useParticipantStore((s) => s.setPaintMode)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)
  const isFinalized = useParticipantStore((s) => s.isFinalized)
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)

  function handleResetDates() {
    clearAllPainted()
    triggerAutoSave()
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-3 py-3 sm:px-4">
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
          <Button variant="outline" size="sm" disabled={isFinalized} onClick={handleResetDates}>
            Reset dates
          </Button>
        </div>

        <ToggleGroup
          type="single"
          variant="outline"
          spacing={2}
          value={paintMode}
          onValueChange={(value) => value && setPaintMode(value as PaintMode)}
          disabled={isFinalized}
          className="grid w-full grid-cols-2 sm:w-2/5"
        >
          <ToggleGroupItem
            value="BUSY"
            aria-label="Record busy"
            className={cn(
              "border-2",
              "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            )}
          >
            Record Busy
          </ToggleGroupItem>
          <ToggleGroupItem
            value="FREE"
            aria-label="Record available"
            className={cn(
              "border-2",
              "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            )}
          >
            Record Available
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <ManualRangeDialog
        open={isManualDialogOpen}
        onOpenChange={setIsManualDialogOpen}
        triggerAutoSave={triggerAutoSave}
      />
    </>
  )
}
