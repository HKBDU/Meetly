import { createBrowserRouter } from 'react-router-dom';
import { HomePage } from '@/shared/pages';

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
