import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVoiceCheck,
  advanceVoiceCheck,
  shouldShowGentlePrompt,
} from '../src/utils/voice-activity.js';
import { READING } from '../src/constants/gameConfig.js';

/** サンプル列を100ms間隔で流し込むヘルパー */
function feed(state, samples, startTime, interval = READING.SAMPLE_INTERVAL_MS) {
  let current = state;
  let time = startTime;
  for (const rms of samples) {
    time += interval;
    current = advanceVoiceCheck(current, rms, time);
  }
  return { state: current, time };
}

test('校正フェーズで環境ノイズからしきい値を決める', () => {
  const s0 = createVoiceCheck(0);
  assert.equal(s0.phase, 'calibrating');
  // 500msぶんの静かなノイズ(RMS 0.01)を流す
  const { state } = feed(s0, [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  assert.equal(state.phase, 'listening');
  // noiseFloor 0.01 + margin 0.015 = 0.025
  assert.ok(Math.abs(state.threshold - 0.025) < 1e-9);
});

test('しきい値は上下限でクランプされる', () => {
  // ほぼ無音の部屋 → 下限 0.02
  const quiet = feed(createVoiceCheck(0), [0, 0, 0, 0, 0], 0).state;
  assert.equal(quiet.threshold, READING.THRESHOLD_MIN);
  // 騒がしい教室(RMS 0.2) → 上限 0.08 で叫ばなくてもクリア可能
  const noisy = feed(createVoiceCheck(0), [0.2, 0.2, 0.2, 0.2, 0.2], 0).state;
  assert.equal(noisy.threshold, READING.THRESHOLD_MAX);
});

test('250ms未満の短い音(咳・タップ)は無視される', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  // 200msの山 → 途切れ → 200msの山
  const { state } = feed(calibrated.state, [0.1, 0.1, 0, 0.1, 0.1, 0], calibrated.time);
  assert.equal(state.voicedMs, 0);
  assert.equal(state.progress, 0);
});

test('十分な長さの発声を積算してクリアになる', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  // 800msの発声 ×2回(間に休止) = 1600ms ≥ 1500ms
  const utterance = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  const first = feed(calibrated.state, [...utterance, 0, 0], calibrated.time);
  assert.equal(first.state.done, false);
  assert.equal(first.state.voicedMs, 800);
  const second = feed(first.state, utterance, first.time);
  assert.equal(second.state.done, true);
  assert.equal(second.state.phase, 'passed');
  assert.equal(second.state.progress, 1);
});

test('progressは単調増加でクリア後は状態が変わらない', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  let state = calibrated.state;
  let time = calibrated.time;
  let prevProgress = 0;
  for (let i = 0; i < 30; i++) {
    time += READING.SAMPLE_INTERVAL_MS;
    state = advanceVoiceCheck(state, i % 5 === 0 ? 0 : 0.1, time);
    assert.ok(state.progress >= prevProgress);
    prevProgress = state.progress;
  }
  assert.equal(state.done, true);
  const frozen = advanceVoiceCheck(state, 0.5, time + 100);
  assert.deepEqual(frozen, state);
});

test('サンプル間隔が飛んでも一気に加算されない', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  // 5秒後に1サンプルだけ届いた場合、dtは SAMPLE_INTERVAL_MS*4 に制限される
  const state = advanceVoiceCheck(calibrated.state, 0.1, calibrated.time + 5000);
  assert.ok(state.burstMs <= READING.SAMPLE_INTERVAL_MS * 4);
});

test('声が出ないまま時間が経つとやさしい促しを出す', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  const silent = feed(calibrated.state, Array(20).fill(0.01), calibrated.time).state;
  assert.equal(shouldShowGentlePrompt(silent, 10500), true);
  assert.equal(shouldShowGentlePrompt(silent, 5000), false);
  // 一度でも声が出ていれば促しは出さない
  const spoke = feed(calibrated.state, [0.1, 0.1, 0.1, 0.1], calibrated.time).state;
  assert.equal(shouldShowGentlePrompt(spoke, 20000), false);
});

test('不正なRMS値は無音として扱う', () => {
  const calibrated = feed(createVoiceCheck(0), [0.01, 0.01, 0.01, 0.01, 0.01], 0);
  const state = feed(calibrated.state, [NaN, -1, Infinity], calibrated.time).state;
  assert.equal(state.voicedMs, 0);
});
