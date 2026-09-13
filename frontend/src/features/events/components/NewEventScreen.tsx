import { useState, type FormEvent } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { AdminCredentialsFields } from './AdminCredentialsFields'
import { EventForm } from './EventForm'
import { createEvent, updateEvent } from '../services'
import type { CreateEventResponse, EventFormValues } from '../types'

type EventStep = 'credentials' | 'event'

export function NewEventScreen() {
  const [isOpen, setIsOpen] = useState(true)
  const [step, setStep] = useState<EventStep>('credentials')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [credentialsError, setCredentialsError] = useState<string>()
  const [createError, setCreateError] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<CreateEventResponse['value']>(null)
  const [createdValues, setCreatedValues] = useState<EventFormValues>()

  function continueToEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!adminUsername.trim()) {
      setCredentialsError('Username is required.')
      return
    }
    setCredentialsError(undefined)
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

  if (createdEvent && createdValues) return <EventManagementScreen event={createdEvent} values={createdValues} />
  if (!isOpen) return <button className="reopen-button" onClick={() => setIsOpen(true)} type="button">Open new event</button>

  return <div className="app-shell">
    <div className="mobile-screen">
      <header className="screen-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div><button aria-label="Close" onClick={() => setIsOpen(false)} type="button"><X size={24} /></button></header>
      {step === 'credentials' ? <CredentialsStep compact error={credentialsError} onPasswordChange={(value) => { setAdminPassword(value); setCredentialsError(undefined) }} onSubmit={continueToEvent} onUsernameChange={(value) => { setAdminUsername(value); setCredentialsError(undefined) }} password={adminPassword} username={adminUsername} /> : <><h1 className="mobile-title">Create New Event</h1><EventForm adminPassword={adminPassword} adminUsername={adminUsername} compact error={createError} onCancel={() => setIsOpen(false)} onSubmit={submitEvent} submitting={isCreating} /></>}
    </div>
    <div className="desktop-screen">
      <header className="site-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div><button className="join-button" type="button">Join with ID</button></header>
      <main className="event-page"><h1>{step === 'credentials' ? 'Admin credentials' : 'Create New Event'}</h1><div className="desktop-dialog">{step === 'credentials' ? <CredentialsStep error={credentialsError} onPasswordChange={(value) => { setAdminPassword(value); setCredentialsError(undefined) }} onSubmit={continueToEvent} onUsernameChange={(value) => { setAdminUsername(value); setCredentialsError(undefined) }} password={adminPassword} username={adminUsername} /> : <EventForm adminPassword={adminPassword} adminUsername={adminUsername} error={createError} onCancel={() => setIsOpen(false)} onSubmit={submitEvent} submitting={isCreating} />}</div></main>
    </div>
  </div>
}

type CredentialsStepProps = { compact?: boolean; username: string; password: string; error?: string; onUsernameChange: (value: string) => void; onPasswordChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }

function CredentialsStep({ compact = false, username, password, error, onUsernameChange, onPasswordChange, onSubmit }: CredentialsStepProps) {
  return <form className={'event-form credentials-step' + (compact ? ' event-form--mobile' : '')} onSubmit={onSubmit}>
    <div className="credentials-step__intro"><p>Enter the admin credentials for this event before continuing.</p></div>
    <AdminCredentialsFields error={error} onPasswordChange={onPasswordChange} onUsernameChange={onUsernameChange} password={password} username={username} usernameRequired />
    <footer className="event-form__footer"><button className="button button--primary" type="submit">Continue</button></footer>
  </form>
}

function EventManagementScreen({ event, values }: { event: NonNullable<CreateEventResponse['value']>; values: EventFormValues }) {
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

  if (isEditing) return <div className="app-shell">
    <div className="mobile-screen"><header className="screen-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div></header><h1 className="mobile-title">Edit Event</h1><EventForm adminPassword={currentValues.adminPassword ?? ''} adminUsername={currentValues.adminUsername ?? ''} compact error={updateError} initialValues={currentValues} onCancel={() => setIsEditing(false)} onSubmit={(nextValues) => { setPendingValues(nextValues); setShowWarning(true) }} submitLabel="Save Changes" submitting={isUpdating} /></div>
    <div className="desktop-screen"><header className="site-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div></header><main className="event-page"><h1>Edit Event</h1><div className="desktop-dialog"><EventForm adminPassword={currentValues.adminPassword ?? ''} adminUsername={currentValues.adminUsername ?? ''} error={updateError} initialValues={currentValues} onCancel={() => setIsEditing(false)} onSubmit={(nextValues) => { setPendingValues(nextValues); setShowWarning(true) }} submitLabel="Save Changes" submitting={isUpdating} /></div></main></div>
    {showWarning && <UpdateWarning isUpdating={isUpdating} onCancel={() => setShowWarning(false)} onConfirm={confirmUpdate} />}
  </div>

  return <div className="management-screen">
    <header className="site-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div></header>
    <main className="event-page"><h1>Manage Event</h1><section className="management-card"><p className="management-card__success">Event created successfully.</p><dl><div><dt>Event name</dt><dd>{currentValues.title}</dd></div><div><dt>Event ID</dt><dd>{event.shortCode}</dd></div><div><dt>Revision</dt><dd>{currentRevision}</dd></div></dl>{event.isAdmin && <button className="button button--primary management-card__edit" onClick={() => { setUpdateError(undefined); setIsEditing(true) }} type="button">Edit Event</button>}<a className="button button--primary management-card__link" href={event.url}>Open event</a></section></main>
  </div>
}

function UpdateWarning({ isUpdating, onCancel, onConfirm }: { isUpdating: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <div className="update-warning__backdrop" role="presentation"><section aria-labelledby="update-warning-title" aria-modal="true" className="update-warning" role="dialog"><h2 id="update-warning-title">Save event changes?</h2><p>Changing the event configuration may affect the availability data already entered by participants.</p><div className="update-warning__actions"><button className="button button--secondary" onClick={onCancel} type="button">Cancel</button><button className="button button--primary" disabled={isUpdating} onClick={onConfirm} type="button">{isUpdating ? 'Saving...' : 'Confirm changes'}</button></div></section></div>
}
