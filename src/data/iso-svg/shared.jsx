import { natureArtMarkup } from './nature-art.js';
import { houseArtMarkup } from './house-art.js';

// 町の絵（SVG）の「おおもと」を、文書に 1 回だけ置く仕組み。src/data/iso-svg/ の各ファイルから import する。
// ここにあるものは src/data/iso-svg.js からは再エクスポートしない（町のアイテムではないため）。
//
// 以前は 112 個の絵がそれぞれ <defs> を持ち、重い町では DOM の 3 割が <defs> の中だった
// （同じ id が何百個も重複していた）。いまは、絵のおおもとを ここへ 1 回だけ置き、町では <use> で呼びだす。
// display:none にすると一部のブラウザで参照が切れるので、大きさ 0 の SVG にしておく。
const SHARED_DEFS_ID = 'iso-svg-shared-defs';
const SHARED_DEFS_MARKUP =
  '<defs>' +
  // おばけ（special.jsx）の まわりの光
  '<filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">' +
  '<feGaussianBlur stdDeviation="3" result="coloredBlur" />' +
  '<feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>' +
  '</filter>' +
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
 * 建物と小さなもの（buildings-art.js・props-art.js）は 100 種類近くあり、全部を先に置くと、町に無いものの絵まで
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
