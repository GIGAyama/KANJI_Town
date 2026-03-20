import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Eye, CheckCircle2, RefreshCw, PlayCircle, Award, Volume2, VolumeX, Pencil, Swords, Flame, Trophy, Star, TrendingUp, Search, Library, Coins, Store, PenTool, BarChart3, ChevronRight, AlertCircle, Sparkles, ShieldAlert, Sun, CloudRain, Eraser, Map, Medal, Gift, Zap, Ghost, Timer, FileText, Wifi, QrCode, Users, Plus, Download, Hash, ArrowLeft, Lock, Trash2, Edit3, Share2, X, RotateCcw, CheckSquare, Undo2 } from 'lucide-react';

const usePeerJS = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    if (window.Peer) { setIsLoaded(true); return; }
    const script = document.createElement('script'); script.src = "https://unpkg.com/peerjs@1.5.2/dist/peerjs.min.js";
    script.onload = () => setIsLoaded(true); document.body.appendChild(script);
  }, []);
  return isLoaded;
};

const R = ({ c, r }) => <ruby>{c}<rt>{r}</rt></ruby>;
const FormatKun = ({ text }) => {
  if (!text) return null; const match = text.match(/^(.*?)\((.*?)\)$/);
  if (match) return <>{match[1]}<span className="text-rose-500">{match[2]}</span></>;
  return <>{text}</>;
};

const Analyzer = {
  analyzeEnding: (points) => {
    if (!points || points.length < 3) return { type: 'とめ', code: 'tome' };
    const len = points.length; const pEnd = points[len - 1]; const pMid = points[Math.max(0, Math.floor(len * 0.85))]; const pBeforeMid = points[Math.max(0, Math.floor(len * 0.70))];
    const mainVec = { x: pMid.x - pBeforeMid.x, y: pMid.y - pBeforeMid.y }; const endVec = { x: pEnd.x - pMid.x, y: pEnd.y - pMid.y };
    let angleDiff = 0; const dotProduct = (mainVec.x * endVec.x + mainVec.y * endVec.y); const magMain = Math.sqrt(mainVec.x**2 + mainVec.y**2); const magEnd = Math.sqrt(endVec.x**2 + endVec.y**2);
    if (magMain > 0 && magEnd > 0.045) { const cosTheta = Math.max(-1, Math.min(1, dotProduct / (magMain * magEnd))); angleDiff = Math.acos(cosTheta) * (180 / Math.PI); }
    const calcEnd = Math.max(1, len - 1); const calcStart = Math.max(0, len - 8); let totalDist = 0; let totalTime = points[calcEnd].time - points[calcStart].time;
    for (let i = calcStart + 1; i <= calcEnd; i++) { const dx = points[i].x - points[i-1].x; const dy = points[i].y - points[i-1].y; totalDist += Math.sqrt(dx*dx + dy*dy); }
    const velocity = totalTime > 0 ? totalDist / totalTime : 0;
    if (angleDiff > 35 && magEnd > 0.045) return { type: 'はね', code: 'hane' };
    if (velocity > 0.0025) return { type: 'はらい', code: 'harai' }; return { type: 'とめ', code: 'tome' };
  },
  isIntersecting: (p1, p2, p3, p4) => {
    const ta = (p3.x - p4.x) * (p1.y - p3.y) + (p3.y - p4.y) * (p3.x - p1.x); const tb = (p3.x - p4.x) * (p2.y - p3.y) + (p3.y - p4.y) * (p3.x - p2.x);
    const tc = (p1.x - p2.x) * (p3.y - p1.y) + (p1.y - p2.y) * (p1.x - p3.x); const td = (p1.x - p2.x) * (p4.y - p1.y) + (p1.y - p2.y) * (p1.x - p4.x); return tc * td < 0 && ta * tb < 0;
  },
  checkCross: (stroke1, stroke2) => {
    if (!stroke1 || !stroke2 || stroke1.length < 2 || stroke2.length < 2) return false;
    for (let i = 0; i < stroke1.length - 1; i++) for (let j = 0; j < stroke2.length - 1; j++) if (Analyzer.isIntersecting(stroke1[i], stroke1[i+1], stroke2[j], stroke2[j+1])) return true;
    return false;
  }
};

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
const audioCtrl = new AudioController();

// ── 地形タイル ──
const SvgBedrock  = () => <svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100" height="100" fill="#1e293b"/><rect x="4" y="4" width="42" height="42" rx="4" fill="#334155"/><rect x="54" y="4" width="42" height="42" rx="4" fill="#334155"/><rect x="4" y="54" width="42" height="42" rx="4" fill="#334155"/><rect x="54" y="54" width="42" height="42" rx="4" fill="#334155"/></svg>;
const SvgRoughland = () => <svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100" height="100" fill="#92400e"/><ellipse cx="22" cy="72" rx="16" ry="10" fill="#78350f"/><ellipse cx="68" cy="42" rx="20" ry="12" fill="#78350f"/><ellipse cx="48" cy="82" rx="13" ry="8" fill="#6d3a00"/><path d="M5 60 Q20 45 35 55 Q50 65 65 50 Q80 35 95 45" fill="none" stroke="#57290a" strokeWidth="3" opacity="0.5"/></svg>;
const SvgCleared   = () => <svg viewBox="0 0 100 100" className="w-full h-full"><rect width="100" height="100" fill="#d4a96a"/><line x1="0" y1="0" x2="100" y2="100" stroke="#c49a5a" strokeWidth="1.5" opacity="0.35"/><line x1="100" y1="0" x2="0" y2="100" stroke="#c49a5a" strokeWidth="1.5" opacity="0.35"/><line x1="50" y1="0" x2="50" y2="100" stroke="#c49a5a" strokeWidth="1" opacity="0.2"/><line x1="0" y1="50" x2="100" y2="50" stroke="#c49a5a" strokeWidth="1" opacity="0.2"/></svg>;
// 住民 SVG
const SvgVillager  = () => <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]"><circle cx="50" cy="26" r="18" fill="#fbbf24"/><rect x="32" y="44" width="36" height="32" rx="6" fill="#3b82f6"/><rect x="28" y="46" width="13" height="22" rx="4" fill="#2563eb"/><rect x="59" y="46" width="13" height="22" rx="4" fill="#2563eb"/><rect x="35" y="76" width="12" height="15" rx="3" fill="#1d4ed8"/><rect x="53" y="76" width="12" height="15" rx="3" fill="#1d4ed8"/><circle cx="44" cy="24" r="3" fill="#292f36"/><circle cx="56" cy="24" r="3" fill="#292f36"/><path d="M43 34 Q50 40 57 34" fill="none" stroke="#292f36" strokeWidth="2" strokeLinecap="round"/></svg>;

// ストーリーステージ（習得漢字数と人口で進行）
const STORY_STAGES = [
  { id: 0, minKanji: 0,  minPop: 0,  radius: 2,  title: '荒野の旅人',   emoji: '🏕️',  desc: 'ここは何もない荒野。だが、あなたの挑戦が今はじまる。' },
  { id: 1, minKanji: 2,  minPop: 2,  radius: 4,  title: '開拓者',        emoji: '⛺',  desc: '最初の仲間が集まった。小さな集落が生まれようとしている。' },
  { id: 2, minKanji: 5,  minPop: 5,  radius: 6,  title: '村の創設者',    emoji: '🏘️',  desc: '村人たちの笑い声が聞こえる。あなたは村長と呼ばれるようになった。' },
  { id: 3, minKanji: 9,  minPop: 9,  radius: 8,  title: '町の領主',      emoji: '🏙️',  desc: '商人や職人が集まり、町に活気があふれてきた。' },
  { id: 4, minKanji: 13, minPop: 13, radius: 10, title: '城下町の君主',  emoji: '🏯',  desc: 'あなたの名声は遠く広まった。城を建て、都を守れ。' },
  { id: 5, minKanji: 16, minPop: 16, radius: 11, title: '黄金の都の王',  emoji: '👑',  desc: 'すべての漢字を習得した。この街は永遠に語り継がれるだろう。' },
];

// 漢字習得で解放されるアイテム（既存の unlocks を補完）
const KANJI_UNLOCK_EXTRA = {
  k1_1: 't_road',    // 一
  k1_2: 't_grass',   // 右
  k1_3: 't_water',   // 雨
  k1_4: 't_grass',   // 円
  k1_5: 't_castle',  // 王
  k2_1: 't_flower',  // 黄
  k2_2: 't_water',   // 海
  k2_3: 't_rock',    // 岩
  k3_1: 't_torii',   // 祭
  k3_2: 't_temple',  // 神
  k4_1: 't_house1',  // 建
  k4_2: 't_pine',    // 松
  k5_1: 't_sakura',  // 桜
  k5_2: 't_bridge',  // 橋
  k6_1: 't_gold_castle', // 宝
  k6_2: 't_castle',  // 城
};

const SvgWeed = () => <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] drop-shadow-sm"><path d="M50 90 Q40 60 20 50 Q45 70 50 90 M50 90 Q60 50 80 40 Q55 60 50 90 M50 90 Q50 60 50 30 Q45 60 50 90" fill="none" stroke="#65a30d" strokeWidth="6" strokeLinecap="round" /></svg>;
const SvgGrass = () => <svg viewBox="0 0 100 100" className="w-[60%] h-[60%] opacity-50"><circle cx="30" cy="50" r="10" fill="#86efac"/><circle cx="70" cy="60" r="8" fill="#86efac"/><circle cx="50" cy="30" r="12" fill="#86efac"/></svg>;
const SvgFlower = () => <svg viewBox="0 0 100 100" className="w-[70%] h-[70%] drop-shadow-sm"><circle cx="50" cy="50" r="15" fill="#fde047"/><circle cx="50" cy="20" r="15" fill="#f472b6"/><circle cx="50" cy="80" r="15" fill="#f472b6"/><circle cx="20" cy="50" r="15" fill="#f472b6"/><circle cx="80" cy="50" r="15" fill="#f472b6"/></svg>;
const SvgTree = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="40" y="50" width="20" height="45" fill="#78350f" rx="4" /><circle cx="50" cy="40" r="35" fill="#16a34a" /><circle cx="35" cy="30" r="25" fill="#15803d" /><circle cx="65" cy="35" r="25" fill="#15803d" /></svg>;
const SvgSakura = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="40" y="50" width="20" height="45" fill="#713f12" rx="4" /><circle cx="50" cy="40" r="35" fill="#fbcfe8" /><circle cx="35" cy="30" r="25" fill="#f472b6" /><circle cx="65" cy="35" r="25" fill="#f472b6" /></svg>;
const SvgPine = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="45" y="60" width="10" height="35" fill="#451a03" rx="2" /><path d="M50 10 L10 50 L90 50 Z" fill="#065f46" /><path d="M50 30 L15 70 L85 70 Z" fill="#047857" /></svg>;
const SvgRock = () => <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] drop-shadow-sm"><path d="M20 80 Q10 40 40 30 Q70 20 85 50 Q95 80 50 90 Z" fill="#94a3b8" /><path d="M30 70 Q20 40 45 35 Q65 30 75 55 Q85 75 50 80 Z" fill="#cbd5e1" /></svg>;
const SvgRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full"><rect x="0" y="0" width="100" height="100" fill="#e2e8f0" /><rect x="45" y="10" width="10" height="20" fill="#f8fafc" /><rect x="45" y="40" width="10" height="20" fill="#f8fafc" /><rect x="45" y="70" width="10" height="20" fill="#f8fafc" /></svg>;
const SvgWater = () => <svg viewBox="0 0 100 100" className="w-full h-full"><rect x="0" y="0" width="100" height="100" fill="#38bdf8" /><path d="M10 30 Q25 15 40 30 T70 30" fill="none" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" /><path d="M30 70 Q45 55 60 70 T90 70" fill="none" stroke="#7dd3fc" strokeWidth="4" strokeLinecap="round" /></svg>;
const SvgWall = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><rect x="0" y="20" width="100" height="60" fill="#94a3b8" /><rect x="0" y="20" width="100" height="10" fill="#64748b" /><line x1="33" y1="20" x2="33" y2="80" stroke="#64748b" strokeWidth="4"/><line x1="66" y1="20" x2="66" y2="80" stroke="#64748b" strokeWidth="4"/></svg>;
const SvgBridge = () => <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] drop-shadow-md"><path d="M 0 50 Q 50 20 100 50" fill="none" stroke="#b45309" strokeWidth="16" /><path d="M 0 70 Q 50 40 100 70" fill="none" stroke="#78350f" strokeWidth="12" /><line x1="20" y1="45" x2="20" y2="65" stroke="#78350f" strokeWidth="6"/><line x1="50" y1="35" x2="50" y2="55" stroke="#78350f" strokeWidth="6"/><line x1="80" y1="45" x2="80" y2="65" stroke="#78350f" strokeWidth="6"/></svg>;
const SvgHouse1 = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="20" y="45" width="60" height="45" fill="#fef3c7" rx="2" /><polygon points="10,45 50,15 90,45" fill="#ef4444" stroke="#dc2626" strokeWidth="4" strokeLinejoin="round" /><rect x="40" y="60" width="20" height="30" fill="#8b5cf6" rx="2" /><rect x="25" y="55" width="10" height="10" fill="#bae6fd" /><rect x="65" y="55" width="10" height="10" fill="#bae6fd" /></svg>;
const SvgShop = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="10" y="30" width="80" height="60" fill="#ffffff" rx="2" /><rect x="10" y="30" width="80" height="15" fill="#3b82f6" /><rect x="10" y="45" width="80" height="5" fill="#10b981" /><rect x="20" y="60" width="60" height="30" fill="#bae6fd" /><rect x="40" y="60" width="20" height="30" fill="#dbeafe" /></svg>;
const SvgSchool = () => <svg viewBox="0 0 100 100" className="w-[95%] h-[95%] drop-shadow-md"><rect x="10" y="40" width="80" height="50" fill="#fde047" rx="2" /><rect x="40" y="20" width="20" height="20" fill="#fde047" /><polygon points="35,20 50,5 65,20" fill="#ea580c" /><rect x="45" y="70" width="10" height="20" fill="#78350f" /><circle cx="50" cy="30" r="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" /></svg>;
const SvgCastle = () => <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] drop-shadow-lg"><rect x="20" y="70" width="60" height="20" fill="#e2e8f0" /><polygon points="10,70 50,40 90,70" fill="#334155" /><rect x="30" y="40" width="40" height="30" fill="#f8fafc" /><polygon points="20,40 50,15 80,40" fill="#334155" /><rect x="40" y="15" width="20" height="25" fill="#f8fafc" /><polygon points="30,15 50,0 70,15" fill="#334155" /><rect x="45" y="50" width="10" height="20" fill="#fbbf24" /></svg>;
const SvgGoldCastle = () => <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]"><rect x="20" y="70" width="60" height="20" fill="#fef08a" /><polygon points="10,70 50,40 90,70" fill="#ca8a04" /><rect x="30" y="40" width="40" height="30" fill="#fef9c3" /><polygon points="20,40 50,15 80,40" fill="#ca8a04" /><rect x="40" y="15" width="20" height="25" fill="#fef9c3" /><polygon points="30,15 50,0 70,15" fill="#ca8a04" /><rect x="45" y="50" width="10" height="20" fill="#eab308" /></svg>;
const SvgTorii = () => <svg viewBox="0 0 100 100" className="w-[95%] h-[95%] drop-shadow-md"><rect x="20" y="20" width="10" height="70" fill="#dc2626" /><rect x="70" y="20" width="10" height="70" fill="#dc2626" /><rect x="10" y="25" width="80" height="10" fill="#dc2626" rx="2" /><rect x="10" y="15" width="80" height="8" fill="#b91c1c" rx="2" /><rect x="45" y="35" width="10" height="15" fill="#dc2626" /><rect x="15" y="40" width="70" height="6" fill="#dc2626" /></svg>;
const SvgTemple = () => <svg viewBox="0 0 100 100" className="w-[90%] h-[90%] drop-shadow-md"><rect x="25" y="60" width="50" height="30" fill="#f8fafc" /><polygon points="15,60 50,30 85,60" fill="#334155" /><rect x="35" y="30" width="30" height="20" fill="#e2e8f0" /><polygon points="25,30 50,10 75,30" fill="#334155" /><rect x="45" y="70" width="10" height="20" fill="#78350f" /></svg>;
const SvgDragon = () => <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"><path d="M20 80 Q10 50 50 20 T90 50 Q80 80 50 80" fill="none" stroke="#10b981" strokeWidth="8" strokeLinecap="round" /><circle cx="30" cy="40" r="5" fill="#ef4444" /><circle cx="70" cy="40" r="5" fill="#ef4444" /></svg>;
const SvgGhostBoss = () => <svg viewBox="0 0 100 100" className="w-[100%] h-[100%] drop-shadow-[0_0_15px_rgba(225,29,72,0.8)]"><path d="M20 90 Q10 50 50 10 T80 90 Q70 80 50 90 Q30 80 20 90" fill="#0f172a" /><circle cx="35" cy="45" r="8" fill="#e11d48" /><circle cx="65" cy="45" r="8" fill="#e11d48" /><path d="M40 70 Q50 60 60 70" fill="none" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" /></svg>;

