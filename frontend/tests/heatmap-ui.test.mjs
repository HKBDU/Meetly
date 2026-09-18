import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

async function createTestServer() {
  return createServer({
    configFile: false,
    resolve: {
      alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
    },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  });
}

test('time rows stop before the configured end time', async () => {
  const server = await createTestServer();
  try {
    const { buildRows } = await server.ssrLoadModule('/src/features/heatmap/time.ts');
    assert.deepEqual(buildRows('08:00', '09:00'), [
      { startTime: '08:00', endTime: '08:30' },
      { startTime: '08:30', endTime: '09:00' },
    ]);
  } finally {
    await server.close();
  }
});

test('Edit Event time range converts between API times and slider minutes', async () => {
  const server = await createTestServer();
  try {
    const { minuteRangeToTimes, timesToMinuteRange } = await server.ssrLoadModule(
      '/src/lib/date-time.ts',
    );

    assert.deepEqual(timesToMinuteRange('07:00', '14:00'), [420, 840]);
    assert.deepEqual(minuteRangeToTimes([420, 840]), ['07:00', '14:00']);
  } finally {
    await server.close();
  }
});

test('range slider gives each Edit Event time handle an accessible name', async () => {
  const server = await createTestServer();
  try {
    const { Slider } = await server.ssrLoadModule('/src/shared/components/ui/slider.tsx');
    const html = renderToStaticMarkup(
      createElement(Slider, {
        value: [420, 840],
        thumbLabels: ['From time', 'To time'],
      }),
    );

    assert.match(html, /aria-label="From time"/);
    assert.match(html, /aria-label="To time"/);
  } finally {
    await server.close();
  }
});

test('column pages use stable desktop and mobile page sizes', async () => {
  const server = await createTestServer();
  try {
    const { getColumnPage, getPageCount } = await server.ssrLoadModule('/src/features/heatmap/time.ts');
    const { DESKTOP_COLUMNS_PER_PAGE, MOBILE_COLUMNS_PER_PAGE } = await server.ssrLoadModule(
      '/src/features/heatmap/constants.ts',
    );
    const columns = Array.from({ length: 12 }, (_, index) => ({ key: String(index + 1) }));

    assert.equal(DESKTOP_COLUMNS_PER_PAGE, 5);
    assert.equal(MOBILE_COLUMNS_PER_PAGE, 3);
    assert.deepEqual(getColumnPage(columns, 0, 5).map((column) => column.key), ['1', '2', '3', '4', '5']);
    assert.deepEqual(getColumnPage(columns, 1, 5).map((column) => column.key), ['6', '7', '8', '9', '10']);
    assert.deepEqual(getColumnPage(columns, 2, 5).map((column) => column.key), ['11', '12']);
    assert.deepEqual(getColumnPage(columns, 0, 3).map((column) => column.key), ['1', '2', '3']);
    assert.deepEqual(getColumnPage(columns, 3, 3).map((column) => column.key), ['10', '11', '12']);
    assert.equal(getPageCount(12, 5), 3);
    assert.equal(getPageCount(12, 3), 4);
    assert.equal(getPageCount(0, 5), 1);

    for (const count of [1, 5, 6, 10, 11, 12]) {
      const desktopColumns = columns.slice(0, count);
      const pages = getPageCount(count, DESKTOP_COLUMNS_PER_PAGE);
      for (let page = 0; page < pages; page += 1) {
        assert.ok(getColumnPage(desktopColumns, page, DESKTOP_COLUMNS_PER_PAGE).length <= 5);
      }
    }
    for (const count of [1, 3, 4, 6, 7, 10]) {
      const mobileColumns = columns.slice(0, count);
      const pages = getPageCount(count, MOBILE_COLUMNS_PER_PAGE);
      for (let page = 0; page < pages; page += 1) {
        assert.ok(getColumnPage(mobileColumns, page, MOBILE_COLUMNS_PER_PAGE).length <= 3);
      }
    }
  } finally {
    await server.close();
  }
});

