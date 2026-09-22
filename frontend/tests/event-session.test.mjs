import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test('Event session persists, stays event-scoped, and rejects expiry', async () => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null },
    appType: 'custom',
  });
  try {
    const { clearEventSession, getEventSession, saveEventSession } =
      await server.ssrLoadModule('/src/shared/auth/event-session.ts');
    const storage = memoryStorage();
    const session = {
      shortCode: 'abc123',
      participantId: 'participant-1',
      username: 'Host',
      accessToken: 'event-a-token',
      expiresAt: '2099-01-01T00:00:00Z',
    };

    saveEventSession(session, storage);
    assert.deepEqual(getEventSession('ABC123', storage, Date.parse('2026-01-01')), {
      ...session,
      shortCode: 'ABC123',
    });
    assert.equal(getEventSession('BBBBBB', storage, Date.parse('2026-01-01')), null);
    assert.equal(getEventSession('ABC123', storage, Date.parse('2100-01-01')), null);

    saveEventSession(session, storage);
    clearEventSession('BBBBBB', storage);
    assert.equal(getEventSession('ABC123', storage, Date.parse('2026-01-01'))?.accessToken, 'event-a-token');
    clearEventSession('abc123', storage);
    assert.equal(getEventSession('ABC123', storage, Date.parse('2026-01-01')), null);
  } finally {
    await server.close();
  }
});
