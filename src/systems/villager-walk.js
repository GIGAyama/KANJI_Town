// 住民 1 人の ふるまい（どこへ行き、どう歩き、何をするか） — マイ漢字タウン
// React に依存しない純粋な関数だけを置く（components/town/VillagerCanvas.jsx が使い、test/ から確かめる）。
//
// 住民は 地図の「歩ける所」（town-walk.js）だけを通る。することは 4 つ:
//   idle  … 立ち止まって あたりを見る。しばらくすると 次のことを決める
//   walk  … 道のりに そって 1 マスずつ歩く（道を好む）
//   visit … 建物・木・かざりの前で 立ち止まり、ふきだしを出す（建物は ♥、木や かざりは ♪）
//   chat  … となりの住民と 向かいあって、ふきだしを出す
// 位置は マスの まん中が (x + 0.5, y + 0.5) になる 連続の座標で持つ。

import { findPath, isWalkable, nearestWalkable, WALK_ROAD } from './town-walk.js';
import { GRID_SIZE } from './town-map-view.js';

/** 1 秒に歩くマス数の めやす（住民ごとに ±2 割） */
export const WALK_SPEED = 1.0;
/** 立ち寄り先を さがす広さ（マス。たて・よこの合計） */
const VISIT_RADIUS = 10;
/** ぶらぶら歩く広さ（マス） */
const STROLL_RADIUS = 5;

/** id から決まる 0〜2^32 の数（同じ住民は いつも同じ歩き方・同じ ずれ） */
function hashId(id) {
  let h = 0x811c9dc5;
  const text = String(id ?? '');
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return (h ^ (h >>> 13)) >>> 0;
}

const between = (rand, a, b) => a + rand() * (b - a);

/**
 * 住民 1 人の ふるまいの 入れもの を作る。足もとが歩けない所なら、いちばん近い歩けるマスへ移す。
 * 近くに 歩ける所が無ければ stranded（その場に立たせず、かくす）。
 * @param {{ id: string, x: number, y: number }} villager 保存してある住民（x・y は住みはじめた マス）
 * @param {ReturnType<import('./town-walk.js').buildWalkWorld>} world
 * @param {() => number} [rand]
 */
export function createWalker(villager, world, rand = Math.random) {
  const seed = hashId(villager.id);
  const start = nearestWalkable(world, villager.x, villager.y);
  return {
    id: villager.id,
    x: (start ? start.x : Math.round(villager.x)) + 0.5,
    y: (start ? start.y : Math.round(villager.y)) + 0.5,
    stranded: !start,
    mode: 'idle',
    timer: between(rand, 0.3, 2.5),
    path: [],
    target: null,
    facesRight: (seed & 1) === 1,
    speed: WALK_SPEED * (0.8 + ((seed >>> 1) % 5) * 0.1),
    emotion: null,
    emotionTimer: 0,
    // 同じマスに 2 人いても ぴったり重ならないように、絵を少しずらす（px。町の拡大率 1 のとき）
    offsetX: ((seed >>> 4) % 9) - 4,
    offsetY: ((seed >>> 8) % 5) - 2,
    // 歩くときの ゆれの 出だし（住民どうしで そろわないように）
    phase: ((seed >>> 12) % 1000) / 1000,
  };
}

/** いまいるマス */
export const walkerCell = (w) => ({ x: Math.floor(w.x), y: Math.floor(w.y) });

const setEmotion = (w, emotion, seconds) => { w.emotion = emotion; w.emotionTimer = seconds; };

/** 画面の上で 右へ向かうか（マスの x が ふえると右下、y が ふえると左下へ動く） */
const facesToward = (w, tx, ty) => {
  const screenDx = (tx - w.x) - (ty - w.y);
  return Math.abs(screenDx) > 0.01 ? screenDx > 0 : w.facesRight;
};

/** 立ち寄り先を 1 つえらび、道のりを決める。行けなければ false */
function planVisit(w, world, rand) {
  const here = walkerCell(w);
  const near = world.visits.filter((v) => v.doors.some((d) => Math.abs(d.x - here.x) + Math.abs(d.y - here.y) <= VISIT_RADIUS));
  for (let tries = 0; tries < 3 && near.length; tries++) {
    const visit = near.splice(Math.floor(rand() * near.length), 1)[0];
    // 正面の戸口を先に ためす（doors は 正面が先、その中は 手前の列が先）
    for (const door of visit.doors.slice(0, 3)) {
      if (door.x === here.x && door.y === here.y) continue;
      const path = findPath(world, here, door);
      if (path && path.length) {
        w.path = path; w.target = { kind: 'visit', visit, door };
        return true;
      }
    }
  }
  return false;
}

/** 近くの歩けるマスへ ぶらぶら歩く（道のマスを えらびやすい）。行けなければ false */
function planStroll(w, world, rand) {
  const here = walkerCell(w);
  let best = null; let bestScore = -Infinity;
  for (let i = 0; i < 10; i++) {
    const x = here.x + Math.round(between(rand, -STROLL_RADIUS, STROLL_RADIUS));
    const y = here.y + Math.round(between(rand, -STROLL_RADIUS, STROLL_RADIUS));
    if ((x === here.x && y === here.y) || !isWalkable(world, x, y)) continue;
    const score = rand() + (world.cost[y * GRID_SIZE + x] === WALK_ROAD ? 0.6 : 0);
    if (score > bestScore) { bestScore = score; best = { x, y }; }
  }
  if (!best) return false;
  const path = findPath(world, here, best, 600);
  if (!path || !path.length) return false;
  w.path = path; w.target = { kind: 'stroll' };
  return true;
}

