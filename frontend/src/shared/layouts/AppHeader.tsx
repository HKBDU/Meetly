import { LogOut } from 'lucide-react'
import { Link, useMatch } from 'react-router-dom'

import meetlyLogo from '@/assets/meetly-logo.png'
import { useParticipantStore } from '@/features/participants/store'
import { Button } from '@/shared/components/ui'

/** Header chung; trong trang event có nút rời event khi đã định danh */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth)
  const resetSession = useParticipantStore((s) => s.resetSession)
  const inEvent = useMatch('/e/:shortCode/*')

  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold">
        <img src={meetlyLogo} alt="" aria-hidden="true" className="h-9 w-11 shrink-0 object-contain" />
        Meetly
      </Link>

      {auth && inEvent && (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Signed in as <span className="font-medium text-foreground">{auth.username}</span>
          </span>
          <Button variant="outline" size="sm" onClick={resetSession}>
            <LogOut aria-hidden="true" />
            Switch user
          </Button>
        </div>
      )}
    </header>
  )
}
