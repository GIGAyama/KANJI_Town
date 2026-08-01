import test, { mock } from 'node:test';
import assert from 'node:assert/strict';

const STUDY_LOG_KEY = 'study.records.v1';

// studySession.js は storage.js 経由で .jsx を取り込むため、node からは直接読めない。
// レコードの組み立てだけを見たいので、依存する3モジュールを差し替えて読み込む。
mock.module(new URL('../src/systems/storage.js', import.meta.url).href, {
  namedExports: { StorageAPI: { getStats: () => ({}) } },
});
mock.module(new URL('../src/systems/learning-report.js', import.meta.url).href, {
  namedExports: {
    buildLearningReport: () => ({
      mastery: { reading: 50, meaning: 50, writing: 50, stroke: 50 },
      progress: { learned: 300, mastered: 40 },
      support: { overdueReviews: 3, weekReviews: 10, weakKanjiIds: ['k1_1'] },
      habit: { streak: 4 },
    }),
  },
});
mock.module(new URL('../src/systems/diagnostics.js', import.meta.url).href, {
  namedExports: { APP_VERSION: '0.2.0', recordDiagnosticEvent: () => {} },
});

const { buildStudyMeta, beginStudySession, recordStudyAttempt, markStudySessionCompleted, finishStudySession, markStudyActivity } =
  await import('../src/systems/studySession.js');

function installBrowserGlobals() {
  const values = new Map();
  globalThis.localStorage = {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  globalThis.document = { hidden: false, addEventListener() {}, removeEventListener() {} };
  globalThis.window = { addEventListener() {}, removeEventListener() {} };
  return values;
}

const readRecord = () => JSON.parse(globalThis.localStorage.getItem(STUDY_LOG_KEY)).at(-1);

/** サバイバルで n 種類の漢字に解答する。firstTry は n 問ごとに1問だけ落とす。 */
function playSurvival(n) {
  beginStudySession(buildStudyMeta('survival', { queue: [] }));
  for (let i = 0; i < n; i++) {
    const q = `k-${String(i).padStart(4, '0')}`;
    const firstTryOk = i % 5 !== 0;
    recordStudyAttempt(q, { ok: firstTryOk, skill: 'reading' });
    if (!firstTryOk) recordStudyAttempt(q, { ok: true, skill: 'reading' });
  }
  markStudySessionCompleted();
  finishStudySession();
}

test('items が200件を超えたら切り詰め、summary を切り詰め後の items から算出する', () => {
  installBrowserGlobals();
  playSurvival(250);

  const rec = readRecord();
  assert.equal(rec.items.length, 200);
  // 分母が items と食い違うと、教師側で正答率が定まらなくなる（§2.7）
  assert.equal(rec.summary.attempted, rec.items.length);
  assert.equal(rec.summary.firstTryCorrect, rec.items.filter((it) => it.firstTry).length);
  assert.equal(rec.summary.correct, rec.items.filter((it) => it.ok).length);
  // 切り詰めるのは後半。先頭200件が残る
  assert.equal(rec.items[0].q, 'k-0000');
  assert.equal(rec.items.at(-1).q, 'k-0199');
});

test('切り詰め前の実際の解答実績は count と ext.itemsTruncated に残る', () => {
  installBrowserGlobals();
  playSurvival(250);

  const rec = readRecord();
  // サバイバルの出題数は解答実績。切り詰め後の値に合わせると出題数が過少になる（§3.3.1）
  assert.equal(rec.summary.count, 250);
  assert.equal(rec.ext.itemsTruncated.attempted, 250);
  assert.equal(rec.ext.itemsTruncated.firstTryCorrect, 200);
  // ext の他の項目は残っている
  assert.equal(rec.ext.srs.learned, 300);
});

test('200件以下のセッションには itemsTruncated を付けない', () => {
  installBrowserGlobals();
  playSurvival(200);

  const rec = readRecord();
  assert.equal(rec.items.length, 200);
  assert.equal(rec.summary.attempted, 200);
  assert.equal(rec.summary.count, 200);
  assert.equal('itemsTruncated' in rec.ext, false);
});

test('markStudyActivity はアイドル停止後の activeMs 加算を再開する', (t) => {
  installBrowserGlobals();
  t.mock.timers.enable({ apis: ['Date', 'setInterval'], now: 0 });

  beginStudySession(buildStudyMeta('survival', { queue: [] }));
  recordStudyAttempt('k-0001', { ok: true, skill: 'reading' });

  // 60秒でアイドル停止 → その後30秒は無操作(加算されない)
  t.mock.timers.tick(61000);
  t.mock.timers.tick(30000);

  // 音読チャレンジの発声検出が活動として通知される
  markStudyActivity();
  t.mock.timers.tick(10000);

  markStudySessionCompleted();
  finishStudySession();

  const rec = readRecord();
  // 約60秒(アイドルまで) + 10秒(再開後)。タイマーの発火順序で±1秒ぶれる。
  // 再開が働かなければ約61秒、無操作の30秒が混入すれば約101秒になる。
  assert.ok(rec.activeMs >= 70000, `activeMs=${rec.activeMs} は再開後の10秒を含むはず`);
  assert.ok(rec.activeMs <= 72000, `activeMs=${rec.activeMs} に無操作の30秒が混入している`);
});
