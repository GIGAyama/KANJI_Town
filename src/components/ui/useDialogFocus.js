import { useEffect, useRef } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * ダイアログを開いている間、キーボードの焦点をダイアログの中に閉じこめる。
 *
 * - 開いたら [data-autofocus] の要素（無ければ最初のボタン）に焦点を移す
 * - Tab / Shift+Tab は中で循環させる（以前は後ろの画面のボタンへ抜けていた）
 * - Esc で onEscape を呼ぶ（渡したときだけ）
 * - 閉じたら、開く前に焦点があった場所へ戻す
 *
 * 返す ref を、ダイアログの外枠（role="dialog" の要素、tabIndex={-1}）に付ける。
 * focusKey を変えると、もう一度 [data-autofocus] へ焦点を移す（チュートリアルの「つぎへ」など）。
 */
export function useDialogFocus({ onEscape, focusKey } = {}) {
  const ref = useRef(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const previous = document.activeElement;
    const items = () => [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0);
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && escapeRef.current) {
        event.preventDefault();
        escapeRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = items();
      if (list.length === 0) { event.preventDefault(); node.focus(); return; }
      const index = list.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); list[list.length - 1].focus(); }
      else if (!event.shiftKey && (index === -1 || index === list.length - 1)) { event.preventDefault(); list[0].focus(); }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);

  // 開いたとき・focusKey が変わったときに、決めた場所へ焦点を移す
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const target = node.querySelector('[data-autofocus]') || node.querySelector(FOCUSABLE) || node;
    target.focus({ preventScroll: true });
  }, [focusKey]);

  return ref;
}
