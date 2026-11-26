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

test('home and create pages render the new create flow', async () => {
  await withServer(async (load, render) => {
    const { HomePage } = await load('/src/features/events/pages/HomePage.tsx');
    const { NewEventPage } = await load('/src/features/events/pages/NewEventPage.tsx');
    const home = render(createElement(HomePage));
    assert.match(home, /Create an event/);
    assert.match(home, /id="join-code"/);

    const create = render(createElement(NewEventPage), '/create');
    // Một trang: tên -> ngày -> giờ -> host, kèm nút tạo trên cả desktop lẫn mobile
    for (const section of ['section-name', 'section-days', 'section-hours', 'section-host']) {
      assert.match(create, new RegExp(`id="${section}"`));
    }
    assert.ok(create.indexOf('section-days') < create.indexOf('section-host'));
    assert.match(create, /id="admin-password"/);
    assert.match(create, /Create event/);
  });
});

test('event form offers quick picks for both day modes and hour presets', async () => {
  await withServer(async (load, render) => {
    const { EventForm } = await load('/src/features/events/components/EventForm.tsx');
    const { DEFAULT_EVENT_VALUES } = await load('/src/features/events/schema.ts');
    const dates = render(createElement(EventForm, { onSubmit: () => undefined }));
    assert.match(dates, /Next 7 days/);
    assert.match(dates, /Working hours/);
    assert.match(dates, /Tap or drag across dates/);

    const weekdays = render(
      createElement(EventForm, { onSubmit: () => undefined, initialValues: { ...DEFAULT_EVENT_VALUES, eventType: 2 } }),
    );
    assert.match(weekdays, /data-weekday="1"/);
    assert.match(weekdays, /Mon – Fri/);
  });
});

test('join accepts a code or a pasted event link', async () => {
  await withServer(async (load) => {
    const { parseEventCode, inviteMessage } = await load('/src/shared/lib/share.ts');
    assert.equal(parseEventCode('  abc123 '), 'ABC123');
    assert.equal(parseEventCode('https://meetly.app/e/abc123/me?x=1'), 'ABC123');
    assert.equal(parseEventCode(''), '');
    assert.match(inviteMessage('Sprint', 'https://meetly.app/e/ABC123'), /"Sprint".*https:\/\/meetly\.app\/e\/ABC123/);
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
    assert.match(html, /Join the event/);
  });
});
