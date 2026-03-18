import React, { useRef, useEffect } from 'react';

/**
 * HTML5 Canvasを利用した軽量・高性能パーティクルコンポーネント
 * @param {string} weather - 'clear' | 'rain' | 'snow' | 'sakura'
 */
const WeatherOverlay = ({ weather = 'clear' }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (weather === 'clear') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // キャンバスを画面サイズにフィット
    const resizeCanvas = () => {
      // 親コンテナ（position: absolute/relative）に合わせる
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // パーティクルの定義
    let particles = [];
    const createParticles = () => {
      particles = [];
      const count = weather === 'rain' ? 150 : weather === 'snow' ? 100 : weather === 'sakura' ? 60 : 0;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // 移動
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.spin;

        // 画面外に出たら上/横からリスポーン
        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x > canvas.width) {
          p.x = -10;
        } else if (p.x < -10) {
          p.x = canvas.width;
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
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [weather]);

  if (weather === 'clear') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-30 opacity-70"
      style={{ mixBlendMode: weather === 'rain' ? 'screen' : 'normal' }}
    />
  );
};

export default WeatherOverlay;
