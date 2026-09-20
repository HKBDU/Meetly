import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

async function renderDemo(server, search = '') {
  const { HeatmapPage } = await server.ssrLoadModule('/src/features/heatmap/pages/HeatmapPage.tsx');
  const { getMockScenario, getMockSuggestions, finalizeMockEvent, updateMockEvent } =
    await server.ssrLoadModule('/src/features/heatmap/mock.ts');
  const { event, isAdmin } = getMockScenario(new URLSearchParams(search));
  return renderToStaticMarkup(
    createElement(HeatmapPage, {
      initialEvent: event,
      isAdmin,
      onSuggestions: (params) => getMockSuggestions(event, params),
      onFinalize: (slot) => finalizeMockEvent(event, slot),
      onUpdateEvent: (payload, currentEvent) => updateMockEvent(payload, currentEvent),
    }),
  );
}

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
    const { getMockSuggestions, mockDatesEvent } = await server.ssrLoadModule(
      '/src/features/heatmap/mock.ts',
    );
    const html = renderToStaticMarkup(
      createElement(HeatmapPage, {
        initialEvent: mockDatesEvent,
        isAdmin: true,
        onSuggestions: async () => [],
      }),
    );

    assert.doesNotMatch(html, /Find Suggested Times/);
    assert.match(html, /Select duration/);
    assert.match(html, /Suggestions update automatically/);

    assert.equal(getSuggestionParams(undefined, null), null);
    assert.deepEqual(getSuggestionParams(60, null), { minDuration: 60 });
    assert.equal(getSuggestionParams(undefined, 'Huy'), null);
    assert.deepEqual(getSuggestionParams(60, 'Huy'), {
      minDuration: 60,
      keyParticipant: 'Huy',
    });
    assert.deepEqual(await getMockSuggestions(mockDatesEvent, { keyParticipant: 'Huy' }), []);
  } finally {
    await server.close();
  }
});

test('Heatmap demo is Host by default and read-only only for role=user', async () => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  });

  try {
    const hostHtml = await renderDemo(server);
    assert.match(hostHtml, /Edit Event/);
    assert.match(hostHtml, /MEETING DURATION/);
    assert.match(hostHtml, /Key Participant/);
    assert.match(hostHtml, /Select Final Time/);

    const userHtml = await renderDemo(server, 'role=user');
    assert.doesNotMatch(userHtml, /Edit Event/);
    assert.doesNotMatch(userHtml, /MEETING DURATION/);
    assert.doesNotMatch(userHtml, /Key Participant/);
    assert.doesNotMatch(userHtml, /Select Final Time/);

    const demoSource = await readFile(
      fileURLToPath(new URL('../src/features/heatmap/pages/HeatmapDemoPage.tsx', import.meta.url)),
      'utf8',
    );
    assert.match(demoSource, /updateMockEvent/);
    assert.match(demoSource, /onUpdateEvent=/);
  } finally {
    await server.close();
  }
});
