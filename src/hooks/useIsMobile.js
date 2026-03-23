import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * スマートフォン判定フック
 * 画面幅768px未満でモバイルとみなす（Tailwindのmdブレークポイントに合わせる）
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isMobile;
}
