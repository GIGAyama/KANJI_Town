import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, RefreshCw, CheckCircle, XCircle, RotateCcw, LogOut, X, Search, Pencil } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import KanjiGlyph from '../ui/KanjiGlyph';
import { audioCtrl } from '../../systems/audio';
import { F, SurvivalRubyText, FormatKun } from '../ui/FormatKun';
import { gradeStrokes, getGradeLabel } from '../../systems/strokeGrader';
import { fetchKanjiVg } from '../../systems/kanjiVg';
import { TEST, GRADING } from '../../constants/gameConfig';
import { resolveThemeColor } from '../../utils/theme-colors';
import { attachDrawListeners } from '../../utils/draw-pointer-events';
import { useLearningViewport } from '../../hooks/useLearningViewport';

const WRITING_SKILLS = { skills: ['writing', 'stroke'] };

/** 画ごとの出来ばえ(0-1)を色にする。キャンバス描画なのでCSS変数は使えない */
const STROKE_COLORS = { good: '#10b981', fair: '#f59e0b', poor: '#f43f5e' };
const strokeTone = (ratio) => (ratio >= 0.75 ? 'good' : ratio >= 0.45 ? 'fair' : 'poor');

/** 採点内訳の表示定義（strokeGrader の breakdown.key と対応） */
const SCORE_ROWS = [
  { key: 'shape', label: <>{F('字形', 'じけい')}</>, desc: 'かたちが おてほんに にているか' },
  { key: 'order', label: <>{F('書', 'か')}きじゅん</>, desc: 'かく じゅんばん' },
  { key: 'ending', label: <>とめ・はね・はらい</>, desc: 'さいごの しまつ' },
  { key: 'cross', label: <>つきぬけ</>, desc: 'せんの まじわりかた' },
  { key: 'start', label: <>{F('書', 'か')}きはじめ</>, desc: 'スタートの いち' },
  { key: 'end', label: <>{F('書', 'か')}きおわり</>, desc: 'ゴールの いち' },
];

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
    ctx.strokeStyle = resolveThemeColor('--text');
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
    ctx.strokeStyle = resolveThemeColor('--text');
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
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={inkRef} className="absolute inset-0 z-10 pointer-events-none w-full h-full" />
        <canvas ref={writeRef} className="absolute inset-0 z-20 cursor-crosshair w-full h-full touch-none" />
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
// feedback を渡すと、画ごとの出来ばえで色分けし、書いた順の番号を打つ。
// 「どの画で点を落としたか」「どの順で書いたか」が一目で分かるようにするため。
const StrokeReplay = ({ userStrokes, canvasSize, displaySize = 80, feedback = null, showNumbers = false }) => {
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
    const inkColor = resolveThemeColor('--text');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = displaySize * 0.07;
    userStrokes.forEach((stroke, i) => {
      if (!stroke || stroke.length === 0) return;
      const fb = feedback?.[i];
      ctx.strokeStyle = fb ? STROKE_COLORS[strokeTone(fb.shape)] : inkColor;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
      stroke.forEach(pt => ctx.lineTo(pt.x * scale, pt.y * scale));
      ctx.stroke();
    });
    if (!showNumbers) return;
    const r = displaySize * 0.085;
    ctx.font = `900 ${displaySize * 0.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    userStrokes.forEach((stroke, i) => {
      if (!stroke || stroke.length === 0) return;
      const x = stroke[0].x * scale;
      const y = stroke[0].y * scale;
      const fb = feedback?.[i];
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = resolveThemeColor('--panel');
      ctx.fill();
      ctx.lineWidth = Math.max(1.5, displaySize * 0.012);
      ctx.strokeStyle = fb && !fb.inOrder ? STROKE_COLORS.poor : inkColor;
      ctx.stroke();
      ctx.fillStyle = fb && !fb.inOrder ? STROKE_COLORS.poor : inkColor;
      ctx.fillText(String(i + 1), x, y + displaySize * 0.005);
    });
  }, [userStrokes, canvasSize, displaySize, feedback, showNumbers]);

  return <canvas ref={canvasRef} style={{ width: displaySize, height: displaySize }} className="rounded-lg" />;
};

// --- お手本（KanjiVG）表示 ---
// 筆順データを取れなかったとき（オフラインなど）は、字だけでも見せる
const ModelKanji = ({ paths, strokeStarts, char, size = 140 }) => (
  <div className="relative border-[3px] border-[var(--primary)] rounded-2xl bg-[var(--bg)] overflow-hidden shrink-0" style={{ width: size, height: size }}>
    <div className="absolute top-0 left-1/2 w-0 h-full border-l-2 border-dashed border-[var(--primary)] opacity-20 -translate-x-1/2" />
    <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-[var(--primary)] opacity-20 -translate-y-1/2" />
    <KanjiGlyph char={char} paths={paths ?? []} strokeWidth={5} className="absolute inset-0 w-full h-full z-10" />
    <svg viewBox="0 0 109 109" className="w-full h-full relative z-10">
      {strokeStarts?.map((s, i) => (
        <g key={`n${i}`}>
          <circle cx={s.x * 109} cy={s.y * 109} r="6" fill="var(--panel)" stroke="var(--primary)" strokeWidth="1.5" />
          <text x={s.x * 109} y={s.y * 109 + 0.5} dominantBaseline="central" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--primary)">{i + 1}</text>
        </g>
      ))}
    </svg>
  </div>
);

/** なぜこの点数になったのかを、まず一言で伝える */
function buildVerdict(answer) {
  const g = answer.gradeResult;
  const actual = answer.userStrokes?.length ?? 0;
  const expected = answer.expectedStrokeCount ?? 0;
  if (expected === 0) {
    return {
      tone: 'bad',
      title: <>おてほんを よみこめなかったよ</>,
      body: <>つうしんが うまく いかなくて、{F('採点', 'さいてん')}できなかったよ。あとで もういちど ためしてね。</>,
    };
  }
  if (!g.strokeCountMatch) {
    return {
      tone: 'bad',
      title: <>{F('画数', 'かくすう')}が ちがったよ</>,
      body: <>おてほんは {expected}かく、きみは {actual}かく {F('書', 'か')}いたよ。ちがう{F('字', 'じ')}に なってしまうので 0{F('点', 'てん')}だよ。</>,
    };
  }
  if (g.orderMatch === false) {
    return {
      tone: 'bad',
      title: <>{F('書', 'か')}きじゅんが ちがったよ</>,
      body: <>かたちが よくても、{F('書', 'か')}きじゅんが ちがうと {GRADING.ORDER_FAIL_CAP}{F('点', 'てん')}までに なるよ。ばんごうを くらべてみよう。</>,
    };
  }
  if (g.crossMatch === false) {
    return {
      tone: 'bad',
      title: <>せんの つきぬけかたが ちがったよ</>,
      body: <>つきぬける ところと、とめる ところを おてほんで たしかめよう。</>,
    };
  }
  if (answer.passed) {
    return {
      tone: 'good',
      title: <>ごうかく！よく {F('書', 'か')}けたね</>,
      body: <>{TEST.PASS_THRESHOLD}{F('点', 'てん')}いじょうで ごうかくだよ。{g.total}{F('点', 'てん')}だったよ。</>,
    };
  }
  return {
    tone: 'bad',
    title: <>あと {TEST.PASS_THRESHOLD - g.total}{F('点', 'てん')}で ごうかくだったよ</>,
    body: <>したの うちわけで、{F('点', 'てん')}が へった ところを みてみよう。</>,
  };
}

/** 採点のうちわけ1行 */
const ScoreRow = ({ label, desc, points, max }) => {
  const ratio = max > 0 ? points / max : 0;
  const tone = strokeTone(ratio);
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 shrink-0">
        <div className="text-xs font-black text-[var(--text)] leading-tight">{label}</div>
        <div className="text-[9px] font-bold text-[var(--text)] opacity-40 leading-tight">{desc}</div>
      </div>
      <div className="flex-1 h-3 rounded-full bg-[var(--text)]/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.round(ratio * 100)}%`, backgroundColor: STROKE_COLORS[tone] }} />
      </div>
      <div className="w-14 text-right text-xs font-black shrink-0" style={{ color: STROKE_COLORS[tone] }}>
        {points}<span className="opacity-50 font-bold">/{max}</span>
      </div>
    </div>
  );
};

