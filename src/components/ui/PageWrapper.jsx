import { Suspense } from 'react';
import { motion, useIsPresent } from 'framer-motion';

// lazyビューの読み込み中スピナー
const LazyFallback = () => (
  <div className="flex items-center justify-center h-full" role="status" aria-label="読み込み中">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" aria-hidden="true" />
      <div className="text-sm font-bold text-[var(--text-muted)]">よみこみ中...</div>
    </div>
  </div>
);

// 退場アニメーション（0.25秒）の間、前の画面は DOM に残る。そのままだと押せてしまい、
// ホームの「きょうのN字」を2回タップすると、2回目が下から出てきた別のボタンに当たったり、
// 結果画面の「おわる」が2回動いて報酬が二重に入ったりしていた。退場中は押せなくする。
const exitingStyle = (isPresent) => (isPresent ? undefined : { pointerEvents: 'none' });

// Suspense境界はmotion.divの内側に置く。外側(AnimatePresenceの上)に置くと、
// lazyビューのサスペンド時にAnimatePresenceのツリーごと非表示化され、
// exit追跡が壊れて読み込み後も画面が白いままになる（ホワイトアウト）。
const PageWrapper = ({ children, keyName, wide }) => {
  const isPresent = useIsPresent();
  return (<motion.div key={keyName} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} style={exitingStyle(isPresent)} inert={isPresent ? undefined : true} className={`absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden p-2 md:p-4 no-scrollbar ${wide ? '' : ''}`}><div className={`m-auto w-full h-full ${wide ? 'max-w-7xl' : 'max-w-lg'}`}><Suspense fallback={<LazyFallback />}>{children}</Suspense></div></motion.div>);
};
const FullScreenWrapper = ({ children, keyName }) => {
  const isPresent = useIsPresent();
  return (<motion.div key={keyName} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }} style={exitingStyle(isPresent)} inert={isPresent ? undefined : true} className="absolute inset-0 flex flex-col p-0 md:p-6 overflow-hidden safe-area-screen"><div className="w-full h-full max-w-7xl mx-auto flex flex-col"><Suspense fallback={<LazyFallback />}>{children}</Suspense></div></motion.div>);
};

export { PageWrapper, FullScreenWrapper };
