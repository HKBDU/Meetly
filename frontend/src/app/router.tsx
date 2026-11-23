import { createBrowserRouter } from 'react-router-dom'

import { RootLayout } from '@/app/RootLayout'
import { HomePage } from '@/features/events/pages/HomePage'

/** Mỗi route tải code riêng: trang chủ không kéo theo SignalR, heatmap, calendar */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    hydrateFallbackElement: null,
    children: [
      { path: '/', element: <HomePage /> },
      {
        path: '/create',
        lazy: async () => ({ Component: (await import('@/features/events/pages/NewEventPage')).NewEventPage }),
      },
      {
        // Mỗi màn của event có URL riêng nên nút Back và deep link hoạt động
        path: '/e/:shortCode',
        lazy: async () => ({ Component: (await import('@/features/participants/pages/EventLayout')).EventLayout }),
        children: [
          {
            index: true,
            lazy: async () => ({ Component: (await import('@/features/participants/pages/OverviewPage')).OverviewPage }),
          },
          {
            path: 'me',
            lazy: async () => ({ Component: (await import('@/features/participants/pages/MySchedulePage')).MySchedulePage }),
          },
        ],
      },
      { path: '*', element: <HomePage /> },
    ],
  },
])
