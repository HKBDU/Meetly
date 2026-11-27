import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

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
    await run((path) => server.ssrLoadModule(path));
  } finally {
    await server.close();
  }
}

/** Thay `fetch` trong lúc chạy `run`, ghi lại các request đã gửi */
async function withFetch(handler, run) {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: init?.body ? JSON.parse(init.body) : undefined });
    return handler(url, init);
  };
  try {
    await run(calls);
  } finally {
    globalThis.fetch = original;
  }
}

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const VN = 'Asia/Ho_Chi_Minh';

const datesEvent = {
  eventType: 1,
  availableDates: ['2026-12-11', '2026-12-10'],
  availableWeekdays: [],
  timezone: VN,
  dailyStartTime: '09:00',
  dailyEndTime: '11:00',
};

const weeklyEvent = {
  eventType: 2,
  availableDates: [],
  availableWeekdays: [1, 3],
  timezone: VN,
  dailyStartTime: '09:00',
  dailyEndTime: '11:00',
};

test('dates event asks Google from the first to the last date, padded by a day for time zones', async () => {
  await withServer(async (load) => {
    const { buildFreeBusyWindow } = await load('/src/features/participants/googleFreeBusy.ts');
    assert.deepEqual(buildFreeBusyWindow(datesEvent), {
      timeMin: '2026-12-09T00:00:00Z',
      timeMax: '2026-12-13T00:00:00Z',
    });
  });
});

test('weekly event references the next two weeks starting today in the event time zone', async () => {
  await withServer(async (load) => {
    const { buildFreeBusyWindow } = await load('/src/features/participants/googleFreeBusy.ts');
    // 20:00 UTC ngày 26 đã là ngày 27 ở Việt Nam
    const window = buildFreeBusyWindow(weeklyEvent, new Date('2026-11-26T20:00:00Z'));
    assert.equal(window.weeklyDates.length, 14);
    assert.equal(window.weeklyDates[0], '2026-11-27');
    assert.equal(window.weeklyDates.at(-1), '2026-12-10');
    assert.equal(window.timeMin, '2026-11-26T00:00:00Z');
    assert.equal(window.timeMax, '2026-12-12T00:00:00Z');

    // Cùng thời điểm đó, New York vẫn là ngày 26
    const newYork = buildFreeBusyWindow({ ...weeklyEvent, timezone: 'America/New_York' }, new Date('2026-11-27T03:00:00Z'));
    assert.equal(newYork.weeklyDates[0], '2026-11-26');
  });
});

test('event without dates or weekdays has nothing to ask Google', async () => {
  await withServer(async (load) => {
    const { buildFreeBusyWindow } = await load('/src/features/participants/googleFreeBusy.ts');
    assert.equal(buildFreeBusyWindow({ ...datesEvent, availableDates: [] }), null);
    assert.equal(buildFreeBusyWindow({ ...weeklyEvent, availableWeekdays: [] }), null);
  });
});

test('freeBusy query sends the token and window, and keeps only well-formed busy intervals', async () => {
  await withServer(async (load) => {
    const { queryFreeBusy } = await load('/src/features/participants/googleFreeBusy.ts');
    const busy = { start: '2026-12-10T02:00:00Z', end: '2026-12-10T03:00:00Z' };
    await withFetch(
      () => json(200, { calendars: { primary: { busy: [busy, { start: 1 }, null] } } }),
      async (calls) => {
        const result = await queryFreeBusy('token-123', { timeMin: 'A', timeMax: 'B' });
        assert.deepEqual(result, [busy]);
        assert.equal(calls.length, 1);
        assert.equal(calls[0].url, 'https://www.googleapis.com/calendar/v3/freeBusy');
        assert.equal(calls[0].init.method, 'POST');
        assert.equal(calls[0].init.headers.Authorization, 'Bearer token-123');
        assert.deepEqual(calls[0].body, { timeMin: 'A', timeMax: 'B', items: [{ id: 'primary' }] });
      },
    );
  });
});

test('freeBusy failures are reported with a kind the UI can explain', async () => {
  await withServer(async (load) => {
    const { queryFreeBusy, GoogleBusyError } = await load('/src/features/participants/googleFreeBusy.ts');
    const window = { timeMin: 'A', timeMax: 'B' };
    const cases = [
      [() => json(401, {}), 'unauthorized'],
      [() => json(403, {}), 'forbidden'],
      [() => json(429, {}), 'forbidden'],
      [() => json(500, {}), 'unknown'],
      [() => json(200, { calendars: { primary: { errors: [{ reason: 'notFound' }] } } }), 'calendar'],
      [() => json(200, {}), 'calendar'],
      [
        () => {
          throw new TypeError('Failed to fetch');
        },
        'network',
      ],
    ];
    for (const [handler, kind] of cases) {
      await withFetch(handler, async () => {
        await assert.rejects(queryFreeBusy('token', window), (error) => {
          assert.ok(error instanceof GoogleBusyError);
          assert.equal(error.kind, kind);
          return true;
        });
      });
    }
  });
});

test('weekly import counts busy days inside the reference weeks only', async () => {
  await withServer(async (load) => {
    const { fetchGoogleFreeSlotIds } = await load('/src/features/participants/googleFreeBusy.ts');
    const { getColumns, buildRows } = await load('/src/shared/grid/model.ts');
    const grid = { columns: getColumns(weeklyEvent), rows: buildRows('09:00', '11:00') };
    // Trưa 26/11 ở Việt Nam: tham chiếu 26/11 → 09/12
    const now = new Date('2026-11-26T05:00:00Z');

    await withFetch(
      () =>
        json(200, {
          calendars: {
            primary: {
              busy: [
                // Thứ Hai 07/12, trong 2 tuần tham chiếu: tính
                { start: '2026-12-07T09:00:00+07:00', end: '2026-12-07T09:30:00+07:00' },
                // Thứ Tư 25/11, nằm ở phần đệm trước hôm nay: bỏ qua
                { start: '2026-11-25T09:00:00+07:00', end: '2026-11-25T11:00:00+07:00' },
              ],
            },
          },
        }),
      async () => {
        const free = await fetchGoogleFreeSlotIds({ event: weeklyEvent, grid, accessToken: 'token', now });
        const monday = free.filter((id) => id.startsWith('weekday:1@'));
        const wednesday = free.filter((id) => id.startsWith('weekday:3@'));
        assert.equal(monday.length, 6);
        assert.ok(!monday.includes('weekday:1@09:00') && !monday.includes('weekday:1@09:15'));
        assert.equal(wednesday.length, 8);
      },
    );
  });
});
