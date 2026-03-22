// ==========================================
// オーディオコントローラー
// Web Audio API による効果音・BGM合成
// リソース管理・エラーハンドリング・振動フィードバック
// ==========================================

/** 効果音の定義テーブル */
const SE_DEFINITIONS = {
  click: {
    type: 'square', freq: 600, gain: 0.05,
    duration: 0.05, vibrate: 10,
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    },
  },
  pop: {
    type: 'sine', freq: 800, gain: 0.05,
    duration: 0.1,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    },
  },
  place: {
    type: 'triangle', freq: 300, gain: 0.1,
    duration: 0.1, vibrate: 20,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    },
  },
  stamp_good: {
    type: 'sine', freq: 880, gain: 0.15,
    duration: 0.4, vibrate: [30, 50, 30],
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    },
  },
  stamp_bad: {
    type: 'sawtooth', freq: 150, gain: 0.15,
    duration: 0.3, vibrate: [100, 50, 100],
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(100, t + 0.3);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
    },
  },
  coin: {
    type: 'sine', freq: 1200, gain: 0.1,
    duration: 0.3,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(1200, t);
      osc.frequency.setValueAtTime(1600, t + 0.1);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
    },
  },
  gacha: {
    type: 'square', freq: 200, gain: 0.1,
    duration: 0.5,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.linearRampToValueAtTime(800, t + 0.5);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.5);
    },
  },
  chest_drop: {
    type: 'square', freq: 100, gain: 0.2,
    duration: 0.3, vibrate: 100,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.3);
    },
  },
  boss_hit: {
    type: 'sawtooth', freq: 100, gain: 0.2,
    duration: 0.2, vibrate: [50, 50],
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(100, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.2);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    },
  },
  success: {
    type: 'sine', freq: 880, gain: 0.2,
    duration: 0.5,
    setup: (osc, t) => {
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.exponentialRampToValueAtTime(1760, t + 0.2);
    },
    envelope: (gain, t) => {
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    },
  },
};

/** 複数音を順次鳴らす効果音の定義 */
const SE_MULTI_DEFINITIONS = {
  stamp_perfect: {
    notes: [523.25, 659.25, 783.99, 1046.50],
    type: 'square', gain: 0.05,
    interval: 0.08, duration: 0.3,
    vibrate: [40, 40, 40, 40],
  },
  chest_open: {
    notes: [440, 554.37, 659.25, 880],
    type: 'triangle', gain: 0.2,
    interval: 0.1, duration: 1.5,
    vibrate: [50, 100, 200],
    // chest_openは単一オシレータで周波数ステップ
    singleOsc: true,
  },
  rare: {
    notes: [880, 1108.73, 1318.51, 1760],
    type: 'sine', gain: 0.1,
    interval: 0.1, duration: 0.5,
    vibrate: [100, 50, 100, 50, 200],
  },
  level_up: {
    notes: [523.25, 659.25, 783.99, 1046.50],
    type: 'square', gain: 0.05,
    interval: 0.1, duration: 0.4,
    vibrate: [60, 40, 60, 40, 100],
  },
};

/** BGMパターン定義 */
const BGM_PATTERNS = {
  home: { notes: [220, 277.18, 329.63, 440], type: 'square', gain: 0.015, interval: 250 },
  game: { notes: [261.63, 329.63, 392.00, 523.25], type: 'square', gain: 0.015, interval: 250 },
  boss: { notes: [130.81, 146.83, 164.81, 196.00], type: 'sawtooth', gain: 0.03, interval: 200 },
};

