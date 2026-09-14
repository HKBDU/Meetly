import { useEffect, useState } from 'react'
import { EventPage, Home } from '@/pages'
import { eventCodeFromPath } from '@/shared/session'

export default function App() {
  const [code, setCode] = useState(eventCodeFromPath)

  useEffect(() => {
    const sync = () => setCode(eventCodeFromPath())
    addEventListener('popstate', sync)
    return () => removeEventListener('popstate', sync)
  }, [])

  return code ? <EventPage code={code} /> : <Home />
}
