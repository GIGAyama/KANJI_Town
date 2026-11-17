// 住民が歩ける所と、道のり — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（components/town/VillagerCanvas.jsx が使い、test/ から確かめる）。
//
// 前は 住民が 行き先へ まっすぐ歩いていたので、家・水路・木の上を通りぬけていた。
// ここでは 地図から「歩ける所」の表を作り、そこだけを通る道のり（A*）を探す。
//   ・道（道・アスファルト・横断歩道・レンガ道・石だたみ・橋・桜並木）… いちばん歩きやすい（住民は道を好む）
//   ・ひらけた地面（更地・ざっそう・芝生・土・すなはま）………………… 歩けるが、道より 3 倍 遠く感じる
//   ・それ以外（建物・木・かざり・水・田畑・線路・まだ ひらいていない土地・島の外）… 歩けない
// 道に のせたもの（車・ベンチなど）の上も歩けない。

import { GRID_SIZE, isExplored } from './town-map-view.js';

/** 歩けない */
export const WALK_BLOCKED = 0;
/** 道（歩く手間 1） */
export const WALK_ROAD = 1;
/** ひらけた地面（歩く手間 3） */
export const WALK_GROUND = 3;

const ROAD_IDS = new Set(['t_road', 't_asphalt', 't_crosswalk', 't_brick', 't_stone_path', 't_bridge', 't_cherry_road']);
const GROUND_IDS = new Set(['t_cleared', 't_weed', 't_grass_flat', 't_dirt', 't_beach']);
/** 住民が立ち寄る建物の種類（道・地面のような平らなものは除く） */
const VISIT_TYPES = new Set(['building', 'mega', 'rare', 'special', 'decoration', 'nature']);

const index = (x, y) => y * GRID_SIZE + x;
const inGrid = (x, y) => x >= 0 && y >= 0 && x < GRID_SIZE && y < GRID_SIZE;
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

/**
 * 地図から、歩ける所の表と、立ち寄り先（建物と その前の歩けるマス）を作る。地図が変わったときに 1 回だけ。
 * @param {Object<string,string>} mapData
 * @param {Map<string, object>} itemMap
 * @param {number} exploredRadius
 * @returns {{ cost: Uint8Array, cover: Uint8Array, visits: { x: number, y: number, w: number, h: number, type: string, doors: {x:number,y:number}[] }[] }}
 *   cover[i] が 1 のマスでは、住民が 手前の建物・木の うしろに かくれる（住民の絵を うすくして見せる）
 */
export function buildWalkWorld(mapData, itemMap, exploredRadius) {
  const map = mapData || {};
  const cost = new Uint8Array(GRID_SIZE * GRID_SIZE);
  const footprints = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isExplored(x, y, exploredRadius)) continue;
      const key = `${x},${y}`;
      if (map[`${key}:top`]) continue;
      const id = map[key];
      if (ROAD_IDS.has(id)) cost[index(x, y)] = WALK_ROAD;
      else if (GROUND_IDS.has(id)) cost[index(x, y)] = WALK_GROUND;
    }
  }
  // 大きな建物は、左上のマスにだけ書いてある。足もと全体を ふさぐ（下に更地の字が残っていても）
  for (const [key, id] of Object.entries(map)) {
    if (key.includes(':')) continue;
    const item = itemMap.get(id);
    if (!item || !VISIT_TYPES.has(item.type) || item.isFlat || ROAD_IDS.has(id) || GROUND_IDS.has(id)) continue;
    const [x, y] = key.split(',').map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const w = item.size?.w || 1;
    const h = item.size?.h || 1;
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (inGrid(x + dx, y + dy)) cost[index(x + dx, y + dy)] = WALK_BLOCKED;
    footprints.push({ x, y, w, h, type: item.type, height: item.isoHeight || 0 });
  }
  const cover = new Uint8Array(GRID_SIZE * GRID_SIZE);
  for (const f of footprints) markCover(cover, f);
  const visits = [];
  for (const f of footprints) {
    const doors = doorsOf(cost, f);
    if (doors.length) visits.push({ ...f, doors });
  }
  return { cost, cover, visits };
}

/** 背の高さ（isoHeight）が これ以上のものは、ななめ うしろの 1 マスの住民を かくす */
const COVER_HEIGHT = 14;
/** これ以上なら、となりの うしろ（右うしろ・左うしろ）も かくす */
const COVER_SIDE_HEIGHT = 28;
/** これ以上なら、もう 1 列 うしろも かくす */
const COVER_FAR_HEIGHT = 44;

/**
 * 建物・木の うしろで、住民が かくれるマス に しるしを付ける。
 * 住民は 町の上に重ねた canvas に描く（VillagerCanvas.jsx）ので、うしろに いる住民は 絵を うすくして「うしろにいる」と分かるようにする。
 * 画面では、マス (x+1, y+1) が (x, y) の まっすぐ下にあり、その上に立つ絵が (x, y) に 重なる。
 */
function markCover(cover, { x, y, w, h, height }) {
  if (height < COVER_HEIGHT) return;
  const mark = (cx, cy) => { if (inGrid(cx, cy)) cover[index(cx, cy)] = 1; };
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const fx = x + dx; const fy = y + dy;
      mark(fx - 1, fy - 1);
      if (height >= COVER_SIDE_HEIGHT) { mark(fx - 1, fy); mark(fx, fy - 1); }
      if (height >= COVER_FAR_HEIGHT) { mark(fx - 2, fy - 2); mark(fx - 2, fy - 1); mark(fx - 1, fy - 2); }
    }
  }
}

