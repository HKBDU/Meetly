import { Heart } from "lucide-react"

import {
  DiscordIcon,
  GithubIcon,
  LinkedinIcon,
  RedditIcon,
  XIcon,
} from "@/shared/layouts/SocialIcons"
import { useT } from "@/shared/i18n"

// TODO: thay các href "#" bằng link mạng xã hội thật
const SOCIAL_LINKS = [
  { label: "X", href: "#", Icon: XIcon },
  { label: "GitHub", href: "https://github.com/HKBDU/Meetly", Icon: GithubIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "Reddit", href: "#", Icon: RedditIcon },
  { label: "Discord", href: "#", Icon: DiscordIcon },
] as const

export function AppFooter() {
  const t = useT()
  return (
    <footer className="flex flex-col gap-3 border-t bg-card/60 px-4 py-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="grid h-6 w-7 shrink-0 place-items-center">
            <img src="/meetly-logo.png" alt="" aria-hidden="true" className="h-full w-full object-contain" />
          </span>
          meetly
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs">
          {t("footer.madeWith")} <Heart className="size-3 fill-current" /> {t("footer.by")}{" "}
          <a
            href="https://github.com/HKBDU"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            @hkbdu
          </a>
        </p>
      </div>

      <div className="flex items-center gap-4">
        {SOCIAL_LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="opacity-90 transition-opacity hover:opacity-100"
          >
            <Icon className="size-4" />
          </a>
        ))}
      </div>
    </footer>
  )
}
