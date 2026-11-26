import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Build Chrome extension (Manifest V3) từ `extension/`, dùng chung code trong `src/`.
 *   npm run build:extension  -> dist-extension/ (Chrome: Load unpacked)
 * Đọc biến từ `.env`, `.env.extension`, `.env.extension.local` (xem `.env.extension.example`).
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname)
  const apiBaseUrl = env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '')
  if (!apiBaseUrl) throw new Error('Missing VITE_API_BASE_URL for the extension build (see .env.extension.example)')

  return {
    root: path.resolve(import.meta.dirname, 'extension'),
    envDir: import.meta.dirname,
    publicDir: path.resolve(import.meta.dirname, 'extension/public'),
    plugins: [react(), tailwindcss(), manifest(apiBaseUrl)],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist-extension'),
      emptyOutDir: true,
      // Popup nạp từ ổ đĩa của extension, không qua mạng, nên một file ~500 kB không ảnh hưởng tốc độ
      chunkSizeWarningLimit: 800,
      rollupOptions: { input: path.resolve(import.meta.dirname, 'extension/popup.html') },
    },
  }
})

/** Sinh manifest.json; quyền gọi API chỉ xin đúng domain backend (không cần CORS phía server) */
function manifest(apiBaseUrl: string): Plugin {
  return {
    name: 'meetly-extension-manifest',
    generateBundle() {
      const version = '0.1.0'
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: JSON.stringify(
          {
            manifest_version: 3,
            name: 'Meetly – Quick group scheduling',
            short_name: 'Meetly',
            description: 'Create a Meetly scheduling poll in seconds and copy the link, right from your browser.',
            version,
            action: {
              default_popup: 'popup.html',
              default_title: 'Meetly',
              default_icon: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
            },
            icons: { 16: 'icons/16.png', 32: 'icons/32.png', 48: 'icons/48.png', 128: 'icons/128.png' },
            permissions: ['storage'],
            host_permissions: [`${new URL(apiBaseUrl).origin}/*`],
          },
          null,
          2,
        ),
      })
    },
  }
}