/** そのマスの住民は、手前の建物・木に かくれるか */
export const isCovered = (world, x, y) => inGrid(x, y) && world.cover[index(x, y)] === 1;

/**
 * 建物の前の 歩けるマス。建物の絵は 戸口を 手前の 2 面（+y がわ・+x がわ）に描いてあるので、
 * そちらを先に並べる（立ち寄った住民が、建物の 正面に立つように）。
 */
function doorsOf(cost, { x, y, w, h }) {
  const front = [];
  const back = [];
  const push = (list, cx, cy) => { if (inGrid(cx, cy) && cost[index(cx, cy)] !== WALK_BLOCKED) list.push({ x: cx, y: cy }); };
  for (let dx = 0; dx < w; dx++) push(front, x + dx, y + h);
  for (let dy = 0; dy < h; dy++) push(front, x + w, y + dy);
  for (let dx = 0; dx < w; dx++) push(back, x + dx, y - 1);
  for (let dy = 0; dy < h; dy++) push(back, x - 1, y + dy);
  return [...front, ...back];
}

/** そのマスを歩けるか */
export const isWalkable = (world, x, y) => inGrid(x, y) && world.cost[index(x, y)] !== WALK_BLOCKED;

/**
 * いちばん近い 歩けるマス（足もとが ふさがれたとき、地図が変わったとき）。無ければ null。
 * @param {number} [maxRadius] これより遠くは さがさない（マス）
 */
export function nearestWalkable(world, x, y, maxRadius = 8) {
  const sx = Math.round(x); const sy = Math.round(y);
  if (isWalkable(world, sx, sy)) return { x: sx, y: sy };
  for (let r = 1; r <= maxRadius; r++) {
    let best = null; let bestD = Infinity;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!isWalkable(world, sx + dx, sy + dy)) continue;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = { x: sx + dx, y: sy + dy }; }
      }
    }
    if (best) return best;
  }
  return null;
}

/**
 * 道のり（A*。たて・よこの 4 方向）。from から to までの マスの列（from は ふくまない）。
 * 行けなければ null。道を好むので、道が あれば 少し遠回りでも道を通る。
 * @param {number} [maxNodes] これより多く調べたら あきらめる（重い町で 1 回の計算を短く保つ）
 */
export function findPath(world, from, to, maxNodes = 2500) {
  if (!isWalkable(world, from.x, from.y) || !isWalkable(world, to.x, to.y)) return null;
  if (from.x === to.x && from.y === to.y) return [];
  const start = index(from.x, from.y);
  const goal = index(to.x, to.y);
  const g = new Float64Array(GRID_SIZE * GRID_SIZE).fill(Infinity);
  const came = new Int32Array(GRID_SIZE * GRID_SIZE).fill(-1);
  const closed = new Uint8Array(GRID_SIZE * GRID_SIZE);
  const heap = new MinHeap();
  const h = (i) => Math.abs((i % GRID_SIZE) - to.x) + Math.abs(Math.floor(i / GRID_SIZE) - to.y);
  g[start] = 0;
  heap.push(start, h(start));
  let visited = 0;
  while (heap.size) {
    const cur = heap.pop();
    if (cur === goal) break;
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (++visited > maxNodes) return null;
    const cx = cur % GRID_SIZE; const cy = (cur - cx) / GRID_SIZE;
    for (const [dx, dy] of DIRS) {
      const nx = cx + dx; const ny = cy + dy;
      if (!inGrid(nx, ny)) continue;
      const ni = index(nx, ny);
      const step = world.cost[ni];
      if (step === WALK_BLOCKED || closed[ni]) continue;
      const ng = g[cur] + step;
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; heap.push(ni, ng + h(ni)); }
    }
  }
  if (came[goal] === -1) return null;
  const path = [];
  for (let i = goal; i !== start; i = came[i]) path.push({ x: i % GRID_SIZE, y: Math.floor(i / GRID_SIZE) });
  return path.reverse();
}

/** A* 用の小さな ヒープ（値が小さい順に出す） */
class MinHeap {
  constructor() { this.keys = []; this.vals = []; }
  get size() { return this.keys.length; }
  push(key, val) {
    const { keys, vals } = this;
    let i = keys.length; keys.push(key); vals.push(val);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (vals[p] <= val) break;
      keys[i] = keys[p]; vals[i] = vals[p]; i = p;
    }
    keys[i] = key; vals[i] = val;
  }
  pop() {
    const { keys, vals } = this;
    const top = keys[0];
    const lastK = keys.pop(); const lastV = vals.pop();
    if (keys.length) {
      let i = 0;
      for (;;) {
        const l = 2 * i + 1; const r = l + 1;
        let m = i; let mv = lastV;
        if (l < keys.length && vals[l] < mv) { m = l; mv = vals[l]; }
        if (r < keys.length && vals[r] < mv) { m = r; mv = vals[r]; }
        if (m === i) break;
        keys[i] = keys[m]; vals[i] = vals[m]; i = m;
      }
      keys[i] = lastK; vals[i] = lastV;
    }
    return top;
  }
}
