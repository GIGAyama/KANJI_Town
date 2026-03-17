import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RefreshCw, Zap, Trophy, Clock, Target } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { F, SurvivalRubyText, FormatKun } from '../ui/FormatKun';
import { gradeStrokes } from '../../systems/strokeGrader';

const WAVE_SIZE = 10;
const INITIAL_TIME = 45;
const MAX_TIME = 60;

// gradeStrokes の 0-100 スコアをサバイバルのランクに変換
function scoreToRank(result) {
  if (!result.strokeCountMatch) return 'miss';
  if (result.total >= 80) return 'perfect';
  if (result.total >= 60) return 'ok';
  return 'miss';
}

// ランクごとの時間変化
const RANK_TIME = { perfect: 4, ok: 1, miss: -5 };

// --- サバイバル専用キャンバス ---
const SurvivalCanvas = ({ strokeData, canvasSize, onSubmit, disabled }) => {
  const inkRef = useRef(null);
  const writeRef = useRef(null);
  const [userStrokes, setUserStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);

  useEffect(() => {
    [inkRef, writeRef].forEach(ref => {
      const c = ref.current;
      if (c) {
        c.width = canvasSize * 2;
        c.height = canvasSize * 2;
        c.style.width = '100%';
        c.style.height = '100%';
        const ctx = c.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(2, 2);
        ctx.clearRect(0, 0, canvasSize, canvasSize);
      }
    });
    setUserStrokes([]);
  }, [strokeData, canvasSize]);

  const redrawInk = useCallback((strokes) => {
    const ctx = inkRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'var(--text, #292f36)';
    ctx.lineWidth = canvasSize * 0.07;
    strokes.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  }, [canvasSize]);

  const getCoords = (e) => {
    const rect = writeRef.current.getBoundingClientRect();
    const scaleX = canvasSize / rect.width;
    const scaleY = canvasSize / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (disabled) return;
    audioCtrl.init();
    const { x, y } = getCoords(e);
    setIsDrawing(true);
    lastPos.current = { x, y };
    currentPathRef.current = [{ x, y, time: Date.now() }];
    const ctx = writeRef.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = canvasSize * 0.07;
    ctx.strokeStyle = 'var(--text, #292f36)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (!isDrawing || disabled) return;
    const { x, y } = getCoords(e);
    currentPathRef.current.push({ x, y, time: Date.now() });
    const ctx = writeRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  };

  const handleEnd = (e) => {
    if (e && e.type !== 'mouseleave') e.preventDefault();
    if (!isDrawing || disabled) return;
    setIsDrawing(false);
    const newStrokes = [...userStrokes, [...currentPathRef.current]];
    setUserStrokes(newStrokes);
    redrawInk(newStrokes);
    const ctx = writeRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
  };

  const handleClear = () => {
    setUserStrokes([]);
    [inkRef, writeRef].forEach(ref => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
    });
  };

  const handleSubmit = () => {
    if (userStrokes.length === 0) return;
    onSubmit(userStrokes);
  };

  // 画数カウンター
  const expectedCount = strokeData.length;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* 画数インジケーター */}
      <div className="flex items-center gap-2 w-full" style={{ maxWidth: canvasSize }}>
        <div className={`text-xs font-black px-3 py-1 rounded-full border-2 ${userStrokes.length === expectedCount ? 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-400 text-emerald-600' : userStrokes.length > expectedCount ? 'bg-rose-100 dark:bg-rose-900/30 border-rose-400 text-rose-600' : 'bg-[var(--panel)] border-[var(--text)] text-[var(--text)] opacity-60'}`}>
          {userStrokes.length} / {expectedCount} {F("画","かく")}
        </div>
        <div className="flex gap-0.5 flex-1">
          {[...Array(expectedCount)].map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${i < userStrokes.length ? (userStrokes.length <= expectedCount ? 'bg-emerald-400' : 'bg-rose-400') : 'bg-[var(--text)] opacity-10'}`} />
          ))}
        </div>
      </div>

      {/* キャンバス */}
      <div className="relative border-[4px] border-amber-500 rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none shrink-0 shadow-[4px_4px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-2 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />
        <canvas ref={writeRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} className="absolute inset-0 z-20 cursor-crosshair w-full h-full" />
        {disabled && (
          <div className="absolute inset-0 z-30 bg-black/30 flex items-center justify-center" />
        )}
      </div>

      {/* ボタン */}
      <div className="flex gap-2 w-full" style={{ maxWidth: canvasSize }}>
        <MotionButton variant="secondary" onClick={handleClear} disabled={disabled || userStrokes.length === 0} className="flex-1 py-3 text-sm font-bold border-[3px] border-[var(--text)]">
          <RefreshCw size={16} /> {F("消","け")}す
        </MotionButton>
        <MotionButton variant="primary" onClick={handleSubmit} disabled={disabled || userStrokes.length === 0} className="flex-2 py-3 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239] flex-grow-[2]">
          <Zap size={18} /> GO!
        </MotionButton>
      </div>
    </div>
  );
};

// --- 判定エフェクト（スコア付き） ---
const JudgeEffect = ({ rank, score, details, timeChange }) => {
  const config = {
    perfect: { text: 'PERFECT!', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400', glow: 'shadow-[0_0_40px_rgba(251,191,36,0.4)]' },
    ok:      { text: 'OK!',      color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.3)]' },
    miss:    { text: 'MISS',     color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400', glow: 'shadow-[0_0_30px_rgba(251,113,133,0.3)]' },
  };
  const c = config[rank];
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className={`text-center ${c.bg} ${c.border} border-4 rounded-3xl px-8 py-5 backdrop-blur-sm ${c.glow}`}>
        <div className={`text-4xl md:text-6xl font-black ${c.color} drop-shadow-lg`}>
          {c.text}
        </div>
        {score !== null && (
          <div className={`text-lg font-black mt-1 ${c.color} opacity-80`}>{score} / 100</div>
        )}
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {details.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-[var(--text)] opacity-70 bg-[var(--panel)] px-2 py-0.5 rounded-full">{d}</span>
          ))}
        </div>
        <div className={`text-sm font-black mt-2 ${timeChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {timeChange > 0 ? `+${timeChange}` : timeChange}{F("秒","びょう")}
        </div>
      </div>
    </motion.div>
  );
};

