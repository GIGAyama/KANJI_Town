class AudioController {
  constructor() { this.ctx = null; this.muted = true; this.bgmInterval = null; }
  init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === 'suspended') this.ctx.resume(); }
  toggle() { this.muted = !this.muted; if (!this.muted) { this.init(); this.playSE('click'); } else { this.stopBGM(); } return this.muted; }
  vibrate(pattern) { if (!this.muted && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); }
  playSE(type) {
    if (this.muted || !this.ctx) return; const t = this.ctx.currentTime; const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    switch (type) {
      case 'click': osc.type = 'square'; osc.frequency.setValueAtTime(600, t); gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05); osc.start(t); osc.stop(t + 0.05); this.vibrate(10); break;
      case 'pop': osc.type = 'sine'; osc.frequency.setValueAtTime(800, t); osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1); gain.gain.setValueAtTime(0.05, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); osc.start(t); osc.stop(t + 0.1); break;
      case 'place': osc.type = 'triangle'; osc.frequency.setValueAtTime(300, t); osc.frequency.exponentialRampToValueAtTime(150, t + 0.1); gain.gain.setValueAtTime(0.1, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); osc.start(t); osc.stop(t + 0.1); this.vibrate(20); break;
      case 'stamp_good': osc.type = 'sine'; osc.frequency.setValueAtTime(880, t); osc.frequency.exponentialRampToValueAtTime(1760, t + 0.15); gain.gain.setValueAtTime(0.15, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4); osc.start(t); osc.stop(t + 0.4); this.vibrate([30, 50, 30]); break;
      case 'stamp_bad': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, t); osc.frequency.linearRampToValueAtTime(100, t + 0.3); gain.gain.setValueAtTime(0.15, t); gain.gain.linearRampToValueAtTime(0.01, t + 0.3); osc.start(t); osc.stop(t + 0.3); this.vibrate([100, 50, 100]); break;
      case 'stamp_perfect': osc.type = 'triangle'; [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = 'square'; o.frequency.value = f; o.connect(g); g.connect(this.ctx.destination); g.gain.setValueAtTime(0.05, t + i*0.08); g.gain.exponentialRampToValueAtTime(0.001, t + i*0.08 + 0.3); o.start(t + i*0.08); o.stop(t + i*0.08 + 0.3); }); this.vibrate([40, 40, 40, 40]); break;
      case 'chest_drop': osc.type = 'square'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.3); gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0.01, t + 0.3); osc.start(t); osc.stop(t + 0.3); this.vibrate(100); break;
      case 'chest_open': osc.type = 'triangle'; osc.frequency.setValueAtTime(440, t); osc.frequency.setValueAtTime(554.37, t + 0.1); osc.frequency.setValueAtTime(659.25, t + 0.2); osc.frequency.setValueAtTime(880, t + 0.3); gain.gain.setValueAtTime(0.2, t); gain.gain.linearRampToValueAtTime(0.001, t + 1.5); osc.start(t); osc.stop(t + 1.5); this.vibrate([50, 100, 200]); break;
      case 'coin': osc.type = 'sine'; osc.frequency.setValueAtTime(1200, t); osc.frequency.setValueAtTime(1600, t + 0.1); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0.01, t + 0.3); osc.start(t); osc.stop(t + 0.3); break;
      case 'gacha': osc.type = 'square'; osc.frequency.setValueAtTime(200, t); osc.frequency.linearRampToValueAtTime(800, t + 0.5); gain.gain.setValueAtTime(0.1, t); gain.gain.linearRampToValueAtTime(0.01, t + 0.5); osc.start(t); osc.stop(t + 0.5); break;
      case 'rare': osc.type = 'triangle'; [880, 1108.73, 1318.51, 1760].forEach((f, i) => { const o = this.ctx.createOscillator(); const g = this.ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.connect(g); g.connect(this.ctx.destination); g.gain.setValueAtTime(0.1, t + i*0.1); g.gain.exponentialRampToValueAtTime(0.001, t + i*0.1 + 0.5); o.start(t + i*0.1); o.stop(t + i*0.1 + 0.5); }); this.vibrate([100, 50, 100, 50, 200]); break;
      case 'boss_hit': osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, t); osc.frequency.exponentialRampToValueAtTime(50, t + 0.2); gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2); osc.start(t); osc.stop(t + 0.2); this.vibrate([50, 50]); break;
      case 'success': osc.type = 'sine'; osc.frequency.setValueAtTime(880, t); osc.frequency.exponentialRampToValueAtTime(1760, t + 0.2); gain.gain.setValueAtTime(0.2, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5); osc.start(t); osc.stop(t + 0.5); break;
      default: break;
    }
  }
  playBGM(type) {
    if (this.muted) return; this.stopBGM(); this.init(); let step = 0;
    const notes = type === 'game' ? [261.63, 329.63, 392.00, 523.25] : type === 'boss' ? [130.81, 146.83, 164.81, 196.00] : [220, 277.18, 329.63, 440];
    this.bgmInterval = setInterval(() => {
      if (this.muted || !this.ctx) return; const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); osc.connect(gain); gain.connect(this.ctx.destination);
      osc.type = type === 'boss' ? 'sawtooth' : 'square'; osc.frequency.value = notes[step % notes.length] / 2;
      gain.gain.setValueAtTime(type === 'boss' ? 0.03 : 0.015, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15); osc.start(t); osc.stop(t + 0.15); step++;
    }, type === 'boss' ? 200 : 250);
  }
  stopBGM() { if (this.bgmInterval) { clearInterval(this.bgmInterval); this.bgmInterval = null; } }
}

export const audioCtrl = new AudioController();
