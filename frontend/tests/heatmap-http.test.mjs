import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';

async function createTestServer() {
  return createServer({
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
}

test('Axios uses the environment host and Meetly API prefix', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    assert.equal(api.defaults.baseURL, 'http://backend.test/api/v1');
    assert.equal(api.defaults.headers.common.Accept, 'application/json');
  } finally {
    await server.close();
  }
});

test('SignalR manager uses the configured shared events hub', async () => {
  const server = await createTestServer();
  try {
    const { env } = await server.ssrLoadModule('/src/lib/env.ts');
    const { shouldApplyRealtimePayload } = await server.ssrLoadModule(
      '/src/features/heatmap/hooks/useEventRealtime.ts',
    );

    assert.equal(env.signalRHubUrl, 'http://backend.test/hubs/events');
    assert.equal(shouldApplyRealtimePayload(10, 'ABC', { shortCode: 'abc', revision: 11 }), true);
    assert.equal(shouldApplyRealtimePayload(10, 'ABC', { shortCode: 'ABC', revision: 10 }), false);
    assert.equal(shouldApplyRealtimePayload(10, 'ABC', { shortCode: 'OTHER', revision: 12 }), false);
    const managerSource = await readFile(
      fileURLToPath(new URL('../src/lib/signalr.ts', import.meta.url)),
      'utf8',
    );
    assert.match(managerSource, /withUrl\(env\.signalRHubUrl/);
    assert.match(managerSource, /withAutomaticReconnect\(\)/);
    assert.match(managerSource, /JoinEvent/);
    assert.match(managerSource, /LeaveEvent/);
  } finally {
    await server.close();
  }
});

test('Update Event accepts the Backend null value then refetches the event', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { updateEvent } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    const calls = [];
    api.defaults.adapter = async (config) => {
      calls.push(config);
      if (config.method === 'put') {
        return { data: { isSuccess: true, code: 200, message: 'Updated', value: null }, status: 200, statusText: 'OK', headers: {}, config };
      }
      return {
        data: { isSuccess: true, code: 200, message: 'Loaded', value: { shortCode: 'ABC', revision: 7 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    const payload = {
      title: 'Updated event',
      eventType: 1,
      availableDates: ['2026-09-20'],
      availableWeekdays: [],
      dailyStartTime: '08:00',
      dailyEndTime: '09:00',
    };

    const result = await updateEvent('ABC', payload);
    assert.equal(result.revision, 7);
    assert.deepEqual(calls.map(({ method }) => method), ['put', 'get']);
    assert.deepEqual(JSON.parse(calls[0].data), payload);
    assert.equal('adminUsername' in JSON.parse(calls[0].data), false);
    assert.equal('adminPassword' in JSON.parse(calls[0].data), false);
  } finally {
    await server.close();
  }
});

test('Heatmap services unwrap once and preserve suggestion query parameters', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getEvent, getSuggestions } = await server.ssrLoadModule(
      '/src/features/heatmap/services.ts',
    );
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return {
        data: {
          isSuccess: true,
          code: 200,
          message: 'Success',
          value: config.url.endsWith('/suggestions')
            ? { suggestedSlots: [] }
            : { shortCode: 'OTHER', revision: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    assert.deepEqual(await getSuggestions('A/B', { keyParticipant: ' Huy ', minDuration: 60 }), []);
    assert.equal(requests[0].url, '/events/A%2FB/suggestions');
    assert.deepEqual(requests[0].params, { keyParticipant: 'Huy', minDuration: 60 });
    assert.equal(
      api.getUri(requests[0]),
      'http://backend.test/api/v1/events/A%2FB/suggestions?keyParticipant=Huy&minDuration=60',
    );

    await getEvent('OTHER');

    await getSuggestions('A/B', { minDuration: 90 });
    assert.equal(
      api.getUri(requests[2]),
      'http://backend.test/api/v1/events/A%2FB/suggestions?minDuration=90',
    );
  } finally {
    await server.close();
  }
});

test('Heatmap services preserve a failed Meetly response message', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getEvent } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    api.defaults.adapter = async (config) => ({
      data: {
        isSuccess: false,
        code: 404,
        message: 'Event not found',
        value: null,
      },
      status: 404,
      statusText: 'Not Found',
      headers: {},
      config,
    });

    await assert.rejects(() => getEvent('UNKNOWN'), /Event not found/);
  } finally {
    await server.close();
  }
});

test('Axios normalizes PascalCase Meetly envelopes', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getEvent } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    api.defaults.adapter = async (config) => ({
      data: {
        IsSuccess: false,
        Code: 403,
        Message: 'Session is not allowed for this event',
        Value: null,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    await assert.rejects(
      () => getEvent('OTHER'),
      (error) => error?.status === 403 && /not allowed/.test(error.message),
    );
  } finally {
    await server.close();
  }
});

