import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createViewStack,
  getCurrentView,
  isExitConfirmed,
  resolveBackNavigation,
  resolveHistoryIndex,
  resolveViewChange,
} from '../systems/view-navigation';

// 履歴エントリに埋め込むスタック位置。他のstate（?connect=除去時のreplaceState等）は保持する
const HISTORY_KEY = 'kanjiTownViewIndex';

const readIndex = (state) => (
  state && Number.isInteger(state[HISTORY_KEY]) ? state[HISTORY_KEY] : null
);

const buildHistoryState = (index) => ({ ...(window.history.state || {}), [HISTORY_KEY]: index });

/**
 * 画面遷移をブラウザ履歴へ写し、端末の「戻る」操作をアプリ内の階層移動に変える。
 *
 * 履歴の並び: [ガード(-1)] [画面0] [画面1] ...
 * ガードを1つ余分に積んでおくことで、ホームでの戻る操作がページ離脱
 * （＝アプリ終了・ブラウザの戻る）にならず、アプリ側で受け止められる。
 *
 * @param {string} initialView 起動時の画面
 * @param {{onBeforeBack?: (view: string) => boolean, onExitBlocked?: () => void}} handlers
 *   onBeforeBack: 戻る操作を横取りしたい場合にtrueを返す（オーバーレイを閉じる・確認を出す等）
 *   onExitBlocked: ホームでの戻る操作でアプリ終了を止めたときの通知
 */
export function useViewNavigation(initialView, { onBeforeBack, onExitBlocked } = {}) {
  const [stack, setStack] = useState(() => createViewStack(initialView));
  const stackRef = useRef(stack);
  const lastBackAtRef = useRef(0);
  const handlersRef = useRef({ onBeforeBack, onExitBlocked });
  handlersRef.current = { onBeforeBack, onExitBlocked };

  const applyStack = useCallback((nextStack) => {
    stackRef.current = nextStack;
    setStack(nextStack);
  }, []);

  // 現在の画面の履歴エントリを積み直す（戻る操作を取り消して、その場に留まる）
  const restoreCurrentEntry = useCallback(() => {
    window.history.pushState(buildHistoryState(stackRef.current.length - 1), '');
  }, []);

  // 起動時にガード＋現在のスタック分の履歴を用意する
  useEffect(() => {
    const depth = stackRef.current.length;
    // StrictModeの二重実行やSW更新後の再マウントで履歴を重ねない
    if (readIndex(window.history.state) === depth - 1) return;
    window.history.replaceState(buildHistoryState(-1), '');
    for (let i = 0; i < depth; i += 1) {
      window.history.pushState(buildHistoryState(i), '');
    }
  }, []);

  useEffect(() => {
    const handlePopState = (event) => {
      const result = resolveHistoryIndex(stackRef.current, readIndex(event.state));
      if (result.type === 'sync') return;
      if (result.type === 'resync') {
        // 「進む」で戻ってきた画面は既に破棄済み。履歴位置だけ現在地へ戻す
        window.history.go(result.steps);
        return;
      }

      const { onBeforeBack, onExitBlocked } = handlersRef.current;
      if (onBeforeBack?.(getCurrentView(stackRef.current))) {
        restoreCurrentEntry();
        return;
      }

      if (result.type === 'exit') {
        const now = Date.now();
        if (isExitConfirmed(lastBackAtRef.current, now)) {
          lastBackAtRef.current = 0;
          window.history.back(); // 2回続けての戻る操作なので離脱を許可する
          // 直接開かれたタブなど、戻る先が無く離脱できなかった場合はガードを積み直す
          window.setTimeout(() => {
            if (readIndex(window.history.state) !== stackRef.current.length - 1) restoreCurrentEntry();
          }, 300);
          return;
        }
        lastBackAtRef.current = now;
        restoreCurrentEntry();
        onExitBlocked?.();
        return;
      }

      lastBackAtRef.current = 0;
      applyStack(result.stack);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [applyStack, restoreCurrentEntry]);

  /** setViewの置き換え。文字列でも更新関数でも受け取れる */
  const navigate = useCallback((update) => {
    const currentStack = stackRef.current;
    const nextView = typeof update === 'function' ? update(getCurrentView(currentStack)) : update;
    const result = resolveViewChange(currentStack, nextView);
    if (result.type === 'none') return;
    lastBackAtRef.current = 0;
    applyStack(result.stack);
    if (result.type === 'push') {
      window.history.pushState(buildHistoryState(result.stack.length - 1), '');
      return;
    }
    if (result.type === 'replace') {
      // 履歴の位置は変えず、その場の画面だけ差し替える
      window.history.replaceState(buildHistoryState(result.stack.length - 1), '');
      return;
    }
    if (result.steps > 0) window.history.go(-result.steps);
  }, [applyStack]);

  /** アプリ内の「戻る」ボタン用。端末の戻る操作と同じ動きをする */
  const goBack = useCallback(() => {
    const result = resolveBackNavigation(stackRef.current);
    if (result.type !== 'back') return;
    applyStack(result.stack);
    window.history.go(-result.steps);
  }, [applyStack]);

  return {
    view: getCurrentView(stack),
    navigate,
    goBack,
    canGoBack: stack.length > 1,
  };
}
