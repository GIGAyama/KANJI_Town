import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, RefreshCw, CheckCircle, XCircle, RotateCcw, LogOut } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { F, SurvivalRubyText, FormatKun } from '../ui/FormatKun';
import { gradeStrokes } from '../../systems/strokeGrader';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { TEST } from '../../constants/gameConfig';
import { getSatisfactionMultiplier, calculateSatisfaction } from '../../systems/residents';

// --- テスト専用キャンバス ---
const TestCanvas = ({ strokeData, canvasSize, onSubmit, disabled }) => {
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

  const handleStartRef = useRef(null);
  const handleMoveRef = useRef(null);
  const handleEndRef = useRef(null);

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

  handleStartRef.current = handleStart;
  handleMoveRef.current = handleMove;
  handleEndRef.current = handleEnd;

  useEffect(() => {
    const canvas = writeRef.current;
    if (!canvas) return;
    const onStart = (e) => handleStartRef.current(e);
    const onMove = (e) => handleMoveRef.current(e);
    const onEnd = (e) => handleEndRef.current(e);
    canvas.addEventListener('touchstart', onStart, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onEnd, { passive: false });
    return () => { canvas.removeEventListener('touchstart', onStart); canvas.removeEventListener('touchmove', onMove); canvas.removeEventListener('touchend', onEnd); };
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

  const expectedCount = strokeData.length;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
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

      <div className="relative border-[4px] border-amber-500 rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none shrink-0 shadow-[4px_4px_0_var(--text)]" style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-2 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />
        <canvas ref={writeRef} onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd} className="absolute inset-0 z-20 cursor-crosshair w-full h-full" />
        {disabled && <div className="absolute inset-0 z-30 bg-black/30 flex items-center justify-center" />}
      </div>

      <div className="flex gap-2 w-full" style={{ maxWidth: canvasSize }}>
        <MotionButton variant="secondary" onClick={handleClear} disabled={disabled || userStrokes.length === 0} className="flex-1 py-3 text-sm font-bold border-[3px] border-[var(--text)]">
          <RefreshCw size={16} /> {F("消","け")}す
        </MotionButton>
        <MotionButton variant="primary" onClick={handleSubmit} disabled={disabled || userStrokes.length === 0} className="flex-2 py-3 text-lg font-black border-[3px] border-[var(--text)] shadow-[0_4px_0_#9f1239] flex-grow-[2]">
          <ChevronRight size={18} /> {F("答","こた")}える
        </MotionButton>
      </div>
    </div>
  );
};

// --- ストローク再描画コンポーネント ---
const StrokeReplay = ({ userStrokes, canvasSize, displaySize = 80 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !userStrokes) return;
    c.width = displaySize * 2;
    c.height = displaySize * 2;
    const ctx = c.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, displaySize, displaySize);
    const scale = displaySize / canvasSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = displaySize * 0.07;
    ctx.strokeStyle = '#292f36';
    userStrokes.forEach(stroke => {
      if (!stroke || stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
      stroke.forEach(pt => ctx.lineTo(pt.x * scale, pt.y * scale));
      ctx.stroke();
    });
  }, [userStrokes, canvasSize, displaySize]);

  return <canvas ref={canvasRef} style={{ width: displaySize, height: displaySize }} className="rounded-lg" />;
};

