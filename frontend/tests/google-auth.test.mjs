import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const SCOPE = 'https://www.googleapis.com/auth/calendar.freebusy';

/** Mỗi test một server mới để module `lib/google.ts` có bộ nhớ token sạch */
async function withGoogle({ clientId = 'client-123', respond }, run) {
  const server = await createServer({
    configFile: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify('http://backend.test/'),
      'import.meta.env.VITE_SIGNALR_HUB_URL': JSON.stringify('http://backend.test/hubs/events'),
      'import.meta.env.VITE_GOOGLE_CLIENT_ID': JSON.stringify(clientId),
    },
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  });

  // Bản giả của Google Identity Services: `respond(config)` quyết định Google trả gì cho mỗi lần mở popup
  const popups = [];
  const oauth2 = {
    initTokenClient: (config) => ({
      requestAccessToken: () => {
        popups.push(config);
        queueMicrotask(() => respond(config, popups.length));
      },
    }),
    hasGrantedAllScopes: (response, scope) => (response.scope ?? '').split(' ').includes(scope),
  };
  const previousWindow = globalThis.window;
  globalThis.window = { google: { accounts: { oauth2 } } };
  try {
    const google = await server.ssrLoadModule('/src/lib/google.ts');
    await run(google, popups);
  } finally {
    globalThis.window = previousWindow;
    await server.close();
  }
}

const grant = (token, expiresIn = 3599) => (config) =>
  config.callback({ access_token: token, expires_in: expiresIn, scope: config.scope });

async function expectKind(promise, GoogleAuthError, kind) {
  await assert.rejects(promise, (error) => {
    assert.ok(error instanceof GoogleAuthError);
    assert.equal(error.kind, kind);
    return true;
  });
}

test('without a client ID Google features are off and token requests fail fast', async () => {
  await withGoogle({ clientId: '', respond: grant('never') }, async (google, popups) => {
    assert.equal(google.isGoogleConfigured, false);
    await expectKind(google.requestGoogleAccessToken(SCOPE), google.GoogleAuthError, 'not_configured');
    assert.equal(popups.length, 0);
  });
});

test('a granted token is requested for exactly the asked scope and reused while valid', async () => {
  await withGoogle({ respond: grant('token-1') }, async (google, popups) => {
    assert.equal(google.isGoogleConfigured, true);
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-1');
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-1');
    assert.equal(popups.length, 1);
    assert.equal(popups[0].client_id, 'client-123');
    assert.equal(popups[0].scope, SCOPE);
  });
});

test('clicking again while the consent window is open shares one request', async () => {
  await withGoogle({ respond: grant('token-1') }, async (google, popups) => {
    const [first, second] = await Promise.all([
      google.requestGoogleAccessToken(SCOPE),
      google.requestGoogleAccessToken(SCOPE),
    ]);
    assert.equal(first, 'token-1');
    assert.equal(second, 'token-1');
    assert.equal(popups.length, 1);
  });
});

test('a token close to expiry or invalidated is requested again', async () => {
  await withGoogle({ respond: (config, count) => grant(`token-${count}`, count === 1 ? 30 : 3599)(config) }, async (google, popups) => {
    // Hạn 30 giây nằm trong vùng đệm 60 giây nên không được dùng lại
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-1');
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-2');
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-2');

    google.invalidateGoogleToken(SCOPE);
    assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-3');
    assert.equal(popups.length, 3);
  });
});

test('denied consent or an unticked scope is reported as access denied', async () => {
  await withGoogle({ respond: (config) => config.callback({ error: 'access_denied' }) }, async (google) => {
    await expectKind(google.requestGoogleAccessToken(SCOPE), google.GoogleAuthError, 'access_denied');
  });
  await withGoogle({ respond: (config) => config.callback({ access_token: 't', expires_in: 3599, scope: 'openid' }) }, async (google) => {
    await expectKind(google.requestGoogleAccessToken(SCOPE), google.GoogleAuthError, 'access_denied');
  });
});

test('closed or blocked consent windows are told apart, and a failed attempt can be retried', async () => {
  await withGoogle({ respond: (config) => config.error_callback({ type: 'popup_closed' }) }, async (google) => {
    await expectKind(google.requestGoogleAccessToken(SCOPE), google.GoogleAuthError, 'popup_closed');
  });
  await withGoogle(
    {
      respond: (config, count) =>
        count === 1 ? config.error_callback({ type: 'popup_failed_to_open' }) : grant('token-2')(config),
    },
    async (google, popups) => {
      await expectKind(google.requestGoogleAccessToken(SCOPE), google.GoogleAuthError, 'popup_blocked');
      assert.equal(await google.requestGoogleAccessToken(SCOPE), 'token-2');
      assert.equal(popups.length, 2);
    },
  );
});
