import { createBrowserRouter } from "react-router-dom"

import { RootLayout } from "@/app/RootLayout"
import { HomePage, NewEventScreen } from "@/features/events"
import { ParticipantPage } from "@/features/participants"

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/create", element: <NewEventScreen /> },
      { path: "/e/:shortCode", element: <ParticipantPage /> },
      { path: "*", element: <HomePage /> },
    ],
  },
])
