import { useState, type FormEvent } from 'react'
import { EventFormActions } from './EventFormActions'
import { AdminCredentialsFields } from './AdminCredentialsFields'
import { AvailabilitySelector } from './AvailabilitySelector'
import { EventTitleField } from './EventTitleField'
import { EventTypeSelect } from './EventTypeSelect'
import { TimeRangeFields } from './TimeRangeFields'
import { TimezoneSelect } from './TimezoneSelect'
import type { EventFormValues, FieldErrors } from '../types'
import { validateEventForm } from '../schema'

type EventFormProps = { compact?: boolean; onCancel?: () => void; onSubmit?: (values: EventFormValues) => void }

const INITIAL_VALUES: EventFormValues = {
  title: '',
  timezone: 'Asia/Ho_Chi_Minh',
  eventType: 2,
  availableDates: ['Monday'],
  dailyStartTime: '09:00',
  dailyEndTime: '17:00',
  adminUsername: '',
  adminPassword: '',
}

export function EventForm({ compact = false, onCancel, onSubmit }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(INITIAL_VALUES)
  const [errors, setErrors] = useState<FieldErrors>({})

  function update<K extends keyof EventFormValues>(field: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateEventForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) {
      onSubmit?.(values)
    }
  }

  return <form className={'event-form' + (compact ? ' event-form--mobile' : '')} onSubmit={submit}>
    <section className="event-form__content">
      <EventTitleField error={errors.title} onChange={(value) => update('title', value)} value={values.title} />
      <TimezoneSelect onChange={(value) => update('timezone', value)} value={values.timezone} />
      <EventTypeSelect onChange={(value) => update('eventType', value)} value={values.eventType} />
      <AvailabilitySelector error={errors.availableDates} eventType={values.eventType} onChange={(value) => update('availableDates', value)} value={values.availableDates} />
      <TimeRangeFields end={values.dailyEndTime} error={errors.dailyEndTime} onEndChange={(value) => update('dailyEndTime', value)} onStartChange={(value) => update('dailyStartTime', value)} start={values.dailyStartTime} />
      <AdminCredentialsFields onPasswordChange={(value) => update('adminPassword', value)} onUsernameChange={(value) => update('adminUsername', value)} password={values.adminPassword ?? ''} username={values.adminUsername ?? ''} />
    </section>
    <EventFormActions onCancel={onCancel ?? (() => undefined)} />
  </form>
}
