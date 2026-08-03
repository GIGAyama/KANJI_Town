import React, { useRef, useEffect } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { fitCanvasToSize } from '../../utils/canvas-dpr';

/**
 * HTML5 Canvasを利用した軽量・高性能パーティクルコンポーネント
 * @param {string} weather - 'clear' | 'rain' | 'snow' | 'sakura'
 */
const WeatherOverlay = ({ weather = 'clear' }) => {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotionConfig();

  useEffect(() => {
    if (weather === 'clear' || shouldReduceMotion) return;

    const canvas = canvasRef.current;
    let ctx = canvas.getContext('2d');
    let animationFrameId;

    // CSS上の大きさ。描画ピクセル数（canvas.width）は DPR倍されているため、
    // 粒の座標計算にはこちらを使う。混ぜると高精細端末で粒が左上に寄る。
    const size = { w: 0, h: 0 };

    // キャンバスを親コンテナの大きさにフィットさせ、DPR補正をかける
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      size.w = parent.clientWidth;
      size.h = parent.clientHeight;
      const next = fitCanvasToSize(canvas, size.w, size.h);
      if (next) ctx = next;
    };
    resizeCanvas();
    // 画面回転・分割画面・電子黒板への出力切替にも追従させる
    const observer = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    // パーティクルの定義
    let particles = [];
    const createParticles = () => {
      particles = [];
      const count = weather === 'rain' ? 150 : weather === 'snow' ? 100 : weather === 'sakura' ? 60 : 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * size.w,
          y: Math.random() * size.h,
          radius: weather === 'snow' ? Math.random() * 2 + 1 : weather === 'sakura' ? Math.random() * 4 + 3 : Math.random() * 1 + 0.5,
          speedY: weather === 'rain' ? Math.random() * 15 + 10 : weather === 'snow' ? Math.random() * 1 + 0.5 : Math.random() * 1 + 0.5,
          speedX: weather === 'rain' ? Math.random() * 2 - 1 : weather === 'snow' ? Math.random() * 1 - 0.5 : Math.random() * 2 - 1,
          angle: Math.random() * Math.PI * 2,
          spin: Math.random() * 0.1 - 0.05,
          opacity: Math.random() * 0.5 + 0.3
        });
      }
    };
    createParticles();

    // 桜の花びらの描画（パス）
    const drawPetal = (ctx, x, y, radius, angle, opacity) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(radius, -radius / 2, radius * 2, radius, 0, radius * 2);
      ctx.bezierCurveTo(-radius * 2, radius, -radius, -radius / 2, 0, 0);
      ctx.fillStyle = `rgba(253, 164, 186, ${opacity})`;
      ctx.fill();
      ctx.restore();
    };

    // アニメーションループ
    const render = () => {
      ctx.clearRect(0, 0, size.w, size.h);

      particles.forEach((p) => {
        // 移動
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.spin;

        // 画面外に出たら上/横からリスポーン
        if (p.y > size.h) {
          p.y = -10;
          p.x = Math.random() * size.w;
        }
        if (p.x > size.w) {
          p.x = -10;
        } else if (p.x < -10) {
          p.x = size.w;
        }

        // 描画
        if (weather === 'rain') {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.speedX * 0.5, p.y + p.speedY * 0.5);
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (weather === 'snow') {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
          ctx.fill();

          // 雪の横揺れ（サインカーブ）
          p.x += Math.sin(p.angle) * 0.5;
        } else if (weather === 'sakura') {
          drawPetal(ctx, p.x, p.y, p.radius, p.angle, p.opacity);
          // 桜の横揺れ・ひらひら
          p.x += Math.sin(p.angle) * 1.5;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [weather, shouldReduceMotion]);

  if (weather === 'clear' || shouldReduceMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30 opacity-70"
      style={{ mixBlendMode: weather === 'rain' ? 'screen' : 'normal' }}
    />
  );
};

export default WeatherOverlay;
