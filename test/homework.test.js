import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOMEWORK_TEST_COUNTS,
  buildDrillShareUrl,
  decodeDrillParam,
  encodeDrillParam,
  isValidDateKey,
  readSharedDrill,
  sanitizeHomework,
  unpackDate,
} from '../src/systems/drill-share.js';
import { buildDrillMessage, drillCheckCode, parseDrillMessage } from '../src/systems/drill-p2p.js';
import { homeworkIdFor, homeworkQuestionCount, readHomework, recordHomeworkResult } from '../src/systems/homework.js';
import {
  addDays,
  addReceivedDrill,
  daysUntil,
  formatMonthDay,
  getHomeworkState,
  listHomeworkForHome,
  readHomeworkResult,
} from '../src/systems/homework-status.js';
import { createSessionCheckpoint, restoreSessionCheckpoint } from '../src/systems/session-checkpoint.js';

// 宿題は、ドリルのリンク（?drill= の v1）に任意の欄 h として足した。
// 古いリンク（h の無いもの）も、新しいリンクも読めること、宿題の欄は外部入力として
// ドリル本体と同じ厳しさで確かめることを、ここで固定する。

const toParam = (value) => Buffer.from(JSON.stringify(value)).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromParam = (param) => JSON.parse(Buffer.from(param.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));

const DRILL = { name: '2年生かん字テスト', kanjis: ['k2_1', 'k2_2', 'k3_10'] };
const TEST_HW = { due: '2026-11-20', mode: 'test', count: 10, pass: 80 };

test('更新前に配ったリンク（宿題の欄が無い v1）は、今までどおりドリルとして読める', () => {
  // 宿題を足す前のアプリが作ったリンクの中身（そのまま貼りつけて固定する）
  const OLD_PARAM = 'eyJ2IjoxLCJuIjoiMuW5tOeUn-OBi-OCk-Wtl-ODhuOCueODiCIsImsiOiIyOjEuMi0zOmEifQ';
  assert.deepEqual(decodeDrillParam(OLD_PARAM), DRILL);
  assert.equal('homework' in decodeDrillParam(OLD_PARAM), false);
  // 宿題の無いドリルは、今までとまったく同じ文字列になる（配りなおしても同じリンク）
  assert.equal(encodeDrillParam({ ...DRILL, createdAt: 1 }), OLD_PARAM);
});

test('宿題つきのリンクは、v1 のまま宿題を任意の欄 h に入れて、元どおりに戻る', () => {
  const param = encodeDrillParam({ ...DRILL, homework: TEST_HW });
  const payload = fromParam(param);
  // 更新前のアプリが読む v・n・k は宿題の無いときと同じ。知らない h は読まれないだけ
  assert.equal(payload.v, 1);
  assert.deepEqual({ v: payload.v, n: payload.n, k: payload.k }, fromParam(encodeDrillParam(DRILL)));
  assert.deepEqual(payload.h, { d: '20261120', m: 't', c: 10, p: 80 });
  assert.deepEqual(decodeDrillParam(param), { ...DRILL, homework: TEST_HW });

  const practice = encodeDrillParam({ ...DRILL, homework: { due: '2026-12-01', mode: 'practice', count: 50, pass: 10 } });
  assert.deepEqual(fromParam(practice).h, { d: '20261201', m: 'p' });
  assert.deepEqual(decodeDrillParam(practice).homework, { due: '2026-12-01', mode: 'practice' });

  // 端末の中の印（id）や結果は、リンクに入れない
  const withLocal = encodeDrillParam({ ...DRILL, homework: { ...TEST_HW, id: 'habc' }, homeworkResult: { best: 100 } });
  assert.equal(withLocal, param);

  const url = buildDrillShareUrl({ ...DRILL, homework: TEST_HW }, 'https://kanji-town.giga-school.com/');
  const shared = readSharedDrill(url.slice(url.indexOf('?')));
  assert.equal(shared.status, 'ok');
  assert.deepEqual(shared.drill.homework, TEST_HW);
});

