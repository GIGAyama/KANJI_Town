// フィーチャーヒント — マイ漢字タウン（Phase 5）
// 初めて訪れた画面にツールチップ表示
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

// ヒント定義
const HINTS = {
  craft: { text: 'ここでは素材を使って建物やアイテムをクラフトできるよ！まずは「加工素材」タブで板材やレンガを作ってみよう。', emoji: '🔨' },
  townEditor: { text: 'クラフトした建物を好きな場所に配置しよう！道路をつなげると町らしくなるよ。', emoji: '🗺️' },
  residents: { text: '漢字をマスターすると住民が増えるよ。住民は毎日素材やコインを集めてくれるんだ！', emoji: '👥' },
  achievements: { text: '実績を達成するとコインや特別なアイテムがもらえるよ！', emoji: '🏅' },
  dictionary: { text: '覚えた漢字の一覧だよ。タップすると練習できるよ！', emoji: '📚' },
  stats: { text: 'きみの学習記録が見られるよ。毎日の努力が数字でわかる！', emoji: '📊' },
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
