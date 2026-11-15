import { X } from 'lucide-react';

const TONES = {
  light: 'border-[var(--text)] bg-[var(--panel)] text-[var(--text)]',
  // ボスバトルの暗い画面用
  dark: 'border-slate-400 bg-slate-800 text-slate-100',
};

/**
 * 学習画面の上の帯に置く「やめる」ボタン。押すと確認ダイアログ（LeaveLearningDialog）を出す。
 *
 * 学習画面にはヘッダーが無く、抜ける道はブラウザか端末の「戻る」だけだった。
 * iPad でホーム画面に入れて開くとブラウザの戻るボタンが無いので、学習から抜けられなかった。
 * onClick が無いときは何も描かない（呼び出し側で出し分けなくてよい）。
 */
const LeaveLearningButton = ({ onClick, tone = 'light' }) => {
  if (!onClick) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="学習をやめる"
      className={`shrink-0 min-w-[44px] min-h-[44px] px-2.5 rounded-full border-[3px] ${TONES[tone] || TONES.light} font-black text-xs md:text-sm flex items-center justify-center gap-1 shadow-sm active:translate-y-0.5`}
    >
      <X size={18} aria-hidden="true" />
      <span>やめる</span>
    </button>
  );
};

export default LeaveLearningButton;