const TOWN_ITEMS = [
  // 地形（内部管理用・パレット非表示）
  { id: 't_bedrock',   svg: SvgBedrock,   name: '岩盤',   price: 0,     pros: 0,    type: 'terrain', bg: 'bg-[#1e293b]' },
  { id: 't_roughland', svg: SvgRoughland, name: '荒れ地', price: 0,     pros: -2,   type: 'terrain', bg: 'bg-[#92400e]' },
  { id: 't_cleared',   svg: SvgCleared,   name: '更地',   price: 0,     pros: 0,    type: 'terrain', bg: 'bg-[#d4a96a]' },
  { id: 't_weed',      svg: SvgWeed,      name: 'ざっそう', price: 0,   pros: -5,   type: 'terrain', bg: 'bg-[#a3e635]' },
  // 自然・建物・特別（既存）
  { id: 't_grass',      svg: SvgGrass,      name: 'くさ',       price: 10,    pros: 1,    type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_flower',     svg: SvgFlower,     name: '花壇',       price: 30,    pros: 5,    type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_tree',       svg: SvgTree,       name: '木',         price: 50,    pros: 10,   type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_sakura',     svg: SvgSakura,     name: '桜の木',     price: 150,   pros: 25,   type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_pine',       svg: SvgPine,       name: '松',         price: 100,   pros: 20,   type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_rock',       svg: SvgRock,       name: '岩',         price: 20,    pros: 2,    type: 'nature',   bg: 'bg-[#86efac]' },
  { id: 't_water',      svg: SvgWater,      name: '水路',       price: 40,    pros: 4,    type: 'nature',   bg: 'bg-[#7dd3fc]' },
  { id: 't_road',       svg: SvgRoad,       name: '道',         price: 15,    pros: 3,    type: 'building', bg: 'bg-[#e2e8f0]' },
  { id: 't_bridge',     svg: SvgBridge,     name: '橋',         price: 100,   pros: 15,   type: 'building', bg: 'bg-[#7dd3fc]' },
  { id: 't_wall',       svg: SvgWall,       name: '城壁',       price: 80,    pros: 12,   type: 'building', bg: 'bg-[#e2e8f0]' },
  { id: 't_house1',     svg: SvgHouse1,     name: '小さな家',   price: 150,   pros: 50,   type: 'building', bg: 'bg-[#86efac]' },
  { id: 't_shop',       svg: SvgShop,       name: 'お店',       price: 400,   pros: 150,  type: 'building', bg: 'bg-[#e2e8f0]' },
  { id: 't_school',     svg: SvgSchool,     name: '学校',       price: 800,   pros: 300,  type: 'building', bg: 'bg-[#e2e8f0]' },
  { id: 't_kakejiku',   svg: () => <div/>,  name: 'マイ掛け軸', price: 500,   pros: 100,  type: 'special',  bg: 'bg-[#f5e6d3]' },
  { id: 't_torii',      svg: SvgTorii,      name: '鳥居',       price: 1500,  pros: 800,  type: 'special',  bg: 'bg-[#86efac]' },
  { id: 't_temple',     svg: SvgTemple,     name: 'お寺',       price: 2000,  pros: 1200, type: 'special',  bg: 'bg-[#e2e8f0]' },
  { id: 't_castle',     svg: SvgCastle,     name: 'お城',       price: 3000,  pros: 2000, type: 'special',  bg: 'bg-[#86efac]' },
  { id: 't_gold_castle',svg: SvgGoldCastle, name: '黄金の城',   price: 10000, pros: 8000, type: 'special',  bg: 'bg-[#fef08a]' },
  { id: 't_dragon',     svg: SvgDragon,     name: '守り神',     price: 5000,  pros: 3000, type: 'special',  bg: 'bg-[#bbf7d0]' },
];

const KANJI_DATA = [
  { id: "k1_1", grade: 1, char: "一", on: ["イチ", "イツ"], kun: ["ひと", "ひと(つ)"], examples: ["一輪車（いちりんしゃ）に 一（ひと）つ 乗る。", "一（いち）から やり直す。"], unlocks: "t_road" },
  { id: "k1_2", grade: 1, char: "右", on: ["ウ", "ユウ"], kun: ["みぎ"], examples: ["右（みぎ）を見て 左を 確認する。", "右折（うせつ）する。"] },
  { id: "k1_3", grade: 1, char: "雨", on: ["ウ"], kun: ["あめ", "あま"], examples: ["冷たい 雨（あめ）が 降る。", "雨具（あまぐ）を 準備する。"], unlocks: "t_water" },
  { id: "k1_4", grade: 1, char: "円", on: ["エン"], kun: ["まる(い)"], examples: ["百円（ひゃくえん）玉は 円（まる）い 形だ。"] },
  { id: "k1_5", grade: 1, char: "王", on: ["オウ"], kun: [], examples: ["ライオンは 百獣の 王（おう）だ。"], unlocks: "t_castle" },
  { id: "k2_1", grade: 2, char: "黄", on: ["コウ", "オウ"], kun: ["き", "こ"], examples: ["黄（き）色い 花が 咲く。", "黄金（おうごん）の 宝。"], unlocks: "t_flower" },
  { id: "k2_2", grade: 2, char: "海", on: ["カイ"], kun: ["うみ"], examples: ["広い 海（うみ）を 泳ぐ。", "海外（かいがい）に 行く。"], unlocks: "t_water" },
  { id: "k2_3", grade: 2, char: "岩", on: ["ガン"], kun: ["いわ"], examples: ["大きな 岩（いわ）が ある。", "岩石（がんせき）を 調べる。"], unlocks: "t_rock" },
  { id: "k3_1", grade: 3, char: "祭", on: ["サイ"], kun: ["まつ(る)", "まつ(り)"], examples: ["夏祭（なつまつ）りに 行く。", "文化祭（ぶんかさい）の 準備。"], unlocks: "t_torii" },
  { id: "k3_2", grade: 3, char: "神", on: ["シン", "ジン"], kun: ["かみ", "かん", "こう"], examples: ["神様（かみさま）の いる お寺。", "神社（じんじゃ）に お参りする。"], unlocks: "t_temple" },
  { id: "k4_1", grade: 4, char: "建", on: ["ケン", "コン"], kun: ["た(てる)", "た(つ)"], examples: ["家を 建（た）てる。", "建物（たてもの）が 完成した。"], unlocks: "t_house1" },
  { id: "k4_2", grade: 4, char: "松", on: ["ショウ"], kun: ["まつ"], examples: ["松（まつ）の木が ある。", "門松（かどまつ）を 飾る。"], unlocks: "t_pine" },
  { id: "k5_1", grade: 5, char: "桜", on: ["オウ"], kun: ["さくら"], examples: ["桜（さくら）の木が 満開だ。", "桜前線（さくらぜんせん）が 北上する。"], unlocks: "t_sakura" },
  { id: "k5_2", grade: 5, char: "橋", on: ["キョウ"], kun: ["はし"], examples: ["川に 橋（はし）を 架ける。", "歩道橋（ほどうきょう）を 渡る。"], unlocks: "t_bridge" },
  { id: "k6_1", grade: 6, char: "宝", on: ["ホウ"], kun: ["たから"], examples: ["黄金の 宝（たから）を 探す。", "宝物（たからもの）を 大切にする。"], unlocks: "t_gold_castle" },
  { id: "k6_2", grade: 6, char: "城", on: ["ジョウ"], kun: ["しろ"], examples: ["お城（しろ）の 跡地。", "城下町（じょうかまち）を 歩く。"], unlocks: "t_castle" },
];

const ACHIEVEMENTS = [
  { id: 'login_3', type: 'streak', target: 3, name: '三日坊主からの卒業', desc: '3日連続で修行する', reward: 500, rewardItem: null },
  { id: 'login_7', type: 'streak', target: 7, name: '修行の鬼', desc: '7日連続で修行する', reward: 1500, rewardItem: null },
  { id: 'perfect_50', type: 'perfect', target: 50, name: '美文字の才能', desc: 'なぞり書きでPerfectを50回だす', reward: 1000, rewardItem: 't_sakura' },
  { id: 'master_10', type: 'master', target: 10, name: 'はじめてのマスター', desc: '漢字を10文字マスターする', reward: 1000, rewardItem: 't_kakejiku' },
  { id: 'master_50', type: 'master', target: 50, name: '漢字の達人', desc: '漢字を50文字マスターする', reward: 3000, rewardItem: 't_dragon' },
];

const GACHA_POOL = [
  { weight: 500, items: ['t_grass', 't_flower', 't_rock', 't_road'] },
  { weight: 300, items: ['t_tree', 't_pine', 't_house1', 't_water', 't_wall'] },
  { weight: 150, items: ['t_sakura', 't_shop', 't_bridge'] },
  { weight: 40, items: ['t_school', 't_torii', 't_temple'] },
  { weight: 10, items: ['t_castle', 't_gold_castle', 't_dragon'] }
];

// ==========================================
// ストレージAPI（商用グレード）
// デバウンス保存・データ検証・マイグレーション
// ==========================================
let _saveDebounceTimer = null;
const StorageAPI = {
  safeGet: (key, fallback) => { try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
  safeSet: (key, val) => { try { window.localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } },
  // デバウンス保存：400ms以内の連続保存をまとめる（パフォーマンス改善）
  saveStats: (stats) => {
    if (_saveDebounceTimer) clearTimeout(_saveDebounceTimer);
    _saveDebounceTimer = setTimeout(() => { StorageAPI.safeSet('kanji_town_v7', stats); }, 400);
  },
  saveStatsImmediate: (stats) => {
    if (_saveDebounceTimer) { clearTimeout(_saveDebounceTimer); _saveDebounceTimer = null; }
    StorageAPI.safeSet('kanji_town_v7', stats);
  },
  // 初期マップ生成: 中央2×2=更地、その外=荒れ地、端=岩盤
  buildInitialMap: () => {
    const C = 10; const map = {};
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
      map[`${x},${y}`] = dist <= 1 ? 't_cleared' : dist <= 4 ? 't_roughland' : 't_bedrock';
    }
    map['10,10'] = 't_house1'; // 最初の家
    return map;
  },
  getStats: () => {
    let stats = StorageAPI.safeGet('kanji_town_v7', null)
              || StorageAPI.safeGet('kanji_mega_builder_final_v6', null)
              || StorageAPI.safeGet('kanji_mega_builder_final_v5', null);
    if (!stats || !stats.targetGrade) {
      stats = {
        totalExp: 0, streak: 0, lastDate: '', coins: 500, targetGrade: 1,
        townMap: StorageAPI.buildInitialMap(),
        townItems: { 't_grass': 5, 't_road': 5, 't_tree': 3 },
        daily: {}, kanjiStats: {}, unlockedKanji: [],
        kakejiku: null, achievements: {}, perfectCountTotal: 0, myDrills: [],
        // 新フィールド
        population: 0,
        villagers: [],        // [{id, x, y, kanjiChar, born}]
        exploredRadius: 2,    // 現在の探索半径
        schemaVersion: 7,
      };
    }
    // フィールド補完
    if (!stats.myDrills) stats.myDrills = [];
    if (!stats.townMap) stats.townMap = StorageAPI.buildInitialMap();
    if (!stats.townItems) stats.townItems = {};
    if (!stats.kanjiStats) stats.kanjiStats = {};
    if (!stats.unlockedKanji) stats.unlockedKanji = [];
    if (!stats.achievements) stats.achievements = {};
    if (stats.coins === undefined) stats.coins = 0;
    if (!stats.population) stats.population = 0;
    if (!stats.villagers) stats.villagers = [];
    if (!stats.exploredRadius) stats.exploredRadius = 2;

    // 旧データ移行：地形なしのマップに地形タイルを注入
    if (!Object.values(stats.townMap).some(v => v === 't_bedrock' || v === 't_roughland' || v === 't_cleared')) {
      const freshMap = StorageAPI.buildInitialMap();
      // 旧配置アイテムを更地の上に重ねる
      Object.entries(stats.townMap).forEach(([key, val]) => {
        const item = TOWN_ITEMS.find(i => i.id === val);
        if (item && item.type !== 'terrain') freshMap[key] = val;
      });
      stats.townMap = freshMap;
      stats.exploredRadius = 6; // 旧データは広めに開放
    }

    // データ整合性チェック
    const validIds = new Set(TOWN_ITEMS.map(i => i.id));
    Object.keys(stats.townMap).forEach(k => { if (!validIds.has(stats.townMap[k])) delete stats.townMap[k]; });
    Object.keys(stats.kanjiStats).forEach(id => { stats.kanjiStats[id] = migrateCard(stats.kanjiStats[id]); });
    const validKanjiIds = new Set(KANJI_DATA.map(k => k.id));
    Object.keys(stats.kanjiStats).forEach(id => { if (!validKanjiIds.has(id)) delete stats.kanjiStats[id]; });
    stats.coins = Math.max(0, stats.coins);

    // ── サボり検出：廃れる仕組み ──
    const todayStr = new Date().toLocaleDateString();
    if (stats.lastDate && stats.lastDate !== todayStr) {
      const last = new Date(stats.lastDate);
      if (!isNaN(last.getTime())) {
        const diffDays = Math.floor((new Date() - last) / 86400000);
        if (diffDays >= 1) {
          // 1日サボる → 更地に雑草が生える
          const clearedKeys = Object.keys(stats.townMap).filter(k => stats.townMap[k] === 't_cleared');
          const weedCount = Math.min(diffDays * 2, Math.floor(clearedKeys.length * 0.3));
          const shuffled = clearedKeys.sort(() => Math.random() - 0.5);
          for (let i = 0; i < weedCount; i++) stats.townMap[shuffled[i]] = 't_weed';
        }
        if (diffDays >= 3 && stats.population > 0) {
          // 3日サボる → 住民が去る（最大20%）
          const leave = Math.max(1, Math.floor(stats.population * 0.2));
          stats.population = Math.max(0, stats.population - leave);
          stats.villagers = stats.villagers.slice(leave);
        }
        if (diffDays >= 7 && stats.population > 0) {
          // 7日サボる → 建物が荒れ地に戻る（最大2つ）
          const buildingKeys = Object.keys(stats.townMap).filter(k => {
            const item = TOWN_ITEMS.find(i => i.id === stats.townMap[k]);
            return item && (item.type === 'building' || item.type === 'special');
          });
          for (let i = 0; i < Math.min(2, buildingKeys.length); i++) {
            const k = buildingKeys[Math.floor(Math.random() * buildingKeys.length)];
            if (k) { stats.townItems[stats.townMap[k]] = (stats.townItems[stats.townMap[k]] || 0) + 1; stats.townMap[k] = 't_roughland'; }
          }
        }
      }
    }
    return stats;
  },
  updateDaily: (stats, exp, sessionData) => {
    const today = new Date().toLocaleDateString();
    if (!stats.daily) stats.daily = {};
    if (!stats.daily[today]) stats.daily[today] = { exp: 0, reviewed: 0, perfects: 0 };
    stats.daily[today].exp += exp;
    stats.daily[today].reviewed = (stats.daily[today].reviewed || 0) + (sessionData.reviewedCount || 0);
    stats.daily[today].perfects = (stats.daily[today].perfects || 0) + (sessionData.perfectCount || 0);
    stats.totalExp += exp; stats.perfectCountTotal = (stats.perfectCountTotal || 0) + (sessionData.perfectCount || 0);
    // 学習による雑草除去（雑草→更地に戻す）
    if (exp > 0) {
      const weedKeys = Object.keys(stats.townMap || {}).filter(k => stats.townMap[k] === 't_weed');
      for (let i = 0; i < Math.min(5, weedKeys.length); i++) stats.townMap[weedKeys[i]] = 't_cleared';
    }
    // ストリーク更新
    if (stats.lastDate !== today) {
      if (stats.lastDate) { const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1); stats.streak = stats.lastDate === yesterday.toLocaleDateString() ? stats.streak + 1 : 1; }
      else stats.streak = 1;
      stats.lastDate = today;
    }
    // アイテム付与
    (sessionData.unlockedItems || []).forEach(i => stats.townItems[i] = (stats.townItems[i] || 0) + 1);
    if (sessionData.rareDrop) stats.townItems[sessionData.rareDrop] = (stats.townItems[sessionData.rareDrop] || 0) + 1;
    if (sessionData.bestKakejiku) stats.kakejiku = sessionData.bestKakejiku;
    // 実績更新
    const masteredCount = Object.values(stats.kanjiStats).filter(s => s.status === 'mastered').length;
    ACHIEVEMENTS.forEach(a => {
      if (!stats.achievements[a.id]) stats.achievements[a.id] = { claimed: false, current: 0 };
      if (a.type === 'streak') stats.achievements[a.id].current = stats.streak;
      if (a.type === 'perfect') stats.achievements[a.id].current = stats.perfectCountTotal;
      if (a.type === 'master') stats.achievements[a.id].current = masteredCount;
    });
    return stats;
  }
};

// ==========================================
// SM-2+ 間隔反復アルゴリズム（商用グレード）
// 正確な記憶定着に必要な ease factor・学習ステップを実装
// ==========================================
const LEARNING_STEPS = [1 * 60 * 1000, 10 * 60 * 1000]; // 1分, 10分
const GRADUATING_INTERVAL = 24 * 60 * 60 * 1000; // 1日
const EASY_INTERVAL = 4 * 24 * 60 * 60 * 1000;   // 4日
const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;
const EASE_BONUS = 0.15; // easy で ease factor 上昇
const EASE_HARD_PENALTY = 0.15;
const EASE_AGAIN_PENALTY = 0.2;
const INTERVAL_MODIFIER = 1.0;

const calculateNextReview = (card, evaluation) => {
  const now = Date.now();
  const ease = card.ease || DEFAULT_EASE;
  const stepIdx = card.stepIdx ?? 0;

  // ── 新規カード（learningフェーズ）──
  if (!card.graduated) {
    if (evaluation === 'again') {
      return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: now + LEARNING_STEPS[0], ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY) };
    }
    if (evaluation === 'hard') {
      // ステップを留まる（平均ステップ間隔）
      const delay = stepIdx < LEARNING_STEPS.length ? LEARNING_STEPS[stepIdx] * 1.5 : LEARNING_STEPS[LEARNING_STEPS.length - 1];
      return { graduated: false, stepIdx, interval: delay, nextReview: now + delay, ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY) };
    }
    if (evaluation === 'good') {
      const nextStep = stepIdx + 1;
      if (nextStep >= LEARNING_STEPS.length) {
        // 卒業 → reviewフェーズへ
        return { graduated: true, stepIdx: 0, interval: GRADUATING_INTERVAL, nextReview: now + GRADUATING_INTERVAL, ease };
      }
      return { graduated: false, stepIdx: nextStep, interval: LEARNING_STEPS[nextStep], nextReview: now + LEARNING_STEPS[nextStep], ease };
    }
    if (evaluation === 'easy') {
      return { graduated: true, stepIdx: 0, interval: EASY_INTERVAL, nextReview: now + EASY_INTERVAL, ease: ease + EASE_BONUS };
    }
  }

  // ── レビューフェーズ ──
  const currentInterval = card.interval || GRADUATING_INTERVAL;
  if (evaluation === 'again') {
    // ラプス：学習ステップに戻す
    return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: now + LEARNING_STEPS[0], ease: Math.max(MIN_EASE, ease - EASE_AGAIN_PENALTY), lapses: (card.lapses || 0) + 1 };
  }
  if (evaluation === 'hard') {
    const newInterval = Math.round(currentInterval * 1.2 * INTERVAL_MODIFIER);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease: Math.max(MIN_EASE, ease - EASE_HARD_PENALTY) };
  }
  if (evaluation === 'good') {
    const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease };
  }
  if (evaluation === 'easy') {
    const newInterval = Math.round(currentInterval * ease * INTERVAL_MODIFIER * 1.3);
    return { graduated: true, stepIdx: 0, interval: newInterval, nextReview: now + newInterval, ease: ease + EASE_BONUS };
  }
  return { graduated: true, stepIdx: 0, interval: currentInterval, nextReview: now + currentInterval, ease };
};

// 後方互換: 旧 {interval, nextReview} 形式のカードを新形式に移行
const migrateCard = (card) => {
  if (!card) return { graduated: false, stepIdx: 0, interval: LEARNING_STEPS[0], nextReview: 0, ease: DEFAULT_EASE, status: 'new', mistakes: 0, lapses: 0 };
  if (card.ease !== undefined) return card; // すでに新形式
  return {
    ...card,
    ease: DEFAULT_EASE,
    graduated: (card.interval || 0) >= GRADUATING_INTERVAL,
    stepIdx: 0,
    lapses: 0,
  };
};

// FIX: townMap defaults to {} to prevent Object.values(undefined) crash
// terrain タイルは繁栄度計算から除外
const calculateProsperity = (townMap, reviewCount) => {
  let p = 0;
  Object.values(townMap || {}).forEach(itemId => {
    const item = TOWN_ITEMS.find(i => i.id === itemId);
    if (item && item.pros && item.type !== 'terrain') p += item.pros;
    else if (item && item.type === 'terrain' && item.pros < 0) p += item.pros; // 荒れ地・雑草はマイナス
  });
  return Math.max(0, p - (reviewCount * 50));
};

