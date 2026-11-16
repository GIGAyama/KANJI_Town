import React from 'react';
import { natureArtMarkup } from './nature-art.js';
import { houseArtMarkup } from './house-art.js';

// 建物の絵（SVG）が共通で使う部品。src/data/iso-svg/ の各ファイルから import する。
// ここにあるものは src/data/iso-svg.js からは再エクスポートしない（町のアイテムではないため）。

// ==========================================
// 1. Shared Definitions & Helpers
// ==========================================
/**
 * 建物の絵が url(#soft-shadow) などで参照する影・光・グラデーション。
 * 以前は 112 個の絵がそれぞれ <defs> を持ち、重い町では DOM の 3 割が <defs> の中だった
 * （同じ id が何百個も重複していた）。絵のかたまりを読みこんだときに、文書に 1 回だけ置く。
 * display:none にすると一部のブラウザで参照が切れるので、大きさ 0 の SVG にしておく。
 */
const SHARED_DEFS_ID = 'iso-svg-shared-defs';
const SHARED_DEFS_MARKUP =
  '<defs>' +
  '<filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">' +
  '<feDropShadow dx="1.5" dy="3" stdDeviation="2" flood-color="#0f172a" flood-opacity="0.4" />' +
  '</filter>' +
  '<filter id="strong-shadow" x="-30%" y="-30%" width="160%" height="160%">' +
  '<feDropShadow dx="-2" dy="5" stdDeviation="3" flood-color="#0f172a" flood-opacity="0.6" />' +
  '</filter>' +
  '<filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">' +
  '<feGaussianBlur stdDeviation="3" result="coloredBlur" />' +
  '<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>' +
  '</filter>' +
  '<linearGradient id="grad-glass" x1="0%" y1="0%" x2="100%" y2="100%">' +
  '<stop offset="0%" stop-color="#bae6fd" stop-opacity="0.9" />' +
  '<stop offset="50%" stop-color="#38bdf8" stop-opacity="0.6" />' +
  '<stop offset="100%" stop-color="#0284c7" stop-opacity="0.8" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-gold" x1="0%" y1="100%" x2="100%" y2="0%">' +
  '<stop offset="0%" stop-color="#d97706" />' +
  '<stop offset="40%" stop-color="#fbbf24" />' +
  '<stop offset="60%" stop-color="#fef08a" />' +
  '<stop offset="100%" stop-color="#b45309" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-water" x1="0%" y1="0%" x2="100%" y2="100%">' +
  '<stop offset="0%" stop-color="#7dd3fc" />' +
  '<stop offset="100%" stop-color="#0ea5e9" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-roof-red" x1="0%" y1="0%" x2="0%" y2="100%">' +
  '<stop offset="0%" stop-color="#ef4444" /><stop offset="100%" stop-color="#991b1b" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-roof-blue" x1="0%" y1="0%" x2="0%" y2="100%">' +
  '<stop offset="0%" stop-color="#3b82f6" /><stop offset="100%" stop-color="#1e3a8a" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-roof-slate" x1="0%" y1="0%" x2="0%" y2="100%">' +
  '<stop offset="0%" stop-color="#64748b" /><stop offset="100%" stop-color="#334155" />' +
  '</linearGradient>' +
  '<linearGradient id="grad-magma" x1="0%" y1="0%" x2="100%" y2="100%">' +
  '<stop offset="0%" stop-color="#f97316" />' +
  '<stop offset="50%" stop-color="#ef4444" />' +
  '<stop offset="100%" stop-color="#b91c1c" />' +
  '</linearGradient>' +
  // 直方体（IsoCube）の面に重ねる陰影。面の大きさに合わせて伸びる（objectBoundingBox）
  '<linearGradient id="iso-shade-left" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#ffffff" stop-opacity="0.1" /><stop offset="0.45" stop-color="#ffffff" stop-opacity="0" />' +
  '<stop offset="1" stop-color="#0f172a" stop-opacity="0.16" />' +
  '</linearGradient>' +
  '<linearGradient id="iso-shade-right" x1="0" y1="0" x2="0" y2="1">' +
  '<stop offset="0" stop-color="#0f172a" stop-opacity="0.02" /><stop offset="1" stop-color="#0f172a" stop-opacity="0.24" />' +
  '</linearGradient>' +
  '<linearGradient id="iso-shade-top" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#ffffff" stop-opacity="0.26" /><stop offset="0.6" stop-color="#ffffff" stop-opacity="0" />' +
  '</linearGradient>' +
  '<linearGradient id="iso-glass" x1="0" y1="0" x2="1" y2="1">' +
  '<stop offset="0" stop-color="#d9f2ff" /><stop offset="0.5" stop-color="#8fd3f7" /><stop offset="1" stop-color="#5fb5e6" />' +
  '</linearGradient>' +
  // 木・花・岩と「小さな家」の絵のおおもと（nature.jsx・structures.jsx が <use> で呼びだす）
  natureArtMarkup() +
  houseArtMarkup() +
  '</defs>';

