import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeStrokes } from '../src/systems/strokeGrader.js';
import { endingTypeFromKvgType, endingSimilarity, describeEndingFeedback } from '../src/systems/strokeKind.js';
import { getStrokeTolerances } from '../src/constants/strokeConfig.js';

const CANVAS = 300;

/** 正規化座標の線分を、正解データの points 形式で作る */
function normalizedLine(from, to, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: from.x + (to.x - from.x) * (i / steps),
    y: from.y + (to.y - from.y) * (i / steps),
  }));
}

/** 正解の1画を作る */
function expectedStroke(from, to, endingType = null) {
  return { s: { ...from }, e: { ...to }, points: normalizedLine(from, to), endingType };
}

/** ユーザーの1画（キャンバス座標＋時刻）を作る */
function userStroke(from, to, { steps = 24, msPerPoint = 20, offset = { x: 0, y: 0 } } = {}) {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: (from.x + (to.x - from.x) * (i / steps) + offset.x) * CANVAS,
    y: (from.y + (to.y - from.y) * (i / steps) + offset.y) * CANVAS,
    time: i * msPerPoint,
  }));
}

// 「三」を模した3本の横画（正しい書き順は上→中→下）
const SAN = [
  expectedStroke({ x: 0.25, y: 0.25 }, { x: 0.70, y: 0.25 }, 'tome'),
  expectedStroke({ x: 0.20, y: 0.50 }, { x: 0.60, y: 0.50 }, 'tome'),
  expectedStroke({ x: 0.15, y: 0.75 }, { x: 0.80, y: 0.75 }, 'tome'),
];

const sanUser = (order = [0, 1, 2]) => order.map(i => {
  const s = SAN[i];
  return userStroke(s.s, s.e);
});

test('正しくなぞれば高得点になり、すべての判定フラグが立つ', () => {
  const result = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.equal(result.strokeCountMatch, true);
  assert.equal(result.crossMatch, true);
  assert.equal(result.orderMatch, true);
  assert.ok(result.total >= 90, `高得点になるべき: ${result.total}`);
  assert.ok(result.total <= 100);
});

test('画数が違えば0点になり、過不足を伝える', () => {
  const result = gradeStrokes(sanUser([0, 1]), SAN, CANVAS);
  assert.equal(result.total, 0);
  assert.equal(result.strokeCountMatch, false);
  assert.ok(result.details.some(d => d.includes('たりない')));
});

test('似た画が並ぶ字でも、正しい順なら書き順は満点（貪欲マッチングの取り違えが起きない）', () => {
  const result = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.deepEqual(result.assignment, [0, 1, 2]);
  assert.equal(result.orderMatch, true);
});

test('書き順だけが違うとき、書き順は減点されるが字形は保たれる', () => {
  // 下 → 中 → 上 の順に書く（見た目は同じ字）
  const result = gradeStrokes(sanUser([2, 1, 0]), SAN, CANVAS);
  const clean = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.deepEqual(result.assignment, [2, 1, 0]);
  assert.equal(result.orderMatch, false);
  // 3画中、位置が変わらないのは真ん中の1画だけ
  assert.ok(Math.abs(result.order - clean.order / 3) <= 1, `書き順は1/3の点: ${result.order}`);
  assert.ok(result.shape >= 25, `字形は落とさないはず: ${result.shape}`);
  assert.ok(result.details.some(d => d.startsWith('書き順')));
  // 見た目が同じでも書き順の誤りは合格させない
  assert.ok(result.total <= 69, `書き順の誤りで合格ラインを超えないこと: ${result.total}`);
});

test('画を逆向きに書くと指摘される', () => {
  const strokes = sanUser();
  // 2画目だけ右から左へ書く
  strokes[1] = userStroke(SAN[1].e, SAN[1].s);
  const result = gradeStrokes(strokes, SAN, CANVAS);
  assert.ok(result.details.some(d => d.includes('ぎゃく')), result.details.join(' / '));
});

// 「土」型：縦画が上の横画に接するだけ／突き抜ける
const TSUCHI = [
  expectedStroke({ x: 0.25, y: 0.35 }, { x: 0.75, y: 0.35 }, 'tome'),
  expectedStroke({ x: 0.50, y: 0.35 }, { x: 0.50, y: 0.80 }, 'tome'),
  expectedStroke({ x: 0.18, y: 0.80 }, { x: 0.82, y: 0.80 }, 'tome'),
];

test('接するだけの画を突き抜けると交差の誤りとして検出する', () => {
  const correct = [
    userStroke(TSUCHI[0].s, TSUCHI[0].e),
    userStroke(TSUCHI[1].s, TSUCHI[1].e),
    userStroke(TSUCHI[2].s, TSUCHI[2].e),
  ];
  const ok = gradeStrokes(correct, TSUCHI, CANVAS);
  assert.equal(ok.crossMatch, true, ok.details.join(' / '));

  // 2画目を上へ大きく突き出して書く（「土」ではなくなる）
  const pierced = [...correct];
  pierced[1] = userStroke({ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.80 });
  const bad = gradeStrokes(pierced, TSUCHI, CANVAS);
  assert.equal(bad.crossMatch, false);
  assert.ok(bad.details.some(d => d.includes('つきぬけない')), bad.details.join(' / '));
});

