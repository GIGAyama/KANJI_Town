import React, { useState, useEffect, useRef } from 'react';
import { Eye, RotateCcw, Undo2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import { FormatKun, F } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';
import { gradeStrokes } from '../../systems/strokeGrader';

function scoreToRecommendation(result) {
  if (!result.strokeCountMatch) return 'again';
  if (result.total >= 80) return 'easy';
  if (result.total >= 55) return 'good';
  if (result.total >= 30) return 'hard';
  return 'again';
}

function getScoreBanner(result) {
  if (!result) return null;
  if (!result.strokeCountMatch) return { text: 'かくすうが ちがうよ💦', color: 'var(--primary)', textColor: 'var(--panel)' };
  if (result.total >= 80) return { text: 'よく 書けているよ！✨', color: 'var(--secondary)', textColor: 'var(--panel)' };
  if (result.total >= 55) return { text: 'おしい！もうすこし！', color: 'var(--accent)', textColor: 'var(--text)' };
  if (result.total >= 30) return { text: 'むずかしかったね…', color: '#fbbf24', textColor: 'var(--text)' };
  return { text: 'もうすこし れんしゅう しよう', color: 'var(--primary)', textColor: 'var(--panel)' };
}

const EVAL_BUTTONS = [
  { key: 'easy', variant: 'primary', label: 'よゆう💮', hint: '4日後〜', shadow: 'shadow-[0_6px_0_#9f1239]' },
  { key: 'good', variant: 'success', label: '書けた👍', hint: '翌日〜', shadow: 'shadow-[0_6px_0_#065f46]' },
  { key: 'hard', variant: 'warning', label: 'むずかしい😓', hint: 'まもなく', shadow: 'shadow-[0_4px_0_#92400e]' },
  { key: 'again', variant: 'danger', label: '忘れた💦', hint: 'もう一度', shadow: 'shadow-[0_4px_0_#334155]' },
];

const TestMode = ({ kanji, strokeData, onEvaluate, canvasSize, commonSidebar }) => {
  const [showAnswer, setShowAnswer] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [userStrokes, setUserStrokes] = useState([]);
  const currentPathRef = useRef([]);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const [gradeResult, setGradeResult] = useState(null);
  const [recommendedEval, setRecommendedEval] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d');
    canvas.width = canvasSize * 2; canvas.height = canvasSize * 2; canvas.style.width = '100%'; canvas.style.height = '100%';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2); ctx.clearRect(0, 0, canvasSize, canvasSize);
    setShowAnswer(false); setUserStrokes([]); setGradeResult(null); setRecommendedEval(null);
  }, [kanji, canvasSize]);

  const getCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasSize / rect.width; const scaleY = canvasSize / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDraw = (e) => {
    e.preventDefault(); setIsDrawing(true);
    const { x, y } = getCoords(e);
    lastPosRef.current = { x, y };
    currentPathRef.current = [{ x, y, time: Date.now() }];
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.strokeStyle = "var(--text)"; ctx.lineWidth = canvasSize * 0.06;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  };

  const draw = (e) => {
    e.preventDefault(); if (!isDrawing) return;
    const { x, y } = getCoords(e);
    currentPathRef.current.push({ x, y, time: Date.now() });
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y); ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPathRef.current.length > 1) {
      setUserStrokes(prev => [...prev, [...currentPathRef.current]]);
    }
  };

  const redrawStrokes = (strokes) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = "var(--text)"; ctx.lineWidth = canvasSize * 0.06;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    strokes.forEach(stroke => {
      if (stroke.length < 2) return;
      ctx.beginPath(); ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    });
  };

  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
    setUserStrokes([]);
  };

  const undoLastStroke = () => {
    if (userStrokes.length <= 0 || isDrawing) return;
    const newStrokes = userStrokes.slice(0, -1);
    setUserStrokes(newStrokes);
    redrawStrokes(newStrokes);
    audioCtrl.playSE('click');
  };

  const handleReveal = () => {
    setShowAnswer(true);
    audioCtrl.playSE('click');
    if (strokeData && strokeData.length > 0 && userStrokes.length > 0) {
      const result = gradeStrokes(userStrokes, strokeData, canvasSize);
      setGradeResult(result);
      setRecommendedEval(scoreToRecommendation(result));
    }
  };

  const banner = getScoreBanner(gradeResult);

  const main = (
    <div className="flex flex-row flex-wrap gap-4 md:gap-6 justify-center items-center w-full h-full overflow-y-auto no-scrollbar content-center pb-4 pt-4">
      <div className="relative border-[4px] border-[var(--text)] rounded-[20px] bg-[var(--panel)] overflow-hidden touch-none transition-all duration-200 shadow-[4px_4px_0_var(--text)] md:shadow-[8px_8px_0_var(--text)] shrink-0" style={{ width: canvasSize, maxWidth: showAnswer ? 'calc(50% - 16px)' : '100%', maxHeight: '100%', aspectRatio: '1/1' }}>
        <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--text)] opacity-10 -translate-x-1/2 pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--text)] opacity-10 -translate-y-1/2 pointer-events-none" />
        <canvas ref={canvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} className="absolute inset-0 z-10 cursor-crosshair w-full h-full" />
        <div className="absolute top-3 left-3 bg-[var(--text)] text-[var(--panel)] text-[10px] md:text-xs font-bold px-3 py-1 rounded-full opacity-50 pointer-events-none">かくところ</div>
        {!showAnswer && userStrokes.length > 0 && (
          <div className="absolute bottom-3 right-3 z-20 flex gap-1.5">
            <button onClick={undoLastStroke} className="bg-[var(--panel)] text-[var(--text)] text-xs font-bold px-3 py-1.5 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1 hover:bg-[var(--bg)] transition-colors">
              <Undo2 size={14} /> 1{F("画","かく")}もどす
            </button>
            <button onClick={clearCanvas} className="bg-[var(--panel)] text-[var(--text)] text-xs font-bold px-3 py-1.5 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1 hover:bg-[var(--bg)] transition-colors">
              <RotateCcw size={14} /> {F("書","か")}きなおす
            </button>
          </div>
        )}
      </div>
      {showAnswer && (
        <div className="relative border-[4px] border-[var(--primary)] rounded-[20px] bg-[var(--bg)] overflow-hidden flex items-center justify-center transition-all duration-200 shadow-[4px_4px_0_var(--primary)] md:shadow-[8px_8px_0_var(--primary)] animate-in fade-in slide-in-from-left-4 shrink-0" style={{ width: canvasSize, maxWidth: 'calc(50% - 16px)', maxHeight: '100%', aspectRatio: '1/1' }}>
          <div className="absolute top-0 left-1/2 w-0 h-full border-l-4 border-dashed border-[var(--primary)] opacity-20 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-0 w-full h-0 border-t-4 border-dashed border-[var(--primary)] opacity-20 -translate-y-1/2 pointer-events-none" />
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
        <div className="text-xs font-bold text-[var(--panel)] bg-[var(--text)] py-1.5 px-4 rounded-full mx-auto w-max mb-1">この{F("漢字","かんじ")}、{F("書","か")}ける？</div>
        <div className="text-2xl md:text-3xl font-black text-[var(--text)] tracking-wider">
          {kanji.on.length > 0 ? kanji.on.join(' / ') : ''}
          {kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}
          {kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>)) : ''}
        </div>
      </div>
      <div className="mt-auto pt-4 flex flex-col gap-3 pb-2">
        {!showAnswer ? (
          <MotionButton variant="primary" onClick={handleReveal} className="w-full py-8 text-2xl md:text-3xl font-black border-[4px] border-[var(--text)] shadow-[0_6px_0_#9f1239] animate-pulse"><Eye size={32} /> こたえあわせ</MotionButton>
        ) : (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2">
            {banner ? (
              <div className="text-center text-sm font-bold py-2 px-3 rounded-xl border-[3px] border-[var(--text)] shadow-sm mb-1" style={{ backgroundColor: banner.color, color: banner.textColor }}>
                {banner.text}
              </div>
            ) : (
              <div className="text-center text-sm font-bold text-[var(--text)] bg-[var(--accent)] py-2 rounded-xl border-[3px] border-[var(--text)] shadow-sm mb-1">
                {F("自分","じぶん")}に{F("正直","しょうじき")}に{F("評価","ひょうか")}しよう！
              </div>
            )}
            {recommendedEval && (
              <div className="text-center text-xs font-bold text-[var(--text)] opacity-70 -mt-1 mb-1">
                コンピューターの おすすめだよ！ちがうと おもったら ほかのボタンでも OK👌
              </div>
            )}
            <div className="grid grid-cols-1 gap-2">
              {EVAL_BUTTONS.map(btn => {
                const isRecommended = recommendedEval === btn.key;
                const hasRecommendation = recommendedEval !== null;
                return (
                  <div key={btn.key} className="relative">
                    {isRecommended && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-2 -right-2 z-10 bg-[var(--accent)] text-[var(--text)] text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-[var(--text)] animate-bounce"
                      >
                        👈 おすすめ！
                      </motion.div>
                    )}
                    <MotionButton
                      variant={btn.variant}
                      onClick={() => onEvaluate(btn.key)}
                      className={`w-full font-black border-[var(--text)] ${
                        isRecommended
                          ? `py-5 text-2xl border-[4px] ${btn.shadow} ring-4 ring-[var(--accent)] ring-offset-1`
                          : hasRecommendation
                            ? `py-3 text-base border-[3px] opacity-60`
                            : `py-5 text-2xl border-[4px] ${btn.shadow}`
                      }`}
                    >
                      {btn.key === 'good' ? <>{F("書","か")}けた👍</> : btn.key === 'again' ? <>{F("忘","わす")}れた💦</> : btn.label}
                      <span className="text-sm font-bold opacity-70 ml-1">
                        （{btn.key === 'easy' ? <>{F("次回","じかい")}：4{F("日後","にちご")}〜</> :
                          btn.key === 'good' ? <>{F("次回","じかい")}：{F("翌日","よくじつ")}〜</> :
                          btn.key === 'hard' ? <>{F("次回","じかい")}：まもなく</> :
                          <>もう{F("一度","いちど")}</>}）
                      </span>
                    </MotionButton>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

export default TestMode;
