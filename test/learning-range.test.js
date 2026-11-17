import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARE_URL_SAFE_LENGTH, decodeDrillParam, readSharedDrill } from '../src/systems/drill-share.js';
import {
  RANGE_KANJI_MAX,
  RANGE_PARAM_MAX_LENGTH,
  RANGE_SHARE_PARAM,
  RANGE_STAGE_MAX,
  buildRangeShareUrl,
  decodeRangeParam,
  encodeRangeParam,
  getLearningRangeStatus,
  sanitizeLearningRange,
} from '../src/systems/learning-range.js';
import { buildLearningPlan, getRangeNewCandidates } from '../src/systems/learning-plan.js';
import { KANJI_BY_GRADE } from '../src/data/kanji-grades.js';

// 「ならった範囲」は、全部の段と日付をリンクの中に入れておき、児童の端末が日付を見て
// 新出に出す（サーバーが無いので予約配信をこの形にした）。リンクは ?range= の別の欄にして、
// 更新前のアプリ（?range= を知らない）では、ふつうに開くだけにする。

const toParam = (value) => Buffer.from(JSON.stringify(value)).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const BASE_URL = 'https://kanji-town.giga-school.com/';

const RANGE = {
  name: '3年 2学期',
  stages: [
    { from: '2026-11-02', kanjis: ['k3_1', 'k3_2', 'k3_3'] },
    { from: '2026-11-09', kanjis: ['k3_10', 'k3_11'] },
    { from: '2026-11-16', kanjis: ['k3_20', 'k2_5'] },
  ],
};

test('範囲をリンク用の文字列にして元どおりに戻せる', () => {
  const param = encodeRangeParam({ ...RANGE, receivedAt: 1 });
  assert.match(param, /^[A-Za-z0-9_-]+$/);
  const payload = JSON.parse(Buffer.from(param.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
  assert.deepEqual(payload, { v: 1, n: '3年 2学期', s: [['20261102', '3:1.2.3'], ['20261109', '3:a.b'], ['20261116', '3:k-2:5']] });
  assert.deepEqual(decodeRangeParam(param), RANGE);

  const url = buildRangeShareUrl(RANGE, `${BASE_URL}?drill=x#y`);
  assert.ok(url.startsWith(`${BASE_URL}?${RANGE_SHARE_PARAM}=`));
  assert.deepEqual(decodeRangeParam(new URLSearchParams(url.slice(url.indexOf('?'))).get(RANGE_SHARE_PARAM)), RANGE);
  // 範囲のリンクは、ドリルの受け取り（?drill=）には入らない
  assert.equal(readSharedDrill(url.slice(url.indexOf('?'))).status, 'none');
  assert.equal(decodeDrillParam(param), null);
});

test('範囲を整える: 前の段に出た字はあとの段から除き、字の無くなった段は除く', () => {
  assert.deepEqual(sanitizeLearningRange({
    name: ' 3年\nまとめ ',
    stages: [
      { from: '2026-11-02', kanjis: ['k3_1', 'k3_1', 'bad', 7] },
      { from: '2026-11-09', kanjis: ['k3_1'] },
      { from: '2026-11-16', kanjis: ['k3_2'], label: 'よけい' },
    ],
    extra: 'x',
  }), {
    name: '3年 まとめ',
    stages: [{ from: '2026-11-02', kanjis: ['k3_1'] }, { from: '2026-11-16', kanjis: ['k3_2'] }],
  });
});

test('壊れた・上限をこえる範囲は受け取らない', () => {
  const stage = (from, kanjis) => ({ from, kanjis });
  assert.equal(sanitizeLearningRange(null), null);
  assert.equal(sanitizeLearningRange({ name: '', stages: [stage('2026-11-02', ['k1_1'])] }), null);
  assert.equal(sanitizeLearningRange({ name: 'x', stages: [] }), null);
  assert.equal(sanitizeLearningRange({ name: 'x', stages: [stage('2026-11-02', ['bad'])] }), null);
  // 日付が1つでもおかしければ、範囲ぜんたいを受け取らない（予定がずれるため）
  assert.equal(sanitizeLearningRange({ name: 'x', stages: [stage('2026-11-02', ['k1_1']), stage('2026-11-31', ['k1_2'])] }), null);
  assert.equal(sanitizeLearningRange({ name: 'x', stages: [stage('11/2', ['k1_1'])] }), null);
  // 段の数・字の数の上限
  const tooManyStages = Array.from({ length: RANGE_STAGE_MAX + 1 }, (_, i) => stage('2026-11-02', [`k1_${i + 1}`]));
  assert.equal(sanitizeLearningRange({ name: 'x', stages: tooManyStages }), null);
  assert.ok(sanitizeLearningRange({ name: 'x', stages: tooManyStages.slice(0, RANGE_STAGE_MAX) }));
  const tooManyKanji = Array.from({ length: RANGE_KANJI_MAX + 1 }, (_, i) => `k${(i % 6) + 1}_${Math.floor(i / 6) + 1}`);
  assert.equal(sanitizeLearningRange({ name: 'x', stages: [stage('2026-11-02', tooManyKanji)] }), null);
  assert.ok(sanitizeLearningRange({ name: 'x', stages: [stage('2026-11-02', tooManyKanji.slice(0, RANGE_KANJI_MAX))] }));

  const ok = { v: 1, n: 'x', s: [['20261102', '1:1']] };
  assert.ok(decodeRangeParam(toParam(ok)));
  assert.equal(decodeRangeParam(toParam({ ...ok, v: 2 })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: [] })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: [['2026-11-02', '1:1']] })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: [['20261102', '9:1']] })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: [['20261102']] })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: [{ d: '20261102', k: '1:1' }] })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, s: Array.from({ length: RANGE_STAGE_MAX + 1 }, (_, i) => ['20261102', `1:${(i + 1).toString(36)}`]) })), null);
  assert.equal(decodeRangeParam(toParam({ ...ok, n: '' })), null);
  assert.equal(decodeRangeParam(toParam([ok])), null);
  assert.equal(decodeRangeParam('!!!'), null);
  assert.equal(decodeRangeParam('YWJj'), null);
  assert.equal(decodeRangeParam('a'.repeat(RANGE_PARAM_MAX_LENGTH + 1)), null);
  assert.equal(decodeRangeParam(undefined), null);
});

