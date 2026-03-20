import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Pencil, ChevronRight, Undo2, Trash2 } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import ModeLayout from '../ui/ModeLayout';
import Confetti from '../ui/Confetti';
import { Analyzer } from '../../systems/analyzer';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';

const WriteMode = ({ paths, strokeData, crossMatrix, onNext, canvasSize, commonSidebar, onRecordPerfect }) => {
  const guideRef = useRef(null); const inkRef = useRef(null); const writeRef = useRef(null);
  const [currentStroke, setCurrentStroke] = useState(0); const [isDrawing, setIsDrawing] = useState(false);
  const [count, setCount] = useState(0); const [statusMsg, setStatusMsg] = useState("１かくめ をかこう！");
  const [showConfetti, setShowConfetti] = useState(false); const [floatingTexts, setFloatingTexts] = useState([]);
  const [userStrokes, setUserStrokes] = useState([]); const [history, setHistory] = useState([]);
  const distSum = useRef(0); const currentPathRef = useRef([]); const strokeDists = useRef([]);

  const addFloatingText = (x, y, text, color = 'var(--primary)', scale = 1) => { const id = Date.now() + Math.random(); setFloatingTexts(prev => [...prev, { id, x, y, text, color, scale }]); setTimeout(() => { setFloatingTexts(prev => prev.filter(t => t.id !== id)); }, 1500); };
  const initCanvases = useCallback(() => { [guideRef, inkRef, writeRef].forEach(ref => { const c = ref.current; if (c) { c.width = canvasSize * 2; c.height = canvasSize * 2; c.style.width = '100%'; c.style.height = '100%'; const ctx = c.getContext('2d'); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(2, 2); ctx.clearRect(0, 0, canvasSize, canvasSize); } }); }, [canvasSize]);

  useEffect(() => { setCount(0); setCurrentStroke(0); setUserStrokes([]); setHistory([]); setStatusMsg("１かくめ をかこう！"); setShowConfetti(false); distSum.current = 0; strokeDists.current = []; initCanvases(); }, [paths, canvasSize, initCanvases]);

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
  const resetPractice = () => { setCurrentStroke(0); setUserStrokes([]); setStatusMsg("１かくめ をかこう！"); distSum.current = 0; strokeDists.current = []; clearCanvas(writeRef); };
  const handleNextTry = () => { setCount(c => c + 1); setCurrentStroke(0); setUserStrokes([]); setStatusMsg("１かくめ をかこう！"); distSum.current = 0; strokeDists.current = []; clearCanvas(writeRef); };
  const undoLastStroke = () => { if (currentStroke <= 0 || isDrawing) return; const newStroke = currentStroke - 1; setCurrentStroke(newStroke); setUserStrokes(prev => prev.slice(0, -1)); const lastDist = strokeDists.current.pop() || 0; distSum.current -= lastDist; clearCanvas(writeRef); setStatusMsg(`${newStroke + 1}かくめ をかこう！`); audioCtrl.playSE('click'); };

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
      const nextStroke = currentStrokeRef.current + 1; setUserStrokes(prev => [...prev, [...currentPathRef.current]]); setCurrentStroke(nextStroke); clearCanvas(writeRef); distSum.current += currentDist; strokeDists.current.push(currentDist);
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
          <span className="text-sm font-bold text-[var(--text)] pl-2">{count < 2 ? <>なぞり{F("書","が")}き</> : count < 5 ? <>{F("手","て")}{F("書","が")}き ({F("手本","てほん")}あり)</> : <>{F("空書","からが")}き ({F("手本","てほん")}なし)</>}</span><div className="text-sm font-black bg-[var(--text)] text-[var(--panel)] px-3 py-1 rounded-lg shadow-sm">{count + 1} {F("回目","かいめ")}</div>
        </div>
        <div className={`text-sm font-black px-3 py-2 rounded-xl border-[2px] border-[var(--text)] text-center shadow-sm transition-colors ${statusMsg.includes('💦') ? 'bg-[var(--primary)] text-[var(--panel)]' : statusMsg.includes('💮') ? 'bg-[var(--secondary)] text-[var(--panel)]' : 'bg-white text-[var(--text)]'}`}>{statusMsg}</div>
      </div>
      {history.length > 0 && (
        <div className="bg-[var(--panel)] p-2 rounded-2xl border-[4px] border-[var(--text)] shadow-[4px_4px_0_var(--text)] flex flex-col gap-1 shrink-0 mt-2">
          <span className="text-[10px] font-bold text-[var(--text)] px-1">これまでに{F("書","か")}いた{F("字","じ")}</span>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {history.map((img, idx) => (<div key={idx} className="w-14 h-14 shrink-0 bg-[var(--bg)] border-2 border-[var(--text)] rounded-lg overflow-hidden relative flex items-center justify-center"><span className="absolute top-0.5 left-1 text-[8px] font-black text-[var(--text)] opacity-40">{idx + 1}</span><img src={img} className="w-full h-full object-contain p-1" alt={`try ${idx + 1}`} /></div>))}
          </div>
        </div>
      )}
      <div className="mt-auto pt-2 flex flex-col gap-2 pb-2 shrink-0">
        <div className="flex gap-2">
          <MotionButton variant="secondary" onClick={undoLastStroke} disabled={currentStroke <= 0 || isDrawing} className={`py-2 text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)] ${currentStroke <= 0 ? 'opacity-40' : ''}`}><Undo2 size={16} /> 1{F("画","かく")}もどす</MotionButton>
          <MotionButton variant="secondary" onClick={resetPractice} disabled={currentStroke <= 0 || isDrawing} className={`py-2 text-sm border-[2px] border-[var(--text)] flex-1 shadow-[0_2px_0_var(--text)] ${currentStroke <= 0 ? 'opacity-40' : ''}`}><Trash2 size={16} /> ぜんぶけす</MotionButton>
        </div>
        <div className="flex flex-col gap-2 w-full mt-1">
          <MotionButton variant={currentStroke >= paths.length ? "primary" : "secondary"} disabled={currentStroke < paths.length} onClick={handleNextTry} className={`w-full py-6 text-2xl font-black border-[4px] border-[var(--text)] ${currentStroke >= paths.length ? 'shadow-[0_6px_0_#9f1239] animate-pulse' : 'opacity-50'}`}><Pencil size={24} /> もう1{F("回","かい")}{F("書","か")}く！</MotionButton>
          <AnimatePresence>{history.length >= 2 && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}><MotionButton variant="success" onClick={onNext} className={`w-full py-4 text-xl font-black border-[4px] border-[var(--text)] shadow-[0_4px_0_#065f46]`}>テストへ{F("進","すす")}む！ <ChevronRight size={24} /></MotionButton></motion.div>)}</AnimatePresence>
        </div>
      </div>
    </>
  );
  return <ModeLayout mainContent={main} sidebarContent={sidebar} />;
};

export default WriteMode;
