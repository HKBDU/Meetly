import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import MarqueeImport from 'react-fast-marquee'

import { cn } from '@/lib/utils'
import { CopyButton } from '@/shared/components/CopyButton'
import { buttonVariants } from '@/shared/components/ui/button'
import { useT } from '@/shared/i18n'
import { normalizeMeetingLink } from '../meetingLink'

// The package ships CommonJS with a nested default export in Vite's browser bundle.
const Marquee = (MarqueeImport as unknown as { default?: typeof MarqueeImport }).default ?? MarqueeImport

function MeetingUrlText({ url }: { url: string }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    if (!viewport || !measure) return
    const update = () => setOverflows(measure.scrollWidth > viewport.clientWidth + 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    observer.observe(measure)
    return () => observer.disconnect()
  }, [url])

  return (
    <div ref={viewportRef} className="relative min-w-0 flex-1 overflow-hidden text-left">
      <span ref={measureRef} aria-hidden="true" className="pointer-events-none invisible absolute w-max whitespace-nowrap">{url}</span>
      {overflows && !reducedMotion ? (
        <Marquee pauseOnHover pauseOnClick speed={24} gradient={false} className="min-w-0">
          <span className="pr-5">{url}</span>
        </Marquee>
      ) : (
        <span className="block truncate">{url}</span>
      )}
    </div>
  )
}

interface MeetingRoomActionProps {
  meetingUrl: string | null
  mode: 'copy' | 'open'
  className?: string
  style?: CSSProperties
}

/** Keep the URL readable inside a narrow action without changing its full copy/open target. */
export function MeetingRoomAction({ meetingUrl, mode, className, style }: MeetingRoomActionProps) {
  const t = useT()
  const result = normalizeMeetingLink(meetingUrl ?? '')
  if (!result.url) return null
  const url = result.url
  const actionClass = cn('min-w-0 justify-start overflow-hidden text-brand', className)

  if (mode === 'copy') {
    return (
      <CopyButton
        value={url}
        successMessage={t('meet.linkCopied')}
        variant="outline"
        size="sm"
        iconPosition="end"
        className={actionClass}
        style={style}
        aria-label={`${t('meet.copyLink')}: ${url}`}
        title={url}
      >
        <MeetingUrlText url={url} />
      </CopyButton>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), actionClass)}
      style={style}
      aria-label={`${t('meet.openLink')}: ${url}`}
      title={url}
    >
      <MeetingUrlText url={url} />
      <ArrowUpRight aria-hidden="true" />
    </a>
  )
}
