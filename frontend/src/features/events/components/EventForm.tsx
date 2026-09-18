import { EventFormActions } from './EventFormActions'
import { AvailabilitySelector } from './AvailabilitySelector'
import { EventTitleField } from './EventTitleField'
import { EventTypeSelect } from './EventTypeSelect'
import { TimeRangeFields } from './TimeRangeFields'
import { eventUi } from '../../../shared/components/ui/styles'
import { cn } from '@/lib/utils'
import { useForm, Controller, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { EventFormProps, EventFormValues, EventType } from '../types'
import { eventFormSchema } from '../schema'

const INITIAL_VALUES: Partial<EventFormValues> = {
  title: '',
  eventType: 2,
  availableDates: ['Mon'],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
}

/** Cột trái: tên, loại, giờ; cột phải: lịch chọn ngày, cao bằng cả 3 hàng bên trái */
const SPLIT_LAYOUT =
  'md:grid-cols-2 md:gap-x-8 md:[&>*]:col-start-1 md:[&>*:nth-child(3)]:col-start-2 ' +
  'md:[&>*:nth-child(3)]:row-start-1 md:[&>*:nth-child(3)]:row-span-4'

export function EventForm({
  compact = false,
  layout = 'stacked',
  onCancel,
  onSubmit,
  adminUsername,
  adminPassword,
  submitting = false,
  error,
  initialValues,
  submitLabel,
}: EventFormProps) {
    const methods = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      ...INITIAL_VALUES,
      ...initialValues,
      adminUsername,
      adminPassword,
    },
  })

const {
      control,
      handleSubmit,
      setValue,
      watch,
      formState: { errors, isSubmitting },
  } = methods

const currentEventType = watch("eventType");


// Dates and weekdays are different value domains. Do not carry a value
// from one mode into the other.
  function handleChangeEventType(newType: EventType) {
    setValue("eventType", newType);
    setValue("availableDates", [], { shouldValidate: true});
  }

  const onFormSubmit = async(data: EventFormValues) => {
    await onSubmit?.(data);
  }

  return (
    <FormProvider {...methods}>
   <form
      className={cn(eventUi.form, compact && eventUi.mobileForm)}
      onSubmit={handleSubmit(onFormSubmit)}
    >
      <input type="hidden" {...methods.register('adminUsername')} />
      <input type="hidden" {...methods.register('adminPassword')} />
      <section className={cn(eventUi.formContent, layout === 'split' && SPLIT_LAYOUT)}>
        {/* Title Field */}


        <Controller
          control={control}
          name="title"
          render={({ field }) => (
            <EventTitleField
              error={errors.title?.message}
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />

        {/* Event Type Select */}
        <Controller
          control={control}
          name="eventType"
          render={({ field }) => (
            <EventTypeSelect
              onChange={(type) => {
                field.onChange(type)
                handleChangeEventType(type)
              }}
              value={field.value}
            />
          )}
        />

        {/* Availability Selector */}
        <Controller
          control={control}
          name="availableDates"
          render={({ field }) => (
            <AvailabilitySelector
              error={errors.availableDates?.message}
              eventType={currentEventType}
              onChange={field.onChange}
              value={field.value}
            />
          )}
        />

        {/* Time Range Fields */}
        <Controller
          control={control}
          name="dailyStartTime"
          render={({ field: startField }) => (
            <Controller
              control={control}
              name="dailyEndTime"
              render={({ field: endField }) => (
                <TimeRangeFields
                  end={endField.value}
                  error={errors.dailyEndTime?.message}
                  onEndChange={endField.onChange}
                  onStartChange={startField.onChange}
                  start={startField.value}
                />
              )}
            />
          )}
        />
      </section>

      {error && (
        <div className={eventUi.submitError} role="alert">
          {error}
        </div>
      )}

      <EventFormActions
        onCancel={onCancel ?? (() => undefined)}
        submitLabel={submitLabel}
        submitting={submitting || isSubmitting}
      />
    </form>
    </FormProvider>
  )
}