// --- 回答カードの詳細（なぜこの点数になったのか）---
const AnswerDetailSheet = ({ answer, index, total, onPrev, onNext, onClose, onPractice }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onPrev();
      if (e.key === 'ArrowRight' && index < total - 1) onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext, index, total]);

  const g = answer.gradeResult;
  const verdict = buildVerdict(answer);
  const gradeLabel = getGradeLabel(g.total);
  const actualCount = answer.userStrokes?.length ?? 0;
  const expectedCount = answer.expectedStrokeCount ?? 0;
  const rows = SCORE_ROWS
    .map(row => ({ ...row, score: g.breakdown?.find(b => b.key === row.key) }))
    .filter(row => row.score?.evaluated);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${answer.kanji.char} のけっか`}
    >
      <motion.div
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto no-scrollbar shadow-[6px_6px_0_var(--text)]"
        initial={{ y: 40, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-[var(--panel)] border-b-[3px] border-[var(--text)]">
          <div className={`text-4xl font-black leading-none ${answer.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{answer.kanji.char}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${answer.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{g.total}</span>
              <span className="text-xs font-black text-[var(--text)] opacity-60">{F('点', 'てん')}</span>
              <span className="text-xs font-bold text-[var(--text)] opacity-70 truncate">{gradeLabel.label}</span>
            </div>
            <div className="text-[10px] font-bold text-[var(--text)] opacity-40">{index + 1} / {total} {F('問目', 'もんめ')}</div>
          </div>
          <button onClick={onClose} aria-label="とじる" className="shrink-0 w-9 h-9 rounded-full border-[3px] border-[var(--text)] bg-[var(--bg)] flex items-center justify-center">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 flex flex-col gap-3">
          {/* なぜこの点数か */}
          <div className={`rounded-2xl border-[3px] p-3 ${verdict.tone === 'good' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-rose-400 bg-rose-50 dark:bg-rose-900/20'}`}>
            <div className={`text-sm font-black mb-1 ${verdict.tone === 'good' ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
              {verdict.tone === 'good' ? '🎉 ' : '💡 '}{verdict.title}
            </div>
            <div className="text-xs font-bold text-[var(--text)] opacity-80 leading-relaxed">{verdict.body}</div>
          </div>

          {/* きみの字 と おてほん */}
          <div className="flex items-start justify-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-black text-[var(--text)] bg-[var(--accent)] px-3 py-0.5 rounded-full border-2 border-[var(--text)]">きみの{F('字', 'じ')}</div>
              <div className="border-[3px] border-[var(--text)] rounded-2xl bg-[var(--panel)] overflow-hidden relative" style={{ width: 140, height: 140 }}>
                <div className="absolute top-0 left-1/2 w-0 h-full border-l-2 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 w-full h-0 border-t-2 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2" />
                <StrokeReplay
                  userStrokes={answer.userStrokes}
                  canvasSize={answer.canvasSize}
                  displaySize={140}
                  feedback={g.strokeFeedback}
                  showNumbers
                />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-[10px] font-black text-[var(--panel)] bg-[var(--primary)] px-3 py-0.5 rounded-full border-2 border-[var(--text)]">おてほん</div>
              <ModelKanji paths={answer.paths} strokeStarts={answer.strokeStarts} char={answer.kanji.char} size={140} />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] font-bold text-[var(--text)] opacity-60">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: STROKE_COLORS.good }} />よい</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: STROKE_COLORS.fair }} />もうすこし</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full inline-block" style={{ backgroundColor: STROKE_COLORS.poor }} />なおそう</span>
            <span>①＝{F('書', 'か')}いた じゅんばん</span>
          </div>

          {/* 合否のもとになる3つの条件。画数が違うときは他の2つを採点していないので中立表示にする */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { state: expectedCount === 0 ? 'skip' : g.strokeCountMatch ? 'ok' : 'ng', label: <>{F('画数', 'かくすう')}</>, value: `${actualCount}/${expectedCount}` },
              { state: !g.strokeCountMatch ? 'skip' : g.orderMatch !== false ? 'ok' : 'ng', label: <>{F('書', 'か')}きじゅん</>, value: g.orderMatch !== false ? 'OK' : 'ちがう' },
              { state: !g.strokeCountMatch ? 'skip' : g.crossMatch !== false ? 'ok' : 'ng', label: <>つきぬけ</>, value: g.crossMatch !== false ? 'OK' : 'ちがう' },
            ].map((item, i) => (
              <div
                key={i}
                className={`rounded-xl border-2 p-2 text-center ${
                  item.state === 'ok' ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                    : item.state === 'ng' ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20'
                      : 'border-[var(--text)]/20 bg-[var(--bg)]'
                }`}
              >
                <div className="text-[10px] font-bold text-[var(--text)] opacity-60">{item.label}</div>
                <div className={`text-sm font-black ${item.state === 'ok' ? 'text-emerald-600' : item.state === 'ng' ? 'text-rose-600' : 'text-[var(--text)] opacity-40'}`}>
                  {item.state === 'skip' ? 'ー' : `${item.state === 'ok' ? '✓' : '✗'} ${item.value}`}
                </div>
              </div>
            ))}
          </div>

          {/* 採点のうちわけ */}
          {rows.length > 0 && (
            <div className="rounded-2xl border-[3px] border-[var(--text)] p-3 flex flex-col gap-2">
              <div className="text-xs font-black text-[var(--text)] opacity-70">{F('点数', 'てんすう')}の うちわけ</div>
              {rows.map(row => (
                <ScoreRow key={row.key} label={row.label} desc={row.desc} points={row.score.points} max={row.score.max} />
              ))}
              <div className="border-t-2 border-dashed border-[var(--text)] opacity-100 pt-2 flex items-center justify-between">
                <span className="text-xs font-black text-[var(--text)]">
                  {F('合計', 'ごうけい')}（ごうかくは {TEST.PASS_THRESHOLD}{F('点', 'てん')}）
                </span>
                <span className={`text-lg font-black ${answer.passed ? 'text-emerald-600' : 'text-rose-600'}`}>{g.total}{F('点', 'てん')}</span>
              </div>
            </div>
          )}

          {/* 講評 */}
          {g.details?.length > 0 && (
            <div className="rounded-2xl border-[3px] border-[var(--text)] p-3">
              <div className="text-xs font-black text-[var(--text)] opacity-70 mb-1.5">せんせいから ひとこと</div>
              <ul className="flex flex-col gap-1">
                {g.details.map((d, i) => (
                  <li key={i} className="text-xs font-bold text-[var(--text)] opacity-80 flex gap-1.5">
                    <span className={d.includes('✓') ? 'text-emerald-500' : 'text-amber-500'}>{d.includes('✓') ? '◎' : '・'}</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="sticky bottom-0 bg-[var(--panel)] border-t-[3px] border-[var(--text)] px-4 py-3 flex flex-col gap-2">
          <MotionButton
            variant={answer.passed ? 'secondary' : 'primary'}
            onClick={() => onPractice(answer.kanji)}
            className={`w-full py-3 text-sm font-black border-[3px] border-[var(--text)] ${answer.passed ? 'shadow-[0_3px_0_var(--text)]' : 'shadow-[0_3px_0_#9f1239]'}`}
          >
            <Pencil size={16} /> この{F('漢字', 'かんじ')}を {F('練習', 'れんしゅう')}する
          </MotionButton>
          <div className="flex gap-2">
            <MotionButton variant="secondary" onClick={onPrev} disabled={index === 0} className="flex-1 py-2 text-xs font-black border-[3px] border-[var(--text)]">
              <ChevronLeft size={16} /> まえ
            </MotionButton>
            <MotionButton variant="secondary" onClick={onNext} disabled={index >= total - 1} className="flex-1 py-2 text-xs font-black border-[3px] border-[var(--text)]">
              つぎ <ChevronRight size={16} />
            </MotionButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- メインのテストビュー ---
const DrillTestView = ({ queue, onUpdateStat, onFinish, onReviewMistakes }) => {
  const [phase, setPhase] = useState('testing'); // 'testing' | 'results'
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [detailIdx, setDetailIdx] = useState(null); // 結果画面で開いている回答カード
  // 画面回転にも追従する。サイズ変更時は TestCanvas 側で書きかけの画が消える(通常モードと同じ挙動)
  const { canvasSize } = useLearningViewport('drillTest');

  // KanjiVGデータ
  const [strokeData, setStrokeData] = useState([]);
  const [paths, setPaths] = useState([]);
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
        const { strokeData: data, paths: p } = await fetchKanjiVg(kanji.char);
        if (cancelled) return;
        setStrokeData(data);
        setPaths(p);
      } catch {
        if (cancelled) return;
        setStrokeData([]);
        setPaths([]);
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
    const passed = result.total >= TEST.PASS_THRESHOLD && result.strokeCountMatch && result.crossMatch !== false;

    // EXP累積のためonUpdateStatを呼ぶ
    onUpdateStat(kanji, passed ? 'good' : 'again', WRITING_SKILLS);

    // 結果画面で「なぜこの点数か」を見せるため、お手本も回答といっしょに残す
    const answer = {
      kanji,
      userStrokes,
      canvasSize,
      gradeResult: result,
      passed,
      paths,
      strokeStarts: strokeData.map(s => s.s),
      expectedStrokeCount: strokeData.length,
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

  // 結果: 間違えた漢字だけを学習モードで復習する
  const handleReview = () => {
    const failedKanjis = answers.filter(a => !a.passed).map(a => a.kanji);
    if (failedKanjis.length === 0) return;
    audioCtrl.playSE('click');
    onReviewMistakes(failedKanjis);
  };

  // 詳細から: この漢字1文字だけを学習モードで練習する
  const handlePracticeOne = (kanji) => {
    audioCtrl.playSE('click');
    onReviewMistakes([kanji]);
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
            <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 lg:gap-6">
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
        <div className="flex items-center justify-center gap-1.5 mb-2 text-[11px] font-black text-[var(--text)] opacity-60">
          <Search size={13} />
          カードを タップすると、なぜ その{F("点数","てんすう")}か わかるよ
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {answers.map((answer, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { audioCtrl.playSE('click'); setDetailIdx(i); }}
              aria-label={`${answer.kanji.char} ${answer.gradeResult.total}点 のくわしいけっかを見る`}
              className={`bg-[var(--panel)] border-[3px] rounded-xl p-2 flex flex-col items-center gap-1 transition-transform active:scale-95 hover:-translate-y-0.5 cursor-pointer ${answer.passed ? 'border-emerald-400 hover:shadow-[3px_3px_0_#34d399]' : 'border-rose-400 hover:shadow-[3px_3px_0_#fb7185]'}`}
            >
              <div className="relative">
                <StrokeReplay userStrokes={answer.userStrokes} canvasSize={answer.canvasSize} displaySize={60} feedback={answer.gradeResult.strokeFeedback} />
                <div className={`absolute -top-1 -right-1 ${answer.passed ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {answer.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--text)]">{answer.kanji.char}</div>
              <div className={`text-[10px] font-black flex items-center gap-0.5 ${answer.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {answer.gradeResult.total}{F("点","てん")}
                <ChevronRight size={11} className="opacity-60" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 回答カードの詳細 */}
      <AnimatePresence>
        {detailIdx !== null && answers[detailIdx] && (
          <AnswerDetailSheet
            answer={answers[detailIdx]}
            index={detailIdx}
            total={answers.length}
            onPrev={() => setDetailIdx(i => Math.max(0, i - 1))}
            onNext={() => setDetailIdx(i => Math.min(answers.length - 1, i + 1))}
            onClose={() => setDetailIdx(null)}
            onPractice={handlePracticeOne}
          />
        )}
      </AnimatePresence>

      {/* ボタン */}
      <div className="flex-shrink-0 px-4 py-3 bg-[var(--panel)] border-t-[3px] border-[var(--text)]">
        {!allCorrect && (
          <div className="text-center text-[11px] font-bold text-[var(--text)] opacity-60 mb-2">
            まちがえた{incorrectCount}{F("問","もん")}だけを、{F("書","か")}き{F("順","じゅん")}から{F("練習","れんしゅう")}できるよ
          </div>
        )}
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
