import { useState, useEffect } from 'react';
import { useReducedMotionConfig } from 'framer-motion';

// アニメーション付き数値カウンター（結果画面用）
const AnimatedCounter = ({ target, duration = 1200, prefix = '', suffix = '' }) => {
  const shouldReduceMotion = useReducedMotionConfig();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (shouldReduceMotion || target === 0) {
      setValue(target);
      return undefined;
    }

    const start = Date.now(); const startVal = 0;
    let frameId;
    const tick = () => {
      const elapsed = Date.now() - start; const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration, shouldReduceMotion]);
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
};

export default AnimatedCounter;