test('交差の誤りは0点ではなく減点になり、どこが違うか伝わる', () => {
  const pierced = [
    userStroke(TSUCHI[0].s, TSUCHI[0].e),
    userStroke({ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.80 }),
    userStroke(TSUCHI[2].s, TSUCHI[2].e),
  ];
  const result = gradeStrokes(pierced, TSUCHI, CANVAS);
  // 全否定せず、正しく書けた部分は点数に残す（学習動機を折らない）
  assert.ok(result.total > 0, '部分点が残るべき');
  assert.equal(result.cross, 0, '交差の配点は失う');
  assert.equal(result.crossMatch, false);
});

test('交差の判定はペンの速さ（サンプリング密度）に左右されない', () => {
  const base = [
    userStroke(TSUCHI[0].s, TSUCHI[0].e),
    userStroke(TSUCHI[1].s, TSUCHI[1].e),
    userStroke(TSUCHI[2].s, TSUCHI[2].e),
  ];
  const sparse = [
    userStroke(TSUCHI[0].s, TSUCHI[0].e, { steps: 3 }),
    userStroke(TSUCHI[1].s, TSUCHI[1].e, { steps: 3 }),
    userStroke(TSUCHI[2].s, TSUCHI[2].e, { steps: 3 }),
  ];
  assert.equal(gradeStrokes(base, TSUCHI, CANVAS).crossMatch, true);
  assert.equal(gradeStrokes(sparse, TSUCHI, CANVAS).crossMatch, true);
});

test('字全体が少しずれただけなら大きく減点しない', () => {
  const shifted = [0, 1, 2].map(i => userStroke(SAN[i].s, SAN[i].e, { offset: { x: 0.04, y: 0.03 } }));
  const result = gradeStrokes(shifted, SAN, CANVAS);
  assert.ok(result.total >= 80, `わずかな位置ずれで崩れないこと: ${result.total}`);
});

test('形が大きく崩れていれば字形の点が落ちる', () => {
  // 横画のはずが斜めに大きく傾いている
  const sloppy = [
    userStroke({ x: 0.25, y: 0.25 }, { x: 0.70, y: 0.55 }),
    userStroke(SAN[1].s, SAN[1].e),
    userStroke(SAN[2].s, SAN[2].e),
  ];
  const result = gradeStrokes(sloppy, SAN, CANVAS);
  const clean = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.ok(result.shape < clean.shape, `字形の崩れが点数に出るべき: ${result.shape} vs ${clean.shape}`);
});

test('許容距離は画数が増えるほど縮む', () => {
  const few = getStrokeTolerances(3);
  const many = getStrokeTolerances(20);
  assert.ok(many.start < few.start, `${many.start} < ${few.start}`);
  assert.ok(many.shape < few.shape);
  // 6画までは従来どおりの緩さを保ち、低学年の字で急に厳しくならないこと
  assert.equal(getStrokeTolerances(3).start, getStrokeTolerances(6).start);
});

test('画数が多い字では、1画のずれを見逃さない', () => {
  // 20画ぶんの横画を 0.04 間隔で並べた仮の字
  const dense = Array.from({ length: 20 }, (_, i) => (
    expectedStroke({ x: 0.2, y: 0.1 + i * 0.04 }, { x: 0.8, y: 0.1 + i * 0.04 }, 'tome')
  ));
  const onTarget = dense.map(s => userStroke(s.s, s.e));
  // 10画目だけ 1本ぶん（0.04）下にずらす＝隣の画の位置に書いてしまう
  const offBy = dense.map(s => userStroke(s.s, s.e));
  offBy[10] = userStroke(dense[10].s, dense[10].e, { offset: { x: 0, y: 0.04 } });
  const good = gradeStrokes(onTarget, dense, CANVAS);
  const bad = gradeStrokes(offBy, dense, CANVAS);
  assert.ok(good.total >= 90, `正確に書けば高得点: ${good.total}`);
  // 従来の固定閾値(0.20)＋始点終点のみの採点では、このずれは点数に表れなかった
  assert.ok(bad.total < good.total, `1画のずれが点数に表れるべき: ${bad.total} vs ${good.total}`);
});

test('とめ・はねの正解が無いときは、その配点を他項目へ按分して満点を保てる', () => {
  const noEnding = SAN.map(s => ({ ...s, endingType: null }));
  const result = gradeStrokes(sanUser(), noEnding, CANVAS);
  assert.equal(result.ending, 0, '評価できない項目は0点として持つ');
  assert.ok(result.total >= 95, `按分により満点近くになるべき: ${result.total}`);
  assert.ok(!result.details.some(d => d.includes('とめ・はね')));
});

