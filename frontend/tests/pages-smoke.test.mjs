import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
// Thư viện nạp bằng import gốc của Node: Vite SSR cũng externalize chúng nên dùng chung instance (context React khớp)
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/** Render thử các trang trong router bộ nhớ để bắt lỗi runtime khi refactor giao diện */
async function withServer(run) {
  const server = await createServer({
    configFile: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://backend.test/'),
      'import.meta.env.VITE_SIGNALR_HUB_URL': JSON.stringify('http://backend.test/hubs/events'),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  });
  try {
    const load = (path) => server.ssrLoadModule(path);
    const render = (element, path = '/') =>
      renderToStaticMarkup(
        createElement(
          QueryClientProvider,
          { client: new QueryClient() },
          createElement(MemoryRouter, { initialEntries: [path] }, element),
        ),
      );
    await run(load, render);
  } finally {
    await server.close();
  }
}

test('home and create pages render without runtime errors', async () => {
  await withServer(async (load, render) => {
    const { HomePage } = await load('/src/features/events/pages/HomePage.tsx');
    const { NewEventPage } = await load('/src/features/events/pages/NewEventPage.tsx');
    assert.match(render(createElement(HomePage)), /Create New Event/);
    const create = render(createElement(NewEventPage), '/create');
    assert.match(create, /Admin credentials/);
    assert.match(create, /id="admin-password"/);
  });
});

test('event form renders both date modes and never offers a 24:00 end time', async () => {
  await withServer(async (load, render) => {
    const { EventForm } = await load('/src/features/events/components/EventForm.tsx');
    const { DEFAULT_EVENT_VALUES } = await load('/src/features/events/schema.ts');
    const weekdays = render(createElement(EventForm, { onSubmit: () => undefined }));
    assert.match(weekdays, /data-weekday="1"/);
    assert.match(weekdays, /aria-valuemax="95"/);

    const dates = render(
      createElement(EventForm, { onSubmit: () => undefined, initialValues: { ...DEFAULT_EVENT_VALUES, eventType: 1 } }),
    );
    assert.match(dates, /Reset dates/);
  });
});

test('personal schedule grid renders one table with a cell per column and 15-minute row', async () => {
  await withServer(async (load, render) => {
    const { PersonalScheduleGrid } = await load('/src/features/participants/components/PersonalScheduleGrid.tsx');
    const { getColumns, buildRows } = await load('/src/shared/grid/model.ts');
    const { getAllSlotIds } = await load('/src/features/participants/gridUtils.ts');
    const event = { eventType: 2, availableDates: [], availableWeekdays: [1, 2], dailyStartTime: '09:15', dailyEndTime: '10:00' };
    const columns = getColumns(event);
    const rows = buildRows(event.dailyStartTime, event.dailyEndTime);
    const times = rows.map((row) => row.startTime);
    const html = render(
      createElement(PersonalScheduleGrid, {
        grid: { columns, rows, times, allSlotIds: getAllSlotIds(columns, times), isLocked: false },
        triggerAutoSave: () => undefined,
        manualSelection: null,
      }),
    );
    assert.equal((html.match(/<table/g) ?? []).length, 1);
    assert.equal((html.match(/data-slot-id=/g) ?? []).length, 2 * 3);
    assert.match(html, /data-slot-id="weekday:1@09:15"/);
  });
});

test('event route shows the join form when nobody is signed in', async () => {
  await withServer(async (load, render) => {
    const { EventLayout } = await load('/src/features/participants/pages/EventLayout.tsx');
    const html = render(
      createElement(Routes, null, createElement(Route, { path: '/e/:shortCode', element: createElement(EventLayout) })),
      '/e/abc123',
    );
    assert.match(html, /Join the Event/);
  });
});
