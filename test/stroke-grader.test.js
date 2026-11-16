import test from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { gradeStrokes, isOrderMistake, judgeWriting, measureAttempt, recommendEvaluation } from '../src/systems/strokeGrader.js';
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

test('書き順だけのまちがいは、どのモードでも good 以上のおすすめにならない', () => {
  const wrongOrder = gradeStrokes(sanUser([2, 1, 0]), SAN, CANVAS);
  assert.equal(isOrderMistake(wrongOrder), true);
  // ボス（60点以上で攻撃成功）やサバイバル（60点以上で OK）の しきい値を超えていても
  assert.ok(wrongOrder.total >= 30, `前提: 点数は残っている ${wrongOrder.total}`);
  assert.ok(['hard', 'again'].includes(recommendEvaluation(wrongOrder)));

  const clean = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.equal(isOrderMistake(clean), false);
  assert.equal(recommendEvaluation(clean), 'easy');
});

test('画数ちがい・採点できない結果は、書き順のまちがいとは数えず again にする', () => {
  const tooFew = gradeStrokes(sanUser([0, 1]), SAN, CANVAS);
  assert.equal(isOrderMistake(tooFew), false);
  assert.equal(recommendEvaluation(tooFew), 'again');

  const noModel = gradeStrokes(sanUser(), [], CANVAS);
  assert.equal(isOrderMistake(noModel), false);
  assert.equal(recommendEvaluation(noModel), 'again');
  assert.equal(recommendEvaluation(null), 'again');
});

// ── 字の大きさ ──
/** 「三」を、字の中心（0.5, 0.5）から k 倍の大きさで書く */
const sanScaled = (k, order = [0, 1, 2]) => order.map(i => {
  const s = SAN[i];
  const at = (p) => ({ x: (p.x - 0.5) * k + 0.5, y: (p.y - 0.5) * k + 0.5 });
  return userStroke(at(s.s), at(s.e));
});

test('形も書き順も正しければ、小さく（大きく）書いても合格点（70点以上）になる', () => {
  // 以前は大きさをそろえず、0.6 倍で 62 点・0.5 倍で 57 点になり、ドリルテストで不合格になっていた
  for (const k of [0.6, 0.7, 1.3]) {
    const result = gradeStrokes(sanScaled(k), SAN, CANVAS);
    assert.ok(result.total >= 70, `${k}倍: ${result.total}`);
    assert.equal(result.orderMatch, true);
  }
});

test('大きさの差は講評で伝える（「ていねいに」ではなく「大きく／小さく」）', () => {
  assert.ok(gradeStrokes(sanScaled(0.6), SAN, CANVAS).details.includes('字を もうすこし 大きく 書こう'));
  assert.ok(gradeStrokes(sanScaled(1.4), SAN, CANVAS).details.includes('字を もうすこし 小さく 書こう'));
  const normal = gradeStrokes(sanScaled(1), SAN, CANVAS).details;
  assert.ok(!normal.some(d => /大きく|小さく/.test(d)), normal.join(' / '));
});

test('大きさの補正には上限があり、極端に小さい字は減点のまま。書き順ちがいの上限も変わらない', () => {
  assert.ok(gradeStrokes(sanScaled(0.3), SAN, CANVAS).total < 30);
  const reversed = gradeStrokes(sanScaled(0.6, [2, 1, 0]), SAN, CANVAS);
  assert.equal(reversed.orderMatch, false);
  assert.ok(reversed.total <= 69, `${reversed.total}`);
});

