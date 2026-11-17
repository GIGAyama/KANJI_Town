// 町の地面の「何が どこに あるか」 — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（TerrainLayer が使い、test/ から確かめる）。
//
// 地面は 1 マスずつ div を作らず、1 枚の SVG の中に かたまり（CHUNK × CHUNK マス）ごとの
// 絵を並べる。ここは「地図 → 地面の種類の表」と「かたまりの切り方」だけを持ち、
// 絵そのもの（色・形）は town-ground-paint.js が描く。

import { GRID_SIZE, isExplored } from './town-map-view.js';
import { itemFit } from '../data/town-item-fit.js';

/** かたまり 1 つの 1 辺のマス数（GRID_SIZE を割りきれる数にする） */
export const CHUNK = 5;

/**
 * 地面の種類。
 * - rank  : 大きいほうが、小さいほうのマスへ はみ出して描かれる（草が土の上へ のびる）
 * - spill : はみ出す深さ（マスの 1 辺を 1 としたときの長さ）。無ければ はみ出さない
 * - group : となりと「つながる」なかま（道どうし・水どうし）
 * - raised: まわりより高く見せる（手前の辺に がけ を描く）
 */
export const GROUND_KINDS = Object.freeze({
  void:      { rank: -1 },
  water:     { rank: 0, group: 'water' },
  pond:      { rank: 0, group: 'water' },
  magma:     { rank: 1, group: 'magma' },
  sand:      { rank: 2, spill: 0.13 },
  soil:      { rank: 3, spill: 0.11 },
  dead:      { rank: 4, spill: 0.07 },
  dirt:      { rank: 5, spill: 0.06 },
  rough:     { rank: 6, spill: 0.14 },
  lawn:      { rank: 7, spill: 0.06 },
  grass:     { rank: 8, spill: 0.16 },
  forest:    { rank: 9, spill: 0.17 },
  rock:      { rank: 10, raised: true },
  high:      { rank: 11, raised: true },
  petal:     { rank: 12, group: 'petal' },
  paddy:     { rank: 12, group: 'paddy' },
  field:     { rank: 12, group: 'field' },
  road:      { rank: 20, group: 'road', paved: true },
  asphalt:   { rank: 20, group: 'road', paved: true },
  crosswalk: { rank: 20, group: 'road', paved: true },
  brick:     { rank: 20, group: 'brick', paved: true },
  rail:      { rank: 20, group: 'rail', paved: true },
  stone:     { rank: 20, group: 'stone', paved: true },
});

/** 種類の名前 ⇄ 番号（表は Uint8Array で持つ） */
export const KIND_NAMES = Object.freeze(Object.keys(GROUND_KINDS));
export const KIND_INDEX = Object.freeze(Object.fromEntries(KIND_NAMES.map((name, i) => [name, i])));
const VOID = KIND_INDEX.void;

/** 地図に置いてある id → 地面の種類 */
const KIND_BY_ITEM = Object.freeze({
  t_bedrock: 'rock',
  t_roughland: 'rough',
  t_cleared: 'soil',
  t_weed: 'soil',
  t_deadland: 'dead',
  t_grassland: 'grass',
  t_forest_floor: 'forest',
  t_sand: 'sand',
  t_shallow_water: 'water',
  t_highland: 'high',
  // 平らなアイテムは、建物の絵ではなく地面として描く
  t_water: 'water',
  t_pond: 'pond',
  t_bridge: 'water', // 橋の下は水。水路の途中に置くと、水がつながって見える
  t_cherry_road: 'petal', // 桜並木の足もとは、花びらの小道。並べると道がつながる
  t_palm: 'sand', // ヤシの木の足もとは砂
  t_magma: 'magma',
  t_road: 'road',
  t_asphalt: 'asphalt',
  t_crosswalk: 'crosswalk',
  t_brick: 'brick',
  t_railway: 'rail',
  t_dirt: 'dirt',
  t_grass_flat: 'lawn',
  t_paddy: 'paddy',
  t_field: 'field',
  t_stone_path: 'stone',
  t_beach: 'sand',
});

