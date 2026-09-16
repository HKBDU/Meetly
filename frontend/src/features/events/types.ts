import type { z } from 'zod'
import type { eventFormSchema } from './schema'

export type EventType = 1 | 2


export const WEEKDAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export type CreateEventResponse = {
  isSuccess: boolean
  code: number
  message: string
  value: {
    shortCode: string
    url: string
    participantId: string
    isAdmin: boolean
    accessToken: string
    expiresAt: string
    status: number
    revision: number
  } | null
}

export type CreateEventRequest = {
  title: string
  eventType: EventType
  availableDates: string[]
  availableWeekdays: number[]
  dailyStartTime: string
  dailyEndTime: string
  admin: { username: string; password: string | null }
}

export type UpdateEventRequest = Omit<CreateEventRequest, 'admin'>

export type UpdateEventResponse = {
  isSuccess: boolean
  code: number
  message: string
  value: { revision: number }
}


export type EventFormValues = z.infer<typeof eventFormSchema>

export type CredentialsFormValues = {
  adminUsername: string
  adminPassword: string
}

export type EventStep = 'credentials' | 'event'

export type AdminCredentialsFieldsProps = {
  usernameRequired?: boolean
  passwordRequired?: boolean
}

export type AvailabilitySelectorProps = {
  eventType: EventType
  value: string[]
  onChange: (value: string[]) => void
  error?: string
}

export type EventFormProps = {
  compact?: boolean
  onCancel?: () => void
  onSubmit?: (values: EventFormValues) => void | Promise<void>
  adminUsername: string
  adminPassword: string
  submitting?: boolean
  error?: string
  initialValues?: Partial<EventFormValues>
  submitLabel?: string
}

export type EventFormCancelActionProps = {
  onCancel?: () => void
  label?: string
}

export type EventFormSubmitActionProps = {
  submitting?: boolean
  submitLabel?: string
}

export type EventFormActionsProps = {
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export type EventTitleFieldProps = {
  value: string
  onChange: (value: string) => void
  error?: string
}

export type EventTypeSelectProps = {
  value: EventType
  onChange: (value: EventType) => void
}

export type CredentialsStepProps = {
  compact?: boolean
  defaultValues: CredentialsFormValues
  onSubmit: (values: CredentialsFormValues) => void
}

export type EventManagementScreenProps = {
  event: NonNullable<CreateEventResponse['value']>
  values: EventFormValues
}

export type UpdateWarningProps = {
  isUpdating: boolean
  onCancel: () => void
  onConfirm: () => void
}

export type TimeRangeFieldsProps = {
  start: string
  end: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  error?: string
}

export type TimePickerSelectProps = {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
}

export type TimezoneSelectProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}
