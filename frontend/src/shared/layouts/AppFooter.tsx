import type { ReactNode } from "react"
import { ArrowRight, Heart, Mail } from "lucide-react"
import { Link } from "react-router-dom"

import { env } from "@/lib/env"
import { isGoogleConfigured } from "@/lib/google"
import { CONTACT_EMAIL } from "@/shared/constants"
import { useT } from "@/shared/i18n"
import { DiscordIcon, GithubIcon, LinkedinIcon, RedditIcon, XIcon } from "@/shared/layouts/SocialIcons"

const GITHUB_URL = "https://github.com/HKBDU/Meetly"

// TODO: điền link thật cho các mạng xã hội còn "#"; link "#" bị ẩn để không hiện nút chết
const SOCIAL_LINKS = [
  { label: "GitHub", href: GITHUB_URL, Icon: GithubIcon },
  { label: "X", href: "#", Icon: XIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "Reddit", href: "#", Icon: RedditIcon },
  { label: "Discord", href: "#", Icon: DiscordIcon },
].filter((link) => link.href !== "#")

const linkClass = "text-sm text-muted-foreground transition-colors hover:text-foreground"

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <nav aria-label={title}>
      <p className="text-xs font-medium tracking-wide text-foreground uppercase">{title}</p>
      <ul className="mt-4 grid gap-3">{children}</ul>
    </nav>
  )
}

/** Footer nhiều cột: thương hiệu, sản phẩm, pháp lý, liên hệ; thanh bản quyền ở dưới */
export function AppFooter() {
  const t = useT()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto w-full max-w-6xl px-4 pt-12 pb-8 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-foreground">
              <img src="/meetly-logo.png" alt="" aria-hidden="true" className="h-6 w-7 object-contain" />
              Meetly
            </Link>
            <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">{t("footer.tagline")}</p>
            <Link
              to="/create"
              className="group mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:bg-primary-hover hover:shadow-lift"
            >
              {t("home.create")}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>

          <Column title={t("footer.product")}>
            <li>
              <Link to="/create" className={linkClass}>
                {t("home.create")}
              </Link>
            </li>
            <li>
              {env.extensionStoreUrl ? (
                <a
                  href={env.extensionStoreUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkClass} inline-flex flex-wrap items-center gap-2`}
                >
                  {t("home.extTitle")}
                  <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    {t("home.extNew")}
                  </span>
                </a>
              ) : (
                <Link to="/#extension" className={`${linkClass} inline-flex flex-wrap items-center gap-2`}>
                  {t("home.extTitle")}
                  <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    {t("home.extBadge")}
                  </span>
                </Link>
              )}
            </li>
            {/* Link phòng họp (Meet, Jitsi...) đã chạy nên luôn "Mới"; nhập giờ bận từ Google Calendar cần OAuth client ID */}
            {isGoogleConfigured ? (
              <>
                <li>
                  <Link to="/#google" className={`${linkClass} inline-flex flex-wrap items-center gap-2`}>
                    {t("home.gCalendar")}
                    <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                      {t("home.extNew")}
                    </span>
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link to="/#google" className={`${linkClass} inline-flex flex-wrap items-center gap-2`}>
                  {t("home.gCalendar")}
                  <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                    {t("home.extBadge")}
                  </span>
                </Link>
              </li>
            )}
            <li>
              <Link to="/#google" className={`${linkClass} inline-flex flex-wrap items-center gap-2`}>
                {t("home.gMeet")}
                <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-medium text-brand">
                  {t("home.extNew")}
                </span>
              </Link>
            </li>
          </Column>

          <Column title={t("footer.legal")}>
            <li>
              <Link to="/privacy" className={linkClass}>
                {t("legal.privacyLink")}
              </Link>
            </li>
            <li>
              <Link to="/terms" className={linkClass}>
                {t("legal.termsLink")}
              </Link>
            </li>
          </Column>

          <Column title={t("footer.contact")}>
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${linkClass} inline-flex items-center gap-2`}>
                <Mail className="size-4" aria-hidden="true" />
                {t("footer.email")}
              </a>
            </li>
            <li>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={`${linkClass} inline-flex items-center gap-2`}>
                <GithubIcon className="size-4" />
                GitHub
              </a>
            </li>
          </Column>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.rights", { year })}</p>
          <div className="flex items-center gap-5">
            <p className="flex items-center gap-1">
              {t("footer.madeWith")} <Heart className="size-3 fill-current text-brand" aria-hidden="true" /> {t("footer.by")}{" "}
              <a href="https://github.com/HKBDU" target="_blank" rel="noreferrer" className="font-medium text-foreground hover:underline hover:underline-offset-2">
                @hkbdu
              </a>
            </p>
            {SOCIAL_LINKS.length > 1 && (
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} className="transition-colors hover:text-foreground">
                    <Icon className="size-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
