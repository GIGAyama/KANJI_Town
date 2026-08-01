import test from 'node:test';
import assert from 'node:assert/strict';
import { Analyzer } from '../src/systems/analyzer.js';
import { STROKE_THRESHOLDS } from '../src/constants/strokeConfig.js';

/** 線分を等間隔のポイント列にする（サンプリング密度を指定できる） */
function line(from, to, steps = 20) {
  return Array.from({ length: steps + 1 }, (_, i) => ({
    x: from.x + (to.x - from.x) * (i / steps),
    y: from.y + (to.y - from.y) * (i / steps),
  }));
}

test('突き抜けの深さは、交差点から端までの短い方の長さを返す', () => {
  const horizontal = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
  const vertical = line({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 });
  // どちらも中央で交わるので、深さは半分の長さ 0.3
  assert.ok(Math.abs(Analyzer.crossingDepth(horizontal, vertical) - 0.3) < 0.01);
});

test('端が触れているだけの画は交差とみなさない（「土」型のT字接触）', () => {
  const horizontal = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
  // 縦画の終点がちょうど横画の上（わずかに越える程度）
  const touching = line({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.505 });
  assert.equal(Analyzer.isCrossed(horizontal, touching), false);
});

test('突き抜けている画は交差とみなす（「牛」型）', () => {
  const horizontal = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
  const piercing = line({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.9 });
  assert.equal(Analyzer.isCrossed(horizontal, piercing), true);
});

test('交差の深さはペンのサンプリング密度に左右されない', () => {
  const horizontal = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 }, 4);
  const sparse = line({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 }, 3);
  const dense = line({ x: 0.5, y: 0.2 }, { x: 0.5, y: 0.8 }, 200);
  const sparseDepth = Analyzer.crossingDepth(horizontal, sparse);
  const denseDepth = Analyzer.crossingDepth(horizontal, dense);
  assert.ok(Math.abs(sparseDepth - denseDepth) < 0.01);
  assert.equal(Analyzer.isCrossed(horizontal, sparse), true);
  assert.equal(Analyzer.isCrossed(horizontal, dense), true);
});

test('交差スコアは、交わるべき組・交わってはいけない組で向きが逆になる', () => {
  const { CROSS_DEPTH_NONE, CROSS_DEPTH_CLEAR } = STROKE_THRESHOLDS;
  assert.equal(Analyzer.crossingScore(true, CROSS_DEPTH_CLEAR + 0.1), 1);
  assert.equal(Analyzer.crossingScore(true, 0), 0);
  assert.equal(Analyzer.crossingScore(false, 0), 1);
  assert.equal(Analyzer.crossingScore(false, CROSS_DEPTH_CLEAR + 0.1), 0);
  // 中間はなだらかに変化し、いきなり不正解にはならない
  const mid = (CROSS_DEPTH_NONE + CROSS_DEPTH_CLEAR) / 2;
  assert.ok(Math.abs(Analyzer.crossingScore(true, mid) - 0.5) < 1e-9);
});

test('judgeCrossing は不足と過剰を区別する', () => {
  assert.equal(Analyzer.judgeCrossing(true, 0.3), 'ok');
  assert.equal(Analyzer.judgeCrossing(true, 0), 'missing');
  assert.equal(Analyzer.judgeCrossing(false, 0.3), 'extra');
  assert.equal(Analyzer.judgeCrossing(false, 0), 'ok');
});

test('リサンプリングは点数を揃え、弧長で等間隔に並べる', () => {
  // 前半に点が密集した線分でも、リサンプリング後は等間隔になる
  const uneven = [
    { x: 0, y: 0 }, { x: 0.01, y: 0 }, { x: 0.02, y: 0 }, { x: 1, y: 0 },
  ];
  const resampled = Analyzer.resample(uneven, 5);
  assert.equal(resampled.length, 5);
  resampled.forEach((p, i) => {
    assert.ok(Math.abs(p.x - i / 4) < 1e-6);
  });
});

test('字形のずれは、同じ形なら0・逆走なら reversed の方が小さい', () => {
  const stroke = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
  const same = Analyzer.shapeDistance(stroke, stroke);
  assert.ok(same.forward < 1e-9);

  const backwards = line({ x: 0.8, y: 0.5 }, { x: 0.2, y: 0.5 });
  const reversedCase = Analyzer.shapeDistance(backwards, stroke);
  assert.ok(reversedCase.reversed < reversedCase.forward);
  assert.ok(reversedCase.reversed < 1e-9);
});

test('字形のずれは、まっすぐな画と大きく曲がった画を区別する', () => {
  const straight = line({ x: 0.2, y: 0.5 }, { x: 0.8, y: 0.5 });
  const curved = Array.from({ length: 21 }, (_, i) => {
    const t = i / 20;
    return { x: 0.2 + 0.6 * t, y: 0.5 - 0.25 * Math.sin(Math.PI * t) };
  });
  const { forward } = Analyzer.shapeDistance(straight, curved);
  assert.ok(forward > 0.1, `曲がりが検出されるべき: ${forward}`);
});
