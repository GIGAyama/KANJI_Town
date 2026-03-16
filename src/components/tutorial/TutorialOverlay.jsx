// チュートリアルオーバーレイ — マイ漢字タウン（Phase 5）
// ストーリー仕立ての導入チュートリアル
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, PenTool, Map, Hammer, Users, Star } from 'lucide-react';
import MotionButton from '../ui/MotionButton';

const TUTORIAL_STEPS = [
  {
    title: 'ようこそ！',
    message: 'ここは「マイ漢字タウン」！\n漢字を覚えると、きみだけの町ができていくよ。',
    emoji: '🏕️',
    icon: Star,
  },
  {
    title: '漢字を覚えよう',
    message: '学年をえらんで「漢字を覚える」ボタンをおそう。\n見る→書く→テストの3ステップで練習するよ。',
    emoji: '✏️',
    icon: PenTool,
  },
  {
    title: '住民がやってくる',
    message: '漢字をマスターすると、町に新しい住民がやってくるよ！\n住民たちは素材を集めてくれるんだ。',
    emoji: '👥',
    icon: Users,
  },
  {
    title: 'クラフトで建物を作ろう',
    message: '集めた素材で建物をクラフトしよう！\n家やお店、お城だって作れるよ。',
    emoji: '🔨',
    icon: Hammer,
  },
  {
    title: 'まちを大きくしよう',
    message: '作った建物を町に配置して、自分だけの町をつくろう！\nたくさん漢字を覚えると、探検できる場所がどんどん増えるよ。',
    emoji: '🗺️',
    icon: Map,
  },
  {
    title: 'さあ、はじめよう！',
    message: '毎日少しずつ続けると、町はどんどんにぎやかになるよ。\nログインボーナスやデイリーミッションもあるから、がんばろう！',
    emoji: '🌟',
    icon: Star,
  },
];

const TutorialOverlay = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const current = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const Icon = current.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        key={step}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-6 max-w-sm w-full"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="text-6xl mb-3"
          >
            {current.emoji}
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <Icon size={20} className="text-[var(--primary)]" />
            <h2 className="text-xl font-black text-[var(--text)]">{current.title}</h2>
          </div>

          <p className="text-sm text-[var(--text)] opacity-70 leading-relaxed whitespace-pre-line mb-6">
            {current.message}
          </p>

          {/* ステップインジケーター */}
          <div className="flex justify-center gap-1.5 mb-4">
            {TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === step ? 'bg-[var(--primary)] scale-125' : i < step ? 'bg-[var(--secondary)]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {step > 0 && (
              <MotionButton
                variant="secondary"
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 text-sm border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)]"
              >
                もどる
              </MotionButton>
            )}
            <MotionButton
              variant={isLast ? 'primary' : 'accent'}
              onClick={() => {
                if (isLast) onComplete();
                else setStep(s => s + 1);
              }}
              className="flex-1 py-3 text-sm border-[3px] border-[var(--text)] shadow-[0_2px_0_var(--text)] font-black"
            >
              {isLast ? 'はじめる！' : <>つぎへ <ChevronRight size={16} /></>}
            </MotionButton>
          </div>

          {!isLast && (
            <button
              onClick={onComplete}
              className="mt-3 text-xs text-[var(--text)] opacity-40 hover:opacity-70 transition-opacity"
            >
              スキップする
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TutorialOverlay;
