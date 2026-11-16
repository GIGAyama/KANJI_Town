// 町の地面の絵 — マイ漢字タウン
// React に依存しない純粋な関数だけを置く。かたまり 1 つ分の SVG の中身（文字列）を作る。
//
// 絵は 4 つの層に分けて返す。層ごとに全部の かたまりを並べるので、となりの かたまりへ
// はみ出す絵（がけ・雲・影）が、あとから描く地面に消されない。
//   under : 島のうしろの雲と、手前の がけ（土の断面）
//   ground: 地面（地形・道・水）と、境目の なじませ
//   shadow: 建物や木が落とす影
//   over  : がけの下の雲
//
// ⚠️ ここで作る文字列は innerHTML に入れる。地図の id など外から来た値を、そのまま
//    文字列に混ぜないこと（色と形は、すべてこのファイルの中の決まった値から作る）。
//
// 同じ色の図形は 1 本の <path> にまとめる。マスごとに要素を作らないので、町が大きく
// なっても要素の数はほとんど増えない。

import { GRID_SIZE, TILE_W, TILE_H } from './town-map-view.js';
import { CHUNK, GROUND_KINDS, KIND_NAMES, KIND_INDEX, kindAt, isLandAt, castAt } from './town-ground.js';

const HW = TILE_W / 2;
const HH = TILE_H / 2;

/** 小数 1 けたにそろえる（文字列を短くする） */
const n = (v) => {
  const r = Math.round(v * 10) / 10;
  return r === 0 ? '0' : String(r);
};
/** マス目の座標（小数も可）→ 画面の座標 "x y" */
const P = (gx, gy) => `${n((gx - gy) * HW)} ${n((gx + gy) * HH)}`;

