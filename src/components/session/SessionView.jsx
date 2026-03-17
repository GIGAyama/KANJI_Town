import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, PlayCircle, Pencil, CheckCircle2, Star, ChevronRight } from 'lucide-react';
import StampEffect from '../ui/StampEffect';
import { audioCtrl } from '../../systems/audio';
import ReadMode from './ReadMode';
import WatchMode from './WatchMode';
import WriteMode from './WriteMode';
import TestMode from './TestMode';
import { Analyzer } from '../../systems/analyzer';
import { F } from '../ui/FormatKun';

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
        {[{ id: 'read', icon: <Volume2 size={18} />, label: <>{F("音","おん")}{F("読","どく")}</> }, { id: 'watch', icon: <PlayCircle size={18} />, label: <>{F("書","か")}き{F("順","じゅん")}</> }, { id: 'write', icon: <Pencil size={18} />, label: "なぞる" }, { id: 'test', icon: <CheckCircle2 size={18} />, label: "テスト" }].map((t, idx) => {
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
        <div className="text-[var(--text)] font-bold text-sm bg-[var(--bg)] px-4 py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-2">のこり <span className="text-lg font-black">{queue.length}</span> {F("文字","もじ")}</div>
        <div className="flex gap-2">
          {combo > 1 && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[var(--text)] font-black text-sm bg-[var(--accent)] px-4 py-2 rounded-full border-[3px] border-[var(--text)] shadow-sm flex items-center gap-1">{combo} COMBO 🔥</motion.div>}
          {isNew && <div className="text-[var(--panel)] font-bold text-sm bg-[var(--primary)] px-4 py-2 rounded-full flex items-center gap-1 border-[3px] border-[var(--text)] shadow-sm"><Star size={16} /> {F("新出","しんしゅつ")}</div>}
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

export default SessionView;