const getTownRank = (prosperity) => {
  const rank = [{ min: 5000, text: "黄金の都", badge: "🏯✨" }, { min: 2000, text: "大都市", badge: "🏙️" }, { min: 1000, text: "城下町", badge: "🏯" }, { min: 500, text: "にぎやかな町", badge: "🏘️" }, { min: 100, text: "開拓村", badge: "🛖" }, { min: 0, text: "あき地", badge: "🌱" }].find(r => prosperity >= r.min);
  return rank || { text: "あき地", badge: "🌱" };
};

// FIX: getLevelInfo no longer calls StorageAPI inside (removed circular dependency)
const getLevelInfo = (exp, townMap) => {
  const level = Math.floor(Math.cbrt(exp / 200)) + 1;
  const currentLevelExp = 200 * Math.pow(level - 1, 3);
  const nextLevelExp = 200 * Math.pow(level, 3);
  const progress = ((exp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;
  let themeName = 'default';
  if (level >= 80) themeName = 'gold';
  else if (level >= 50) themeName = 'sunset';
  else if (level >= 30) themeName = 'ocean';
  else if (level >= 15) themeName = 'sakura';
  const prosperity = calculateProsperity(townMap || {}, 0);
  const rank = getTownRank(prosperity);
  return { level, title: rank.text, badge: rank.badge, progress, nextLevelExp, themeName };
};

const MotionButton = ({ children, onClick, className, disabled, variant = "default", ...props }) => {
  let variantClasses = "";
  if (variant === "primary") variantClasses = "bg-[var(--primary)] text-[var(--panel)] hover:bg-rose-600 shadow-[0_4px_0_#9f1239]";
  else if (variant === "secondary") variantClasses = "bg-[var(--panel)] text-[var(--text)] hover:bg-[var(--bg)] shadow-[0_4px_0_var(--text)]";
  else if (variant === "success") variantClasses = "bg-[var(--secondary)] text-[var(--panel)] hover:bg-emerald-600 shadow-[0_4px_0_#065f46]";
  else if (variant === "danger") variantClasses = "bg-slate-500 text-white hover:bg-slate-600 shadow-[0_4px_0_#334155]";
  else if (variant === "accent") variantClasses = "bg-[var(--accent)] text-[var(--text)] hover:bg-amber-400 shadow-[0_4px_0_#b45309]";
  else if (variant === "warning") variantClasses = "bg-amber-400 text-amber-900 hover:bg-amber-500 shadow-[0_4px_0_#92400e]";
  return (
    <motion.button whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.95, y: 2, boxShadow: "none" } : {}} onClick={() => { if (disabled) return; audioCtrl.playSE('click'); if (onClick) onClick(); }} className={`rounded-[20px] font-bold border-none outline-none flex items-center justify-center gap-2 select-none touch-manipulation transition-colors ${disabled ? 'opacity-50 cursor-not-allowed filter grayscale' : ''} ${variantClasses} ${className}`} {...props}>
      {children}
    </motion.button>
  );
};

const Confetti = ({ active }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return; const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({ length: 100 }, () => ({ x: canvas.width / 2, y: canvas.height / 2, r: Math.random() * 8 + 4, dx: Math.random() * 20 - 10, dy: Math.random() * -20 - 5, color: ['#fce7f3', '#fef08a', '#bae6fd', '#a7f3d0', '#c7d2fe', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 7)], tiltAngleIncrement: (Math.random() * 0.07) + 0.05, tiltAngle: 0 }));
    let animId;
    const render = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); let activeCount = 0; particles.forEach(p => { p.tiltAngle += p.tiltAngleIncrement; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; p.dy += 0.2; p.y += p.dy; if (p.y <= canvas.height) activeCount++; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.r, p.y); ctx.lineTo(p.x, p.y + p.r); ctx.stroke(); }); if (activeCount > 0) animId = requestAnimationFrame(render); };
    render(); return () => cancelAnimationFrame(animId);
  }, [active]);
  if (!active) return null; return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
};

const PageWrapper = ({ children, keyName }) => (<motion.div key={keyName} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-4 no-scrollbar"><div className="m-auto w-full max-w-lg h-full">{children}</div></motion.div>);
const FullScreenWrapper = ({ children, keyName }) => (<motion.div key={keyName} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex flex-col p-0 md:p-6 overflow-hidden"><div className="w-full h-full max-w-7xl mx-auto flex flex-col">{children}</div></motion.div>);

// ==========================================
// エラーバウンダリ（一つの画面エラーがアプリ全体をクラッシュさせない）
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary caught:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-black text-[var(--text)]">エラーが発生しました</h2>
          <p className="text-sm text-[var(--text)] opacity-60 max-w-xs">画面を再読み込みするか、ホームに戻ってください。</p>
          <button onClick={() => { this.setState({ hasError: false, error: null }); this.props.onReset?.(); }} className="bg-[var(--primary)] text-[var(--panel)] px-6 py-3 rounded-2xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
            ホームに戻る
          </button>
          {process.env.NODE_ENV === 'development' && <pre className="text-xs text-rose-500 text-left bg-gray-100 p-2 rounded max-w-sm overflow-auto">{this.state.error?.message}</pre>}
        </div>
      );
    }
    return this.props.children;
  }
}

