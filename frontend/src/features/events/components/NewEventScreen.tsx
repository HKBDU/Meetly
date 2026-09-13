import { useState, type FormEvent } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { AdminCredentialsFields } from './AdminCredentialsFields'
import { EventForm } from './EventForm'
import { createEvent } from '../services'
import type { CreateEventResponse } from '../types'

type EventStep = 'credentials' | 'event'

export function NewEventScreen() {
  const [isOpen, setIsOpen] = useState(true)
  const [step, setStep] = useState<EventStep>('credentials')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [credentialsError, setCredentialsError] = useState<string>()
  const [createError, setCreateError] = useState<string>()
  const [isCreating, setIsCreating] = useState(false)
  const [createdEvent, setCreatedEvent] = useState<CreateEventResponse['value']>()

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
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to create event.')
    } finally {
      setIsCreating(false)
    }
  }

  if (createdEvent) return <EventManagementScreen event={createdEvent} />
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

function EventManagementScreen({ event }: { event: NonNullable<CreateEventResponse['value']> }) {
  return <div className="management-screen">
    <header className="site-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div></header>
    <main className="event-page"><h1>Manage Event</h1><section className="management-card"><p className="management-card__success">Event created successfully.</p><dl><div><dt>Event ID</dt><dd>{event.shortCode}</dd></div><div><dt>Revision</dt><dd>{event.revision}</dd></div></dl><a className="button button--primary management-card__link" href={event.url}>Open event</a></section></main>
  </div>
}