// --- メインのテストビュー ---
const DrillTestView = ({ queue, stats, onUpdateStat, onFinish, startDrillSession, setView, setSessionData, createInitialSessionData }) => {
  const [phase, setPhase] = useState('testing'); // 'testing' | 'results'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [canvasSize] = useState(window.innerWidth < 768 ? 260 : 360);

  // KanjiVGデータ
  const [strokeData, setStrokeData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const total = queue.length;
  const kanji = queue[currentIdx];

  // KanjiVGデータ取得
  useEffect(() => {
    if (!kanji || phase !== 'testing') return;
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const { strokeData: data } = await fetchKanjiVg(kanji.char);
        if (cancelled) return;
        setStrokeData(data);
      } catch {
        if (cancelled) return;
        setStrokeData([]);
      }
      setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [kanji, phase]);

  // 次の問題をプリフェッチ
  useEffect(() => {
    if (phase !== 'testing' || currentIdx + 1 >= total) return;
    const nextKanji = queue[currentIdx + 1];
    if (nextKanji) fetchKanjiVg(nextKanji.char).catch(() => {});
  }, [currentIdx, phase, queue, total]);

  // ストローク提出
  const handleSubmitStrokes = (userStrokes) => {
    if (phase !== 'testing') return;
    const result = gradeStrokes(userStrokes, strokeData, canvasSize);
    const passed = result.total >= TEST.PASS_THRESHOLD && result.strokeCountMatch;

    // EXP累積のためonUpdateStatを呼ぶ
    onUpdateStat(kanji, passed ? 'good' : 'again');

    const answer = {
      kanji,
      userStrokes,
      canvasSize,
      gradeResult: result,
      passed,
    };

    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // 全問終了
      audioCtrl.playSE('success');
      setPhase('results');
    }
  };

  // 結果: 終了
  const handleFinish = () => {
    onFinish();
  };

  // 結果: 復習
  const handleReview = () => {
    // テストのEXPを確定
    onFinish();
    // 不正解の漢字で新しいドリルセッションを開始
    const failedKanjis = answers.filter(a => !a.passed).map(a => a.kanji);
    if (failedKanjis.length > 0) {
      const expMultiplier = getSatisfactionMultiplier(calculateSatisfaction(stats));
      setSessionData(createInitialSessionData({
        queue: failedKanjis,
        oldExp: stats.totalExp,
        expMultiplier,
        isDrill: true,
      }));
      // 少し遅延してからセッションビューに切り替え（onFinishの処理完了を待つ）
      setTimeout(() => setView('session'), 50);
    }
  };

  const ex = kanji?.examples?.[Math.floor(Math.random() * (kanji?.examples?.length || 1))];
  // exをrefで固定して再レンダー時に変わらないようにする
  const exRef = useRef(null);
  const exKanjiIdRef = useRef(null);
  if (kanji && exKanjiIdRef.current !== kanji.id) {
    exKanjiIdRef.current = kanji.id;
    exRef.current = kanji.examples?.[Math.floor(Math.random() * (kanji.examples?.length || 1))] || null;
  }
  const currentEx = exRef.current;

  if (phase === 'testing') {
    const correctCount = answers.filter(a => a.passed).length;

    return (
      <div className="flex flex-col h-full w-full bg-[var(--bg)] relative overflow-hidden">
        {/* ヘッダー */}
        <div className="flex-shrink-0 px-3 py-2 md:px-4 md:py-3 z-10 bg-[var(--panel)] border-b-[3px] border-[var(--text)]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 rounded-full px-2.5 py-0.5 shrink-0">
              <span className="text-xs font-black text-blue-600">テスト</span>
            </div>
            <div className="flex-1" />
            <div className="text-sm font-black text-[var(--text)] opacity-60">
              {currentIdx + 1} / {total} {F("問目","もんめ")}
            </div>
          </div>
          <div className="flex gap-0.5">
            {[...Array(total)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < currentIdx ? (answers[i]?.passed ? 'bg-emerald-400' : 'bg-rose-400') : i === currentIdx ? 'bg-blue-400/60' : 'bg-[var(--text)] opacity-10'}`} />
            ))}
          </div>
        </div>

        {/* メインエリア */}
        <div className="flex-1 flex items-center justify-center px-2 md:px-4 py-2 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <div className="text-sm font-bold text-[var(--text)] opacity-50">よみこみ中...</div>
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 lg:gap-6">
              {/* 左: お題パネル */}
              <div className="w-full lg:flex-1 flex flex-col gap-3 order-first">
                {/* 例文 */}
                <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl p-4 md:p-5 shadow-[3px_3px_0_var(--text)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black text-[var(--text)] opacity-50">
                      この「◯」は{F("何","なん")}の{F("漢字","かんじ")}？
                    </span>
                  </div>
                  {currentEx ? (
                    <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--text)] text-center ruby-text leading-relaxed">
                      <SurvivalRubyText text={currentEx} targetChar={kanji.char} />
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

                {/* 読みヒント */}
                <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-2xl px-4 py-2 shadow-[3px_3px_0_var(--text)]">
                  <div className="text-[10px] font-bold text-[var(--text)] opacity-40 mb-1">よみかた</div>
                  <div className="text-base font-black text-[var(--text)] text-center">
                    {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
                    {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
                    {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (
                      <React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>
                    )) : ''}
                  </div>
                </div>
              </div>

              {/* 右: キャンバス */}
              <div className="w-full lg:w-auto flex flex-col items-center">
                <TestCanvas
                  strokeData={strokeData}
                  canvasSize={canvasSize}
                  onSubmit={handleSubmitStrokes}
                  disabled={false}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Phase: results
  const correctCount = answers.filter(a => a.passed).length;
  const incorrectCount = total - correctCount;
  const percentage = Math.round((correctCount / total) * 100);
  const allCorrect = incorrectCount === 0;

  return (
    <div className="flex flex-col h-full w-full bg-[var(--bg)] relative overflow-hidden">
      {/* ヘッダー */}
      <div className="flex-shrink-0 px-4 py-3 z-10 bg-[var(--panel)] border-b-[3px] border-[var(--text)]">
        <div className="text-center">
          <div className="text-2xl font-black text-[var(--text)]">
            {allCorrect ? '🎉' : percentage >= 80 ? '😊' : percentage >= 60 ? '🙂' : '😢'} テスト{F("結果","けっか")}
          </div>
        </div>
      </div>

      {/* スコアサマリー */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-4 shadow-[4px_4px_0_var(--text)]">
          <div className="text-center">
            <div className="text-4xl font-black text-[var(--text)] mb-1">{percentage}%</div>
            <div className="text-sm font-bold text-[var(--text)] opacity-60">
              {total}{F("問中","もんちゅう")}{correctCount}{F("問正解","もんせいかい")}
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-2 text-center border-2 border-emerald-300">
              <div className="text-[10px] font-bold text-emerald-600 opacity-70">{F("正解","せいかい")}</div>
              <div className="text-xl font-black text-emerald-600">{correctCount}</div>
            </div>
            <div className="flex-1 bg-rose-50 dark:bg-rose-900/20 rounded-xl p-2 text-center border-2 border-rose-300">
              <div className="text-[10px] font-bold text-rose-600 opacity-70">{F("不正解","ふせいかい")}</div>
              <div className="text-xl font-black text-rose-600">{incorrectCount}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 回答一覧 */}
      <div className="flex-1 overflow-auto px-4 pb-4 min-h-0">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {answers.map((answer, i) => (
            <div key={i} className={`bg-[var(--panel)] border-[3px] rounded-xl p-2 flex flex-col items-center gap-1 ${answer.passed ? 'border-emerald-400' : 'border-rose-400'}`}>
              <div className="relative">
                <StrokeReplay userStrokes={answer.userStrokes} canvasSize={answer.canvasSize} displaySize={60} />
                <div className={`absolute -top-1 -right-1 ${answer.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {answer.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--text)]">{answer.kanji.char}</div>
              <div className={`text-[10px] font-black ${answer.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {answer.gradeResult.total}{F("点","てん")}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex-shrink-0 px-4 py-3 bg-[var(--panel)] border-t-[3px] border-[var(--text)]">
        <div className="flex gap-3">
          {!allCorrect && (
            <MotionButton variant="primary" onClick={handleReview} className="flex-1 py-3 text-sm font-black border-[3px] border-[var(--text)] shadow-[0_3px_0_#9f1239]">
              <RotateCcw size={16} /> {F("復習","ふくしゅう")}する
            </MotionButton>
          )}
          <MotionButton variant={allCorrect ? 'primary' : 'secondary'} onClick={handleFinish} className={`flex-1 py-3 text-sm font-black border-[3px] border-[var(--text)] ${allCorrect ? 'shadow-[0_3px_0_#9f1239]' : 'shadow-[0_3px_0_var(--text)]'}`}>
            <LogOut size={16} /> おわる
          </MotionButton>
        </div>
      </div>
    </div>
  );
};

export default DrillTestView;
