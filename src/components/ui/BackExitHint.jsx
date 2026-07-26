import { motion } from 'framer-motion';
import { F } from './FormatKun';

/**
 * ホームで戻る操作をしたときのヒント。
 * 1回目の戻る操作ではアプリを閉じずに、この案内だけを出す。
 */
const BackExitHint = () => (
  <div className="fixed inset-x-0 bottom-20 z-[120] flex justify-center px-4 pointer-events-none safe-area-bottom">
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.2 }}
      className="bg-[var(--text)] text-[var(--panel)] text-xs font-bold rounded-full px-4 py-2.5 shadow-[0_4px_0_rgba(0,0,0,0.25)] border-2 border-[var(--panel)]"
      role="status"
      aria-live="polite"
    >
      もう1{F("回", "かい")}「もどる」でアプリを{F("閉", "と")}じます
    </motion.div>
  </div>
);

export default BackExitHint;
