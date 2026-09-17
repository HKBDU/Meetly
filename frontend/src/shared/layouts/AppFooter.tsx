import { CalendarClock, Heart } from "lucide-react"

import {
  DiscordIcon,
  GithubIcon,
  LinkedinIcon,
  RedditIcon,
  XIcon,
} from "@/shared/layouts/SocialIcons"

// TODO: điền đúng link mạng xã hội thật của dự án - "#" chỉ là placeholder
// hiển thị đúng icon theo ảnh mẫu, KHÔNG trỏ tới trang thật nào.
const SOCIAL_LINKS = [
  { label: "X", href: "#", Icon: XIcon },
  { label: "GitHub", href: "https://github.com/HKBDU/Meetly", Icon: GithubIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
  { label: "Reddit", href: "#", Icon: RedditIcon },
  { label: "Discord", href: "#", Icon: DiscordIcon },
] as const

/** Footer cố định cuối trang - hiển thị xuyên suốt cả 3 màn Auth/Overview/Personal */
export function AppFooter() {
  return (
    <footer className="flex flex-col gap-3 bg-primary px-4 py-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div>
        <div className="flex items-center gap-2 text-lg font-bold">
          <CalendarClock className="size-5" />
          meetly
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs opacity-90">
          Made with <Heart className="size-3 fill-current" /> by{" "}
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
