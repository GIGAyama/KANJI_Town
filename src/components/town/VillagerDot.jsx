import React, { useState, useEffect, useRef } from 'react';

const VillagerDot = React.memo(({ villager, cellSize, offset }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const tRef = useRef(Math.random() * Math.PI * 2); // 位相をランダムにずらす

  useEffect(() => {
    const baseX = villager.x * cellSize + cellSize / 2;
    const baseY = villager.y * cellSize + cellSize / 2;
    const speed = 0.008 + (villager.id.length % 3) * 0.003;
    const range = cellSize * 0.35;
    const animate = () => {
      tRef.current += speed;
      setPos({
        x: baseX + Math.sin(tRef.current) * range,
        y: baseY + Math.cos(tRef.current * 0.7) * range,
      });
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [villager.x, villager.y, cellSize]);

  return (
    <div className="absolute pointer-events-none z-30 flex flex-col items-center" style={{ left: pos.x + offset.x, top: pos.y + offset.y, transform: 'translate(-50%,-100%)' }}>
      <div className="text-[8px] font-black leading-none mb-0.5" style={{ color: '#e11d48', textShadow: '0 0 3px white, 0 0 3px white' }}>{villager.kanjiChar}</div>
      <div style={{ fontSize: '12px', lineHeight: 1 }}>🧑</div>
    </div>
  );
});

export default VillagerDot;