export function mountSharedDefs(doc = globalThis.document) {
  if (!doc || !doc.body || doc.getElementById(SHARED_DEFS_ID)) return;
  const holder = doc.createElement('div');
  holder.innerHTML = `<svg id="${SHARED_DEFS_ID}" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">${SHARED_DEFS_MARKUP}</svg>`;
  doc.body.appendChild(holder.firstChild);
}

/**
 * 絵のおおもとを 1 つ、<defs> に足す（同じ id は 1 回だけ）。<use href="#id"> で呼びだせるようになる。
 *
 * 新しい絵がらの建物（buildings-art.js）は 100 種類近くあり、全部を先に置くと、町に無い建物の絵まで
 * 読みこむことになる。その建物を はじめて描くときに、その絵だけを作って置く。
 * 描いている途中（render の中）から呼んでよい: 置き先は React の外の <svg> で、何度呼んでも同じ結果になる。
 * @param {string} id 絵の id
 * @param {() => string} build id つきの <g>…</g> を返す関数（まだ置いていないときだけ呼ぶ）
 */
const mountedDefs = new Set();
export function ensureDef(id, build, doc = globalThis.document) {
  if (mountedDefs.has(id) || !doc || !doc.body) return;
  mountSharedDefs(doc);
  const defs = doc.getElementById(SHARED_DEFS_ID)?.querySelector('defs');
  if (!defs) return;
  mountedDefs.add(id);
  defs.insertAdjacentHTML('beforeend', build());
}

const darken = (hex, amt = 20) => {
  if (!hex || typeof hex !== 'string' || hex.startsWith('url')) return hex || '#000';
  const match = hex.match(/\w\w/g);
  if (!match || match.length !== 3) return hex;
  let [r, g, b] = match.map(x => parseInt(x, 16));
  r = Math.max(0, r - amt); g = Math.max(0, g - amt); b = Math.max(0, b - amt);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};
