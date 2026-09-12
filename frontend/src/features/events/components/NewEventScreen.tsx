import { useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { EventForm } from './EventForm'

export function NewEventScreen() {
  const [isOpen, setIsOpen] = useState(true)
  if (!isOpen) return <button className="reopen-button" onClick={() => setIsOpen(true)} type="button">Open new event</button>
  return <div className="app-shell">
    <div className="mobile-screen"><header className="screen-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div><button aria-label="Close" onClick={() => setIsOpen(false)} type="button"><X size={24} /></button></header><h1 className="mobile-title">Create New Event</h1><EventForm compact onCancel={() => setIsOpen(false)} /></div>
    <div className="desktop-screen"><header className="site-header"><div className="brand"><span className="brand__icon"><CalendarDays size={18} /></span><span>Meetly</span></div><button className="join-button" type="button">Join with ID</button></header><main className="event-page"><h1>Create New Event</h1><div className="desktop-dialog"><EventForm onCancel={() => setIsOpen(false)} /></div></main></div>
  </div>
}
