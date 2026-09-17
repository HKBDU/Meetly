<<<<<<< HEAD
import { NewEventScreen } from '@/features/events'

export default function App() {
  return <NewEventScreen />
=======
import { QueryProvider, RouterProvider } from "@/app/providers"
import { AppHeader } from "@/features/participants/components/AppHeader"
import { Toaster } from "@/shared/components/ui"
import { AppFooter } from "@/shared/layouts"

export default function App() {
  return (
    <QueryProvider>
      {/* `min-h-dvh` nằm TRÊN CHÍNH `main` (không phải trên khung ngoài) - CỐ Ý bắt
          `main` luôn cao ÍT NHẤT bằng 1 màn hình, CỘNG THÊM header/footer nằm ngoài
          phần đó, nên tổng chiều cao trang LUÔN lớn hơn viewport một chút -> footer
          KHÔNG BAO GIỜ lộ ra ngay khi vào trang (phải cuộn mới thấy), kể cả khi nội
          dung thật sự rất ngắn (VD màn Join). Khi nội dung dài hơn 1 màn hình (VD:
          lưới lịch nhiều giờ) thì `main` tự giãn tiếp theo nội dung, cả trang cuộn
          bình thường thay vì tạo thanh cuộn riêng bên trong. */}
      <div className="flex flex-col bg-background">
        <AppHeader />
        <main className="min-h-dvh">
          <RouterProvider />
        </main>
        <AppFooter />
      </div>
      <Toaster position="top-right" theme="light" richColors />
    </QueryProvider>
  )
>>>>>>> remotes/origin/feat/15-buil-participants-ui
}
