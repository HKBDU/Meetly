import { useEffect } from 'react'
import { Outlet, useParams } from 'react-router-dom'

import { useEventQuery, useEventRealtime } from '@/shared/hooks'
import { EmailPromptDialog } from '@/features/participants/components/EmailPromptDialog'
import { ParticipantAuthForm } from '@/features/participants/components/ParticipantAuthForm'
import { useParticipantStore } from '@/features/participants/store'
import type { ParticipantAuthInfo } from '@/features/participants/types'
import { PageLoader } from '@/shared/components/MeetlyLoader'
import { EventTimeView } from '@/shared/grid/EventTimeView'
import { useT } from '@/shared/i18n'
import type { EventOutletContext } from './eventOutlet'

/**
 * Khung chung của `/e/:shortCode` và `/e/:shortCode/me`: chưa định danh thì hiện form,
 * đã định danh thì tải event, mở realtime (1 lần cho cả 2 màn) rồi render màn con.
 */
export function EventLayout() {
  const shortCode = (useParams().shortCode ?? '').toUpperCase()
  const auth = useParticipantStore((s) => s.auth)
  const resetSession = useParticipantStore((s) => s.resetSession)
  const belongsHere = auth?.shortCode.toUpperCase() === shortCode

  // Phiên đã lưu thuộc event khác thì bỏ, tránh dùng nhầm token
  useEffect(() => {
    if (auth && !belongsHere) resetSession()
  }, [auth, belongsHere, resetSession])

  if (!shortCode) return null
  if (!auth || !belongsHere) return <ParticipantAuthForm shortCode={shortCode} />
  return <SignedInEvent shortCode={shortCode} auth={auth} />
}

function SignedInEvent({ shortCode, auth }: { shortCode: string; auth: ParticipantAuthInfo }) {
  const t = useT()
  const { data: event, isPending, error } = useEventQuery(shortCode)
  useEventRealtime(shortCode, auth.accessToken)

  if (isPending) return <PageLoader label={t('layout.loading')} />
  if (error || !event) {
    return (
      <p role="alert" className="p-8 text-center text-destructive">
        {error?.message ?? t('layout.notFound')}
      </p>
    )
  }

  return (
    <>
      <EventTimeView key={shortCode} event={event}>
        <Outlet context={{ shortCode, auth, event } satisfies EventOutletContext} />
      </EventTimeView>
      <EmailPromptDialog shortCode={shortCode} />
    </>
  )
}
