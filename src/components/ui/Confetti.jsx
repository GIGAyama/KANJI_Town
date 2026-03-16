import { useRef, useEffect } from 'react';

const Confetti = ({ active }) => {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!active) return; const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({ length: 100 }, () => ({ x: canvas.width / 2, y: canvas.height / 2, r: Math.random() * 8 + 4, dx: Math.random() * 20 - 10, dy: Math.random() * -20 - 5, color: ['#fce7f3', '#fef08a', '#bae6fd', '#a7f3d0', '#c7d2fe', '#FFD700', '#FF6B6B'][Math.floor(Math.random() * 7)], tiltAngleIncrement: (Math.random() * 0.07) + 0.05, tiltAngle: 0 }));
    let animId;
    const render = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); let activeCount = 0; particles.forEach(p => { p.tiltAngle += p.tiltAngleIncrement; p.y += (Math.cos(p.tiltAngle) + 1 + p.r / 2) / 2; p.x += Math.sin(p.tiltAngle) * 2 + p.dx; p.dy += 0.2; p.y += p.dy; if (p.y <= canvas.height) activeCount++; ctx.beginPath(); ctx.lineWidth = p.r; ctx.strokeStyle = p.color; ctx.moveTo(p.x + p.r, p.y); ctx.lineTo(p.x, p.y + p.r); ctx.stroke(); }); if (activeCount > 0) animId = requestAnimationFrame(render); };
    render(); return () => cancelAnimationFrame(animId);
  }, [active]);
  if (!active) return null; return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[100]" />;
};

export default Confetti;
