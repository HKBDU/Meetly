import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { cn } from '@/lib/utils'
import { EventType } from '@/shared/constants'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import { DEFAULT_EVENT_VALUES, eventFormSchema, type EventFormValues } from '../schema'
import { DatePicker, WeekdayPicker } from './AvailabilitySelector'
import { TimeRangeField } from './TimeRangeField'

interface EventFormProps {
  initialValues?: EventFormValues
  onSubmit: (values: EventFormValues) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  submitting?: boolean
  error?: string
  className?: string
}

/** Form tên, loại, ngày/thứ và khung giờ của event; dùng cho cả tạo mới lẫn sửa */
export function EventForm({
  initialValues = DEFAULT_EVENT_VALUES,
  onSubmit,
  onCancel,
  submitLabel = 'Create Event',
  submitting = false,
  error,
  className,
}: EventFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
  })
  const [eventType, dates, weekdays, dailyStartTime, dailyEndTime] = useWatch({
    control,
    name: ['eventType', 'dates', 'weekdays', 'dailyStartTime', 'dailyEndTime'],
  })
  const busy = submitting || isSubmitting

  return (
    <form className={cn('grid gap-5', className)} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-2">
        <FieldLabel htmlFor="event-name">
          Event name <span className="text-destructive">*</span>
        </FieldLabel>
        <Input id="event-name" aria-invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </div>

      <ToggleGroup
        type="single"
        variant="outline"
        aria-label="Event type"
        value={String(eventType)}
        onValueChange={(next) => {
          if (next) setValue('eventType', Number(next) as EventFormValues['eventType'], { shouldValidate: false })
        }}
        className="w-full"
      >
        <ToggleGroupItem value={String(EventType.Dates)} className="flex-1 data-[state=on]:border-primary data-[state=on]:text-primary">
          Specific dates
        </ToggleGroupItem>
        <ToggleGroupItem value={String(EventType.Weekdays)} className="flex-1 data-[state=on]:border-primary data-[state=on]:text-primary">
          Days of the week
        </ToggleGroupItem>
      </ToggleGroup>

      {eventType === EventType.Dates ? (
        <DatePicker
          value={dates}
          onChange={(next) => setValue('dates', next, { shouldValidate: Boolean(errors.dates) })}
          error={errors.dates?.message}
        />
      ) : (
        <WeekdayPicker
          value={weekdays}
          onChange={(next) => setValue('weekdays', next, { shouldValidate: Boolean(errors.weekdays) })}
          error={errors.weekdays?.message}
        />
      )}

      <TimeRangeField
        start={dailyStartTime}
        end={dailyEndTime}
        onChange={(start, end) => {
          setValue('dailyStartTime', start)
          setValue('dailyEndTime', end, { shouldValidate: Boolean(errors.dailyEndTime) })
        }}
        error={errors.dailyEndTime?.message}
      />

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <footer className="sticky bottom-0 -mx-5 flex gap-2.5 border-t bg-card px-5 py-3 sm:static sm:mx-0 sm:justify-end sm:border-0 sm:bg-transparent sm:p-0">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1 sm:flex-none sm:min-w-36" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </footer>
    </form>
  )
}