test('上限いっぱいの範囲（40段・300字・学年が1字ごとに入れかわる）でも、作ったリンクは受け取れる', () => {
  // いちばん長くなる形: 6学年を1字ごとに入れかえ（毎回「-学年:」が入る）、40段に分け、名前も40字
  const ids = [];
  for (let i = 0; ids.length < RANGE_KANJI_MAX; i++) {
    const grade = (i % 6) + 1;
    const index = [...KANJI_BY_GRADE[grade - 1]].length - Math.floor(i / 6); // 番号の大きい（36進で長い）字から
    ids.push(`k${grade}_${index}`);
  }
  const per = Math.ceil(RANGE_KANJI_MAX / RANGE_STAGE_MAX);
  const stages = Array.from({ length: RANGE_STAGE_MAX }, (_, i) => ({ from: '2026-12-31', kanjis: ids.slice(i * per, (i + 1) * per) }))
    .filter((stage) => stage.kanjis.length > 0);
  const worst = { name: '漢'.repeat(40), stages };
  const param = encodeRangeParam(worst);
  assert.ok(param, 'いちばん長い範囲もリンクにできる');
  assert.ok(param.length <= RANGE_PARAM_MAX_LENGTH, `長さ ${param.length}`);
  assert.deepEqual(decodeRangeParam(param), sanitizeLearningRange(worst));
});

