import { House, Languages, LogOut, Moon, Sun } from 'lucide-react'
import { Link, useMatch, useNavigate } from 'react-router-dom'

import { useParticipantStore } from '@/features/participants/store'
import { Button } from '@/shared/components/ui'
import { useLocale, useT } from '@/shared/i18n'
import { useTheme } from '@/shared/lib/theme'

/** Header kính mờ dính trên cùng; trong trang event có nút về trang chủ và đổi người dùng */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth)
  const resetSession = useParticipantStore((s) => s.resetSession)
  const navigate = useNavigate()
  const inEvent = useMatch('/e/:shortCode/*')
  const { theme, toggle } = useTheme()
  const { locale, toggle: toggleLocale } = useLocale()
  const t = useT()

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
                {t('header.signedInAs')} <span className="text-foreground">{auth.username}</span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <House aria-hidden="true" />
                <span className="hidden sm:inline">{t('header.home')}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={resetSession} aria-label={t('header.switchUser')}>
                <LogOut aria-hidden="true" />
                <span className="hidden sm:inline">{t('header.switchUser')}</span>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2.5 has-[>svg]:px-2.5"
            onClick={toggleLocale}
            aria-label={t('header.switchLanguage')}
            title={t('header.switchLanguage')}
          >
            <Languages aria-hidden="true" />
            <span className="text-xs font-semibold tracking-wide">{locale === 'vi' ? 'VI' : 'EN'}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={theme === 'dark' ? t('header.toLight') : t('header.toDark')}
            title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
