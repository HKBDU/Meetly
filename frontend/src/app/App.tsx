import { QueryProvider, RouterProvider } from "@/app/providers"
import { AppHeader } from "@/features/participants/components/AppHeader"
import { Toaster } from "@/shared/components/ui"
import { AppFooter } from "@/shared/layouts"

export default function App() {
  return (
    <QueryProvider>
      {/* `main` cao tối thiểu 1 viewport nên footer chỉ lộ khi cuộn */}
      <div className="app-event-background flex flex-col">
        <AppHeader />
        <main className="min-h-dvh">
          <RouterProvider />
        </main>
        <AppFooter />
      </div>
      <Toaster position="top-right" theme="light" richColors />
    </QueryProvider>
  )
}