/**
 * 影の形は、絵の足もとの形で決める。
 * - NO_SHADOW   : 低くて平らなもの（公園・プール・庭など）。箱の影を落とすと不自然になる
 * - ROUND_SHADOW: 建物でも、足もとが丸い・細いもの（鳥居・井戸など）
 */
// ⚠️ 建物（iso-svg/buildings-art.js）のうち、影を絵の中に描くもの・平らなものは、絵の側の
//    shadow（'own'・'none'）で決まる（town-item-fit.js の ownShadow）。ここに書くのは それ以外。
const NO_SHADOW = new Set(['t_fence']);
const ROUND_SHADOW = new Set(['t_torii', 't_well', 't_dragon', 't_mine', 't_ferris_wheel', 't_tv_tower']);

/** 地面として描くので、建物のレイヤーでは絵を出さない id */
const GROUND_AND_STANDING = new Set(['t_bridge', 't_cherry_road', 't_weed', 't_palm']);
export const isGroundItem = (itemId) => !GROUND_AND_STANDING.has(itemId) && KIND_BY_ITEM[itemId] !== undefined;

/**
 * そのマスの地面の種類の名前を返す。
 * 木や花（自然のもの）の足もとは草地にする。更地のままだと、植えた木が土の上に立って見える。
 */
export function groundKindOf(itemId, item) {
  const known = KIND_BY_ITEM[itemId];
  if (known) return known;
  if (item && item.type === 'nature' && !item.isFlat && !item.size) return 'grass';
  return 'soil';
}

const cellIndex = (x, y) => y * GRID_SIZE + x;
const inGrid = (x, y) => x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;

/**
 * 地図から、地面を描くための表を作る（地図が変わったときに 1 回だけ）。
 *
 * - kind[i]  : 地面の種類の番号
 * - land[i]  : 1 なら地面を描くマス（探索ずみ、または大きな建物の足もと）
 * - casts[i] : 影を落とすもの（{ w, h, bw, bh, height, round, ox?, oy? }）。大きな建物は左上のマスにだけ入る。
 *              w・h は足もとのマス数、bw・bh は絵の足もとの大きさ（マス）、ox・oy は敷地のまん中からの ずれ
 *
 * 大きな建物（size を持つもの）は、探索範囲の外へ はみ出して置けてしまう。はみ出した
 * 足もとにも地面を描かないと、建物が空に浮いて見えるので land に入れる。
 * @param {Object<string,string>} map
 * @param {Map<string, object>} itemMap
 * @param {number} exploredRadius
 */
export function buildGroundModel(map, itemMap, exploredRadius) {
  const total = GRID_SIZE * GRID_SIZE;
  const kind = new Uint8Array(total);
  const land = new Uint8Array(total);
  const casts = new Array(total).fill(null);
  const safeMap = map || {};

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const i = cellIndex(x, y);
      const key = `${x},${y}`;
      const itemId = safeMap[key];
      const item = itemId ? itemMap.get(itemId) : null;
      kind[i] = KIND_INDEX[groundKindOf(itemId, item)];
      if (isExplored(x, y, exploredRadius)) land[i] = 1;
      if (!item) continue;
      if (item.size) {
        for (let dy = 0; dy < item.size.h; dy++) {
          for (let dx = 0; dx < item.size.w; dx++) {
            if (inGrid(x + dx, y + dy)) land[cellIndex(x + dx, y + dy)] = 1;
          }
        }
        // 足もとの表（kind を更地にする）に使うので、影を落とさないものも入れておく
        const fit = itemFit(item);
        casts[i] = { w: item.size.w, h: item.size.h, bw: fit.bw, bh: fit.bh, height: NO_SHADOW.has(itemId) || fit.ownShadow ? 0 : (item.isoHeight || 30), round: ROUND_SHADOW.has(itemId) };
        // 建物が敷地のまん中から ずれているときは、影も そこへ ずらす
        if (fit.cu !== undefined) { casts[i].ox = fit.cu - item.size.w / 2; casts[i].oy = fit.cv - item.size.h / 2; }
      } else if (item.type !== 'terrain' && !item.isFlat && !NO_SHADOW.has(itemId) && !itemFit(item).ownShadow) {
        const fit = itemFit(item);
        casts[i] = { w: 1, h: 1, bw: fit.bw, bh: fit.bh, height: item.isoHeight || 10, round: item.type === 'nature' || item.type === 'decoration' || ROUND_SHADOW.has(itemId) };
      }
      const topId = safeMap[`${key}:top`];
      const topItem = topId ? itemMap.get(topId) : null;
      // 上に のせたもの（道の上の車・ベンチなど）。影を絵の中に描くもの（車など）には落とさない
      if (topItem && !casts[i] && !NO_SHADOW.has(topId) && !itemFit(topItem).ownShadow) {
        const fit = itemFit(topItem);
        casts[i] = { w: 1, h: 1, bw: fit.bw, bh: fit.bh, height: topItem.isoHeight || 8, round: true };
      }
    }
  }
  // 大きな建物の足もと（左上以外）は、下に何が書いてあっても更地として描く
  for (let i = 0; i < total; i++) {
    const cast = casts[i];
    if (!cast || (cast.w === 1 && cast.h === 1)) continue;
    const ax = i % GRID_SIZE;
    const ay = (i - ax) / GRID_SIZE;
    for (let dy = 0; dy < cast.h; dy++) {
      for (let dx = 0; dx < cast.w; dx++) {
        if (inGrid(ax + dx, ay + dy)) kind[cellIndex(ax + dx, ay + dy)] = KIND_INDEX.soil;
      }
    }
  }
  return { kind, land, casts };
}