// ── 計算量 ──
test('20画の字をペンでゆっくり書いても（1画600点）、採点はすぐ終わる', () => {
  // 以前は全画の組で点の数どうしの掛け算をしていて、20画×600点で 0.4 秒ほど固まった
  const model = Array.from({ length: 20 }, (_, k) => {
    const y = 0.05 + k * 0.045;
    return expectedStroke({ x: 0.1 + (k % 3) * 0.05, y }, { x: 0.9 - (k % 2) * 0.1, y: y + (k % 4 === 0 ? 0.3 : 0) }, 'tome');
  });
  const strokes = model.map(s => userStroke(s.s, s.e, { steps: 600, msPerPoint: 5 }));
  gradeStrokes(strokes, model, CANVAS); // 1回目（お手本の交差表を作る）
  const started = performance.now();
  const result = gradeStrokes(strokes, model, CANVAS);
  const elapsed = performance.now() - started;
  assert.equal(result.strokeCountMatch, true);
  assert.ok(elapsed < 150, `${elapsed.toFixed(1)}ms`);
});

test('お手本の交差表を渡しても、渡さなくても、同じ採点になる', () => {
  const strokes = [userStroke(TSUCHI[0].s, TSUCHI[0].e), userStroke({ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.8 }), userStroke(TSUCHI[2].s, TSUCHI[2].e)];
  const matrix = TSUCHI.map(() => TSUCHI.map(() => false)); // 「土」はどの画も突き抜けない
  const withMatrix = gradeStrokes(strokes, TSUCHI, CANVAS, { expectedCross: matrix });
  const without = gradeStrokes(strokes, TSUCHI, CANVAS);
  assert.equal(withMatrix.total, without.total);
  assert.equal(withMatrix.crossMatch, without.crossMatch);
});

// ── でたらめな入力 ──
const dotAt = (x, y) => [{ x: x * CANVAS, y: y * CANVAS, time: 0 }, { x: x * CANVAS + 1, y: y * CANVAS + 1, time: 30 }];
const ICHI = [expectedStroke({ x: 0.15, y: 0.5 }, { x: 0.85, y: 0.5 }, 'tome')];

test('点を打っただけの入力は 30 点未満で、書き順・とめの点も入らない', () => {
  // 以前は「一」に点を1つ打つと 45 点（書き順 28 ＋ とめ 17）で、おすすめが「むずかしい」（合格扱い）になった
  for (const [label, strokes, model] of [
    ['一に右下の点', [dotAt(0.8, 0.8)], ICHI],
    ['三に中央の点3つ', [dotAt(0.5, 0.5), dotAt(0.5, 0.5), dotAt(0.5, 0.5)], SAN],
  ]) {
    const result = gradeStrokes(strokes, model, CANVAS);
    assert.ok(result.total < 30, `${label}: ${result.total}`);
    assert.equal(result.order, 0, `${label}: 書き順 ${result.order}`);
    assert.equal(result.ending, 0, `${label}: とめ ${result.ending}`);
    assert.equal(recommendEvaluation(result), 'again', label);
    assert.ok(!result.details.includes('書き順：ぜんぶ正しい ✓'), label);
    assert.ok(result.details.some(d => d.includes('おてほんを よく見よう')), label);
  }
});

test('お手本とちがう向きの線（「一」に縦線）も 30 点未満になる', () => {
  const result = gradeStrokes([userStroke({ x: 0.5, y: 0.15 }, { x: 0.5, y: 0.85 })], ICHI, CANVAS);
  assert.ok(result.total < 30, `${result.total}`);
  assert.equal(recommendEvaluation(result), 'again');
  // 形の分からない画は、書き順のまちがいとも数えない（ボス・サバイバルの「書き順ちがい」にしない）
  assert.equal(isOrderMistake(result), false);
});

test('形の取れた字では、書き順・とめの点はこれまでどおり入る', () => {
  const clean = gradeStrokes(sanUser(), SAN, CANVAS);
  assert.ok(clean.order >= 25, `${clean.order}`);
  // 少しずつずれた字（各画を 0.03 ずらす）でも書き順は満点
  const shifted = SAN.map((s, i) => userStroke(s.s, s.e, { offset: { x: (i - 1) * 0.03, y: 0.02 } }));
  const result = gradeStrokes(shifted, SAN, CANVAS);
  assert.equal(result.orderMatch, true);
  assert.equal(result.order, clean.order);
});

