import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'

import { dateFormatter, fromIsoDate } from '@/lib/date-time'
import { useLocale, useT } from '@/shared/i18n'
import { CONTACT_EMAIL, LAST_UPDATED, LEGAL_CONTENT } from './content'

const sectionId = (index: number) => `section-${index + 1}`

/** Trang văn bản pháp lý: mục lục bên trái (desktop), nội dung đánh số bên phải */
function LegalPage({ kind }: { kind: 'privacy' | 'terms' }) {
  const t = useT()
  const { locale } = useLocale()
  const document_ = LEGAL_CONTENT[kind][locale]
  const otherKind = kind === 'privacy' ? 'terms' : 'privacy'
  const updated = dateFormatter({ day: 'numeric', month: 'long', year: 'numeric' }).format(fromIsoDate(LAST_UPDATED))

  useEffect(() => {
    const previous = document.title
    document.title = `${document_.title} · Meetly`
    return () => {
      document.title = previous
    }
  }, [document_.title])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6 pb-20 sm:pt-10">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('header.home')}
      </Link>

      <header className="mt-8 border-b pb-8">
        <p className="text-sm text-muted-foreground">{t('legal.updated', { date: updated })}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">{document_.title}</h1>
        <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{document_.intro}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label={t('legal.contents')} className="hidden lg:block">
          <div className="sticky top-24">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('legal.contents')}</p>
            <ol className="mt-3 grid gap-2 text-sm">
              {document_.sections.map((section, index) => (
                <li key={section.heading}>
                  <a href={`#${sectionId(index)}`} className="text-muted-foreground transition-colors hover:text-foreground">
                    {section.heading}
                  </a>
                </li>
              ))}
              <li>
                <a href="#contact" className="text-muted-foreground transition-colors hover:text-foreground">
                  {t('legal.contact')}
                </a>
              </li>
            </ol>
          </div>
        </nav>

        <article className="min-w-0 max-w-2xl">
          {document_.sections.map((section, index) => (
            <section key={section.heading} id={sectionId(index)} className="scroll-mt-24 border-b py-7 first:pt-0">
              <h2 className="flex items-baseline gap-3 text-lg font-semibold">
                <span className="font-serif text-xl font-normal text-muted-foreground italic tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {section.heading}
              </h2>
              <div className="mt-3 grid gap-3 text-[15px] leading-7 text-foreground/85">
                {section.body.map((block, blockIndex) =>
                  Array.isArray(block) ? (
                    <ul key={blockIndex} className="grid gap-2 pl-5 marker:text-brand [list-style:disc]">
                      {block.map((item) => (
                        <li key={item} className="pl-1">
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p key={blockIndex}>{block}</p>
                  ),
                )}
              </div>
            </section>
          ))}

          <section id="contact" className="mt-8 scroll-mt-24 rounded-2xl border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold">{t('legal.contact')}</h2>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{t('legal.contactText')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-sm font-medium text-brand transition-opacity hover:opacity-80"
            >
              <Mail className="size-4" aria-hidden="true" />
              {CONTACT_EMAIL}
            </a>
          </section>

          <p className="mt-8 text-sm text-muted-foreground">
            {t(otherKind === 'terms' ? 'legal.seeTerms' : 'legal.seePrivacy')}{' '}
            <Link to={`/${otherKind}`} className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
              {LEGAL_CONTENT[otherKind][locale].title}
            </Link>
          </p>
        </article>
      </div>
    </div>
  )
}

export const PrivacyPage = () => <LegalPage kind="privacy" />
export const TermsPage = () => <LegalPage kind="terms" />