test('採点の内訳を返し、合計と満点が一致する（結果画面の説明に使う）', () => {
  const result = gradeStrokes(sanUser(), SAN, CANVAS);
  const keys = result.breakdown.map(b => b.key);
  assert.deepEqual(keys, ['shape', 'order', 'ending', 'cross', 'start', 'end']);
  // 「三」は交わる画が無いので交差は採点対象外。残りの項目で100点満点になる
  assert.equal(result.breakdown.find(b => b.key === 'cross').evaluated, false);
  const evaluatedMax = result.breakdown.filter(b => b.evaluated).reduce((sum, b) => sum + b.max, 0);
  assert.ok(Math.abs(evaluatedMax - 100) <= 2, `按分後の満点はほぼ100: ${evaluatedMax}`);
  assert.equal(result.breakdown.reduce((sum, b) => sum + b.points, 0), result.total);
  // 項目ごとの点数は個別フィールドと一致する
  const byKey = Object.fromEntries(result.breakdown.map(b => [b.key, b.points]));
  assert.equal(byKey.shape, result.shape);
  assert.equal(byKey.order, result.order);
  assert.equal(byKey.start, result.startPoints);
  assert.equal(byKey.end, result.endPoints);
});

test('評価できない項目は内訳でも「対象外」と分かり、満点は他項目へ按分される', () => {
  const noEnding = SAN.map(s => ({ ...s, endingType: null }));
  const result = gradeStrokes(sanUser(), noEnding, CANVAS);
  const ending = result.breakdown.find(b => b.key === 'ending');
  assert.equal(ending.evaluated, false);
  assert.equal(ending.max, 0, '採点対象外なので満点も0にして表示から外せる');
  const evaluatedMax = result.breakdown.filter(b => b.evaluated).reduce((sum, b) => sum + b.max, 0);
  assert.ok(Math.abs(evaluatedMax - 100) <= 2, `残りの項目で100点満点になる: ${evaluatedMax}`);
});

test('画数が違うときの内訳は空になる（0点の理由は画数だけ）', () => {
  const result = gradeStrokes(sanUser([0, 1]), SAN, CANVAS);
  assert.deepEqual(result.breakdown, []);
});

test('書き順の誤りで上限に抑えられたときは、内訳の合計より合計点が低くなる', () => {
  const result = gradeStrokes(sanUser([2, 1, 0]), SAN, CANVAS);
  const sum = result.breakdown.reduce((s, b) => s + b.points, 0);
  assert.equal(result.orderMatch, false);
  assert.ok(result.total <= sum, `上限で抑えられる: 合計${result.total} <= 内訳${sum}`);
});

test('とめるべきところではねると、褒めずに直し方を伝える', () => {
  const strokes = sanUser();
  // 3画目の終わりで上へ跳ね上げる（速度を落とし、角度変化で「はね」と判定させる）
  const last = SAN[2];
  const main = userStroke(last.s, { x: last.e.x, y: last.e.y });
  const hook = [
    { x: (last.e.x - 0.01) * CANVAS, y: (last.e.y - 0.05) * CANVAS, time: main.length * 20 + 60 },
    { x: (last.e.x - 0.02) * CANVAS, y: (last.e.y - 0.10) * CANVAS, time: main.length * 20 + 140 },
  ];
  strokes[2] = [...main, ...hook];
  const result = gradeStrokes(strokes, SAN, CANVAS);
  assert.ok(
    result.details.some(d => d.includes('とめる ところ')),
    `終筆の助言が出るべき: ${result.details.join(' / ')}`,
  );
});

test('KanjiVG の筆画種から終筆の正解を導ける', () => {
  assert.equal(endingTypeFromKvgType('㇐'), 'tome');    // 横
  assert.equal(endingTypeFromKvgType('㇚'), 'hane');    // 竖钩（はねる縦画）
  assert.equal(endingTypeFromKvgType('㇒'), 'harai');   // 撇（左払い）
  assert.equal(endingTypeFromKvgType('㇏'), 'harai');   // 捺（右払い）
  assert.equal(endingTypeFromKvgType('㇟'), 'hane');    // 竖弯钩
  assert.equal(endingTypeFromKvgType('㇑a'), 'tome');   // 形状バリエーション接尾辞つき
  assert.equal(endingTypeFromKvgType(''), null);
  assert.equal(endingTypeFromKvgType(undefined), null);
});

test('とめ↔はねは許容幅を考えて強く減点しない', () => {
  assert.equal(endingSimilarity('tome', 'tome'), 1);
  assert.equal(endingSimilarity('tome', 'hane'), 0.5);
  assert.equal(endingSimilarity('tome', 'harai'), 0.2);
  assert.equal(endingSimilarity(null, 'tome'), null, '正解不明なら採点対象外');
});

test('終筆フィードバックは、正解が不明なときに褒めも直しもしない', () => {
  assert.equal(describeEndingFeedback('hane', 'hane').ok, true);
  assert.equal(describeEndingFeedback('tome', 'hane').ok, false);
  assert.equal(describeEndingFeedback('tome', 'hane').text, 'ここは とめる ところだよ');
  // 正解が分からないときに「きれいなハネ！」と誤って強化しないこと
  const unknown = describeEndingFeedback(null, 'hane');
  assert.equal(unknown.ok, true);
  assert.ok(!unknown.text.includes('きれい'));
});
