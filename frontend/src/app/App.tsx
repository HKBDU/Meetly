import { QueryProvider } from "@/app/providers"
import { AppHeader } from "@/features/participants/components/AppHeader"
import { ParticipantPage } from "@/features/participants"
import { Toaster } from "@/shared/components/ui"
import { AppFooter } from "@/shared/layouts"

export default function App() {
  return (
    <QueryProvider>
      {/* h-dvh: khung ứng dụng chiếm ĐÚNG chiều cao viewport (co giãn đúng
          trên mobile khi thanh địa chỉ ẩn/hiện) - header/footer cố định
          chiều cao, phần `main` ở giữa chiếm hết chỗ còn lại và tự cuộn
          riêng khi nội dung dài hơn, thay vì cuộn cả trang (đẩy header/footer
          trôi mất). Xem PersonalScheduleView - nó cũng dựa vào cách chia
          layout này để tự fit vừa khung hình mà không cần cuộn thêm. */}
      <div className="flex h-dvh flex-col bg-background">
        <AppHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <ParticipantPage />
        </main>
        <AppFooter />
      </div>
      <Toaster position="top-center" richColors />
    </QueryProvider>
  )
}
