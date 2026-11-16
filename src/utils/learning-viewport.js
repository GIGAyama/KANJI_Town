const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * キャンバス論理サイズの上限。
 * 640論理px → バッキングストア1280×1280×4B ≈ 6.55MB/枚。
 * 最悪ケース(なぞり練習の3層)でも約20MBで、GIGA端末(3-4GB RAM)で問題ない。
 */
const CANVAS_MAX = 640;

/**
 * 縦に重ねたレイアウトで、書くマスの枠の外に要る高さ（px）。
 * 上のヘッダーとタブ（約150）＋ 下のボタンの領域（テストの、詰めた形で約200）から、
 * 枠の下の余白ぶんを引いて、マスの下に 10px ほど残るように決めた実測値。
 *
 * 以前は「画面の高さの 50%（620px 未満は 42%）」だけで決めていて、下のボタンの領域の高さを
 * 見ていなかった。高さ 620〜720px のスマホ（ブラウザの枠が出ている iPhone・Android）では、
 * 枠に入りきらないマスが縦に 30px つぶれるか、正方形にするとマスの下が最大 24px ボタンの下に隠れた。
 * 下のボタンがいちばん多いのはテストなので、テストで隠れなければ、ほかのタブでも隠れない。
 *
 * ⚠️ ModeLayout.jsx の枠の高さ（calc(100dvh - この値)）と同じ値にすること
 *    （test/learning-viewport.test.js が見ている）。高さ 590px より低い画面ではマスが
 *    下限の 220px になり、577px より低いと下が隠れはじめる（実測: 568px で 9px・560px で 17px）。
 */
export const STACKED_RESERVE = 348;

/**
 * 学習画面のレイアウトと正方形キャンバスの論理サイズを算出する。
 * 幅だけでなく高さと縦横比も考慮し、タブレット縦持ちでサイドバーが
 * 学習領域を圧迫しないようにする。
 */
export function calculateLearningViewport(width, height) {
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 768;
  const isPortrait = safeHeight >= safeWidth;
  const isStacked = safeWidth < 768 || (isPortrait && safeWidth < 960);

  if (isStacked) {
    const availableWidth = safeWidth - 32;
    // 枠の高さは「画面の半分」と「上のタブと下のボタンを引いた残り」の小さいほう。
    // -24 はコンテナのパディング・枠線ぶん。
    const availableHeight = Math.min(safeHeight * 0.5, safeHeight - STACKED_RESERVE) - 24;
    // ModeLayout の縦積み枠は min(50dvh,640px) から内側パディング・枠線を引いた
    // 約618pxが内寸の上限。超えると枠が潰れて非正方形になるため616で頭打ちにする。
    return {
      isStacked,
      canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 220, 616)),
    };
  }

  const sidebarWidth = safeWidth >= 1200 ? 360 : 300;
  const availableWidth = safeWidth - sidebarWidth - 96;
  // 220 = 外周パディング48 + セッション枠/余白48 + ヘッダー行48 + 進捗バー20 + メイン枠パディング56。
  // これらは全て幅ブレークポイント基準で高さに依存しないため、低い画面でも同じ値を使う。
  // 過小評価するとキャンバス箱が maxHeight で潰れて非正方形になるため実測値を使う。
  const availableHeight = safeHeight - 220;

  return {
    isStacked,
    canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 240, CANVAS_MAX)),
  };
}

/**
 * トレーニングモード(ドリルテスト・サバイバル・ボスバトル)用のキャンバスサイズ計算。
 * 各モードのヘッダー・ボタン列などの占有量(chrome)をプリセットで受け取り、
 * 画面回転やリサイズに追従する。lg(1024px)以上で問題パネルと横並びになる。
 */
export function calculateTrainingViewport(width, height, options = {}) {
  const {
    headerH = 100,
    columnChrome = 90,
    sideW = 384,
    stackedExtra = 220,
  } = options;
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 1024;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 768;
  const isRow = safeWidth >= 1024;

  if (isRow) {
    const availableWidth = safeWidth - sideW - 104;
    const availableHeight = safeHeight - 48 - headerH - columnChrome;
    return {
      isStacked: false,
      canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 260, CANVAS_MAX)),
    };
  }

  const availableWidth = safeWidth - 96;
  const availableHeight = safeHeight - 48 - headerH - columnChrome - stackedExtra;
  return {
    isStacked: true,
    canvasSize: Math.round(clamp(Math.min(availableWidth, availableHeight), 240, CANVAS_MAX)),
  };
}

/** 各トレーニングモードの画面占有量(ヘッダー高さ・キャンバス列の付帯UI・横並び時の問題パネル幅) */
export const TRAINING_VIEWPORT_PRESETS = {
  drillTest: { headerH: 100, columnChrome: 90, sideW: 384 },
  survival: { headerH: 110, columnChrome: 90, sideW: 384 },
  boss: { headerH: 104, columnChrome: 124, sideW: 296 },
};
