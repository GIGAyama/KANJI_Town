import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EXIT_CONFIRM_WINDOW,
  createViewStack,
  getCurrentView,
  isExitConfirmed,
  isLearningView,
  resolveBackNavigation,
  resolveHistoryIndex,
  resolveViewChange,
} from '../src/systems/view-navigation.js';

test('起動時のスタックは必ずホームを土台にする', () => {
  assert.deepEqual(createViewStack('home'), ['home']);
  assert.deepEqual(createViewStack(), ['home']);
  // QRコード起動や学習の再開でも、戻る操作でホームへ帰れるようにする
  assert.deepEqual(createViewStack('peerClient'), ['home', 'peerClient']);
  assert.deepEqual(createViewStack('session'), ['home', 'session']);
});

test('新しい画面は積み上げ、同じ画面への遷移は何もしない', () => {
  const pushed = resolveViewChange(['home'], 'dictionary');
  assert.equal(pushed.type, 'push');
  assert.deepEqual(pushed.stack, ['home', 'dictionary']);
  assert.equal(getCurrentView(pushed.stack), 'dictionary');

  assert.equal(resolveViewChange(['home', 'dictionary'], 'dictionary').type, 'none');
  assert.equal(resolveViewChange(['home'], null).type, 'none');
});

test('スタックにある画面へ戻るときは履歴も戻して伸び続けないようにする', () => {
  const result = resolveViewChange(['home', 'myDrills', 'drillEditor'], 'myDrills');
  assert.equal(result.type, 'back');
  assert.equal(result.steps, 1);
  assert.deepEqual(result.stack, ['home', 'myDrills']);

  const toHome = resolveViewChange(['home', 'myDrills', 'drillEditor'], 'home');
  assert.equal(toHome.type, 'back');
  assert.equal(toHome.steps, 2);
  assert.deepEqual(toHome.stack, ['home']);
});

test('終わった学習画面・リザルト画面は置き換えて戻る操作で再入場させない', () => {
  const toResult = resolveViewChange(['home', 'session'], 'result');
  assert.equal(toResult.type, 'replace');
  assert.deepEqual(toResult.stack, ['home', 'result']);

  // リザルトから続けて学習した場合もリザルトは残さない
  const again = resolveViewChange(toResult.stack, 'session');
  assert.equal(again.type, 'replace');
  assert.deepEqual(again.stack, ['home', 'session']);

  // 学習→リザルト→ホームは1回の戻る操作でホームに着く
  const back = resolveBackNavigation(again.stack);
  assert.equal(back.type, 'back');
  assert.deepEqual(back.stack, ['home']);
});

test('リンクで受け取ったドリルの確認画面は、離れたら履歴に残さない', () => {
  // 共有リンクからの起動（ホームの上に確認画面が乗る）
  const start = createViewStack('drillImport');
  assert.deepEqual(start, ['home', 'drillImport']);

  // 保存してマイドリルへ移ると、確認画面は履歴から外れる（二重保存の防止）
  const toMyDrills = resolveViewChange(start, 'myDrills');
  assert.equal(toMyDrills.type, 'replace');
  assert.deepEqual(toMyDrills.stack, ['home', 'myDrills']);

  // そのまま練習を始めた場合も同じ
  const toSession = resolveViewChange(start, 'session');
  assert.equal(toSession.type, 'replace');
  assert.deepEqual(toSession.stack, ['home', 'session']);
});

test('ホームでの戻る操作はアプリ終了ではなく終了確認になる', () => {
  assert.equal(resolveBackNavigation(['home']).type, 'exit');
  assert.equal(resolveBackNavigation(['home', 'stats']).type, 'back');
});

test('popstateの履歴位置からスタックを復元する', () => {
  const stack = ['home', 'myDrills', 'drillEditor'];
  // 1つ前の階層へ
  const back = resolveHistoryIndex(stack, 1);
  assert.equal(back.type, 'back');
  assert.deepEqual(back.stack, ['home', 'myDrills']);
  // 一気に2階層戻る（スワイプの連続操作など）
  assert.deepEqual(resolveHistoryIndex(stack, 0).stack, ['home']);
  // 自前の履歴操作の反響は無視する
  assert.equal(resolveHistoryIndex(stack, 2).type, 'sync');
  // 「進む」は破棄済みの画面なので履歴位置だけ戻す
  const forward = resolveHistoryIndex(stack, 4);
  assert.equal(forward.type, 'resync');
  assert.equal(forward.steps, -2);
  // ガード（アプリ終了側）へ抜けた場合
  assert.equal(resolveHistoryIndex(['home'], -1).type, 'exit');
  assert.equal(resolveHistoryIndex(['home'], null).type, 'exit');
});

test('2回続けて戻る操作をしたときだけアプリを閉じる', () => {
  const now = 10_000;
  assert.equal(isExitConfirmed(0, now), false);
  assert.equal(isExitConfirmed(now - 500, now), true);
  assert.equal(isExitConfirmed(now - (EXIT_CONFIRM_WINDOW + 1), now), false);
});

test('学習中の画面を判定できる', () => {
  assert.equal(isLearningView('session'), true);
  assert.equal(isLearningView('boss'), true);
  assert.equal(isLearningView('home'), false);
  assert.equal(isLearningView('result'), false);
});
