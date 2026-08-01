import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { SvgGhostBoss } from '../../data/town-items';
import { FormatKun, F } from '../ui/FormatKun';
import { gradeStrokes } from '../../systems/strokeGrader';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { RefreshCw, Swords, Shield } from 'lucide-react';
import { attachDrawListeners } from '../../utils/draw-pointer-events';
import { useLearningViewport } from '../../hooks/useLearningViewport';

const PLAYER_MAX_HP = 3;
const BOSS_MAX_HP = 10;
const WRITING_SKILLS = { skills: ['writing', 'stroke'] };

// --- ボスバトル専用キャンバス ---
const BossBattleCanvas = ({ strokeData, paths, canvasSize, onSubmit, disabled }) => {
  const inkRef = useRef(null);
  const writeRef = useRef(null);
  const [userStrokes, setUserStrokes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);

  // キャンバス初期化
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

  // 書いた線の描画
  const redrawInk = useCallback((strokes) => {
    const ctx = inkRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = canvasSize * 0.07;
    strokes.forEach(stroke => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  }, [canvasSize]);

  const handleStartRef = useRef(null); const handleMoveRef = useRef(null); const handleEndRef = useRef(null);

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
    ctx.strokeStyle = '#e2e8f0';
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

  handleStartRef.current = handleStart; handleMoveRef.current = handleMove; handleEndRef.current = handleEnd;
  useEffect(() => {
    const canvas = writeRef.current; if (!canvas) return;
    return attachDrawListeners(canvas, {
      onStart: (e) => handleStartRef.current(e),
      onMove: (e) => handleMoveRef.current(e),
      onEnd: (e) => handleEndRef.current(e),
    });
  }, []);

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

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative border-[4px] border-rose-600 rounded-[20px] bg-slate-900 overflow-hidden touch-none shrink-0 shadow-[0_0_20px_rgba(225,29,72,0.3)]" style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1' }}>
        {/* 十字ガイド */}
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-slate-600 opacity-40 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-slate-600 opacity-40 -translate-y-1/2 pointer-events-none" />
        <canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />
        <canvas ref={writeRef} className="absolute inset-0 z-20 cursor-crosshair w-full h-full touch-none" />
        {disabled && (
          <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center">
            <span className="text-white font-black text-lg">{F("判定中","はんていちゅう")}...</span>
          </div>
        )}
      </div>
      <div className="flex gap-2 w-full" style={{ maxWidth: canvasSize }}>
        <MotionButton variant="secondary" onClick={handleClear} disabled={disabled || userStrokes.length === 0} className="flex-1 py-3 text-sm font-bold border-[3px] border-slate-600 bg-slate-700 text-slate-200">
          <RefreshCw size={16} /> {F("書","か")}き{F("直","なお")}す
        </MotionButton>
        <MotionButton variant="primary" onClick={handleSubmit} disabled={disabled || userStrokes.length === 0} className="flex-2 py-3 text-lg font-black border-[3px] border-rose-800 bg-rose-600 text-white shadow-[0_4px_0_#9f1239] flex-grow-[2]">
          <Swords size={20} /> {F("攻撃","こうげき")}する！
        </MotionButton>
      </div>
    </div>
  );
};

