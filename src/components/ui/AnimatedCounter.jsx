import { useState, useEffect } from 'react';

// アニメーション付き数値カウンター（結果画面用）
const AnimatedCounter = ({ target, duration = 1200, prefix = '', suffix = '' }) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = Date.now(); const startVal = 0;
    const tick = () => {
      const elapsed = Date.now() - start; const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return <span>{prefix}{value.toLocaleString()}{suffix}</span>;
};

export default AnimatedCounter;
