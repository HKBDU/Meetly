import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'

import { formatDate } from '@/lib/date-time'
import { columnDetail, columnLabel } from '@/shared/grid/model'
import { useTimeView } from '@/shared/grid/time-view'
import { formatUtcOffset } from '@/shared/grid/viewer-grid'
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
import { buildSlotIdsInRange, getSlotId } from '@/features/participants/gridUtils'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { manualRangeSchema, type ManualRangeFormValues } from '@/features/participants/schema'
import { useParticipantStore } from '@/features/participants/store'
import { PAINT_MODE_LABEL } from '@/features/participants/types'

interface ManualRangeDialogProps {
  grid: ScheduleGrid
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerAutoSave: () => void
  onRangeApplied: (columnKey: string, startTime?: string) => void
}

/** Chọn 1 cột và khoảng giờ bằng slider để tô hàng loạt, theo `paintMode` hiện tại */
export function ManualRangeDialog({ grid, open, onOpenChange, triggerAutoSave, onRangeApplied }: ManualRangeDialogProps) {
  const t = useT()
  const projected = useTimeView()?.projected
  const columns = projected?.columns ?? grid.columns
  const paintMode = useParticipantStore((s) => s.paintMode)
  const setSlotsPainted = useParticipantStore((s) => s.setSlotsPainted)

  // N ô có N+1 mốc; slider chọn cặp chỉ số vào mảng này
  const boundaries = useMemo(() => {
    const last = grid.rows.at(-1)
    return last ? [...grid.times, last.endTime] : []
  }, [grid.rows, grid.times])

  const form = useForm<ManualRangeFormValues>({
    resolver: zodResolver(manualRangeSchema),
    defaultValues: { date: '', range: [0, 0] },
  })
  const { reset, setValue } = form
  const columnKey = useWatch({ control: form.control, name: 'date' })
  const cells = projected?.byColumn.get(columnKey)
  const lastIndex = cells?.length ?? boundaries.length - 1

  useEffect(() => {
    const first = columns[0]?.key
    if (open && first) reset({ date: first, range: [0, projected?.byColumn.get(first)?.length ?? boundaries.length - 1] })
  }, [open, columns, projected, boundaries.length, reset])

  function handleSave(values: ManualRangeFormValues) {
    const [startIndex, endIndex] = values.range
    if (startIndex < 0 || endIndex <= startIndex || endIndex > lastIndex) return
    if (cells) {
      const first = cells[startIndex]
      if (!first) return
      setSlotsPainted(cells.slice(startIndex, endIndex).map(({ source }) => getSlotId(source.column, source.row.startTime)), true)
      onRangeApplied(first.source.column.key, first.source.row.startTime)
    } else {
      setSlotsPainted(buildSlotIdsInRange({ key: values.date }, boundaries[startIndex], boundaries[endIndex]), true)
      onRangeApplied(values.date, boundaries[startIndex])
    }
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
                  <Select value={field.value} onValueChange={(key) => {
                    field.onChange(key)
                    setValue('range', [0, projected?.byColumn.get(key)?.length ?? boundaries.length - 1])
                  }}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {columns.map((column) => (
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
              render={({ field }) => {
                const [startIndex, endIndex] = field.value
                const first = cells?.[startIndex]
                const last = cells?.[endIndex - 1]
                const start = first?.startTime ?? boundaries[startIndex]
                const end = last
                  ? `${last.date === last.endDate ? '' : `${formatDate(last.endDate)} · `}${last.endTime}`
                  : boundaries[endIndex]
                const showOffset = first && last && (first.offsetMinutes !== last.endOffsetMinutes ||
                  first.repeated || last.repeated)
                return (
                <FormItem className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('manual.range')}</FormLabel>
                    <span className="text-right text-sm font-medium tabular-nums">
                      {start}{showOffset && ` ${formatUtcOffset(first.offsetMinutes)}`} – {end}{showOffset && ` ${formatUtcOffset(last.endOffsetMinutes)}`}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={Math.max(1, lastIndex)}
                      step={1}
                      minStepsBetweenThumbs={1}
                      value={field.value}
                      onValueChange={field.onChange}
                      className="py-1"
                    />
                  </FormControl>
                </FormItem>
                )
              }}
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
