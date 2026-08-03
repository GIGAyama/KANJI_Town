import React, { useCallback, useEffect, useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * 提示モード（電子黒板・一斉授業）の切り替え。
 *
 * 教室のいちばん後ろの席から 4けたの数字や QR が読めないと、一斉授業では使えない。
 * 押すと <body> に .presentation が付いて全体が 150% になり、あわせて
 * 画面をフルスクリーンにしてブラウザーのタブやアドレスバーを隠す。
 *
 * フルスクリーンは端末やブラウザーによって拒否されることがあるため、
 * 失敗しても文字の拡大だけは必ず効くようにしてある。
 */
export default function PresentationToggle({ className = '' }) {
  const [on, setOn] = useState(false);

  // 別画面へ移ったあとも .presentation が残ると児童画面まで巨大になるため、
  // このボタンが消えるときに必ず外す。
  useEffect(() => () => document.body.classList.remove('presentation'), []);

  // Esc などでフルスクリーンだけ解除されたとき、表示状態と食い違わないよう合わせる
  useEffect(() => {
    const sync = () => {
      if (!document.fullscreenElement && on) {
        setOn(false);
        document.body.classList.remove('presentation');
      }
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, [on]);

  const toggle = useCallback(async () => {
    const next = !on;
    setOn(next);
    document.body.classList.toggle('presentation', next);
    try {
      if (next) await document.documentElement.requestFullscreen?.();
      else if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {
      // フルスクリーンが拒否されても拡大表示だけは続ける
    }
  }, [on]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      className={`flex items-center gap-1.5 px-3 min-h-[44px] rounded-xl border-[3px] border-[var(--text)] bg-[var(--panel)] text-[var(--text)] font-bold text-sm hover:bg-[var(--bg)] transition-colors ${className}`}
    >
      {on ? <Minimize2 size={18} strokeWidth={3} /> : <Maximize2 size={18} strokeWidth={3} />}
      {on ? 'もとの大きさ' : '大きく表示'}
    </button>
  );
}