test('ふつうの使い方（3年の1年分 200字を35週）のリンクは、警告の目安の長さに収まる', () => {
  const ids = Array.from({ length: 200 }, (_, i) => `k3_${i + 1}`);
  const stages = Array.from({ length: 35 }, (_, i) => ({ from: '2027-04-10', kanjis: ids.filter((_, j) => j % 35 === i) }));
  const url = buildRangeShareUrl({ name: '3年 1年間の漢字', stages }, BASE_URL);
  assert.ok(url.length <= SHARE_URL_SAFE_LENGTH, `長さ ${url.length}`);
  // 1学期分（70字・12週）なら QR にもできる長さ
  const term = buildRangeShareUrl({ name: '3年 1学期', stages: stages.slice(0, 12) }, BASE_URL);
  assert.ok(term.length <= 1000, `長さ ${term.length}`);
});

const kanjiData = [
  { id: 'k1_1', grade: 1 }, { id: 'k1_2', grade: 1 }, { id: 'k1_3', grade: 1 },
  { id: 'k3_1', grade: 3 }, { id: 'k3_2', grade: 3 }, { id: 'k3_3', grade: 3 },
  { id: 'k3_10', grade: 3 }, { id: 'k3_11', grade: 3 }, { id: 'k3_20', grade: 3 },
  { id: 'k2_5', grade: 2 },
];
const learned = (ids, extra = {}) => Object.fromEntries(ids.map((id) => [id, { status: 'review', nextReview: Date.parse('2027-01-01'), ...extra }]));
const limits = { review: 20, new: 5 };

test('範囲があるときは、新出を「日付が来た段の字」だけから、段の順に出す', () => {
  const plan = buildLearningPlan({ kanjiData, selectedGrade: 1, limits, range: RANGE, today: '2026-11-10', now: Date.parse('2026-11-10T09:00:00') });
  // 11/10 には1段目・2段目が来ている。3段目（11/16から）と、学年（1年）の字は出さない
  assert.deepEqual(plan.queue.map((k) => k.id), ['k3_1', 'k3_2', 'k3_3', 'k3_10', 'k3_11']);
  assert.equal(plan.rangeActive, true);
  assert.equal(plan.newAvailableCount, 5);

  // 段の中・段のあいだの順（教科書の順）を保つ。新出の上限は今までどおり
  const small = buildLearningPlan({ kanjiData, selectedGrade: 1, limits: { review: 5, new: 2 }, range: RANGE, today: '2026-11-16', now: 0 });
  assert.deepEqual(small.queue.map((k) => k.id), ['k3_1', 'k3_2']);
});

test('範囲があっても、復習（期限の来た字）は今までどおりすべての字から先に出す', () => {
  const now = Date.parse('2026-11-10T09:00:00');
  const kanjiStats = { k1_1: { status: 'review', nextReview: now - 1000 }, k3_1: { status: 'review', nextReview: now - 500 } };
  const plan = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits, range: RANGE, today: '2026-11-10', now });
  assert.deepEqual(plan.queue.map((k) => k.id), ['k1_1', 'k3_1', 'k3_2', 'k3_3', 'k3_10', 'k3_11']);
  assert.equal(plan.reviewCount, 2);
  assert.equal(plan.newCount, 4);
});

test('日付が来た段の字をすべて習ったら、次の段の日まで新出は出さず、範囲の字で練習する', () => {
  const now = Date.parse('2026-11-10T09:00:00');
  const kanjiStats = learned(['k3_1', 'k3_2', 'k3_3', 'k3_10', 'k3_11', 'k1_1']);
  const plan = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits, range: RANGE, today: '2026-11-10', now });
  assert.equal(plan.newCount, 0);
  assert.equal(plan.rangeActive, true);
  assert.equal(plan.isPractice, true);
  // 練習は範囲の習った字から（1年の「k1_1」は入れない）
  assert.ok(plan.queue.every((k) => k.id.startsWith('k3_')), plan.queue.map((k) => k.id).join(','));
  // 次の段の日になれば、その段の字が新出に出る
  const next = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits, range: RANGE, today: '2026-11-16', now });
  assert.deepEqual(next.queue.map((k) => k.id), ['k3_20', 'k2_5']);
});

