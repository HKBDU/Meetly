import { createBrowserRouter } from "react-router-dom"

import { ParticipantPage } from "@/features/participants"

/** Router của app; header/footer chung nằm ở `App.tsx` */
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
