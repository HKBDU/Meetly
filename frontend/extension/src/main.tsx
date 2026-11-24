import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './popup.css'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { Toaster } from '@/shared/components/ui'
import { getLocale } from '@/shared/i18n'
import { Popup } from './Popup'

// Popup không có script chống nháy như index.html: theo chế độ sáng/tối của hệ điều hành
const dark = window.matchMedia('(prefers-color-scheme: dark)').matches
document.documentElement.classList.toggle('dark', dark)
document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
document.documentElement.lang = getLocale()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <Popup />
      <Toaster position="bottom-center" theme={dark ? 'dark' : 'light'} richColors />
    </QueryProvider>
  </StrictMode>,
)
