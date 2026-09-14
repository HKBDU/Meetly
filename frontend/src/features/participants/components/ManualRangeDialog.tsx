import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import {
  buildSlotIdsInRange,
  formatDateLabel,
  getGridTimes,
  getManualRangeEndTimeOptions,
} from "@/features/participants/gridUtils"
import { manualRangeSchema, type ManualRangeFormValues } from "@/features/participants/schema"
import { useParticipantStore } from "@/features/participants/store"
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@/shared/components/ui"

interface ManualRangeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** "Save" cũng làm thay đổi lịch như kéo chuột - phải tự lưu lên server */
  triggerAutoSave: () => void
}

/** "2026-09-14" -> "Mon, Sep 14" (SPECIFIC_DATES) hoặc "Monday" (DAYS_OF_WEEK) - nhãn cho dropdown chọn ngày */
function formatDateOptionLabel(dateISO: string, isSpecificDates: boolean): string {
  const { weekday, dayMonth } = formatDateLabel(dateISO)
  return isSpecificDates ? `${weekday}, ${dayMonth}` : weekday
}

/**
 * "Manual Range Entry": chọn 1 ngày + kéo Slider (2 tay cầm) để chọn khoảng
 * giờ bắt đầu-kết thúc, thay vì kéo chuột trên lưới - tiện cho khoảng thời
 * gian dài hoặc khi cần độ chính xác cao. Chỉ có Save/Cancel - không còn nút
 * "Add Range"/"Clear" riêng như bản cũ: Save áp dụng LUÔN khoảng đang chọn
 * trên slider rồi đóng dialog; mở lại ("Select Manual") luôn bắt đầu từ
 * khoảng mặc định mới (xem `useEffect` reset theo `open` bên dưới), không
 * giữ lại lựa chọn của lần mở trước.
 *
 * Tô LUÔN theo `paintMode` hiện tại (nếu đang Record Available thì khoảng
 * này được đánh dấu rảnh, đang Record Busy thì đánh dấu bận) - giữ đúng 1
 * cách diễn giải duy nhất với việc kéo chuột trên lưới (xem useAutoSaveSchedule).
 */
export function ManualRangeDialog({ open, onOpenChange, triggerAutoSave }: ManualRangeDialogProps) {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const paintMode = useParticipantStore((s) => s.paintMode)
  const addPaintedSlots = useParticipantStore((s) => s.addPaintedSlots)

  // Mảng MỐC GIỜ (không phải slot) - N ô giờ có N+1 mốc biên, VD 09:00..21:00
  // mỗi 15p ra ["09:00", "09:15", ..., "20:45", "21:00"]. Slider chọn 1 CẶP
  // CHỈ SỐ vào mảng này (start < end được `minStepsBetweenThumbs` đảm bảo),
  // rồi map ngược lại thành "HH:mm" để gọi buildSlotIdsInRange.
  const boundaries = useMemo(() => {
    if (!config) return []
    const startTimes = getGridTimes(config)
    const endTimes = getManualRangeEndTimeOptions(config)
    return [...startTimes, endTimes[endTimes.length - 1]]
  }, [config])

  const form = useForm<ManualRangeFormValues>({
    resolver: zodResolver(manualRangeSchema),
    defaultValues: { date: "", range: [0, 0] },
  })

  // Reset về mặc định (ngày đầu tiên, chọn TRỌN cả khung giờ) mỗi lần dialog
  // được mở - "Select Manual" luôn là 1 lượt chọn MỚI, không kế thừa lần
  // trước (yêu cầu review: đóng xong là xong, muốn chọn tiếp phải bấm lại).
  useEffect(() => {
    if (open && config && boundaries.length > 0) {
      form.reset({ date: config.dates[0], range: [0, boundaries.length - 1] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!config) return null

  function handleSave(values: ManualRangeFormValues) {
    const [startIndex, endIndex] = values.range
    addPaintedSlots(
      buildSlotIdsInRange(values.date, boundaries[startIndex], boundaries[endIndex], config!)
    )
    triggerAutoSave()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manual Range Entry</DialogTitle>
          <DialogDescription>
            Add a continuous block of {paintMode === "FREE" ? "availability" : "busy time"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSave)}>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>Select Date</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {config.dates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {formatDateOptionLabel(date, config.dateMode === "SPECIFIC_DATES")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="range"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Time Range</FormLabel>
                    <span className="text-sm font-medium text-foreground">
                      {boundaries[field.value[0]]} – {boundaries[field.value[1]]}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={boundaries.length - 1}
                      step={1}
                      minStepsBetweenThumbs={1}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="py-1"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
