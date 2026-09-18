import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

async function loadFindBestSlots() {
  const server = await createServer({
    configFile: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://backend.test/'),
      'import.meta.env.VITE_SIGNALR_HUB_URL': JSON.stringify('http://backend.test/hubs/events'),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  });
  const { findBestSlots } = await server.ssrLoadModule('/src/features/heatmap/suggestions.ts');
  return { findBestSlots, close: () => server.close() };
}

const cell = (specificDate, startTime, participants) => ({
  specificDate,
  dayOfWeek: null,
  startTime,
  participants,
  count: participants.length,
});

const everyone = ['An', 'Binh', 'Chi', 'Dung', 'Em'];

function buildEvent(heatmapGrid) {
  return { participants: everyone.map((username) => ({ username })), heatmapGrid };
}

test('best slots keep only the time with the most people, even when the set of people changes inside it', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const day1 = '2026-09-25';
    const day2 = '2026-09-26';
    const event = buildEvent([
      cell(day1, '09:00', ['An', 'Binh']),
      cell(day1, '09:30', ['An', 'Binh', 'Chi', 'Dung']),
      cell(day1, '10:00', ['An', 'Binh', 'Chi']),
      cell(day1, '10:30', ['Em']),
      cell(day2, '09:00', ['An', 'Chi']),
      cell(day2, '09:30', ['An', 'Chi']),
      cell(day2, '10:00', ['Em']),
      cell(day2, '10:30', []),
    ]);

    assert.deepEqual(findBestSlots(event, { minDuration: 60 }), [
      {
        specificDate: day1,
        dayOfWeek: null,
        startTime: '09:30',
        endTime: '10:30',
        participantCount: 3,
        totalParticipants: 5,
      },
    ]);
  } finally {
    await close();
  }
});

test('best slots merge overlapping windows and return every day that ties', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const all = ['An', 'Binh'];
    const event = buildEvent([
      cell('2026-09-25', '09:00', all),
      cell('2026-09-25', '09:30', all),
      cell('2026-09-25', '10:00', all),
      cell('2026-09-26', '09:00', all),
      cell('2026-09-26', '09:30', all),
      cell('2026-09-26', '10:00', ['An']),
    ]);

    const slots = findBestSlots(event, { minDuration: 60 });
    assert.deepEqual(
      slots.map((slot) => [slot.specificDate, slot.startTime, slot.endTime, slot.participantCount]),
      [
        ['2026-09-25', '09:00', '10:30', 2],
        ['2026-09-26', '09:00', '10:00', 2],
      ],
    );
  } finally {
    await close();
  }
});

test('best slots respect the key participant and return nothing when nobody fits', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const event = buildEvent([
      cell('2026-09-25', '09:00', ['An', 'Binh', 'Chi']),
      cell('2026-09-25', '09:30', ['An', 'Binh', 'Chi']),
      cell('2026-09-25', '10:00', ['Em']),
      cell('2026-09-25', '10:30', ['Em']),
    ]);

    assert.deepEqual(
      findBestSlots(event, { minDuration: 60, keyParticipant: 'em' }).map((slot) => [
        slot.startTime,
        slot.endTime,
        slot.participantCount,
      ]),
      [['10:00', '11:00', 1]],
    );
    assert.deepEqual(findBestSlots(event, { minDuration: 120 }), []);
    assert.deepEqual(findBestSlots(event, { minDuration: 60, keyParticipant: 'Nobody' }), []);
  } finally {
    await close();
  }
});
