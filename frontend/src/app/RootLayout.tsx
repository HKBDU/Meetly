import { Outlet } from 'react-router-dom'

import { AppFooter, AppHeader } from '@/shared/layouts'

/** Khung chung của mọi trang: nền ô vuông, header, nội dung, footer */
export function RootLayout() {
  return (
    <div className="app-event-background flex flex-col">
      <AppHeader />
      {/* `main` cao tối thiểu 1 viewport nên footer chỉ lộ khi cuộn */}
      <main className="min-h-dvh">
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
