import { useLazyModule } from './useLazyModule';

// QR コードの生成（qrcode）と読み取り（jsQR）。どちらも npm の依存を動的 import する。
// 初回の JS には入らず、QR を出す・読む画面を開いたときに初めて読む。

/** CommonJS の部品は、読み方によって default が二重になることがあるので中身の関数を取り出す */
const pick = (mod, name) => {
  if (typeof mod === 'function') return mod;
  if (typeof mod?.[name] === 'function') return mod;
  if (mod?.default) return pick(mod.default, name);
  return mod;
};

const importQRCode = () => import('qrcode').then((m) => pick(m, 'toCanvas'));
const importJsQR = () => import('jsqr').then((m) => pick(m));

/**
 * QR コード生成ライブラリ（qrcode）。lib.toCanvas(canvas, text, options) で描く。
 * @returns {{ lib: { toCanvas: Function }|null, isLoaded: boolean, loadError: boolean }}
 */
export const useQRCode = () => useLazyModule('qrcode', importQRCode);

/**
 * QR コード読み取りライブラリ（jsQR）。lib(imageData, width, height) で読む。
 * 読み取りは「4けたの数字で送る」の相手を見つけるためだけに使うので、通信できるときだけ読む。
 * @returns {{ lib: Function|null, isLoaded: boolean, loadError: boolean }}
 */
export const useJsQR = () => useLazyModule('jsqr', importJsQR, { requiresNetwork: true });