/** となりで 立ち止まっている住民と 話す。相手がいなければ false */
function planChat(w, walkers) {
  for (const other of walkers) {
    if (other === w || other.stranded || other.mode !== 'idle') continue;
    if (Math.abs(other.x - w.x) + Math.abs(other.y - w.y) > 2.1) continue;
    for (const [a, b] of [[w, other], [other, w]]) {
      a.mode = 'chat'; a.timer = 2.5; a.path = []; a.target = null;
      a.facesRight = facesToward(a, b.x, b.y);
    }
    setEmotion(w, 'note', 2.5);
    setEmotion(other, 'heart', 2.5);
    return true;
  }
  return false;
}

/** 立ち止まっているときに、次のことを決める */
function decide(w, world, walkers, rand) {
  const r = rand();
  if (r < 0.5 && planVisit(w, world, rand)) {
    w.mode = 'walk';
    if (rand() < 0.3) setEmotion(w, 'exclamation', 1.2); // 「あ、行ってみよう」
    return;
  }
  if (r < 0.62 && planChat(w, walkers)) return;
  if (r < 0.92 && planStroll(w, world, rand)) { w.mode = 'walk'; return; }
  // あたりを見まわす
  w.facesRight = !w.facesRight;
  w.timer = between(rand, 1, 2.5);
}

/**
 * 住民 1 人を dt 秒すすめる。
 * @param {ReturnType<typeof createWalker>} w
 * @param {number} dt 秒
 * @param {ReturnType<import('./town-walk.js').buildWalkWorld>} world
 * @param {Array<ReturnType<typeof createWalker>>} walkers 町の住民ぜんぶ（話す相手をさがす）
 * @param {() => number} [rand]
 */
export function stepWalker(w, dt, world, walkers = [], rand = Math.random) {
  if (w.stranded) return;
  if (w.emotion) {
    w.emotionTimer -= dt;
    if (w.emotionTimer <= 0) { w.emotion = null; w.emotionTimer = 0; }
  }
  if (w.mode === 'walk') {
    let budget = w.speed * dt;
    while (budget > 0 && w.path.length) {
      const next = w.path[0];
      if (!isWalkable(world, next.x, next.y)) { // 歩いているあいだに 地図が変わった
        w.path = []; w.target = null; w.mode = 'idle'; w.timer = 0.5;
        return;
      }
      const tx = next.x + 0.5; const ty = next.y + 0.5;
      w.facesRight = facesToward(w, tx, ty);
      const dist = Math.hypot(tx - w.x, ty - w.y);
      if (dist <= budget) {
        w.x = tx; w.y = ty; budget -= dist; w.path.shift();
      } else {
        w.x += ((tx - w.x) / dist) * budget; w.y += ((ty - w.y) / dist) * budget; budget = 0;
      }
    }
    if (!w.path.length && budget > 0) arrive(w, rand);
    return;
  }
  w.timer -= dt;
  if (w.timer > 0) return;
  if (w.mode === 'idle') decide(w, world, walkers, rand);
  else { w.mode = 'idle'; w.timer = between(rand, 1.5, 3.5); } // visit・chat の おわり
}

/** 道のりの おわりに着いた */
function arrive(w, rand) {
  const t = w.target;
  w.target = null;
  if (t && t.kind === 'visit') {
    const { visit } = t;
    w.mode = 'visit';
    w.timer = between(rand, 2.5, 4.5);
    // 建物のほうを向く
    w.facesRight = facesToward(w, visit.x + visit.w / 2, visit.y + visit.h / 2);
    setEmotion(w, visit.type === 'nature' || visit.type === 'decoration' ? 'note' : 'heart', w.timer);
    return;
  }
  w.mode = 'idle';
  w.timer = between(rand, 1, 3.5);
}

/**
 * 地図が変わったとき（建物を置いた・道を消した など）に、住民を 新しい地図に合わせる。
 * 足もとが ふさがれたら いちばん近い歩けるマスへ移し、通れなくなった道のりは やめる。
 */
export function reconcileWalker(w, world) {
  const here = walkerCell(w);
  if (w.stranded || !isWalkable(world, here.x, here.y)) {
    const spot = nearestWalkable(world, here.x, here.y);
    w.stranded = !spot;
    if (spot) { w.x = spot.x + 0.5; w.y = spot.y + 0.5; }
    w.path = []; w.target = null;
    if (w.mode === 'walk') { w.mode = 'idle'; w.timer = 0.5; }
    return;
  }
  if (w.path.some((c) => !isWalkable(world, c.x, c.y))) {
    w.path = []; w.target = null;
    // いま歩いている マスの まん中へは もどってから 止まる
    w.x = here.x + 0.5; w.y = here.y + 0.5;
    if (w.mode === 'walk') { w.mode = 'idle'; w.timer = 0.5; }
  }
}
