import { useState } from 'react'
import { X } from 'lucide-react'
import { EventForm } from './EventForm'

export function NewEventScreen() {
  const [isOpen, setIsOpen] = useState(true)
  if (!isOpen) return <button className="reopen-button" onClick={() => setIsOpen(true)} type="button">Open new event</button>
  return <div className="app-shell">
    <div className="mobile-screen"><header className="screen-header"><h1>New event</h1><button aria-label="Close" onClick={() => setIsOpen(false)} type="button"><X size={24} /></button></header><EventForm compact onCancel={() => setIsOpen(false)} /></div>
    <div className="desktop-screen"><div className="desktop-dialog"><header className="dialog-header"><div><span className="eyebrow">MEETLY</span><h1>New event</h1></div><button aria-label="Close" onClick={() => setIsOpen(false)} type="button"><X size={22} /></button></header><EventForm onCancel={() => setIsOpen(false)} /></div></div>
  </div>
}