test('participants/me keeps the authoritative event session fields', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getCurrentParticipant } = await server.ssrLoadModule(
      '/src/features/heatmap/services.ts',
    );
    api.defaults.adapter = async (config) => ({
      data: {
        isSuccess: true,
        code: 200,
        message: 'Loaded',
        value: {
          participantId: 'participant-1',
          username: 'Host',
          isAdmin: true,
          timeSlots: [],
          eventStatus: 2,
          revision: 12,
        },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    assert.deepEqual(await getCurrentParticipant('ABC'), {
      participantId: 'participant-1',
      username: 'Host',
      isAdmin: true,
      timeSlots: [],
      eventStatus: 2,
      revision: 12,
    });
  } finally {
    await server.close();
  }
});

test('production event route loads the route short code from the real service', async () => {
  const routeSource = await readFile(
    fileURLToPath(new URL('../src/features/heatmap/pages/HeatmapRoutePage.tsx', import.meta.url)),
    'utf8',
  );
  const routerSource = await readFile(
    fileURLToPath(new URL('../src/app/router.tsx', import.meta.url)),
    'utf8',
  );
  const loaderSource = await readFile(
    fileURLToPath(new URL('../src/features/heatmap/route-loader.ts', import.meta.url)),
    'utf8',
  );

  assert.match(routeSource, /loadHeatmapRouteData\(shortCode\)/);
  assert.match(loaderSource, /getEvent\(shortCode\)/);
  assert.match(loaderSource, /getEventSession\(shortCode\)/);
  assert.match(loaderSource, /getCurrentParticipant\(shortCode\)/);
  assert.match(routeSource, /onSuggestions/);
  assert.match(routeSource, /onFinalize/);
  assert.match(routeSource, /onUpdateEvent/);
  assert.doesNotMatch(routeSource, /features\/participants|useParticipantStore/);
  assert.doesNotMatch(routeSource, /location\.state/);
  assert.match(routerSource, /path: '\/e\/:shortCode'/);
  assert.match(routerSource, /path: '\/__heatmap-demo'/);
});

test('Axios attaches only the matching Event session token', async () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const server = await createTestServer();
  try {
    const { saveEventSession } = await server.ssrLoadModule('/src/shared/auth/event-session.ts');
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getEvent, getSuggestions } = await server.ssrLoadModule(
      '/src/features/heatmap/services.ts',
    );
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return {
        data: {
          isSuccess: true,
          code: 200,
          message: 'Success',
          value: config.url.endsWith('/suggestions')
            ? { suggestedSlots: [] }
            : { shortCode: 'ABC', revision: 1 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    saveEventSession({
      shortCode: 'ABC',
      participantId: 'participant-1',
      username: 'Host',
      accessToken: 'host-token',
      expiresAt: '2099-01-01T00:00:00Z',
    });

    await getSuggestions('ABC', { minDuration: 60 });
    await getEvent('BBB');
    assert.equal(requests[0].headers.Authorization, 'Bearer host-token');
    assert.equal(requests[1].headers.Authorization, undefined);

    saveEventSession({
      shortCode: 'EXPIRED',
      participantId: 'participant-1',
      username: 'Host',
      accessToken: 'expired-token',
      expiresAt: '2020-01-01T00:00:00Z',
    });
    await getEvent('EXPIRED');
    assert.equal(requests[2].headers.Authorization, undefined);
  } finally {
    await server.close();
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});

test('Heatmap route loader restores Host role and clears rejected sessions', async () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
  const server = await createTestServer();
  try {
    const { saveEventSession, getEventSession } = await server.ssrLoadModule(
      '/src/shared/auth/event-session.ts',
    );
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { loadHeatmapRouteData } = await server.ssrLoadModule(
      '/src/features/heatmap/route-loader.ts',
    );
    const session = {
      shortCode: 'ABC',
      participantId: 'participant-1',
      username: 'Host',
      accessToken: 'host-token',
      expiresAt: '2099-01-01T00:00:00Z',
    };
    const event = { shortCode: 'ABC', status: 1, revision: 1 };
    const requests = [];
    api.defaults.adapter = async (config) => {
      requests.push(config);
      return {
        data: {
          isSuccess: true,
          code: 200,
          message: 'Success',
          value: config.url.endsWith('/participants/me')
            ? { participantId: 'participant-1', username: 'Host', isAdmin: true, timeSlots: [], eventStatus: 1, revision: 1 }
            : event,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const publicEvent = await loadHeatmapRouteData('ABC');
    assert.equal(publicEvent.isAdmin, false);
    assert.equal(publicEvent.accessToken, undefined);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/events/ABC');

    saveEventSession(session);
    const host = await loadHeatmapRouteData('ABC');
    assert.equal(host.isAdmin, true);
    assert.equal(host.accessToken, 'host-token');

    for (const rejectionCode of [401, 403]) {
      saveEventSession(session);
      api.defaults.adapter = async (config) => ({
        data: config.url.endsWith('/participants/me')
          ? { isSuccess: false, code: rejectionCode, message: 'Rejected', value: null }
          : { isSuccess: true, code: 200, message: 'Success', value: event },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      });
      const publicFallback = await loadHeatmapRouteData('ABC');
      assert.equal(publicFallback.isAdmin, false);
      assert.equal(publicFallback.accessToken, undefined);
      assert.equal(getEventSession('ABC'), null);
    }
  } finally {
    await server.close();
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
  }
});
