import { motion } from 'framer-motion';
import MotionButton from './MotionButton';
import ModalDialog from './ModalDialog';
import { F } from './FormatKun';

/**
 * 学習中に戻る操作をしたときの確認ダイアログ。
 * 端からのスワイプなどの誤操作で、いきなり学習が終わらないようにする。
 */
// 焦点をダイアログの中に閉じこめ、Esc で「つづける」と同じにする（キーボード・読み上げで使うとき、
// 以前は焦点が後ろの学習画面へ抜けていた）
const LeaveLearningDialog = ({ onCancel, onLeave }) => (
  <ModalDialog
    labelId="leave-learning-title"
    onEscape={onCancel}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[110] bg-black/60 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ scale: 0.8, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[24px] shadow-[6px_6px_0_var(--text)] p-6 max-w-xs w-full text-center"
    >
      <div className="text-5xl mb-3" aria-hidden="true">🤔</div>
      <h2 id="leave-learning-title" className="text-lg font-black text-[var(--text)] mb-1">{F("学習", "がくしゅう")}をやめる？</h2>
      {/* やめたときに残るのは、答えた字ごとの記録だけ。EXP・きょうの目標・連続日数は最後までやったときに入る。
          以前は「とちゅうまでは記録されるよ」とあり、EXP なども入るように読めた。 */}
      <p className="text-xs text-[var(--text-muted)] mb-5 leading-relaxed">
        ここまでに {F("書", "か")}いた{F("字", "じ")}の {F("記録", "きろく")}は のこるよ。<br />
        EXP と れんぞく{F("日数", "にっすう")}は、さいごまで やると もらえるよ。
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
  </ModalDialog>
);

export default LeaveLearningDialog;
