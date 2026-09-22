import { createBrowserRouter } from "react-router-dom"

import { RootLayout } from "@/app/RootLayout"
import { HomePage, NewEventScreen } from "@/features/events"
import { ParticipantPage } from "@/features/participants"

export const router = createBrowserRouter(
  import.meta.env.DEV
    ? [
        {
          path: '*',
          lazy: async () => {
            const { default: Component } = await import('@/features/heatmap/pages/HeatmapDemoPage');
            return { Component };
          },
        },
      ]
    : [{ path: '*', Component: HomePage }],
);