test('宿題の欄だけが壊れているときは、宿題を捨ててドリルとして受け取る', () => {
  const base = { v: 1, n: DRILL.name, k: '2:1.2-3:a' };
  const bad = [
    'しゅくだい',
    [1, 2],
    { d: '2026-11-20', m: 't', c: 10, p: 80 }, // 日付は8けた
    { d: '20261131', m: 't', c: 10, p: 80 }, // 11月31日は無い
    { d: '20190101', m: 'p' }, // 範囲の外の年
    { d: '20261120', m: 'x' }, // やることが違う
    { d: '20261120', m: 't', c: 30, p: 80 }, // 問題数は 0/10/20/50 だけ
    { d: '20261120', m: 't', c: 10, p: 101 }, // 合格の目安は 0〜100
    { d: '20261120', m: 't', c: 10, p: 79.5 },
    { d: '20261120', m: 't', c: '10', p: 80 },
    { d: '20261120', m: 't' },
  ];
  for (const h of bad) {
    assert.deepEqual(decodeDrillParam(toParam({ ...base, h })), DRILL, JSON.stringify(h));
  }
  // 余分な欄は捨てる
  assert.deepEqual(
    decodeDrillParam(toParam({ ...base, h: { d: '20261120', m: 'p', x: 'あ'.repeat(100) }, z: 1 })),
    { ...DRILL, homework: { due: '2026-11-20', mode: 'practice' } },
  );
  // ドリルの本体が壊れていれば、宿題があっても受け取らない（今までと同じ）
  assert.equal(decodeDrillParam(toParam({ v: 1, n: '', k: '1:1', h: { d: '20261120', m: 'p' } })), null);
  assert.equal(decodeDrillParam(toParam({ v: 2, n: 'x', k: '1:1', h: { d: '20261120', m: 'p' } })), null);
});

test('日付は YYYY-MM-DD の、暦にある日だけを受けつける', () => {
  assert.equal(isValidDateKey('2026-11-20'), true);
  assert.equal(isValidDateKey('2028-02-29'), true); // うるう年
  assert.equal(isValidDateKey('2026-02-29'), false);
  assert.equal(isValidDateKey('2026-13-01'), false);
  assert.equal(isValidDateKey('2026-1-1'), false);
  assert.equal(isValidDateKey('2100-01-01'), false);
  assert.equal(isValidDateKey(20261120), false);
  assert.equal(unpackDate('20261120'), '2026-11-20');
  assert.equal(unpackDate('2026112'), null);
  assert.equal(unpackDate('20260230'), null);
  assert.equal(unpackDate(null), null);
});

test('宿題の決まりを整える', () => {
  assert.deepEqual(sanitizeHomework({ ...TEST_HW, id: 'h1', extra: 1 }), TEST_HW);
  assert.deepEqual(sanitizeHomework({ due: '2026-11-20', mode: 'practice', count: 10 }), { due: '2026-11-20', mode: 'practice' });
  for (const count of HOMEWORK_TEST_COUNTS) assert.ok(sanitizeHomework({ ...TEST_HW, count }));
  assert.equal(sanitizeHomework({ ...TEST_HW, pass: -1 }), null);
  assert.equal(sanitizeHomework({ ...TEST_HW, due: '' }), null);
  assert.equal(sanitizeHomework(null), null);
  assert.equal(sanitizeHomework([TEST_HW]), null);
});

test('4けたの数字（P2P）でも、リンクと同じ宿題が届く。かくにんのしるしは宿題で変わらない', () => {
  const drill = { ...DRILL, homework: { ...TEST_HW, id: 'hlocal' } };
  const raw = buildDrillMessage(drill);
  const msg = JSON.parse(raw);
  // 更新前の受け手のための data には、宿題を入れない（ふつうのドリルとして届く）
  assert.deepEqual(msg.data, DRILL);
  assert.deepEqual(parseDrillMessage(raw), { ...DRILL, homework: TEST_HW });
  assert.equal(msg.param, encodeDrillParam(drill));
  assert.equal(drillCheckCode(drill), drillCheckCode(DRILL));
});

test('保存した宿題は id がそろっているときだけ宿題として読む', () => {
  assert.deepEqual(readHomework({ homework: { ...TEST_HW, id: 'hk3x' } }), { ...TEST_HW, id: 'hk3x' });
  assert.equal(readHomework({ homework: TEST_HW }), null);
  assert.equal(readHomework({ homework: { ...TEST_HW, id: 'H!' } }), null);
  assert.equal(readHomework({ homework: { ...TEST_HW, due: 'あした', id: 'h1' } }), null);
  assert.equal(readHomework({}), null);
  assert.equal(readHomework(null), null);
});

test('宿題になる学習は、やることが合っていて、テストは決められた問題数以上のとき', () => {
  const kanjis = Array.from({ length: 30 }, (_, i) => `k3_${i + 1}`);
  const testDrill = { name: 't', kanjis, homework: { ...TEST_HW, count: 20, id: 'h1' } };
  assert.equal(homeworkQuestionCount(testDrill.homework, 30), 20);
  assert.equal(homeworkQuestionCount({ count: 50 }, 30), 30);
  assert.equal(homeworkQuestionCount({ count: 0 }, 30), 30);
  assert.equal(homeworkIdFor(testDrill, 'test', 20), 'h1');
  assert.equal(homeworkIdFor(testDrill, 'test', 30), 'h1');
  assert.equal(homeworkIdFor(testDrill, 'test', 10), null);
  assert.equal(homeworkIdFor(testDrill, 'practice'), null);
  const all = { name: 'a', kanjis, homework: { ...TEST_HW, count: 0, id: 'h2' } };
  assert.equal(homeworkIdFor(all, 'test', 29), null);
  assert.equal(homeworkIdFor(all, 'test', 30), 'h2');
  const practice = { name: 'p', kanjis, homework: { due: '2026-11-20', mode: 'practice', id: 'h3' } };
  assert.equal(homeworkIdFor(practice, 'practice'), 'h3');
  assert.equal(homeworkIdFor(practice, 'test', 30), null);
  assert.equal(homeworkIdFor({ name: 'x', kanjis }, 'practice'), null);
});

