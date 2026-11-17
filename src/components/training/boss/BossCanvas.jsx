import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { audioCtrl } from '../../../systems/audio';
import { attachDrawListeners } from '../../../utils/draw-pointer-events';
import { fitSquareCanvas } from '../../../utils/canvas-dpr';

/** KanjiVG の座標系（お手本の線） */
const VIEWBOX = 109;
const INK = '#f1f5f9';

/**
 * ボスバトルの、字を書く ます。
 *
 * ref から:
 *   takeStrokes() … 書いた線（書きかけの 1 画も ふくむ）。時間切れのとき、書いた所までで こうげきする
 *   clear()       … 書きなおす
 * review を渡すと、書いた線を うすくして、その上に こたえ（お手本の線）を出す。
 *   review.showOrder が true なら、画の はじめに 書き順の数字を出す（書き順ちがいのとき）。
 */
const BossCanvas = forwardRef(({ strokeData, paths, canvasSize, disabled, review = null, accent = '#e11d48', onCountChange }, ref) => {
  const inkRef = useRef(null);
  const writeRef = useRef(null);
  const strokesRef = useRef([]);
  const drawingRef = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentPathRef = useRef([]);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;
  const onCountChangeRef = useRef(onCountChange);
  onCountChangeRef.current = onCountChange;

  const clearAll = useCallback(() => {
    strokesRef.current = [];
    currentPathRef.current = [];
    drawingRef.current = false;
    [inkRef, writeRef].forEach((canvas) => {
      const ctx = canvas.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
    });
    onCountChangeRef.current?.(0);
  }, [canvasSize]);

  // ますの大きさ・字が かわったら 作りなおす（端末の devicePixelRatio に合わせて鮮明にする。上限 2）
  useEffect(() => {
    [inkRef, writeRef].forEach((canvas) => fitSquareCanvas(canvas.current, canvasSize));
    clearAll();
  }, [strokeData, canvasSize, clearAll]);

  const pen = useCallback((ctx) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.lineWidth = canvasSize * 0.07;
  }, [canvasSize]);

  const redrawInk = useCallback(() => {
    const ctx = inkRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    pen(ctx);
    strokesRef.current.forEach((stroke) => {
      if (stroke.length === 0) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach((pt) => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    });
  }, [canvasSize, pen]);

  const handlers = useRef({});
  handlers.current = {
    coords(e) {
      const rect = writeRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * (canvasSize / rect.width), y: (clientY - rect.top) * (canvasSize / rect.height) };
    },
    start(e) {
      e.preventDefault();
      if (disabledRef.current) return;
      audioCtrl.init();
      const { x, y } = handlers.current.coords(e);
      drawingRef.current = true;
      lastPos.current = { x, y };
      currentPathRef.current = [{ x, y, time: Date.now() }];
      const ctx = writeRef.current.getContext('2d');
      pen(ctx);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    move(e) {
      e.preventDefault();
      if (!drawingRef.current || disabledRef.current) return;
      const { x, y } = handlers.current.coords(e);
      currentPathRef.current.push({ x, y, time: Date.now() });
      const ctx = writeRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastPos.current = { x, y };
    },
    end(e) {
      if (e && e.type !== 'mouseleave') e.preventDefault();
      if (!drawingRef.current) return;
      drawingRef.current = false;
      strokesRef.current = [...strokesRef.current, [...currentPathRef.current]];
      currentPathRef.current = [];
      redrawInk();
      const ctx = writeRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
      onCountChangeRef.current?.(strokesRef.current.length);
    },
  };

  useEffect(() => {
    const canvas = writeRef.current;
    if (!canvas) return undefined;
    return attachDrawListeners(canvas, {
      onStart: (e) => handlers.current.start(e),
      onMove: (e) => handlers.current.move(e),
      onEnd: (e) => handlers.current.end(e),
    });
  }, []);

  useImperativeHandle(ref, () => ({
    takeStrokes() {
      // 時間切れのときに 書いている途中の 1 画も、書いた分として数える
      if (drawingRef.current && currentPathRef.current.length > 0) {
        drawingRef.current = false;
        strokesRef.current = [...strokesRef.current, [...currentPathRef.current]];
        currentPathRef.current = [];
        redrawInk();
        const ctx = writeRef.current?.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvasSize, canvasSize);
      }
      return strokesRef.current;
    },
    clear: clearAll,
  }), [canvasSize, clearAll, redrawInk]);

  return (
    <div
      className="relative rounded-[20px] bg-slate-900 overflow-hidden touch-none shrink-0"
      style={{ width: canvasSize, maxWidth: '100%', aspectRatio: '1/1', border: `4px solid ${review ? '#fde68a' : accent}`, boxShadow: `0 0 18px ${review ? '#fde68a55' : `${accent}55`}` }}
      data-testid="boss-canvas"
    >
      {/* 十字の ガイド */}
      <div className="absolute top-0 left-1/2 w-0 h-full border-l-[3px] border-dashed border-slate-500 opacity-50 -translate-x-1/2 pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-full h-0 border-t-[3px] border-dashed border-slate-500 opacity-50 -translate-y-1/2 pointer-events-none" />
      <canvas ref={inkRef} className={`absolute inset-0 z-10 pointer-events-none w-full h-full ${review ? 'opacity-30' : ''}`} />
      <canvas ref={writeRef} className="absolute inset-0 z-20 cursor-crosshair w-full h-full touch-none" />
      {review && (
        <>
          <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="absolute inset-0 z-30 w-full h-full pointer-events-none" data-testid="boss-answer" aria-hidden="true">
            {paths.map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#fde68a" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {review.showOrder && strokeData.map((stroke, i) => (
              <g key={i}>
                <circle cx={stroke.s.x * VIEWBOX} cy={stroke.s.y * VIEWBOX} r="4.6" fill="#0f172a" stroke="#fde68a" strokeWidth="1" />
                <text x={stroke.s.x * VIEWBOX} y={stroke.s.y * VIEWBOX + 2.3} textAnchor="middle" fontSize="6.4" fontWeight="900" fill="#fde68a">{i + 1}</text>
              </g>
            ))}
          </svg>
          <div className="absolute left-2 top-2 z-40 px-3 py-1 rounded-full bg-amber-300 text-slate-900 text-sm font-black pointer-events-none">こたえ</div>
        </>
      )}
    </div>
  );
});

export default BossCanvas;
