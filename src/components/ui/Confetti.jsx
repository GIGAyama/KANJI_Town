import { useRef, useEffect } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { fitCanvasToSize } from '../../utils/canvas-dpr';

const Confetti = ({ active }) => {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotionConfig();
  useEffect(() => {
    if (!active || shouldReduceMotion) return;
    // 画面いっぱいの紙吹雪。DPR補正が無いと高精細端末で紙片の縁がにじむ。
    // 補正後は CSS px の座標のまま描けるので、幅・高さは CSS 上の値を使う。
    const w = window.innerWidth; const h = window.innerHeight;
    const ctx = fitCanvasToSize(canvasRef.current, w, h);
    if (!ctx) return;
    const particles = Array.from({ length: 100 }, () => ({ x: w / 2, y: h / 2, r: Math.random() * 8 + 4, dx: Math.random() * 20 - 10, dy: Math.random() * -20 - 5, color: ['#fce7f3', '#fef08a', '#bae6fd', '#a7f3d0', '#c7d2fe', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 7)], tiltAngleIncrement: (Math.random() * 0.07) + 0.05, tiltAngle: 0 }));
    let animId;
    const render = () => { ctx.clearRect(0, 0, w, h); let activeCount = 0; particles.forEach(p => { p.tiltAngle += p.tiltAngleIncrement; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; p.dy += 0.2; p.y += p.dy; if (p.y <= h) activeCount++; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.r, p.y); ctx.lineTo(p.x, p.y + p.r); ctx.stroke(); }); if (activeCount > 0) animId = requestAnimationFrame(render); };
    render(); return () => cancelAnimationFrame(animId);
  }, [active, shouldReduceMotion]);
  if (!active || shouldReduceMotion) return null; return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-[100]" />;
};

export default Confetti;