// ── 毎日の学習のテストの判定（自己採点のかわり）──
// 以前は採点のおすすめより1段上まで児童が選べ、画数ちがい（おすすめ「忘れた」）でも
// 「むずかしい」を選べば合格あつかいで先へ進めた。線を1本引くだけで学習が進んでいた。
const sanSplit = () => {
  // 「三」の2画目の とちゅうで ゆびが はなれて、2本に切れた（4画になる）
  const strokes = sanUser();
  const mid = { x: 0.40, y: 0.50 };
  strokes.splice(1, 1, userStroke(SAN[1].s, mid, { steps: 12 }), userStroke(mid, SAN[1].e, { steps: 12 }));
  return strokes;
};
const randomLine = (a, b) => userStroke(a, b);

test('ていねいに書いた字は pass。評価は点数で決まり、児童は上げられない', () => {
  const judged = judgeWriting(sanUser(), SAN, CANVAS);
  assert.equal(judged.verdict, 'pass');
  assert.equal(judged.evaluation, 'easy');
  assert.equal(judged.reason, 'ok');
  assert.equal(judged.lenient, false);
});

test('書き順・線の交わりがちがう字は、点が残っていれば通すが hard まで', () => {
  const wrongOrder = judgeWriting(sanUser([2, 1, 0]), SAN, CANVAS);
  assert.equal(wrongOrder.verdict, 'pass');
  assert.equal(wrongOrder.evaluation, 'hard');
  assert.equal(wrongOrder.reason, 'order');

  // 「土」の2画目を上へ突き出した字。以前はおすすめが again で、選べるのは「むずかしい」までだった
  const pierced = [userStroke(TSUCHI[0].s, TSUCHI[0].e), userStroke({ x: 0.50, y: 0.15 }, { x: 0.50, y: 0.80 }), userStroke(TSUCHI[2].s, TSUCHI[2].e)];
  const crossed = judgeWriting(pierced, TSUCHI, CANVAS);
  assert.equal(crossed.result.crossMatch, false);
  assert.equal(crossed.verdict, 'pass');
  assert.equal(crossed.evaluation, 'hard');
  assert.equal(crossed.reason, 'cross');
});

test('線を1本引いただけ・点を打っただけは careless（てきとう書き）で、何回やっても通らない', () => {
  const cases = [
    ['三に線1本', [randomLine({ x: 0.2, y: 0.2 }, { x: 0.8, y: 0.7 })], SAN, 'few'],
    ['三に点1つ', [dotAt(0.5, 0.5)], SAN, 'few'],
    ['三に点3つ', [dotAt(0.3, 0.3), dotAt(0.5, 0.5), dotAt(0.7, 0.7)], SAN, 'ink'],
    ['一に点1つ', [dotAt(0.8, 0.8)], ICHI, 'ink'],
    ['三に線を12本', Array.from({ length: 12 }, (_, i) => randomLine({ x: 0.1, y: 0.1 + i * 0.07 }, { x: 0.9, y: 0.12 + i * 0.07 })), SAN, 'many'],
  ];
  for (const [label, strokes, model, reason] of cases) {
    for (const previousFails of [0, 1, 2]) {
      const judged = judgeWriting(strokes, model, CANVAS, { previousFails });
      assert.equal(judged.verdict, 'careless', `${label}（やり直し ${previousFails} 回）`);
      assert.equal(judged.evaluation, 'again', label);
      assert.equal(judged.reason, reason, label);
    }
  }
});

test('でたらめな線を画数ぶん引いても通らない（てきとう書きとは決めつけず、もう1回にする）', () => {
  const lines = [
    randomLine({ x: 0.2, y: 0.9 }, { x: 0.9, y: 0.1 }),
    randomLine({ x: 0.1, y: 0.1 }, { x: 0.3, y: 0.9 }),
    randomLine({ x: 0.8, y: 0.2 }, { x: 0.6, y: 0.9 }),
  ];
  for (const previousFails of [0, 1, 2]) {
    const judged = judgeWriting(lines, SAN, CANVAS, { previousFails });
    assert.equal(judged.verdict, 'retry', `やり直し ${previousFails} 回`);
    assert.equal(judged.evaluation, 'again');
  }
});

