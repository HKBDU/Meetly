import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/shared/components/ui/button'
import { CredentialsFields } from '@/shared/components/CredentialsFields'
import { useParticipantStore } from '@/features/participants/store'

import { EventForm } from './EventForm'
import { eventUi } from '../../../shared/components/ui/styles'
import { cn } from '@/lib/utils'
import { createEvent } from '../services'
import type {
  CredentialsFormValues,
  CredentialsStepProps,
  EventFormValues,
  EventStep,
} from '../types'

const credentialsSchema = z.object({
  adminUsername: z.string().min(1, 'Username is required.'),
  adminPassword: z.string(),
})

export function NewEventScreen() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(true)
  const [step, setStep] = useState<EventStep>('credentials')

  const [adminCredentials, setAdminCredentials] = useState<CredentialsFormValues>({
    adminUsername: '',
    adminPassword: '',
  })

  const [createError, setCreateError] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)

  function handleCredentialsSubmit(values: CredentialsFormValues) {
    setAdminCredentials(values)
    setStep('event')
  }

  /** Tạo xong thì đăng nhập admin và vào thẳng heatmap của event */
  async function submitEvent(values: EventFormValues) {
    setCreateError(undefined)
    setIsCreating(true)
    try {
      const created = await createEvent(values)
      const { resetSession, login } = useParticipantStore.getState()
      resetSession()
      login(
        {
          shortCode: created.shortCode,
          participantId: created.participantId,
          username: values.adminUsername?.trim() ?? adminCredentials.adminUsername,
          isAdmin: created.isAdmin,
          accessToken: created.accessToken,
        },
        [],
      )
      navigate(`/e/${created.shortCode}`)
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create event.')
      setIsCreating(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        className={eventUi.reopenButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Open new event
      </Button>
    )
  }

  return (
    <div className={eventUi.shell}>
      <div className={eventUi.mobileScreen}>
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

      <div className={eventUi.desktopScreen}>
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

function CredentialsStep({
  compact = false,
  defaultValues,
  onSubmit,
}: CredentialsStepProps) {
  const methods = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues,
  })

  return (
    <FormProvider {...methods}>
      <form
        className={cn(eventUi.form, compact && eventUi.mobileForm)}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <CredentialsFields title="Admin credentials" usernameRequired />
        <div>
          <p>Enter the admin credentials for this event before continuing.</p>
        </div>
        <footer className={eventUi.formFooter}>
          <Button
            className={cn(eventUi.button, eventUi.formFooterButton, eventUi.primaryButton)}
            type="submit"
          >
            Continue
          </Button>
        </footer>
      </form>
    </FormProvider>
  )
}
