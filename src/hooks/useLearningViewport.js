import { useEffect, useState } from 'react';
import {
  calculateLearningViewport,
  calculateTrainingViewport,
  TRAINING_VIEWPORT_PRESETS,
} from '../utils/learning-viewport';

const readViewport = (variant) => {
  const preset = variant ? TRAINING_VIEWPORT_PRESETS[variant] : null;
  if (typeof window === 'undefined') {
    return preset ? calculateTrainingViewport(1024, 768, preset) : calculateLearningViewport(1024, 768);
  }
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  return preset ? calculateTrainingViewport(width, height, preset) : calculateLearningViewport(width, height);
};

/**
 * 画面回転・分割表示・ブラウザーUIの伸縮に追従する学習領域情報。
 * variant を指定するとトレーニングモード用プリセット(drillTest/survival/boss)で計算する。
 */
export function useLearningViewport(variant) {
  const [viewport, setViewport] = useState(() => readViewport(variant));

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = readViewport(variant);
        setViewport((current) => {
          if (current.isStacked === next.isStacked && Math.abs(current.canvasSize - next.canvasSize) < 24) {
            return current;
          }
          return next;
        });
      });
    };
    update();
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
  }, [variant]);

  return viewport;
}
