import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MotionButton from '../ui/MotionButton';
import TestMode from '../session/TestMode';
import { audioCtrl } from '../../systems/audio';
import { SvgGhostBoss } from '../../data/town-items';
import { FormatKun } from '../ui/FormatKun';

const BossBattleView = ({ queue, onUpdateStat, onFinish }) => {
  const [idx, setIdx] = useState(0);
  // FIX: hp を ref でも管理して stale closure を防ぐ
  const [hp, setHp] = useState(10); const hpRef = useRef(10);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });
  const isDoneRef = useRef(false);
  const [canvasSize] = useState(window.innerWidth < 768 ? 280 : 400); const [isShaking, setIsShaking] = useState(false);
  useEffect(() => { audioCtrl.playBGM('boss'); return () => audioCtrl.stopBGM(); }, []);
  const kanji = queue[idx];

  const handleEvaluate = (evalType) => {
    onUpdateStat(kanji, evalType);
    if (evalType === 'easy' || evalType === 'good') {
      const newHp = hpRef.current - 1;
      hpRef.current = newHp;
      setHp(newHp);
      earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 20, coins: earnedRef.current.coins + 5, perfectCount: evalType === 'easy' ? earnedRef.current.perfectCount + 1 : earnedRef.current.perfectCount };
      audioCtrl.playSE('boss_hit'); setIsShaking(true); setTimeout(() => setIsShaking(false), 500);
      // FIX: ref値で判定（stale closureなし）
      if (newHp <= 0 && !isDoneRef.current) {
        isDoneRef.current = true;
        setTimeout(() => onFinish({ ...earnedRef.current, rareDrop: 't_gold_castle' }), 1200);
        return;
      }
    } else { audioCtrl.playSE('stamp_bad'); }
    setTimeout(() => { setIdx(prev => (prev + 1) % queue.length); }, 1000);
  };

  if (!kanji) return null;
  const sidebar = (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-slate-800 border-[4px] border-slate-900 rounded-2xl p-4 shadow-[4px_4px_0_#0f172a] text-center relative overflow-hidden">
        <motion.div animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : { y: [-5, 5, -5] }} transition={isShaking ? { duration: 0.2 } : { repeat: Infinity, duration: 2 }} className="w-32 h-32 mx-auto mb-2 relative z-10"><SvgGhostBoss /></motion.div>
        <div className="text-xs font-bold text-rose-500 mb-1 z-10 relative">ボスの体力</div>
        <div className="w-full bg-slate-900 h-6 rounded-full border-[3px] border-slate-700 overflow-hidden z-10 relative">
          <motion.div animate={{ width: `${(Math.max(hp, 0) / 10) * 100}%` }} transition={{ type: 'spring', stiffness: 300 }} className="h-full bg-rose-600" />
        </div>
        <div className="text-lg font-black text-rose-400 mt-1">{Math.max(hp, 0)} / 10</div>
      </div>
      <div className="bg-slate-800 border-[4px] border-slate-900 rounded-2xl p-6 shadow-[4px_4px_0_#0f172a]">
        <div className="text-sm font-bold bg-slate-900 text-rose-500 px-4 py-1.5 rounded-full mx-auto w-max mb-4">ボスの弱点（よみ）</div>
        <div className="text-2xl md:text-3xl font-black text-white text-center">{kanji.on.length > 0 ? kanji.on.join(' / ') : ''}{kanji.on.length > 0 && kanji.kun.length > 0 ? ' / ' : ''}{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<React.Fragment key={i}><FormatKun text={k} />{i < kanji.kun.length - 1 ? ' / ' : ''}</React.Fragment>)) : ''}</div>
      </div>
      <div className="bg-slate-800 border-[3px] border-slate-700 rounded-xl p-3 text-center">
        <div className="text-xs font-bold text-slate-400">獲得EXP <span className="text-yellow-400 font-black">+{earnedRef.current.exp}</span></div>
      </div>
    </div>
  );
  return (
    <div className="flex flex-col lg:flex-row flex-1 min-h-0 gap-4 md:gap-6 w-full h-full bg-slate-900 rounded-[24px] p-2 md:p-4 border-[4px] border-slate-700">
      <div className="flex-1 bg-slate-800 rounded-[20px] border-[4px] border-slate-900 flex items-center justify-center overflow-auto p-2 md:p-8 relative min-h-[40vh] md:min-h-0"><TestMode kanji={kanji} onEvaluate={handleEvaluate} canvasSize={canvasSize} commonSidebar={null} /></div>
      <div className="w-full lg:w-[340px] flex flex-col shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar pb-6 lg:pb-0">{sidebar}</div>
    </div>
  );
};

export default BossBattleView;
