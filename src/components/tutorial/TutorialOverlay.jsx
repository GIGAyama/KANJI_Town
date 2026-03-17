// チュートリアルオーバーレイ — マイ漢字タウン（Phase 5）
// ストーリー仕立ての導入チュートリアル
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, PenTool, Map, Hammer, Users, Star } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { F } from '../ui/FormatKun';

const TUTORIAL_STEPS = [
  {
    title: 'ようこそ！',
    message: <>ここは「マイ{F("漢字","かんじ")}タウン」！{'\n'}{F("漢字","かんじ")}を{F("覚","おぼ")}えると、きみだけの{F("町","まち")}ができていくよ。</>,
    emoji: '🏕️',
    icon: Star,
  },
  {
    title: <>{F("漢字","かんじ")}を{F("覚","おぼ")}えよう</>,
    message: <>{F("学年","がくねん")}をえらんで「{F("漢字","かんじ")}を{F("覚","おぼ")}える」ボタンをおそう。{'\n'}{F("見","み")}る→{F("書","か")}く→テストの3ステップで{F("練習","れんしゅう")}するよ。</>,
    emoji: '✏️',
    icon: PenTool,
  },
  {
    title: <>{F("住民","じゅうみん")}がやってくる</>,
    message: <>{F("漢字","かんじ")}をマスターすると、{F("町","まち")}に{F("新","あたら")}しい{F("住民","じゅうみん")}がやってくるよ！{'\n'}{F("住民","じゅうみん")}たちは{F("素材","そざい")}を{F("集","あつ")}めてくれるんだ。</>,
    emoji: '👥',
    icon: Users,
  },
  {
    title: <>クラフトで{F("建物","たてもの")}を{F("作","つく")}ろう</>,
    message: <>{F("集","あつ")}めた{F("素材","そざい")}で{F("建物","たてもの")}をクラフトしよう！{'\n'}{F("家","いえ")}やお{F("店","みせ")}、お{F("城","しろ")}だって{F("作","つく")}れるよ。</>,
    emoji: '🔨',
    icon: Hammer,
  },
  {
    title: <>まちを{F("大","おお")}きくしよう</>,
    message: <>{F("作","つく")}った{F("建物","たてもの")}を{F("町","まち")}に{F("配置","はいち")}して、{F("自分","じぶん")}だけの{F("町","まち")}をつくろう！{'\n'}たくさん{F("漢字","かんじ")}を{F("覚","おぼ")}えると、{F("探検","たんけん")}できる{F("場所","ばしょ")}がどんどん{F("増","ふ")}えるよ。</>,
    emoji: '🗺️',
    icon: Map,
  },
  {
    title: 'さあ、はじめよう！',
    message: <>{F("毎日","まいにち")}{F("少","すこ")}しずつ{F("続","つづ")}けると、{F("町","まち")}はどんどんにぎやかになるよ。{'\n'}ログインボーナスやデイリーミッションもあるから、がんばろう！</>,
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