test('1画多いだけの字は、1回目はもう1回、同じ字の2回目からは hard で通す（読み取れる字で止めない）', () => {
  const first = judgeWriting(sanSplit(), SAN, CANVAS, { previousFails: 0 });
  assert.equal(first.result.strokeCountMatch, false);
  assert.equal(first.verdict, 'retry');
  assert.equal(first.reason, 'count');
  assert.equal(first.attempt.recognized, true);
  assert.equal(first.attempt.careless, false);

  const second = judgeWriting(sanSplit(), SAN, CANVAS, { previousFails: 1 });
  assert.equal(second.verdict, 'pass');
  assert.equal(second.evaluation, 'hard');
  assert.equal(second.lenient, true);
});

test('「三」に「二」を書いたような、画が足りない字は 2回目でも読み取れる範囲でしか通さない', () => {
  // 3画のうち2画（67%）は合っているので読み取れる字。1回目は必ずやり直しになる
  const two = judgeWriting(sanUser([0, 1]), SAN, CANVAS, { previousFails: 0 });
  assert.equal(two.verdict, 'retry');
  assert.equal(two.reason, 'count');
  // 3画のうち1画しか無い字は、何回目でも通らない
  const one = judgeWriting(sanUser([0]), SAN, CANVAS, { previousFails: 2 });
  assert.notEqual(one.verdict, 'pass');
});

test('小さく書いた字は「小さい」と伝えてもう1回。てきとう書きにはしない', () => {
  const tiny = judgeWriting(sanScaled(0.3), SAN, CANVAS);
  assert.equal(tiny.verdict, 'retry');
  assert.equal(tiny.reason, 'small');
  assert.equal(tiny.attempt.recognized, true);
  assert.equal(tiny.attempt.careless, false);
  assert.equal(judgeWriting(sanScaled(0.3), SAN, CANVAS, { previousFails: 1 }).verdict, 'pass');
});

test('とちゅうまで書いた字（半分より多い）は、てきとう書きにしない', () => {
  // 6画の字の3画だけ。画数の 1/3（2画）より多いので、やり直しになるだけ
  const model = Array.from({ length: 6 }, (_, k) => expectedStroke({ x: 0.15, y: 0.15 + k * 0.14 }, { x: 0.85, y: 0.15 + k * 0.14 }, 'tome'));
  const half = model.slice(0, 3).map(s => userStroke(s.s, s.e));
  const judged = judgeWriting(half, model, CANVAS);
  assert.equal(judged.verdict, 'retry');
  assert.equal(judged.attempt.careless, false);
  // 2画だけなら 1/3 以下なので、てきとう書き
  assert.equal(judgeWriting(half.slice(0, 2), model, CANVAS).verdict, 'careless');
});

test('「画数の 1/3 以下」の境目は、どの画数でも同じに決まる', () => {
  const lines = (n) => Array.from({ length: n }, (_, k) => expectedStroke({ x: 0.1, y: 0.05 + k * (0.9 / n) }, { x: 0.9, y: 0.05 + k * (0.9 / n) }, 'tome'));
  for (let expected = 3; expected <= 24; expected++) {
    const model = lines(expected);
    const few = Math.floor(expected / 3);
    const written = (count) => model.slice(0, count).map(s => userStroke(s.s, s.e));
    assert.equal(measureAttempt(written(few), model, CANVAS).carelessReason, 'few', `${expected}画に${few}画`);
    assert.equal(measureAttempt(written(few + 1), model, CANVAS).carelessReason, null, `${expected}画に${few + 1}画`);
  }
});

test('2画の字に1本だけ書いても、てきとう書きにはしない（半分は書いている）', () => {
  const NI = [expectedStroke({ x: 0.25, y: 0.3 }, { x: 0.75, y: 0.3 }, 'tome'), expectedStroke({ x: 0.15, y: 0.7 }, { x: 0.85, y: 0.7 }, 'tome')];
  const judged = judgeWriting([userStroke(NI[0].s, NI[0].e)], NI, CANVAS);
  assert.equal(judged.verdict, 'retry');
  assert.equal(judged.reason, 'count');
});

