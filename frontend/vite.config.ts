import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

import { staticPages } from './vite.static-pages.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), staticPages()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
})