// アニメーション付き数値カウンター（結果画面用）
const AnimatedCounter = ({ target, duration = 1200, prefix = '', suffix = '' }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now(); const startVal = 0;
    const tick = () => {
      const elapsed = Date.now() - start; const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
};

const StampEffect = ({ stamp }) => {
  if (!stamp) return null;
  const config = { 'easy': { text: '💮', color: 'text-rose-500', label: 'よゆう！', purify: true }, 'good': { text: '👍', color: 'text-sky-500', label: '書けた！' }, 'again': { text: '💦', color: 'text-slate-500', label: '忘れた…' } }[stamp];
  return (
    <motion.div initial={{ scale: 4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.5 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      {config.purify && <motion.div initial={{ width: 0, opacity: 1 }} animate={{ width: '150%', opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 z-[-1] pointer-events-none flex items-center justify-center overflow-hidden"><div className="h-40 bg-slate-900 rounded-full blur-[2px] w-full origin-left -rotate-12 transform scale-150"></div></motion.div>}
      <div className={`text-[150px] md:text-[200px] leading-none drop-shadow-2xl filter ${config.color}`} style={{ textShadow: '4px 4px 0 #fff, -4px -4px 0 #fff, 4px -4px 0 #fff, -4px 4px 0 #fff' }}>{config.text}</div>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="mt-4 bg-white/90 backdrop-blur px-6 py-2 rounded-full border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] text-3xl font-black text-[var(--text)]">{config.label}</motion.div>
    </motion.div>
  );
};

// 住民アニメーション（正弦波でふらふら歩く）
const VillagerDot = React.memo(({ villager, cellSize, offset, isDanger }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const tRef = useRef(Math.random() * Math.PI * 2); // 位相をランダムにずらす

  useEffect(() => {
    if (isDanger) return; // お化けがいるときは止まる
    const baseX = villager.x * cellSize + cellSize / 2;
    const baseY = villager.y * cellSize + cellSize / 2;
    const speed = 0.008 + (villager.id.length % 3) * 0.003;
    const range = cellSize * 0.35;
    const animate = () => {
      tRef.current += speed;
      setPos({
        x: baseX + Math.sin(tRef.current) * range,
        y: baseY + Math.cos(tRef.current * 0.7) * range,
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [villager.x, villager.y, cellSize, isDanger]);

  // 初期位置の設定
  useEffect(() => {
    if (isDanger) {
      setPos({
        x: villager.x * cellSize + cellSize / 2,
        y: villager.y * cellSize + cellSize / 2
      });
    }
  }, [isDanger, villager.x, villager.y, cellSize]);

  return (
    <div className="absolute pointer-events-none z-30 flex flex-col items-center" style={{ left: pos.x + offset.x, top: pos.y + offset.y, transform: 'translate(-50%,-100%)' }}>
      <div className="text-[8px] font-black leading-none mb-0.5" style={{ color: '#e11d48', textShadow: '0 0 3px white, 0 0 3px white' }}>{villager.kanjiChar}</div>
      <div style={{ fontSize: '12px', lineHeight: 1 }}>{isDanger ? '😨' : '🧑'}</div>
    </div>
  );
});

const DraggableTownMap = ({ mapData, isDanger, isEditing, onCellTap, reviewCount, kakejikuImg, villagers = [], exploredRadius = 11 }) => {
  const GRID_SIZE = 20; const CELL_SIZE = 48; const MAP_SIZE = GRID_SIZE * CELL_SIZE;
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: -MAP_SIZE / 2 + 150, y: -MAP_SIZE / 2 + 100 });
  const [initialFitDone, setInitialFitDone] = useState(false);
  const isDragging = useRef(false); const lastPos = useRef({ x: 0, y: 0 });
  const onCellTapRef = useRef(onCellTap);
  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  const safeMapData = mapData || {};
  const C = 10;

  // コンテナサイズ監視
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setContainerSize({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 初回フィット
  useEffect(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || initialFitDone) return;
    const R = exploredRadius || 2;
    const mapLogicalSize = (R * 2 + 2) * CELL_SIZE;
    setOffset({
      x: containerSize.w / 2 - (C * CELL_SIZE) - (CELL_SIZE / 2),
      y: containerSize.h / 2 - (C * CELL_SIZE) - (CELL_SIZE / 2)
    });
    setInitialFitDone(true);
  }, [containerSize, exploredRadius, initialFitDone]);

  const handlePointerDown = (e) => { isDragging.current = false; lastPos.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY }; };
  const handlePointerMove = (e) => { if (!lastPos.current.x) return; const clientX = e.clientX || e.touches?.[0].clientX; const clientY = e.clientY || e.touches?.[0].clientY; const dx = clientX - lastPos.current.x; const dy = clientY - lastPos.current.y; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging.current = true; if (isDragging.current) { setOffset(prev => ({ x: Math.max(Math.min(prev.x + dx, 200), -MAP_SIZE + 200), y: Math.max(Math.min(prev.y + dy, 200), -MAP_SIZE + 200) })); lastPos.current = { x: clientX, y: clientY }; } };
  const handlePointerUp = useCallback((e, cx, cy) => {
    if (!isDragging.current && onCellTapRef.current) onCellTapRef.current(cx, cy);
    lastPos.current = { x: 0, y: 0 };
  }, []);

  const ghosts = useMemo(() => {
    if (!isDanger || isEditing) return [];
    const exploredKeys = Object.keys(safeMapData).filter(k => {
      const [x, y] = k.split(',').map(Number);
      return Math.max(Math.abs(x - C), Math.abs(y - C)) <= exploredRadius;
    });
    if (exploredKeys.length === 0) return [{ x: C, y: C }];
    const seed = (reviewCount || 0) * 7919;
    const seededRand = (i) => { let x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    return Array.from({ length: Math.min(reviewCount || 0, 8) }, (_, i) => {
      const k = exploredKeys[Math.floor(seededRand(i) * exploredKeys.length)];
      const [x, y] = k.split(',').map(Number); return { x, y };
    });
  }, [isDanger, isEditing, reviewCount, exploredRadius, Object.keys(safeMapData).join(',')]);

  const cells = useMemo(() => {
    const result = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
        const isVisible = dist <= exploredRadius;
        const itemId = safeMapData[key];
        const item = itemId ? TOWN_ITEMS.find(i => i.id === itemId) : null;
        const hasGhost = ghosts.some(g => g.x === x && g.y === y);
        const isTerrain = item && item.type === 'terrain';

        // 未探索 → 暗黒のフォグ
        if (!isVisible) {
          result.push(<div key={key} className="w-[48px] h-[48px] bg-[#0f172a]" />);
          continue;
        }

        // 岩盤（探索済みだが開拓不可）
        if (itemId === 't_bedrock') {
          result.push(<div key={key} className="w-[48px] h-[48px] flex items-center justify-center"><SvgBedrock /></div>);
          continue;
        }

        // 荒れ地（タップで開拓できると示すヒント）
        if (itemId === 't_roughland') {
          result.push(
            <div key={key} onPointerUp={(e) => handlePointerUp(e, x, y)}
              className={`w-[48px] h-[48px] flex items-center justify-center relative select-none group ${isEditing ? 'cursor-pointer' : ''}`}>
              <SvgRoughland />
              {isEditing && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-amber-500/40 transition-opacity rounded-sm"><span className="text-[9px] font-black text-white text-center leading-tight">開拓<br/>(-1💰)</span></div>}
            </div>
          );
          continue;
        }

        // 通常セル（更地・設置物・雑草）
        const bgClass = item ? item.bg : 'bg-[#d4a96a]';
        result.push(
          <div key={key} onPointerUp={(e) => handlePointerUp(e, x, y)}
            className={`w-[48px] h-[48px] border-[1px] border-black/5 flex items-center justify-center relative select-none ${bgClass} ${isEditing ? 'hover:brightness-110 cursor-pointer border-black/20' : ''} ${isDanger && !isEditing ? 'brightness-75' : ''}`}>
            <AnimatePresence mode="popLayout">
              {item && item.id === 't_kakejiku' ? (
                <motion.div key="kk" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative w-[80%] h-[90%] bg-[#f5e6d3] border-x-[4px] border-y-2 border-amber-900 rounded-sm shadow-sm flex items-center justify-center z-10">
                  {kakejikuImg ? <img src={kakejikuImg} className="w-[80%] h-[80%] object-contain mix-blend-multiply opacity-80 pointer-events-none" alt="kakejiku" /> : <span className="text-[10px] text-amber-900 font-bold opacity-50">書</span>}
                </motion.div>
              ) : item && !isTerrain ? (
                <motion.div key={itemId} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
                  <item.svg />
                </motion.div>
              ) : item && item.id === 't_weed' ? (
                <motion.div key="weed" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center"><SvgWeed /></motion.div>
              ) : null}
            </AnimatePresence>
            {hasGhost && <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute z-20 text-2xl drop-shadow-lg pointer-events-none select-none">👻</motion.div>}
          </div>
        );
      }
    }
    return result;
  }, [safeMapData, ghosts, isDanger, isEditing, kakejikuImg, exploredRadius]);

  return (
    <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={() => { lastPos.current = { x: 0, y: 0 }; }}
      onPointerLeave={() => { lastPos.current = { x: 0, y: 0 }; }}
      className={`w-full h-full rounded-[16px] overflow-hidden transition-all duration-1000 ${isDanger && !isEditing ? 'bg-slate-900' : 'bg-sky-300'} border-[3px] border-[var(--text)] shadow-inner relative touch-none`}
      style={{ opacity: initialFitDone ? 1 : 0 }}>
      <AnimatePresence>
        {isDanger && !isEditing
          ? <motion.div key="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none z-30"><CloudRain size={150} className="text-slate-400" /></motion.div>
          : <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-4 right-4 animate-spin-slow pointer-events-none z-30"><Sun size={60} className="text-amber-400 drop-shadow-md" fill="currentColor" /></motion.div>
        }
      </AnimatePresence>
      {/* グリッド */}
      <div style={{ width: MAP_SIZE, height: MAP_SIZE, transform: `translate(${offset.x}px, ${offset.y}px)`, gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)`, gridTemplateRows: `repeat(${GRID_SIZE}, 48px)` }}
        className="grid absolute top-0 left-0 transition-transform duration-75 ease-out">
        {cells}
      </div>
      {/* 住民オーバーレイ（グリッドの外でoffset適用） */}
      {villagers.slice(0, 20).map(v => (
        <VillagerDot key={v.id} villager={v} cellSize={CELL_SIZE} offset={offset} isDanger={isDanger && !isEditing} />
      ))}
    </div>
  );
};

const ModeLayout = ({ mainContent, sidebarContent }) => (
  <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full">
    <div className="flex-1 bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-2 md:p-8 shadow-inner relative min-h-[40vh] md:min-h-0">{mainContent}</div>
    <div className="w-full lg:w-[340px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-6 lg:pb-0">{sidebarContent}</div>
  </div>
);

const SessionView = ({ queue: initialQueue, stats, onUpdateStat, onFinish, onRecordPerfect, onRecordEasy }) => {
  const [queue, setQueue] = useState(initialQueue); const [mode, setMode] = useState('read'); const [paths, setPaths] = useState([]); const [strokeData, setStrokeData] = useState([]); const [crossMatrix, setCrossMatrix] = useState([]); const [isLoading, setIsLoading] = useState(false); const [canvasSize] = useState(window.innerWidth < 768 ? 280 : 400); const [activeStamp, setActiveStamp] = useState(null); const [combo, setCombo] = useState(0); const [reachedStep, setReachedStep] = useState(0);
  const currentKanji = queue[0]; const isNew = !stats[currentKanji?.id] || stats[currentKanji?.id].status === 'new'; const MODES = useMemo(() => ['read', 'watch', 'write', 'test'], []);

  useEffect(() => {
    if (!currentKanji) return; setMode(isNew ? 'read' : 'test'); setReachedStep(isNew ? 0 : 3);
    const fetchPaths = async () => {
      setIsLoading(true); const hex = currentKanji.char.charCodeAt(0).toString(16).padStart(5, '0');
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`);
        if (res.ok) {
          const text = await res.text(); const doc = new DOMParser().parseFromString(text, 'image/svg+xml'); const extractedPaths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d')); setPaths(extractedPaths);
          const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path"); svg.appendChild(pathEl); document.body.appendChild(svg);
          const data = extractedPaths.map(p => {
            pathEl.setAttribute("d", p); const len = pathEl.getTotalLength(); const points = [];
            for (let i = 0; i <= len; i += 2) { const pt = pathEl.getPointAtLength(i); points.push({ x: pt.x / 109, y: pt.y / 109 }); }
            const endPt = pathEl.getPointAtLength(len); points.push({ x: endPt.x / 109, y: endPt.y / 109 });
            return { s: { x: pathEl.getPointAtLength(0).x / 109, y: pathEl.getPointAtLength(0).y / 109 }, e: { x: endPt.x / 109, y: endPt.y / 109 }, points };
          });
          document.body.removeChild(svg);
          // FIX: build cross matrix safely
          const cMatrix = data.map((_, i) => data.map((__, j) => i !== j && Analyzer.checkCross(data[i].points, data[j].points)));
          setCrossMatrix(cMatrix); setStrokeData(data);
        }
      } catch (e) { setPaths([]); setCrossMatrix([]); setStrokeData([]); }
      setIsLoading(false);
    }; fetchPaths();
  }, [currentKanji, isNew]);

  useEffect(() => { const stepIdx = MODES.indexOf(mode); if (stepIdx > reachedStep) setReachedStep(stepIdx); }, [mode, reachedStep, MODES]);

  const handleEvaluation = (evalType) => {
    if (evalType === 'easy') onRecordEasy();
    if (evalType === 'easy' || evalType === 'good') { const newC = combo + 1; setCombo(newC); }
    else { setCombo(0); }
    audioCtrl.playSE(evalType === 'again' ? 'stamp_bad' : evalType === 'easy' ? 'stamp_perfect' : evalType === 'hard' ? 'click' : 'stamp_good');
    setActiveStamp(evalType === 'hard' ? 'good' : evalType); // hard は good スタンプで表示
    setTimeout(() => {
      setActiveStamp(null);
      const success = onUpdateStat(currentKanji, evalType);
      if (success) { const nextQueue = queue.slice(1); if (nextQueue.length === 0) onFinish(); else setQueue(nextQueue); }
      else { const nextQueue = [...queue.slice(1), currentKanji]; setQueue(nextQueue); setMode('watch'); }
    }, evalType === 'again' ? 1500 : 900); // again以外は短めに
  };
  if (!currentKanji) return null;

  const commonSidebarTop = (
    <div className="flex flex-col gap-3 shrink-0 mb-4">
      <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
        {[{ id: 'read', icon: <Volume2 size={18} />, label: "音読" }, { id: 'watch', icon: <PlayCircle size={18} />, label: "書き順" }, { id: 'write', icon: <Pencil size={18} />, label: "なぞる" }, { id: 'test', icon: <CheckCircle2 size={18} />, label: "テスト" }].map((t, idx) => {
          const isDisabled = isNew && idx > reachedStep;
          return (<button key={t.id} onClick={() => { if (isDisabled) { audioCtrl.playSE('stamp_bad'); return; } audioCtrl.playSE('click'); setMode(t.id); }} className={`flex flex-col items-center justify-center py-2.5 rounded-xl font-bold text-[10px] sm:text-xs border-[3px] transition-all ${mode === t.id ? "bg-[var(--text)] text-[var(--panel)] border-[var(--text)] shadow-[2px_2px_0_var(--primary)] scale-105" : isDisabled ? "bg-gray-100 text-gray-400 border-gray-300 opacity-50 cursor-not-allowed" : "bg-[var(--panel)] text-[var(--text)] border-[var(--text)] hover:bg-[var(--bg)]"}`}>{t.icon} <span className="mt-1">{t.label}</span></button>);
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-[var(--panel)] rounded-[24px] shadow-[6px_6px_0_var(--text)] border-[4px] border-[var(--text)] p-3 md:p-5 flex flex-col h-full overflow-hidden relative">
      <StampEffect stamp={activeStamp} />
      <div className="flex justify-between items-center mb-3 shrink-0">
        <div className="text-[var(--text)] font-bold text-sm bg-[var(--bg)] px-4 py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-2">のこり <span className="text-lg font-black">{queue.length}</span> 文字</div>
        <div className="flex gap-2">
          {combo > 1 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[var(--text)] font-black text-sm bg-[var(--accent)] px-4 py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1">{combo} COMBO 🔥</motion.div>}
          {isNew && <div className="text-[var(--panel)] font-bold text-sm bg-[var(--primary)] px-4 py-2 rounded-full flex items-center gap-1 border-[3px] border-[var(--text)] shadow-sm"><Star size={16} /> 新出</div>}
        </div>
      </div>
      <div className="flex-1 min-h-0 w-full relative">
        {mode === 'read' && <ReadMode kanji={currentKanji} onNext={() => setMode('watch')} commonSidebar={commonSidebarTop} />}
        {mode === 'watch' && <WatchMode paths={paths} strokeData={strokeData} isLoading={isLoading} onNext={() => setMode('write')} canvasSize={canvasSize} commonSidebar={commonSidebarTop} />}
        {mode === 'write' && <WriteMode paths={paths} strokeData={strokeData} crossMatrix={crossMatrix} onNext={() => setMode('test')} canvasSize={canvasSize} commonSidebar={commonSidebarTop} onRecordPerfect={onRecordPerfect} />}
        {mode === 'test' && <TestMode kanji={currentKanji} onEvaluate={handleEvaluation} canvasSize={canvasSize} commonSidebar={commonSidebarTop} />}
      </div>
    </div>
  );
};

const ReadMode = ({ kanji, onNext, commonSidebar }) => {
  const [exampleIdx, setExampleIdx] = useState(Math.floor(Math.random() * kanji.examples.length));
  const main = (<div className="text-[12rem] md:text-[18rem] lg:text-[22rem] leading-none font-black text-[var(--text)] drop-shadow-md select-none" style={{ fontFamily: "'Klee One', serif" }}>{kanji.char}</div>);
  const handleNextExample = () => { setExampleIdx((prev) => (prev + 1) % kanji.examples.length); audioCtrl.playSE('click'); };
  const sidebar = (
    <>
      {commonSidebar}
      <div className="flex flex-col gap-4 bg-[var(--panel)] p-4 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] mt-4">
        <div className="bg-[var(--accent)] text-[var(--text)] px-4 py-1.5 rounded-full text-sm font-black border-[3px] border-[var(--text)] text-center shadow-sm -mt-8 mx-auto w-max">声にだそう！</div>
        <div className="relative min-h-[80px] flex items-center justify-center">
          <AnimatePresence mode="wait"><motion.p key={exampleIdx} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="text-xl md:text-2xl font-bold text-[var(--text)] leading-relaxed text-center py-2">{kanji.examples[exampleIdx]}</motion.p></AnimatePresence>
          {kanji.examples.length > 1 && (<button onClick={handleNextExample} className="absolute -right-2 top-1/2 -translate-y-1/2 bg-[var(--bg)] border-2 border-[var(--text)] rounded-full p-1 hover:bg-[var(--text)] hover:text-white transition-colors shadow-sm"><ChevronRight size={20} /></button>)}
        </div>
        {kanji.examples.length > 1 && (<div className="flex justify-center gap-1.5">{kanji.examples.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full border border-[var(--text)] ${i === exampleIdx ? 'bg-[var(--text)]' : 'bg-transparent'}`} />))}</div>)}
      </div>
      <div className="flex flex-col gap-3 mt-4">
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--primary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--primary)] shrink-0">音</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.on.length > 0 ? kanji.on.map((o, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">{o}</span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
        <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
          <span className="text-sm font-bold text-[var(--secondary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--secondary)] shrink-0">訓</span>
          <div className="flex flex-wrap gap-1.5 justify-end">{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300"><FormatKun text={k} /></span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
        </div>
      </div>
      <div className="mt-auto pt-4 pb-2"><MotionButton variant="primary" onClick={onNext} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">書き順をみる <ChevronRight size={28} /></MotionButton></div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

const WatchMode = ({ paths, strokeData, isLoading, onNext, canvasSize, commonSidebar }) => {
  const [key, setKey] = useState(0);
  const main = isLoading ? <div className="animate-pulse font-bold text-2xl text-[var(--text)] opacity-50">ロード中...</div> : (
    <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] transition-all duration-200 shrink-0 shadow-[8px_8px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
      <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2" /><div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2" />
      <svg viewBox="0 0 109 109" className="w-full h-full relative z-10" key={key}>
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} fill="none" stroke="var(--bg)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d} fill="none" stroke="var(--text)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset="1000" style={{ animation: `drawStroke 1.2s ease-in-out forwards`, animationDelay: `${i * 1.2}s` }} />
            {strokeData[i] && (<g style={{ animation: `fadeIn 0.2s ease-in forwards`, animationDelay: `${i * 1.2}s`, opacity: 0 }}><circle cx={strokeData[i].s.x * 109} cy={strokeData[i].s.y * 109} r="5" fill="var(--panel)" stroke="var(--primary)" strokeWidth="2" /><text x={strokeData[i].s.x * 109} y={strokeData[i].s.y * 109 + 0.5} dominantBaseline="central" textAnchor="middle" fontSize="6" fontWeight="bold" fill="var(--primary)">{i + 1}</text></g>)}
          </g>
        ))}
      </svg>
      <style>{`@keyframes drawStroke { to { stroke-dashoffset: 0; } } @keyframes fadeIn { to { opacity: 1; } }`}</style>
    </div>
  );
  const sidebar = (
    <>
      {commonSidebar}
      <div className="bg-[var(--panel)] p-4 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] text-center flex flex-col gap-2 mt-4">
        <div className="text-base font-black text-[var(--panel)] bg-[var(--secondary)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm mx-2">1画ずつ よく見よう！</div>
        <p className="text-xs md:text-sm text-[var(--text)] font-bold opacity-70 px-2 mt-2 leading-relaxed">正しい書き順で書くと、<br />漢字がきれいに書けるようになるよ。</p>
      </div>
      <div className="mt-auto pt-4 flex flex-col gap-3 pb-2">
        <MotionButton variant="secondary" onClick={() => setKey(k => k + 1)} className="py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]"><RefreshCw size={20} /> もう一度みる</MotionButton>
        <MotionButton variant="primary" onClick={onNext} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">なぞり書きへ <ChevronRight size={28} /></MotionButton>
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

const WriteMode = ({ paths, strokeData, crossMatrix, onNext, canvasSize, commonSidebar, onRecordPerfect }) => {
  const guideRef = useRef(null); const inkRef = useRef(null); const writeRef = useRef(null);
  const [currentStroke, setCurrentStroke] = useState(0); const [isDrawing, setIsDrawing] = useState(false);
  const [count, setCount] = useState(0); const [statusMsg, setStatusMsg] = useState("１かくめ をかこう！");
  const [showConfetti, setShowConfetti] = useState(false); const [floatingTexts, setFloatingTexts] = useState([]);
  const [userStrokes, setUserStrokes] = useState([]); const [history, setHistory] = useState([]);
  const distSum = useRef(0); const currentPathRef = useRef([]);

  const addFloatingText = (x, y, text, color = 'var(--primary)', scale = 1) => { const id = Date.now() + Math.random(); setFloatingTexts(prev => [...prev, { id, x, y, text, color, scale }]); setTimeout(() => { setFloatingTexts(prev => prev.filter(t => t.id !== id)); }, 1500); };
  const initCanvases = useCallback(() => { [guideRef, inkRef, writeRef].forEach(ref => { const c = ref.current; if (c) { c.width = canvasSize * 2; c.height = canvasSize * 2; c.style.width = '100%'; c.style.height = '100%'; const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2); ctx.clearRect(0, 0, canvasSize, canvasSize); } }); }, [canvasSize]);

  useEffect(() => { setCount(0); setCurrentStroke(0); setUserStrokes([]); setHistory([]); setStatusMsg("１かくめ をかこう！"); setShowConfetti(false); distSum.current = 0; initCanvases(); }, [paths, canvasSize, initCanvases]);

  const drawGuide = useCallback(() => {
    const gCtx = guideRef.current?.getContext('2d'); if (!gCtx || !paths.length) return;
    gCtx.clearRect(0, 0, canvasSize, canvasSize); gCtx.save(); gCtx.scale(canvasSize / 109, canvasSize / 109); gCtx.lineWidth = 6; gCtx.lineCap = 'round'; gCtx.lineJoin = 'round';
    const isBlindMode = count >= 5;
    paths.forEach((d, i) => {
      const p = new Path2D(d);
      if (i === currentStroke) { gCtx.strokeStyle = isBlindMode ? "rgba(255, 107, 107, 0.15)" : "rgba(255, 107, 107, 0.5)"; gCtx.stroke(p); if (strokeData[i]) { gCtx.fillStyle = isBlindMode ? "rgba(255, 107, 107, 0.2)" : "rgba(255, 107, 107, 0.8)"; gCtx.beginPath(); gCtx.arc(strokeData[i].s.x * 109, strokeData[i].s.y * 109, 4, 0, Math.PI * 2); gCtx.fill(); } } else if (i > currentStroke && !isBlindMode) { gCtx.strokeStyle = "rgba(0,0,0,0.05)"; gCtx.stroke(p); }
    }); gCtx.restore();
  }, [paths, currentStroke, count, strokeData, canvasSize]);

  const drawInk = useCallback(() => {
    const iCtx = inkRef.current?.getContext('2d'); if (!iCtx || !paths.length) return;
    iCtx.clearRect(0, 0, canvasSize, canvasSize);
    if (count < 2) { iCtx.save(); iCtx.scale(canvasSize / 109, canvasSize / 109); iCtx.strokeStyle = "var(--text)"; iCtx.lineWidth = 6; iCtx.lineCap = 'round'; iCtx.lineJoin = 'round'; for (let i = 0; i < currentStroke; i++) iCtx.stroke(new Path2D(paths[i])); iCtx.restore(); } else { iCtx.save(); iCtx.lineCap = 'round'; iCtx.lineJoin = 'round'; iCtx.strokeStyle = "var(--text)"; iCtx.lineWidth = canvasSize * 0.08; userStrokes.forEach(stroke => { if (stroke.length === 0) return; iCtx.beginPath(); iCtx.moveTo(stroke[0].x, stroke[0].y); stroke.forEach(pt => iCtx.lineTo(pt.x, pt.y)); iCtx.stroke(); }); iCtx.restore(); }
  }, [paths, currentStroke, count, userStrokes, canvasSize]);

  useEffect(() => { drawGuide(); drawInk(); }, [drawGuide, drawInk]);
  useEffect(() => { if (paths.length > 0 && currentStroke === paths.length) { const timer = setTimeout(() => { const inkCanvas = inkRef.current; if (inkCanvas) setHistory(prev => [...prev, inkCanvas.toDataURL('image/png')]); }, 100); return () => clearTimeout(timer); } }, [currentStroke, paths.length]);

  const clearCanvas = (ref) => { ref.current?.getContext('2d')?.clearRect(0, 0, canvasSize, canvasSize); };
  const resetPractice = () => { setCurrentStroke(0); setUserStrokes([]); setStatusMsg("１かくめ をかこう！"); distSum.current = 0; clearCanvas(writeRef); };
  const handleNextTry = () => { setCount(c => c + 1); setCurrentStroke(0); setUserStrokes([]); setStatusMsg("１かくめ をかこう！"); distSum.current = 0; clearCanvas(writeRef); };

  const getCoords = (e) => { const rect = writeRef.current.getBoundingClientRect(); const scaleX = canvasSize / rect.width; const scaleY = canvasSize / rect.height; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };
  const lastPos = useRef({ x: 0, y: 0 }); const currentStrokeRef = useRef(currentStroke); currentStrokeRef.current = currentStroke; const isDrawingRef = useRef(isDrawing); isDrawingRef.current = isDrawing;

  const handleStart = (e) => {
    e.preventDefault(); audioCtrl.init(); if (currentStrokeRef.current >= paths.length) return;
    // FIX: guard against missing strokeData
    if (!strokeData[currentStrokeRef.current]) return;
    const { x, y } = getCoords(e); const target = strokeData[currentStrokeRef.current].s;
    if (Math.hypot(x / canvasSize - target.x, y / canvasSize - target.y) > 0.18) { setStatusMsg("かきはじめが ちがうよ💦"); audioCtrl.playSE('stamp_bad'); return; }
    setStatusMsg(`${currentStrokeRef.current + 1}かくめ なぞり中...`); setIsDrawing(true); lastPos.current = { x, y }; currentPathRef.current = [{ x, y, time: Date.now() }];
    const ctx = writeRef.current.getContext('2d'); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = canvasSize * 0.08; ctx.strokeStyle = "var(--secondary)"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y); ctx.stroke();
  };
  const handleMove = (e) => {
    e.preventDefault(); if (!isDrawingRef.current) return;
    const { x, y } = getCoords(e); currentPathRef.current.push({ x, y, time: Date.now() });
    const ctx = writeRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(lastPos.current.x, lastPos.current.y); ctx.lineTo(x, y); ctx.stroke(); lastPos.current = { x, y };
  };
  const handleEnd = (e) => {
    if (e && e.type !== 'mouseleave') e.preventDefault(); if (!isDrawingRef.current) return; setIsDrawing(false);
    // FIX: guard against missing strokeData
    if (!strokeData[currentStrokeRef.current]) return;
    const target = strokeData[currentStrokeRef.current].e; const currentDist = Math.hypot(lastPos.current.x / canvasSize - target.x, lastPos.current.y / canvasSize - target.y);
    if (currentDist < 0.25) {
      let isError = false; let errMsg = "";
      if (count >= 2) {
        const normalizedPoints = currentPathRef.current.map(p => ({ x: p.x / canvasSize, y: p.y / canvasSize, time: p.time })); const ending = Analyzer.analyzeEnding(normalizedPoints);
        for (let pastIdx = 0; pastIdx < currentStrokeRef.current; pastIdx++) {
          const pastPoints = userStrokes[pastIdx];
          if (!pastPoints) continue;
          const pastNormalized = pastPoints.map(p => ({ x: p.x / canvasSize, y: p.y / canvasSize }));
          const isUserCrossed = Analyzer.checkCross(pastNormalized, normalizedPoints);
          // FIX: safe crossMatrix access
          const isExpectedCrossed = crossMatrix[currentStrokeRef.current]?.[pastIdx] ?? false;
          if (isUserCrossed !== isExpectedCrossed) { isError = true; errMsg = isUserCrossed ? "ちがう画を つきぬけているよ💦" : "ほかの画と まじわっていないよ💦"; break; }
        }
        if (!isError) { addFloatingText(lastPos.current.x, lastPos.current.y - 30, ending.type === 'はね' ? "きれいなハネ！✨" : ending.type === 'はらい' ? "きれいなハライ！✨" : "しっかりトメたね！✨", "var(--primary)", 1.0); }
      }
      if (isError) { clearCanvas(writeRef); setStatusMsg(errMsg); audioCtrl.playSE('stamp_bad'); return; }
      const nextStroke = currentStrokeRef.current + 1; setUserStrokes(prev => [...prev, [...currentPathRef.current]]); setCurrentStroke(nextStroke); clearCanvas(writeRef); distSum.current += currentDist;
      if (nextStroke >= paths.length) {
        const avgDist = distSum.current / paths.length; let evalText = "Good!"; let color = "var(--secondary)";
        if (avgDist < 0.08) { evalText = "Perfect!!"; color = "var(--primary)"; onRecordPerfect(inkRef.current?.toDataURL('image/png')); } else if (avgDist < 0.15) { evalText = "Great!"; color = "var(--accent)"; }
        addFloatingText(canvasSize / 2, canvasSize / 2, `${evalText}`, color, 1.5); distSum.current = 0; setStatusMsg("💮 よくできました！"); audioCtrl.playSE('success'); setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500);
      } else { addFloatingText(lastPos.current.x, lastPos.current.y, "✨", "var(--accent)", 1); setStatusMsg(`${nextStroke + 1}かくめ をかこう！`); audioCtrl.playSE('click'); }
    } else { clearCanvas(writeRef); setStatusMsg("さいごまで なぞってね💦"); audioCtrl.playSE('stamp_bad'); }
  };

  const main = (
    <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none transition-all duration-200 shrink-0 shadow-[8px_8px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
      <Confetti active={showConfetti} />
      <AnimatePresence>{floatingTexts.map(ft => (<motion.div key={ft.id} initial={{ opacity: 1, y: ft.y, x: ft.x, scale: 0.5 * ft.scale }} animate={{ opacity: 0, y: ft.y - 40 * ft.scale, scale: 1.2 * ft.scale }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute z-50 font-black pointer-events-none drop-shadow-md whitespace-nowrap -translate-x-1/2 -translate-y-1/2" style={{ color: ft.color, fontSize: '24px' }}>{ft.text}</motion.div>))}</AnimatePresence>
      <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" /><div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
      <canvas ref={guideRef} className="absolute inset-0 z-0 pointer-events-none w-full h-full" /><canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" /><canvas ref={writeRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} className="absolute inset-0 z-20 cursor-crosshair w-full h-full" />
    </div>
  );

  const sidebar = (
    <>
      {commonSidebar}
      <div className="bg-[var(--panel)] p-3 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center bg-[var(--bg)] p-2 rounded-xl border-[2px] border-[var(--text)]">
          <span className="text-sm font-bold text-[var(--text)] pl-2">{count < 2 ? "なぞり書き" : count < 5 ? "手書き (手本あり)" : "空書き (手本なし)"}</span><div className="text-sm font-black bg-[var(--text)] text-[var(--panel)] px-3 py-1 rounded-lg shadow-sm">{count + 1} 回目</div>
        </div>
        <div className={`text-sm font-black px-3 py-2 rounded-xl border-[2px] border-[var(--text)] text-center shadow-sm transition-colors ${statusMsg.includes('💦') ? 'bg-[var(--primary)] text-[var(--panel)]' : statusMsg.includes('💮') ? 'bg-[var(--secondary)] text-[var(--panel)]' : 'bg-white text-[var(--text)]'}`}>{statusMsg}</div>
      </div>
      {history.length > 0 && (
        <div className="bg-[var(--panel)] p-2 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] flex flex-col gap-1 shrink-0 mt-2">
          <span className="text-[10px] font-bold text-[var(--text)] px-1">これまでに書いた字</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {history.map((img, idx) => (<div key={idx} className="w-14 h-14 shrink-0 bg-[var(--bg)] border-2 border-[var(--text)] rounded-lg overflow-hidden relative flex items-center justify-center"><span className="absolute top-0.5 left-1 text-[8px] font-black text-[var(--text)] opacity-40">{idx + 1}</span><img src={img} className="w-full h-full object-contain p-1" alt={`try ${idx + 1}`} /></div>))}
          </div>
        </div>
      )}
      <div className="mt-auto pt-2 flex flex-col gap-2 pb-2 shrink-0">
        <MotionButton variant="secondary" onClick={resetPractice} className="py-2 text-sm border-[2px] border-[var(--text)] w-full shadow-[0_2px_0_var(--text)]"><RefreshCw size={16} /> 途中でやりなおす</MotionButton>
        <div className="flex flex-col gap-2 w-full mt-1">
          <MotionButton variant={currentStroke >= paths.length ? "primary" : "secondary"} disabled={currentStroke < paths.length} onClick={handleNextTry} className={`w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] ${currentStroke >= paths.length ? 'shadow-[0_6px_0_#9f1239] animate-pulse' : 'opacity-50'}`}><Pencil size={24} /> もう1回書く！</MotionButton>
          <AnimatePresence>{history.length >= 2 && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}><MotionButton variant="success" onClick={onNext} className={`w-full py-4 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_4px_0_#065f46]`}>テストへ進む！ <ChevronRight size={24} /></MotionButton></motion.div>)}</AnimatePresence>
        </div>
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

const TestMode = ({ kanji, onEvaluate, canvasSize, commonSidebar }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const canvasRef = useRef(null); const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    canvas.width = canvasSize * 2; canvas.height = canvasSize * 2; canvas.style.width = '100%'; canvas.style.height = '100%';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2); ctx.clearRect(0, 0, canvasSize, canvasSize); setShowAnswer(false);
  }, [kanji, canvasSize]);

  const getCoords = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const scaleX = canvasSize / rect.width; const scaleY = canvasSize / rect.height; const clientX = e.touches ? e.touches[0].clientX : e.clientX; const clientY = e.touches ? e.touches[0].clientY : e.clientY; return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY }; };
  const startDraw = (e) => { e.preventDefault(); setIsDrawing(true); const { x, y } = getCoords(e); const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(x, y); ctx.strokeStyle = "var(--text)"; ctx.lineWidth = canvasSize * 0.06; ctx.lineCap = "round"; ctx.lineJoin = "round"; };
  const draw = (e) => { e.preventDefault(); if (!isDrawing) return; const { x, y } = getCoords(e); const ctx = canvasRef.current.getContext('2d'); ctx.lineTo(x, y); ctx.stroke(); };
  const stopDraw = () => setIsDrawing(false);

  const main = (
    <div className="flex flex-row flex-wrap gap-4 md:gap-6 justify-center items-center w-full h-full overflow-y-auto no-scrollbar content-center pb-4 pt-4">
      <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none transition-all duration-200 shadow-[4px_4px_0_var(--text)] md:shadow-[8px_8px_0_var(--text)] shrink-0" style={{ width: canvasSize, maxWidth: showAnswer ? 'calc(50% - 16px)' : '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" /><div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={canvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} className="absolute inset-0 z-10 cursor-crosshair w-full h-full" />
        <div className="absolute top-3 left-3 bg-[var(--text)] text-[var(--panel)] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full opacity-50 pointer-events-none">かくところ</div>
      </div>
      {showAnswer && (
        <div className="relative border-[4px] border-[var(--primary)] rounded-[20px] bg-[var(--bg)] overflow-hidden flex items-center justify-center transition-all duration-200 shadow-[4px_4px_0_var(--primary)] md:shadow-[8px_8px_0_var(--primary)] animate-in fade-in slide-in-from-left-4 shrink-0" style={{ width: canvasSize, maxWidth: 'calc(50% - 16px)', maxHeight: '100%', aspectRatio: '1/1' }}>
          <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--primary)] opacity-20 -translate-x-1/2 pointer-events-none" /><div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--primary)] opacity-20 -translate-y-1/2 pointer-events-none" />
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 pointer-events-none select-none drop-shadow-sm"><text x="50" y="53" dominantBaseline="middle" textAnchor="middle" fontSize="80" fontWeight="900" fill="var(--primary)" fontFamily="'Klee One', serif">{kanji.char}</text></svg>
          <div className="absolute top-3 right-3 bg-[var(--primary)] text-[var(--panel)] text-[10px] md:text-xs font-black px-3 md:px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] shadow-sm z-20">こたえ</div>
        </div>
      )}
    </div>
  );

  const sidebar = (
    <>
      {commonSidebar}
      <div className="bg-[var(--panel)] rounded-2xl p-4 text-center border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] flex flex-col gap-2 mt-4">
        <div className="text-xs font-bold text-[var(--panel)] bg-[var(--text)] py-1.5 px-4 rounded-full mx-auto w-max mb-1">この漢字、書ける？</div>
        <div className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-wider">
          {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
          {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
          {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>)) : ''}
        </div>
      </div>
      <div className="mt-auto pt-4 flex flex-col gap-3 pb-2">
        {!showAnswer ? (
          <MotionButton variant="primary" onClick={() => { setShowAnswer(true); audioCtrl.playSE('click'); }} className="w-full py-8 text-2xl md:text-3xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239] animate-pulse"><Eye size={32} /> こたえあわせ</MotionButton>
        ) : (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
            <div className="text-center text-sm font-bold text-[var(--text)] bg-[var(--accent)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm mb-1">自分に正直に評価しよう！</div>
            <div className="grid grid-cols-1 gap-2">
              <MotionButton variant="primary" onClick={() => { onEvaluate('easy'); }} className="py-5 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">よゆう💮 <span className="text-sm font-bold opacity-70 ml-1">（次回：4日後〜）</span></MotionButton>
              <MotionButton variant="success" onClick={() => { onEvaluate('good'); }} className="py-5 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#065f46]">書けた👍 <span className="text-sm font-bold opacity-70 ml-1">（次回：翌日〜）</span></MotionButton>
              <MotionButton variant="warning" onClick={() => { onEvaluate('hard'); }} className="py-4 text-xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#92400e]">むずかしい😓 <span className="text-sm font-bold opacity-70 ml-1">（次回：まもなく）</span></MotionButton>
              <MotionButton variant="danger" onClick={() => { onEvaluate('again'); }} className="py-4 text-xl font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#334155]">忘れた💦 <span className="text-sm font-bold opacity-70 ml-1">（もう一度）</span></MotionButton>
            </div>
          </div>
        )}
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

// ==========================================
// ⚡ 特別とっくん
// ==========================================
const FlashcardView = ({ queue, stats, setStats, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  // FIX: earned を ref で管理してタイマーの再起動バグを防ぐ
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });
  const [displayEarned, setDisplayEarned] = useState({ exp: 0, coins: 0 });
  const isDoneRef = useRef(false);
  // スワイプ検出用
  const touchStartX = useRef(0);

  // タイマーは idx と timeLeft だけに依存させる（earnedを除外）
  useEffect(() => {
    if (timeLeft <= 0 || idx >= queue.length) {
      if (!isDoneRef.current) { isDoneRef.current = true; onFinish(earnedRef.current); }
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, idx, queue.length, onFinish]);

  const kanji = queue[idx];

  const handleAnswer = (isKnown) => {
    if (!kanji) return;
    if (!isKnown) {
      let newStats = { ...stats };
      const cur = migrateCard(newStats.kanjiStats[kanji.id]);
      newStats.kanjiStats[kanji.id] = { ...cur, ...calculateNextReview(cur, 'again'), status: 'learning', mistakes: (cur.mistakes || 0) + 1 };
      setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('stamp_bad');
    } else {
      earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 2, coins: earnedRef.current.coins + 1 };
      setDisplayEarned({ ...earnedRef.current });
      audioCtrl.playSE('stamp_good');
    }
    setIdx(prev => prev + 1);
  };

  // スワイプ操作
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) { handleAnswer(dx > 0); } // 右スワイプ→わかる、左→忘れた
  };

  if (!kanji) return null;
  return (
    <div className="flex flex-col h-[85vh] items-center justify-center p-4 relative w-full max-w-md mx-auto">
      <div className="absolute top-0 w-full flex justify-between items-center p-4">
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          <Timer size={16} className={timeLeft <= 10 ? 'text-rose-500 animate-pulse' : ''} /> {timeLeft}s
        </span>
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          {idx + 1} / {queue.length}
        </span>
      </div>
      <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] p-6 flex flex-col items-center gap-6 shadow-[8px_8px_0_var(--text)]"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="text-sm font-bold bg-[var(--bg)] px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] flex items-center gap-2">
          わかるかな？ <span className="text-[10px] opacity-50">← 忘れた ／ わかる →</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={kanji.id} initial={{ scale: 0.8, opacity: 0, x: 30 }} animate={{ scale: 1, opacity: 1, x: 0 }} exit={{ scale: 1.1, opacity: 0, x: -30 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="text-[10rem] md:text-[14rem] font-black leading-none select-none" style={{ fontFamily: "'Klee One', serif" }}>
            {kanji.char}
          </motion.div>
        </AnimatePresence>
        <div className="text-xs font-bold text-[var(--text)] opacity-40 flex items-center gap-2">
          <span className="bg-[var(--bg)] px-2 py-1 rounded">+{displayEarned.exp} EXP</span>
          <span className="bg-[var(--bg)] px-2 py-1 rounded">🪙 {displayEarned.coins}</span>
        </div>
        <div className="flex w-full gap-4 mt-2">
          <MotionButton variant="danger" onClick={() => handleAnswer(false)} className="flex-1 py-8 text-2xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#334155]">忘れた💦</MotionButton>
          <MotionButton variant="success" onClick={() => handleAnswer(true)} className="flex-1 py-8 text-2xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#065f46]">わかる👍</MotionButton>
        </div>
      </div>
    </div>
  );
};

const SurvivalView = ({ queue, onUpdateStat, onFinish }) => {
  const [currentQueue, setCurrentQueue] = useState([...queue]); const [idx, setIdx] = useState(0); const [timeLeft, setTimeLeft] = useState(60);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 }); const isDoneRef = useRef(false);
  const [canvasSize] = useState(window.innerWidth < 768 ? 280 : 400);
  // FIX: タイマーeffectから earned を除外
  useEffect(() => {
    if (timeLeft <= 0) { if (!isDoneRef.current) { isDoneRef.current = true; onFinish(earnedRef.current); } return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000); return () => clearInterval(timer);
  }, [timeLeft, onFinish]);
  const kanji = currentQueue[idx];
  const handleEvaluate = (evalType) => {
    onUpdateStat(kanji, evalType);
    if (evalType === 'easy' || evalType === 'good') {
      setTimeLeft(t => Math.min(t + 5, 60));
      earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 10, coins: earnedRef.current.coins + 2, perfectCount: evalType === 'easy' ? earnedRef.current.perfectCount + 1 : earnedRef.current.perfectCount };
      audioCtrl.playSE('stamp_good');
    } else { setTimeLeft(t => Math.max(t - 10, 0)); audioCtrl.playSE('stamp_bad'); }
    setTimeout(() => { if (idx + 1 >= currentQueue.length) { setCurrentQueue(prev => [...prev, ...queue].sort(() => Math.random() - 0.5)); } setIdx(prev => prev + 1); }, 1000);
  };
  if (!kanji) return null; const ex = kanji.examples[0]; const blankText = ex ? ex.replace(new RegExp(kanji.char, 'g'), '〇') : '〇';
  const sidebar = (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
        <div className="text-xs font-bold text-rose-600 mb-2 flex items-center justify-center gap-1"><Flame size={16} /> のこり時間</div>
        <div className="w-full bg-gray-200 h-6 rounded-full border-[3px] border-[var(--text)] overflow-hidden"><motion.div animate={{ width: `${(Math.max(timeLeft, 0) / 60) * 100}%` }} transition={{ duration: 0.5 }} className={`h-full transition-colors ${timeLeft < 10 ? 'bg-rose-500' : 'bg-amber-400'}`} /></div>
        <div className={`text-2xl font-black mt-1 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : ''}`}>{Math.max(timeLeft, 0)}秒</div>
        <div className="text-xs font-bold text-[var(--text)] opacity-50 mt-1">正解で+5秒、不正解で-10秒</div>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-bold bg-[var(--text)] text-[var(--panel)] px-4 py-1.5 rounded-full mx-auto w-max mb-4">この「〇」は何の漢字？</div>
        <p className="text-2xl md:text-3xl font-bold text-[var(--text)] leading-relaxed text-center">{blankText}</p>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full">
      <div className="flex-1 bg-[var(--bg)] rounded-[20px] border-[4px] border-[var(--text)] flex items-center justify-center overflow-auto p-2 md:p-8 shadow-inner relative min-h-[40vh] md:min-h-0"><TestMode kanji={kanji} onEvaluate={handleEvaluate} canvasSize={canvasSize} commonSidebar={null} /></div>
      <div className="w-full lg:w-[340px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-6 lg:pb-0">{sidebar}</div>
    </div>
  );
};

const BossBattleView = ({ queue, onUpdateStat, onFinish }) => {
  const [idx, setIdx] = useState(0);
  // FIX: hp を ref でも管理して stale closure を防ぐ
  const [hp, setHp] = useState(10); const hpRef = useRef(10);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });
  const isDoneRef = useRef(false);
  const [canvasSize] = useState(window.innerWidth < 768 ? 280 : 400); const [isShaking, setIsShaking] = useState(false);
  useEffect(() => { audioCtrl.playBGM('boss'); return () => audioCtrl.stopBGM(); }, []);
  const kanji = queue[idx];

  const handleEvaluate = (evalType) => {
    onUpdateStat(kanji, evalType);
    if (evalType === 'easy' || evalType === 'good') {
      const newHp = hpRef.current - 1;
      hpRef.current = newHp;
      setHp(newHp);
      earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 20, coins: earnedRef.current.coins + 5, perfectCount: evalType === 'easy' ? earnedRef.current.perfectCount + 1 : earnedRef.current.perfectCount };
      audioCtrl.playSE('boss_hit'); setIsShaking(true); setTimeout(() => setIsShaking(false), 500);
      // FIX: ref値で判定（stale closureなし）
      if (newHp <= 0 && !isDoneRef.current) {
        isDoneRef.current = true;
        setTimeout(() => onFinish({ ...earnedRef.current, rareDrop: 't_gold_castle' }), 1200);
        return;
      }
    } else { audioCtrl.playSE('stamp_bad'); }
    setTimeout(() => { setIdx(prev => (prev + 1) % queue.length); }, 1000);
  };

  if (!kanji) return null;
  const sidebar = (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-slate-800 border-[4px] border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0_#0f172a] text-center relative overflow-hidden">
        <motion.div animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : { y: [-5, 5, -5] }} transition={isShaking ? { duration: 0.2 } : { repeat: Infinity, duration: 2 }} className="w-32 h-32 mx-auto mb-2 relative z-10"><SvgGhostBoss /></motion.div>
        <div className="text-xs font-bold text-rose-500 mb-1 z-10 relative">ボスの体力</div>
        <div className="w-full bg-slate-900 h-6 rounded-full border-[3px] border-slate-700 overflow-hidden z-10 relative">
          <motion.div animate={{ width: `${(Math.max(hp, 0) / 10) * 100}%` }} transition={{ type: 'spring', stiffness: 300 }} className="h-full bg-rose-600" />
        </div>
        <div className="text-lg font-black text-rose-400 mt-1">{Math.max(hp, 0)} / 10</div>
      </div>
      <div className="bg-slate-800 border-[4px] border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0_#0f172a]">
        <div className="text-sm font-bold bg-slate-900 text-rose-500 px-4 py-1.5 rounded-full mx-auto w-max mb-4">ボスの弱点（よみ）</div>
        <div className="text-2xl md:text-3xl font-black text-white text-center">{kanji.on.length > 0 ? kanji.on.join(' / ') : ''}{kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>)) : ''}</div>
      </div>
      <div className="bg-slate-800 border-[3px] border-slate-700 rounded-xl p-3 text-center">
        <div className="text-xs font-bold text-slate-400">獲得EXP <span className="text-yellow-400 font-black">+{earnedRef.current.exp}</span></div>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full bg-slate-900 rounded-[24px] p-2 md:p-4 border-[4px] border-slate-700">
      <div className="flex-1 bg-slate-800 rounded-[20px] border-[4px] border-slate-900 flex items-center justify-center overflow-auto p-2 md:p-8 relative min-h-[40vh] md:min-h-0"><TestMode kanji={kanji} onEvaluate={handleEvaluate} canvasSize={canvasSize} commonSidebar={null} /></div>
      <div className="w-full lg:w-[340px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-6 lg:pb-0">{sidebar}</div>
    </div>
  );
};

