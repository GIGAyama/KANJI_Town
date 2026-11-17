import test from 'node:test';
import assert from 'node:assert/strict';
import { artBounds, ellipsePath, rotatePath, scaleArt, scalePath } from '../src/data/iso-svg/scale-art.js';

// 絵の大きさや向きを、<g transform> で包まずに「座標そのもの」を書きかえて直す部品。
// 数の意味（座標・半径・角度・しるし）を 1 つでも取りちがえると、絵が ゆがむ（エラーにはならない）。

test('scalePath: 動かさない点を中心に、座標を書きかえる', () => {
  assert.equal(scalePath('M10 20L30 40Z', 0.5), 'M5 10L15 20Z');
  // 動かさない点（足もと）は、そのまま
  assert.equal(scalePath('M10 20L30 40', 0.5, 10, 20), 'M10 20L20 30');
  assert.equal(scalePath('M0 0H10V20', 2, 1, 1), 'M-1 -1H19V39');
  assert.equal(scalePath('M0 -17V-56', 0.74, 0, -17.4), 'M0 -17.1V-45.96');
  assert.equal(scalePath('M0 0C10 0 20 10 20 20S30 40 40 40Q50 50 60 40T80 40', 0.5), 'M0 0C5 0 10 5 10 10S15 20 20 20Q25 25 30 20T40 20');
});

test('scalePath: 小文字（いまの点からの ずれ）は、倍率だけを かける', () => {
  assert.equal(scalePath('M10 20l20 20h10v-6z', 0.5, 10, 20), 'M10 20l10 10h5v-3z');
  assert.equal(scalePath('M0 0q2 0 2 2v15q0 2 -2 2', 2, 100, 100), 'M-100 -100q4 0 4 4v30q0 4 -4 4');
});

test('scalePath: 弧は 半径だけを倍にし、角度と しるしは変えない', () => {
  assert.equal(scalePath('M0 0A5 6 30 0 1 10 0', 2), 'M0 0A10 12 30 0 1 20 0');
  assert.equal(scalePath('M0 0a5 6 0 1 0 10 0', 2, 50, 50), 'M-50 -50a10 12 0 1 0 20 0');
});

test('scalePath: 命令の字を はぶいた くり返しと、つめて書いた数も読める', () => {
  assert.equal(scalePath('M0 0L10 0 10 10', 2), 'M0 0L20 0 20 20');
  assert.equal(scalePath('M-5.4-72h10.8', 0.5), 'M-2.7 -36h5.4');
  assert.equal(scalePath('M.5.5l1e1 0', 2), 'M1 1l20 0');
});

test('scalePath: 知らない命令・足りない数は 例外にする（だまって ゆがんだ絵を作らない）', () => {
  assert.throws(() => scalePath('M0 0X5 5', 2), /知らない命令/);
  assert.throws(() => scalePath('M0', 2), /数が足りない/);
  assert.throws(() => scalePath('M0 0L5', 2), /数が足りない/);
});

test('scaleArt: path・circle・ellipse を書きかえ、線の太さは ことわりが無ければ変えない', () => {
  const art = '<path d="M0 -10L10 -30" fill="none" stroke="#111111" stroke-width="2"/>'
    + '<circle cx="10" cy="-30" r="4" fill="#ffffff"/>'
    + '<ellipse cx="0" cy="-10" rx="6" ry="3" fill="#000000" stroke-width="1.2"/>';
  assert.equal(scaleArt(art, 0.5, 0, -10),
    '<path d="M0 -10L5 -20" fill="none" stroke="#111111" stroke-width="2"/>'
    + '<circle cx="5" cy="-20" r="2" fill="#ffffff"/>'
    + '<ellipse cx="0" cy="-10" rx="3" ry="1.5" fill="#000000" stroke-width="1.2"/>');
  // 線の太さにも 倍率を かけるとき
  const thin = scaleArt(art, 0.5, 0, -10, 0.5);
  assert.ok(thin.includes('stroke-width="1"') && thin.includes('stroke-width="0.6"'), thin);
  // 色・id のような、ほかの値には さわらない
  assert.equal(scaleArt('<path id="d1" d="M2 2" fill="#d0d0d0"/>', 3), '<path id="d1" d="M6 6" fill="#d0d0d0"/>');
});

test('scaleArt: transform の付いた図形は あつかわない', () => {
  assert.throws(() => scaleArt('<path d="M0 0" transform="rotate(20)"/>', 0.5), /transform/);
});

