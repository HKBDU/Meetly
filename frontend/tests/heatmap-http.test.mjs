import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { AxiosError } from 'axios';
import { createServer } from 'vite';

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
  } finally {
    await server.close();
  }
});

test('SignalR uses the configured events hub', async () => {
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
  } finally {
    await server.close();
  }
});

test('Heatmap services unwrap responses and pass params and event token to Axios', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getSuggestions } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    let requestConfig;
    api.defaults.adapter = async (config) => {
      requestConfig = config;
      return {
        data: {
          isSuccess: true,
          code: 200,
          message: 'Success',
          value: { suggestedSlots: [] },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    assert.deepEqual(
      await getSuggestions('A/B', { keyParticipant: ' Huy ', minDuration: 60 }, 'event-token'),
      [],
    );
    assert.equal(requestConfig.url, '/events/A%2FB/suggestions');
    assert.deepEqual(requestConfig.params, { keyParticipant: 'Huy', minDuration: 60 });
    assert.equal(requestConfig.headers.Authorization, 'Bearer event-token');
    assert.equal(
      api.getUri(requestConfig),
      'http://backend.test/api/v1/events/A%2FB/suggestions?keyParticipant=Huy&minDuration=60',
    );

    await getSuggestions('ABC', { minDuration: 90 }, 'event-token');
    assert.equal(
      api.getUri(requestConfig),
      'http://backend.test/api/v1/events/ABC/suggestions?minDuration=90',
    );
  } finally {
    await server.close();
  }
});

test('Heatmap services show an English message for a failed response', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { getEvent } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    api.defaults.adapter = async (config) => {
      const response = {
        data: { isSuccess: false, code: 404, message: 'Evento no encontrado', value: null },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
      };
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
    };

    await assert.rejects(() => getEvent('UNKNOWN'), /Event not found/);
  } finally {
    await server.close();
  }
});

test('Update event sends the admin credentials and keeps the session on a wrong password', async () => {
  const server = await createTestServer();
  try {
    const { api } = await server.ssrLoadModule('/src/lib/axios.ts');
    const { updateEvent } = await server.ssrLoadModule('/src/features/heatmap/services.ts');
    const { useParticipantStore } = await server.ssrLoadModule('/src/features/participants/store.ts');
    const payload = {
      title: 'Team sync',
      eventType: 1,
      availableDates: ['2026-09-25'],
      availableWeekdays: [],
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
    };
    const admin = { username: 'host', password: 'secret' };

    let sent;
    api.defaults.adapter = async (config) => {
      sent = JSON.parse(config.data);
      return {
        data: { isSuccess: true, code: 200, message: 'ok', value: { revision: 3 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    assert.deepEqual(await updateEvent('ABC', payload, 'event-token', admin), { revision: 3 });
    assert.deepEqual(sent, { ...payload, adminUsername: 'host', adminPassword: 'secret' });

    useParticipantStore.getState().login(
      {
        shortCode: 'ABC',
        participantId: 'p1',
        username: 'host',
        isAdmin: true,
        accessToken: 'event-token',
      },
      [],
    );
    api.defaults.adapter = async (config) => {
      const response = {
        data: { IsSuccess: false, Code: 401, Message: 'Password is invalid.', Value: null },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      };
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
    };
    await assert.rejects(
      () => updateEvent('ABC', payload, 'event-token', { ...admin, password: 'wrong' }),
      /Incorrect admin password/,
    );
    assert.equal(useParticipantStore.getState().auth?.accessToken, 'event-token');
  } finally {
    await server.close();
  }
});
