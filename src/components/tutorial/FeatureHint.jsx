// フィーチャーヒント — マイ漢字タウン（Phase 5）
// 初めて訪れた画面にツールチップ表示
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';
import { F } from '../ui/FormatKun';

// ヒント定義
const HINTS = {
  craft: { text: <>ここでは{F("素材","そざい")}を{F("使","つか")}って{F("建物","たてもの")}やアイテムをクラフトできるよ！まずは「{F("加工","かこう")}{F("素材","そざい")}」タブで{F("板材","いたざい")}やレンガを{F("作","つく")}ってみよう。</>, emoji: '🔨' },
  townEditor: { text: <>クラフトした{F("建物","たてもの")}を{F("好","す")}きな{F("場所","ばしょ")}に{F("配置","はいち")}しよう！{F("道路","どうろ")}をつなげると{F("町","まち")}らしくなるよ。</>, emoji: '🗺️' },
  residents: { text: <>{F("漢字","かんじ")}をマスターすると{F("住民","じゅうみん")}が{F("増","ふ")}えるよ。{F("住民","じゅうみん")}は{F("毎日","まいにち")}{F("素材","そざい")}やコインを{F("集","あつ")}めてくれるんだ！</>, emoji: '👥' },
  achievements: { text: <>{F("実績","じっせき")}を{F("達成","たっせい")}するとコインや{F("特別","とくべつ")}なアイテムがもらえるよ！</>, emoji: '🏅' },
  dictionary: { text: <>{F("覚","おぼ")}えた{F("漢字","かんじ")}の{F("一覧","いちらん")}だよ。タップすると{F("練習","れんしゅう")}できるよ！</>, emoji: '📚' },
  stats: { text: <>きみの{F("学習","がくしゅう")}{F("記録","きろく")}が{F("見","み")}られるよ。{F("毎日","まいにち")}の{F("努力","どりょく")}が{F("数字","すうじ")}でわかる！</>, emoji: '📊' },
};

const FeatureHint = ({ featureKey, seenHints, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const hint = HINTS[featureKey];

  useEffect(() => {
    if (hint && !(seenHints || []).includes(featureKey)) {
      const timer = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [featureKey, seenHints]);

  if (!visible || !hint) return null;

  const handleDismiss = () => {
    setVisible(false);
    onDismiss(featureKey);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="bg-blue-50 border-[3px] border-blue-300 rounded-2xl px-4 py-3 shadow-sm flex items-start gap-3 mb-2"
        >
          <span className="text-2xl shrink-0 mt-0.5">{hint.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <Lightbulb size={14} className="text-blue-500" />
              <span className="text-xs font-black text-blue-700">ヒント</span>
            </div>
            <p className="text-xs text-blue-600 leading-relaxed">{hint.text}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 text-blue-400 hover:text-blue-600 p-1 rounded-full transition-colors"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FeatureHint;
