import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import TestMode from '../session/TestMode';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';

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
        <div className="text-xs font-bold text-rose-600 mb-2 flex items-center justify-center gap-1"><Flame size={16} /> のこり{F("時間","じかん")}</div>
        <div className="w-full bg-gray-200 h-6 rounded-full border-[3px] border-[var(--text)] overflow-hidden"><motion.div animate={{ width: `${(Math.max(timeLeft, 0) / 60) * 100}%` }} transition={{ duration: 0.5 }} className={`h-full transition-colors ${timeLeft < 10 ? 'bg-rose-500' : 'bg-amber-400'}`} /></div>
        <div className={`text-2xl font-black mt-1 ${timeLeft < 10 ? 'text-rose-500 animate-pulse' : ''}`}>{Math.max(timeLeft, 0)}{F("秒","びょう")}</div>
        <div className="text-xs font-bold text-[var(--text)] opacity-50 mt-1">{F("正解","せいかい")}で+5{F("秒","びょう")}、{F("不正解","ふせいかい")}で-10{F("秒","びょう")}</div>
      </div>
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-[4px_4px_0_var(--text)]">
        <div className="text-sm font-bold bg-[var(--text)] text-[var(--panel)] px-4 py-1.5 rounded-full mx-auto w-max mb-4">この「〇」は{F("何","なん")}の{F("漢字","かんじ")}？</div>
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

export default SurvivalView;
