import { useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarCheck, Check, Puzzle, Sparkles, Video, type LucideIcon } from 'lucide-react'

import { env } from '@/lib/env'
import { isGoogleConfigured } from '@/lib/google'
import { cn } from '@/lib/utils'
import { useT, type MessageKey } from '@/shared/i18n'
import { parseEventCode } from '@/shared/lib/share'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { AnnouncementCard } from '../components/AnnouncementCard'
import { GoogleFlowDemo } from '../components/home/GoogleFlowDemo'
import { GOOGLE_DURATIONS, GOOGLE_FRAMES, GOOGLE_SCENES, sceneLength, sceneStart } from '../components/home/googleScenes'
import { ExtensionDemo } from '../components/home/ExtensionDemo'
import { HowItWorks } from '../components/home/HowItWorks'
import { LiveHeatmapDemo } from '../components/home/LiveHeatmapDemo'
import { StatsStrip } from '../components/home/StatsStrip'
import { useDemoPlaying, useFrameLoop, useReducedMotion } from '../components/home/demoPlayback'


/** Giới thiệu extension sắp ra mắt, kèm bản xem trước popup (chỉ để trang trí) */
function ExtensionTeaser() {
  const t = useT()
  return (
    <section id="extension" aria-labelledby="extension-heading" className="mt-24 scroll-mt-24 overflow-hidden rounded-3xl border bg-card shadow-soft">
      <div className="grid items-center gap-10 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            <Puzzle className="size-3.5" aria-hidden="true" />
            {t(env.extensionStoreUrl ? 'home.extAvailable' : 'home.extBadge')}
          </span>
          <h2 id="extension-heading" className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {t('home.extTitle')}
          </h2>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">{t('home.extText')}</p>
          <ul className="mt-6 grid gap-2.5 text-sm">
            {(['home.extPoint1', 'home.extPoint2', 'home.extPoint3'] as const).map((key) => (
              <li key={key} className="flex items-center gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
          {env.extensionStoreUrl && (
            <Button asChild size="lg" className="mt-7 h-12 px-6">
              <a href={env.extensionStoreUrl} target="_blank" rel="noreferrer">
                <Puzzle aria-hidden="true" />
                {t('home.extInstall')}
                <ArrowUpRight aria-hidden="true" />
              </a>
            </Button>
          )}
        </div>

        <ExtensionDemo />
      </div>
    </section>
  )
}

/**
 * Ý nào trong khối Google đã dùng được: "Thêm vào lịch" không cần OAuth nên luôn mới;
 * nhập giờ bận chỉ mới khi có OAuth client ID (không có thì nút nhập bị ẩn); Google Meet chưa làm.
 */
const GOOGLE_POINT_LIVE: Record<string, boolean> = {
  'home.gPoint1': true,
  'home.gPoint2': false,
  'home.gPoint3': isGoogleConfigured,
}

/**
 * Thanh "Sắp ra mắt" chỉ giữ thứ chưa ra mắt: extension bị bỏ khi đã lên Chrome Web Store;
 * khi có OAuth client ID thì Google Calendar đã dùng được, mục Google chỉ còn Google Meet.
 */
const ANNOUNCEMENTS = (
  [
    { target: 'extension', icon: Puzzle, label: 'home.extTitle' },
    isGoogleConfigured
      ? { target: 'google', icon: Video, label: 'home.gMeet' }
      : { target: 'google', icon: CalendarCheck, label: 'home.gShort' },
  ] satisfies { target: string; icon: LucideIcon; label: MessageKey }[]
).filter(({ target }) => !(target === 'extension' && env.extensionStoreUrl))

/** Thanh "Sắp ra mắt" đầu trang: một nhãn chung, mỗi sản phẩm là một link cuộn mượt tới khối giới thiệu */
function AnnounceBar() {
  const t = useT()
  return (
    <nav
      aria-label={t('home.extBadge')}
      className="announce-pill inline-flex max-w-full items-center gap-1 rounded-full py-1 pr-1.5 pl-1 text-xs"
    >
      <span className="announce-shine inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2 py-0.5 font-medium text-primary-foreground">
        <Sparkles className="size-3" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{t('home.extBadge')}</span>
      </span>
      {ANNOUNCEMENTS.map(({ target, icon: Icon, label }, index) => (
        <span key={target} className="flex min-w-0 items-center">
          {index > 0 && <span className="mx-0.5 h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />}
          <a
            href={`#${target}`}
            onClick={(event) => {
              event.preventDefault()
              document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="group inline-flex min-w-0 items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-brand-soft hover:text-brand"
          >
            <Icon className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-brand" aria-hidden="true" />
            <span className="truncate">{t(label)}</span>
            <ArrowRight className="hidden size-3 shrink-0 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
          </a>
        </span>
      ))}
    </nav>
  )
}

/** Mỗi tích hợp lịch có một cảnh demo và nhãn trạng thái ra mắt riêng. */
function GoogleTeaser() {
  const t = useT()
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const playing = useDemoPlaying(sectionRef) && !reducedMotion
  const [frameIndex, setFrameIndex] = useFrameLoop(GOOGLE_DURATIONS, playing)
  const { scene, phase } = GOOGLE_FRAMES[frameIndex]
  // Bấm chọn lại thì thanh tiến trình chạy lại từ đầu
  const [picks, setPicks] = useState(0)
  // Tắt chuyển động: giữ cảnh đang chọn ở trạng thái đã xong
  const shownPhase = reducedMotion ? GOOGLE_SCENES[scene].phases.length - 1 : phase

  return (
    <section
      ref={sectionRef}
      id="google"
      aria-labelledby="google-heading"
      className="mt-8 scroll-mt-24 overflow-hidden rounded-3xl border bg-card shadow-soft"
    >
      <div className="grid items-center gap-10 p-6 sm:p-10 md:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="order-last md:order-first">
          <GoogleFlowDemo scene={scene} phase={shownPhase} />
        </div>

        <div>
          <h2 id="google-heading" className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            {t('home.gTitle')}
          </h2>
          <p className="mt-3 max-w-md text-pretty text-muted-foreground">{t('home.gText')}</p>
          {/* Bấm một tính năng để xem demo của nó; thanh mảnh bên dưới cho biết còn bao lâu tới cảnh kế */}
          <ul className="mt-6 grid gap-1 text-sm">
            {GOOGLE_SCENES.map(({ key, icon: Icon }, index) => {
              const active = index === scene
              return (
                <li key={key}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setFrameIndex(sceneStart(index))
                      setPicks((count) => count + 1)
                    }}
                    className={cn(
                      'relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-left transition-colors',
                      active ? 'bg-brand-soft/70 text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    )}
                  >
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full transition-colors',
                        active ? 'bg-primary text-primary-foreground' : 'bg-brand-soft text-brand',
                      )}
                    >
                      <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <span>{t(key)}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {t(GOOGLE_POINT_LIVE[key] ? 'calendar.new' : 'home.extBadge')}
                      </span>
                    </span>
                    {active && !reducedMotion && (
                      <span
                        key={`${scene}-${picks}`}
                        aria-hidden="true"
                        style={
                          {
                            animationDuration: `${sceneLength(index)}ms`,
                            animationPlayState: playing ? 'running' : 'paused',
                          } as CSSProperties
                        }
                        className="demo-progress absolute inset-x-3 bottom-0 h-0.5 origin-left rounded-full bg-primary/60"
                      />
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">{t('home.gOptional')}</p>
        </div>
      </div>
    </section>
  )
}

export function HomePage() {
  const t = useT()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  // Lưu cờ thay vì câu lỗi để đổi ngôn ngữ thì câu lỗi đổi theo
  const [error, setError] = useState(false)

  function join(event: React.FormEvent) {
    event.preventDefault()
    const shortCode = parseEventCode(code)
    if (!shortCode) {
      setError(true)
      return
    }
    navigate(`/e/${encodeURIComponent(shortCode)}`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:pt-20">
      <section className="text-center">
        {/* Thông báo sắp ra mắt ngay đầu trang; bấm để cuộn tới phần giới thiệu bên dưới */}
        <AnnounceBar />
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
          {t('home.titleBefore')}{' '}
          <span className="font-serif font-normal tracking-normal italic">{t('home.titleEmphasis')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-pretty text-muted-foreground sm:text-lg">
          {t('home.subtitle')}
        </p>

        <div className="mx-auto mt-9 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center">
          <Button size="lg" className="h-12 px-6" onClick={() => navigate('/create')}>
            {t('home.create')}
            <ArrowRight aria-hidden="true" />
          </Button>

          <form onSubmit={join} noValidate className="grid gap-1.5 text-left sm:w-64">
            <FieldLabel htmlFor="join-code" className="sr-only">
              {t('home.codeLabel')}
            </FieldLabel>
            <div className="flex h-12 items-center rounded-full border bg-card pr-1.5 pl-5 shadow-[0_1px_2px_rgb(12_10_9/0.04)] transition-shadow focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
              <input
                id="join-code"
                placeholder={t('home.codePlaceholder')}
                autoComplete="off"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={code}
                aria-invalid={error}
                onChange={(event) => {
                  setCode(event.target.value)
                  setError(false)
                }}
              />
              <Button type="submit" size="icon-sm" variant="secondary" aria-label={t('home.join')}>
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            {error && <FieldError className="pl-5 text-xs">{t('home.codeError')}</FieldError>}
          </form>
        </div>
      </section>

      <LiveHeatmapDemo />

      <HowItWorks />
      <StatsStrip />

      <ExtensionTeaser />
      <GoogleTeaser />
      <AnnouncementCard />
    </div>
  )
}
