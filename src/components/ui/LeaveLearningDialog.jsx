import { motion } from 'framer-motion';
import MotionButton from './MotionButton';
import { F } from './FormatKun';

/**
 * 学習中に戻る操作をしたときの確認ダイアログ。
 * 端からのスワイプなどの誤操作で、いきなり学習が終わらないようにする。
 */
const LeaveLearningDialog = ({ onCancel, onLeave }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-label="学習をやめるかの確認"
  >
    <motion.div
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-6 max-w-xs w-full text-center"
    >
      <div className="text-5xl mb-3" aria-hidden="true">🤔</div>
      <h2 className="text-lg font-black text-[var(--text)] mb-1">{F("学習", "がくしゅう")}をやめる？</h2>
      <p className="text-xs text-[var(--text)] opacity-60 mb-5">
        いまの{F("問題", "もんだい")}のとちゅうまでは{F("記録", "きろく")}されるよ。
      </p>
      <div className="flex flex-col gap-2">
        <MotionButton variant="primary" onClick={onCancel} className="w-full py-3 text-base border-[3px] border-[var(--text)]">
          つづける
        </MotionButton>
        <MotionButton variant="secondary" onClick={onLeave} className="w-full py-3 text-base border-[3px] border-[var(--text)]">
          やめて{F("町", "まち")}にもどる
        </MotionButton>
      </div>
    </motion.div>
  </motion.div>
);

export default LeaveLearningDialog;
