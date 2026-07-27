import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_DIAGNOSTIC_EVENTS,
  clearDiagnosticEvents,
  createSupportReport,
  fetchDeploymentMetadata,
  getDiagnosticEvents,
  getRuntimeSnapshot,
  recordDiagnosticEvent,
  sanitizeDiagnosticText,
} from '../src/systems/diagnostics.js';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

test('診断文からアカウント・ID・認証情報を除去する', () => {
  const sanitized = sanitizeDiagnosticText(
    'user@example.com 123e4567-e89b-42d3-a456-426614174000 sb_publishable_secret Bearer raw-secret https://example.test/?access_token=secret&apikey=also-secret',
  );
  assert.equal(sanitized.includes('user@example.com'), false);
  assert.equal(sanitized.includes('123e4567'), false);
  assert.equal(sanitized.includes('sb_publishable_secret'), false);
  assert.equal(sanitized.includes('access_token=secret'), false);
  assert.equal(sanitized.includes('raw-secret'), false);
  assert.equal(sanitized.includes('apikey=also-secret'), false);
  assert.match(sanitized, /\[email\].*\[id\].*\[key\].*\[redacted\]/);
});

test('診断履歴は端末内に直近20件だけ保持できる', () => {
  const storage = createMemoryStorage();
  for (let index = 0; index < 25; index += 1) {
    recordDiagnosticEvent({ source: 'test', code: `failure-${index}`, message: `error ${index}` }, {
      storage,
      now: new Date(1_700_000_000_000 + index),
    });
  }
  const events = getDiagnosticEvents(storage);
  assert.equal(events.length, MAX_DIAGNOSTIC_EVENTS);
  assert.equal(events[0].code, 'failure-5');
  assert.equal(events.at(-1).code, 'failure-24');
  assert.equal(clearDiagnosticEvents(storage), true);
  assert.deepEqual(getDiagnosticEvents(storage), []);
});

test('サポートレポートに学習データやアカウント識別情報を含めない', () => {
  const storage = createMemoryStorage();
  storage.setItem('kanji_town_v7', JSON.stringify({ email: 'private@example.com', kanjiStats: { secret: true } }));
  const runtime = getRuntimeSnapshot({
    storage,
    navigatorValue: { onLine: true, serviceWorker: { controller: {} } },
    matchMedia: () => ({ matches: true }),
  });
  const report = createSupportReport({
    runtime: { ...runtime, user: { email: 'private@example.com' }, learningData: { secret: true } },
    deployment: {
      status: 'current',
      release: { version: '0.1.0', commit: 'abc123', builtAt: '2026-07-21', secret: 'private@example.com' },
    },
    diagnostics: [{ message: 'Failed for private@example.com', detail: 'token?access_token=secret' }],
    now: new Date('2026-07-21T00:00:00Z'),
  });
  const serialized = JSON.stringify(report);
  assert.equal(report.runtime.storage.available, true);
  assert.equal(serialized.includes('private@example.com'), false);
  assert.equal(serialized.includes('kanjiStats'), false);
  assert.equal(report.runtime.learningData, undefined);
  assert.equal(serialized.includes('access_token=secret'), false);
  assert.deepEqual(report.privacy, {
    learningDataIncluded: false,
    accountDataIncluded: false,
    credentialsIncluded: false,
  });
});

test('配信メタデータが壊れている場合は安全にエラー扱いにする', async () => {
  const invalid = await fetchDeploymentMetadata({
    baseUrl: 'https://example.test/app/',
    fetchImpl: async () => ({ ok: true, json: async () => ({ unexpected: true }) }),
  });
  assert.deepEqual(invalid, { status: 'error', release: null });

  const offline = await fetchDeploymentMetadata({
    baseUrl: 'https://example.test/app/',
    fetchImpl: async () => { throw new Error('offline'); },
  });
  assert.deepEqual(offline, { status: 'unavailable', release: null });
});