test('rotatePath: 時計まわりに回す（SVG の rotate と同じ向き）', () => {
  assert.equal(rotatePath('M10 0L20 0', 90), 'M0 10L0 20');
  assert.equal(rotatePath('M10 0L20 0', 90, 10, 0), 'M10 0L10 10');
  assert.equal(rotatePath('M0 0l10 0', 90), 'M0 0l0 10');
  assert.equal(rotatePath('M10 0L20 0', 0), 'M10 0L20 0');
  // よこ・たての線は、ななめの線に書きかえる
  assert.equal(rotatePath('M0 0H10V10', 90), 'M0 0L0 10L-10 10');
  assert.equal(rotatePath('M0 0h10v10', 90), 'M0 0l0 10l-10 0');
  // 弧は 行き先の点を回し、だ円の かたむきに 角度を足す
  assert.equal(rotatePath('M0 0A5 3 0 0 1 10 0', 90), 'M0 0A5 3 90 0 1 0 10');
});

test('rotatePath: Z のあとの よこ線は、書きはじめの点から数える', () => {
  // M(10,10) → h10 → v10 → Z（(10,10) へ もどる）→ H0 は (0,10) へ
  assert.equal(rotatePath('M10 10h10v10ZH0', 180, 10, 10), 'M10 10l-10 0l0 -10ZL20 10');
});

test('rotatePath: 知らない命令・足りない数は 例外にする', () => {
  assert.throws(() => rotatePath('M0 0X5 5', 10), /知らない命令/);
  assert.throws(() => rotatePath('M0 0L5', 10), /数が足りない/);
});

test('ellipsePath: 曲線 4 本の だ円になり、回しても だ円の上の点を通る', () => {
  const flat = ellipsePath(0, 0, 10, 5);
  assert.ok(flat.startsWith('M10 0C10 2.76 5.52 5 0 5C'), flat);
  assert.ok(flat.endsWith('Z'));
  assert.equal((flat.match(/C/g) || []).length, 4);
  // 30 度 回した だ円: 書きはじめと、曲線 4 本の終わりの点は、回した だ円の上にある
  const deg = 30; const rad = (deg * Math.PI) / 180;
  const turned = ellipsePath(3, -4, 10, 5, deg);
  const nums = turned.match(/-?\d+(?:\.\d+)?/g).map(Number);
  const points = [[nums[0], nums[1]]];
  for (let i = 2; i + 5 < nums.length + 1; i += 6) points.push([nums[i + 4], nums[i + 5]]);
  assert.equal(points.length, 5);
  for (const [x, y] of points) {
    const dx = x - 3; const dy = y + 4;
    const u = dx * Math.cos(rad) + dy * Math.sin(rad);
    const v = -dx * Math.sin(rad) + dy * Math.cos(rad);
    assert.ok(Math.abs((u / 10) ** 2 + (v / 5) ** 2 - 1) < 0.01, `(${x}, ${y}) が だ円の上に無い`);
  }
});

test('artBounds: 図形の座標の 最小・最大', () => {
  assert.deepEqual(artBounds('<path d="M0 0L10 -20" fill="none"/><circle cx="5" cy="5" r="3" fill="#ffffff"/>'), { minX: 0, minY: -20, maxX: 10, maxY: 8 });
  assert.deepEqual(artBounds('<ellipse cx="0" cy="-10" rx="6" ry="3" fill="#000000"/>'), { minX: -6, minY: -13, maxX: 6, maxY: -7 });
  // 小文字（ずれ）と、よこ・たての線
  assert.deepEqual(artBounds('<path d="M10 10l5 5l-20 0"/>'), { minX: -5, minY: 10, maxX: 15, maxY: 15 });
  assert.deepEqual(artBounds('<path d="M0 0H12V-7h-20v3"/>'), { minX: -8, minY: -7, maxX: 12, maxY: 0 });
  // Z のあとは、書きはじめの点から
  assert.deepEqual(artBounds('<path d="M5 5l10 0l0 10Zl-3 -3"/>'), { minX: 2, minY: 2, maxX: 15, maxY: 15 });
  // 弧は、両はしの点から たての半径だけ 大きめに見る
  assert.deepEqual(artBounds('<path d="M-4 0A4 2 0 0 1 4 0"/>'), { minX: -4, minY: -2, maxX: 4, maxY: 2 });
  assert.equal(artBounds(''), null);
  assert.equal(artBounds('<g></g>'), null);
});
