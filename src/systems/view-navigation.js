// 画面遷移スタック — マイ漢字タウン
// スマホ・タブレットの「戻る」操作（画面下のナビゲーションバー／端からのスワイプ）を
// ブラウザの戻る＝アプリ終了ではなく、アプリ内の1つ前の画面に割り当てるための純粋ロジック。
// 副作用（history API）はuseViewNavigationフックが担当する。

export const HOME_VIEW = 'home';

/** 中断すると学習の進みが失われる画面（戻る操作の前に確認する） */
export const LEARNING_VIEWS = Object.freeze(['session', 'flashcard', 'survival', 'boss', 'drillTest']);

/** ホームで戻る操作をしてから、次の戻る操作でアプリを閉じるまでの猶予(ms) */
export const EXIT_CONFIRM_WINDOW = 2500;

/**
 * 一度離れたら戻っても意味が無い（＝履歴に残さない）画面。
 * drillImportはリンクで受け取ったドリルの確認画面。保存や練習を選んだあとに
 * 戻ってくると同じドリルを二重に保存できてしまうため、離れたら履歴から外す。
 */
export const REPLACE_ON_LEAVE_VIEWS = Object.freeze([...LEARNING_VIEWS, 'result', 'drillImport']);

export function isLearningView(view) {
  return LEARNING_VIEWS.includes(view);
}

/**
 * 起動時の画面スタックを作る。
 * QRコードからの起動や学習の再開で最初の画面がホーム以外でも、
 * 必ずホームを土台に置き「戻る」でホームへ帰れるようにする。
 */
export function createViewStack(initialView) {
  if (!initialView || initialView === HOME_VIEW) return [HOME_VIEW];
  return [HOME_VIEW, initialView];
}

export function getCurrentView(stack) {
  return stack[stack.length - 1];
}

/**
 * setView相当の画面切り替えを、新しいスタックと履歴操作へ変換する。
 * - 既にスタックにある画面へ移る場合は「戻る」として扱い、履歴が無限に伸びるのを防ぐ
 * - 終わった学習画面やリザルト画面は置き換えて、戻る操作で再入場しないようにする
 */
export function resolveViewChange(stack, nextView) {
  const current = getCurrentView(stack);
  if (!nextView || nextView === current) {
    return { type: 'none', stack, steps: 0 };
  }
  const index = stack.lastIndexOf(nextView);
  if (index >= 0) {
    return { type: 'back', stack: stack.slice(0, index + 1), steps: stack.length - 1 - index };
  }
  if (REPLACE_ON_LEAVE_VIEWS.includes(current) && stack.length > 1) {
    return { type: 'replace', stack: [...stack.slice(0, -1), nextView], steps: 0 };
  }
  return { type: 'push', stack: [...stack, nextView], steps: 1 };
}

/** 戻る操作（ナビゲーションバー／スワイプ／アプリ内の戻るボタン）の結果 */
export function resolveBackNavigation(stack) {
  if (stack.length <= 1) return { type: 'exit', stack, steps: 0 };
  return { type: 'back', stack: stack.slice(0, -1), steps: 1 };
}

/**
 * popstateで通知された履歴位置を、あるべきスタックへ変換する。
 * - sync   : 自前の履歴操作の反響。状態は反映済みなので何もしない
 * - resync : 「進む」操作。行き先の画面は破棄済みなので履歴位置だけ戻す
 * - exit   : スタックの底（ホーム）での戻る操作
 */
export function resolveHistoryIndex(stack, index) {
  const currentIndex = stack.length - 1;
  if (!Number.isInteger(index) || index < 0) return { type: 'exit', stack, steps: 0 };
  if (index === currentIndex) return { type: 'sync', stack, steps: 0 };
  if (index > currentIndex) return { type: 'resync', stack, steps: currentIndex - index };
  return { type: 'back', stack: stack.slice(0, index + 1), steps: currentIndex - index };
}

/**
 * ホームでの戻る操作でアプリを閉じてよいか判定する。
 * 直前にも戻る操作をしていた場合（＝閉じる意思がある場合）だけtrue。
 */
export function isExitConfirmed(lastBackAt, now, window = EXIT_CONFIRM_WINDOW) {
  if (!Number.isFinite(lastBackAt) || lastBackAt <= 0) return false;
  return now - lastBackAt <= window;
}
