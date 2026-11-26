import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowUpRight, CalendarPlus, Check, Copy, KeyRound, Languages, ListChecks, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { HOUR_PRESETS, toEventFields, type EventFormValues } from '@/features/events/schema'
import { dailyMinutes, describeDuration } from '@/features/events/summary'
import { accessParticipant, createEvent, getEvent } from '@/shared/api/events'
import { MeetlyLoader } from '@/shared/components/MeetlyLoader'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { EventStatus, EventType, INPUT_LIMITS } from '@/shared/constants'
import { useLocale, useT } from '@/shared/i18n'
import { handoffUrl } from '@/shared/lib/handoff'
import { copyToClipboard, inviteMessage } from '@/shared/lib/share'
import {
  generatePassword,
  getEvents,
  getHostName,
  openTab,
  removeEvent,
  saveEvent,
  setHostName,
  updateEvent,
  type StoredEvent,
} from './storage'
import { nextDays } from './dates'
import { WhenPicker, type When } from './WhenPicker'

const APP_URL = (import.meta.env.VITE_APP_URL?.trim() || 'https://meetly-soon.vercel.app').replace(/\/+$/, '')
const eventUrl = (shortCode: string) => `${APP_URL}/e/${encodeURIComponent(shortCode)}`

function buildValues(title: string, when: When): EventFormValues {
  return {
    title,
    eventType: when.mode === 'weekly' ? EventType.Weekdays : EventType.Dates,
    dates: when.mode === 'dates' ? when.dates : [],
    weekdays: when.weekdays,
    dailyStartTime: when.start,
    dailyEndTime: when.end,
  }
}

/** Token còn dùng được thì giữ, sắp hết hạn thì đăng nhập lại bằng mật khẩu extension đã lưu */
async function freshSession(event: StoredEvent): Promise<StoredEvent> {
  if (new Date(event.expiresAt).getTime() - Date.now() > 60_000) return event
  const access = await accessParticipant(event.shortCode, { username: event.username, password: event.password })
  const refreshed = { ...event, accessToken: access.accessToken, expiresAt: access.expiresAt }
  await updateEvent(event.shortCode, { accessToken: refreshed.accessToken, expiresAt: refreshed.expiresAt })
  return refreshed
}

async function openOnWeb(event: StoredEvent, page: '' | 'share' = '') {
  try {
    const session = await freshSession(event)
    openTab(
      handoffUrl(APP_URL, session.shortCode, {
        participantId: session.participantId,
        username: session.username,
        isAdmin: true,
        accessToken: session.accessToken,
      }, page),
    )
  } catch {
    // Không lấy lại được phiên (VD sự kiện đã bị xoá): vẫn mở trang để người dùng tự đăng nhập
    openTab(eventUrl(event.shortCode))
  }
}

export function Popup() {
  const t = useT()
  const { locale, toggle } = useLocale()
  const [tab, setTab] = useState<'create' | 'events'>('create')
  const [created, setCreated] = useState<StoredEvent | null>(null)

  return (
    <div className="flex min-h-[30rem] w-[22.5rem] flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <a href={APP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <img src="/icons/32.png" alt="" aria-hidden="true" className="size-6" />
          Meetly
        </a>
        <Button variant="ghost" size="sm" className="gap-1 px-2 has-[>svg]:px-2" onClick={toggle} aria-label={t('header.switchLanguage')}>
          <Languages aria-hidden="true" />
          <span className="text-xs font-semibold">{locale === 'vi' ? 'VI' : 'EN'}</span>
        </Button>
      </header>

      <nav className="grid grid-cols-2 gap-1 p-2" aria-label="Meetly">
        <TabButton active={tab === 'create'} onClick={() => setTab('create')} icon={<CalendarPlus aria-hidden="true" />}>
          {t('ext.tabCreate')}
        </TabButton>
        <TabButton active={tab === 'events'} onClick={() => setTab('events')} icon={<ListChecks aria-hidden="true" />}>
          {t('ext.tabEvents')}
        </TabButton>
      </nav>

      <main className="flex-1 px-4">
        {tab === 'events' ? (
          <EventsView />
        ) : created ? (
          <CreatedView event={created} onDone={() => setCreated(null)} />
        ) : (
          <CreateView onCreated={setCreated} />
        )}
      </main>
    </div>
  )
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-medium transition-colors [&_svg]:size-4',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {icon}
      {children}
    </button>
  )
}

