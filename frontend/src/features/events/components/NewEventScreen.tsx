import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { AdminCredentialsFields } from './AdminCredentialsFields'
import { EventForm } from './EventForm'
import { eventUi } from '../../../shared/components/ui/styles'
import { cn } from '@/lib/utils'
import { createEvent, updateEvent } from '../services'
import type { CreateEventResponse, EventFormValues } from '../types'

type EventStep = 'credentials' | 'event'

const credentialsSchema = z.object({
  adminUsername: z.string().min(1, 'Username is required.'),
  adminPassword: z.string(),
})

type CredentialsValues = z.infer<typeof credentialsSchema>

export function NewEventScreen() {
  const [isOpen, setIsOpen] = useState(true)
  const [step, setStep] = useState<EventStep>('credentials')

  const [adminCredentials, setAdminCredentials] = useState<CredentialsValues>({
    adminUsername: '',
    adminPassword: '',
  })

  const [createError, setCreateError] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<CreateEventResponse['value']>(null)
  const [createdValues, setCreatedValues] = useState<EventFormValues>()

  function handleCredentialsSubmit(values: CredentialsValues) {
    setAdminCredentials(values)
    setStep('event')
  }

  async function submitEvent(values: Parameters<typeof createEvent>[0]) {
    setCreateError(undefined)
    setIsCreating(true)
    try {
      const response = await createEvent(values)
      setCreatedEvent(response.value)
      setCreatedValues(values)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create event.')
    } finally {
      setIsCreating(false)
    }
  }

  if (createdEvent && createdValues) {
    return <EventManagementScreen event={createdEvent} values={createdValues} />
  }

  if (!isOpen) {
    return (
      <button
        className={eventUi.reopenButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Open new event
      </button>
    )
  }

  return (
    <div className={eventUi.shell}>
      {/* Mobile Screen */}
      <div className={eventUi.mobileScreen}>
        <header className={eventUi.screenHeader}>
          <Brand />
          <button
            aria-label="Close"
            className={eventUi.closeButton}
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X size={24} />
          </button>
        </header>
        {step === 'credentials' ? (
          <CredentialsStep
            compact
            defaultValues={adminCredentials}
            onSubmit={handleCredentialsSubmit}
          />
        ) : (
          <>
            <h1 className={eventUi.mobileTitle}>Create New Event</h1>
            <EventForm
              adminPassword={adminCredentials.adminPassword}
              adminUsername={adminCredentials.adminUsername}
              compact
              error={createError}
              onCancel={() => setIsOpen(false)}
              onSubmit={submitEvent}
              submitting={isCreating}
            />
          </>
        )}
      </div>

      {/* Desktop Screen */}
      <div className={eventUi.desktopScreen}>
        <header className={eventUi.siteHeader}>
          <Brand />
          <button className={eventUi.joinButton} type="button">
            Join with ID
          </button>
        </header>
        <main className={eventUi.page}>
          <h1 className={eventUi.pageTitle}>
            {step === 'credentials' ? 'Admin credentials' : 'Create New Event'}
          </h1>
          <div className={eventUi.desktopDialog}>
            {step === 'credentials' ? (
              <CredentialsStep
                defaultValues={adminCredentials}
                onSubmit={handleCredentialsSubmit}
              />
            ) : (
              <EventForm
                adminPassword={adminCredentials.adminPassword}
                adminUsername={adminCredentials.adminUsername}
                error={createError}
                onCancel={() => setIsOpen(false)}
                onSubmit={submitEvent}
                submitting={isCreating}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className={eventUi.brand}>
      <span className={eventUi.brandIcon}>
        <CalendarDays size={18} />
      </span>
      <span>Meetly</span>
    </div>
  )
}

type CredentialsStepProps = {
  compact?: boolean
  defaultValues: CredentialsValues
  onSubmit: (values: CredentialsValues) => void
}

function CredentialsStep({
  compact = false,
  defaultValues,
  onSubmit,
}: CredentialsStepProps) {
  const methods = useForm<CredentialsValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues,
  })

  return (
    <FormProvider {...methods}>
      <form
        className={cn(eventUi.form, compact && eventUi.mobileForm)}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <div>
          <p>Enter the admin credentials for this event before continuing.</p>
        </div>

        {/* Cấu hình lại để khớp với component AdminCredentialsFields dùng Context */}
        <AdminCredentialsFields usernameRequired />

        <footer className={eventUi.formFooter}>
          <button
            className={cn(eventUi.button, eventUi.formFooterButton, eventUi.primaryButton)}
            type="submit"
          >
            Continue
          </button>
        </footer>
      </form>
    </FormProvider>
  )
}

function EventManagementScreen({
  event,
  values,
}: {
  event: NonNullable<CreateEventResponse['value']>
  values: EventFormValues
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [pendingValues, setPendingValues] = useState<EventFormValues>()
  const [showWarning, setShowWarning] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [currentValues, setCurrentValues] = useState(values)
  const [currentRevision, setCurrentRevision] = useState(event.revision)
  const [updateError, setUpdateError] = useState<string>()

  async function confirmUpdate() {
    if (!pendingValues || !event.isAdmin || !event.accessToken) return
    setIsUpdating(true)
    setUpdateError(undefined)
    try {
      const response = await updateEvent(event.shortCode, pendingValues, event.accessToken)
      setCurrentValues(pendingValues)
      setCurrentRevision(response.revision)
      setShowWarning(false)
      setIsEditing(false)
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : 'Unable to update event.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isEditing) {
    return (
      <div className={eventUi.shell}>
        <div className={eventUi.mobileScreen}>
          <header className={eventUi.screenHeader}>
            <Brand />
          </header>
          <h1 className={eventUi.mobileTitle}>Edit Event</h1>
          <EventForm
            adminPassword={currentValues.adminPassword ?? ''}
            adminUsername={currentValues.adminUsername ?? ''}
            compact
            error={updateError}
            initialValues={currentValues}
            onCancel={() => setIsEditing(false)}
            onSubmit={(nextValues) => {
              setPendingValues(nextValues)
              setShowWarning(true)
            }}
            submitLabel="Save Changes"
            submitting={isUpdating}
          />
        </div>
        <div className={eventUi.desktopScreen}>
          <header className={eventUi.siteHeader}>
            <Brand />
          </header>
          <main className={eventUi.page}>
            <h1 className={eventUi.pageTitle}>Edit Event</h1>
            <div className={eventUi.desktopDialog}>
              <EventForm
                adminPassword={currentValues.adminPassword ?? ''}
                adminUsername={currentValues.adminUsername ?? ''}
                error={updateError}
                initialValues={currentValues}
                onCancel={() => setIsEditing(false)}
                onSubmit={(nextValues) => {
                  setPendingValues(nextValues)
                  setShowWarning(true)
                }}
                submitLabel="Save Changes"
                submitting={isUpdating}
              />
            </div>
          </main>
        </div>
        {showWarning && (
          <UpdateWarning
            isUpdating={isUpdating}
            onCancel={() => setShowWarning(false)}
            onConfirm={confirmUpdate}
          />
        )}
      </div>
    )
  }

  return (
    <div className={eventUi.managementScreen}>
      <header className={eventUi.siteHeader}>
        <Brand />
      </header>
      <main className={eventUi.page}>
        <h1 className={eventUi.pageTitle}>Manage Event</h1>
        <section className={eventUi.managementCard}>
          <p className={eventUi.managementSuccess}>Event created successfully.</p>
          <dl className={eventUi.managementDetails}>
            <div className={eventUi.managementDetail}>
              <dt className={eventUi.managementDt}>Event name</dt>
              <dd className={eventUi.managementDd}>{currentValues.title}</dd>
            </div>
            <div className={eventUi.managementDetail}>
              <dt className={eventUi.managementDt}>Event ID</dt>
              <dd className={eventUi.managementDd}>{event.shortCode}</dd>
            </div>
            <div className={eventUi.managementDetail}>
              <dt className={eventUi.managementDt}>Revision</dt>
              <dd className={eventUi.managementDd}>{currentRevision}</dd>
            </div>
          </dl>
          {event.isAdmin && (
            <button
              className={cn(eventUi.button, eventUi.primaryButton, eventUi.managementEdit)}
              onClick={() => {
                setUpdateError(undefined)
                setIsEditing(true)
              }}
              type="button"
            >
              Edit Event
            </button>
          )}
          <a
            className={cn(eventUi.button, eventUi.primaryButton, eventUi.managementLink)}
            href={event.url}
          >
            Open event
          </a>
        </section>
      </main>
    </div>
  )
}

function UpdateWarning({
  isUpdating,
  onCancel,
  onConfirm,
}: {
  isUpdating: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className={eventUi.updateWarningBackdrop} role="presentation">
      <section
        aria-labelledby="update-warning-title"
        aria-modal="true"
        className={eventUi.updateWarning}
        role="dialog"
      >
        <h2 className={eventUi.updateWarningTitle} id="update-warning-title">
          Save event changes?
        </h2>
        <p className={eventUi.updateWarningDescription}>
          Changing the event configuration may affect the availability data already entered by participants.
        </p>
        <div className={eventUi.updateWarningActions}>
          <button
            className={cn(eventUi.button, eventUi.updateWarningSecondary)}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={cn(eventUi.button, eventUi.primaryButton)}
            disabled={isUpdating}
            onClick={onConfirm}
            type="button"
          >
            {isUpdating ? 'Saving...' : 'Confirm changes'}
          </button>
        </div>
      </section>
    </div>
  )
}