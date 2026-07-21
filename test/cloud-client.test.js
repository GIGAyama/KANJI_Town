import test from 'node:test';
import assert from 'node:assert/strict';
import {
  claimLearningShareInvite,
  createLearningShareInvite,
  fetchCloudSave,
  fetchLinkedLearningReports,
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
    order(column, value) {
      calls.push(['order', column, value]);
      return Promise.resolve(result);
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
  const report = { version: 1, sourceHash: 'next' };
  const result = await updateCloudSave(client, 'user-b', 7, { totalExp: 30 }, 'next', report);

  assert.equal(result, remote);
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'user-b'));
  assert.ok(calls.some((call) => call[0] === 'eq' && call[1] === 'revision' && call[2] === 7));
  const update = calls.find((call) => call[0] === 'update')[1];
  assert.equal(update.revision, 8);
  assert.equal(update.schema_version, 1);
  assert.equal(update.report_payload, report);
});

test('revision不一致で更新対象が消えた場合は競合としてnullを返す', async () => {
  const { client } = createQueryClient({ data: null, error: null });
  assert.equal(await updateCloudSave(client, 'user-c', 2, {}, 'hash'), null);
});

test('招待の作成と引換は生コードを送らずハッシュと表示名だけをRPCへ渡す', async () => {
  const calls = [];
  const client = {
    rpc(name, args) {
      calls.push([name, args]);
      if (name === 'create_kanji_town_share_invite') {
        return { single: async () => ({ data: { invite_id: 'invite-1' }, error: null }) };
      }
      return Promise.resolve({ data: 'link-1', error: null });
    },
  };

  await createLearningShareInvite(client, {
    tokenHash: 'a'.repeat(64), learnerLabel: 'たろう', viewerRole: 'guardian',
  });
  await claimLearningShareInvite(client, 'a'.repeat(64), 'お母さん');

  assert.deepEqual(calls[0], ['create_kanji_town_share_invite', {
    p_token_hash: 'a'.repeat(64),
    p_learner_label: 'たろう',
    p_viewer_role: 'guardian',
  }]);
  assert.deepEqual(calls[1], ['claim_kanji_town_share_invite', {
    p_token_hash: 'a'.repeat(64),
    p_viewer_label: 'お母さん',
  }]);
  assert.equal(JSON.stringify(calls).includes('ABCD-EFGH'), false);
});

test('見守り側は専用RPCから要約レポートだけを取得する', async () => {
  const calls = [];
  const client = {
    async rpc(name, args) {
      calls.push([name, args]);
      return { data: [{ learner_label: 'たろう', report_payload: { version: 1 } }], error: null };
    },
  };
  const reports = await fetchLinkedLearningReports(client);
  assert.equal(reports[0].report_payload.version, 1);
  assert.deepEqual(calls, [['get_kanji_town_linked_reports', undefined]]);
});
