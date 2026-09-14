import { useState, type FormEvent } from 'react'
import { EventFormActions } from './EventFormActions'
import { AvailabilitySelector } from './AvailabilitySelector'
import { EventTitleField } from './EventTitleField'
import { EventTypeSelect } from './EventTypeSelect'
import { TimeRangeFields } from './TimeRangeFields'
import { eventUi } from './styles'
import { cn } from '@/lib/utils'
import type { EventFormValues, FieldErrors } from '../types'
import { validateEventForm } from '../schema'

type EventFormProps = { compact?: boolean; onCancel?: () => void; onSubmit?: (values: EventFormValues) => void | Promise<void>; adminUsername: string; adminPassword: string; submitting?: boolean; error?: string; initialValues?: Partial<EventFormValues>; submitLabel?: string }

const INITIAL_VALUES: EventFormValues = {
  title: '',
  timezone: 'Asia/Ho_Chi_Minh',
  eventType: 2,
  availableDates: ['Mon'],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
}

export function EventForm({ compact = false, onCancel, onSubmit, adminUsername, adminPassword, submitting = false, error, initialValues, submitLabel }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>({ ...INITIAL_VALUES, ...initialValues, adminUsername, adminPassword })
  const [errors, setErrors] = useState<FieldErrors>({})

  function update<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }


  function changeEventType(eventType: EventFormValues['eventType']) {
    // Dates and weekdays are different value domains. Do not carry a value
    // from one mode into the other.
    setValues((current) => ({ ...current, eventType, availableDates: [] }))
    setErrors((current) => ({ ...current, eventType: undefined, availableDates: undefined }))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateEventForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      await onSubmit?.(values)
    }
  }

  return <form className={cn(eventUi.form, compact && eventUi.mobileForm)} onSubmit={submit}>
    <section className={eventUi.formContent}>
      <EventTitleField error={errors.title} onChange={(value) => update('title', value)} value={values.title} />

      <EventTypeSelect onChange={changeEventType} value={values.eventType} />
      <AvailabilitySelector error={errors.availableDates} eventType={values.eventType} onChange={(value) => update('availableDates', value)} value={values.availableDates} />
      <TimeRangeFields end={values.dailyEndTime} error={errors.dailyEndTime} onEndChange={(value) => update('dailyEndTime', value)} onStartChange={(value) => update('dailyStartTime', value)} start={values.dailyStartTime} />
    </section>
    {error && <div className={eventUi.submitError} role="alert">{error}</div>}
    <EventFormActions onCancel={onCancel ?? (() => undefined)} submitLabel={submitLabel} submitting={submitting} />
  </form>
}
