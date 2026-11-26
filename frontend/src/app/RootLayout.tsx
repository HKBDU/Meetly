import { Outlet, ScrollRestoration, useNavigation } from 'react-router-dom'

import { AppFooter, AppHeader } from '@/shared/layouts'
import { useServerStatus } from '@/shared/lib/serverStatus'
import { MaintenancePage } from './MaintenancePage'

/** Khung chung của mọi trang: nền ô vuông, header, nội dung, footer */
export function RootLayout() {
  // Đang tải code của route kế tiếp (các trang được lazy load)
  const navigating = useNavigation().state === 'loading'
  // API lỗi 5xx hoặc mất kết nối: thay nội dung trang bằng màn bảo trì, giữ header/footer
  const serverDown = useServerStatus((state) => state.down)
  return (
    <div className="app-event-background flex flex-col">
      {navigating && (
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden">
          <div className="meetly-route-progress h-full w-full bg-brand" />
        </div>
      )}
      <AppHeader />
      {/* `main` cao tối thiểu 1 viewport nên footer chỉ lộ khi cuộn */}
      <main className="min-h-dvh">
        {serverDown ? <MaintenancePage /> : <Outlet />}
      </main>
      <AppFooter />
      {/* Sang trang mới thì về đầu trang (VD bấm link Điều khoản ở footer) */}
      <ScrollRestoration />
    </div>
  )
}
