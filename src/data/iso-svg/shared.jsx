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

// ==========================================
// 共有アイソメトリック描画ヘルパー
// 100×100 の論理グリッドをひし形（幅88・高さ44）にマッピングする。
// translate(50, 100) scale(2.0〜2.4) と組み合わせて使う。
// ⚠️ これは前の絵がら用の部品。いまは かざり・のりもの（special.jsx・vehicles.jsx）だけが使う。
//    新しい建物の絵は kit.js の部品で描く（buildings-art.js）。
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
const IsoCube = ({ x, y, z = 0, w, d, h, top, left, right, stroke = '#2b211c', sw = 0.8 }) => {
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
const FaceSW = ({ x1, x2, y, z1, z2, fill, stroke = '#2b211c', sw = 0.8 }) => (
  <polygon points={`${iso3(x1, y, z1)} ${iso3(x2, y, z1)} ${iso3(x2, y, z2)} ${iso3(x1, y, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/** 南東向きの壁面パネル */
const FaceSE = ({ x, y1, y2, z1, z2, fill, stroke = '#2b211c', sw = 0.8 }) => (
  <polygon points={`${iso3(x, y1, z1)} ${iso3(x, y2, z1)} ${iso3(x, y2, z2)} ${iso3(x, y1, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/**
 * 接地影（いまは何も描かない）。
 * 影は地面のレイヤー（systems/town-ground-paint.js）が、絵の足もとの大きさに合わせて描く。
 * 絵の中にも だ円の影があると、大きな建物ほど濃い影が二重に出た。呼び出しは残してある
 * （描き方を戻すときは、ここだけを直す）。
 */
const IsoShadow = () => null;

export { isoPt, iso3, IsoCube, FaceSW, FaceSE, IsoShadow };