const lighten = (hex, amt = 20) => {
  if (!hex || typeof hex !== 'string' || hex.startsWith('url')) return hex || '#fff';
  const match = hex.match(/\w\w/g);
  if (!match || match.length !== 3) return hex;
  let [r, g, b] = match.map(x => parseInt(x, 16));
  r = Math.min(255, r + amt); g = Math.min(255, g + amt); b = Math.min(255, b + amt);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

// ==========================================
// 共有アイソメトリック描画ヘルパー
// 100×100 の論理グリッドをひし形（幅88・高さ44）にマッピングする。
// SvgWarehouse / SvgSchool と同じ座標系で、
// translate(50, 100) scale(2.0〜2.4) と組み合わせて使う。
// ==========================================
const isoPt = (x, y, z = 0) => [(x - y) * 0.44, -44 + (x + y) * 0.22 - z];
const iso3 = (x, y, z = 0) => {
  const [px, py] = isoPt(x, y, z);
  return `${px.toFixed(2)},${py.toFixed(2)}`;
};

/**
 * 直方体（左面=南西・右面=南東・天面）。
 * 面はベタ塗りの上に、うすい陰影を重ねる（左上から光が当たる: 天面は奥が明るく、
 * 側面は地面に近いほど暗い）。色は呼び出しがわの色のまま変えない。
 */
const IsoCube = ({ x, y, z = 0, w, d, h, top, left, right, stroke = '#1e293b', sw = 0.8 }) => {
  const leftFace = `${iso3(x, y + d, z)} ${iso3(x + w, y + d, z)} ${iso3(x + w, y + d, z + h)} ${iso3(x, y + d, z + h)}`;
  const rightFace = `${iso3(x + w, y, z)} ${iso3(x + w, y + d, z)} ${iso3(x + w, y + d, z + h)} ${iso3(x + w, y, z + h)}`;
  const topFace = `${iso3(x, y, z + h)} ${iso3(x + w, y, z + h)} ${iso3(x + w, y + d, z + h)} ${iso3(x, y + d, z + h)}`;
  // 低い箱（敷地の台・ふち石など）は陰影を重ねても見えないので、要素を増やさない
  const shaded = h >= 6;
  return (
    <g>
      <polygon points={leftFace} fill={left} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={rightFace} fill={right} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <polygon points={topFace} fill={top} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      {shaded && <polygon points={leftFace} fill="url(#iso-shade-left)" />}
      {shaded && <polygon points={rightFace} fill="url(#iso-shade-right)" />}
      {shaded && <polygon points={topFace} fill="url(#iso-shade-top)" />}
    </g>
  );
};

/** 南西向きの壁面パネル（窓・ドア・看板用） */
const FaceSW = ({ x1, x2, y, z1, z2, fill, stroke = '#1e293b', sw = 0.8 }) => (
  <polygon points={`${iso3(x1, y, z1)} ${iso3(x2, y, z1)} ${iso3(x2, y, z2)} ${iso3(x1, y, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/** 南東向きの壁面パネル */
const FaceSE = ({ x, y1, y2, z1, z2, fill, stroke = '#1e293b', sw = 0.8 }) => (
  <polygon points={`${iso3(x, y1, z1)} ${iso3(x, y2, z1)} ${iso3(x, y2, z2)} ${iso3(x, y1, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/** 格子入りの窓（南西向き） */
const WinSW = ({ x1, x2, y, z1, z2 }) => (
  <g>
    <FaceSW x1={x1} x2={x2} y={y} z1={z1} z2={z2} fill="#f8fafc" sw={1} />
    <FaceSW x1={x1 + 1} x2={x2 - 1} y={y + 0.1} z1={z1 + 1} z2={z2 - 1} fill="url(#iso-glass)" sw={0.5} />
    <line x1={isoPt(x1 + 2.2, y + 0.1, z2 - 2.2)[0]} y1={isoPt(x1 + 2.2, y + 0.1, z2 - 2.2)[1]} x2={isoPt(x1 + 2.2 + (x2 - x1) * 0.28, y + 0.1, z2 - 2.2 - (z2 - z1) * 0.34)[0]} y2={isoPt(x1 + 2.2 + (x2 - x1) * 0.28, y + 0.1, z2 - 2.2 - (z2 - z1) * 0.34)[1]} stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
    <line x1={isoPt((x1 + x2) / 2, y, z1)[0]} y1={isoPt((x1 + x2) / 2, y, z1)[1]} x2={isoPt((x1 + x2) / 2, y, z2)[0]} y2={isoPt((x1 + x2) / 2, y, z2)[1]} stroke="#1e293b" strokeWidth="0.6" />
  </g>
);

/** 格子入りの窓（南東向き） */
const WinSE = ({ x, y1, y2, z1, z2 }) => (
  <g>
    <FaceSE x={x} y1={y1} y2={y2} z1={z1} z2={z2} fill="#f8fafc" sw={1} />
    <FaceSE x={x + 0.1} y1={y1 + 1} y2={y2 - 1} z1={z1 + 1} z2={z2 - 1} fill="url(#iso-glass)" sw={0.5} />
    <line x1={isoPt(x + 0.1, y2 - 2.2, z2 - 2.2)[0]} y1={isoPt(x + 0.1, y2 - 2.2, z2 - 2.2)[1]} x2={isoPt(x + 0.1, y2 - 2.2 - (y2 - y1) * 0.28, z2 - 2.2 - (z2 - z1) * 0.34)[0]} y2={isoPt(x + 0.1, y2 - 2.2 - (y2 - y1) * 0.28, z2 - 2.2 - (z2 - z1) * 0.34)[1]} stroke="#ffffff" strokeWidth="0.9" strokeLinecap="round" opacity="0.85" />
    <line x1={isoPt(x, (y1 + y2) / 2, z1)[0]} y1={isoPt(x, (y1 + y2) / 2, z1)[1]} x2={isoPt(x, (y1 + y2) / 2, z2)[0]} y2={isoPt(x, (y1 + y2) / 2, z2)[1]} stroke="#1e293b" strokeWidth="0.6" />
  </g>
);

/** 縞模様のひさし（南西面から手前へ張り出す） */
const AwningSW = ({ x1, x2, y, z, c1 = '#ef4444', c2 = '#f8fafc', depth = 9, drop = 4, stripes = 6 }) => {
  const segs = [];
  for (let i = 0; i < stripes; i++) {
    const a = x1 + ((x2 - x1) * i) / stripes;
    const b = x1 + ((x2 - x1) * (i + 1)) / stripes;
    segs.push(
      <polygon key={i} points={`${iso3(a, y, z)} ${iso3(b, y, z)} ${iso3(b, y + depth, z - drop)} ${iso3(a, y + depth, z - drop)}`}
        fill={i % 2 === 0 ? c1 : c2} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    );
  }
  return (
    <g>
      {segs}
      <polygon points={`${iso3(x1, y + depth, z - drop)} ${iso3(x2, y + depth, z - drop)} ${iso3(x2, y + depth, z - drop - 2.5)} ${iso3(x1, y + depth, z - drop - 2.5)}`} fill={darken(c1, 40)} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    </g>
  );
};

/**
 * 接地影（いまは何も描かない）。
 * 影は地面のレイヤー（systems/town-ground-paint.js）が、絵の足もとの大きさに合わせて描く。
 * 絵の中にも だ円の影があると、大きな建物ほど濃い影が二重に出た。呼び出しは残してある
 * （描き方を戻すときは、ここだけを直す）。
 */
const IsoShadow = () => null;

// ==========================================
// 複数の見出しから使う部品（生産・名所の屋台、店・公共の小型建築）
// ==========================================

/** 屋台1台（縞テント＋商品台） */
const MarketStall = ({ gx, gy, c1, c2, goods }) => {
  const [px, py] = isoPt(gx, gy, 0);
  return (
    <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
      {/* 台（カウンター） */}
      <polygon points="-11,-2.5 0,3 11,-2.5 0,-8" fill="#d97706" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="-11,-2.5 0,3 0,7 -11,1.5" fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="11,-2.5 0,3 0,7 11,1.5" fill="#b45309" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 商品（果物かご） */}
      {goods.map(([ox, oy, c], i) => (
        <circle key={i} cx={ox} cy={oy} r="1.8" fill={c} stroke="#1e293b" strokeWidth="0.6" />
      ))}
      {/* 支柱 */}
      <line x1="-11" y1="-2.5" x2="-11" y2="-16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11" y1="-2.5" x2="11" y2="-16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
      {/* 縞テント屋根 */}
      {[0, 1, 2, 3].map(i => (
        <polygon key={i} points={`${-13 + i * 6.5},-15 ${-6.5 + i * 6.5},-15 ${-4.5 + i * 6.5},-20.5 ${-11 + i * 6.5},-20.5`}
          fill={i % 2 === 0 ? c1 : c2} stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      {/* テントの波形の縁 */}
      <path d="M -13,-15 Q -11.4,-12.8 -9.8,-15 Q -8.2,-12.8 -6.6,-15 Q -5,-12.8 -3.4,-15 Q -1.8,-12.8 -0.2,-15 Q 1.4,-12.8 3,-15 Q 4.6,-12.8 6.2,-15 Q 7.8,-12.8 9.4,-15 Q 11,-12.8 12.6,-15 L 13,-15 L 13,-16 L -13,-16 Z" fill={c1} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    </g>
  );
};

/**
 * 小型商業建築の共通ビルダー
 * 敷地パッド・2トーンの壁・大きなショーウィンドウ・ガラスドア・
 * 縞ひさし・屋上看板（グリフ付き）・植木をワンセットで描画する
 */
const ShopBase = ({ wall = '#fff7ed', base, roof = '#e7e5e4', awn1 = '#ef4444', awn2 = '#f8fafc', sign = '#ffffff', signEdge, h = 24, glyph = null, pad = '#e7e5e4', wide = false }) => {
  const wallD = darken(wall, 28);
  const baseC = base || darken(wall, 60);
  const roofD = darken(roof, 35);
  const signB = signEdge || awn1;
  const X1 = wide ? 8 : 16, X2 = wide ? 92 : 84; // 建物の幅
  const [gx, gy] = isoPt(50, 42, h + 15.5); // 看板グリフの中心
  return (
    <g>
      <IsoShadow rx={wide ? 46 : 40} />
      {/* 敷地パッド */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill={pad} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      {/* 本体 */}
      <IsoCube x={X1} y={16} w={X2 - X1} d={68} h={h} top={roof} left={wall} right={wallD} sw={1} />
      {/* 幅木（ベーストリム） */}
      <FaceSW x1={X1} x2={X2} y={84} z1={0} z2={3.5} fill={baseC} sw={0.8} />
      <FaceSE x={X2} y1={16} y2={84} z1={0} z2={3.5} fill={darken(baseC, 20)} sw={0.8} />
      {/* ショーウィンドウ（正面） */}
      <FaceSW x1={X1 + 6} x2={52} y={84.2} z1={5} z2={h - 7} fill="#1e293b" sw={1} />
      <FaceSW x1={X1 + 7.5} x2={50.5} y={84.4} z1={6} z2={h - 8} fill="url(#grad-glass)" sw={0.5} />
      <line x1={isoPt((X1 + 58) / 2, 84.4, 6)[0]} y1={isoPt((X1 + 58) / 2, 84.4, 6)[1]} x2={isoPt((X1 + 58) / 2, 84.4, h - 8)[0]} y2={isoPt((X1 + 58) / 2, 84.4, h - 8)[1]} stroke="#1e293b" strokeWidth="0.7" />
      {/* ガラスドア */}
      <FaceSW x1={60} x2={X2 - 8} y={84.2} z1={0} z2={h - 7} fill="#1e293b" sw={1} />
      <FaceSW x1={61.5} x2={X2 - 9.5} y={84.4} z1={1} z2={h - 8} fill="#bae6fd" sw={0.5} />
      <line x1={isoPt((60 + X2 - 8) / 2, 84.4, 1)[0]} y1={isoPt((60 + X2 - 8) / 2, 84.4, 1)[1]} x2={isoPt((60 + X2 - 8) / 2, 84.4, h - 8)[0]} y2={isoPt((60 + X2 - 8) / 2, 84.4, h - 8)[1]} stroke="#1e293b" strokeWidth="0.9" />
      {/* 側面の窓 */}
      <WinSE x={X2 + 0.2} y1={28} y2={44} z1={8} z2={h - 7} />
      <WinSE x={X2 + 0.2} y1={52} y2={68} z1={8} z2={h - 7} />
      {/* 縞ひさし */}
      <AwningSW x1={X1 + 4} x2={X2 - 4} y={84} z={h - 4.5} c1={awn1} c2={awn2} />
      {/* 屋上パラペット */}
      <IsoCube x={X1 - 2} y={14} w={X2 - X1 + 4} d={72} z={h} h={3} top={roof} left={lighten(roof, 8)} right={roofD} sw={0.9} />
      {/* 屋上看板 */}
      <FaceSW x1={30} x2={38} y={42} z1={h + 3} z2={h + 8} fill={darken(sign, 70)} sw={0.7} />
      <FaceSW x1={62} x2={70} y={42} z1={h + 3} z2={h + 8} fill={darken(sign, 70)} sw={0.7} />
      <FaceSW x1={24} x2={76} y={42} z1={h + 7} z2={h + 24} fill={signB} sw={1.1} />
      <FaceSW x1={27} x2={73} y={42.2} z1={h + 9} z2={h + 22} fill={sign} sw={0.6} />
      {glyph && <g transform={`translate(${gx.toFixed(1)}, ${gy.toFixed(1)})`}>{glyph}</g>}
      {/* 入口横の植木 */}
      <g transform={`translate(${isoPt(92, 91, 0)[0].toFixed(1)}, ${isoPt(92, 91, 0)[1].toFixed(1)})`}>
        <polygon points="-3.5,0 3.5,0 2.5,-4.5 -2.5,-4.5" fill="#b45309" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <circle cx="0" cy="-7.5" r="4.2" fill="#16a34a" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="-1.4" cy="-8.8" r="1.8" fill="#4ade80" />
      </g>
    </g>
  );
};

export { darken, lighten, isoPt, iso3, IsoCube, FaceSW, FaceSE, WinSW, WinSE, AwningSW, IsoShadow, MarketStall, ShopBase };
