import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import { FormatKun } from '../ui/FormatKun';
import { audioCtrl } from '../../systems/audio';

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
          <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 pointer-events-none select-none drop-shadow-sm p-2"><text x="50" y="52" dominantBaseline="middle" textAnchor="middle" fontSize="70" fontWeight="900" fill="var(--primary)" fontFamily="'Klee One', serif">{kanji.char}</text></svg>
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

export default TestMode;
