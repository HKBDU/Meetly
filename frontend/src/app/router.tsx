import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/shared/pages';

export const router = createBrowserRouter(
  [
    { path: '/', Component: HomePage },
    {
      path: '/e/:shortCode',
      lazy: async () => {
        const { default: Component } = await import('@/features/heatmap/pages/HeatmapRoutePage');
        return { Component };
      },
    },
    ...(import.meta.env.DEV
      ? [{
          path: '/__heatmap-demo',
          lazy: async () => {
            const { default: Component } = await import('@/features/heatmap/pages/HeatmapDemoPage');
            return { Component };
          },
        }]
      : []),
  ],
);