test('shared app background includes the exact local-ui pixel grid', async () => {
  {
    const css = await readFile(
      fileURLToPath(new URL('../src/styles/global.css', import.meta.url)),
      'utf8',
    );
    assert.match(
      css.replace(/\s+/g, ' '),
      /\.app-event-background \{ background: radial-gradient\(circle at 12% 18%, rgba\(151, 190, 146, \.35\), transparent 27rem\), linear-gradient\(rgba\(16, 67, 48, \.055\) 1px, transparent 1px\), linear-gradient\(90deg, rgba\(16, 67, 48, \.055\) 1px, transparent 1px\), #eef1e7; background-size: auto, 42px 42px, 42px 42px, auto; \}/,
    );
  }
});

test('Edit Event guards direct past clicks without rejecting drag results', async () => {
  const server = await createTestServer();
  try {
    const { createEditEventSchema, isBlockedPastDate } = await server.ssrLoadModule(
      '/src/features/heatmap/schema.ts',
    );
    const { applyDirectDateSelection, applyDraggedDateRange } = await server.ssrLoadModule(
      '/src/features/heatmap/date-selection.ts',
    );
    const today = new Date(2026, 8, 17);
    const historicalDate = '2026-09-15';
    const base = {
      title: 'Planning',
      eventType: 1,
      availableDates: [historicalDate, '2026-09-17'],
      availableWeekdays: [],
      dailyStartTime: '08:00',
      dailyEndTime: '09:00',
    };

    assert.equal(isBlockedPastDate(new Date(2026, 8, 15), [], today), true);
    assert.equal(isBlockedPastDate(new Date(2026, 8, 16), [], today), true);
    assert.equal(isBlockedPastDate(new Date(2026, 8, 15), [historicalDate], today), false);
    assert.equal(isBlockedPastDate(new Date(2026, 8, 17), [historicalDate], today), false);
    assert.equal(isBlockedPastDate(new Date(2026, 8, 18), [historicalDate], today), false);
    assert.equal(createEditEventSchema([historicalDate], today).safeParse(base).success, true);
    assert.deepEqual(
      applyDirectDateSelection(
        base.availableDates,
        [...base.availableDates, '2026-09-16'],
        new Date(2026, 8, 16),
        [historicalDate],
        today,
      ),
      base.availableDates,
    );
    assert.deepEqual(
      applyDirectDateSelection(
        base.availableDates,
        [...base.availableDates, '2026-09-18'],
        new Date(2026, 8, 18),
        [historicalDate],
        today,
      ),
      [historicalDate, '2026-09-17', '2026-09-18'],
    );
    assert.deepEqual(
      applyDirectDateSelection(
        base.availableDates,
        [historicalDate],
        new Date(2026, 8, 17),
        [historicalDate],
        today,
      ),
      [historicalDate],
    );
    assert.deepEqual(
      applyDirectDateSelection(
        base.availableDates,
        ['2026-09-17'],
        new Date(2026, 8, 15),
        [historicalDate],
        today,
      ),
      ['2026-09-17'],
    );
    assert.deepEqual(
      applyDraggedDateRange([], new Date(2026, 8, 14), new Date(2026, 8, 18), true),
      ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'],
    );
    assert.deepEqual(
      applyDraggedDateRange([], new Date(2026, 8, 18), new Date(2026, 8, 14), true),
      ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'],
    );
    assert.equal(
      createEditEventSchema([historicalDate], today).safeParse({
        ...base,
        availableDates: [...base.availableDates, '2026-09-16'],
      }).success,
      true,
    );

    const dialogSource = await readFile(
      fileURLToPath(new URL('../src/features/heatmap/components/EditEventDialog.tsx', import.meta.url)),
      'utf8',
    );
    assert.doesNotMatch(dialogSource, /disabled=\{\(date\) => isBlockedPastDate/);
    assert.doesNotMatch(dialogSource, /calendarDayDisabled|opacity-50 \[&>button\]:cursor-not-allowed/);
    assert.match(dialogSource, /modifiers=\{\{ blockedPast:/);
    assert.match(dialogSource, /components=\{\{ DayButton: EditEventDayButton \}\}/);
  } finally {
    await server.close();
  }
});

test('historical event dates remain paginated and selectable in the Heatmap', async () => {
  const server = await createTestServer();
  try {
    const { HeatmapCell } = await server.ssrLoadModule(
      '/src/features/heatmap/components/HeatmapCell.tsx',
    );
    const { mockDatesEvent } = await server.ssrLoadModule('/src/features/heatmap/mock.ts');
    const { buildRows, getColumnPage, getColumns } = await server.ssrLoadModule(
      '/src/features/heatmap/time.ts',
    );
    const availableDates = [
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
      '2026-09-18',
      '2026-09-19',
      '2026-09-20',
    ];
    const historicalCell = {
      specificDate: availableDates[0],
      dayOfWeek: null,
      startTime: '08:00',
      participants: ['Dương'],
      count: 1,
    };
    const event = {
      ...mockDatesEvent,
      availableDates,
      heatmapGrid: [historicalCell],
    };
    const columns = getColumns(event);

    assert.deepEqual(
      getColumnPage(columns, 0, 5).map(({ specificDate }) => specificDate),
      availableDates.slice(0, 5),
    );
    assert.deepEqual(
      getColumnPage(columns, 1, 5).map(({ specificDate }) => specificDate),
      availableDates.slice(5),
    );
    assert.deepEqual(
      getColumnPage(columns, 0, 3).map(({ specificDate }) => specificDate),
      availableDates.slice(0, 3),
    );
    assert.deepEqual(
      getColumnPage(columns, 1, 3).map(({ specificDate }) => specificDate),
      availableDates.slice(3),
    );

    const point = {
      column: columns[0],
      row: buildRows(event.dailyStartTime, event.dailyEndTime)[0],
    };
    const started = [];
    const extended = [];
    const cellElement = HeatmapCell({
      point,
      cell: historicalCell,
      total: event.participants.length,
      suggestions: [],
      selected: null,
      selecting: true,
      onInspect: () => undefined,
      onInspectEnd: () => undefined,
      onStart: (value) => started.push(value),
      onExtend: (value) => extended.push(value),
      onKeyboardSelect: () => undefined,
    });
    const button = cellElement.props.children[0];

    assert.equal(button.props.disabled, undefined);
    assert.match(button.props['aria-label'], /1 of 8 participants available/);
    button.props.onPointerDown({
      button: 0,
      pointerId: 1,
      preventDefault: () => undefined,
      currentTarget: {
        hasPointerCapture: () => false,
        releasePointerCapture: () => undefined,
      },
    });
    button.props.onPointerEnter();
    assert.deepEqual(started, [point]);
    assert.deepEqual(extended, [point]);
  } finally {
    await server.close();
  }
});

test('selecting a key participant preserves the API order', async () => {
  const server = await createTestServer();
  try {
    const { KeyParticipantSelector } = await server.ssrLoadModule(
      '/src/features/heatmap/components/KeyParticipantSelector.tsx',
    );
    const participants = ['Huy', 'Uyên', 'Bảo', 'Dương'].map((username) => ({ username }));
    const html = renderToStaticMarkup(
      createElement(KeyParticipantSelector, {
        participants,
        selected: 'Bảo',
        disabled: false,
        onChange: () => undefined,
      }),
    );

    assert.ok(html.indexOf('Huy') < html.indexOf('Uyên'));
    assert.ok(html.indexOf('Uyên') < html.indexOf('Bảo'));
    assert.ok(html.indexOf('Bảo') < html.indexOf('Dương'));
    assert.match(html, /aria-pressed="true"/);
  } finally {
    await server.close();
  }
});

test('inspected cell details can be shown by hover or tap and dismissed after leaving', async () => {
  const server = await createTestServer();
  try {
    const { HeatmapCell } = await server.ssrLoadModule(
      '/src/features/heatmap/components/HeatmapCell.tsx',
    );
    const { mockDatesEvent } = await server.ssrLoadModule('/src/features/heatmap/mock.ts');
    const { buildRows, getColumns } = await server.ssrLoadModule(
      '/src/features/heatmap/time.ts',
    );
    const point = {
      column: getColumns(mockDatesEvent)[0],
      row: buildRows(mockDatesEvent.dailyStartTime, mockDatesEvent.dailyEndTime)[0],
    };
    const inspected = [];
    let leaveCount = 0;
    const cellElement = HeatmapCell({
      point,
      cell: mockDatesEvent.heatmapGrid[0],
      total: mockDatesEvent.participants.length,
      suggestions: [],
      selected: null,
      selecting: false,
      onInspect: (details) => inspected.push(details),
      onInspectEnd: () => { leaveCount += 1; },
      onStart: () => undefined,
      onExtend: () => undefined,
      onKeyboardSelect: () => undefined,
    });
    const button = cellElement.props.children[0];

    button.props.onMouseEnter();
    button.props.onClick({ detail: 1 });
    button.props.onMouseLeave();

    assert.equal(inspected.length, 2);
    assert.equal(leaveCount, 1);
  } finally {
    await server.close();
  }
});

test('participant details render nothing without an active cell', async () => {
  const server = await createTestServer();
  try {
    const { AvailabilityDetails } = await server.ssrLoadModule(
      '/src/features/heatmap/components/AvailabilityDetails.tsx',
    );
    const html = renderToStaticMarkup(
      createElement(AvailabilityDetails, {
        details: null,
        participants: [],
        keyParticipant: null,
      }),
    );

    assert.equal(html, '');
  } finally {
    await server.close();
  }
});

test('participant details use a bounded scroll area for long lists', async () => {
  const server = await createTestServer();
  try {
    const { AvailabilityDetails } = await server.ssrLoadModule(
      '/src/features/heatmap/components/AvailabilityDetails.tsx',
    );
    const participants = Array.from({ length: 40 }, (_, index) => ({
      username: `Participant ${index + 1}`,
    }));
    const html = renderToStaticMarkup(
      createElement(AvailabilityDetails, {
        details: {
          dayLabel: 'Monday',
          startTime: '08:00',
          endTime: '08:15',
          availableNames: participants.slice(0, 20).map(({ username }) => username),
          count: 20,
        },
        participants,
        keyParticipant: 'Participant 1',
      }),
    );

    assert.match(html, /data-slot="scroll-area"/);
    assert.match(html, /h-72/);
    assert.match(html, /Participant 40/);
  } finally {
    await server.close();
  }
});

test('finalized schedule keeps the blue range on the Heatmap', async () => {
  const server = await createTestServer();
  try {
    const { Heatmap } = await server.ssrLoadModule(
      '/src/features/heatmap/components/Heatmap.tsx',
    );
    const { mockDatesEvent } = await server.ssrLoadModule('/src/features/heatmap/mock.ts');
    const finalSchedule = {
      specificDate: mockDatesEvent.availableDates[0],
      dayOfWeek: null,
      startTime: '10:00',
      endTime: '11:00',
    };
    const html = renderToStaticMarkup(
      createElement(Heatmap, {
        event: { ...mockDatesEvent, status: 2, finalSchedule },
        suggestions: [],
        selected: finalSchedule,
        selecting: false,
        onInspect: () => undefined,
        onInspectEnd: () => undefined,
        onStart: () => undefined,
        onExtend: () => undefined,
        onKeyboardSelect: () => undefined,
      }),
    );

    assert.equal((html.match(/border-blue-700/g) ?? []).length, 8);
    assert.equal((html.match(/border-red-500/g) ?? []).length, 0);
  } finally {
    await server.close();
  }
});
