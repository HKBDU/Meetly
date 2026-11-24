import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/global.css'
import App from '@/app/App.tsx'
import { initAnalytics } from '@/lib/analytics'
import { useParticipantStore } from '@/features/participants/store'
import { readHandoff } from '@/shared/lib/handoff'

initAnalytics()

// Mở từ extension: đăng nhập sẵn bằng phiên được chuyển qua URL rồi xoá nó khỏi thanh địa chỉ
const handoff = readHandoff(window.location)
if (handoff) useParticipantStore.getState().login(handoff)
if (window.location.hash.includes('handoff=')) {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
