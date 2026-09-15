import { createBrowserRouter } from "react-router-dom"

import { ParticipantPage } from "@/features/participants"

/**
 * Router thật DUY NHẤT của app. Hiện chỉ có luồng participant
 * (`/e/:shortCode`, khớp `shareLink` hiển thị ở EventInfoBar và endpoint
 * `GET/POST /events/{shortCode}/...` bên BE) - các luồng khác (tạo event,
 * heatmap tổng) sẽ có route riêng khi merge vào. Header/footer chung cho mọi
 * route nằm ở `App.tsx` (bọc quanh `RouterProvider`), không phải layout route
 * ở đây - vì hiện chỉ có 1 kiểu layout duy nhất cho toàn app.
 */
export const router = createBrowserRouter([
  { path: "/e/:shortCode", element: <ParticipantPage /> },
  {
    path: "*",
    element: (
      <div className="flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
        Open your event link (e.g. meetly.app/e/ABC123) to join a schedule.
      </div>
    ),
  },
])
