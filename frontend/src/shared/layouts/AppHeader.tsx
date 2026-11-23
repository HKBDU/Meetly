import { House, LogOut, Moon, Sun } from 'lucide-react'
import { Link, useMatch, useNavigate } from 'react-router-dom'

import { useParticipantStore } from '@/features/participants/store'
import { Button } from '@/shared/components/ui'
import { useTheme } from '@/shared/lib/theme'

/** Header kính mờ dính trên cùng; trong trang event có nút về trang chủ và đổi người dùng */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth)
  const resetSession = useParticipantStore((s) => s.resetSession)
  const navigate = useNavigate()
  const inEvent = useMatch('/e/:shortCode/*')
  const { theme, toggle } = useTheme()

  return (
    <header className="surface-glass sticky top-0 z-30 border-b border-border/60">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <img src="/meetly-logo.png" alt="" aria-hidden="true" className="h-7 w-8 shrink-0 object-contain" />
          Meetly
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {auth && inEvent && (
            <>
              <span className="mr-2 hidden text-sm text-muted-foreground md:inline">
                Signed in as <span className="text-foreground">{auth.username}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <House aria-hidden="true" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSession} aria-label="Switch user">
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">Switch user</span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