class AudioController {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    /** @type {boolean} */
    this.muted = true;
    /** @type {number|null} */
    this.bgmInterval = null;
    /** @type {string|null} 現在再生中のBGMタイプ */
    this._currentBGM = null;
  }

  /**
   * AudioContextを初期化する（ユーザー操作後に呼ぶ必要がある）
   */
  init() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        if (import.meta.env.DEV) console.warn('[Audio] AudioContext初期化失敗:', e);
        return;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * ミュート状態をトグルする
   * @returns {boolean} 新しいミュート状態
   */
  toggle() {
    this.muted = !this.muted;
    if (!this.muted) {
      this.init();
      this.playSE('click');
    } else {
      this.stopBGM();
    }
    return this.muted;
  }

  /**
   * 触覚フィードバック（振動）を実行する
   * @param {number|number[]} pattern - 振動パターン(ms)
   */
  vibrate(pattern) {
    if (!this.muted && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // 振動API非対応端末は無視
      }
    }
  }

  /**
   * 効果音を再生する
   * @param {string} type - 効果音タイプ
   * @param {number} [volumeScale=1] - 音量スケール（0-1）
   */
  playSE(type, volumeScale = 1) {
    if (this.muted || !this.ctx) return;

    const t = this.ctx.currentTime;

    // 複数音の効果音
    const multi = SE_MULTI_DEFINITIONS[type];
    if (multi) {
      this._playMultiNoteSE(multi, t, volumeScale);
      return;
    }

    // 単音の効果音
    const def = SE_DEFINITIONS[type];
    if (!def) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = def.type;
      osc.frequency.setValueAtTime(def.freq, t);

      if (def.setup) def.setup(osc, t);
      if (def.envelope) {
        def.envelope(gain, t);
        // volumeScaleを適用
        if (volumeScale !== 1) {
          gain.gain.setValueAtTime(gain.gain.value * volumeScale, t);
        }
      }

      osc.start(t);
      osc.stop(t + def.duration);
      if (def.vibrate) this.vibrate(def.vibrate);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[Audio] SE再生失敗:', e);
    }
  }

  /**
   * 複数音を順次鳴らす効果音を再生する
   * @param {object} def - 複数音定義
   * @param {number} t - 開始時刻
   * @param {number} volumeScale - 音量スケール
   */
  _playMultiNoteSE(def, t, volumeScale) {
    try {
      if (def.singleOsc) {
        // 単一オシレータで周波数をステップ変化
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = def.type;
        def.notes.forEach((freq, i) => {
          osc.frequency.setValueAtTime(freq, t + i * def.interval);
        });
        gain.gain.setValueAtTime(def.gain * volumeScale, t);
        gain.gain.linearRampToValueAtTime(0.001, t + def.duration);
        osc.start(t);
        osc.stop(t + def.duration);
      } else {
        // 各音を個別オシレータで再生
        def.notes.forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = def.type;
          osc.frequency.value = freq;
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          const noteStart = t + i * def.interval;
          gain.gain.setValueAtTime(def.gain * volumeScale, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + def.duration);
          osc.start(noteStart);
          osc.stop(noteStart + def.duration);
        });
      }
      if (def.vibrate) this.vibrate(def.vibrate);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[Audio] Multi-SE再生失敗:', e);
    }
  }

  /**
   * BGMを再生する（同じタイプなら再開しない）
   * @param {string} type - BGMタイプ ('home'|'game'|'boss')
   */
  playBGM(type) {
    if (this.muted) return;
    // 同じBGMが再生中なら何もしない
    if (this._currentBGM === type && this.bgmInterval) return;

    this.stopBGM();
    this.init();

    const pattern = BGM_PATTERNS[type];
    if (!pattern) return;

    let step = 0;
    this._currentBGM = type;

    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = pattern.type;
        osc.frequency.value = pattern.notes[step % pattern.notes.length] / 2;
        gain.gain.setValueAtTime(pattern.gain, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
        step++;
      } catch {
        // ブラウザのバックグラウンド制限等で失敗する場合がある
      }
    }, pattern.interval);
  }

  /**
   * BGMを停止する
   */
  stopBGM() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this._currentBGM = null;
  }

  /**
   * リソースを解放する（アプリ終了時用）
   */
  dispose() {
    this.stopBGM();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}

export const audioCtrl = new AudioController();
