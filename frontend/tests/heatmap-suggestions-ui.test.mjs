import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('Admin suggestions have no manual trigger button', async () => {
  const server = await createServer({
    configFile: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://backend.test/'),
      'import.meta.env.VITE_SIGNALR_HUB_URL': JSON.stringify('http://backend.test/hubs/events'),
    },
    resolve: {
      alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
    },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  });

  try {
    const { HeatmapPage } = await server.ssrLoadModule('/src/features/heatmap/pages/HeatmapPage.tsx');
    const { getSuggestionParams } = await server.ssrLoadModule(
      '/src/features/heatmap/suggestions.ts',
    );
    const { DEFAULT_MEETING_DURATION } = await server.ssrLoadModule(
      '/src/features/heatmap/constants.ts',
    );
    const { mockDatesEvent } = await server.ssrLoadModule('/tests/fixtures/heatmapEvent.ts');
    const html = renderToStaticMarkup(
      createElement(HeatmapPage, {
        initialEvent: mockDatesEvent,
        isAdmin: true,
        onSuggestions: async () => [],
      }),
    );

    assert.doesNotMatch(html, /Find Suggested Times/);
    assert.equal(DEFAULT_MEETING_DURATION, 60);
    assert.match(html, /Suggestions update automatically/);

    assert.equal(getSuggestionParams(undefined, null), null);
    assert.deepEqual(getSuggestionParams(60, null), { minDuration: 60 });
    assert.deepEqual(getSuggestionParams(undefined, 'Huy'), { keyParticipant: 'Huy' });
    assert.deepEqual(getSuggestionParams(60, 'Huy'), {
      minDuration: 60,
      keyParticipant: 'Huy',
    });
  } finally {
    await server.close();
  }
});