// --- メインのボスバトルビュー ---
const BossBattleView = ({ queue, onUpdateStat, onFinish, onBossDefeat }) => {
  const [idx, setIdx] = useState(0);
  const [bossHp, setBossHp] = useState(BOSS_MAX_HP);
  const bossHpRef = useRef(BOSS_MAX_HP);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const playerHpRef = useRef(PLAYER_MAX_HP);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });
  const failedKanjiRef = useRef([]);
  const isDoneRef = useRef(false);
  // 画面回転にも追従する。サイズ変更時は BossBattleCanvas 側で書きかけの画が消える(通常モードと同じ挙動)
  const { canvasSize } = useLearningViewport('boss');

  // ストロークデータ
  const [paths, setPaths] = useState([]);
  const [strokeData, setStrokeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // バトル状態
  const [phase, setPhase] = useState('writing'); // writing | judging | result_hit | result_miss | boss_attack | defeated | victory
  const [gradeResult, setGradeResult] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [playerDamageFlash, setPlayerDamageFlash] = useState(false);
  const [bossAttackAnim, setBossAttackAnim] = useState(false);
  const [battleMessage, setBattleMessage] = useState('');
  const [retryKanji, setRetryKanji] = useState(false);

  // タイマー
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const timeLeftRef = useRef(0);

  const kanji = queue[idx % queue.length];

  // BGM
  useEffect(() => {
    audioCtrl.playBGM('boss');
    return () => audioCtrl.stopBGM();
  }, []);

  const [fetchError, setFetchError] = useState(null);

  // KanjiVGデータ取得（リトライ・キャッシュ付き）
  useEffect(() => {
    if (!kanji) return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true); setFetchError(null);
      try {
        const { paths: p, strokeData: data } = await fetchKanjiVg(kanji.char);
        if (cancelled) return;
        setPaths(p); setStrokeData(data);
      } catch {
        if (cancelled) return;
        setPaths([]); setStrokeData([]);
        setFetchError(true);
      }
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [kanji]);

  // 制限時間の計算（画数×3秒、最低15秒、最大45秒）
  const calcTimeLimit = useCallback(() => {
    if (!strokeData.length) return 30;
    return Math.min(45, Math.max(15, strokeData.length * 3));
  }, [strokeData]);

  // タイマー開始
  useEffect(() => {
    if (phase !== 'writing' || isLoading || !strokeData.length) return;
    const limit = calcTimeLimit();
    setTimeLeft(limit);
    timeLeftRef.current = limit;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        handleTimeout();
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, isLoading, strokeData, idx, retryKanji]);

  // タイムアウト処理
  const handleTimeout = () => {
    if (isDoneRef.current) return;
    clearInterval(timerRef.current);
    setPhase('judging');
    setBattleMessage('時間切れ！');
    audioCtrl.playSE('stamp_bad');
    setGradeResult({ total: 0, strokeCountMatch: false, crossMatch: false, details: ['時間切れ！書けなかった…'] });

    // ボスからの強攻撃（2ダメージ）
    setTimeout(() => {
      doBossAttack(2, 'タイムアウト！ボスの強攻撃！');
      // 復習リスト入り
      addToFailedKanji(kanji);
      onUpdateStat(kanji, 'again', WRITING_SKILLS);
    }, 800);
  };

  // ユーザーがストロークを提出
  const handleSubmitStrokes = (userStrokes) => {
    if (isDoneRef.current || phase !== 'writing') return;
    clearInterval(timerRef.current);
    setPhase('judging');

    const result = gradeStrokes(userStrokes, strokeData, canvasSize);
    setGradeResult(result);

    setTimeout(() => {
      if (!result.strokeCountMatch) {
        // 画数違い → 一撃アウト（0点）、ボス強攻撃2ダメージ
        setBattleMessage('画数がちがう！一撃アウト！');
        audioCtrl.playSE('stamp_bad');
        doBossAttack(2, '画数ミス！ボスの猛攻撃！');
        addToFailedKanji(kanji);
        onUpdateStat(kanji, 'again', WRITING_SKILLS);
      } else if (!result.crossMatch) {
        // 交差ミス → 一撃アウト（0点）、ボス強攻撃2ダメージ
        setBattleMessage('せんの交わりがちがう！一撃アウト！');
        audioCtrl.playSE('stamp_bad');
        doBossAttack(2, '交差ミス！ボスの猛攻撃！');
        addToFailedKanji(kanji);
        onUpdateStat(kanji, 'again', WRITING_SKILLS);
      } else if (result.total >= 80) {
        // 会心の一撃
        setBattleMessage('会心の一撃！');
        audioCtrl.playSE('stamp_perfect');
        doBossHit(1, true);
        earnedRef.current = {
          ...earnedRef.current,
          exp: earnedRef.current.exp + 25,
          coins: earnedRef.current.coins + 8,
          perfectCount: earnedRef.current.perfectCount + 1,
        };
        onUpdateStat(kanji, 'easy', WRITING_SKILLS);
      } else if (result.total >= 60) {
        // ダメージ！
        setBattleMessage('ダメージを与えた！');
        audioCtrl.playSE('boss_hit');
        doBossHit(1, false);
        earnedRef.current = {
          ...earnedRef.current,
          exp: earnedRef.current.exp + 15,
          coins: earnedRef.current.coins + 5,
        };
        onUpdateStat(kanji, 'good', WRITING_SKILLS);
      } else if (result.total >= 50) {
        // ダメージ通らない + ボス反撃1ダメージ
        setBattleMessage('おしい…ダメージが通らない！');
        audioCtrl.playSE('stamp_bad');
        doBossAttack(1, 'ボスの反撃！');
        onUpdateStat(kanji, 'hard', WRITING_SKILLS);
      } else {
        // 50点未満 → ボス強攻撃2ダメージ + 復習リスト入り
        setBattleMessage('うまく書けなかった…');
        audioCtrl.playSE('stamp_bad');
        doBossAttack(2, 'ボスの強攻撃！');
        addToFailedKanji(kanji);
        onUpdateStat(kanji, 'again', WRITING_SKILLS);
      }
    }, 600);
  };

  // ボスにダメージ
  const doBossHit = (damage, isCritical) => {
    setPhase(isCritical ? 'result_hit' : 'result_hit');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);

    const newHp = Math.max(0, bossHpRef.current - damage);
    bossHpRef.current = newHp;
    setBossHp(newHp);

    if (newHp <= 0 && !isDoneRef.current) {
      isDoneRef.current = true;
      setTimeout(() => {
        setPhase('victory');
        audioCtrl.playSE('rare');
      }, 1000);
      setTimeout(() => {
        onFinish({ coins: earnedRef.current.coins, perfectCount: earnedRef.current.perfectCount, rareDrop: 't_gold_castle' });
      }, 3000);
      return;
    }

    // 次の漢字へ
    setTimeout(() => {
      setRetryKanji(false);
      advanceToNext();
    }, 2000);
  };

  // ボスの攻撃
  const doBossAttack = (damage, msg) => {
    setPhase('boss_attack');
    setBossAttackAnim(true);
    audioCtrl.playSE('boss_hit');

    setTimeout(() => {
      setBossAttackAnim(false);
      setPlayerDamageFlash(true);
      audioCtrl.playSE('stamp_bad');
      setBattleMessage(msg);

      const newHp = Math.max(0, playerHpRef.current - damage);
      playerHpRef.current = newHp;
      setPlayerHp(newHp);

      setTimeout(() => setPlayerDamageFlash(false), 500);

      if (newHp <= 0 && !isDoneRef.current) {
        isDoneRef.current = true;
        setTimeout(() => {
          setPhase('defeated');
          audioCtrl.playSE('stamp_bad');
        }, 800);
        setTimeout(() => {
          onBossDefeat({
            coins: Math.floor(earnedRef.current.coins / 2),
            perfectCount: earnedRef.current.perfectCount,
            failedKanji: failedKanjiRef.current,
          });
        }, 4000);
        return;
      }

      // 次の漢字へ
      setTimeout(() => {
        setRetryKanji(false);
        advanceToNext();
      }, 1500);
    }, 600);
  };

  const addToFailedKanji = (k) => {
    if (!failedKanjiRef.current.find(fk => fk.id === k.id)) {
      failedKanjiRef.current = [...failedKanjiRef.current, k];
    }
  };

  const advanceToNext = () => {
    setGradeResult(null);
    setBattleMessage('');
    setIdx(prev => prev + 1);
    setPhase('writing');
  };

  if (!kanji) return null;

  // --- タイマーバーの色 ---
  const timeLimit = calcTimeLimit();
  const timeRatio = timeLeft / (timeLimit || 1);
  const timerColor = timeRatio > 0.5 ? 'bg-emerald-500' : timeRatio > 0.25 ? 'bg-yellow-500' : 'bg-red-500';

  // --- レンダリング ---
  return (
    <div className={`flex flex-col h-full w-full bg-slate-950 relative overflow-hidden transition-colors duration-200 ${playerDamageFlash ? 'bg-red-950' : ''}`}>
      {/* 背景パーティクル演出 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-rose-500/30 rounded-full"
            animate={{ y: [0, -800], x: [0, Math.sin(i) * 50], opacity: [0.5, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
            style={{ left: `${15 + i * 15}%`, top: '100%' }}
          />
        ))}
      </div>

      {/* ヘッダー: プレイヤーHP & ボスHP */}
      <div className="flex-shrink-0 px-3 py-2 md:px-6 md:py-3 flex flex-col gap-2 z-10">
        {/* プレイヤーHP */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-slate-400 w-16 shrink-0">
            <Shield size={14} className="inline mr-1" />じぶん
          </div>
          <div className="flex gap-1">
            {[...Array(PLAYER_MAX_HP)].map((_, i) => (
              <motion.div
                key={i}
                animate={i >= playerHp ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
                className="text-2xl"
              >
                {i < playerHp ? '❤️' : '🖤'}
              </motion.div>
            ))}
          </div>
        </div>
        {/* ボスHP */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-rose-400 w-16 shrink-0">👻ボス</div>
          <div className="flex-1 bg-slate-800 h-5 rounded-full border-2 border-slate-600 overflow-hidden">
            <motion.div
              animate={{ width: `${(Math.max(bossHp, 0) / BOSS_MAX_HP) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="h-full bg-gradient-to-r from-rose-700 to-rose-500"
            />
          </div>
          <div className="text-sm font-black text-rose-400 w-14 text-right">{Math.max(bossHp, 0)}/{BOSS_MAX_HP}</div>
        </div>
      </div>

      {/* メインエリア */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 md:gap-4 px-2 md:px-4 pb-2 min-h-0 overflow-hidden">
        {/* 左: ボスエリア */}
        <div className="flex flex-col items-center justify-center gap-2 lg:w-[280px] shrink-0">
          {/* ボスキャラ */}
          <div className="relative">
            <motion.div
              animate={
                bossAttackAnim
                  ? { x: [0, 80, 0], scale: [1, 1.3, 1], rotate: [0, -10, 0] }
                  : isShaking
                  ? { x: [-8, 8, -8, 8, 0], opacity: [1, 0.5, 1] }
                  : phase === 'defeated'
                  ? { opacity: 0, y: 50, rotate: 20 }
                  : { y: [-6, 6, -6] }
              }
              transition={
                bossAttackAnim
                  ? { duration: 0.4 }
                  : isShaking
                  ? { duration: 0.3 }
                  : phase === 'defeated'
                  ? { duration: 1 }
                  : { repeat: Infinity, duration: 2.5 }
              }
              className="w-28 h-28 md:w-36 md:h-36"
            >
              <SvgGhostBoss />
            </motion.div>
            {/* ボスのセリフ */}
            <AnimatePresence>
              {battleMessage && phase !== 'writing' && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 border-2 border-rose-500 text-rose-300 text-xs md:text-sm font-black px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg z-20"
                >
                  {battleMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 読みヒント */}
          <div className="bg-slate-800/80 border-2 border-slate-700 rounded-xl px-4 py-2 text-center w-full max-w-[280px]">
            <div className="text-[10px] font-bold text-rose-400 mb-1">{F("弱点","じゃくてん")}（よみ）</div>
            <div className="text-lg md:text-xl font-black text-white leading-tight">
              {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
              {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
              {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (
                <React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>
              )) : ''}
            </div>
          </div>

          {/* 獲得EXP / 情報 */}
          <div className="flex gap-2 w-full max-w-[280px]">
            <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg p-2 text-center">
              <div className="text-[9px] font-bold text-slate-500">EXP</div>
              <div className="text-sm font-black text-yellow-400">+{earnedRef.current.exp}</div>
            </div>
            <div className="flex-1 bg-slate-800/60 border border-slate-700 rounded-lg p-2 text-center">
              <div className="text-[9px] font-bold text-slate-500">{F("問目","もんめ")}</div>
              <div className="text-sm font-black text-slate-300">{Math.min(idx + 1, queue.length)}/{queue.length}</div>
            </div>
          </div>
        </div>

        {/* 右: 書き取りエリア */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 overflow-y-auto no-scrollbar gap-2">
          {/* タイマーバー */}
          {phase === 'writing' && !isLoading && strokeData.length > 0 && (
            <div className="w-full px-2" style={{ maxWidth: canvasSize }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="text-xs font-bold text-slate-400">のこり{F("時間","じかん")}</div>
                <div className={`text-sm font-black ${timeRatio > 0.25 ? 'text-slate-300' : 'text-red-400 animate-pulse'}`}>{timeLeft}{F("秒","びょう")}</div>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full border border-slate-600 overflow-hidden">
                <motion.div
                  animate={{ width: `${timeRatio * 100}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full ${timerColor} transition-colors`}
                />
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="text-5xl">😢</div>
              <p className="text-slate-300 font-bold text-lg">よみこみに しっぱいしました</p>
              <button onClick={() => { setFetchError(null); setIsLoading(true); fetchKanjiVg(kanji.char).then(({ paths: p, strokeData: data }) => { setPaths(p); setStrokeData(data); setIsLoading(false); }).catch(() => { setFetchError(true); setIsLoading(false); }); }} className="bg-rose-600 text-white font-black text-lg px-8 py-3 rounded-2xl border-[3px] border-rose-800 shadow-[3px_3px_0_#1e293b] active:shadow-none active:translate-x-[3px] active:translate-y-[3px]">🔄 もういちど ためす</button>
            </div>
          ) : phase === 'victory' ? (
            <VictoryScreen bossHp={bossHp} earned={earnedRef.current} />
          ) : phase === 'defeated' ? (
            <DefeatScreen playerHp={playerHp} failedKanji={failedKanjiRef.current} />
          ) : (
            <>
              <BossBattleCanvas
                strokeData={strokeData}
                paths={paths}
                canvasSize={canvasSize}
                onSubmit={handleSubmitStrokes}
                disabled={phase !== 'writing'}
              />

              {/* 採点結果の表示 */}
              <AnimatePresence>
                {gradeResult && phase !== 'writing' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-full bg-slate-800/90 border-2 border-slate-600 rounded-xl p-3 text-center"
                    style={{ maxWidth: canvasSize }}
                  >
                    <div className={`text-3xl font-black mb-1 ${gradeResult.total >= 80 ? 'text-yellow-400' : gradeResult.total >= 60 ? 'text-emerald-400' : gradeResult.total >= 50 ? 'text-orange-400' : 'text-red-400'}`}>
                      {gradeResult.total}点
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {gradeResult.details.map((d, i) => (
                        <span key={i} className="text-[10px] font-bold text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">{d}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// 勝利画面
const VictoryScreen = ({ earned }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className="flex flex-col items-center gap-4 text-center p-6"
  >
    <motion.div
      animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-7xl"
    >
      🎉
    </motion.div>
    <div className="text-4xl font-black text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
      ボス{F("撃破","げきは")}！！
    </div>
    <div className="text-lg font-bold text-slate-300">おみごと！ボスをたおした！</div>
    <div className="flex gap-4 mt-2">
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-xl px-6 py-3 text-center">
        <div className="text-xs text-slate-400 font-bold">EXP</div>
        <div className="text-2xl font-black text-yellow-400">+{earned.exp}</div>
      </div>
      <div className="bg-slate-800 border-2 border-yellow-500 rounded-xl px-6 py-3 text-center">
        <div className="text-xs text-slate-400 font-bold">コイン</div>
        <div className="text-2xl font-black text-yellow-400">+{earned.coins}</div>
      </div>
    </div>
  </motion.div>
);

// 敗北画面
const DefeatScreen = ({ failedKanji }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.8 }}
    className="flex flex-col items-center gap-4 text-center p-6"
  >
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="text-6xl"
    >
      💀
    </motion.div>
    <div className="text-3xl font-black text-red-400">やられた…</div>
    <div className="text-sm font-bold text-slate-400">ボスにまけてしまった…</div>
    {failedKanji.length > 0 && (
      <div className="bg-slate-800 border-2 border-red-500/50 rounded-xl p-4 w-full max-w-[300px]">
        <div className="text-xs font-bold text-red-400 mb-2">{F("復習","ふくしゅう")}リストに{F("追加","ついか")}された{F("漢字","かんじ")}</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {failedKanji.map(k => (
            <span key={k.id} className="text-2xl font-black text-white bg-red-900/50 border border-red-600 w-10 h-10 rounded-lg flex items-center justify-center">
              {k.char}
            </span>
          ))}
        </div>
      </div>
    )}
    <div className="text-xs text-slate-500 mt-2">もう少しで結果画面に移動します...</div>
  </motion.div>
);

export default BossBattleView;
