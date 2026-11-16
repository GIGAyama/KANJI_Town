import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  calculateLearningViewport,
  calculateTrainingViewport,
  STACKED_RESERVE,
  TRAINING_VIEWPORT_PRESETS,
} from '../src/utils/learning-viewport.js';

test('横向きタブレットではサイドバーを除いた領域いっぱいにキャンバスを取る', () => {
  const result = calculateLearningViewport(1280, 800);
  assert.equal(result.isStacked, false);
  assert.equal(result.canvasSize, 580);
});

test('縦持ちタブレットは縦積みレイアウトで画面の半分をキャンバスに使う', () => {
  const result = calculateLearningViewport(800, 1280);
  assert.equal(result.isStacked, true);
  assert.equal(result.canvasSize, 616);
});

test('狭い画面(768px未満)は常に縦積みになる', () => {
  const result = calculateLearningViewport(375, 667);
  assert.equal(result.isStacked, true);
});

test('低い画面でも同じ高さ見積もりで正方形を保つ', () => {
  const result = calculateLearningViewport(1024, 600);
  assert.equal(result.isStacked, false);
  assert.equal(result.canvasSize, 380);
  // 620px境界でキャンバスサイズが不連続に跳ねない
  const below = calculateLearningViewport(1280, 619).canvasSize;
  const above = calculateLearningViewport(1280, 620).canvasSize;
  assert.ok(Math.abs(above - below) <= 2, `619→620で ${below}→${above} と不連続`);
});

test('縦積みはModeLayoutの枠内寸(616px)で頭打ちになる', () => {
  const result = calculateLearningViewport(900, 2000);
  assert.equal(result.isStacked, true);
  assert.equal(result.canvasSize, 616);
});

test('縦積みの背の低い画面は、上のタブと下のボタンを引いた残りにキャンバスを収める', () => {
  // 以前は「高さの 50%（620px 未満は 42%）」だけで決めていたので、高さ 620〜720px のスマホで
  // マスが枠に入りきらなかった（縦につぶれるか、下が最大 24px ボタンの領域に隠れる）。
  assert.equal(calculateLearningViewport(360, 640).canvasSize, 640 - STACKED_RESERVE - 24);
  assert.equal(calculateLearningViewport(375, 667).canvasSize, 667 - STACKED_RESERVE - 24);
  assert.equal(calculateLearningViewport(360, 600).canvasSize, 600 - STACKED_RESERVE - 24);
  // 残りが足りないときは下限（これより低い画面では、隠れる分が残る）
  assert.equal(calculateLearningViewport(360, 560).canvasSize, 220);
  // 高い画面は今までどおり「画面の半分」か幅で決まる
  assert.equal(calculateLearningViewport(390, 844).canvasSize, 358);
  assert.equal(calculateLearningViewport(768, 1024).canvasSize, 488);
});

test('縦積みのキャンバスは、高さを変えても不連続に跳ねない', () => {
  // 以前は 619px → 620px で 236 → 286 と 50px 跳ねていた（42% と 50% の境目）
  let previous = calculateLearningViewport(600, 480).canvasSize;
  for (let height = 481; height <= 1400; height++) {
    const size = calculateLearningViewport(600, height).canvasSize;
    assert.ok(size >= previous && size - previous <= 2, `高さ ${height - 1}→${height} で ${previous}→${size}`);
    previous = size;
  }
});

test('縦積みのキャンバスは、ModeLayout の枠の内側に収まる（枠と同じ式で決める）', () => {
  // 枠の高さ（ModeLayout.jsx）: min(50dvh, 640px, 100dvh - STACKED_RESERVE)、下限 242px。内側は -22px。
  const layout = readFileSync(new URL('../src/components/ui/ModeLayout.jsx', import.meta.url), 'utf8');
  assert.ok(
    layout.includes(`h-[min(50dvh,640px,calc(100dvh_-_${STACKED_RESERVE}px))]`),
    'ModeLayout の枠の高さが STACKED_RESERVE と同じ値になっていない',
  );
  assert.ok(layout.includes('min-h-[242px]'), 'ModeLayout の枠の下限が 242px でない');
  const frameInner = (height) => Math.max(242, Math.min(height * 0.5, 640, height - STACKED_RESERVE)) - 22;
  for (const width of [320, 360, 600, 900]) {
    for (let height = 480; height <= 2000; height += 7) {
      const { isStacked, canvasSize } = calculateLearningViewport(width, height);
      if (!isStacked) continue;
      assert.ok(canvasSize <= frameInner(height), `${width}x${height}: キャンバス ${canvasSize} が枠の内側 ${frameInner(height)} をこえる`);
    }
  }
});

test('キャンバスサイズは下限と上限640でクランプされる', () => {
  assert.equal(calculateLearningViewport(320, 480).canvasSize, 220);
  assert.equal(calculateLearningViewport(2560, 1600).canvasSize, 640);
});

test('不正な寸法はデフォルト(1024x768)にフォールバックする', () => {
  const fallback = calculateLearningViewport(1024, 768);
  assert.deepEqual(calculateLearningViewport(NaN, undefined), fallback);
  assert.deepEqual(calculateLearningViewport(0, -5), fallback);
});

test('トレーニングモードは1280x800で360px固定時代より大幅に広いマスになる', () => {
  const drill = calculateTrainingViewport(1280, 800, TRAINING_VIEWPORT_PRESETS.drillTest);
  const survival = calculateTrainingViewport(1280, 800, TRAINING_VIEWPORT_PRESETS.survival);
  const boss = calculateTrainingViewport(1280, 800, TRAINING_VIEWPORT_PRESETS.boss);
  assert.equal(drill.isStacked, false);
  assert.equal(drill.canvasSize, 562);
  assert.equal(survival.canvasSize, 552);
  assert.equal(boss.canvasSize, 524);
});

test('トレーニングモードの縦持ちは縦積みで上限640まで広がる', () => {
  const result = calculateTrainingViewport(800, 1280, TRAINING_VIEWPORT_PRESETS.drillTest);
  assert.equal(result.isStacked, true);
  assert.equal(result.canvasSize, 640);
});

test('トレーニングモードも下限でクランプされる', () => {
  const result = calculateTrainingViewport(360, 640, TRAINING_VIEWPORT_PRESETS.drillTest);
  assert.equal(result.isStacked, true);
  assert.equal(result.canvasSize, 240);
});

test('トレーニングモードも不正な寸法はデフォルトにフォールバックする', () => {
  const fallback = calculateTrainingViewport(1024, 768, TRAINING_VIEWPORT_PRESETS.boss);
  assert.deepEqual(
    calculateTrainingViewport(Infinity, null, TRAINING_VIEWPORT_PRESETS.boss),
    fallback,
  );
});
