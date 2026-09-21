import { QueryProvider, RouterProvider } from "@/app/providers"
import { Toaster } from "@/shared/components/ui"

export default function App() {
  return (
    <QueryProvider>
      <RouterProvider />
      <Toaster position="top-right" theme="light" richColors />
    </QueryProvider>
  )
}
