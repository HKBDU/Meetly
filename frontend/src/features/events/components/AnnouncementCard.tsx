import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowUpRight, CalendarCheck, Puzzle, Sparkles, Video, X } from 'lucide-react'

import { env } from '@/lib/env'
import { cn } from '@/lib/utils'
import { useT, type MessageKey } from '@/shared/i18n'
import { Button } from '@/shared/components/ui/button'

/** Ba icon ở phần đầu thẻ: lệch góc và lệch nhịp để trông tự nhiên */
const FEATURE_ICONS = [
  { icon: CalendarCheck, tilt: '-10deg', delay: '0s', big: false },
  { icon: Puzzle, tilt: '0deg', delay: '-1.2s', big: true },
  { icon: Video, tilt: '10deg', delay: '-2.4s', big: false },
]

/** Xanh thương hiệu đậm ở đỉnh, loang mượt xuống nền thẻ (sáng hay tối đều tự hoà vì dùng transparent) */
const GLOW = [
  'radial-gradient(60% 55% at 15% 0%, color-mix(in oklab, var(--primary) 70%, white 30%), transparent 70%)',
  'radial-gradient(70% 60% at 85% 5%, var(--primary), transparent 75%)',
  'radial-gradient(90% 45% at 50% 0%, var(--primary), transparent 100%)',
].join(', ')

type AnnouncementItem = { icon: typeof Puzzle; title: MessageKey; text: MessageKey; target: string }

const SOON_ITEMS: AnnouncementItem[] = [
  { icon: Puzzle, title: 'home.extTitle', text: 'home.annSoonExt', target: 'extension' },
  { icon: CalendarCheck, title: 'home.gShort', text: 'home.annSoonGoogle', target: 'google' },
]

/** Đợt ra mắt: extension, Google Calendar, phòng họp online (Meet/Zoom dán link hoặc Jitsi tạo một chạm) */
const LAUNCH_ITEMS: AnnouncementItem[] = [
  { icon: Puzzle, title: 'home.extTitle', text: 'home.annLaunchExt', target: 'extension' },
  { icon: CalendarCheck, title: 'home.gCalendar', text: 'home.annLaunchCalendar', target: 'google' },
  { icon: Video, title: 'home.annLaunchMeetTitle', text: 'home.annLaunchMeet', target: 'google' },
]

const STORAGE_KEY = 'meetly-announcement-dismissed'
/** Đổi id khi có thông báo mới */
const ANNOUNCEMENT_ID = env.extensionStoreUrl ? 'launch-3-features-v1' : 'coming-soon-v1'
const SHOW_DELAY_MS = 1800

/**
 * Đóng thẻ chỉ có tác dụng trong lần vào web hiện tại (sessionStorage): quay lại trang chủ trong
 * cùng tab không bật lại, còn lần sau mở web thì thẻ hiện lại.
 */
function wasDismissed() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === ANNOUNCEMENT_ID
  } catch {
    return false
  }
}

function rememberDismissed() {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, ANNOUNCEMENT_ID)
  } catch {
    // sessionStorage bị chặn: chỉ ẩn tới khi tải lại trang
  }
}

/**
 * Thẻ thông báo góc dưới trang chủ: mỗi lần vào web đều hiện sau một nhịp ngắn, không chặn thao tác.
 * Ẩn trên màn hình nhỏ để không che nội dung.
 */
export function AnnouncementCard() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const live = Boolean(env.extensionStoreUrl)

  useEffect(() => {
    if (wasDismissed()) return
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      rememberDismissed()
      setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function dismiss() {
    rememberDismissed()
    setOpen(false)
  }

  /** Bấm một tính năng: đóng thẻ và cuộn tới khối giới thiệu của nó */
  function showFeature(target: string) {
    dismiss()
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const items = live ? LAUNCH_ITEMS : SOON_ITEMS

  if (!open) return null

  return (
    // Lớp ngoài lo hiệu ứng trượt vào; lớp trong dùng viền sáng chạy vòng (hai animation không đè nhau)
    <aside
      aria-labelledby="announcement-title"
      className="fixed right-6 bottom-6 z-50 hidden w-[21rem] duration-500 animate-in fade-in slide-in-from-bottom-6 motion-reduce:animate-none sm:block"
    >
      <div className="announce-pill relative overflow-hidden rounded-2xl shadow-lift">
        {/* Nền xanh loang: đậm ở đỉnh, tan dần vào thân thẻ */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: GLOW }} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(rgb(255_255_255/0.09)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.09)_1px,transparent_1px)] bg-[size:14px_14px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        {/* Phần đầu trang trí: icon các tính năng */}
        <div aria-hidden="true" className="relative h-14">
          <div className="absolute inset-0 flex items-center justify-center gap-2">
            {FEATURE_ICONS.map(({ icon: Icon, tilt, delay, big }) => (
              <span
                key={tilt}
                style={{ '--tilt': tilt, animationDelay: delay } as CSSProperties}
                className={cn(
                  'announce-float grid place-items-center rounded-xl bg-white/95 text-primary shadow-lg ring-1 ring-black/5',
                  big ? 'size-9' : 'size-7',
                )}
              >
                <Icon className={big ? 'size-[18px]' : 'size-3.5'} strokeWidth={2} />
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label={t('home.annClose')}
          className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-black/15 text-white transition-colors hover:bg-black/30"
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>

        <div className="relative px-5 pt-2 pb-4">
          {/* Nhãn "Mới" cùng dòng với tiêu đề cho đỡ một hàng */}
          <div className="flex items-center gap-2">
            <span className="announce-shine inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
              <Sparkles className="size-3" aria-hidden="true" />
              {t(live ? 'home.extNew' : 'home.extBadge')}
            </span>
            <p id="announcement-title" className="min-w-0 text-[15px] leading-snug font-semibold tracking-tight">
              {t(live ? 'home.annLaunchTitle' : 'home.annSoonTitle')}
            </p>
          </div>

          {/* Mỗi tính năng là một dòng bấm được, đưa tới khối giới thiệu trên trang chủ */}
          <ul className="-mx-2 mt-2.5 grid">
            {items.map(({ icon: Icon, title, text, target }) => (
              <li key={title}>
                <button
                  type="button"
                  onClick={() => showFeature(target)}
                  className="group flex w-full items-center rounded-lg px-2 py-1 text-left transition-colors hover:bg-brand-soft/60 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  {/* Mô tả luôn một dòng để thẻ không cao lên */}
                  <span className="min-w-0 flex-1 pl-2.5">
                    <span className="block text-sm leading-5 font-medium">{t(title)}</span>
                    <span className="block truncate text-xs leading-4 text-muted-foreground">{t(text)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center gap-2">
        {live ? (
          <Button asChild size="sm" className="h-8">
            <a href={env.extensionStoreUrl} target="_blank" rel="noreferrer" onClick={dismiss}>
              <Puzzle aria-hidden="true" />
              {t('home.extInstall')}
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-8"
            onClick={() => {
              dismiss()
              document.getElementById('extension')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          >
            {t('home.annMore')}
          </Button>
        )}
            <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={dismiss}>
              {t('home.annLater')}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
