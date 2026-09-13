import { useState } from "react"

import {
  buildSlotIdsInRange,
  formatDateLabel,
  getGridTimes,
  getManualRangeEndTimeOptions,
} from "@/features/participants/gridUtils"
import { useParticipantStore } from "@/features/participants/store"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/shared/components/ui"

interface ManualRangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "Add Time Range"/"Clear" cũng làm thay đổi lịch như kéo chuột - phải tự lưu lên server */
  triggerAutoSave: () => void
}

/** "2026-09-14" -> "Mon, Sep 14" (SPECIFIC_DATES) hoặc "Monday" (DAYS_OF_WEEK) - nhãn cho dropdown chọn ngày */
function formatDateOptionLabel(dateISO: string, isSpecificDates: boolean): string {
  const { weekday, dayMonth } = formatDateLabel(dateISO)
  return isSpecificDates ? `${weekday}, ${dayMonth}` : weekday
}

/**
 * "Manual Range Entry": nhập trực tiếp 1 ngày + khoảng giờ bắt đầu-kết thúc
 * thay vì kéo chuột trên lưới - tiện cho khoảng thời gian dài hoặc khi cần độ
 * chính xác cao. Tô LUÔN theo `paintMode` hiện tại (nếu đang Record Available
 * thì khoảng này được đánh dấu rảnh, đang Record Busy thì đánh dấu bận) -
 * giữ đúng 1 cách diễn giải duy nhất với việc kéo chuột trên lưới (xem
 * useAutoSaveSchedule).
 */
export function ManualRangeDialog({ open, onOpenChange, triggerAutoSave }: ManualRangeDialogProps) {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const paintMode = useParticipantStore((s) => s.paintMode)
  const addPaintedSlots = useParticipantStore((s) => s.addPaintedSlots)
  const clearAllPainted = useParticipantStore((s) => s.clearAllPainted)

  const startTimeOptions = config ? getGridTimes(config) : []
  const endTimeOptions = config ? getManualRangeEndTimeOptions(config) : []

  const [selectedDate, setSelectedDate] = useState(config?.dates[0] ?? "")
  const [startTime, setStartTime] = useState(startTimeOptions[0] ?? "")
  const [endTime, setEndTime] = useState(endTimeOptions[endTimeOptions.length - 1] ?? "")
  const [error, setError] = useState<string | null>(null)

  if (!config) return null

  function handleAddRange() {
    if (startTime >= endTime) {
      setError("End time must be after start time")
      return
    }
    setError(null)
    addPaintedSlots(buildSlotIdsInRange(selectedDate, startTime, endTime, config!))
    triggerAutoSave()
  }

  function handleClearAll() {
    clearAllPainted()
    triggerAutoSave()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manual Range Entry</DialogTitle>
          <DialogDescription>Add a continuous block of availability</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="manual-date">Select Date</Label>
            <select
              id="manual-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {config.dates.map((date) => (
                <option key={date} value={date}>
                  {formatDateOptionLabel(date, config.dateMode === "SPECIFIC_DATES")}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-start">Start Time</Label>
              <select
                id="manual-start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {startTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-end">End Time</Label>
              <select
                id="manual-end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 w-full border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {endTimeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={handleAddRange} className="flex-1">
              Add {paintMode === "FREE" ? "Available" : "Busy"} Range
            </Button>
            <Button type="button" variant="destructive" onClick={handleClearAll}>
              Clear
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
