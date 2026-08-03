/* Canvas の鮮明化（高DPI端末での「ぼやけ」対策）
 *
 * CSS上の大きさと、実際に描画するピクセル数は別物である。
 * これを合わせないと、Chromebook や iPad の高精細液晶で手書きの線と
 * 書き順の数字がぼやけて、児童が字形を確かめられなくなる。
 *
 * dpr を 2 で頭打ちにする理由：
 *   3倍端末で素直に 3倍にすると描画面積が 9倍になる。メモリ4GB の
 *   GIGA標準 Chromebook ではタブごと破棄され、書きかけが消える。
 *   2倍あれば肉眼では十分きれいに見える。
 *
 * setTransform で拡大率を仕込むので、呼び出し側は今までどおり
 * CSS px の座標のまま描いてよい（描画コードの書き換えは不要）。
 */

/** この端末で使う描画倍率（1〜2） */
export function getRenderScale() {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio || 1, 2);
}

/**
 * 正方形キャンバスを CSS 上の一辺 cssSize に合わせて鮮明化する。
 * @param {HTMLCanvasElement|null|undefined} canvas
 * @param {number} cssSize CSS px での一辺
 * @param {{stretch?: boolean}} [options] stretch=true なら style を 100% で親に伸ばす
 * @returns {CanvasRenderingContext2D|null}
 */
export function fitSquareCanvas(canvas, cssSize, { stretch = true } = {}) {
  if (!canvas || !cssSize) return null;
  const scale = getRenderScale();
  const px = Math.round(cssSize * scale);
  // 同じ値を代入してもキャンバスは全消去されるため、変わったときだけ触る
  if (canvas.width !== px || canvas.height !== px) {
    canvas.width = px;
    canvas.height = px;
  }
  if (stretch) {
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, cssSize, cssSize);
  return ctx;
}

/**
 * 任意サイズの要素いっぱいに広がるキャンバス（紙吹雪・天気など）を鮮明化する。
 * @param {HTMLCanvasElement|null|undefined} canvas
 * @param {number} cssWidth
 * @param {number} cssHeight
 * @returns {CanvasRenderingContext2D|null}
 */
export function fitCanvasToSize(canvas, cssWidth, cssHeight) {
  if (!canvas || !cssWidth || !cssHeight) return null;
  const scale = getRenderScale();
  canvas.width = Math.round(cssWidth * scale);
  canvas.height = Math.round(cssHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);
  return ctx;
}
