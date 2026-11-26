import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { useT } from '@/shared/i18n'
import { useEventActivity } from '@/shared/lib/eventActivity'
import type { Participant } from '@/shared/types'

/** Một người được coi là "vừa hoạt động" trong chừng này thời gian */
const ACTIVE_MS = 8000
const VISIBLE = 6
const TONES = ['bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-fuchsia-500']

/** Mỗi tên luôn ra cùng một màu */
function toneOf(name: string) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return TONES[Math.abs(hash) % TONES.length]
}

interface LiveActivityProps {
  shortCode: string
  participants: Participant[]
  currentUsername?: string
}

/**
 * Avatar những người đã tham gia; ai vừa lưu lịch (qua realtime) thì avatar nháy viền
 * và hiện dòng "Minh vừa cập nhật lịch rảnh" trong vài giây.
 */
export function LiveActivity({ shortCode, participants, currentUsername }: LiveActivityProps) {
  const t = useT()
  const items = useEventActivity((state) => state.items)
  const [now, setNow] = useState(() => Date.now())

  const recent = items.filter(
    (item) =>
      item.shortCode.toUpperCase() === shortCode.toUpperCase() && item.name !== currentUsername && now - item.at < ACTIVE_MS,
  )
  const activeNames = new Set(recent.map((item) => item.name))
  const latest = recent.at(-1)

  // Có hoạt động mới thì đồng hồ chạy mỗi giây để hết hạn đúng lúc; không có thì đứng yên
  useEffect(() => {
    if (recent.length === 0) return
    const timer = window.setTimeout(() => setNow(Date.now()), 1000)
    return () => window.clearTimeout(timer)
  }, [recent.length, now])

  // Mục mới tới sau lần đếm gần nhất: cập nhật đồng hồ ngay để không bị coi là cũ
  useEffect(() => {
    const last = items.at(-1)
    if (!last) return
    const timer = window.setTimeout(() => setNow(Date.now()), 0)
    return () => window.clearTimeout(timer)
  }, [items])

  if (participants.length === 0) return null

  // Người vừa hoạt động được đưa lên đầu hàng avatar
  const ordered = [...participants].sort(
    (a, b) => Number(activeNames.has(b.username)) - Number(activeNames.has(a.username)),
  )
  const shown = ordered.slice(0, VISIBLE)
  const extra = participants.length - shown.length

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex -space-x-1.5" aria-hidden="true">
        {shown.map(({ username }) => (
          <span
            key={username}
            title={username}
            className={cn(
              'grid size-7 place-items-center rounded-full border-2 border-background text-[11px] font-semibold text-white uppercase transition-shadow duration-300',
              toneOf(username),
              activeNames.has(username) && 'z-10 animate-pulse ring-2 ring-primary ring-offset-1 ring-offset-background',
            )}
          >
            {username.trim().charAt(0)}
          </span>
        ))}
        {extra > 0 && (
          <span className="grid size-7 place-items-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground tabular-nums">
            +{extra}
          </span>
        )}
      </div>
      <p aria-live="polite" className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
        <span className="relative flex size-2 shrink-0">
          {latest && <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60 motion-reduce:animate-none" />}
          <span className={cn('relative size-2 rounded-full', latest ? 'bg-brand' : 'bg-brand/40')} />
        </span>
        <span key={latest?.id ?? 'idle'} className="truncate duration-300 animate-in fade-in">
          {latest ? t(`activity.${latest.kind}`, { name: latest.name }) : t('activity.live')}
        </span>
      </p>
    </div>
  )
}
