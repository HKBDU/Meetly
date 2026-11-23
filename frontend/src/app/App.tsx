import { QueryProvider, RouterProvider } from "@/app/providers"
import { Toaster } from "@/shared/components/ui"
import { useTheme } from "@/shared/lib/theme"

export default function App() {
  const { theme } = useTheme()
  return (
    <QueryProvider>
      <RouterProvider />
      <Toaster position="top-right" theme={theme} richColors />
    </QueryProvider>
  )
}
