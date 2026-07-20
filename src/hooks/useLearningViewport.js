import { useEffect, useState } from 'react';
import { calculateLearningViewport } from '../utils/learning-viewport';

const readViewport = () => {
  if (typeof window === 'undefined') return calculateLearningViewport(1024, 768);
  const viewport = window.visualViewport;
  return calculateLearningViewport(
    viewport?.width || window.innerWidth,
    viewport?.height || window.innerHeight,
  );
};

/** 画面回転・分割表示・ブラウザーUIの伸縮に追従する学習領域情報。 */
export function useLearningViewport() {
  const [viewport, setViewport] = useState(readViewport);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readViewport();
        setViewport((current) => {
          if (current.isStacked === next.isStacked && Math.abs(current.canvasSize - next.canvasSize) < 24) {
            return current;
          }
          return next;
        });
      });
    };
    const visualViewport = window.visualViewport;
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    visualViewport?.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
      visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  return viewport;
}
