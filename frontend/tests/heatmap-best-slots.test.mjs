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
      cell(day1, '09:15', ['An', 'Binh']),
      cell(day1, '09:30', ['An', 'Binh', 'Chi', 'Dung']),
      cell(day1, '09:45', ['An', 'Binh', 'Chi', 'Dung']),
      cell(day1, '10:00', ['An', 'Binh', 'Chi']),
      cell(day1, '10:15', ['An', 'Binh', 'Chi']),
      cell(day1, '10:30', ['Em']),
      cell(day1, '10:45', ['Em']),
      cell(day2, '09:00', ['An', 'Chi']),
      cell(day2, '09:15', ['An', 'Chi']),
      cell(day2, '09:30', ['An', 'Chi']),
      cell(day2, '09:45', ['An', 'Chi']),
      cell(day2, '10:00', ['Em']),
      cell(day2, '10:15', ['Em']),
      cell(day2, '10:30', []),
      cell(day2, '10:45', []),
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

test('best slots favor higher attendance density over a smaller fixed group', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const day = '2026-09-25';
    const event = buildEvent([
      cell(day, '10:30', ['An']),
      cell(day, '10:45', ['An', 'Binh', 'Chi', 'Dung']),
      cell(day, '11:00', ['An', 'Binh', 'Chi', 'Dung']),
      cell(day, '11:15', ['An', 'Binh']),
      cell(day, '11:30', []),
      cell(day, '11:45', []),
      cell(day, '12:00', []),
      cell(day, '12:15', []),
      cell(day, '12:30', []),
      cell(day, '12:45', []),
      cell(day, '13:00', []),
      cell(day, '13:15', []),
      cell(day, '13:30', []),
      cell(day, '13:45', []),
      cell(day, '14:00', ['An', 'Binh']),
      cell(day, '14:15', ['An', 'Binh']),
      cell(day, '14:30', ['An', 'Binh']),
      cell(day, '14:45', ['An', 'Binh']),
    ]);

    assert.deepEqual(findBestSlots(event, { minDuration: 60 }), [
      {
        specificDate: day,
        dayOfWeek: null,
        startTime: '10:30',
        endTime: '11:30',
        participantCount: 1,
        totalParticipants: 5,
      },
    ]);
  } finally {
    await close();
  }
});

test('best slots keep the requested duration and return every day that ties', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const all = ['An', 'Binh'];
    const event = buildEvent([
      cell('2026-09-25', '09:00', all),
      cell('2026-09-25', '09:15', all),
      cell('2026-09-25', '09:30', all),
      cell('2026-09-25', '09:45', all),
      cell('2026-09-25', '10:00', all),
      cell('2026-09-25', '10:15', all),
      cell('2026-09-26', '09:00', all),
      cell('2026-09-26', '09:15', all),
      cell('2026-09-26', '09:30', all),
      cell('2026-09-26', '09:45', all),
      cell('2026-09-26', '10:00', ['An']),
      cell('2026-09-26', '10:15', ['An']),
    ]);

    const slots = findBestSlots(event, { minDuration: 60 });
    assert.deepEqual(
      slots.map((slot) => [slot.specificDate, slot.startTime, slot.endTime, slot.participantCount]),
      [
        ['2026-09-25', '09:00', '10:00', 2],
        ['2026-09-26', '09:00', '10:00', 2],
      ],
    );
  } finally {
    await close();
  }
});

test('best slot borders always match every supported duration exactly', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const day = '2026-09-25';
    const times = [
      '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45',
    ];
    const event = buildEvent(times.map((time) => cell(day, time, everyone)));

    for (const duration of [15, 30, 45, 60, 75, 90, 120]) {
      const slots = findBestSlots(event, { minDuration: duration });
      assert.ok(slots.length > 0);
      for (const slot of slots) {
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        assert.equal(
          endHour * 60 + endMinute - (startHour * 60 + startMinute),
          duration,
        );
      }
    }
  } finally {
    await close();
  }
});

test('best slots do not require one fixed attendee across the whole duration', async () => {
  const { findBestSlots, close } = await loadFindBestSlots();
  try {
    const day = '2026-09-25';
    const event = buildEvent([
      cell(day, '09:00', ['An', 'Binh', 'Chi']),
      cell(day, '09:15', ['Dung', 'Em']),
      cell(day, '09:30', ['An']),
      cell(day, '09:45', ['An']),
    ]);

    assert.deepEqual(
      findBestSlots(event, { minDuration: 30 }).map((slot) => [slot.startTime, slot.endTime]),
      [['09:00', '09:30']],
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
      cell('2026-09-25', '09:15', ['An', 'Binh', 'Chi']),
      cell('2026-09-25', '09:30', ['An', 'Binh', 'Chi']),
      cell('2026-09-25', '09:45', ['An', 'Binh', 'Chi']),
      cell('2026-09-25', '10:00', ['Em']),
      cell('2026-09-25', '10:15', ['Em']),
      cell('2026-09-25', '10:30', ['Em']),
      cell('2026-09-25', '10:45', ['Em']),
    ]);

    assert.deepEqual(
      findBestSlots(event, { minDuration: 60, keyParticipant: 'em' }).map((slot) => [
        slot.startTime,
        slot.endTime,
        slot.participantCount,
      ]),
      [['10:00', '11:00', 1]],
    );
    assert.deepEqual(
      findBestSlots(event, { minDuration: 120 }).map((slot) => [
        slot.startTime,
        slot.endTime,
      ]),
      [['09:00', '11:00']],
    );
    assert.deepEqual(findBestSlots(event, { minDuration: 60, keyParticipant: 'Nobody' }), []);
  } finally {
    await close();
  }
});
