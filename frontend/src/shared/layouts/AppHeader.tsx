import { House, LogOut } from 'lucide-react'
import { Link, useMatch, useNavigate } from 'react-router-dom'

import { useParticipantStore } from '@/features/participants/store'
import { Button } from '@/shared/components/ui'

/** Header chung; trong trang event có nút về trang chủ và đổi người dùng khi đã định danh */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth)
  const resetSession = useParticipantStore((s) => s.resetSession)
  const navigate = useNavigate()
  const inEvent = useMatch('/e/:shortCode/*')

  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
      <Link to="/" className="flex items-center gap-2 text-xl font-bold">
        <img src="/meetly-logo.png" alt="" aria-hidden="true" className="h-9 w-11 shrink-0 object-contain" />
        Meetly
      </Link>

      {auth && inEvent && (
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-muted-foreground md:inline">
            Signed in as <span className="font-medium text-foreground">{auth.username}</span>
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('/')}>
            <House aria-hidden="true" />
            Back to Home
          </Button>
          <Button variant="ghost" size="sm" onClick={resetSession} aria-label="Switch user">
            <LogOut aria-hidden="true" />
            <span className="hidden sm:inline">Switch user</span>
          </Button>
        </div>
      )}
    </header>
  )
}
