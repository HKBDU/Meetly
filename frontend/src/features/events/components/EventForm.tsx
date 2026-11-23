import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { DEFAULT_EVENT_VALUES, eventFormSchema, type EventFormValues } from '../schema'
import { DaysField } from './DaysField'
import { HoursField } from './HoursField'

interface EventFormProps {
  initialValues?: EventFormValues
  onSubmit: (values: EventFormValues) => void | Promise<void>
  onCancel?: () => void
  submitLabel?: string
  submitting?: boolean
  error?: string
  className?: string
}

/** Form sửa tên, ngày và khung giờ của event (dialog Edit Event) */
export function EventForm({
  initialValues = DEFAULT_EVENT_VALUES,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
  submitting = false,
  error,
  className,
}: EventFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: initialValues,
  })
  const [eventType, dates, weekdays, dailyStartTime, dailyEndTime] = useWatch({
    control,
    name: ['eventType', 'dates', 'weekdays', 'dailyStartTime', 'dailyEndTime'],
  })
  const busy = submitting || isSubmitting
  const validate = { shouldValidate: isSubmitted }

  return (
    <form className={cn('grid gap-6', className)} onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-2">
        <FieldLabel htmlFor="event-name">Event name</FieldLabel>
        <Input id="event-name" aria-invalid={Boolean(errors.title)} {...register('title')} />
        {errors.title && <FieldError>{errors.title.message}</FieldError>}
      </div>

      <div className="grid gap-2">
        <FieldLabel>Days</FieldLabel>
        <DaysField
          eventType={eventType}
          dates={dates}
          weekdays={weekdays}
          onEventTypeChange={(type) => setValue('eventType', type, validate)}
          onDatesChange={(next) => setValue('dates', next, validate)}
          onWeekdaysChange={(next) => setValue('weekdays', next, validate)}
          error={errors.dates?.message ?? errors.weekdays?.message}
        />
      </div>

      <div className="grid gap-2">
        <FieldLabel>Hours</FieldLabel>
        <HoursField
          start={dailyStartTime}
          end={dailyEndTime}
          onChange={(start, end) => {
            setValue('dailyStartTime', start, validate)
            setValue('dailyEndTime', end, validate)
          }}
          error={errors.dailyEndTime?.message}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <footer className="flex gap-2.5 sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" className="flex-1 sm:min-w-36 sm:flex-none" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </Button>
      </footer>
    </form>
  )
}
