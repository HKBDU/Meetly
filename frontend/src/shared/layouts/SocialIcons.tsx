/**
 * Icon mạng xã hội dùng cho footer. lucide-react bản đang dùng (v1.x) đã bỏ
 * hẳn các icon thương hiệu (Github/Twitter/Linkedin...) nên phải tự vẽ SVG
 * đơn giản (path chính thức, tối giản, đơn sắc) - không có thư viện icon nào
 * trong dự án cung cấp sẵn các icon này.
 */
type IconProps = { className?: string }

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 2H22l-7.6 8.7L23.3 22H16.6l-5.2-6.8L5.4 22H2.3l8.1-9.3L1.7 2h6.9l4.7 6.2L18.9 2Zm-1.2 18h1.7L7.4 3.9H5.6L17.7 20Z" />
    </svg>
  )
}

export function GithubIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.2c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.2C22 6.58 17.52 2 12 2Z" />
    </svg>
  )
}

export function LinkedinIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.94 5a2 2 0 1 1-4-.02 2 2 0 0 1 4 .02ZM7 8.48H3V21h4V8.48Zm6.32 0H9.35V21h3.94v-6.57c0-3.66 4.77-3.96 4.77 0V21H22v-7.93c0-6.17-6.98-5.94-8.68-2.91V8.48Z" />
    </svg>
  )
}

export function RedditIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.14c0-1.1-.9-2-2-2-.53 0-1 .2-1.36.53-1.34-.93-3.17-1.53-5.2-1.6l.98-3.1 2.75.6a1.5 1.5 0 1 0 .17-.85l-3.1-.68a.44.44 0 0 0-.52.3l-1.1 3.5c-2.1.05-4 .66-5.37 1.62A1.96 1.96 0 0 0 4 12.14c0 .74.4 1.38 1 1.73-.02.16-.03.31-.03.47 0 2.47 2.9 4.48 6.47 4.48s6.47-2 6.47-4.48c0-.16-.01-.31-.03-.46.6-.35 1.02-1 1.02-1.74Zm-12.9 1.4a1.13 1.13 0 1 1 2.26 0 1.13 1.13 0 0 1-2.26 0Zm6.93 3.03c-.8.8-2.33.86-2.76.86-.44 0-1.97-.07-2.76-.86a.35.35 0 0 1 .5-.5c.5.5 1.6.68 2.26.68.66 0 1.77-.18 2.26-.68a.35.35 0 1 1 .5.5Zm-.2-1.9a1.13 1.13 0 1 1 0-2.26 1.13 1.13 0 0 1 0 2.26Z" />
    </svg>
  )
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.32 5.37A18.6 18.6 0 0 0 15.9 4c-.2.35-.42.83-.58 1.2a17.2 17.2 0 0 0-5.64 0A8.3 8.3 0 0 0 9.1 4a18.5 18.5 0 0 0-4.42 1.37C1.9 9.3 1.16 13.1 1.5 16.86a18.7 18.7 0 0 0 5.7 2.88c.46-.63.87-1.3 1.22-2a12 12 0 0 1-1.92-.92c.16-.12.32-.24.47-.37a13.4 13.4 0 0 0 11.5 0c.16.13.31.25.47.37-.61.36-1.26.67-1.93.92.35.7.76 1.37 1.22 2a18.6 18.6 0 0 0 5.7-2.88c.4-4.38-.68-8.14-2.61-11.49ZM8.68 14.6c-.87 0-1.58-.8-1.58-1.79 0-.98.69-1.79 1.58-1.79.9 0 1.6.81 1.58 1.79 0 .99-.69 1.79-1.58 1.79Zm6.64 0c-.87 0-1.58-.8-1.58-1.79 0-.98.7-1.79 1.58-1.79.9 0 1.6.81 1.58 1.79 0 .99-.68 1.79-1.58 1.79Z" />
    </svg>
  )
}
