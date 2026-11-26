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

const VN = 'Asia/Ho_Chi_Minh';

/** Lưới 09:00–11:00, 8 ô 15 phút; trả về các giờ bắt đầu của ô rảnh, nhóm theo cột */
async function freeTimesByColumn(load, event, busy, timeZone = VN) {
  const { getColumns, buildRows } = await load('/src/shared/grid/model.ts');
  const { busyToFreeSlotIds } = await load('/src/features/participants/busyImport.ts');
  const columns = getColumns(event);
  const rows = buildRows(event.dailyStartTime, event.dailyEndTime);
  const free = busyToFreeSlotIds({ busy, columns, rows, timeZone });
  return Object.fromEntries(
    columns.map((column) => [
      column.key,
      free.filter((id) => id.startsWith(`${column.key}@`)).map((id) => id.slice(column.key.length + 1)),
    ]),
  );
}

const ALL_TIMES = ['09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45'];

const datesEvent = {
  eventType: 1,
  availableDates: ['2026-12-10', '2026-12-11'],
  availableWeekdays: [],
  dailyStartTime: '09:00',
  dailyEndTime: '11:00',
};

test('no busy time keeps every cell of the grid free', async () => {
  await withServer(async (load) => {
    const result = await freeTimesByColumn(load, datesEvent, []);
    assert.deepEqual(result['date:2026-12-10'], ALL_TIMES);
    assert.deepEqual(result['date:2026-12-11'], ALL_TIMES);
  });
});

test('busy interval in UTC marks the overlapping cells busy in the event time zone', async () => {
  await withServer(async (load) => {
    // 02:00–02:30 UTC = 09:00–09:30 giờ Việt Nam
    const result = await freeTimesByColumn(load, datesEvent, [
      { start: '2026-12-10T02:00:00Z', end: '2026-12-10T02:30:00Z' },
    ]);
    assert.deepEqual(result['date:2026-12-10'], ['09:30', '09:45', '10:00', '10:15', '10:30', '10:45']);
    assert.deepEqual(result['date:2026-12-11'], ALL_TIMES);
  });
});

test('touching a cell edge does not make it busy, partial overlap does', async () => {
  await withServer(async (load) => {
    const result = await freeTimesByColumn(load, datesEvent, [
      // 09:50–10:00: chỉ ô 09:45 bận, ô 10:00 chạm mép nên vẫn rảnh
      { start: '2026-12-10T09:50:00+07:00', end: '2026-12-10T10:00:00+07:00' },
      // 10:40–10:41: bận một phút vẫn làm ô 10:30 bận
      { start: '2026-12-10T10:40:00+07:00', end: '2026-12-10T10:41:00+07:00' },
    ]);
    assert.deepEqual(result['date:2026-12-10'], ['09:00', '09:15', '09:30', '10:00', '10:15', '10:45']);
  });
});

test('busy time outside the grid hours or dates is ignored', async () => {
  await withServer(async (load) => {
    const result = await freeTimesByColumn(load, datesEvent, [
      { start: '2026-12-10T06:00:00+07:00', end: '2026-12-10T09:00:00+07:00' },
      { start: '2026-12-10T11:00:00+07:00', end: '2026-12-10T18:00:00+07:00' },
      { start: '2026-12-12T09:00:00+07:00', end: '2026-12-12T11:00:00+07:00' },
    ]);
    assert.deepEqual(result['date:2026-12-10'], ALL_TIMES);
    assert.deepEqual(result['date:2026-12-11'], ALL_TIMES);
  });
});

test('busy interval across midnight is split across both days', async () => {
  await withServer(async (load) => {
    const lateEvent = { ...datesEvent, dailyStartTime: '22:00', dailyEndTime: '23:59' };
    const earlyEvent = { ...datesEvent, dailyStartTime: '00:00', dailyEndTime: '02:00' };
    const busy = [{ start: '2026-12-10T23:00:00+07:00', end: '2026-12-11T01:00:00+07:00' }];

    const late = await freeTimesByColumn(load, lateEvent, busy);
    assert.deepEqual(late['date:2026-12-10'], ['22:00', '22:15', '22:30', '22:45']);

    const early = await freeTimesByColumn(load, earlyEvent, busy);
    assert.deepEqual(early['date:2026-12-11'], ['01:00', '01:15', '01:30', '01:45']);
  });
});

test('event time zone decides which local cells are busy', async () => {
  await withServer(async (load) => {
    // 14:00–15:00 UTC = 09:00–10:00 ở New York (UTC-5 vào tháng 12)
    const busy = [{ start: '2026-12-10T14:00:00Z', end: '2026-12-10T15:00:00Z' }];
    const newYork = await freeTimesByColumn(load, datesEvent, busy, 'America/New_York');
    assert.deepEqual(newYork['date:2026-12-10'], ['10:00', '10:15', '10:30', '10:45']);

    // Cùng khoảng bận đó là 21:00–22:00 ở Việt Nam, nằm ngoài lưới
    const vietnam = await freeTimesByColumn(load, datesEvent, busy, VN);
    assert.deepEqual(vietnam['date:2026-12-10'], ALL_TIMES);
  });
});

test('weekly event is busy when any referenced week of that weekday is busy', async () => {
  await withServer(async (load) => {
    const weeklyEvent = {
      eventType: 2,
      availableDates: [],
      availableWeekdays: [1, 3],
      dailyStartTime: '09:00',
      dailyEndTime: '11:00',
    };
    const result = await freeTimesByColumn(load, weeklyEvent, [
      // Thứ Hai tuần 1: 09:00–09:30, thứ Hai tuần 2: 10:30–11:00
      { start: '2026-12-07T09:00:00+07:00', end: '2026-12-07T09:30:00+07:00' },
      { start: '2026-12-14T10:30:00+07:00', end: '2026-12-14T11:00:00+07:00' },
    ]);
    assert.deepEqual(result['weekday:1'], ['09:30', '09:45', '10:00', '10:15']);
    assert.deepEqual(result['weekday:3'], ALL_TIMES);
  });
});

test('invalid or empty busy intervals are skipped', async () => {
  await withServer(async (load) => {
    const result = await freeTimesByColumn(load, datesEvent, [
      { start: 'not-a-date', end: '2026-12-10T10:00:00+07:00' },
      { start: '2026-12-10T10:00:00+07:00', end: '2026-12-10T09:00:00+07:00' },
      { start: '2026-12-10T10:00:00+07:00', end: '2026-12-10T10:00:00+07:00' },
    ]);
    assert.deepEqual(result['date:2026-12-10'], ALL_TIMES);
  });
});
