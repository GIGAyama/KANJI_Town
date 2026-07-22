/**
 * 手書きキャンバスへ入力リスナーを取り付ける。
 *
 * Pointer Events対応環境ではペン・指・マウスを統一して扱う。
 * 一部のAndroidタブレット（スタイラス入力）はtouchイベントを発火しないため、
 * touch/mouseイベントだけに頼ると線が一切描けなくなる。
 * 非対応の古い環境ではtouch+mouseへフォールバックする。
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ onStart: Function, onMove: Function, onEnd: Function }} handlers
 * @returns {() => void} リスナー解除関数
 */
export function attachDrawListeners(canvas, { onStart, onMove, onEnd }) {
  if (typeof window !== 'undefined' && window.PointerEvent) {
    // 描画中のポインターIDを記録し、2本目以降の指や別ポインターを無視する
    let activePointerId = null;
    const handleDown = (e) => {
      if (activePointerId !== null) return;
      activePointerId = e.pointerId;
      // キャンバス外へはみ出してもストロークを追跡し続ける
      try { canvas.setPointerCapture(e.pointerId); } catch { /* 非対応環境は無視 */ }
      onStart(e);
    };
    const handleMove = (e) => {
      if (e.pointerId !== activePointerId) return;
      onMove(e);
    };
    const handleUp = (e) => {
      if (e.pointerId !== activePointerId) return;
      activePointerId = null;
      onEnd(e);
    };
    canvas.addEventListener('pointerdown', handleDown);
    canvas.addEventListener('pointermove', handleMove);
    canvas.addEventListener('pointerup', handleUp);
    canvas.addEventListener('pointercancel', handleUp);
    return () => {
      canvas.removeEventListener('pointerdown', handleDown);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('pointerup', handleUp);
      canvas.removeEventListener('pointercancel', handleUp);
    };
  }

  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd, { passive: false });
  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('mouseleave', onEnd);
  return () => {
    canvas.removeEventListener('touchstart', onStart);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onEnd);
    canvas.removeEventListener('mousedown', onStart);
    canvas.removeEventListener('mousemove', onMove);
    canvas.removeEventListener('mouseup', onEnd);
    canvas.removeEventListener('mouseleave', onEnd);
  };
}
