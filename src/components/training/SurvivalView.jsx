import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, RefreshCw, Zap, Trophy } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { F, SurvivalRubyText, FormatKun } from '../ui/FormatKun';
import { survivalGrade } from '../../systems/survivalGrader';

const WAVE_SIZE = 10;
const INITIAL_TIME = 60;
const MAX_TIME = 90;

// --- サバイバル専用キャンバス ---
const SurvivalCanvas = ({ strokeData, canvasSize, onSubmit, disabled }) => {
  const inkRef = useRef(null);
  const writeRef = useRef(null);
  const [userStrokes, setUserStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);
  const writeStartTimeRef = useRef(0);

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
    writeStartTimeRef.current = 0;
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
    if (writeStartTimeRef.current === 0) writeStartTimeRef.current = Date.now();
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
    writeStartTimeRef.current = 0;
    [inkRef, writeRef].forEach(ref => {
      const ctx = ref.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
    });
  };

  const handleSubmit = () => {
    if (userStrokes.length === 0) return;
    const writingTime = writeStartTimeRef.current > 0 ? Date.now() - writeStartTimeRef.current : 0;
    onSubmit(userStrokes, writingTime);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative border-[4px] border-amber-500 rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none shrink-0 shadow-[4px_4px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-2 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />
        <canvas ref={writeRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd} className="absolute inset-0 z-20 cursor-crosshair w-full h-full" />
        <div className="absolute top-3 left-3 bg-[var(--text)] text-[var(--panel)] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full opacity-50 pointer-events-none">かくところ</div>
        {disabled && (
          <div className="absolute inset-0 z-30 bg-black/30 flex items-center justify-center">
            <span className="text-[var(--text)] font-black text-lg">{F("判定中","はんていちゅう")}...</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 w-full" style={{ maxWidth: canvasSize }}>
        <MotionButton variant="secondary" onClick={handleClear} disabled={disabled || userStrokes.length === 0} className="flex-1 py-3 text-sm font-bold border-[3px] border-[var(--text)]">
          <RefreshCw size={16} /> {F("書","か")}き{F("直","なお")}す
        </MotionButton>
        <MotionButton variant="primary" onClick={handleSubmit} disabled={disabled || userStrokes.length === 0} className="flex-2 py-3 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239] flex-grow-[2]">
          <Zap size={20} /> GO!
        </MotionButton>
      </div>
    </div>
  );
};

// --- 判定エフェクト ---
const JudgeEffect = ({ result }) => {
  if (!result) return null;
  const config = {
    perfect: { text: 'PERFECT!', icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-400/20', border: 'border-amber-400' },
    ok: { text: 'OK!', icon: '✓', color: 'text-emerald-400', bg: 'bg-emerald-400/20', border: 'border-emerald-400' },
    miss: { text: 'MISS...', icon: '✗', color: 'text-rose-400', bg: 'bg-rose-400/20', border: 'border-rose-400' },
  };
  const c = config[result.rank];
  return (
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.5, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
    >
      <div className={`text-center ${c.bg} ${c.border} border-4 rounded-3xl px-8 py-6 backdrop-blur-sm`}>
        <div className={`text-5xl md:text-7xl font-black ${c.color} drop-shadow-lg`}>
          {c.icon} {c.text}
        </div>
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {result.details.map((d, i) => (
            <span key={i} className="text-[10px] font-bold text-[var(--text)] opacity-70 bg-[var(--panel)] px-2 py-0.5 rounded-full">{d}</span>
          ))}
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
    <div className="text-center bg-amber-500/20 border-4 border-amber-500 rounded-3xl px-10 py-8 backdrop-blur-sm">
      <div className="text-4xl md:text-5xl font-black text-amber-400 drop-shadow-lg">
        🎉 WAVE {wave} CLEAR!
      </div>
      <div className="text-lg font-bold text-amber-300 mt-2">+10{F("秒","びょう")}ボーナス！</div>
    </div>
  </motion.div>
);

// --- ゲーム終了画面 ---
const ResultSummary = ({ wave, bestCombo, perfectCount, okCount, missCount, earned }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-4 text-center p-4 md:p-6 w-full max-w-md mx-auto"
  >
    <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl">
      <Trophy size={64} className="text-amber-400" />
    </motion.div>
    <div className="text-3xl font-black text-[var(--text)]">RESULT</div>

    <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 border-2 border-amber-300">
          <div className="text-xs font-bold text-amber-600">{F("到達","とうたつ")}ウェーブ</div>
          <div className="text-3xl font-black text-amber-500">WAVE {wave}</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/30 rounded-xl p-3 border-2 border-orange-300">
          <div className="text-xs font-bold text-orange-600">ベストコンボ</div>
          <div className="text-3xl font-black text-orange-500">{bestCombo} 🔥</div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1 bg-amber-100 dark:bg-amber-900/20 rounded-lg p-2 text-center border border-amber-200">
          <div className="text-[10px] font-bold text-amber-600">⚡ PERFECT</div>
          <div className="text-xl font-black text-amber-500">{perfectCount}</div>
        </div>
        <div className="flex-1 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg p-2 text-center border border-emerald-200">
          <div className="text-[10px] font-bold text-emerald-600">✓ OK</div>
          <div className="text-xl font-black text-emerald-500">{okCount}</div>
        </div>
        <div className="flex-1 bg-rose-100 dark:bg-rose-900/20 rounded-lg p-2 text-center border border-rose-200">
          <div className="text-[10px] font-bold text-rose-600">✗ MISS</div>
          <div className="text-xl font-black text-rose-500">{missCount}</div>
        </div>
      </div>

      <div className="flex gap-3 mt-3">
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

    <div className="text-xs text-[var(--text)] opacity-50 mt-1">{F("結果画面","けっかがめん")}に{F("移動","いどう")}します...</div>
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
  const [waveProgress, setWaveProgress] = useState(0); // 現ウェーブ内の進捗(0-9)
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
  const [phase, setPhase] = useState('writing'); // writing | judging | result | waveClear | finished
  const [judgeResult, setJudgeResult] = useState(null);
  const [showWaveClear, setShowWaveClear] = useState(false);

  const kanji = currentQueue[idx % currentQueue.length];

  // タイマー
  useEffect(() => {
    if (phase === 'finished' || isDoneRef.current) return;
    if (phase !== 'writing') return; // 書き中のみカウント

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

  // 終了時にonFinishを呼ぶ
  useEffect(() => {
    if (phase === 'finished') {
      const timer = setTimeout(() => {
        onFinish(earnedRef.current);
      }, 3000);
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

  // ストローク提出
  const handleSubmitStrokes = (userStrokes, writingTimeMs) => {
    if (isDoneRef.current || phase !== 'writing') return;
    clearInterval(timerRef.current);
    setPhase('judging');

    const result = survivalGrade(userStrokes, strokeData, canvasSize, writingTimeMs, wave);
    setJudgeResult(result);

    // コンボ計算
    let newCombo = comboRef.current;
    if (result.rank === 'miss') {
      newCombo = 0;
    } else {
      newCombo += 1;
    }
    comboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo > bestCombo) setBestCombo(newCombo);

    // コンボボーナス時間
    let comboTimeBonus = 0;
    if (result.rank !== 'miss') {
      if (newCombo >= 20) comboTimeBonus = 5;
      else if (newCombo >= 10) comboTimeBonus = 3;
      else if (newCombo >= 5) comboTimeBonus = 2;
    }

    // 時間更新
    const totalTimeChange = result.timeBonus + comboTimeBonus;
    timeLeftRef.current = Math.max(0, Math.min(MAX_TIME, timeLeftRef.current + totalTimeChange));
    setTimeLeft(timeLeftRef.current);

    // スコア更新
    if (result.rank === 'perfect') {
      setPerfectCount(c => c + 1);
      earnedRef.current = {
        ...earnedRef.current,
        exp: earnedRef.current.exp + 15,
        coins: earnedRef.current.coins + 5,
        perfectCount: earnedRef.current.perfectCount + 1,
      };
      audioCtrl.playSE('stamp_perfect');
      onUpdateStat(kanji, 'easy');
    } else if (result.rank === 'ok') {
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
      // ウェーブクリア
      setTimeout(() => {
        setShowWaveClear(true);
        audioCtrl.playSE('success');
        // ウェーブクリアボーナス
        earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 30 };
        timeLeftRef.current = Math.min(MAX_TIME, timeLeftRef.current + 10);
        setTimeLeft(timeLeftRef.current);

        setTimeout(() => {
          setShowWaveClear(false);
          setWave(w => w + 1);
          setWaveProgress(0);
          setJudgeResult(null);
          advanceToNext();
          setPhase('writing');
        }, 1500);
      }, 600);
    } else {
      setWaveProgress(newWaveProgress);
      setTimeout(() => {
        setJudgeResult(null);
        advanceToNext();
        setPhase('writing');
      }, 800);
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

  // タイマーの色
  const timeRatio = timeLeft / MAX_TIME;
  const timerColor = timeRatio > 0.5 ? 'bg-amber-400' : timeRatio > 0.25 ? 'bg-yellow-500 animate-pulse' : 'bg-rose-500 animate-pulse';

  // 例文
  const ex = kanji.examples?.[0];

  // --- レンダリング ---
  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] relative overflow-hidden">
      {/* ヘッダー: ウェーブ情報 + タイマー */}
      <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3 flex flex-col gap-2 z-10 bg-[var(--panel)] border-b-[4px] border-[var(--text)]">
        {/* ウェーブ + タイマー */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 rounded-full px-3 py-1">
            <Flame size={16} className="text-amber-500" />
            <span className="text-sm font-black text-amber-600">WAVE {wave}</span>
          </div>

          {/* ウェーブ進捗ドット */}
          <div className="flex gap-1 flex-1">
            {[...Array(WAVE_SIZE)].map((_, i) => (
              <div key={i} className={`h-2 flex-1 rounded-full transition-colors duration-200 ${i < waveProgress ? 'bg-amber-400' : 'bg-[var(--text)] opacity-10'}`} />
            ))}
          </div>

          {/* タイマー */}
          <div className={`flex items-center gap-1 font-black text-lg ${timeRatio <= 0.25 ? 'text-rose-500' : 'text-[var(--text)]'}`}>
            ⏱ {Math.max(timeLeft, 0)}{F("秒","びょう")}
          </div>
        </div>

        {/* タイマーバー */}
        <div className="w-full bg-[var(--text)] opacity-10 h-2 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${(Math.max(timeLeft, 0) / MAX_TIME) * 100}%` }}
            transition={{ duration: 0.3 }}
            className={`h-full ${timerColor} transition-colors`}
          />
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 px-2 md:px-4 py-2 min-h-0 overflow-hidden relative">
        {/* 判定エフェクト */}
        <AnimatePresence>
          {judgeResult && phase === 'judging' && <JudgeEffect result={judgeResult} />}
          {showWaveClear && <WaveClearEffect wave={wave} />}
        </AnimatePresence>

        {/* 左: 書き取りエリア */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto no-scrollbar gap-2">
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : phase === 'finished' ? (
            <ResultSummary
              wave={wave}
              bestCombo={bestCombo}
              perfectCount={perfectCount}
              okCount={okCount}
              missCount={missCount}
              earned={earnedRef.current}
            />
          ) : (
            <SurvivalCanvas
              strokeData={strokeData}
              canvasSize={canvasSize}
              onSubmit={handleSubmitStrokes}
              disabled={phase !== 'writing'}
            />
          )}
        </div>

        {/* 右: サイドバー */}
        {phase !== 'finished' && (
          <div className="w-full lg:w-[320px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-4 lg:pb-0 gap-3">
            {/* ヒント: 例文 or 読み */}
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
              <div className="text-sm font-bold bg-[var(--text)] text-[var(--panel)] px-4 py-1.5 rounded-full mx-auto w-max mb-3">
                この「〇」は{F("何","なん")}の{F("漢字","かんじ")}？
              </div>
              {ex ? (
                <p className="text-2xl md:text-3xl font-bold text-[var(--text)] text-center ruby-text">
                  <SurvivalRubyText text={ex} targetChar={kanji.char} />
                </p>
              ) : (
                <div className="text-center">
                  <div className="text-lg md:text-xl font-black text-[var(--text)] leading-tight">
                    {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
                    {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
                    {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (
                      <React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>
                    )) : ''}
                  </div>
                </div>
              )}
            </div>

            {/* コンボ表示 */}
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)] text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={combo}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {combo > 0 ? (
                    <div className={`font-black ${combo >= 20 ? 'text-4xl bg-gradient-to-r from-amber-400 via-rose-400 to-purple-400 bg-clip-text text-transparent' : combo >= 10 ? 'text-3xl text-amber-500' : combo >= 5 ? 'text-2xl text-orange-500' : 'text-xl text-[var(--text)]'}`}>
                      🔥 {combo} COMBO!
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-[var(--text)] opacity-30">コンボなし</div>
                  )}
                </motion.div>
              </AnimatePresence>
              {combo >= 5 && (
                <div className="text-[10px] font-bold text-amber-500 mt-1">
                  コンボボーナス +{combo >= 20 ? 5 : combo >= 10 ? 3 : 2}{F("秒","びょう")}
                </div>
              )}
            </div>

            {/* スコアサマリー */}
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-3 shadow-[4px_4px_0_var(--text)]">
              <div className="flex gap-2 text-center">
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-amber-500">⚡ PERFECT</div>
                  <div className="text-lg font-black text-amber-500">{perfectCount}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-emerald-500">✓ OK</div>
                  <div className="text-lg font-black text-emerald-500">{okCount}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-rose-500">✗ MISS</div>
                  <div className="text-lg font-black text-rose-500">{missCount}</div>
                </div>
                <div className="flex-1">
                  <div className="text-[9px] font-bold text-[var(--text)] opacity-50">BEST</div>
                  <div className="text-lg font-black text-[var(--text)]">{bestCombo}🔥</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurvivalView;
