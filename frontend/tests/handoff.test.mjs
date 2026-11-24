import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('extension session handoff round-trips through the URL fragment', async () => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  });
  try {
    const { handoffUrl, readHandoff } = await server.ssrLoadModule('/src/shared/lib/handoff.ts');
    const session = { participantId: 'p-1', username: 'Nguyễn Văn Á', isAdmin: true, accessToken: 'token.abc' };
    const url = new URL(handoffUrl('https://meetly.test/', 'ab12cd', session, 'share'));

    assert.equal(url.pathname, '/e/ab12cd/share');
    // Phiên nằm trong fragment, không bao giờ gửi lên server
    assert.equal(url.search, '');
    assert.deepEqual(readHandoff(url), { shortCode: 'AB12CD', ...session });

    assert.equal(readHandoff({ pathname: '/e/ABC', search: '', hash: '#handoff=not-base64' }), null);
    assert.equal(readHandoff({ pathname: '/create', search: '', hash: url.hash }), null);
  } finally {
    await server.close();
  }
});
