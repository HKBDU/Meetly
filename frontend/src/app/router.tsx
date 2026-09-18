import { createBrowserRouter } from "react-router-dom"
import { ParticipantPage } from "@/features/participants"
import { HomePage, NewEventScreen } from "@/features/events"

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/create", element: <NewEventScreen /> },
  { path: "/e/:shortCode", element: <ParticipantPage /> },
  {
    path: "*",
    element: <HomePage />,
  },
])
