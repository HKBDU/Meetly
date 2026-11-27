import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

// Store dùng persist với localStorage; Node không có nên thay bằng bản trong bộ nhớ
if (!globalThis.localStorage) {
  const items = new Map();
  globalThis.localStorage = {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  };
}

async function withStore(run) {
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
    const { useParticipantStore, selectPaintedSlotIds } = await server.ssrLoadModule('/src/features/participants/store.ts');
    useParticipantStore.getState().resetSession();
    await run({ store: useParticipantStore, selectPaintedSlotIds });
  } finally {
    await server.close();
  }
}

const ALL = ['a', 'b', 'c', 'd'];
const sorted = (set) => [...set].sort();

test('starting a draft shows the draft on the grid and keeps the saved schedule untouched', async () => {
  await withStore(async ({ store, selectPaintedSlotIds }) => {
    store.getState().loadSlots('EVT', ['a']);
    store.getState().startDraft(['b', 'c'], ALL);

    const state = store.getState();
    assert.deepEqual(sorted(selectPaintedSlotIds(state)), ['b', 'c']);
    assert.deepEqual(sorted(state.selectedSlotIds), ['a']);
  });
});

test('painting while a draft is open edits the draft only', async () => {
  await withStore(async ({ store }) => {
    store.getState().loadSlots('EVT', ['a']);
    store.getState().startDraft(['b', 'c'], ALL);
    store.getState().setSlotPainted('d', true);
    store.getState().setSlotsPainted(['b'], false);

    const state = store.getState();
    assert.deepEqual(sorted(state.draftFreeSlotIds), ['c', 'd']);
    assert.deepEqual(sorted(state.selectedSlotIds), ['a']);
  });
});

test('applying a draft replaces the schedule with the draft', async () => {
  await withStore(async ({ store }) => {
    store.getState().loadSlots('EVT', ['a']);
    store.getState().startDraft(['b', 'c'], ALL);
    store.getState().applyDraft();

    const state = store.getState();
    assert.equal(state.draftFreeSlotIds, null);
    assert.equal(state.paintMode, 'FREE');
    assert.deepEqual(sorted(state.selectedSlotIds), ['b', 'c']);
  });
});

test('discarding a draft restores the grid to the saved schedule', async () => {
  await withStore(async ({ store, selectPaintedSlotIds }) => {
    store.getState().loadSlots('EVT', ['a']);
    store.getState().startDraft(['b', 'c'], ALL);
    store.getState().setSlotPainted('d', true);
    store.getState().discardDraft();

    const state = store.getState();
    assert.equal(state.draftFreeSlotIds, null);
    assert.deepEqual(sorted(selectPaintedSlotIds(state)), ['a']);
  });
});

test('starting a draft in busy mode switches to free mode without changing the schedule', async () => {
  await withStore(async ({ store }) => {
    store.getState().loadSlots('EVT', ['a', 'b']);
    // Chế độ BUSY: ô tô là ô bận, tức c và d
    store.getState().setPaintMode('BUSY', ALL);
    assert.deepEqual(sorted(store.getState().selectedSlotIds), ['c', 'd']);

    store.getState().startDraft(['d'], ALL);
    const state = store.getState();
    assert.equal(state.paintMode, 'FREE');
    assert.deepEqual(sorted(state.selectedSlotIds), ['a', 'b']);
  });
});

test('reloading slots or leaving the event drops an open draft', async () => {
  await withStore(async ({ store }) => {
    store.getState().startDraft(['b'], ALL);
    store.getState().loadSlots('EVT', ['a']);
    assert.equal(store.getState().draftFreeSlotIds, null);

    store.getState().startDraft(['b'], ALL);
    store.getState().resetSession();
    assert.equal(store.getState().draftFreeSlotIds, null);
  });
});
