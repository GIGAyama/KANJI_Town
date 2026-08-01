import { READING } from '../constants/gameConfig.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * 音読チャレンジの発声検出ステートマシン（純粋ロジック）。
 *
 * マイクのRMSサンプルを時刻付きで受け取り、
 *   1. calibrating: 最初の CALIBRATION_MS で環境ノイズの平均を計測
 *   2. listening:   ノイズフロア+マージンの適応しきい値を超えた発声を積算
 *   3. passed:      有声時間の合計が TARGET_VOICED_MS に達したらクリア
 * と遷移する。MIN_BURST_MS 未満で途切れた短い山（咳・タップ音）は破棄する。
 *
 * 音声データそのものは一切保持しない（RMS数値のみ）。
 * DOM / Web Audio に依存しないため node --test で検証できる。
 */
export function createVoiceCheck(startTime, config = READING) {
  return {
    phase: 'calibrating',
    noiseFloor: 0,
    threshold: config.THRESHOLD_MIN,
    /** クリア判定に算入済みの有声時間(ms) */
    voicedMs: 0,
    /** 現在続いている発声の長さ(ms) */
    burstMs: 0,
    /** 現在のバーストのうち voicedMs に算入済みの長さ(ms) */
    countedMs: 0,
    progress: 0,
    level: 0,
    done: false,
    startedAt: startTime,
    lastSampleAt: startTime,
    lastVoicedAt: 0,
    calibrationSum: 0,
    calibrationCount: 0,
  };
}

/** 1サンプルぶん状態を進める。stateは変更せず新しい状態を返す。 */
export function advanceVoiceCheck(state, rms, time, config = READING) {
  if (!state || state.done) return state;
  const safeRms = Number.isFinite(rms) && rms > 0 ? rms : 0;
  // タブ切替などでサンプルが飛んだ場合に一気に加算されないよう dt を制限する
  const dt = clamp(time - state.lastSampleAt, 0, config.SAMPLE_INTERVAL_MS * 4);

  if (state.phase === 'calibrating') {
    const calibrationSum = state.calibrationSum + safeRms;
    const calibrationCount = state.calibrationCount + 1;
    if (time - state.startedAt < config.CALIBRATION_MS) {
      return { ...state, calibrationSum, calibrationCount, lastSampleAt: time };
    }
    const noiseFloor = calibrationCount > 0 ? calibrationSum / calibrationCount : 0;
    const threshold = clamp(noiseFloor + config.NOISE_MARGIN, config.THRESHOLD_MIN, config.THRESHOLD_MAX);
    return {
      ...state,
      phase: 'listening',
      noiseFloor,
      threshold,
      calibrationSum,
      calibrationCount,
      lastSampleAt: time,
    };
  }

  const isVoiced = safeRms >= state.threshold;
  const level = clamp(safeRms / (state.threshold * 2), 0, 1);
  let { voicedMs, burstMs, countedMs } = state;

  if (isVoiced) {
    burstMs += dt;
    if (burstMs >= config.MIN_BURST_MS) {
      // バースト成立: 未算入ぶん（初回はバースト全体、以後は今回のdt）をまとめて算入
      voicedMs += burstMs - countedMs;
      countedMs = burstMs;
    }
  } else {
    burstMs = 0;
    countedMs = 0;
  }

  const progress = clamp(voicedMs / config.TARGET_VOICED_MS, 0, 1);
  const done = progress >= 1;

  return {
    ...state,
    phase: done ? 'passed' : 'listening',
    voicedMs,
    burstMs,
    countedMs,
    progress,
    level,
    done,
    lastSampleAt: time,
    lastVoicedAt: isVoiced ? time : state.lastVoicedAt,
  };
}

/** 一定時間声が検出できていないとき、やさしい促しを表示すべきか。 */
export function shouldShowGentlePrompt(state, now, config = READING) {
  if (!state || state.done || state.phase !== 'listening') return false;
  if (state.voicedMs > 0) return false;
  return now - state.startedAt >= config.GENTLE_PROMPT_AFTER_MS;
}
