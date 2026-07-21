import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchCloudSave,
  getCloudConfiguration,
  updateCloudSave,
} from '../src/systems/cloud-client.js';

function createQueryClient(result) {
  const calls = [];
  const query = {
    select(columns) {
      calls.push(['select', columns]);
      return this;
    },
    update(value) {
      calls.push(['update', value]);
      return this;
    },
    eq(column, value) {
      calls.push(['eq', column, value]);
      return this;
    },
    maybeSingle() {
      calls.push(['maybeSingle']);
      return Promise.resolve(result);
    },
  };
  return {
    calls,
    client: {
      from(table) {
        calls.push(['from', table]);
        return query;
      },
    },
  };
}

test('環境変数がない場合はクラウド機能だけを無効にする', () => {
  assert.deepEqual(getCloudConfiguration(), { url: '', anonKey: '', isConfigured: false });
});

test('クラウド読込は利用者IDで絞り込み、0件を正常に扱う', async () => {
  const { client, calls } = createQueryClient({ data: null, error: null });
  assert.equal(await fetchCloudSave(client, 'user-a'), null);
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-a'));
  assert.equal(calls.at(-1)[0], 'maybeSingle');
});

test('クラウド更新は利用者IDとrevisionの両方で楽観ロックする', async () => {
  const remote = { revision: 8, payload_hash: 'next' };
  const { client, calls } = createQueryClient({ data: remote, error: null });
  const result = await updateCloudSave(client, 'user-b', 7, { totalExp: 30 }, 'next');

  assert.equal(result, remote);
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-b'));
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'revision' && call[2] === 7));
  const update = calls.find((call) => call[0] === 'update')[1];
  assert.equal(update.revision, 8);
  assert.equal(update.schema_version, 1);
});

test('revision不一致で更新対象が消えた場合は競合としてnullを返す', async () => {
  const { client } = createQueryClient({ data: null, error: null });
  assert.equal(await updateCloudSave(client, 'user-c', 2, {}, 'hash'), null);
});
