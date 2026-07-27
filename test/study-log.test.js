import test from 'node:test';
import assert from 'node:assert/strict';
import { saveStudyRecord } from '../src/systems/studyLog.js';
import { loadStudyRecords, summarizeRecentStudy } from '../src/systems/studyStats.js';

const STUDY_LOG_KEY = 'study.records.v1';

function installMemoryLocalStorage() {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  return values;
}

const baseRecord = () => ({
  appId: 'kanji-town',
  appVersion: '0.2.0',
  mode: 'drill',
  unit: { id: 'g1-daily', title: '1年の漢字れんしゅう', grade: 1, preset: true },
  grading: 'mixed',
  startedAt: '2026-07-27T00:00:00.000Z',
  endedAt: '2026-07-27T00:02:00.000Z',
  elapsedMs: 120000,
  activeMs: 110000,
  status: 'completed',
  summary: { count: 5, attempted: 5, firstTryCorrect: 4, correct: 5 },
  items: [{ q: 'k1_1', ok: true, firstTry: true, tries: 1, skill: 'writing' }],
});

test('必須項目を満たすレコードを study.records.v1 へ保存する', () => {
  installMemoryLocalStorage();
  const id = saveStudyRecord(baseRecord());
  assert.equal(typeof id, 'string');

  const log = JSON.parse(globalThis.localStorage.getItem(STUDY_LOG_KEY));
  assert.equal(log.length, 1);
  assert.equal(log[0].schema, 'study.v1');
  assert.equal(log[0].kind, 'session');
  assert.equal(log[0].appId, 'kanji-town');
  assert.equal(log[0].multiplayer, false);
  assert.equal(log[0].summary.firstTryCorrect, 4);
});

test('必須項目が欠けたレコードは保存しない', () => {
  installMemoryLocalStorage();
  assert.equal(saveStudyRecord(null), null);
  assert.equal(saveStudyRecord({ ...baseRecord(), unit: undefined }), null);
  assert.equal(saveStudyRecord({ ...baseRecord(), elapsedMs: -1 }), null);
  assert.equal(saveStudyRecord({ ...baseRecord(), summary: {} }), null);
  assert.equal(globalThis.localStorage.getItem(STUDY_LOG_KEY), null);
});

test('既存データが壊れていても空からやり直して保存できる', () => {
  installMemoryLocalStorage();
  globalThis.localStorage.setItem(STUDY_LOG_KEY, '{broken json');
  assert.equal(typeof saveStudyRecord(baseRecord()), 'string');
  const log = JSON.parse(globalThis.localStorage.getItem(STUDY_LOG_KEY));
  assert.equal(log.length, 1);
});

test('500件を超えたら古いレコードから捨てる', () => {
  installMemoryLocalStorage();
  const filler = Array.from({ length: 500 }, (_, i) => ({ schema: 'study.v1', id: `old-${i}` }));
  globalThis.localStorage.setItem(STUDY_LOG_KEY, JSON.stringify(filler));
  saveStudyRecord(baseRecord());
  const log = JSON.parse(globalThis.localStorage.getItem(STUDY_LOG_KEY));
  assert.equal(log.length, 500);
  assert.equal(log[0].id, 'old-1');
  assert.equal(log.at(-1).appId, 'kanji-town');
});

test('wrong の自由入力値はサニタイズされる', () => {
  installMemoryLocalStorage();
  saveStudyRecord({
    ...baseRecord(),
    items: [{ q: 'k1_1', ok: false, firstTry: false, wrong: ['制', '<script>', 'あ'.repeat(13)] }],
  });
  const log = JSON.parse(globalThis.localStorage.getItem(STUDY_LOG_KEY));
  assert.deepEqual(log[0].items[0].wrong, ['制']);
});

test('読み出しは自アプリのレコードだけを新しい順に返し、壊れたデータでは空配列を返す', () => {
  installMemoryLocalStorage();
  saveStudyRecord(baseRecord());
  saveStudyRecord({ ...baseRecord(), appId: 'qalc' });
  saveStudyRecord({ ...baseRecord(), mode: 'test', status: 'aborted', summary: { count: 5, attempted: 2, firstTryCorrect: 1, correct: 2 } });

  const records = loadStudyRecords('kanji-town');
  assert.equal(records.length, 2);
  assert.equal(records[0].mode, 'test');
  assert.ok(records.every((r) => r.appId === 'kanji-town'));

  const summary = summarizeRecentStudy(records, 5);
  assert.equal(summary.length, 2);
  // 正答率の分母は attempted（§5.5）
  assert.equal(summary[0].attempted, 2);
  assert.equal(summary[0].firstTryCorrect, 1);
  assert.equal(summary[0].aborted, true);

  globalThis.localStorage.setItem(STUDY_LOG_KEY, 'not-json');
  assert.deepEqual(loadStudyRecords('kanji-town'), []);
});