function CreateView({ onCreated }: { onCreated: (event: StoredEvent) => void }) {
  const t = useT()
  const [title, setTitle] = useState('')
  const [hostName, setHostNameState] = useState('')
  const [when, setWhen] = useState<When>(() => ({
    mode: 'dates',
    dates: nextDays(7),
    weekdays: [1, 2, 3, 4, 5],
    start: HOUR_PRESETS[0].start,
    end: HOUR_PRESETS[0].end,
  }))
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  useEffect(() => {
    void getHostName().then(setHostNameState)
  }, [])

  const dayCount = when.mode === 'dates' ? when.dates.length : when.weekdays.length
  const summary = [
    when.mode === 'dates' ? t('common.days', { count: dayCount }) : t('days.perWeek', { count: dayCount }),
    `${when.start}–${when.end}`,
    describeDuration(dailyMinutes(when.start, when.end)),
  ].join(' · ')

  async function submit(formEvent: FormEvent) {
    formEvent.preventDefault()
    const name = title.trim()
    const username = hostName.trim()
    if (!name) return setError(t('validation.nameRequired'))
    if (dayCount === 0) return setError(t(when.mode === 'dates' ? 'validation.pickDate' : 'validation.pickWeekday'))
    if (username.length < INPUT_LIMITS.usernameMinLength)
      return setError(t('validation.displayNameMin', { min: INPUT_LIMITS.usernameMinLength }))

    setError(undefined)
    setSubmitting(true)
    try {
      const password = generatePassword()
      const result = await createEvent({ ...toEventFields(buildValues(name, when)), admin: { username, password } })
      const stored: StoredEvent = {
        shortCode: result.shortCode,
        title: name,
        createdAt: new Date().toISOString(),
        participantId: result.participantId,
        username,
        password,
        accessToken: result.accessToken,
        expiresAt: result.expiresAt,
      }
      await Promise.all([saveEvent(stored), setHostName(username)])
      await copyToClipboard(eventUrl(result.shortCode), t('share.linkCopied'))
      onCreated(stored)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('api.createEvent'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-3.5">
      <div className="grid gap-1.5">
        <label htmlFor="ext-title" className="text-xs text-muted-foreground">
          {t('common.eventName')}
        </label>
        <Input
          id="ext-title"
          autoFocus
          autoComplete="off"
          placeholder={t('ext.titlePlaceholder')}
          maxLength={INPUT_LIMITS.titleMaxLength}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <WhenPicker value={when} onChange={setWhen} />

      <div className="grid gap-1.5 border-t pt-3.5">
        <label htmlFor="ext-host" className="text-xs text-muted-foreground">
          {t('common.yourName')}
        </label>
        <Input
          id="ext-host"
          autoComplete="name"
          maxLength={INPUT_LIMITS.usernameMaxLength}
          value={hostName}
          onChange={(event) => setHostNameState(event.target.value)}
        />
        <p className="text-[11px] leading-4 text-muted-foreground">{t('ext.passwordNote')}</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {/* Nút luôn ở đáy popup kể cả khi nội dung dài phải cuộn */}
      <div className="sticky bottom-0 -mx-4 grid gap-1.5 border-t bg-background/95 px-4 pt-2.5 pb-3 backdrop-blur">
        <p className="truncate text-center text-[11px] text-muted-foreground tabular-nums">{summary}</p>
        <Button type="submit" size="lg" disabled={submitting} className="w-full">
          {submitting && <MeetlyLoader size="xs" tone="current" decorative />}
          {submitting ? t('create.creating') : t('ext.createAndCopy')}
        </Button>
      </div>
    </form>
  )
}

function CreatedView({ event, onDone }: { event: StoredEvent; onDone: () => void }) {
  const t = useT()
  const url = eventUrl(event.shortCode)

  return (
    // minmax(0,1fr): không để link dài kéo cột rộng quá khung popup 360px
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 pt-2 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
        <Check className="size-5" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{t('ext.linkCopied')}</p>
        <h2 className="mt-1 text-xl font-semibold text-balance">{event.title}</h2>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-muted py-1.5 pr-1.5 pl-3 text-left">
        <span className="min-w-0 flex-1 truncate text-sm">{url}</span>
        <Button size="sm" variant="outline" onClick={() => void copyToClipboard(url, t('share.linkCopied'))}>
          <Copy aria-hidden="true" />
          {t('common.copy')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => void copyToClipboard(inviteMessage(event.title, url), t('share.inviteCopied'))}>
          {t('share.copyMessage')}
        </Button>
        <Button onClick={() => void openOnWeb(event, 'share')}>
          {t('ext.openEvent')}
          <ArrowUpRight aria-hidden="true" />
        </Button>
      </div>
      <button type="button" onClick={onDone} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
        {t('ext.createAnother')}
      </button>
    </div>
  )
}

function EventsView() {
  const t = useT()
  const queryClient = useQueryClient()
  const { data: events } = useQuery({ queryKey: ['ext-events'], queryFn: getEvents })

  if (!events) return <MeetlyLoader size="md" className="mt-16 w-full" />
  if (events.length === 0)
    return (
      <div className="mt-14 text-center">
        <p className="font-medium">{t('ext.emptyTitle')}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('ext.emptyText')}</p>
      </div>
    )

  return (
    <ul className="grid gap-2">
      {events.map((event) => (
        <EventRow
          key={event.shortCode}
          event={event}
          onRemoved={() => void queryClient.invalidateQueries({ queryKey: ['ext-events'] })}
        />
      ))}
    </ul>
  )
}

function EventRow({ event, onRemoved }: { event: StoredEvent; onRemoved: () => void }) {
  const t = useT()
  // Số người tham gia và trạng thái chốt lấy từ API công khai của sự kiện
  const detail = useQuery({
    queryKey: ['ext-event', event.shortCode],
    queryFn: () => getEvent(event.shortCode),
    retry: false,
    staleTime: 30_000,
  })
  const finalized = detail.data?.status === EventStatus.Finalized

  return (
    <li className="rounded-xl border bg-card p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{event.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            <span className="font-medium tracking-wide">{event.shortCode}</span>
            {detail.data && <> · {t('common.participants', { count: detail.data.participants.length })}</>}
          </p>
        </div>
        {detail.isError ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{t('ext.unavailable')}</span>
        ) : detail.data ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
              finalized ? 'bg-finalized-muted text-finalized' : 'bg-brand-soft text-brand',
            )}
          >
            {finalized ? t('info.finalized') : t('ext.open')}
          </span>
        ) : (
          <MeetlyLoader size="xs" decorative />
        )}
      </div>
      <div className="mt-2.5 flex gap-1.5">
        <Button size="xs" variant="outline" onClick={() => void copyToClipboard(eventUrl(event.shortCode), t('share.linkCopied'))}>
          <Copy aria-hidden="true" />
          {t('common.copyLink')}
        </Button>
        <Button size="xs" variant="outline" onClick={() => void openOnWeb(event)}>
          <ArrowUpRight aria-hidden="true" />
          {t('ext.openEvent')}
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          aria-label={t('ext.copyPassword')}
          title={t('ext.copyPassword')}
          onClick={() => void copyToClipboard(event.password, t('ext.passwordCopied'))}
        >
          <KeyRound aria-hidden="true" />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="text-muted-foreground"
          aria-label={t('ext.remove')}
          title={t('ext.remove')}
          onClick={async () => {
            // Xoá khỏi danh sách là mất luôn mật khẩu host extension đang giữ
            if (!window.confirm(t('ext.removeConfirm'))) return
            await removeEvent(event.shortCode)
            onRemoved()
            toast(t('ext.removed'))
          }}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </li>
  )
}
