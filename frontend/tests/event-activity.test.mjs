import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

test('diffActivity finds who changed availability and who just joined', async () => {
  const server = await createServer({
    configFile: false,
    resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, hmr: false, watch: null, ws: false },
    appType: 'custom',
  });
  try {
    const { diffActivity } = await server.ssrLoadModule('/src/shared/lib/eventActivity.ts');
    const cell = (startTime, participants) => ({ specificDate: '2026-12-01', dayOfWeek: null, startTime, participants, count: participants.length });
    const before = {
      participants: [{ username: 'Anh' }, { username: 'Minh' }],
      heatmapGrid: [cell('09:00', ['Anh', 'Minh']), cell('09:15', ['Anh'])],
    };

    // Minh bỏ 09:00 và thêm 09:15; Anh không đổi; Linh mới vào và chọn 09:00
    const after = {
      participants: [{ username: 'Anh' }, { username: 'Minh' }, { username: 'Linh' }],
      heatmapGrid: [cell('09:00', ['Anh', 'Linh']), cell('09:15', ['Anh', 'Minh'])],
    };
    assert.deepEqual(diffActivity(before, after), [
      { name: 'Linh', kind: 'joined' },
      { name: 'Minh', kind: 'updated' },
    ]);

    // Lưới y hệt: không ai làm gì
    assert.deepEqual(diffActivity(before, { heatmapGrid: before.heatmapGrid }), []);

    // Ô biến mất khỏi lưới mới (người duy nhất bỏ chọn) vẫn tính là đã đổi
    assert.deepEqual(diffActivity(before, { heatmapGrid: [cell('09:00', ['Anh', 'Minh'])] }), [{ name: 'Anh', kind: 'updated' }]);
  } finally {
    await server.close();
  }
});