test('宿題の結果は、最高点・はじめてできた日・回数をそのドリルに残す', () => {
  const drills = [
    { name: 'ふつう', kanjis: ['k1_1'] },
    { name: 'しゅくだい', kanjis: ['k1_1', 'k1_2'], homework: { ...TEST_HW, id: 'h1' } },
  ];
  // 1回目: 10問中7問（70点）。合格の目安80点に届かない → とりくみ中
  const first = recordHomeworkResult(drills, 'h1', { correct: 7, attempts: 10, today: '2026-11-17' });
  assert.notEqual(first.drills, drills);
  assert.equal(first.drills[0], drills[0]);
  assert.deepEqual(first.drills[1].homeworkResult, { tries: 1, best: 70, lastOn: '2026-11-17' });
  assert.deepEqual(first.report, { name: 'しゅくだい', mode: 'test', score: 70, best: 70, passed: false, pass: 80, doneOn: undefined, today: '2026-11-17' });
  assert.equal(getHomeworkState(first.drills[1], '2026-11-17').state, 'doing');

  // 2回目: 9問（90点）で合格 → できた日が入る
  const second = recordHomeworkResult(first.drills, 'h1', { correct: 9, attempts: 10, today: '2026-11-18' });
  assert.deepEqual(second.drills[1].homeworkResult, { tries: 2, best: 90, doneOn: '2026-11-18', lastOn: '2026-11-18' });
  assert.equal(second.report.passed, true);
  assert.equal(getHomeworkState(second.drills[1], '2026-11-18').state, 'done');

  // 3回目: 点が下がっても、最高点とできた日は変えない
  const third = recordHomeworkResult(second.drills, 'h1', { correct: 5, attempts: 10, today: '2026-11-19' });
  assert.deepEqual(third.drills[1].homeworkResult, { tries: 3, best: 90, doneOn: '2026-11-18', lastOn: '2026-11-19' });
  assert.equal(third.report.passed, false);
  assert.equal(third.report.doneOn, '2026-11-18');

  // れんしゅうは、終えたらできた
  const pd = [{ name: 'れん', kanjis: ['k1_1'], homework: { due: '2026-11-20', mode: 'practice', id: 'h9' } }];
  const done = recordHomeworkResult(pd, 'h9', { correct: 3, attempts: 5, today: '2026-11-16' });
  assert.equal(done.report.passed, true);
  assert.equal(done.drills[0].homeworkResult.doneOn, '2026-11-16');

  // 見つからない・1問もこたえていない・日付がおかしいときは何もしない
  assert.equal(recordHomeworkResult(drills, 'hzz', { correct: 1, attempts: 1, today: '2026-11-17' }).drills, drills);
  assert.equal(recordHomeworkResult(drills, 'h1', { correct: 0, attempts: 0, today: '2026-11-17' }).report, null);
  assert.equal(recordHomeworkResult(drills, 'h1', { correct: 1, attempts: 1, today: 'きょう' }).report, null);
  assert.equal(recordHomeworkResult(drills, null, { correct: 1, attempts: 1, today: '2026-11-17' }).report, null);
});

test('壊れた結果の欄は読まない', () => {
  assert.deepEqual(readHomeworkResult({ homeworkResult: { tries: -1, best: 120, doneOn: 'きのう', lastOn: '2026-11-01' } }),
    { tries: 0, best: null, doneOn: null, lastOn: '2026-11-01' });
  assert.deepEqual(readHomeworkResult({}), { tries: 0, best: null, doneOn: null, lastOn: null });
});

test('しめきりまでの日数と日付の表示', () => {
  assert.equal(daysUntil('2026-11-20', '2026-11-20'), 0);
  assert.equal(daysUntil('2026-11-21', '2026-11-20'), 1);
  assert.equal(daysUntil('2026-11-19', '2026-11-20'), -1);
  assert.equal(daysUntil('2027-01-01', '2026-12-31'), 1);
  assert.equal(daysUntil('2026-11-20', 'x'), null);
  assert.equal(addDays('2026-12-28', 7), '2027-01-04');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('x', 1), null);
  assert.equal(formatMonthDay('2026-01-05'), '1/5');
  assert.equal(formatMonthDay('x'), '');
});

