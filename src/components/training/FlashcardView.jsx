import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { audioCtrl } from '../../systems/audio';
import { F, FormatKun } from '../ui/FormatKun';
import { migrateCard, calculateNextReview, recordPracticeAttempt } from '../../systems/srs';
import { StorageAPI } from '../../systems/storage';
import { recordSkillEvidence } from '../../systems/mastery';

const FlashcardView = ({ queue, stats, setStats, onFinish }) => {
  const [idx, setIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const earnedRef = useRef({ exp: 0, coins: 0, perfectCount: 0, reviewedCount: 0, attemptCount: 0, correctCount: 0 });
  const [displayEarned, setDisplayEarned] = useState({ exp: 0, coins: 0 });
  const isDoneRef = useRef(false);
  const touchStartX = useRef(0);

  // カウントアップタイマー
  useEffect(() => {
    if (idx >= queue.length) return;
    const timer = setInterval(() => setElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [idx, queue.length]);

  // 完了判定
  useEffect(() => {
    if (idx >= queue.length && !isDoneRef.current) {
      isDoneRef.current = true;
      onFinish(earnedRef.current);
    }
  }, [idx, queue.length, onFinish]);

  const kanji = queue[idx];

  const handleReveal = useCallback(() => {
    if (!revealed && kanji) {
      setRevealed(true);
      audioCtrl.playSE('click');
    }
  }, [revealed, kanji]);

  const handleAnswer = useCallback((isKnown) => {
    if (!kanji || !revealed) return;
    const evaluation = isKnown ? 'good' : 'again';
    earnedRef.current = {
      ...earnedRef.current,
      exp: earnedRef.current.exp + (isKnown ? 2 : 0),
      coins: earnedRef.current.coins + (isKnown ? 1 : 0),
      reviewedCount: earnedRef.current.reviewedCount + (isKnown ? 1 : 0),
      attemptCount: earnedRef.current.attemptCount + 1,
      correctCount: earnedRef.current.correctCount + (isKnown ? 1 : 0),
    };

    setStats(currentStats => {
      const cur = migrateCard(currentStats.kanjiStats?.[kanji.id]);
      const skillMastery = recordSkillEvidence(cur, [
        { skill: 'reading', evidence: evaluation },
        { skill: 'meaning', evidence: 'exposed' },
      ]);
      const card = isKnown
        ? { ...cur, skillMastery, ...recordPracticeAttempt(cur, evaluation) }
        : {
          ...cur,
          skillMastery,
          ...calculateNextReview(cur, evaluation),
          status: 'learning',
          mistakes: (cur.mistakes || 0) + 1,
          ...recordPracticeAttempt(cur, evaluation),
        };
      const newStats = {
        ...currentStats,
        kanjiStats: { ...currentStats.kanjiStats, [kanji.id]: card },
      };
      StorageAPI.saveStats(newStats);
      return newStats;
    });

    if (isKnown) {
      setDisplayEarned({ ...earnedRef.current });
      audioCtrl.playSE('stamp_good');
    } else {
      audioCtrl.playSE('stamp_bad');
    }
    setRevealed(false);
    setIdx(prev => prev + 1);
  }, [kanji, revealed, setStats]);

  // スワイプ操作（読み表示後のみ）
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (!revealed && Math.abs(dx) < 30) { handleReveal(); return; }
    if (revealed && Math.abs(dx) > 60) { handleAnswer(dx > 0); }
  };

  // キーボード操作
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!revealed) handleReveal(); else handleAnswer(true); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); handleAnswer(true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); handleAnswer(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, handleReveal, handleAnswer]);

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!kanji) return null;

  return (
    <div className="flex flex-col h-[85vh] items-center justify-center p-4 relative w-full max-w-md mx-auto">
      <div className="absolute top-0 w-full flex justify-between items-center p-4">
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          <Timer size={16} /> {formatTime(elapsed)}
        </span>
        <span className="font-bold flex items-center gap-1 text-[var(--text)] bg-[var(--panel)] px-3 py-1 rounded-full border-[3px] border-[var(--text)] shadow-sm">
          {idx + 1} / {queue.length}
        </span>
      </div>

      <div
        className="w-full bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] p-6 flex flex-col items-center gap-4 shadow-[8px_8px_0_var(--text)] cursor-pointer select-none"
        onClick={!revealed ? handleReveal : undefined}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!revealed ? (
          <div className="text-sm font-bold bg-[var(--bg)] px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] flex items-center gap-2">
            タップで読みを表示 <span className="text-[10px] opacity-50">Space / Enter</span>
          </div>
        ) : (
          <div className="text-sm font-bold bg-[var(--bg)] px-4 py-1.5 rounded-full border-[3px] border-[var(--text)] flex items-center gap-2">
            ← 読めなかった ／ 読めた → <span className="text-[10px] opacity-50">矢印キー</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={kanji.id}
            initial={{ scale: 0.8, opacity: 0, x: 30 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 1.1, opacity: 0, x: -30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-[10rem] md:text-[14rem] font-black leading-none"
            style={{ fontFamily: "'Klee One', serif" }}
          >
            {kanji.char}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {revealed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3 w-full"
            >
              <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
                <span className="text-sm font-bold text-[var(--primary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--primary)] shrink-0">{F("音","おん")}</span>
                <div className="flex flex-wrap gap-1.5 justify-end">{kanji.on.length > 0 ? kanji.on.map((o, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300">{o}</span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
              </div>
              <div className="bg-[var(--panel)] rounded-xl px-4 py-3 border-[3px] border-[var(--text)] shadow-sm flex items-start justify-between gap-4">
                <span className="text-sm font-bold text-[var(--secondary)] bg-[var(--bg)] px-3 py-1 rounded-lg border-2 border-[var(--secondary)] shrink-0">{F("訓","くん")}</span>
                <div className="flex flex-wrap gap-1.5 justify-end">{kanji.kun.length > 0 ? kanji.kun.map((k, i) => (<span key={i} className="font-black text-xl text-[var(--text)] bg-gray-100 px-2 py-0.5 rounded-md border border-gray-300"><FormatKun text={k} /></span>)) : <span className="font-black text-xl text-gray-400">-</span>}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!revealed && (
          <div className="text-xs font-bold text-[var(--text)] opacity-40 flex items-center gap-2">
            <span className="bg-[var(--bg)] px-2 py-1 rounded">+{displayEarned.exp} EXP</span>
            <span className="bg-[var(--bg)] px-2 py-1 rounded">{displayEarned.coins}</span>
          </div>
        )}

        {revealed && (
          <div className="flex w-full gap-4 mt-2">
            <MotionButton variant="danger" onClick={() => handleAnswer(false)} className="flex-1 py-6 text-xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#334155]">読めなかった</MotionButton>
            <MotionButton variant="success" onClick={() => handleAnswer(true)} className="flex-1 py-6 text-xl border-[4px] border-[var(--text)] shadow-[0_6px_0_#065f46]">読めた！</MotionButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardView;
