import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateLearningViewport,
  calculateTrainingViewport,
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

test('低い画面では控えめな高さ見積もりを使う', () => {
  const result = calculateLearningViewport(1024, 600);
  assert.equal(result.isStacked, false);
  assert.equal(result.canvasSize, 488);
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
