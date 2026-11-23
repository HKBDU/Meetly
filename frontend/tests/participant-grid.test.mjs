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

const weeklyEvent = {
  eventType: 2,
  availableDates: [],
  availableWeekdays: [1, 3],
  dailyStartTime: '09:15',
  dailyEndTime: '10:45',
};

test('personal grid keeps non-hour start and end times instead of rounding to whole hours', async () => {
  await withServer(async (load) => {
    const { buildRows } = await load('/src/shared/grid/model.ts');
    const rows = buildRows(weeklyEvent.dailyStartTime, weeklyEvent.dailyEndTime);
    assert.equal(rows[0].startTime, '09:15');
    assert.equal(rows.at(-1).endTime, '10:45');
    assert.equal(rows.length, 6);
  });
});

test('free slots merge into ranges per weekday and expand back to the same cells', async () => {
  await withServer(async (load) => {
    const { getColumns, buildRows } = await load('/src/shared/grid/model.ts');
    const grid = await load('/src/features/participants/gridUtils.ts');
    const columns = getColumns(weeklyEvent);
    const times = buildRows(weeklyEvent.dailyStartTime, weeklyEvent.dailyEndTime).map((row) => row.startTime);
    const monday = columns[0];
    const wednesday = columns[1];
    const free = [
      grid.getSlotId(monday, '09:15'),
      grid.getSlotId(monday, '09:30'),
      grid.getSlotId(monday, '10:15'),
      grid.getSlotId(wednesday, '10:30'),
    ];

    const ranges = grid.mergeFreeSlotIdsIntoRanges(free, columns);
    assert.deepEqual(ranges, [
      { specificDate: null, dayOfWeek: 1, startTime: '09:15', endTime: '09:45' },
      { specificDate: null, dayOfWeek: 1, startTime: '10:15', endTime: '10:30' },
      { specificDate: null, dayOfWeek: 3, startTime: '10:30', endTime: '10:45' },
    ]);
    assert.deepEqual(new Set(grid.expandRangesToSlotIds(ranges, columns, times)), new Set(free));
  });
});

test('ranges for dates removed from the event are dropped when loading a schedule', async () => {
  await withServer(async (load) => {
    const { getColumns } = await load('/src/shared/grid/model.ts');
    const { expandRangesToSlotIds } = await load('/src/features/participants/gridUtils.ts');
    const columns = getColumns(weeklyEvent);
    const ids = expandRangesToSlotIds(
      [{ specificDate: null, dayOfWeek: 5, startTime: '09:15', endTime: '09:30' }],
      columns,
      ['09:15'],
    );
    assert.deepEqual(ids, []);
  });
});

test('switching Busy/Available keeps the same availability instead of clearing it', async () => {
  await withServer(async (load) => {
    const { useParticipantStore } = await load('/src/features/participants/store.ts');
    const { resolveFreeSlotIds } = await load('/src/features/participants/gridUtils.ts');
    const all = ['a', 'b', 'c', 'd'];
    useParticipantStore.getState().loadSlots('ABC', ['a', 'b']);

    useParticipantStore.getState().setPaintMode('BUSY', all);
    const busyState = useParticipantStore.getState();
    assert.deepEqual([...busyState.selectedSlotIds].sort(), ['c', 'd']);
    assert.deepEqual(resolveFreeSlotIds(busyState.selectedSlotIds, 'BUSY', all), ['a', 'b']);

    useParticipantStore.getState().setPaintMode('FREE', all);
    assert.deepEqual([...useParticipantStore.getState().selectedSlotIds].sort(), ['a', 'b']);
  });
});

test('realtime payloads apply only to the same event and to newer revisions', async () => {
  await withServer(async (load) => {
    const { shouldApplyRealtimePayload } = await load('/src/shared/hooks/useEventRealtime.ts');
    assert.equal(shouldApplyRealtimePayload(5, 'abc', { shortCode: 'ABC', revision: 6 }), true);
    assert.equal(shouldApplyRealtimePayload(5, 'ABC', { shortCode: 'ABC', revision: 5 }), false);
  });
});