/** マスごとに決まる、でたらめに見える数（0 以上 1 未満）。同じマスなら いつも同じ */
export function cellHash(x, y, salt = 0) {
  let h = Math.imul(x + 11, 374761393) ^ Math.imul(y + 7, 668265263) ^ Math.imul(salt + 3, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** 色を明るく（amt > 0）・暗く（amt < 0）する */
export function shade(hex, amt) {
  const v = parseInt(hex.slice(1), 16);
  const ch = (shift) => {
    const c = (v >> shift) & 255;
    const next = amt >= 0 ? c + (255 - c) * amt : c * (1 + amt);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `#${((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1)}`;
}

// ── 色 ──────────────────────────────────────────
const PAL = {
  soil: { base: '#ead2a0', lite: '#f4e2bd', dark: '#d9bb83', speck: '#c5a36c' },
  grass: { base: '#9dd86b', lite: '#b7e587', dark: '#80c556', blade: '#5aa23d' },
  forest: { base: '#72bd5a', lite: '#88cb6e', dark: '#58a348', blade: '#3d8238' },
  rough: { base: '#c2b76f', lite: '#d6cc88', dark: '#a69c56', blade: '#7f8a3a', stone: '#99938a', stoneLite: '#bfb9b0' },
  sand: { base: '#f7e6ad', lite: '#fdf3cf', dark: '#e8cf8a' },
  water: { base: '#66c8ee', lite: '#a3e3f8', dark: '#43addf' },
  pond: { base: '#66c8ee', lite: '#a3e3f8', dark: '#43addf' },
  dead: { base: '#9c9ca1', lite: '#b0b0b5', dark: '#808086', crack: '#4b4b52' },
  dirt: { base: '#a06e45', lite: '#b78558', dark: '#825535' },
  lawn: { base: '#88d264', lite: '#9bde78', dark: '#70bf50' },
  rock: { base: '#78818f', lite: '#929cab', dark: '#5c6573', side: '#4d5664', sideDark: '#3e4653' },
  high: { base: '#d2cdbe', lite: '#e6e2d6', dark: '#b9b3a3', side: '#a69f8e', sideDark: '#8c8574' },
  road: { base: '#c9cfd9', lite: '#dde2e9', dark: '#aeb6c2', line: '#ffffff', curb: '#eef1f5' },
  asphalt: { base: '#5b6371', lite: '#6f7887', dark: '#49505c', line: '#fde68a', curb: '#d0d6de' },
  crosswalk: { base: '#5b6371', lite: '#6f7887', dark: '#49505c', line: '#ffffff', curb: '#d0d6de' },
  brick: { base: '#d18558', lite: '#e6ab85', dark: '#b56b42', curb: '#f0dfcd' },
  rail: { base: '#c0b9ab', lite: '#d3cdc0', dark: '#a39b8a', tie: '#7d5735', rail: '#f0f3f6', railDark: '#7a8491', curb: '#d3cdc0' },
  petal: { base: '#f5d6dc', lite: '#fce9ed', dark: '#e6b9c4' },
  paddy: { base: '#8fcfd0', lite: '#c4ecec', dark: '#6fb6ba', ridge: '#c9a66d', ridgeDark: '#a8854f', rice: '#4faa48' },
  field: { base: '#a06e45', lite: '#b78558', dark: '#825535', leaf: '#6cc45a', leafLite: '#a5e07f', leafDark: '#3f8f43' },
  stone: { base: '#b9b2a4', lite: '#e4dfd4', dark: '#9c9484', curb: '#d2ccc0' },
  magma: { base: '#f5652d', lite: '#fdc43c', dark: '#cc3a1e', crust: '#4f2823' },
};
/** がけ（土の断面）の色。left は左手前の面（明るい）、right は右手前の面（かげ） */
const WALL = {
  left: ['#c9955f', '#b37f4d', '#9a8e84'],
  right: ['#a9764a', '#93633c', '#7b7168'],
};
const WALL_H = 24;
const SHADOW = '#1e2a3a';

const fill = (color, opacity) => (opacity ? `fill="${color}" fill-opacity="${opacity}"` : `fill="${color}"`);
const stroke = (color, width, extra = '') => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${extra}`;

/** 同じ見た目（style）の図形を 1 本の path にためる入れもの。先に使った style から順に描く */
function makeLayer() {
  const order = [];
  const data = new Map();
  return {
    add(style, d) {
      const cur = data.get(style);
      if (cur === undefined) { order.push(style); data.set(style, d); } else data.set(style, cur + d);
    },
    /** 描く順番だけ先に決めておく（あとから足しても、この位置に出る） */
    reserve(...styles) {
      for (const style of styles) if (!data.has(style)) { order.push(style); data.set(style, ''); }
    },
    html() {
      let out = '';
      for (const style of order) {
        const d = data.get(style);
        if (d) out += `<path ${style} d="${d}"/>`;
      }
      return out;
    },
  };
}

// ── 形の部品（相対座標。M で置いたあとに続ける） ──────────
/** 平たい だ円 */
const ell = (rx, ry) => `m${n(-rx)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(rx * 2)} 0a${n(rx)} ${n(ry)} 0 1 0 ${n(-rx * 2)} 0z`;
const STAMP = {
  tuft: 'm-2.6 .4q.5-2.4-.6-4.2 1.7 1.2 2 3.2.3-2.8 1.6-4.6.3 2.5-.2 4.6 1-1.6 2.5-2.1-.6 1.6-1.3 3.1z',
  tuftSmall: 'm-1.6 .3q.3-1.6-.4-2.8 1.1.8 1.3 2.1.3-1.8 1.2-2.9.1 1.7-.3 3.3z',
  rock: 'm-3.4 .6l.8-2.8 2.6-1.2 2.6 1 1.2 2.6-1.8 1.4-3.8.2z',
  rockTop: 'm-2.6-2.2l2.6-1.2 2.6 1-2.4 1.2z',
  crackA: 'm-5.5-1l3.2 1.2 2-2 2.6 2.4 3-.8M-.3-1.8l-1-2.2',
  crackB: 'm-4 1.2l2.4-1.6 2.8 1 2.2-1.8 2 .8',
  ripple: 'm-5 0q2.5-1.7 5 0t5 0',
  rippleSmall: 'm-3 0q1.5-1.1 3 0t3 0',
  drip: 'm-1.9 0q0 2.8 1.9 2.8t1.9-2.8z',
  lily: 'm-2.6 0a2.6 1.4 0 1 0 2.6-1.4l0 1.4z',
  koi: 'm-2.8 0q1.4-1.3 3.4-.4l1.6-.9-.3 1.5.3 1.3-1.6-.8q-2 .8-3.4-.7z',
  facet: 'm-5 0l3-2.4 4 .6 2.6 2-3.4 1.6-4.4-.2z',
  facetSmall: 'm-3 0l2-1.6 2.6.6 1.2 1.2-2.4 1-2.6-.2z',
  mushroom: 'm-1.5 0q0-2.2 1.5-2.2t1.5 2.2z',
};

/** 影（同じ色を重ねて、ふちをやわらかく見せる） */
const SHADOW_SOFT = `${fill(SHADOW)} opacity=".1"`;
const SHADOW_CORE = `${fill(SHADOW)} opacity=".13"`;
const SHADOW_BOX = `fill="${SHADOW}" stroke="${SHADOW}" stroke-width="2.4" stroke-linejoin="round" opacity=".17"`;

// ── マスの形 ──────────────────────────────────────
/** マス目の四角（x0..x1, y0..y1）。画面では ひし形 や 平行四辺形になる */
const quad = (x0, y0, x1, y1) => `M${P(x0, y0)}L${P(x1, y0)}L${P(x1, y1)}L${P(x0, y1)}z`;
/** すきまが見えないよう、少しだけ大きく描く */
const GROW = 0.012;
const tile = (x, y) => quad(x - GROW, y - GROW, x + 1 + GROW, y + 1 + GROW);
/**
 * 境目の帯は、地面よりもう少し外へ出す。となりの かたまりの地面が GROW だけ こちらへ
 * 重なっているので、同じ幅だと ふちに細い線が残る（かたまりの境目だけに出る）。
 */
const OVER = GROW * 3;

// 向き: 0=北(y-1) 1=東(x+1) 2=南(y+1) 3=西(x-1)。画面では 北=右上・東=右下・南=左下・西=左上
const DX = [0, 1, 0, -1];
const DY = [-1, 0, 1, 0];
// ななめ: 0=北西(-1,-1) 1=北東(+1,-1) 2=南東(+1,+1) 3=南西(-1,+1)
const CX = [-1, 1, 1, -1];
const CY = [-1, -1, 1, 1];

/**
 * 辺に沿った帯（ふちが波うつ）。side の辺から、内がわへ depth だけ入る。
 * 両はしの深さは必ず depth にそろえる（となりのマスの帯と つながるように）。
 * wave=0 なら まっすぐな帯。
 */
function edgeStrip(x, y, side, depth, wave, salt) {
  // 辺の上を t=0→1 と進む点と、内がわへ d だけ入った点
  const at = (t, d) => {
    if (side === 0) return [x + t, y + d];
    if (side === 1) return [x + 1 - d, y + t];
    if (side === 2) return [x + 1 - t, y + 1 - d];
    return [x + d, y + 1 - t];
  };
  const out = (t) => at(t, -OVER);
  const a = out(0);
  const b = out(1);
  let d = `M${P(a[0], a[1])}L${P(b[0], b[1])}`;
  if (!wave) {
    const p1 = at(1, depth);
    const p0 = at(0, depth);
    return `${d}L${P(p1[0], p1[1])}L${P(p0[0], p0[1])}z`;
  }
  const depths = [depth];
  for (let i = 1; i <= 3; i++) depths.push(depth + wave * (cellHash(x, y, salt + side * 7 + i) * 1.7 - 0.6));
  depths.push(depth);
  const pts = [];
  for (let i = 4; i >= 0; i--) pts.push(at(i / 4, depths[i]));
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m12 = mid(pts[1], pts[2]);
  const m23 = mid(pts[2], pts[3]);
  d += `L${P(pts[0][0], pts[0][1])}`
    + `Q${P(pts[1][0], pts[1][1])} ${P(m12[0], m12[1])}`
    + `Q${P(pts[2][0], pts[2][1])} ${P(m23[0], m23[1])}`
    + `Q${P(pts[3][0], pts[3][1])} ${P(pts[4][0], pts[4][1])}z`;
  return d;
}

/** 角の丸い はみ出し（ななめのマスだけが その種類のとき） */
function cornerBlob(x, y, corner, r) {
  const cx = x + (corner === 1 || corner === 2 ? 1 : 0);
  const cy = y + (corner === 2 || corner === 3 ? 1 : 0);
  const sx = corner === 1 || corner === 2 ? -1 : 1;
  const sy = corner === 2 || corner === 3 ? -1 : 1;
  const k = 0.914 * r;
  return `M${P(cx - sx * OVER, cy - sy * OVER)}L${P(cx + sx * r, cy - sy * OVER)}Q${P(cx + sx * k, cy + sy * k)} ${P(cx - sx * OVER, cy + sy * r)}z`;
}

/** 2 つの帯が出あう内がわの角を、丸くうめる */
function cornerFillet(x, y, corner, depth) {
  const cx = x + (corner === 1 || corner === 2 ? 1 : 0);
  const cy = y + (corner === 2 || corner === 3 ? 1 : 0);
  const sx = corner === 1 || corner === 2 ? -1 : 1;
  const sy = corner === 2 || corner === 3 ? -1 : 1;
  const r = depth * 0.9;
  const ix = cx + sx * (depth - 0.01);
  const iy = cy + sy * (depth - 0.01);
  return `M${P(ix + sx * r, iy)}Q${P(ix + sx * r * 0.25, iy + sy * r * 0.25)} ${P(ix, iy + sy * r)}L${P(ix, iy)}z`;
}

/** マスの中の、でたらめに見える場所（ふちから少し はなす） */
const spot = (x, y, salt, margin = 0.2) => {
  const span = 1 - margin * 2;
  return [x + margin + cellHash(x, y, salt) * span, y + margin + cellHash(x, y, salt + 1) * span];
};
const put = (L, style, gx, gy, body) => L.add(style, `M${P(gx, gy)}${body}`);

// ── 種類ごとの かざり ───────────────────────────────
const DETAIL = {
  grass(L, x, y, pal) {
    const a = spot(x, y, 10, 0.24);
    put(L, fill(pal.lite), a[0], a[1], ell(6 + cellHash(x, y, 12) * 4, 3 + cellHash(x, y, 12) * 2));
    if (cellHash(x, y, 13) < 0.6) {
      const b = spot(x, y, 14, 0.26);
      put(L, fill(pal.dark, 0.55), b[0], b[1], ell(5 + cellHash(x, y, 16) * 3, 2.4 + cellHash(x, y, 16) * 1.4));
    }
    const tufts = 2 + Math.floor(cellHash(x, y, 17) * 2);
    for (let i = 0; i < tufts; i++) {
      const t = spot(x, y, 20 + i * 2, 0.18);
      put(L, fill(pal.blade), t[0], t[1], i === 0 ? STAMP.tuft : STAMP.tuftSmall);
    }
    const bloom = cellHash(x, y, 30);
    if (bloom < 0.34) {
      const color = bloom < 0.12 ? '#fff6a8' : bloom < 0.22 ? '#ffffff' : '#ffc4dd';
      for (let i = 0; i < 3; i++) {
        const f = spot(x, y, 31 + i * 2, 0.2);
        put(L, fill(color), f[0], f[1], ell(1.05, 0.75));
      }
    }
  },
  forest(L, x, y, pal) {
    const a = spot(x, y, 10, 0.24);
    put(L, fill(pal.dark, 0.7), a[0], a[1], ell(7 + cellHash(x, y, 12) * 4, 3.4 + cellHash(x, y, 12) * 2));
    const b = spot(x, y, 14, 0.26);
    put(L, fill(pal.lite, 0.8), b[0], b[1], ell(4 + cellHash(x, y, 16) * 3, 2 + cellHash(x, y, 16) * 1.4));
    for (let i = 0; i < 3; i++) {
      const t = spot(x, y, 20 + i * 2, 0.16);
      put(L, fill(pal.blade), t[0], t[1], i === 0 ? STAMP.tuft : STAMP.tuftSmall);
    }
    if (cellHash(x, y, 30) < 0.22) {
      const m = spot(x, y, 31, 0.24);
      put(L, fill('#fff7ed'), m[0], m[1], 'm-.5 0h1v1.6h-1z');
      put(L, fill('#e5484d'), m[0], m[1], STAMP.mushroom);
    }
  },
  soil(L, x, y, pal) {
    const a = spot(x, y, 10, 0.26);
    put(L, fill(pal.lite, 0.85), a[0], a[1], ell(6 + cellHash(x, y, 12) * 4, 3 + cellHash(x, y, 12) * 1.8));
    const specks = 3 + Math.floor(cellHash(x, y, 13) * 3);
    for (let i = 0; i < specks; i++) {
      const s = spot(x, y, 20 + i * 2, 0.16);
      put(L, fill(pal.speck, 0.75), s[0], s[1], ell(0.7 + cellHash(x, y, 40 + i) * 0.7, 0.45 + cellHash(x, y, 40 + i) * 0.3));
    }
    if (cellHash(x, y, 30) < 0.3) {
      const p = spot(x, y, 31, 0.24);
      put(L, fill('#b7a98f'), p[0], p[1], ell(1.9, 1.15));
      put(L, fill('#ded3bd'), p[0], p[1], `m-.5-.4${ell(0.9, 0.5)}`);
    }
    if (cellHash(x, y, 33) < 0.16) {
      const t = spot(x, y, 34, 0.24);
      put(L, fill('#8fc15c'), t[0], t[1], STAMP.tuftSmall);
    }
  },
  rough(L, x, y, pal) {
    const a = spot(x, y, 10, 0.26);
    put(L, fill(pal.dark, 0.6), a[0], a[1], ell(7 + cellHash(x, y, 12) * 4, 3.4 + cellHash(x, y, 12) * 2));
    const b = spot(x, y, 14, 0.28);
    put(L, fill(pal.lite, 0.7), b[0], b[1], ell(4 + cellHash(x, y, 16) * 3, 2 + cellHash(x, y, 16) * 1.2));
    const c = spot(x, y, 18, 0.3);
    put(L, stroke(shade(pal.dark, -0.28), 0.8), c[0], c[1], cellHash(x, y, 19) < 0.5 ? STAMP.crackA : STAMP.crackB);
    for (let i = 0; i < 2; i++) {
      const t = spot(x, y, 20 + i * 2, 0.18);
      put(L, fill(pal.blade), t[0], t[1], i === 0 ? STAMP.tuft : STAMP.tuftSmall);
    }
    if (cellHash(x, y, 30) < 0.55) {
      const r = spot(x, y, 31, 0.24);
      put(L, fill(pal.stone), r[0], r[1], STAMP.rock);
      put(L, fill(pal.stoneLite), r[0], r[1], STAMP.rockTop);
    }
  },
  sand(L, x, y, pal) {
    const a = spot(x, y, 10, 0.26);
    put(L, fill(pal.lite), a[0], a[1], ell(7 + cellHash(x, y, 12) * 4, 3.4 + cellHash(x, y, 12) * 2));
    for (let i = 0; i < 2; i++) {
      const r = spot(x, y, 20 + i * 2, 0.26);
      put(L, stroke(pal.dark, 0.9), r[0], r[1], i === 0 ? STAMP.ripple : STAMP.rippleSmall);
    }
    if (cellHash(x, y, 30) < 0.28) {
      const s = spot(x, y, 31, 0.24);
      put(L, fill('#ffd9cf'), s[0], s[1], ell(1.3, 0.9));
      put(L, fill('#ffffff'), s[0], s[1], `m-.3-.3${ell(0.6, 0.35)}`);
    }
  },
  water(L, x, y, pal) {
    const a = spot(x, y, 10, 0.28);
    put(L, fill(pal.dark, 0.45), a[0], a[1], ell(8 + cellHash(x, y, 12) * 4, 3.6 + cellHash(x, y, 12) * 2));
    for (let i = 0; i < 3; i++) {
      const r = spot(x, y, 20 + i * 2, 0.24);
      put(L, stroke('#ffffff', 1, ' stroke-opacity=".7"'), r[0], r[1], i === 0 ? STAMP.ripple : STAMP.rippleSmall);
    }
    const g = spot(x, y, 28, 0.3);
    put(L, fill(pal.lite, 0.8), g[0], g[1], ell(3.4, 1.3));
  },
  pond(L, x, y, pal) {
    DETAIL.water(L, x, y, pal);
    for (let i = 0; i < 2; i++) {
      const p = spot(x, y, 50 + i * 2, 0.24);
      put(L, fill('#4fae5d'), p[0], p[1], STAMP.lily);
      put(L, fill('#7fcf7b'), p[0], p[1], `m.2-.5${ell(1.1, 0.5)}`);
    }
    const f = spot(x, y, 56, 0.3);
    put(L, fill('#ff9ec4'), f[0], f[1], ell(1.3, 0.9));
    put(L, fill('#fff3a6'), f[0], f[1], ell(0.5, 0.35));
    const k = spot(x, y, 58, 0.3);
    put(L, fill('#f97316'), k[0], k[1], STAMP.koi);
  },
  dead(L, x, y, pal) {
    const a = spot(x, y, 10, 0.28);
    put(L, fill(pal.dark, 0.5), a[0], a[1], ell(8, 3.8));
    const c = spot(x, y, 18, 0.34);
    put(L, stroke(pal.crack, 1.1, ' stroke-opacity=".8"'), c[0], c[1], STAMP.crackA);
    const d = spot(x, y, 22, 0.34);
    put(L, stroke(pal.crack, 0.9, ' stroke-opacity=".7"'), d[0], d[1], STAMP.crackB);
  },
  dirt(L, x, y, pal) {
    for (let i = 0; i < 4; i++) {
      const v = y + 0.11 + i * 0.25;
      L.add(fill(pal.dark, 0.75), quad(x + 0.04, v, x + 0.96, v + 0.1));
      L.add(fill(pal.lite, 0.7), quad(x + 0.04, v - 0.045, x + 0.96, v));
    }
  },
  lawn(L, x, y, pal) {
    L.add(fill(pal.lite), quad(x - GROW, y + 0.25, x + 1 + GROW, y + 0.5));
    L.add(fill(pal.lite), quad(x - GROW, y + 0.75, x + 1 + GROW, y + 1 + GROW));
    for (let i = 0; i < 2; i++) {
      const t = spot(x, y, 20 + i * 2, 0.2);
      put(L, fill(pal.dark), t[0], t[1], STAMP.tuftSmall);
    }
  },
  rock(L, x, y, pal) {
    const a = spot(x, y, 10, 0.3);
    put(L, fill(pal.lite, 0.9), a[0], a[1], STAMP.facet);
    const b = spot(x, y, 14, 0.3);
    put(L, fill(pal.dark, 0.9), b[0], b[1], STAMP.facetSmall);
    const c = spot(x, y, 18, 0.34);
    put(L, stroke(pal.sideDark, 0.9, ' stroke-opacity=".7"'), c[0], c[1], cellHash(x, y, 19) < 0.5 ? STAMP.crackA : STAMP.crackB);
  },
  high(L, x, y, pal) {
    const a = spot(x, y, 10, 0.3);
    put(L, fill(pal.lite), a[0], a[1], STAMP.facet);
    const b = spot(x, y, 14, 0.3);
    put(L, fill(pal.dark, 0.8), b[0], b[1], STAMP.facetSmall);
    if (cellHash(x, y, 30) < 0.5) {
      const m = spot(x, y, 31, 0.28);
      put(L, fill('#a5cc78'), m[0], m[1], ell(3.6, 1.7));
      put(L, fill('#6aa84a'), m[0], m[1], STAMP.tuftSmall);
    }
  },
  road(L, x, y, pal) {
    for (let i = 0; i < 3; i++) {
      const s = spot(x, y, 20 + i * 2, 0.16);
      put(L, fill(pal.dark, 0.6), s[0], s[1], ell(0.8, 0.5));
    }
  },
  asphalt(L, x, y, pal) {
    for (let i = 0; i < 4; i++) {
      const s = spot(x, y, 20 + i * 2, 0.14);
      put(L, fill(i % 2 ? pal.lite : pal.dark, 0.7), s[0], s[1], ell(0.8, 0.5));
    }
  },
  brick(L, x, y, pal) {
    // レンガの目地（よこの線 3 本と、たがいちがいの たての線）
    const line = stroke(pal.lite, 0.9, ' stroke-opacity=".85"');
    let d = '';
    for (let i = 1; i <= 3; i++) d += `M${P(x, y + i / 4)}L${P(x + 1, y + i / 4)}`;
    for (let row = 0; row < 4; row++) {
      const shift = row % 2 ? 0.25 : 0;
      for (let col = 0; col < 2; col++) {
        const u = x + shift + col * 0.5 + 0.125;
        d += `M${P(u, y + row / 4)}L${P(u, y + (row + 1) / 4)}`;
      }
    }
    L.add(line, d);
    const s = spot(x, y, 20, 0.2);
    put(L, fill(pal.dark, 0.5), s[0], s[1], ell(3.2, 1.5));
  },
  magma(L, x, y, pal) {
    const a = spot(x, y, 10, 0.3);
    put(L, fill(pal.dark, 0.7), a[0], a[1], ell(8, 3.8));
    for (let i = 0; i < 3; i++) {
      const b = spot(x, y, 20 + i * 2, 0.24);
      put(L, fill(pal.lite, 0.9), b[0], b[1], ell(2 + cellHash(x, y, 40 + i) * 2.4, 1 + cellHash(x, y, 40 + i) * 1.1));
    }
    const c = spot(x, y, 28, 0.3);
    put(L, fill('#fff3b0'), c[0], c[1], ell(1.3, 0.7));
  },
};
DETAIL.crosswalk = DETAIL.asphalt;
/** 田んぼ（水をはった田に、苗が 4 列ならぶ） */
DETAIL.paddy = (L, x, y, pal) => {
  const a = spot(x, y, 10, 0.3);
  put(L, fill(pal.lite, 0.7), a[0], a[1], ell(8 + cellHash(x, y, 12) * 4, 3.4));
  const style = stroke(pal.rice, 1.1);
  let d = '';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const gx = x + 0.2 + col * 0.2 + (cellHash(x, y, 40 + row * 4 + col) - 0.5) * 0.03;
      const gy = y + 0.2 + row * 0.2;
      d += `M${P(gx, gy)}l-1.1-2.6M${P(gx, gy)}l0-3.2M${P(gx, gy)}l1.1-2.6`;
    }
  }
  L.add(style, d);
};
/** はたけ（うねに、葉ものの野菜がならぶ） */
DETAIL.field = (L, x, y, pal) => {
  for (let i = 0; i < 4; i++) {
    const v = y + 0.11 + i * 0.25;
    L.add(fill(pal.dark, 0.75), quad(x + 0.04, v, x + 0.96, v + 0.1));
    L.add(fill(pal.lite, 0.7), quad(x + 0.04, v - 0.045, x + 0.96, v));
  }
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const gx = x + 0.22 + col * 0.28;
      const gy = y + 0.25 + row * 0.25;
      put(L, fill(pal.leafDark), gx, gy, ell(3.1, 1.9));
      put(L, fill(pal.leaf), gx, gy, `m-.3-.7${ell(2.5, 1.5)}`);
      put(L, fill(pal.leafLite), gx, gy, `m-.7-1.2${ell(1.1, 0.7)}`);
    }
  }
};
/** 石だたみ（大きさのちがう石を、たがいちがいに しきつめる） */
DETAIL.stone = (L, x, y, pal) => {
  const gap = 0.022;
  for (let row = 0; row < 4; row++) {
    const cuts = row % 2 ? [0, 0.3, 0.72, 1] : [0, 0.46, 1];
    for (let i = 0; i < cuts.length - 1; i++) {
      const light = cellHash(x, y, 60 + row * 4 + i) < 0.5;
      L.add(fill(light ? pal.lite : shade(pal.lite, -0.07)), quad(x + cuts[i] + gap, y + row * 0.25 + gap, x + cuts[i + 1] - gap, y + (row + 1) * 0.25 - gap));
    }
  }
};
/** 桜並木の小道（花びらが ちらばる） */
DETAIL.petal = (L, x, y, pal) => {
  const a = spot(x, y, 10, 0.28);
  put(L, fill(pal.lite), a[0], a[1], ell(7 + cellHash(x, y, 12) * 3, 3.4));
  for (let i = 0; i < 7; i++) {
    const p = spot(x, y, 20 + i * 2, 0.14);
    put(L, fill(i % 3 === 0 ? '#ffffff' : i % 3 === 1 ? '#ff9fc2' : '#ffc4d9'), p[0], p[1], ell(1.25, 0.8));
  }
};
/** 線路の下の じゃり（まくら木とレールは railTracks が描く） */
DETAIL.rail = (L, x, y, pal) => {
  for (let i = 0; i < 5; i++) {
    const s = spot(x, y, 20 + i * 2, 0.12);
    put(L, fill(i % 2 ? pal.lite : pal.dark, 0.8), s[0], s[1], ell(0.9, 0.55));
  }
};

/** となり 4 つのうち、同じ「なかま」とつながっている向き（ビットの並び: 北=1 東=2 南=4 西=8） */
function linkMask(model, x, y, group) {
  let mask = 0;
  for (let side = 0; side < 4; side++) {
    const k = kindAt(model, x + DX[side], y + DY[side]);
    if (GROUND_KINDS[KIND_NAMES[k]].group === group) mask |= 1 << side;
  }
  return mask;
}

/** 辺のまん中（道の線がとなりへ つながる点） */
const edgeMid = (x, y, side) => [x + 0.5 + DX[side] * 0.5, y + 0.5 + DY[side] * 0.5];

/** 道の中央線。となりの道へ つながる形にする（十字・丁字のまん中には引かない） */
function roadLines(L, x, y, mask, pal, dashed) {
  const sides = [0, 1, 2, 3].filter((s) => mask & (1 << s));
  const style = stroke(pal.line, 1.5, dashed ? ' stroke-dasharray="3.6 3.4" stroke-opacity=".95"' : ' stroke-opacity=".95"');
  const c = [x + 0.5, y + 0.5];
  const line = (a, b) => L.add(style, `M${P(a[0], a[1])}L${P(b[0], b[1])}`);
  if (sides.length >= 3) return;
  if (sides.length === 0) { line([x + 0.22, y + 0.5], [x + 0.78, y + 0.5]); return; }
  if (sides.length === 1) { line(edgeMid(x, y, sides[0]), c); return; }
  const [a, b] = sides;
  if (b - a === 2) { line(edgeMid(x, y, a), edgeMid(x, y, b)); return; }
  // 角: 2 つの辺のまん中を、マスの中心を通る曲線でつなぐ
  const p = edgeMid(x, y, a);
  const q = edgeMid(x, y, b);
  L.add(style, `M${P(p[0], p[1])}Q${P(c[0], c[1])} ${P(q[0], q[1])}`);
}

/** 横断歩道のしま。道の向きに合わせる */
function crosswalkStripes(L, x, y, mask, pal) {
  const alongY = (mask & 5) && !(mask & 10); // 北か南にだけ つながる → 道は y の向き
  const style = fill(pal.line, 0.95);
  for (let i = 0; i < 5; i++) {
    const t = 0.1 + i * 0.17;
    L.add(style, alongY ? quad(x + t, y + 0.22, x + t + 0.1, y + 0.78) : quad(x + 0.22, y + t, x + 0.78, y + t + 0.1));
  }
}

/** 線路（まくら木と 2 本のレール）。となりの線路へ つながる向きに敷く */
function railTracks(L, x, y, mask, pal) {
  const tie = fill(pal.tie);
  const shadowRail = stroke(pal.railDark, 2.2);
  const rail = stroke(pal.rail, 1.1);
  const straight = (alongY) => {
    for (let i = 0; i < 5; i++) {
      const t = 0.06 + i * 0.2;
      L.add(tie, alongY ? quad(x + 0.2, y + t, x + 0.8, y + t + 0.08) : quad(x + t, y + 0.2, x + t + 0.08, y + 0.8));
    }
    for (const o of [0.34, 0.66]) {
      const d = alongY ? `M${P(x + o, y)}L${P(x + o, y + 1)}` : `M${P(x, y + o)}L${P(x + 1, y + o)}`;
      L.add(shadowRail, d);
      L.add(rail, d);
    }
  };
  const ns = mask & 5;
  const ew = mask & 10;
  const count = [1, 2, 4, 8].filter((b) => mask & b).length;
  if (count === 2 && ns && ew) {
    // 角: 角のマスの かどを中心に、2 本のレールを曲げる
    const north = Boolean(mask & 1);
    const east = Boolean(mask & 2);
    const cx = x + (east ? 1 : 0);
    const cy = y + (north ? 0 : 1);
    const sx = east ? -1 : 1;
    const sy = north ? 1 : -1;
    for (let i = 0; i < 4; i++) {
      const ang = (Math.PI / 2) * ((i + 0.5) / 4);
      const ux = Math.cos(ang);
      const uy = Math.sin(ang);
      const a = [cx + sx * ux * 0.2, cy + sy * uy * 0.2];
      const b = [cx + sx * ux * 0.8, cy + sy * uy * 0.8];
      L.add(stroke(pal.tie, 2.4, ''), `M${P(a[0], a[1])}L${P(b[0], b[1])}`);
    }
    for (const r of [0.34, 0.66]) {
      const k = 0.914 * r;
      const d = `M${P(cx + sx * r, cy)}Q${P(cx + sx * k, cy + sy * k)} ${P(cx, cy + sy * r)}`;
      L.add(shadowRail, d);
      L.add(rail, d);
    }
    return;
  }
  if (ns) straight(true);
  if (ew || !ns) straight(false);
}

/** がけ（島の手前の面）。face: 'left' = 南の辺（左手前）、'right' = 東の辺（右手前） */
function wallBand(x, y, face, from, to) {
  const h = n(to - from);
  if (face === 'left') {
    const gx = x;
    const gy = y + 1;
    return `M${n((gx - gy) * HW)} ${n((gx + gy) * HH + from)}l${HW} ${HH}v${h}l${-HW} ${-HH}z`;
  }
  const gx = x + 1;
  const gy = y + 1;
  return `M${n((gx - gy) * HW)} ${n((gx + gy) * HH + from)}l${HW} ${-HH}v${h}l${-HW} ${HH}z`;
}
/** がけの上の、辺に沿った点（t=0→1）から下へ drop だけ下がった画面の座標 */
function wallPoint(x, y, face, t, drop) {
  const gx = face === 'left' ? x + t : x + 1;
  const gy = face === 'left' ? y + 1 : y + 1 - t;
  return `${n((gx - gy) * HW)} ${n((gx + gy) * HH + drop)}`;
}

/** 雲の かたまり（丸を 1 つ）。色ごとに 1 本の path にまとまる */
const puff = (cx, cy, r) => `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r * 0.82)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r * 0.82)} 0 1 0 ${n(-r * 2)} 0z`;

const CLOUD = {
  day: { back: '#cfe8fb', mid: '#e9f5fe', front: '#ffffff' },
  danger: { back: '#334155', mid: '#475569', front: '#64748b' },
};

/**
 * かたまり 1 つ分の絵を作る。
 * @param {object} model buildGroundModel の結果
 * @param {number} cx かたまりの番号（よこ）
 * @param {number} cy かたまりの番号（たて）
 * @param {{ danger?: boolean, grid?: boolean, clouds?: boolean }} [options]
 *   danger=復習がたまって暗い町、grid=まちづくりの ます目、clouds=false で島のまわりの雲を描かない
 * @returns {{ under: string, ground: string, shadow: string, over: string }}
 */
export function paintChunk(model, cx, cy, options = {}) {
  const { danger = false, grid = false, clouds = true } = options;
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  const under = makeLayer();
  const base = makeLayer();
  const fringe = makeLayer();
  const detail = makeLayer();
  const lines = makeLayer();
  const shadow = makeLayer();
  const over = makeLayer();
  const cloud = danger ? CLOUD.danger : CLOUD.day;

  // 描く順番を先に決める（下にあるものから）
  under.reserve(fill(cloud.back), fill(cloud.mid));
  for (const face of ['left', 'right']) for (const c of WALL[face]) under.reserve(fill(c));
  for (const name of KIND_NAMES) if (PAL[name]) base.reserve(fill(PAL[name].base));
  fringe.reserve(fill('#2f86c0', 0.28), fill('#ffffff', 0.85), fill('#c9d2dc'));
  for (const name of KIND_NAMES) if (PAL[name] && GROUND_KINDS[name].spill) fringe.reserve(fill(PAL[name].base));
  over.reserve(fill(cloud.back), fill(cloud.mid), fill(cloud.front));

  const kindName = (x, y) => KIND_NAMES[kindAt(model, x, y)];

  for (let y = y0; y < y0 + CHUNK; y++) {
    for (let x = x0; x < x0 + CHUNK; x++) {
      if (!isLandAt(model, x, y)) continue;
      const name = kindName(x, y);
      const kind = GROUND_KINDS[name];
      const pal = PAL[name];
      const around = [0, 1, 2, 3].map((s) => kindName(x + DX[s], y + DY[s]));
      const diag = [0, 1, 2, 3].map((c) => kindName(x + CX[c], y + CY[c]));

      // 1. 地面
      base.add(fill(pal.base), tile(x, y));

      // 2. かざり（草・小石・波など）
      DETAIL[name](detail, x, y, pal);

      // 3. 道・線路の もよう
      if (kind.group === 'road') {
        const mask = linkMask(model, x, y, 'road');
        if (name === 'crosswalk') crosswalkStripes(lines, x, y, mask, pal);
        else roadLines(lines, x, y, mask, pal, true);
      } else if (name === 'rail') {
        railTracks(lines, x, y, linkMask(model, x, y, 'rail'), pal);
      }

      // 4. となりとの境目
      const isWater = kind.group === 'water';
      const spillers = new Set();
      for (const other of [...around, ...diag]) {
        const ok = GROUND_KINDS[other];
        if (ok.spill && ok.rank > kind.rank) spillers.add(other);
      }
      if (isWater || name === 'magma') {
        // 水ぎわ: 奥の岸の かげ → 白い波 → 岸（となりの地面の はみ出し）の順に重ねる
        for (let s = 0; s < 4; s++) {
          const other = around[s];
          const ok = GROUND_KINDS[other];
          if (ok.group === kind.group) continue;
          const depth = other === 'void' ? 0.05 : (ok.spill || 0.09);
          if (name === 'magma') {
            fringe.add(fill(PAL.magma.crust), edgeStrip(x, y, s, depth + 0.05, 0.03, 300));
            continue;
          }
          if (s === 0 || s === 3) fringe.add(fill('#2f86c0', 0.28), edgeStrip(x, y, s, depth + 0.13, 0.03, 200));
          fringe.add(fill('#ffffff', 0.85), edgeStrip(x, y, s, depth + 0.05, 0.035, 100));
          if (!ok.spill && other !== 'void') fringe.add(fill('#c9d2dc'), edgeStrip(x, y, s, depth, 0, 0));
        }
      }
      for (const other of [...spillers].sort((p, q) => GROUND_KINDS[p].rank - GROUND_KINDS[q].rank)) {
        const depth = GROUND_KINDS[other].spill;
        const style = fill(PAL[other].base);
        const has = around.map((k) => k === other);
        for (let s = 0; s < 4; s++) if (has[s]) fringe.add(style, edgeStrip(x, y, s, depth, depth * 0.42, KIND_INDEX[other] * 31));
        // 角: 北西=北と西のあいだ、北東=北と東、南東=東と南、南西=南と西
        const pairs = [[0, 3], [0, 1], [1, 2], [2, 3]];
        for (let c = 0; c < 4; c++) {
          const [p, q] = pairs[c];
          if (has[p] && has[q]) fringe.add(style, cornerFillet(x, y, c, depth));
          else if (!has[p] && !has[q] && diag[c] === other) fringe.add(style, cornerBlob(x, y, c, depth));
        }
      }

      // 5. 道の ふち石・高台の がけ（自分のマスの中に描く）
      if (kind.paved) {
        for (let s = 0; s < 4; s++) {
          if (GROUND_KINDS[around[s]].group === kind.group) continue;
          lines.add(fill(pal.curb), edgeStrip(x, y, s, 0.075, 0, 0));
          const inner = s === 0 ? [[x, y + 0.075], [x + 1, y + 0.075]] : s === 1 ? [[x + 0.925, y], [x + 0.925, y + 1]]
            : s === 2 ? [[x, y + 0.925], [x + 1, y + 0.925]] : [[x + 0.075, y], [x + 0.075, y + 1]];
          lines.add(stroke(pal.dark, 0.7, ' stroke-opacity=".8"'), `M${P(inner[0][0], inner[0][1])}L${P(inner[1][0], inner[1][1])}`);
        }
      } else if (name === 'paddy') {
        // あぜ（田んぼの まわりの土の ふち）
        for (let s = 0; s < 4; s++) {
          if (around[s] === 'paddy') continue;
          lines.add(fill(pal.ridge), edgeStrip(x, y, s, 0.1, 0, 0));
          lines.add(fill(pal.ridgeDark), edgeStrip(x, y, s, 0.03, 0, 0));
        }
      } else if (name === 'petal') {
        for (let s = 0; s < 4; s++) {
          if (around[s] !== 'petal') lines.add(fill(pal.dark, 0.75), edgeStrip(x, y, s, 0.07, 0.03, 420));
        }
      } else if (kind.raised) {
        if (around[0] !== name) lines.add(fill(pal.lite, 0.9), edgeStrip(x, y, 0, 0.05, 0, 0));
        if (around[3] !== name) lines.add(fill(pal.lite, 0.9), edgeStrip(x, y, 3, 0.05, 0, 0));
        if (around[2] !== name) lines.add(fill(pal.side), edgeStrip(x, y, 2, 0.2, 0.025, 400));
        if (around[1] !== name) lines.add(fill(pal.sideDark), edgeStrip(x, y, 1, 0.2, 0.025, 410));
      }

      // 6. 島の ふち: 手前の がけ と、その下の雲。奥の辺の うしろにも雲を置く
      for (const face of ['left', 'right']) {
        const side = face === 'left' ? 2 : 1;
        if (around[side] !== 'void') continue;
        const tones = WALL[face];
        const lip = isWater ? shade(pal.base, face === 'left' ? -0.06 : -0.2) : shade(pal.base, face === 'left' ? -0.2 : -0.32);
        under.add(fill(tones[0]), wallBand(x, y, face, 0, WALL_H));
        under.add(fill(tones[1]), wallBand(x, y, face, 11.5, 15.5));
        under.add(fill(tones[2]), wallBand(x, y, face, 19, WALL_H));
        // ふちの芝（または水）が、がけの上に少し かぶさる
        under.add(fill(lip), wallBand(x, y, face, -0.6, isWater ? WALL_H : 3.6));
        if (isWater) {
          for (let i = 0; i < 3; i++) {
            const t = 0.2 + i * 0.3;
            under.add(stroke('#ffffff', 1.3, ' stroke-opacity=".6"'), `M${wallPoint(x, y, face, t, 2)}v${n(WALL_H - 8 - cellHash(x, y, 60 + i) * 6)}`);
          }
        } else {
          for (let i = 0; i < 2; i++) {
            const t = 0.16 + i * 0.4 + cellHash(x, y, 60 + i + side) * 0.26;
            under.add(fill(lip), `M${wallPoint(x, y, face, t, 3.4)}${STAMP.drip}`);
          }
          // 土の中の石
          for (let i = 0; i < 2; i++) {
            const t = 0.12 + cellHash(x, y, 70 + i + side) * 0.76;
            const drop = 7 + cellHash(x, y, 80 + i + side) * 9;
            under.add(fill(tones[2]), `M${wallPoint(x, y, face, t, drop)}${ell(1.8 + cellHash(x, y, 90 + i) * 1.4, 1.1)}`);
          }
        }
        // がけの下の雲（2 だん）
        for (let i = 0; clouds && i < 2; i++) {
          const t = 0.25 + i * 0.5 + (cellHash(x, y, 100 + i + side) - 0.5) * 0.2;
          const gx = face === 'left' ? x + t : x + 1;
          const gy = face === 'left' ? y + 1 : y + 1 - t;
          const px = (gx - gy) * HW;
          const py = (gx + gy) * HH + WALL_H;
          const r = 10 + cellHash(x, y, 110 + i + side) * 5;
          over.add(fill(cloud.back), puff(px + 3, py + 6, r + 2));
          over.add(fill(cloud.mid), puff(px - 2, py + 1, r));
          over.add(fill(cloud.front), puff(px + 1, py - 2 + cellHash(x, y, 120 + i) * 3, r * 0.72));
        }
      }
      for (const side of [0, 3]) {
        if (!clouds || around[side] !== 'void') continue;
        if (cellHash(x, y, 130 + side) < 0.35) continue;
        const t = 0.3 + cellHash(x, y, 131 + side) * 0.4;
        const gx = side === 0 ? x + t : x;
        const gy = side === 0 ? y : y + 1 - t;
        const px = (gx - gy) * HW;
        const py = (gx + gy) * HH;
        const r = 9 + cellHash(x, y, 132 + side) * 5;
        under.add(fill(cloud.back), puff(px, py - 1, r + 2));
        under.add(fill(cloud.mid), puff(px + (side === 0 ? 3 : -3), py - 3, r * 0.8));
      }

      // 7. 影（左上から光が当たるので、右手前へ落ちる）。大きさは絵の足もと（bw × bh マス）に合わせる
      const cast = castAt(model, x, y);
      if (cast && cast.height > 0) {
        const gx = x + cast.w / 2;
        const gy = y + cast.h / 2;
        if (cast.round) {
          const rx = Math.max(7, (cast.bw + cast.bh) * 11) + Math.min(cast.height, 40) * 0.1;
          put(shadow, SHADOW_SOFT, gx + 0.1, gy, ell(rx + 2.6, (rx + 2.6) * 0.5));
          put(shadow, SHADOW_CORE, gx + 0.08, gy, ell(rx, rx * 0.5));
        } else {
          const open = isLandAt(model, x + cast.w, y) && isLandAt(model, x + cast.w, y + cast.h - 1);
          const reach = open ? Math.min(cast.bw * 0.4, cast.height / 90) : 0;
          shadow.add(SHADOW_BOX, quad(gx - cast.bw / 2 + 0.03, gy - cast.bh / 2 + 0.05, gx + cast.bw / 2 + reach, gy + cast.bh / 2 - 0.02));
        }
      }
    }
  }

  // ます目（まちづくりのときだけ）と、復習がたまったときの暗さ
  let gridPath = '';
  let dim = '';
  if (grid || danger) {
    for (let y = y0; y < y0 + CHUNK; y++) {
      for (let x = x0; x < x0 + CHUNK; x++) {
        if (!isLandAt(model, x, y)) continue;
        if (danger) dim += tile(x, y);
        if (!grid) continue;
        gridPath += `M${P(x + 1, y)}L${P(x, y)}L${P(x, y + 1)}`;
        if (!isLandAt(model, x, y + 1)) gridPath += `M${P(x, y + 1)}L${P(x + 1, y + 1)}`;
        if (!isLandAt(model, x + 1, y)) gridPath += `M${P(x + 1, y)}L${P(x + 1, y + 1)}`;
      }
    }
  }

  return {
    under: under.html(),
    ground: base.html() + fringe.html() + detail.html() + lines.html()
      + (gridPath ? `<path fill="none" stroke="#4a3a28" stroke-opacity=".2" stroke-width=".7" d="${gridPath}"/>` : ''),
    shadow: shadow.html() + (dim ? `<path fill="#0b1220" fill-opacity=".34" d="${dim}"/>` : ''),
    over: over.html(),
  };
}

/** もちもの欄などに出す、地面 1 マス分の絵の枠（viewBox） */
export const GROUND_ICON_VIEWBOX = '-34 61 68 62';
const ICON_CELL = 2;

/**
 * 地面 1 マス分の絵（道・水路・芝生など、平らなアイテムの見本）。
 * 町に描くのと同じ絵を、土の厚みつきの 1 マスとして返す（雲は描かない）。
 * @param {string} kindName GROUND_KINDS の名前
 */
export function paintGroundIcon(kindName) {
  const total = GRID_SIZE * GRID_SIZE;
  const kind = new Uint8Array(total);
  const land = new Uint8Array(total);
  const index = ICON_CELL * GRID_SIZE + ICON_CELL;
  kind[index] = KIND_INDEX[kindName] ?? KIND_INDEX.soil;
  land[index] = 1;
  const art = paintChunk({ kind, land, casts: new Array(total).fill(null) }, 0, 0, { clouds: false });
  return art.under + art.ground;
}
