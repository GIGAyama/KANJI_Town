import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { migrateCard, calculateNextReview } from '../../systems/srs';
import { StorageAPI } from '../../systems/storage';

const FlashcardView = ({ queue, stats, setStats, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  // FIX: earned を ref で管理してタイマーの再起動バグを防ぐ
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0 });
  const [displayEarned, setDisplayEarned] = useState({ exp: 0, coins: 0 });
  const isDoneRef = useRef(false);
  // スワイプ検出用
  const touchStartX = useRef(0);

  // タイマーは idx と timeLeft だけに依存させる（earnedを除外）
  useEffect(() => {
    if (timeLeft <= 0 || idx >= queue.length) {
      if (!isDoneRef.current) { isDoneRef.current = true; onFinish(earnedRef.current); }
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, idx, queue.length, onFinish]);

  const kanji = queue[idx];

  const handleAnswer = (isKnown) => {
    if (!kanji) return;
    if (!isKnown) {
      let newStats = { ...stats };
      const cur = migrateCard(newStats.kanjiStats[kanji.id]);
      newStats.kanjiStats[kanji.id] = { ...cur, ...calculateNextReview(cur, 'again'), status: 'learning', mistakes: (cur.mistakes || 0) + 1 };
      setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('stamp_bad');
    } else {
      earnedRef.current = { ...earnedRef.current, exp: earnedRef.current.exp + 2, coins: earnedRef.current.coins + 1 };
      setDisplayEarned({ ...earnedRef.current });
      audioCtrl.playSE('stamp_good');
    }
    setIdx(prev => prev + 1);
  };

  // スワイプ操作
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) { handleAnswer(dx > 0); } // 右スワイプ→わかる、左→忘れた
  };

  if (!kanji) return null;
  return (
    <div className="flex flex-col h-[85vh] items-center justify-center p-4 relative w-full max-w-md mx-auto">
      <div className="absolute top-0 w-full flex justify-between items-center p-4">
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          <Timer size={16} className={timeLeft <= 10 ? 'text-rose-500 animate-pulse' : ''} /> {timeLeft}s
        </span>
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          {idx + 1} / {queue.length}
        </span>
      </div>
      <div className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] p-6 flex flex-col items-center gap-6 shadow-[8px_8px_0_var(--text)]"
        onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="text-sm font-bold bg-[var(--bg)] px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] flex items-center gap-2">
          わかるかな？ <span className="text-[10px] opacity-50">← 忘れた ／ わかる →</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={kanji.id} initial={{ scale: 0.8, opacity: 0, x: 30 }} animate={{ scale: 1, opacity: 1, x: 0 }} exit={{ scale: 1.1, opacity: 0, x: -30 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="text-[10rem] md:text-[14rem] font-black leading-none select-none" style={{ fontFamily: "'Klee One', serif" }}>
            {kanji.char}
          </motion.div>
        </AnimatePresence>
        <div className="text-xs font-bold text-[var(--text)] opacity-40 flex items-center gap-2">
          <span className="bg-[var(--bg)] px-2 py-1 rounded">+{displayEarned.exp} EXP</span>
          <span className="bg-[var(--bg)] px-2 py-1 rounded">🪙 {displayEarned.coins}</span>
        </div>
        <div className="flex w-full gap-4 mt-2">
          <MotionButton variant="danger" onClick={() => handleAnswer(false)} className="flex-1 py-8 text-2xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#334155]">忘れた💦</MotionButton>
          <MotionButton variant="success" onClick={() => handleAnswer(true)} className="flex-1 py-8 text-2xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#065f46]">わかる👍</MotionButton>
        </div>
      </div>
    </div>
  );
};

export default FlashcardView;