test('範囲の字をすべて習ったら、今までどおり学年の字に戻す', () => {
  const kanjiStats = learned(['k3_1', 'k3_2', 'k3_3', 'k3_10', 'k3_11', 'k3_20', 'k2_5']);
  const plan = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits, range: RANGE, today: '2026-11-20', now: 0 });
  assert.equal(plan.rangeActive, false);
  assert.deepEqual(plan.queue.map((k) => k.id), ['k1_1', 'k1_2', 'k1_3']);
  // 範囲が無いときと同じ
  const without = buildLearningPlan({ kanjiData, kanjiStats, selectedGrade: 1, limits, now: 0 });
  assert.deepEqual(plan.queue, without.queue);
});

test('範囲の候補: このアプリに無い字・形の崩れた段は飛ばし、日付は文字の並びでくらべる', () => {
  const isUnlearned = () => true;
  const range = { stages: [
    { from: '2026-11-02', kanjis: ['k3_1', 'k9_9', 'k3_1'] },
    { from: 'あした', kanjis: ['k3_2'] },
    null,
    { from: '2026-11-03', kanjis: 'k3_3' },
    { from: '2026-11-03', kanjis: ['k3_1', 'k3_10'] },
  ] };
  assert.deepEqual(getRangeNewCandidates(range, kanjiData, isUnlearned, '2026-11-03').map((k) => k.id), ['k3_1', 'k3_10']);
  assert.deepEqual(getRangeNewCandidates(range, kanjiData, isUnlearned, '2026-11-02').map((k) => k.id), ['k3_1']);
  assert.deepEqual(getRangeNewCandidates(range, kanjiData, isUnlearned, '2026-11-01'), []);
  assert.equal(getRangeNewCandidates(null, kanjiData, isUnlearned, '2026-11-01'), null);
  assert.equal(getRangeNewCandidates({ stages: [] }, kanjiData, isUnlearned, '2026-11-01'), null);
});

test('範囲のようす: 字数・習った数・次の段がいつから何字か', () => {
  const known = new Set(kanjiData.map((k) => k.id));
  const status = getLearningRangeStatus(RANGE, learned(['k3_1']), '2026-11-10', (id) => known.has(id));
  assert.deepEqual(status, {
    name: '3年 2学期',
    stageCount: 3,
    totalCount: 7,
    startedCount: 5,
    learnedCount: 1,
    waitingCount: 4,
    nextStage: { from: '2026-11-16', count: 2 },
    complete: false,
  });
  // 同じ日から始まる段は、字の数を合わせる
  const twin = { name: 'x', stages: [{ from: '2026-12-01', kanjis: ['k1_1'] }, { from: '2026-12-01', kanjis: ['k1_2'] }, { from: '2026-12-08', kanjis: ['k1_3'] }] };
  assert.deepEqual(getLearningRangeStatus(twin, {}, '2026-11-10').nextStage, { from: '2026-12-01', count: 2 });
  const all = getLearningRangeStatus(RANGE, learned(RANGE.stages.flatMap((s) => s.kanjis)), '2026-11-20');
  assert.equal(all.complete, true);
  assert.equal(all.nextStage, null);
  assert.equal(getLearningRangeStatus(null, {}, '2026-11-10'), null);
});

test('ホーム: 範囲に無い学年をえらんでいるときは、新出が範囲から出ることを目立つ形で出す', async () => {
  const { readFileSync } = await import('node:fs');
  const code = readFileSync(new URL('../src/components/social/HomeAssignments.jsx', import.meta.url), 'utf8');
  // 範囲の字の学年に、えらんだ学年が無く、範囲がまだ終わっていないときだけ
  assert.match(code, /const otherGrade = !status\.complete && !grades\.has\(grade\);/);
  assert.match(code, /data-testid="range-grade-note"/);
  assert.match(code, /\{grade\}\{F\("年","ねん"\)\}を えらんでいても、あたらしい\{F\("字","じ"\)\}は \{F\("先生","せんせい"\)\}の はんいから \{F\("出","で"\)\}るよ/);
});
