import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('Jitsi rooms are random, hard to guess and pass the meeting link rules', async () => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  });
  try {
    const { createJitsiRoomUrl, meetingProvider, normalizeMeetingLink } = await server.ssrLoadModule('/src/features/heatmap/meetingLink.ts');

    const url = createJitsiRoomUrl();
    assert.match(url, /^https:\/\/meet\.jit\.si\/Meetly-[a-km-np-z2-9]{12}$/);
    assert.equal(normalizeMeetingLink(url).url, url);
    assert.equal(meetingProvider(url), 'jitsi');

    // Mỗi lần một phòng mới (bộ sinh ngẫu nhiên an toàn, không phải Math.random)
    const rooms = new Set(Array.from({ length: 200 }, () => createJitsiRoomUrl()));
    assert.equal(rooms.size, 200);

    // Nguồn ngẫu nhiên được truyền vào quyết định hoàn toàn tên phòng
    assert.equal(createJitsiRoomUrl((bytes) => bytes.fill(0)), 'https://meet.jit.si/Meetly-aaaaaaaaaaaa');

    assert.equal(meetingProvider('https://meet.google.com/abc-defg-hij'), 'google');
    assert.equal(meetingProvider('https://zoom.us/j/1'), 'other');
    assert.equal(meetingProvider('not a url'), 'other');

    // Giống backend: chặn link giả dạng có "user@" trước host
    assert.equal(normalizeMeetingLink('https://evil.example@meet.google.com/abc-defg-hij').error, 'invalid');
  } finally {
    await server.close();
  }
});
