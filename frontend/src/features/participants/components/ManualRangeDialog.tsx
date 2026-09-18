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
import { PAINT_MODE_LABEL } from "@/features/participants/types"
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
  triggerAutoSave: () => void
}

/** "2026-09-14" -> "Mon, Sep 14" hoặc "Monday" (DAYS_OF_WEEK) */
function formatDateOptionLabel(dateISO: string, isSpecificDates: boolean): string {
  const { weekday, dayMonth } = formatDateLabel(dateISO)
  return isSpecificDates ? `${weekday}, ${dayMonth}` : weekday
}

/** Chọn 1 ngày và khoảng giờ bằng slider để tô hàng loạt, theo `paintMode` hiện tại */
export function ManualRangeDialog({ open, onOpenChange, triggerAutoSave }: ManualRangeDialogProps) {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const paintMode = useParticipantStore((s) => s.paintMode)
  const addPaintedSlots = useParticipantStore((s) => s.addPaintedSlots)

  // Mốc giờ biên (N ô có N+1 mốc); slider chọn cặp chỉ số vào mảng này
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

  // Mỗi lần mở là một lượt chọn mới: ngày đầu tiên, trọn khung giờ
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
            Add a continuous block of {PAINT_MODE_LABEL[paintMode]}
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
