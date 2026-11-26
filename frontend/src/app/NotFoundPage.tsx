import { Link } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { useT } from '@/shared/i18n'

/** Chữ số 3×5 ô để "vẽ" 404 bằng ô heatmap */
const DIGITS: Record<string, string[]> = {
  '4': ['101', '101', '111', '001', '001'],
  '0': ['111', '101', '101', '101', '111'],
}

/** Ghép "404" thành lưới 5 hàng, mỗi chữ số cách nhau một cột trống */
const PATTERN = Array.from({ length: 5 }, (_, row) =>
  ['4', '0', '4']
    .map((digit) => DIGITS[digit][row])
    .join('0')
    .split('')
    .map((bit) => bit === '1'),
)

/** Xanh thương hiệu loang từ đỉnh thẻ, giống màn bảo trì và thẻ thông báo */
const GLOW = [
  'radial-gradient(60% 55% at 15% 0%, color-mix(in oklab, var(--primary) 40%, transparent), transparent 70%)',
  'radial-gradient(70% 60% at 85% 0%, color-mix(in oklab, var(--primary) 30%, transparent), transparent 75%)',
].join(', ')

/** Trang 404 cho mọi đường dẫn không có trong router */
export function NotFoundPage() {
  const t = useT()
  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg duration-700 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
        <section className="announce-pill relative overflow-hidden rounded-3xl px-6 pt-9 pb-8 text-center shadow-lift sm:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: GLOW }} />

          {/* "404" vẽ bằng ô heatmap, sáng lên theo đợt sóng chéo */}
          <div aria-hidden="true" className="relative mx-auto grid w-fit grid-cols-11 gap-1 select-none sm:gap-1.5">
            {PATTERN.flatMap((row, rowIndex) =>
              row.map((on, columnIndex) => (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  style={on ? { animationDelay: `${(rowIndex + columnIndex) * 90}ms` } : undefined}
                  className={cn(
                    'size-4 rounded-[5px] border border-foreground/5 sm:size-5',
                    on ? 'maint-wave bg-heat-5' : 'bg-heat-1/60',
                  )}
                />
              )),
            )}
          </div>

          <div className="relative">
            <span className="mt-7 inline-flex items-center rounded-full border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
              {t('notFound.badge')}
            </span>
            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
              {t('notFound.titleBefore')}{' '}
              <span className="font-serif font-normal tracking-normal text-brand italic">{t('notFound.titleEmphasis')}</span>
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-pretty text-muted-foreground">{t('notFound.text')}</p>

            <div className="mt-7 flex flex-col justify-center gap-2.5 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-6">
                <Link to="/">
                  <ArrowLeft aria-hidden="true" />
                  {t('notFound.home')}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6">
                <Link to="/create">
                  <Plus aria-hidden="true" />
                  {t('notFound.create')}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
