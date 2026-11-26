import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { minutesToTime, timeToMinutes } from '@/lib/date-time'
import { SLOT_MINUTES } from '@/shared/constants'
import { columnDetail, columnLabel } from '@/shared/grid/model'
import { useT } from '@/shared/i18n'
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
} from '@/shared/components/ui'
import { buildSlotIdsInRange } from '@/features/participants/gridUtils'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { manualRangeSchema, type ManualRangeFormValues } from '@/features/participants/schema'
import { useParticipantStore } from '@/features/participants/store'
import { PAINT_MODE_LABEL } from '@/features/participants/types'

interface ManualRangeDialogProps {
  grid: ScheduleGrid
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerAutoSave: () => void
  onRangeApplied: (columnKey: string) => void
}

/** Chọn 1 cột và khoảng giờ bằng slider để tô hàng loạt, theo `paintMode` hiện tại */
export function ManualRangeDialog({ grid, open, onOpenChange, triggerAutoSave, onRangeApplied }: ManualRangeDialogProps) {
  const t = useT()
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setSlotsPainted = useParticipantStore((s) => s.setSlotsPainted)

  // N ô có N+1 mốc; slider chọn cặp chỉ số vào mảng này
  const boundaries = useMemo(() => {
    const last = grid.times[grid.times.length - 1]
    return last ? [...grid.times, minutesToTime(timeToMinutes(last) + SLOT_MINUTES)] : []
  }, [grid.times])

  const form = useForm<ManualRangeFormValues>({
    resolver: zodResolver(manualRangeSchema),
    defaultValues: { date: '', range: [0, 0] },
  })
  const { reset } = form

  // Mỗi lần mở là một lượt chọn mới: cột đầu tiên, trọn khung giờ
  useEffect(() => {
    if (open && grid.columns.length > 0 && boundaries.length > 0) {
      reset({ date: grid.columns[0].key, range: [0, boundaries.length - 1] })
    }
  }, [open, grid.columns, boundaries.length, reset])

  function handleSave(values: ManualRangeFormValues) {
    const [startIndex, endIndex] = values.range
    setSlotsPainted(buildSlotIdsInRange({ key: values.date }, boundaries[startIndex], boundaries[endIndex]), true)
    onRangeApplied(values.date)
    triggerAutoSave()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('manual.title')}</DialogTitle>
          <DialogDescription>{t('manual.description', { mode: t(PAINT_MODE_LABEL[paintMode]) })}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5" onSubmit={form.handleSubmit(handleSave)}>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel>{t('manual.date')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grid.columns.map((column) => (
                        <SelectItem key={column.key} value={column.key}>
                          {column.specificDate ? `${columnLabel(column)}, ${columnDetail(column)}` : columnLabel(column)}
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
                    <FormLabel>{t('manual.range')}</FormLabel>
                    <span className="text-sm font-medium tabular-nums">
                      {boundaries[field.value[0]]} – {boundaries[field.value[1]]}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={Math.max(1, boundaries.length - 1)}
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
                {t('common.cancel')}
              </Button>
              <Button type="submit">{t('common.save')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