/** 地面を描くマスか（マップの外・まだ見えていないマスは false） */
export const isLandAt = (model, x, y) => inGrid(x, y) && model.land[cellIndex(x, y)] === 1;

/** そのマスの地面の種類の番号（地面を描かないマスは void） */
export const kindAt = (model, x, y) => (isLandAt(model, x, y) ? model.kind[cellIndex(x, y)] : VOID);

/** そのマスに影を落とすもの（無ければ null） */
export const castAt = (model, x, y) => (inGrid(x, y) ? model.casts[cellIndex(x, y)] : null);

/** 表示範囲（マス）にかかる かたまりの一覧 */
export function chunksInRange({ startX, startY, endX, endY }) {
  const out = [];
  const c0x = Math.max(0, Math.floor(startX / CHUNK));
  const c0y = Math.max(0, Math.floor(startY / CHUNK));
  const c1x = Math.min(Math.ceil(GRID_SIZE / CHUNK) - 1, Math.floor(endX / CHUNK));
  const c1y = Math.min(Math.ceil(GRID_SIZE / CHUNK) - 1, Math.floor(endY / CHUNK));
  for (let cy = c0y; cy <= c1y; cy++) {
    for (let cx = c0x; cx <= c1x; cx++) out.push({ cx, cy, key: `${cx},${cy}` });
  }
  return out;
}

/**
 * かたまり 1 つの絵が何で決まるかを、短い文字列にする。
 * 同じ文字列なら絵も同じなので、作りなおさない（建物を 1 つ置いても、描きなおすのは
 * そのまわりの かたまりだけ）。まわり 1 マス分（境目と がけ に使う）も入れる。
 * 地面を描くマスが 1 つも無い かたまりは '' を返す（何も描かない）。
 */
export function chunkSignature(model, cx, cy) {
  const x0 = cx * CHUNK;
  const y0 = cy * CHUNK;
  let sig = '';
  let any = false;
  for (let y = y0 - 1; y <= y0 + CHUNK; y++) {
    for (let x = x0 - 1; x <= x0 + CHUNK; x++) {
      const k = kindAt(model, x, y);
      if (k !== VOID) any = true;
      sig += String.fromCharCode(65 + k);
    }
  }
  if (!any) return '';
  // 影は、持ち主のマスがある かたまりが描く
  for (let y = y0; y < y0 + CHUNK; y++) {
    for (let x = x0; x < x0 + CHUNK; x++) {
      const cast = castAt(model, x, y);
      if (cast) sig += `|${x - x0},${y - y0},${cast.w},${cast.h},${cast.bw},${cast.bh},${cast.height},${cast.round ? 1 : 0},${cast.ox || 0},${cast.oy || 0}`;
    }
  }
  return sig;
}