// ==========================================
// ==========================================
// ✅ ResultView — セッション結果（住民誕生・ストーリー・アイテム）
// ==========================================
const gachaRoll = () => {
  const totalWeight = GACHA_POOL.reduce((s, t) => s + t.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const tier of GACHA_POOL) { rand -= tier.weight; if (rand <= 0) return tier.items[Math.floor(Math.random() * tier.items.length)]; }
  return GACHA_POOL[0].items[0];
};

const ResultView = ({ sessionMetrics, oldExp, setView, stats, setStats }) => {
  const { earnedExp, perfectCount, unlockedItems, rareDrop, newVillager } = sessionMetrics;
  const [showConfetti, setShowConfetti] = useState(earnedExp > 20 || !!newVillager);
  const [gachaResult, setGachaResult] = useState(null);
  const [gachaPhase, setGachaPhase] = useState('idle');
  const coinBonus = Math.floor(earnedExp / 2);

  const masteredCount = Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length;
  const currentStage = STORY_STAGES.slice().reverse().find(s => masteredCount >= s.minKanji && (stats.population || 0) >= s.minPop) || STORY_STAGES[0];
  const nextStage = STORY_STAGES.find(s => s.id === currentStage.id + 1);

  useEffect(() => {
    if (showConfetti) {
      audioCtrl.playSE(newVillager ? 'rare' : 'chest_open');
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, []);

  const unlockedItemDefs = (unlockedItems || []).map(id => TOWN_ITEMS.find(i => i.id === id)).filter(Boolean);
  const rareItemDef = rareDrop ? TOWN_ITEMS.find(i => i.id === rareDrop) : null;

  const handleGacha = () => {
    if ((stats.coins || 0) < 100) { audioCtrl.playSE('stamp_bad'); return; }
    audioCtrl.playSE('gacha'); setGachaPhase('spinning');
    const result = gachaRoll();
    setTimeout(() => {
      setGachaResult(result); setGachaPhase('reveal');
      const isRare = GACHA_POOL.findIndex(t => t.items.includes(result)) >= 3;
      audioCtrl.playSE(isRare ? 'rare' : 'chest_open');
      const newStats = { ...stats, coins: Math.max(0, (stats.coins || 0) - 100), townItems: { ...stats.townItems, [result]: (stats.townItems?.[result] || 0) + 1 } };
      setStats(newStats); StorageAPI.saveStats(newStats);
    }, 1200);
  };

  return (
    <div className="flex flex-col gap-4 pb-8 pt-2">
      <Confetti active={showConfetti} />

      {/* ストーリーナレーション */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] text-center">
        <div className="text-4xl mb-1">{currentStage.emoji}</div>
        <div className="font-black text-[var(--primary)] text-lg">{currentStage.title}</div>
        <p className="text-xs text-[var(--text)] opacity-60 mt-1 leading-relaxed">{currentStage.desc}</p>
        {nextStage && (
          <div className="mt-2 text-[10px] text-[var(--text)] opacity-40 bg-[var(--bg)] rounded-lg px-2 py-1">
            次のステージまで：漢字{Math.max(0, nextStage.minKanji - masteredCount)}文字 / 人口{Math.max(0, nextStage.minPop - (stats.population || 0))}人
          </div>
        )}
      </motion.div>

      {/* 住民誕生 */}
      {newVillager && (
        <motion.div initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          className="bg-emerald-50 border-[4px] border-emerald-400 rounded-2xl p-4 shadow-[4px_4px_0_#059669] flex items-center gap-4">
          <div className="w-14 h-14 shrink-0 bg-emerald-100 rounded-2xl flex items-center justify-center border-[3px] border-emerald-400">
            <SvgVillager />
          </div>
          <div className="flex-1">
            <div className="font-black text-emerald-700 text-base">🎉 新しい住民が誕生！</div>
            <div className="text-sm text-emerald-600 mt-0.5">
              「<span className="font-black text-xl" style={{ fontFamily: "'Klee One',serif" }}>{newVillager.kanjiChar}</span>」を習得した住民が街にやってきた！
            </div>
            <div className="text-xs text-emerald-500 mt-1">現在の人口：{stats.population || 0}人</div>
          </div>
        </motion.div>
      )}

      {/* EXP・コイン・Perfect */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '獲得EXP', value: earnedExp, icon: '⚡', color: 'bg-amber-50 border-amber-300' },
          { label: 'まちコイン', value: coinBonus, icon: '🪙', color: 'bg-yellow-50 border-yellow-300', prefix: '+' },
          { label: 'Perfect', value: perfectCount, icon: '💮', color: 'bg-rose-50 border-rose-300' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
            className={`${stat.color} rounded-2xl border-[3px] p-3 text-center shadow-sm`}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-2xl font-black text-[var(--text)]">{stat.prefix}<AnimatedCounter target={stat.value} duration={1000} /></div>
            <div className="text-xs font-bold text-[var(--text)] opacity-60">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* 解放アイテム */}
      {(unlockedItemDefs.length > 0 || rareItemDef) && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
          className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
          <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
            <Gift size={18} className="text-[var(--primary)]" /> まちのアイテムをゲット！
          </div>
          <div className="flex flex-wrap gap-3 justify-center">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.6 + i * 0.1 }}
                className={`${item.bg} w-16 h-16 rounded-xl border-[3px] border-[var(--text)] shadow-sm relative overflow-hidden flex items-center justify-center`}>
                <item.svg />
                {rareItemDef && item.id === rareItemDef.id && <div className="absolute top-0 right-0 text-[8px] font-black bg-yellow-400 text-yellow-900 px-1 rounded-bl-lg">RARE</div>}
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 justify-center mt-2">
            {[...unlockedItemDefs, ...(rareItemDef ? [rareItemDef] : [])].map((item, i) => (
              <span key={i} className="text-xs font-bold text-[var(--text)] opacity-60 bg-[var(--bg)] px-2 py-0.5 rounded-full">{item.name}</span>
            ))}
          </div>
        </motion.div>
      )}

      {/* ガチャ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-black text-center mb-3 flex items-center justify-center gap-2">
          <Sparkles size={18} className="text-amber-500" /> まちのガチャ
        </div>
        {gachaPhase === 'idle' && (
          <div>
            <MotionButton variant="accent" onClick={handleGacha} disabled={(stats.coins || 0) < 100}
              className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_3px_0_#b45309]">
              <Coins size={18} /> 100コインでひく
            </MotionButton>
            {(stats.coins || 0) < 100 && <p className="text-xs text-center text-[var(--text)] opacity-40 mt-2">コインが足りません（現在 {stats.coins || 0}枚）</p>}
          </div>
        )}
        {gachaPhase === 'spinning' && (
          <div className="text-center py-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.4, ease: 'linear' }} className="text-4xl inline-block">🎲</motion.div>
            <div className="text-sm font-bold text-[var(--text)] opacity-60 mt-2">ひいています...</div>
          </div>
        )}
        {gachaPhase === 'reveal' && gachaResult && (() => {
          const item = TOWN_ITEMS.find(i => i.id === gachaResult);
          const isRare = GACHA_POOL.findIndex(t => t.items.includes(gachaResult)) >= 3;
          return (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }} className="flex flex-col items-center gap-2">
              {isRare && <div className="text-xs font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-full border-2 border-amber-400 animate-pulse">✨ レアアイテム！</div>}
              <div className={`w-20 h-20 ${item?.bg || 'bg-gray-100'} rounded-2xl border-[3px] border-[var(--text)] shadow-lg flex items-center justify-center`}>
                {item && <item.svg />}
              </div>
              <div className="font-black text-[var(--text)]">{item?.name}</div>
              <MotionButton variant="secondary" onClick={() => setGachaPhase('idle')} className="px-4 py-2 text-sm border-[2px] border-[var(--text)] shadow-sm mt-1">もう一度ひく</MotionButton>
            </motion.div>
          );
        })()}
      </motion.div>

      {/* ボタン */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="flex flex-col gap-3">
        <MotionButton variant="primary" onClick={() => setView('home')} className="w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">まちに もどる 🏠</MotionButton>
        <MotionButton variant="secondary" onClick={() => setView('townEditor')} className="w-full py-4 text-lg border-[3px] border-[var(--text)] shadow-[0_4px_0_var(--text)]">
          <Map size={20} /> まちをつくる
        </MotionButton>
      </motion.div>
    </div>
  );
};