test('ホームの宿題は、まだのものを しめきりが近い順に、できたものは しめきりの日まで出す', () => {
  const hw = (id, due, extra = {}) => ({ name: id, kanjis: ['k1_1'], homework: { due, mode: 'practice', id }, ...extra });
  const drills = [
    { name: 'ふつう', kanjis: ['k1_1'] },
    hw('hlate', '2026-11-30'),
    hw('hsoon', '2026-11-18'),
    hw('hdone', '2026-11-19', { homeworkResult: { tries: 1, best: 100, doneOn: '2026-11-16', lastOn: '2026-11-16' } }),
    hw('hold', '2026-11-10'), // しめきりをすぎた、まだの宿題
    hw('hdoneold', '2026-11-10', { homeworkResult: { tries: 1, best: 100, doneOn: '2026-11-09', lastOn: '2026-11-09' } }),
  ];
  const list = listHomeworkForHome(drills, '2026-11-17');
  assert.deepEqual(list.map(({ drill }) => drill.name), ['hold', 'hsoon', 'hlate', 'hdone']);
  assert.deepEqual(list.map(({ index }) => index), [4, 2, 1, 3]);
  assert.equal(list[0].hw.overdue, true);
  assert.equal(list[0].hw.daysLeft, -7);
  assert.equal(list[1].hw.overdue, false);
  assert.equal(list[3].hw.state, 'done');
  assert.equal(list[3].hw.overdue, false);
  assert.deepEqual(listHomeworkForHome(null, '2026-11-17'), []);
});

test('受け取ったドリルは、知らない字を落とし、宿題に端末の中の id を付けて足す', () => {
  const known = new Set(['k1_1', 'k1_2']);
  const received = { name: 'しゅくだい', kanjis: ['k1_1', 'k9_9', 'k1_2'], homework: { ...TEST_HW } };
  const first = addReceivedDrill([], received, { now: 1000, isKnownKanji: (id) => known.has(id) });
  assert.equal(first.alreadySaved, false);
  assert.deepEqual(first.drill, { name: 'しゅくだい', kanjis: ['k1_1', 'k1_2'], createdAt: 1000, homework: { ...TEST_HW, id: 'hrs' } });
  assert.deepEqual(readHomework(first.drill), { ...TEST_HW, id: 'hrs' });

  // 同じリンクをもう一度ひらいても、2つめを作らない
  const again = addReceivedDrill(first.myDrills, received, { now: 2000, isKnownKanji: (id) => known.has(id) });
  assert.equal(again.alreadySaved, true);
  assert.equal(again.myDrills, first.myDrills);
  assert.equal(again.drill, first.drill);

  // しめきりが違えば別の宿題として足す。id は重ならない
  const other = addReceivedDrill(first.myDrills, { ...received, homework: { ...TEST_HW, due: '2026-11-27' } }, { now: 1000, isKnownKanji: (id) => known.has(id) });
  assert.equal(other.alreadySaved, false);
  assert.equal(other.myDrills.length, 2);
  assert.notEqual(other.drill.homework.id, first.drill.homework.id);

  // 宿題の無いドリルは、今までどおり名前と字だけ
  const plain = addReceivedDrill([], { name: 'ふつう', kanjis: ['k1_1'] }, { now: 5 });
  assert.deepEqual(plain.drill, { name: 'ふつう', kanjis: ['k1_1'], createdAt: 5 });
  // 使える字が無ければ足さない
  const none = addReceivedDrill([], { name: 'なし', kanjis: ['k9_1'] }, { isKnownKanji: () => false });
  assert.equal(none.drill, null);
  assert.deepEqual(none.myDrills, []);
});

test('宿題のれんしゅうを途中で閉じても、再開したあとに宿題として記録できるよう id を残す', () => {
  const kanjiData = [{ id: 'k1_1' }, { id: 'k1_2' }];
  const now = Date.UTC(2026, 10, 17, 9);
  const checkpoint = createSessionCheckpoint({ queue: kanjiData, remainingQueue: [kanjiData[1]], isDrill: true, homeworkId: 'hk3x' }, now);
  assert.equal(checkpoint.homeworkId, 'hk3x');
  assert.equal(restoreSessionCheckpoint(checkpoint, kanjiData, now).homeworkId, 'hk3x');
  // 形の違う id は持ちこまない
  assert.equal(restoreSessionCheckpoint({ ...checkpoint, homeworkId: '<script>' }, kanjiData, now).homeworkId, null);
  assert.equal(createSessionCheckpoint({ queue: kanjiData, isDrill: true }, now).homeworkId, null);
});