// --- ウェーブクリア演出 ---
const WaveClearEffect = ({ wave }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 1.3, opacity: 0 }}
    transition={{ duration: 0.8, type: 'spring' }}
    className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
  >
    <div className="text-center bg-amber-500/20 border-4 border-amber-500 rounded-3xl px-10 py-8 backdrop-blur-sm shadow-[0_0_60px_rgba(251,191,36,0.3)]">
      <div className="text-3xl md:text-5xl font-black text-amber-400 drop-shadow-lg">
        WAVE {wave} CLEAR!
      </div>
      <div className="text-base font-bold text-amber-300 mt-2">+5{F("秒","びょう")}ボーナス</div>
    </div>
  </motion.div>
);

// --- ゲーム終了画面 ---
const ResultSummary = ({ wave, waveProgress, bestCombo, perfectCount, okCount, missCount, earned }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-4 text-center p-4 md:p-6 w-full max-w-md mx-auto"
  >
    <div className="text-5xl"><Trophy size={56} className="text-amber-400" /></div>
    <div className="text-2xl font-black text-[var(--text)]">TIME UP!</div>

    <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
      {/* メイン成績 */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border-2 border-amber-300 text-center">
          <div className="text-[10px] font-bold text-amber-600">WAVE</div>
          <div className="text-2xl font-black text-amber-500">{wave}</div>
          <div className="text-[9px] text-amber-500 opacity-60">{waveProgress}/{WAVE_SIZE}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-3 border-2 border-orange-300 text-center">
          <div className="text-[10px] font-bold text-orange-600">COMBO</div>
          <div className="text-2xl font-black text-orange-500">{bestCombo}</div>
          <div className="text-[9px] text-orange-500 opacity-60">ベスト</div>
        </div>
        <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-3 border-2 border-violet-300 text-center">
          <div className="text-[10px] font-bold text-violet-600">{F("合計","ごうけい")}</div>
          <div className="text-2xl font-black text-violet-500">{perfectCount + okCount + missCount}</div>
          <div className="text-[9px] text-violet-500 opacity-60">{F("問","もん")}</div>
        </div>
      </div>

      {/* 判定内訳 */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-amber-100 dark:bg-amber-900/20 rounded-lg p-2 text-center border border-amber-200">
          <div className="text-[9px] font-bold text-amber-600">PERFECT</div>
          <div className="text-xl font-black text-amber-500">{perfectCount}</div>
        </div>
        <div className="flex-1 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-200">
          <div className="text-[9px] font-bold text-emerald-600">OK</div>
          <div className="text-xl font-black text-emerald-500">{okCount}</div>
        </div>
        <div className="flex-1 bg-rose-100 dark:bg-rose-900/20 rounded-lg p-2 text-center border border-rose-200">
          <div className="text-[9px] font-bold text-rose-600">MISS</div>
          <div className="text-xl font-black text-rose-500">{missCount}</div>
        </div>
      </div>

      {/* 報酬 */}
      <div className="flex gap-3">
        <div className="flex-1 bg-[var(--bg)] rounded-lg p-2 text-center border-2 border-[var(--text)]">
          <div className="text-[10px] font-bold opacity-50">EXP</div>
          <div className="text-lg font-black text-[var(--primary)]">+{earned.exp}</div>
        </div>
        <div className="flex-1 bg-[var(--bg)] rounded-lg p-2 text-center border-2 border-[var(--text)]">
          <div className="text-[10px] font-bold opacity-50">コイン</div>
          <div className="text-lg font-black text-[var(--secondary)]">+{earned.coins}</div>
        </div>
      </div>
    </div>
  </motion.div>
);

// --- メインのサバイバルビュー ---
const SurvivalView = ({ queue, onUpdateStat, onFinish }) => {
  const [currentQueue, setCurrentQueue] = useState([...queue].sort(() => Math.random() - 0.5));
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const timeLeftRef = useRef(INITIAL_TIME);
  const timerRef = useRef(null);
  const isDoneRef = useRef(false);
  const [canvasSize] = useState(window.innerWidth < 768 ? 260 : 360);

  // ウェーブ＆コンボ
  const [wave, setWave] = useState(1);
  const [waveProgress, setWaveProgress] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const comboRef = useRef(0);

  // スコア
  const [perfectCount, setPerfectCount] = useState(0);
  const [okCount, setOkCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });

  // KanjiVGデータ
  const [strokeData, setStrokeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // バトル状態
  const [phase, setPhase] = useState('writing');
  const [judgeInfo, setJudgeInfo] = useState(null); // { rank, score, details, timeChange }
  const [showWaveClear, setShowWaveClear] = useState(false);
  // ミス時の画面フラッシュ
  const [missFlash, setMissFlash] = useState(false);

  const kanji = currentQueue[idx % currentQueue.length];

  // タイマー
  useEffect(() => {
    if (phase === 'finished' || isDoneRef.current) return;
    if (phase !== 'writing') return;

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        if (!isDoneRef.current) {
          isDoneRef.current = true;
          setPhase('finished');
        }
      }
    }, 1000);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // 終了時にonFinish
  useEffect(() => {
    if (phase === 'finished') {
      const timer = setTimeout(() => {
        onFinish(earnedRef.current);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [phase, onFinish]);

  // KanjiVGデータ取得
  useEffect(() => {
    if (!kanji) return;
    const fetchPaths = async () => {
      setIsLoading(true);
      const hex = kanji.char.charCodeAt(0).toString(16).padStart(5, '0');
      try {
        const res = await fetch(`https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/${hex}.svg`);
        if (res.ok) {
          const text = await res.text();
          const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
          const extractedPaths = Array.from(doc.querySelectorAll('path')).map(p => p.getAttribute('d'));
          const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          svg.appendChild(pathEl);
          document.body.appendChild(svg);
          const data = extractedPaths.map(p => {
            pathEl.setAttribute('d', p);
            const len = pathEl.getTotalLength();
            const points = [];
            for (let i = 0; i <= len; i += 2) {
              const pt = pathEl.getPointAtLength(i);
              points.push({ x: pt.x / 109, y: pt.y / 109 });
            }
            const endPt = pathEl.getPointAtLength(len);
            points.push({ x: endPt.x / 109, y: endPt.y / 109 });
            return {
              s: { x: pathEl.getPointAtLength(0).x / 109, y: pathEl.getPointAtLength(0).y / 109 },
              e: { x: endPt.x / 109, y: endPt.y / 109 },
              points,
            };
          });
          document.body.removeChild(svg);
          setStrokeData(data);
        } else {
          setStrokeData([]);
        }
      } catch {
        setStrokeData([]);
      }
      setIsLoading(false);
    };
    fetchPaths();
  }, [kanji]);

  // ストローク提出 — gradeStrokes(ボスバトル同等)で採点
  const handleSubmitStrokes = (userStrokes) => {
    if (isDoneRef.current || phase !== 'writing') return;
    clearInterval(timerRef.current);
    setPhase('judging');

    const result = gradeStrokes(userStrokes, strokeData, canvasSize);
    const rank = scoreToRank(result);

    // コンボ
    let newCombo = comboRef.current;
    if (rank === 'miss') {
      newCombo = 0;
    } else {
      newCombo += 1;
    }
    comboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo > bestCombo) setBestCombo(newCombo);

    // コンボボーナス時間（控えめ）
    let comboTimeBonus = 0;
    if (rank !== 'miss') {
      if (newCombo >= 20) comboTimeBonus = 2;
      else if (newCombo >= 10) comboTimeBonus = 1;
    }

    // 時間変化
    const baseTimeChange = RANK_TIME[rank];
    const totalTimeChange = baseTimeChange + comboTimeBonus;
    timeLeftRef.current = Math.max(0, Math.min(MAX_TIME, timeLeftRef.current + totalTimeChange));
    setTimeLeft(timeLeftRef.current);

    // 判定情報をセット
    setJudgeInfo({
      rank,
      score: result.strokeCountMatch ? result.total : null,
      details: result.details,
      timeChange: totalTimeChange,
    });

    // スコア＆報酬
    if (rank === 'perfect') {
      setPerfectCount(c => c + 1);
      earnedRef.current = {
        ...earnedRef.current,
        exp: earnedRef.current.exp + 15,
        coins: earnedRef.current.coins + 5,
        perfectCount: earnedRef.current.perfectCount + 1,
      };
      audioCtrl.playSE('stamp_perfect');
      onUpdateStat(kanji, 'easy');
    } else if (rank === 'ok') {
      setOkCount(c => c + 1);
      earnedRef.current = {
        ...earnedRef.current,
        exp: earnedRef.current.exp + 8,
        coins: earnedRef.current.coins + 2,
      };
      audioCtrl.playSE('stamp_good');
      onUpdateStat(kanji, 'good');
    } else {
      setMissCount(c => c + 1);
      audioCtrl.playSE('stamp_bad');
      onUpdateStat(kanji, 'again');
      // ミスフラッシュ
      setMissFlash(true);
      setTimeout(() => setMissFlash(false), 400);
    }

    // タイムアウトチェック
    if (timeLeftRef.current <= 0) {
      setTimeout(() => {
        if (!isDoneRef.current) {
          isDoneRef.current = true;
          setPhase('finished');
        }
      }, 800);
      return;
    }

    // ウェーブ進行
    const newWaveProgress = waveProgress + 1;
    if (newWaveProgress >= WAVE_SIZE) {
      setTimeout(() => {
        setShowWaveClear(true);
        audioCtrl.playSE('success');
        earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 30 };
        timeLeftRef.current = Math.min(MAX_TIME, timeLeftRef.current + 5);
        setTimeLeft(timeLeftRef.current);

        setTimeout(() => {
          setShowWaveClear(false);
          setWave(w => w + 1);
          setWaveProgress(0);
          setJudgeInfo(null);
          advanceToNext();
          setPhase('writing');
        }, 1500);
      }, 700);
    } else {
      setWaveProgress(newWaveProgress);
      setTimeout(() => {
        setJudgeInfo(null);
        advanceToNext();
        setPhase('writing');
      }, 900);
    }
  };

  const advanceToNext = () => {
    const nextIdx = idx + 1;
    if (nextIdx >= currentQueue.length) {
      setCurrentQueue(prev => [...prev, ...queue].sort(() => Math.random() - 0.5));
    }
    setIdx(nextIdx);
  };

  if (!kanji) return null;

  const timeRatio = timeLeft / MAX_TIME;
  const isTimeCritical = timeRatio <= 0.25;
  const ex = kanji.examples?.[0];

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] relative overflow-hidden">
      {/* ミスフラッシュ */}
      <AnimatePresence>
        {missFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-40 bg-rose-500/20 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* === ヘッダー === */}
      <div className="flex-shrink-0 px-3 py-2 md:px-4 md:py-2 z-10 bg-[var(--panel)] border-b-[3px] border-[var(--text)]">
        {/* 1段目: ウェーブ + スコア + タイマー */}
        <div className="flex items-center gap-2 mb-1.5">
          {/* ウェーブバッジ */}
          <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-full px-2.5 py-0.5 shrink-0">
            <Flame size={14} className="text-amber-500" />
            <span className="text-xs font-black text-amber-600">WAVE {wave}</span>
          </div>

          {/* スコアチップ（コンパクト） */}
          <div className="flex gap-1.5 text-[10px] font-black">
            <span className="text-amber-500">{perfectCount}<span className="opacity-50 ml-0.5">P</span></span>
            <span className="text-emerald-500">{okCount}<span className="opacity-50 ml-0.5">OK</span></span>
            <span className="text-rose-500">{missCount}<span className="opacity-50 ml-0.5">M</span></span>
          </div>

          {/* スペーサー */}
          <div className="flex-1" />

          {/* コンボ */}
          {combo > 0 && (
            <motion.div
              key={combo}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              className={`text-xs font-black px-2 py-0.5 rounded-full border-2 ${combo >= 20 ? 'border-purple-400 bg-purple-100 dark:bg-purple-900/30 text-purple-500' : combo >= 10 ? 'border-amber-400 bg-amber-100 dark:bg-amber-900/30 text-amber-500' : combo >= 5 ? 'border-orange-400 bg-orange-100 dark:bg-orange-900/30 text-orange-500' : 'border-[var(--text)] bg-[var(--panel)] text-[var(--text)]'}`}
            >
              {combo} COMBO
            </motion.div>
          )}

          {/* タイマー */}
          <div className={`flex items-center gap-1 font-black text-base tabular-nums shrink-0 ${isTimeCritical ? 'text-rose-500 animate-pulse' : 'text-[var(--text)]'}`}>
            <Clock size={14} />
            {Math.max(timeLeft, 0)}
          </div>
        </div>

        {/* 2段目: ウェーブ進捗 + タイマーバー */}
        <div className="flex gap-2 items-center">
          {/* ウェーブ進捗 */}
          <div className="flex gap-0.5 flex-1">
            {[...Array(WAVE_SIZE)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < waveProgress ? 'bg-amber-400' : i === waveProgress && phase === 'writing' ? 'bg-amber-400/40' : 'bg-[var(--text)] opacity-10'}`} />
            ))}
          </div>
          {/* タイマーバー */}
          <div className="w-24 md:w-32 bg-[var(--text)] opacity-10 h-1.5 rounded-full overflow-hidden shrink-0">
            <motion.div
              animate={{ width: `${(Math.max(timeLeft, 0) / MAX_TIME) * 100}%` }}
              transition={{ duration: 0.3 }}
              className={`h-full rounded-full ${timeRatio > 0.5 ? 'bg-emerald-400' : timeRatio > 0.25 ? 'bg-yellow-400' : 'bg-rose-500'}`}
            />
          </div>
        </div>
      </div>

      {/* === メインエリア === */}
      <div className="flex-1 flex items-center justify-center px-2 md:px-4 py-2 min-h-0 overflow-hidden relative">
        {/* 判定エフェクト */}
        <AnimatePresence>
          {judgeInfo && phase === 'judging' && (
            <JudgeEffect rank={judgeInfo.rank} score={judgeInfo.score} details={judgeInfo.details} timeChange={judgeInfo.timeChange} />
          )}
          {showWaveClear && <WaveClearEffect wave={wave} />}
        </AnimatePresence>

        {phase === 'finished' ? (
          <ResultSummary
            wave={wave}
            waveProgress={waveProgress}
            bestCombo={bestCombo}
            perfectCount={perfectCount}
            okCount={okCount}
            missCount={missCount}
            earned={earnedRef.current}
          />
        ) : (
          <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 lg:gap-6">
            {/* 左: お題パネル（PCでは大きく表示） */}
            <div className="w-full lg:flex-1 flex flex-col gap-3 order-first">
              {/* お題: 例文 or 読み */}
              <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-4 md:p-5 shadow-[3px_3px_0_var(--text)]">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-amber-500" />
                  <span className="text-xs font-black text-[var(--text)] opacity-50">
                    この「◯」は{F("何","なん")}の{F("漢字","かんじ")}？
                  </span>
                </div>
                {ex ? (
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text)] text-center ruby-text leading-relaxed">
                    <SurvivalRubyText text={ex} targetChar={kanji.char} />
                  </p>
                ) : (
                  <div className="text-center">
                    <div className="text-lg md:text-xl lg:text-2xl font-black text-[var(--text)] leading-relaxed">
                      {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
                      {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
                      {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (
                        <React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>
                      )) : ''}
                    </div>
                  </div>
                )}
              </div>

              {/* コンボ＆スコア（PCでは大きく表示） */}
              <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-4 shadow-[3px_3px_0_var(--text)]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={combo}
                    initial={{ scale: 1.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    className="text-center"
                  >
                    {combo > 0 ? (
                      <div className={`font-black ${combo >= 20 ? 'text-4xl lg:text-5xl bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent' : combo >= 10 ? 'text-3xl lg:text-4xl text-amber-500' : combo >= 5 ? 'text-2xl lg:text-3xl text-orange-500' : 'text-xl lg:text-2xl text-[var(--text)]'}`}>
                        {combo} COMBO
                      </div>
                    ) : (
                      <div className="text-base font-bold text-[var(--text)] opacity-20">COMBO</div>
                    )}
                  </motion.div>
                </AnimatePresence>
                {combo >= 10 && (
                  <div className="text-xs font-bold text-amber-500 mt-1 text-center">
                    +{combo >= 20 ? 2 : 1}{F("秒","びょう")}ボーナス
                  </div>
                )}
                <div className="flex justify-center gap-4 mt-3 pt-3 border-t-2 border-[var(--text)] opacity-80">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-amber-500">PERFECT</div>
                    <div className="text-lg lg:text-xl font-black text-amber-500">{perfectCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-emerald-500">OK</div>
                    <div className="text-lg lg:text-xl font-black text-emerald-500">{okCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-rose-500">MISS</div>
                    <div className="text-lg lg:text-xl font-black text-rose-500">{missCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-[var(--text)] opacity-50">BEST</div>
                    <div className="text-lg lg:text-xl font-black text-[var(--text)]">{bestCombo}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 右: キャンバスエリア */}
            <div className="flex flex-col items-center justify-center shrink-0">
              {isLoading ? (
                <div className="flex items-center justify-center" style={{ width: canvasSize, height: canvasSize }}>
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <SurvivalCanvas
                  strokeData={strokeData}
                  canvasSize={canvasSize}
                  onSubmit={handleSubmitStrokes}
                  disabled={phase !== 'writing'}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurvivalView;