// ==========================================
// ✅ NEW: DictionaryView — 漢字ずかん
// ==========================================
const DictionaryView = ({ kanjiStats, onBack, onSelectKanji }) => {
  const [search, setSearch] = useState(''); const [filterGrade, setFilterGrade] = useState(0);
  const filtered = KANJI_DATA.filter(k => {
    const matchGrade = filterGrade === 0 || k.grade === filterGrade;
    const matchSearch = search === '' || k.char.includes(search) || k.on.some(o => o.includes(search.toUpperCase())) || k.kun.some(ku => ku.includes(search));
    return matchGrade && matchSearch;
  });
  const getStatusColor = (id) => { const s = kanjiStats?.[id]?.status; if (s === 'mastered') return 'bg-emerald-100 border-emerald-400'; if (s === 'learning') return 'bg-sky-100 border-sky-400'; return 'bg-gray-100 border-gray-300'; };
  const getStatusLabel = (id) => { const s = kanjiStats?.[id]?.status; if (s === 'mastered') return '習得'; if (s === 'learning') return '学習中'; return '未学習'; };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Library size={24} className="text-[var(--secondary)]" /> 漢字ずかん</h2>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="漢字・読みで検索" className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 py-2.5 font-bold text-[var(--text)] placeholder:opacity-40 focus:outline-none focus:border-[var(--primary)]" /></div>
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {[0, 1, 2, 3, 4, 5, 6].map(g => (
          <button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-full text-sm font-black whitespace-nowrap border-[2px] transition-all ${filterGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
            {g === 0 ? 'すべて' : `${g}年`}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {filtered.map(k => (
          <motion.button key={k.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { audioCtrl.playSE('click'); onSelectKanji(k); }} className={`${getStatusColor(k.id)} rounded-2xl border-[3px] p-3 flex flex-col items-center gap-1 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="text-4xl font-black text-[var(--text)]" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</div>
            <div className="text-[10px] font-bold text-[var(--text)] opacity-60">{k.on[0] || k.kun[0] || ''}</div>
            <div className="text-[9px] font-black bg-white/70 px-2 py-0.5 rounded-full border border-current opacity-70">{getStatusLabel(k.id)}</div>
          </motion.button>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 text-[var(--text)] opacity-40 font-bold">見つかりませんでした</div>}
    </div>
  );
};

// ==========================================
// ✅ TownEditorView — まちをつくる（Undo追加）
// ==========================================
const TownEditorView = ({ setView, stats, setStats }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [localMap, setLocalMap] = useState({ ...(stats.townMap || {}) });
  const [history, setHistory] = useState([{ ...(stats.townMap || {}) }]); // undo履歴
  const [historyIdx, setHistoryIdx] = useState(0);

  const pushHistory = (newMap) => {
    const trimmed = history.slice(0, historyIdx + 1);
    const next = [...trimmed, { ...newMap }].slice(-20); // 最大20ステップ
    setHistory(next); setHistoryIdx(next.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setLocalMap({ ...prev }); setHistoryIdx(historyIdx - 1); audioCtrl.playSE('click');
  };

  // 地形タイル以外でインベントリにあるものだけパレット表示
  const availableItems = TOWN_ITEMS.filter(item => {
    if (item.type === 'terrain') return false; // 地形は非表示
    const count = stats.townItems?.[item.id] || 0;
    const inMap = Object.values(localMap).filter(v => v === item.id).length;
    return count > inMap;
  });

  const filteredItems = availableItems.filter(item => filterType === 'all' || item.type === filterType);

  // 更地・雑草にのみ配置可。荒れ地タップで開拓。
  const handleCellTap = (x, y) => {
    const key = `${x},${y}`;
    const currentTile = localMap[key];

    // 荒れ地 → コイン1枚で更地に開拓
    if (currentTile === 't_roughland') {
      if ((stats.coins || 0) < 1) { audioCtrl.playSE('stamp_bad'); return; }
      const newMap = { ...localMap, [key]: 't_cleared' };
      setLocalMap(newMap); pushHistory(newMap);
      const newStats = { ...stats, coins: stats.coins - 1 };
      setStats(newStats); StorageAPI.saveStats(newStats);
      audioCtrl.playSE('place'); return;
    }

    // けしゴム：地形以外を更地に戻してインベントリ返却
    if (selectedItem === 'eraser') {
      const item = TOWN_ITEMS.find(i => i.id === currentTile);
      if (item && item.type !== 'terrain') {
        const newMap = { ...localMap, [key]: 't_cleared' };
        setLocalMap(newMap); pushHistory(newMap);
        setStats(s => ({ ...s, townItems: { ...s.townItems, [currentTile]: (s.townItems?.[currentTile] || 0) + 1 } }));
        audioCtrl.playSE('click');
      }
      return;
    }

    if (!selectedItem) return;
    if (currentTile !== 't_cleared' && currentTile !== 't_weed') { audioCtrl.playSE('stamp_bad'); return; }
    const newMap = { ...localMap, [key]: selectedItem };
    setLocalMap(newMap); pushHistory(newMap); audioCtrl.playSE('place');
  };

  const handleSave = () => {
    const newStats = { ...stats, townMap: localMap }; setStats(newStats); StorageAPI.saveStatsImmediate(newStats);
    audioCtrl.playSE('success'); setView('home');
  };

  // コインで購入（priceのあるアイテム用）
  const handleBuy = (item) => {
    if ((stats.coins || 0) < item.price) { audioCtrl.playSE('stamp_bad'); return; }
    const newStats = { ...stats, coins: stats.coins - item.price, townItems: { ...stats.townItems, [item.id]: (stats.townItems?.[item.id] || 0) + 1 } };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('coin');
  };

  return (
    <div className="flex flex-col h-full gap-3 p-3 md:p-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={22} /></button>
          <h2 className="text-xl font-black text-[var(--text)] flex items-center gap-1"><Map size={20} className="text-[var(--accent)]" /> まちをつくる</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1.5 rounded-full text-[var(--text)] border-[3px] border-[var(--text)] font-black text-sm shadow-sm"><Coins size={16} />{stats.coins}</span>
          <button onClick={handleUndo} disabled={historyIdx <= 0} aria-label="元に戻す" className={`p-2 rounded-full border-[2px] border-[var(--text)] min-w-[40px] min-h-[40px] flex items-center justify-center transition-all ${historyIdx <= 0 ? 'opacity-30' : 'hover:bg-[var(--bg)]'}`}><Undo2 size={18} /></button>
          <MotionButton variant="success" onClick={handleSave} className="px-4 py-2 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46] min-h-[40px]">保存</MotionButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DraggableTownMap mapData={localMap} isDanger={false} isEditing={true} onCellTap={handleCellTap} reviewCount={0} kakejikuImg={stats.kakejiku} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 2} />
        {/* 操作ヒント */}
        <div className="absolute top-2 left-2 bg-[var(--panel)]/90 border-[2px] border-[var(--text)] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[var(--text)] pointer-events-none z-40 leading-relaxed">
          🟫 荒れ地タップ → 開拓（🪙1枚）<br/>
          👥 人口 {stats.population}人
        </div>
        {selectedItem && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-full px-4 py-2 shadow-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap z-40">
            {selectedItem === 'eraser' ? <><Eraser size={16} /> けしゴムモード</> : <>{TOWN_ITEMS.find(i => i.id === selectedItem)?.name} を配置中</>}
            <button onClick={() => setSelectedItem(null)} aria-label="選択解除" className="ml-1 text-[var(--text)] opacity-50 hover:opacity-100 text-lg leading-none w-6 h-6 flex items-center justify-center">✕</button>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 shadow-[4px_4px_0_var(--text)]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {[
            { key: 'all', label: 'すべて' }, { key: 'nature', label: '自然' }, { key: 'building', label: '建物' }, { key: 'special', label: '特別' }
          ].map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 transition-all min-h-[36px] ${filterType === f.key ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{f.label}</button>
          ))}
          <button onClick={() => setSelectedItem('eraser')} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 flex items-center gap-1 transition-all min-h-[36px] ${selectedItem === 'eraser' ? 'bg-rose-500 text-white border-rose-700' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}><Eraser size={12} /> けす</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filteredItems.map(item => {
            const count = (stats.townItems?.[item.id] || 0) - Object.values(localMap).filter(v => v === item.id).length;
            const isSelected = selectedItem === item.id;
            const canAfford = stats.coins >= item.price;
            const owned = count > 0;
            return (
              <div key={item.id} onClick={() => { if (owned) { setSelectedItem(item.id); audioCtrl.playSE('click'); } else if (canAfford) { handleBuy(item); } else { audioCtrl.playSE('stamp_bad'); } }} className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer rounded-xl border-[3px] w-16 h-20 overflow-hidden transition-all select-none ${isSelected ? 'border-[var(--primary)] scale-110 shadow-lg' : 'border-[var(--text)] opacity-80 hover:opacity-100 hover:scale-105'} ${item.bg}`}>
                <div className="w-12 h-12 flex items-center justify-center pointer-events-none"><item.svg /></div>
                <div className="text-[8px] font-black text-[var(--text)] px-1 text-center leading-tight">{item.name}</div>
                {owned ? <div className="text-[9px] font-black bg-white/70 px-1.5 rounded-full">×{count}</div> : <div className={`text-[9px] font-black px-1.5 rounded-full flex items-center gap-0.5 ${canAfford ? 'bg-yellow-200' : 'bg-gray-200 opacity-50'}`}><Coins size={8} />{item.price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// ✅ NEW: AchievementView — 実績
// ==========================================
const AchievementView = ({ setView, stats, setStats }) => {
  const handleClaim = (achievement) => {
    const current = stats.achievements?.[achievement.id];
    if (!current || current.claimed || current.current < achievement.target) return;
    const newStats = { ...stats, coins: stats.coins + achievement.reward, achievements: { ...stats.achievements, [achievement.id]: { ...current, claimed: true } } };
    if (achievement.rewardItem) newStats.townItems = { ...newStats.townItems, [achievement.rewardItem]: (newStats.townItems?.[achievement.rewardItem] || 0) + 1 };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('chest_open');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Medal size={24} className="text-amber-500" /> 実績</h2>
      </div>
      <div className="flex flex-col gap-3">
        {ACHIEVEMENTS.map(a => {
          const progress = stats.achievements?.[a.id] || { claimed: false, current: 0 };
          const pct = Math.min((progress.current / a.target) * 100, 100);
          const canClaim = progress.current >= a.target && !progress.claimed;
          const rewardItemDef = a.rewardItem ? TOWN_ITEMS.find(i => i.id === a.rewardItem) : null;

          return (
            <div key={a.id} className={`bg-[var(--panel)] border-[4px] rounded-2xl p-4 shadow-sm transition-all ${canClaim ? 'border-amber-400 shadow-[4px_4px_0_#b45309]' : progress.claimed ? 'border-emerald-400 opacity-70' : 'border-[var(--text)]'}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {progress.claimed ? <Trophy size={18} className="text-emerald-500 shrink-0" /> : canClaim ? <Gift size={18} className="text-amber-500 shrink-0" /> : <Lock size={18} className="text-[var(--text)] opacity-30 shrink-0" />}
                    <span className="font-black text-[var(--text)]">{a.name}</span>
                  </div>
                  <p className="text-xs text-[var(--text)] opacity-60 mb-2">{a.desc}</p>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden border border-gray-300">
                    <motion.div animate={{ width: `${pct}%` }} className={`h-full rounded-full ${progress.claimed ? 'bg-emerald-400' : canClaim ? 'bg-amber-400' : 'bg-[var(--secondary)]'}`} />
                  </div>
                  <div className="text-xs font-bold text-[var(--text)] opacity-50 mt-1">{progress.current} / {a.target}</div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs font-black text-amber-600"><Coins size={12} />{a.reward}</div>
                  {rewardItemDef && <div className={`w-10 h-10 ${rewardItemDef.bg} rounded-lg border-2 border-[var(--text)] flex items-center justify-center`}><rewardItemDef.svg /></div>}
                  {canClaim && (<MotionButton variant="accent" onClick={() => handleClaim(a)} className="px-3 py-1.5 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#b45309] mt-1">うけとる！</MotionButton>)}
                  {progress.claimed && <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-300">受取済</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==========================================
// ✅ MyDrillsView — マイドリル一覧（削除機能追加）
// ==========================================
const MyDrillsView = ({ setView, stats, setStats, startDrillSession, setHostDrill }) => {
  const drills = stats.myDrills || [];
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (idx) => {
    const newDrills = drills.filter((_, i) => i !== idx);
    const newStats = { ...stats, myDrills: newDrills };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('click'); setConfirmDelete(null);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><FileText size={24} className="text-[var(--secondary)]" /> マイドリル</h2>
        </div>
        <MotionButton variant="primary" onClick={() => setView('drillEditor')} className="px-4 py-2 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239] min-h-[44px]"><Plus size={16} /> 作る</MotionButton>
      </div>
      {drills.length === 0 ? (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-bold text-[var(--text)] opacity-60">ドリルがまだありません</p>
          <p className="text-sm text-[var(--text)] opacity-40 mt-1">「作る」ボタンで作成しよう</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {drills.map((drill, i) => (
            <div key={i} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-black text-[var(--text)] text-lg truncate">{drill.name}</div>
                <div className="text-sm text-[var(--text)] opacity-60">{drill.kanjis?.length || 0}文字</div>
                <div className="flex flex-wrap gap-1 mt-1">{(drill.kanjis || []).slice(0, 8).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-lg font-black">{k.char}</span> : null; })}{(drill.kanjis?.length || 0) > 8 && <span className="text-xs font-bold text-[var(--text)] opacity-50 self-center">+{drill.kanjis.length - 8}</span>}</div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <MotionButton variant="primary" onClick={() => startDrillSession(drill)} className="px-3 py-2 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#9f1239] min-h-[36px]"><PenTool size={14} /> 練習</MotionButton>
                <MotionButton variant="accent" onClick={() => { setHostDrill(drill); setView('peerHost'); }} className="px-3 py-2 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_#b45309] min-h-[36px]"><Share2 size={14} /> 送る</MotionButton>
                <button onClick={() => setConfirmDelete(i)} aria-label="ドリルを削除" className="px-3 py-2 text-xs border-[2px] border-rose-300 text-rose-500 rounded-[16px] font-bold hover:bg-rose-50 transition-colors min-h-[36px] flex items-center gap-1"><Trash2 size={14} /> 削除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 削除確認モーダル */}
      <AnimatePresence>
        {confirmDelete !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[8px_8px_0_var(--text)] max-w-sm w-full">
              <div className="text-3xl text-center mb-3">🗑️</div>
              <p className="font-black text-[var(--text)] text-center text-lg mb-1">「{drills[confirmDelete]?.name}」</p>
              <p className="text-sm text-[var(--text)] opacity-60 text-center mb-4">を削除してもよいですか？</p>
              <div className="flex gap-3">
                <MotionButton variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]">キャンセル</MotionButton>
                <MotionButton variant="primary" onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]">削除する</MotionButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// ✅ NEW: DrillEditorView — ドリル作成
// ==========================================
const DrillEditorView = ({ setView, stats, setStats }) => {
  const [drillName, setDrillName] = useState('');
  const [selectedKanjis, setSelectedKanjis] = useState([]);
  const [filterGrade, setFilterGrade] = useState(0);

  const toggleKanji = (id) => { setSelectedKanjis(prev => prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id]); audioCtrl.playSE('click'); };

  const handleSave = () => {
    if (!drillName.trim() || selectedKanjis.length === 0) { audioCtrl.playSE('stamp_bad'); return; }
    const newDrill = { name: drillName.trim(), kanjis: selectedKanjis, createdAt: Date.now() };
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), newDrill] };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('success'); setView('myDrills');
  };

  const filtered = KANJI_DATA.filter(k => filterGrade === 0 || k.grade === filterGrade);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)]">ドリルを作る</h2>
      </div>
      <input value={drillName} onChange={e => setDrillName(e.target.value)} placeholder="ドリルの名前を入力" className="w-full bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl px-4 py-3 font-bold text-[var(--text)] placeholder:opacity-40 focus:outline-none focus:border-[var(--primary)] text-lg" />
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {[0, 1, 2, 3, 4, 5, 6].map(g => (<button key={g} onClick={() => setFilterGrade(g)} className={`px-3 py-1.5 rounded-full text-sm font-black whitespace-nowrap border-[2px] transition-all ${filterGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--panel)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g === 0 ? 'すべて' : `${g}年`}</button>))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {filtered.map(k => {
          const sel = selectedKanjis.includes(k.id);
          return (
            <button key={k.id} onClick={() => toggleKanji(k.id)} className={`py-3 rounded-xl border-[3px] font-black text-2xl transition-all ${sel ? 'bg-[var(--primary)] text-[var(--panel)] border-[var(--primary)] scale-105 shadow-md' : 'bg-[var(--panel)] text-[var(--text)] border-[var(--text)] opacity-70 hover:opacity-100'}`} style={{ fontFamily: "'Klee One', serif" }}>
              {k.char}
            </button>
          );
        })}
      </div>
      <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-3 flex items-center justify-between">
        <span className="font-bold text-[var(--text)]">{selectedKanjis.length}文字 選択中</span>
        {selectedKanjis.length > 0 && <div className="flex gap-1">{selectedKanjis.slice(0, 6).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null; })}</div>}
      </div>
      <MotionButton variant="primary" onClick={handleSave} disabled={!drillName.trim() || selectedKanjis.length === 0} className="w-full py-5 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239]">保存する</MotionButton>
    </div>
  );
};

// ==========================================
// ✅ NEW: TeacherHostView — 先生側P2P送信
// ==========================================
const TeacherHostView = ({ setView, drill }) => {
  const isPeerLoaded = usePeerJS();
  const [peerId, setPeerId] = useState('');
  const [status, setStatus] = useState('起動中...');
  const peerRef = useRef(null);

  useEffect(() => {
    if (!isPeerLoaded || !drill) return;
    try {
      const peer = new window.Peer();
      peerRef.current = peer;
      peer.on('open', id => { setPeerId(id); setStatus('生徒の接続を待っています'); });
      peer.on('connection', conn => {
        setStatus('生徒が接続しました！送信中...');
        conn.on('open', () => {
          conn.send(JSON.stringify({ type: 'drill', data: drill }));
          setTimeout(() => setStatus('送信完了！'), 500);
        });
      });
      peer.on('error', () => setStatus('エラーが発生しました'));
      return () => { peer.destroy(); };
    } catch (e) { setStatus('PeerJS の初期化に失敗しました'); }
  }, [isPeerLoaded, drill]);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('myDrills')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Wifi size={22} /> ドリルを送る</h2>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)] flex flex-col items-center gap-4">
        <div className="text-4xl">{status.includes('完了') ? '✅' : status.includes('エラー') ? '❌' : '📡'}</div>
        <div className="font-bold text-[var(--text)] text-center">{status}</div>
        {peerId && (
          <>
            <div className="bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-6 py-3 font-black text-2xl tracking-widest text-[var(--primary)]">{peerId}</div>
            <p className="text-sm text-[var(--text)] opacity-60 text-center">このIDを生徒に伝えてください</p>
          </>
        )}
        {!isPeerLoaded && <div className="text-sm text-[var(--text)] opacity-50">PeerJS を読み込み中...</div>}
      </div>
      {drill && (
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl p-4">
          <div className="font-black text-[var(--text)] mb-2">送るドリル：{drill.name}</div>
          <div className="flex flex-wrap gap-1">{(drill.kanjis || []).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-xl font-black">{k.char}</span> : null; })}</div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ✅ NEW: StudentClientView — 生徒側P2P受信
// ==========================================
const StudentClientView = ({ setView, stats, setStats }) => {
  const isPeerLoaded = usePeerJS();
  const [hostId, setHostId] = useState('');
  const [status, setStatus] = useState('');
  const [receivedDrill, setReceivedDrill] = useState(null);
  const peerRef = useRef(null);

  const handleConnect = () => {
    if (!isPeerLoaded || !hostId.trim()) return;
    try {
      if (peerRef.current) peerRef.current.destroy();
      const peer = new window.Peer();
      peerRef.current = peer;
      setStatus('接続中...');
      peer.on('open', () => {
        const conn = peer.connect(hostId.trim());
        conn.on('open', () => setStatus('接続しました！データを待っています'));
        conn.on('data', data => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'drill') {
              setReceivedDrill(parsed.data);
              setStatus('ドリルを受け取りました！');
              audioCtrl.playSE('chest_open');
            }
          } catch (e) { setStatus('データの受け取りに失敗しました'); }
        });
        conn.on('error', () => setStatus('接続エラーが発生しました'));
      });
      peer.on('error', () => setStatus('接続に失敗しました。IDを確認してください'));
    } catch (e) { setStatus('PeerJS の初期化に失敗しました'); }
  };

  const handleSaveDrill = () => {
    if (!receivedDrill) return;
    const newStats = { ...stats, myDrills: [...(stats.myDrills || []), { ...receivedDrill, createdAt: Date.now() }] };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('success'); setView('myDrills');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><Download size={22} /> 通信でもらう</h2>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-5 shadow-[4px_4px_0_var(--text)] flex flex-col gap-3">
        <div className="text-sm font-bold text-[var(--text)] opacity-70">先生から教えてもらったIDを入力してください</div>
        <input value={hostId} onChange={e => setHostId(e.target.value)} placeholder="ID を入力" className="w-full bg-[var(--bg)] border-[3px] border-[var(--text)] rounded-xl px-4 py-3 font-black text-[var(--text)] placeholder:opacity-30 focus:outline-none focus:border-[var(--primary)] text-xl tracking-widest" />
        <MotionButton variant="primary" onClick={handleConnect} disabled={!isPeerLoaded || !hostId.trim()} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239]">
          <Wifi size={20} /> つなぐ
        </MotionButton>
        {!isPeerLoaded && <div className="text-xs text-center text-[var(--text)] opacity-50">PeerJS 読み込み中...</div>}
      </div>
      {status !== '' && (
        <div className={`border-[3px] rounded-xl p-4 font-bold text-center transition-colors ${status.includes('受け取り') ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : status.includes('エラー') || status.includes('失敗') ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-[var(--bg)] border-[var(--text)] text-[var(--text)]'}`}>
          {status}
        </div>
      )}
      {receivedDrill && (
        <div className="bg-[var(--panel)] border-[4px] border-emerald-400 rounded-2xl p-5 shadow-[4px_4px_0_#059669] flex flex-col gap-3">
          <div className="font-black text-[var(--text)] text-lg flex items-center gap-2"><Gift size={20} className="text-emerald-500" /> {receivedDrill.name}</div>
          <div className="flex flex-wrap gap-1">{(receivedDrill.kanjis || []).map(id => { const k = KANJI_DATA.find(k => k.id === id); return k ? <span key={id} className="text-2xl font-black">{k.char}</span> : null; })}</div>
          <MotionButton variant="success" onClick={handleSaveDrill} className="w-full py-4 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#065f46]">
            マイドリルに保存する
          </MotionButton>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ✅ NEW: StatsView — 学習統計・進捗
// ==========================================
const StatsView = ({ setView, stats }) => {
  const kanjiList = KANJI_DATA.map(k => ({ ...k, stat: stats.kanjiStats?.[k.id] }));
  const mastered = kanjiList.filter(k => k.stat?.status === 'mastered').length;
  const learning = kanjiList.filter(k => k.stat?.status === 'learning' || k.stat?.status === 'review').length;
  const notYet = kanjiList.filter(k => !k.stat || k.stat?.status === 'new').length;
  const totalKanji = KANJI_DATA.length;

  // 直近7日の学習データ
  const dailyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();
      const label = i === 0 ? '今日' : i === 1 ? '昨日' : `${d.getDate()}日`;
      days.push({ label, exp: stats.daily?.[key]?.exp || 0, reviewed: stats.daily?.[key]?.reviewed || 0 });
    }
    return days;
  }, [stats.daily]);

  const maxExp = Math.max(...dailyData.map(d => d.exp), 1);

  // 苦手な漢字 top5
  const weakKanji = kanjiList
    .filter(k => k.stat && (k.stat.mistakes || 0) > 0)
    .sort((a, b) => (b.stat.mistakes || 0) - (a.stat.mistakes || 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={24} /></button>
        <h2 className="text-2xl font-black text-[var(--text)] flex items-center gap-2"><BarChart3 size={24} className="text-[var(--secondary)]" /> 学習きろく</h2>
      </div>

      {/* 習得状況サマリー */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-black text-[var(--text)] opacity-60 mb-3 text-center">漢字の習得状況（全{totalKanji}文字）</div>
        <div className="flex h-6 rounded-full overflow-hidden border-[2px] border-[var(--text)] mb-2">
          {mastered > 0 && <div className="bg-emerald-400 transition-all" style={{ width: `${(mastered / totalKanji) * 100}%` }} title={`習得: ${mastered}`} />}
          {learning > 0 && <div className="bg-sky-400 transition-all" style={{ width: `${(learning / totalKanji) * 100}%` }} title={`学習中: ${learning}`} />}
          <div className="bg-gray-200 flex-1" title={`未学習: ${notYet}`} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: '習得', count: mastered, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
            { label: '学習中', count: learning, color: 'text-sky-600', bg: 'bg-sky-50 border-sky-200' },
            { label: '未学習', count: notYet, color: 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
          ].map((s, i) => (
            <div key={i} className={`${s.bg} border-2 rounded-xl p-2`}>
              <div className={`text-2xl font-black ${s.color}`}>{s.count}</div>
              <div className="text-xs font-bold text-[var(--text)] opacity-60">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 連続学習ストリーク */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">🔥</div>
          <div className="text-3xl font-black text-[var(--primary)]">{stats.streak || 0}</div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">連続学習日数</div>
        </div>
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm text-center">
          <div className="text-3xl mb-1">⚡</div>
          <div className="text-3xl font-black text-amber-500">{(stats.totalExp || 0).toLocaleString()}</div>
          <div className="text-xs font-bold text-[var(--text)] opacity-60">累計EXP</div>
        </div>
      </div>

      {/* 7日間の学習グラフ */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
        <div className="text-sm font-black text-[var(--text)] mb-3 flex items-center gap-2"><TrendingUp size={16} className="text-[var(--secondary)]" /> 直近7日の学習EXP</div>
        <div className="flex items-end gap-2 h-24">
          {dailyData.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t-lg bg-[var(--secondary)] opacity-80 transition-all" style={{ height: `${Math.max((day.exp / maxExp) * 80, day.exp > 0 ? 8 : 2)}px` }} />
              <div className="text-[9px] font-bold text-[var(--text)] opacity-50 truncate w-full text-center">{day.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 苦手な漢字 */}
      {weakKanji.length > 0 && (
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-sm">
          <div className="text-sm font-black text-[var(--text)] mb-3 flex items-center gap-2"><AlertCircle size={16} className="text-rose-500" /> 苦手な漢字 TOP5</div>
          <div className="flex flex-col gap-2">
            {weakKanji.map((k, i) => (
              <div key={k.id} className="flex items-center gap-3 bg-[var(--bg)] rounded-xl px-3 py-2">
                <span className="text-2xl font-black" style={{ fontFamily: "'Klee One', serif" }}>{k.char}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text)]">{k.on[0] || k.kun[0] || ''}</div>
                  <div className="text-xs text-rose-500 font-bold">ミス {k.stat.mistakes}回</div>
                </div>
                <div className="text-lg">{'😅'.repeat(Math.min(i + 1, 3))}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
const HomeView = ({ setView, stats, setStats, startSession, startFlashcard, startSurvival, startBossBattle, levelInfo }) => {
  const { level, title, badge, progress } = levelInfo || getLevelInfo(stats.totalExp, stats.townMap);
  const now = Date.now();
  const [selectedGrade, setSelectedGrade] = useState(stats.targetGrade || 1);
  const handleGradeChange = (g) => { setSelectedGrade(g); let newStats = { ...stats, targetGrade: g }; setStats(newStats); StorageAPI.saveStats(newStats); };
  const reviewTargetsCount = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new' && stats.kanjiStats[k.id].nextReview <= now).length;
  const isReviewNeeded = reviewTargetsCount >= 3;
  const prosperity = calculateProsperity(stats.townMap, reviewTargetsCount);
  const isSpecialTrainingUnlocked = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new').length > 0;

  return (
    <div className="flex flex-col items-center gap-4 pb-6 h-full overflow-y-auto no-scrollbar">
      <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] shadow-[4px_4px_0_var(--text)] p-4 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-end shrink-0">
          <div className="text-left">
            <div className="text-xs font-bold text-[var(--text)] opacity-70 mb-0.5">{badge} {title}</div>
            <div className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-wide">マイタウン Lv.{level}</div>
          </div>
          <div className="text-right text-xs font-bold text-[var(--text)] opacity-60 mb-1 flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1 rounded-full text-[var(--text)] border-[3px] border-[var(--text)] font-black text-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)]"><Coins size={16} />{stats.coins}</span>
            <span className="font-bold flex items-center gap-1 text-[var(--primary)]"><TrendingUp size={14} /> 繁栄度: {prosperity}</span>
          </div>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]"><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[var(--secondary)]"></motion.div></div>
        <div className="w-full h-[150px] relative">
          <DraggableTownMap mapData={stats.townMap} isDanger={isReviewNeeded} isEditing={false} reviewCount={reviewTargetsCount} kakejikuImg={stats.kakejiku} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 2} />
        </div>
        {/* ストーリーステージ表示 */}
        {(() => {
          const masteredCount = Object.values(stats.kanjiStats || {}).filter(s => s.status === 'mastered').length;
          const stage = STORY_STAGES.slice().reverse().find(s => masteredCount >= s.minKanji && (stats.population || 0) >= s.minPop) || STORY_STAGES[0];
          const nextStage = STORY_STAGES.find(s => s.id === stage.id + 1);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--bg)] rounded-xl px-3 py-2 border-[2px] border-[var(--text)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{stage.emoji}</span>
                <div className="min-w-0">
                  <div className="font-black text-[var(--text)] text-sm truncate">{stage.title}</div>
                  <div className="text-[10px] text-[var(--text)] opacity-50 leading-tight truncate">{stage.desc}</div>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-black text-[var(--text)] opacity-60">👥 {stats.population || 0}人</div>
                {nextStage && <div className="text-[9px] text-[var(--text)] opacity-40">次: {nextStage.minKanji}字・{nextStage.minPop}人</div>}
              </div>
            </motion.div>
          );
        })()}
      </div>

      <div className="flex flex-col w-full gap-2 shrink-0">
        <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 flex flex-col gap-2 shadow-[2px_2px_0_var(--text)]">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {[1, 2, 3, 4, 5, 6].map(g => (
              <button key={g} onClick={() => { audioCtrl.playSE('click'); handleGradeChange(g); }} className={`flex-1 py-2 font-black text-sm rounded-xl border-[2px] transition-all whitespace-nowrap px-1 ${selectedGrade === g ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{g}年</button>
            ))}
          </div>
          <MotionButton variant={isReviewNeeded ? "danger" : "primary"} className="w-full py-5 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_4px_0_rgba(0,0,0,0.3)] mt-1" onClick={() => startSession(selectedGrade, isReviewNeeded)}>
            {isReviewNeeded ? <><ShieldAlert size={24} /> おばけを たいじする！</> : <><PenTool size={24} /> {selectedGrade}年生の 漢字を覚える！</>}
          </MotionButton>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full mt-1">
          <MotionButton variant="success" className="py-4 flex-col gap-1 text-sm border-[4px] border-[var(--text)] shadow-[0_4px_0_#065f46]" onClick={() => setView('myDrills')}><FileText size={24} /> マイドリル</MotionButton>
          <MotionButton variant="accent" className="py-4 flex-col gap-1 text-sm border-[4px] border-[var(--text)] shadow-[0_4px_0_#b45309]" onClick={() => setView('peerClient')}><Download size={24} /> 通信でもらう</MotionButton>
        </div>

        <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 flex flex-col gap-2 mt-1 relative overflow-hidden">
          {!isSpecialTrainingUnlocked && (
            <div className="absolute inset-0 z-10 bg-[var(--panel)]/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-xs font-bold text-[var(--text)] bg-[var(--bg)] px-3 py-1.5 rounded-full border-2 border-[var(--text)] flex items-center gap-1 shadow-sm"><AlertCircle size={14} className="text-amber-500" /> まずは漢字を覚えよう！</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <MotionButton variant="secondary" onClick={startFlashcard} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Zap size={20} className="text-amber-500" /> フラッシュ</MotionButton>
            <MotionButton variant="secondary" onClick={startSurvival} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Flame size={20} className="text-rose-500" /> サバイバル</MotionButton>
            <MotionButton variant="secondary" onClick={startBossBattle} disabled={!isSpecialTrainingUnlocked} className="flex-col py-3 border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] text-xs gap-1"><Ghost size={20} className="text-purple-500" /> ボスバトル</MotionButton>
          </div>
        </div>

        <div className="flex gap-2 mt-1">
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('dictionary')}><Library size={16} className="text-[var(--secondary)]" /> ずかん</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('townEditor')}><Map size={16} className="text-[var(--accent)]" /> まちをつくる</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('achievements')}><Medal size={16} className="text-amber-500" /> 実績</MotionButton>
          <MotionButton variant="secondary" className="py-3 flex-1 text-xs border-[3px] border-[var(--text)] shadow-sm min-h-[44px]" onClick={() => setView('stats')}><BarChart3 size={16} className="text-[var(--secondary)]" /> きろく</MotionButton>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 🚀 Main App
// ==========================================
export default function App() {
  const [view, setView] = useState('home');
  const [isMuted, setIsMuted] = useState(audioCtrl.muted);
  const [stats, setStats] = useState(StorageAPI.getStats());
  const [sessionData, setSessionData] = useState({ queue: [], earnedExp: 0, oldExp: 0, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, isExterminating: false, newVillager: null });
  const [hostDrill, setHostDrill] = useState(null);

  // レベル情報はメモ化してレンダリングコストを下げる
  const levelInfo = useMemo(() => getLevelInfo(stats.totalExp, stats.townMap), [stats.totalExp, stats.townMap]);

  useEffect(() => {
    const link1 = document.createElement('link'); link1.href = 'https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&display=swap'; link1.rel = 'stylesheet'; document.head.appendChild(link1);
    const link2 = document.createElement('link'); link2.href = 'https://fonts.googleapis.com/css2?family=Klee+One:wght@400;600&display=swap'; link2.rel = 'stylesheet'; document.head.appendChild(link2);
  }, []);

  useEffect(() => {
    if (!isMuted) { if (view === 'session' || view === 'survival' || view === 'flashcard' || view === 'boss') audioCtrl.playBGM(view === 'boss' ? 'boss' : 'game'); else if (view === 'result') { audioCtrl.stopBGM(); } else audioCtrl.playBGM('home'); }
    else audioCtrl.stopBGM();
  }, [view, isMuted]);

  const startSession = (selectedGrade, isExterminating = false) => {
    audioCtrl.init(); const now = Date.now();
    // レビュー対象：期日が来ているカード（上限20件）
    const reviewTargets = KANJI_DATA
      .filter(k => {
        const s = stats.kanjiStats?.[k.id];
        return s && s.status !== 'new' && (s.nextReview || 0) <= now;
      })
      .sort((a, b) => (stats.kanjiStats[a.id].nextReview || 0) - (stats.kanjiStats[b.id].nextReview || 0))
      .slice(0, 20);
    // 新出カード：退治モードでないときのみ、選択学年から最大5件、ランダム順
    const newTargets = isExterminating ? [] : KANJI_DATA
      .filter(k => k.grade === selectedGrade && (!stats.kanjiStats?.[k.id] || stats.kanjiStats[k.id].status === 'new'))
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);
    // レビューを先、新出を後に並べる（Anki方式）
    const queue = [...reviewTargets, ...newTargets];
    if (queue.length === 0) { const fallback = KANJI_DATA.find(k => k.grade === selectedGrade); if (fallback) queue.push(fallback); }
    if (queue.length > 0) { setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, isExterminating, newVillager: null }); setView('session'); }
  };

  const startDrillSession = (drill) => {
    audioCtrl.init(); const queue = KANJI_DATA.filter(k => drill.kanjis?.includes(k.id));
    if (queue.length > 0) { setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: true, newVillager: null }); setView('session'); }
  };

  const startSingleSession = (kanji) => { audioCtrl.init(); setSessionData({ queue: [kanji], earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('session'); };
  const startFlashcard = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new'); if (learned.length === 0) return; const queue = [...learned].sort(() => Math.random() - 0.5).slice(0, 10); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('flashcard'); };
  const startSurvival = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new' && k.examples && k.examples.length > 0); if (learned.length === 0) return; const queue = [...learned].sort(() => Math.random() - 0.5); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('survival'); };
  const startBossBattle = () => { audioCtrl.init(); const learned = KANJI_DATA.filter(k => stats.kanjiStats?.[k.id] && stats.kanjiStats[k.id].status !== 'new'); if (learned.length === 0) return; const queue = [...learned].sort((a, b) => { const ma = stats.kanjiStats[a.id].mistakes || 0; const mb = stats.kanjiStats[b.id].mistakes || 0; return mb - ma; }).slice(0, 10); while (queue.length > 0 && queue.length < 10) queue.push(queue[Math.floor(Math.random() * queue.length)]); setSessionData({ queue, earnedExp: 0, oldExp: stats.totalExp, perfectCount: 0, easyCount: 0, reviewedCount: 0, unlockedItems: [], rareDrop: null, bestKakejiku: null, isDrill: false, newVillager: null }); setView('boss'); };

  const handleUpdateStat = (kanjiObj, evalType) => {
    const id = kanjiObj.id;
    const cur = migrateCard(stats.kanjiStats?.[id]);
    if (sessionData.isDrill) { setSessionData(d => ({ ...d, earnedExp: d.earnedExp + (evalType === 'again' ? 0 : 5), reviewedCount: (d.reviewedCount || 0) + 1 })); return evalType !== 'again'; }

    const next = calculateNextReview(cur, evalType);
    const wasNew = cur.status === 'new';
    const isMastering = next.graduated && next.interval >= 7 * 24 * 60 * 60 * 1000;
    const newStatus = isMastering ? 'mastered' : next.graduated ? 'review' : 'learning';
    let exp = 0; let unlockedItem = null; let newVillager = null;

    if (evalType !== 'again') {
      exp = wasNew ? 50 : evalType === 'easy' ? 15 : evalType === 'good' ? 10 : 5;

      if (isMastering && cur.status !== 'mastered') {
        // アイテムアンロック
        const unlockId = kanjiObj.unlocks || KANJI_UNLOCK_EXTRA[id];
        if (unlockId && !stats.unlockedKanji?.includes(id)) {
          unlockedItem = unlockId;
          setStats(s => ({ ...s, unlockedKanji: [...(s.unlockedKanji || []), id] }));
        }

        // ── 住民誕生 ──
        // 更地セルをランダムに選んで住民を配置
        const C = 10;
        const radius = stats.exploredRadius || 2;
        const clearedKeys = Object.keys(stats.townMap || {}).filter(k => {
          const v = stats.townMap[k];
          return v === 't_cleared' || v === 't_grass' || v === 't_road';
        });
        const spawnKey = clearedKeys[Math.floor(Math.random() * clearedKeys.length)] || `${C},${C}`;
        const [vx, vy] = spawnKey.split(',').map(Number);
        newVillager = { id: `v_${Date.now()}`, x: vx, y: vy, kanjiChar: kanjiObj.char, born: Date.now() };

        // ── 探索半径を拡大 ──
        setStats(s => {
          const masteredCount = Object.values({ ...s.kanjiStats, [id]: { status: 'mastered' } }).filter(v => v.status === 'mastered').length;
          const targetStage = STORY_STAGES.slice().reverse().find(st => masteredCount >= st.minKanji) || STORY_STAGES[0];
          const newRadius = Math.max(s.exploredRadius || 2, targetStage.radius);
          if (newRadius <= (s.exploredRadius || 2)) return s;

          // 新しい探索範囲のセルを荒れ地→未配置に開放
          const newMap = { ...s.townMap };
          for (let dy = -newRadius; dy <= newRadius; dy++) {
            for (let dx = -newRadius; dx <= newRadius; dx++) {
              const nx = C + dx; const ny = C + dy;
              if (nx < 0 || nx > 19 || ny < 0 || ny > 19) continue;
              const key = `${nx},${ny}`;
              if (newMap[key] === 't_bedrock') newMap[key] = 't_roughland';
            }
          }
          return { ...s, exploredRadius: newRadius, townMap: newMap };
        });
      }
    }

    setStats(s => ({
      ...s,
      kanjiStats: { ...s.kanjiStats, [id]: { ...cur, ...next, status: newStatus, mistakes: evalType === 'again' ? (cur.mistakes || 0) + 1 : (cur.mistakes || 0) } },
      ...(newVillager ? { population: (s.population || 0) + 1, villagers: [...(s.villagers || []), newVillager] } : {}),
    }));
    setSessionData(d => ({
      ...d,
      earnedExp: d.earnedExp + exp,
      reviewedCount: (d.reviewedCount || 0) + 1,
      unlockedItems: unlockedItem ? [...d.unlockedItems, unlockedItem] : d.unlockedItems,
      newVillager: d.newVillager || newVillager, // セッション中の最初の住民誕生のみ記録
    }));
    return evalType !== 'again';
  };

  const handleRecordPerfect = useCallback((imgUrl) => { setSessionData(d => ({ ...d, perfectCount: d.perfectCount + 1, earnedExp: d.earnedExp + 5, bestKakejiku: imgUrl || d.bestKakejiku })); }, []);
  const handleRecordEasy = useCallback(() => { setSessionData(d => ({ ...d, easyCount: d.easyCount + 1 })); }, []);

  const handleFinishSession = (additionalResults = {}) => {
    const totalExp = sessionData.earnedExp + (additionalResults.exp || 0);
    let coinBonus = Math.floor(totalExp / 2) + (additionalResults.coins || 0);
    // 退治ボーナス：もし「おばけ退治」セッションで、かつ他にも溜まっていた復習がすべて消化されたなら付与
    if (sessionData.isExterminating) {
      const now = Date.now();
      const remainingReviews = KANJI_DATA.filter(k => {
        const s = stats.kanjiStats?.[k.id];
        return s && s.status !== 'new' && (s.nextReview || 0) <= now;
      }).length;
      if (remainingReviews <= sessionData.queue.length) { // 今回のセッションで全て消化される見込み
        coinBonus += 20;
      }
    }
    const rareChance = 0.1 + (stats.streak * 0.01); let rareDrop = additionalResults.rareDrop || null;
    if (!rareDrop && Math.random() < Math.min(rareChance, 0.5)) { const rares = ['t_torii', 't_temple', 't_castle', 't_dragon', 't_kakejiku']; rareDrop = rares[Math.floor(Math.random() * rares.length)]; }
    const finalSessionData = { ...sessionData, earnedExp: totalExp, rareDrop, perfectCount: sessionData.perfectCount + (additionalResults.perfectCount || 0) };
    setSessionData(finalSessionData); let newStats = StorageAPI.updateDaily(stats, totalExp, finalSessionData); newStats.coins = (newStats.coins || 0) + coinBonus;
    StorageAPI.saveStats(newStats); setStats(newStats); setView('result');
  };

  const GlobalStyle = () => {
    const { themeName } = levelInfo;
    let tv = `--bg: #fdfbf7; --primary: #ef4444; --secondary: #10b981; --accent: #fbbf24; --text: #292f36; --panel: #ffffff;`;
    if (themeName === 'dark') tv = `--bg: #0f172a; --primary: #f43f5e; --secondary: #3b82f6; --accent: #f59e0b; --text: #e2e8f0; --panel: #1e293b;`;
    if (themeName === 'sakura') tv = `--bg: #fdf2f8; --primary: #d946ef; --secondary: #f472b6; --accent: #fbcfe8; --text: #831843; --panel: #ffffff;`;
    if (themeName === 'ocean') tv = `--bg: #f0f9ff; --primary: #0284c7; --secondary: #38bdf8; --accent: #7dd3fc; --text: #0c4a6e; --panel: #ffffff;`;
    if (themeName === 'sunset') tv = `--bg: #fff7ed; --primary: #ea580c; --secondary: #f97316; --accent: #fcd34d; --text: #7c2d12; --panel: #ffffff;`;
    if (themeName === 'gold') tv = `--bg: #fefce8; --primary: #b45309; --secondary: #eab308; --accent: #fef08a; --text: #713f12; --panel: #ffffff;`;
    return (
      <style>{`:root { ${tv} } body { font-family: 'Zen Maru Gothic', sans-serif; background-color: var(--bg); color: var(--text); touch-action: manipulation; transition: background-color 0.3s ease; } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; } ::selection { background-color: var(--accent); color: var(--text); } ruby { ruby-align: center; vertical-align: baseline; } ruby rt { font-size: 0.5em; font-weight: 700; letter-spacing: 0; line-height: 1; } ruby rt:empty { display: inline-block; height: 0; overflow: hidden; } .ruby-text { line-height: 2.5; }`}</style>
    );
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-[var(--bg)] relative overflow-hidden transition-colors duration-500">
      <GlobalStyle />
      {view !== 'session' && view !== 'townEditor' && view !== 'flashcard' && view !== 'survival' && view !== 'boss' && (
        <header className="flex-shrink-0 bg-[var(--panel)]/90 backdrop-blur border-b-[4px] border-[var(--text)] py-3 px-5 flex justify-between items-center z-50 sticky top-0 shadow-[0_4px_0_var(--text)] transition-colors duration-500">
          <div className="flex items-center cursor-pointer gap-2" onClick={() => { audioCtrl.playSE('click'); setView('home'); }} role="button" aria-label="ホームに戻る">
            <div className="bg-[var(--primary)] p-1.5 rounded-lg text-[var(--panel)] shadow-sm border-2 border-[var(--text)]"><PenTool size={22} strokeWidth={3} /></div>
            <h1 className="text-xl font-black text-[var(--text)] tracking-wide">マイ漢字タウン</h1>
          </div>
          <button onClick={() => setIsMuted(audioCtrl.toggle())} aria-label={isMuted ? "音をオンにする" : "音をオフにする"} className="text-[var(--text)] opacity-50 hover:opacity-100 p-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[var(--primary)] border-2 border-transparent hover:border-[var(--text)] hover:bg-[var(--bg)] min-w-[44px] min-h-[44px] flex items-center justify-center">
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} className="text-[var(--secondary)]" />}
          </button>
        </header>
      )}

      <main className="flex-grow relative overflow-hidden p-0 md:p-4">
        <AnimatePresence mode="wait">
          {view === 'home' && <PageWrapper key="home"><ErrorBoundary onReset={() => setView('home')}><HomeView setView={setView} stats={stats} setStats={setStats} startSession={startSession} startFlashcard={startFlashcard} startSurvival={startSurvival} startBossBattle={startBossBattle} levelInfo={levelInfo} /></ErrorBoundary></PageWrapper>}
          {view === 'dictionary' && <PageWrapper key="dict"><ErrorBoundary onReset={() => setView('home')}><DictionaryView kanjiStats={stats.kanjiStats} onBack={() => setView('home')} onSelectKanji={startSingleSession} /></ErrorBoundary></PageWrapper>}
          {view === 'townEditor' && <FullScreenWrapper key="townEditor"><ErrorBoundary onReset={() => setView('home')}><TownEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'achievements' && <PageWrapper key="achievements"><ErrorBoundary onReset={() => setView('home')}><AchievementView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'stats' && <PageWrapper key="stats"><ErrorBoundary onReset={() => setView('home')}><StatsView setView={setView} stats={stats} /></ErrorBoundary></PageWrapper>}
          {view === 'myDrills' && <PageWrapper key="myDrills"><ErrorBoundary onReset={() => setView('home')}><MyDrillsView setView={setView} stats={stats} setStats={setStats} startDrillSession={startDrillSession} setHostDrill={setHostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'drillEditor' && <PageWrapper key="drillEditor"><ErrorBoundary onReset={() => setView('home')}><DrillEditorView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'peerHost' && <PageWrapper key="peerHost"><ErrorBoundary onReset={() => setView('home')}><TeacherHostView setView={setView} drill={hostDrill} /></ErrorBoundary></PageWrapper>}
          {view === 'peerClient' && <PageWrapper key="peerClient"><ErrorBoundary onReset={() => setView('home')}><StudentClientView setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
          {view === 'session' && <FullScreenWrapper key="session"><ErrorBoundary onReset={() => setView('home')}><SessionView queue={sessionData.queue} stats={stats.kanjiStats || {}} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} onRecordPerfect={handleRecordPerfect} onRecordEasy={handleRecordEasy} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'flashcard' && <FullScreenWrapper key="flashcard"><ErrorBoundary onReset={() => setView('home')}><FlashcardView queue={sessionData.queue} stats={stats} setStats={setStats} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'survival' && <FullScreenWrapper key="survival"><ErrorBoundary onReset={() => setView('home')}><SurvivalView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'boss' && <FullScreenWrapper key="boss"><ErrorBoundary onReset={() => setView('home')}><BossBattleView queue={sessionData.queue} onUpdateStat={handleUpdateStat} onFinish={handleFinishSession} /></ErrorBoundary></FullScreenWrapper>}
          {view === 'result' && <PageWrapper key="result"><ErrorBoundary onReset={() => setView('home')}><ResultView sessionMetrics={sessionData} oldExp={sessionData.oldExp} setView={setView} stats={stats} setStats={setStats} /></ErrorBoundary></PageWrapper>}
        </AnimatePresence>
      </main>
    </div>
  );
}