test('お手本が無いときは ungraded（このときだけ自己申告にする）', () => {
  const judged = judgeWriting(sanUser(), [], CANVAS);
  assert.equal(judged.verdict, 'ungraded');
  assert.equal(judged.evaluation, null);
});

test('measureAttempt は、こわれた入力でも数を返す', () => {
  const broken = measureAttempt([[{ x: NaN, y: 1 }], null, 'x'], SAN, 0);
  assert.equal(broken.actualCount, 0);
  assert.equal(broken.recognized, false);
  assert.equal(measureAttempt(sanUser(), null, CANVAS).expectedCount, 0);
  const ok = measureAttempt(sanUser(), SAN, CANVAS);
  assert.equal(ok.coverage, 1);
  assert.ok(Math.abs(ok.inkRatio - 1) < 0.01, `${ok.inkRatio}`);
  assert.ok(Math.abs(ok.sizeRatio - 1) < 0.01, `${ok.sizeRatio}`);
});

/**
 * 採点を別スレッドで走らせ、時間内に終わるかを見る。
 * 無限ループは同じスレッドでは止められないので、Worker を止めて「固まった」と判定する。
 */
function gradeInWorker(caseName, timeoutMs = 3000) {
  const graderUrl = new URL('../src/systems/strokeGrader.js', import.meta.url).href;
  const source = `
    const { parentPort, workerData } = await import('node:worker_threads');
    const { gradeStrokes } = await import(workerData.graderUrl);
    const C = 300;
    const line = (y) => Array.from({ length: 25 }, (_, i) => ({ x: (0.2 + 0.6 * i / 24) * C, y: y * C, time: i * 20 }));
    const model = [0.25, 0.5, 0.75].map((y) => {
      const points = Array.from({ length: 25 }, (_, i) => ({ x: 0.2 + 0.6 * i / 24, y }));
      return { s: points[0], e: points[24], points, endingType: 'tome' };
    });
    const user = [line(0.25), line(0.5), line(0.75)];
    const cases = {
      zeroCanvas: () => gradeStrokes(user, model, 0),
      nanCanvas: () => gradeStrokes(user, model, NaN),
      nanPoint: () => { user[1][3] = { x: NaN, y: 10, time: 0 }; return gradeStrokes(user, model, C); },
      infinitePoint: () => { user[0][0] = { x: Infinity, y: -Infinity, time: 0 }; return gradeStrokes(user, model, C); },
      nanModel: () => { model[2].points[4] = { x: NaN, y: NaN }; return gradeStrokes(user, model, C); },
    };
    const result = cases[workerData.caseName]();
    parentPort.postMessage({ total: result.total, strokeCountMatch: result.strokeCountMatch });
  `;
  return new Promise((resolve, reject) => {
    const worker = new Worker(source, { eval: true, workerData: { graderUrl, caseName } });
    const timer = setTimeout(() => { worker.terminate(); reject(new Error(`${caseName}: ${timeoutMs}ms で終わらない（固まった）`)); }, timeoutMs);
    worker.once('message', (message) => { clearTimeout(timer); worker.terminate(); resolve(message); });
    worker.once('error', (error) => { clearTimeout(timer); reject(error); });
  });
}

test('座標やキャンバスの大きさに NaN・Infinity・0 が混ざっても、採点は固まらずに終わる', async () => {
  // 以前は割り当て問題の費用が NaN になると while を抜けられず、タブが固まっていた
  for (const caseName of ['zeroCanvas', 'nanCanvas', 'nanPoint', 'infinitePoint', 'nanModel']) {
    const result = await gradeInWorker(caseName);
    assert.ok(Number.isFinite(result.total), `${caseName}: ${result.total}`);
  }
  // 大きさが分からないときは採点しない（0点で、合格扱いにしない）
  assert.equal((await gradeInWorker('zeroCanvas')).total, 0);
});
