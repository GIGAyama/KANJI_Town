import { motion } from 'framer-motion';
import { useDialogFocus } from './useDialogFocus';

/**
 * 画面全体をおおうダイアログの外枠（role="dialog"・aria-modal・焦点の閉じこめと戻し）。
 * motion.div の props（initial / animate / exit / className / onClick）はそのまま渡す。
 *   labelId   … 見出しの id（読み上げでダイアログの名前になる）
 *   onEscape  … Esc で閉じてよいダイアログだけ渡す
 *   focusKey  … 中身が入れかわったとき（チュートリアルの次のページなど）に変える
 */
export default function ModalDialog({ labelId, onEscape, focusKey, children, ...motionProps }) {
  const ref = useDialogFocus({ onEscape, focusKey });
  return (
    <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={labelId} tabIndex={-1} {...motionProps}>
      {children}
    </motion.div>
  );
}
