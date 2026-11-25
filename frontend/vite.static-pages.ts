import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createServer, type Plugin } from 'vite'

/**
 * Sinh sẵn HTML tĩnh cho `/`, `/privacy`, `/terms` lúc build.
 *
 * Web là SPA nên server chỉ trả khung `<div id="root"></div>` rỗng; bot kiểm duyệt (Google OAuth
 * verification, công cụ tìm kiếm) không chạy JavaScript sẽ thấy trang trống. Nội dung tĩnh được đặt
 * vào trong `#root`, React mount xong sẽ thay thế nên người dùng vẫn thấy app như cũ.
 * Nội dung pháp lý lấy từ `src/features/legal/content.ts` (bản tiếng Anh) để không phải viết hai nơi.
 */

interface LegalSection {
  heading: string
  body: (string | string[])[]
}
interface LegalDocument {
  title: string
  intro: string
  sections: LegalSection[]
}
interface LegalModule {
  LAST_UPDATED: string
  CONTACT_EMAIL: string
  LEGAL_CONTENT: Record<'privacy' | 'terms', Record<'en' | 'vi', LegalDocument>>
}

const SITE = 'Meetly'

/** Trình duyệt có JavaScript ẩn nội dung tĩnh ngay, chờ React vẽ app (không bị chớp); bot không chạy JS vẫn đọc được */
const HIDE_WITH_JS = `<script>document.documentElement.classList.add('js')</script><style>html.js .prerender{display:none}</style>`

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const nav = `<nav class="mt-10 flex flex-wrap gap-4 text-sm"><a class="underline" href="/">Home</a><a class="underline" href="/create">Create an event</a><a class="underline" href="/privacy">Privacy Policy</a><a class="underline" href="/terms">Terms of Service</a></nav>`

function homeHtml(contactEmail: string) {
  return `<main class="prerender mx-auto max-w-3xl px-4 py-16">
  <h1 class="text-4xl font-semibold">${SITE}: find a time that works for everyone</h1>
  <p class="mt-4">${SITE} is a free group scheduling tool. Create a poll, share one link, and everyone marks when they are free on a time grid. ${SITE} combines the answers into a live heatmap and suggests the best meeting times. No account or sign-in is needed.</p>
  <h2 class="mt-8 text-2xl font-semibold">How it works</h2>
  <ol class="mt-3 list-decimal pl-6">
    <li>Create an event: name it, pick the dates or days of the week and the daily hours.</li>
    <li>Share the link or the 6-character event code with your group.</li>
    <li>Each person joins with a display name and marks the times that work for them.</li>
    <li>The host picks the best time from the heatmap and finalizes it. Subscribers get an email.</li>
  </ol>
  <h2 class="mt-8 text-2xl font-semibold">Optional Google Calendar integration</h2>
  <p class="mt-3">Connecting Google is optional and never required to use ${SITE}. If you choose to, ${SITE} can read only the free/busy times of your Google Calendar for the dates of a poll, to pre-fill your availability, and can add the finalized meeting to your calendar. ${SITE} never reads event titles or details. See the <a class="underline" href="/privacy">Privacy Policy</a> for details.</p>
  <p class="mt-8">Contact: <a class="underline" href="mailto:${contactEmail}">${contactEmail}</a></p>
  ${nav}
</main>`
}

function legalHtml(doc: LegalDocument, updated: string, contactEmail: string) {
  const body = doc.sections
    .map((section) => {
      const parts = section.body
        .map((part) =>
          Array.isArray(part)
            ? `<ul class="mt-2 list-disc pl-6">${part.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
            : `<p class="mt-2">${escapeHtml(part)}</p>`,
        )
        .join('')
      return `<section class="mt-8"><h2 class="text-xl font-semibold">${escapeHtml(section.heading)}</h2>${parts}</section>`
    })
    .join('\n')
  return `<main class="prerender mx-auto max-w-3xl px-4 py-16">
  <h1 class="text-4xl font-semibold">${escapeHtml(doc.title)}: ${SITE}</h1>
  <p class="mt-2 text-sm">Last updated: ${updated}</p>
  <p class="mt-6">${escapeHtml(doc.intro)}</p>
  ${body}
  <section class="mt-8"><h2 class="text-xl font-semibold">Contact</h2><p class="mt-2"><a class="underline" href="mailto:${contactEmail}">${contactEmail}</a></p></section>
  ${nav}
</main>`
}

function fillTemplate(template: string, { title, description, root }: { title: string; description: string; root: string }) {
  return template
    .replace('</head>', `${HIDE_WITH_JS}</head>`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(description)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${root}</div>`)
}

export function staticPages(): Plugin {
  let outDir = 'dist'
  let root = process.cwd()
  let alias: Record<string, string> = {}

  return {
    name: 'meetly-static-pages',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
      root = config.root
      alias = { '@': path.resolve(config.root, 'src') }
    },
    async closeBundle() {
      // Nạp content.ts qua Vite để dùng được alias `@/` và TypeScript
      const server = await createServer({
        configFile: false,
        root,
        logLevel: 'silent',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false },
        resolve: { alias },
      })
      let legal: LegalModule
      try {
        legal = (await server.ssrLoadModule('/src/features/legal/content.ts')) as LegalModule
      } finally {
        await server.close()
      }

      const indexPath = path.join(outDir, 'index.html')
      const template = await readFile(indexPath, 'utf8')
      const { LEGAL_CONTENT, LAST_UPDATED, CONTACT_EMAIL } = legal

      // Khung rỗng cho mọi đường dẫn khác của SPA (vercel.json trỏ fallback vào đây),
      // để trang sự kiện không chớp nội dung trang chủ
      await writeFile(path.join(outDir, 'app.html'), template)

      await writeFile(
        indexPath,
        fillTemplate(template, {
          title: `${SITE}: find a time that works for everyone`,
          description: `${SITE} is a free group scheduling tool: create a poll, share one link and see when everyone is free on a live heatmap. No sign-up needed.`,
          root: homeHtml(CONTACT_EMAIL),
        }),
      )

      for (const kind of ['privacy', 'terms'] as const) {
        const doc = LEGAL_CONTENT[kind].en
        const dir = path.join(outDir, kind)
        await mkdir(dir, { recursive: true })
        await writeFile(
          path.join(dir, 'index.html'),
          fillTemplate(template, {
            title: `${doc.title} · ${SITE}`,
            description: doc.intro,
            root: legalHtml(doc, LAST_UPDATED, CONTACT_EMAIL),
          }),
        )
      }
    },
  }
}
