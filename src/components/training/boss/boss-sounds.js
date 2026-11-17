// ボスバトルの音 — マイ漢字タウン
// audioCtrl.playSE に、音の定義を そのまま渡す（systems/audio.js の「複数音」の形）。
// ここに置くのは、入口の束（初回に読む JS。上限 220KiB）を ふやさないため（ボスバトルは あとから読む束）。

/** @type {Record<string, { notes: number[], type: OscillatorType, gain: number, interval: number, duration: number, singleOsc?: boolean, vibrate?: number|number[] }>} */
export const BOSS_SE = {
  /** ボスが あらわれる */
  appear: { notes: [98, 110, 146.83], type: 'sawtooth', gain: 0.12, interval: 0.14, duration: 0.7, singleOsc: true, vibrate: [40, 30, 80] },
  /** 字が とんでいく */
  shot: { notes: [520, 700, 940, 1240], type: 'triangle', gain: 0.1, interval: 0.035, duration: 0.2, singleOsc: true },
  /** 当たった */
  hit: { notes: [220, 160, 110], type: 'square', gain: 0.12, interval: 0.04, duration: 0.2, singleOsc: true, vibrate: 40 },
  /** 会心の一撃 */
  critical: { notes: [659.25, 880, 1174.66, 1567.98], type: 'square', gain: 0.07, interval: 0.06, duration: 0.3, vibrate: [40, 30, 70] },
  /** ふせがれた */
  guard: { notes: [392, 262], type: 'square', gain: 0.07, interval: 0.07, duration: 0.18, vibrate: 25 },
  /** ボスの こうげき */
  roar: { notes: [150, 120, 92, 70, 55], type: 'sawtooth', gain: 0.15, interval: 0.09, duration: 0.6, singleOsc: true, vibrate: [70, 40, 120] },
  /** ハートが へった */
  hurt: { notes: [330, 220, 165], type: 'triangle', gain: 0.14, interval: 0.07, duration: 0.3, singleOsc: true },
  /** ハートが もどった */
  heal: { notes: [659.25, 880, 1318.51], type: 'sine', gain: 0.12, interval: 0.08, duration: 0.35 },
  /** ボスが おこった */
  rage: { notes: [110, 146.83, 110, 174.61], type: 'sawtooth', gain: 0.1, interval: 0.1, duration: 0.6, singleOsc: true },
  /** 勝った */
  win: { notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.51], type: 'square', gain: 0.06, interval: 0.11, duration: 0.5, vibrate: [60, 40, 60, 40, 160] },
  /** 負けた（暗くしすぎない） */
  lose: { notes: [392, 349.23, 329.63, 261.63], type: 'triangle', gain: 0.1, interval: 0.18, duration: 0.9, singleOsc: true },
  /** ★ が 1 つ ふえる */
  star: { notes: [987.77, 1318.51], type: 'sine', gain: 0.1, interval: 0.06, duration: 0.25 },
};
