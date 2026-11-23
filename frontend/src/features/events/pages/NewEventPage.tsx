import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, User } from 'lucide-react'

import { createEvent } from '@/shared/api/events'
import { useParticipantStore } from '@/features/participants/store'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { EventForm } from '../components/EventForm'
import { credentialsSchema, toEventFields, type CredentialsFormValues, type EventFormValues } from '../schema'

/** Bước 1 nhập tài khoản admin, bước 2 nhập thông tin event; tạo xong vào thẳng heatmap */
export function NewEventPage() {
  const navigate = useNavigate()
  const [credentials, setCredentials] = useState<CredentialsFormValues | null>(null)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function submitEvent(values: EventFormValues) {
    if (!credentials) return
    setError(undefined)
    setSubmitting(true)
    try {
      const created = await createEvent({
        ...toEventFields(values),
        admin: { username: credentials.adminUsername.trim(), password: credentials.adminPassword },
      })
      useParticipantStore.getState().login({
        shortCode: created.shortCode,
        participantId: created.participantId,
        username: credentials.adminUsername.trim(),
        isAdmin: created.isAdmin,
        accessToken: created.accessToken,
      })
      navigate(`/e/${created.shortCode}`)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to create event.')
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight sm:text-4xl">
        {credentials ? 'Create New Event' : 'Admin credentials'}
      </h1>
      <Card>
        <CardContent className="pt-6">
          {credentials ? (
            <EventForm
              onSubmit={submitEvent}
              onCancel={() => setCredentials(null)}
              submitting={submitting}
              error={error}
            />
          ) : (
            <CredentialsStep defaultValues={{ adminUsername: '', adminPassword: '' }} onSubmit={setCredentials} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CredentialsStep({
  defaultValues,
  onSubmit,
}: {
  defaultValues: CredentialsFormValues
  onSubmit: (values: CredentialsFormValues) => void
}) {
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsFormValues>({ resolver: zodResolver(credentialsSchema), defaultValues })

  return (
    <form className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <CardHeader className="p-0">
        <CardTitle className="text-base">Who's hosting?</CardTitle>
        <CardDescription>
          You'll use this name and password to manage the event later, so keep them safe.
        </CardDescription>
      </CardHeader>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <FieldLabel htmlFor="admin-username">
            Username <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="admin-username" autoComplete="username" className="pl-9" aria-invalid={Boolean(errors.adminUsername)} {...register('adminUsername')} />
          </div>
          {errors.adminUsername && <FieldError>{errors.adminUsername.message}</FieldError>}
        </div>
        <div className="grid gap-2">
          <FieldLabel htmlFor="admin-password">
            Password <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="admin-password" type="password" autoComplete="new-password" className="pl-9" aria-invalid={Boolean(errors.adminPassword)} {...register('adminPassword')} />
          </div>
          {errors.adminPassword && <FieldError>{errors.adminPassword.message}</FieldError>}
        </div>
      </div>
      <footer className="flex gap-2.5 sm:justify-end">
        <Button type="button" variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={() => navigate('/')}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className="flex-1 sm:flex-none sm:min-w-36">
          Continue
        </Button>
      </footer>
    </form>
  )
}
