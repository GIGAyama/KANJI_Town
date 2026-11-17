import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useReducedMotionConfig } from 'framer-motion';
import { subscribeTownAnimation } from '../../systems/town-animation';
import { toIsoX, toIsoY } from '../../systems/town-map-view';
import { buildWalkWorld, isCovered } from '../../systems/town-walk';
import { createWalker, reconcileWalker, stepWalker, walkerCell } from '../../systems/villager-walk';
import { TOWN_ITEM_MAP } from '../../data/town-items';
import { VILLAGER_BOX, villagerKind, villagerSpriteSvg, villagerTagPath, villagerTagTextY, villagerTop, villagerVariantOf } from '../../data/villager-art';

// 町を歩く住民（ぜんいん）を、町の上に重ねた 1 枚の canvas に描く。
// ふるまいは systems/villager-walk.js、歩ける所は systems/town-walk.js。
//
// ⚠️ 住民を 町の要素（div・svg）で描かないこと。
//    町には建物が数百あり、町の中の要素が 1 つでも かわると、ブラウザは「どの絵を どの層に描くか」の
//    計算を 町ぜんたいで やりなおす（建物 600 の町で 1 回 45〜70ms。CPU 4 倍おそく）。
//    住民を要素で描くと、1 歩ごと・ふきだしごと・向きをかえるごとに これが走り（6 秒で 50 回）、
//    住民を合成レイヤーにすれば、こんどは その上に重なる建物まで 1 つずつ別の層に分かれて
//    町を ずらすのが 3〜4 倍 重くなった（前の作り）。
//    canvas の中を描きかえても、この計算は 1 回も走らない（6 秒で 0 回。試して たしかめた）。
// ⚠️ canvas は 建物より上にある。建物の うしろに いる住民は、絵を うすくして「うしろ」に見せる
//    （town-walk.js の cover）。夜の色は この上に かぶさるので、住民も夜の色になる。

const B = VILLAGER_BOX;
const INK = '#2b211c';
/** 建物の うしろに いるときの こさ */
const COVERED_ALPHA = 0.38;
/** 画面の外 この px（拡大率 1）までは 描く */
const CULL_MARGIN = 60;
/** canvas の きめ（端末の画素の倍率。3 倍の画面でも 2 倍まで） */
const MAX_DPR = 2;

// 歩くときの ゆれ（約 0.63 秒で 2 歩。左右に 4 度 かたむき、2.5px はねる）と、喜んで はねる動き（1 秒に 1 回 5px）
const WADDLE_MS = 628;
const HOP_MS = 1000;

// ── ふきだし（名札の上。絵は 12px の四角の中） ──
const BUBBLE_R = 9;
const EMOTION_ICON = {
  heart: { d: 'M6 10.4C2.6 7.9 1.1 6.2 1.1 4.3c0-1.5 1.1-2.5 2.4-2.5 1 0 1.9.5 2.5 1.5.6-1 1.5-1.5 2.5-1.5 1.3 0 2.4 1 2.4 2.5 0 1.9-1.5 3.6-4.9 6.1z', fill: '#f0483e', stroke: INK, width: 0.9 },
  note: { d: 'M4.7 8.9a1.7 1.4 0 1 1-1-1.3V2.7l5.4-1.3v6.2a1.7 1.4 0 1 1-1-1.3V3.4L4.7 4.2z', fill: '#3f86d8', stroke: INK, width: 0.8 },
  exclamation: { d: 'M6 1.9v4.9M6 9.7v.2', stroke: '#ee7b22', width: 2.2 },
  sleep: { d: 'M2.2 5.6h3.6L2.2 10h3.6M7 1.8h2.8L7 5h2.8', stroke: '#5f73c9', width: 1.3 },
};
/** 出てから この秒数で、0.3 → 1.12 → 1 倍に ふくらむ */
const POP_SECONDS = 0.18;

// ── 絵（職業 × 色ちがい）。はじめて使うときに 1 回だけ 画像にする ──
const sprites = new Map();
function spriteOf(kind, variant, onLoad) {
  const key = `${kind}-${variant}`;
  let entry = sprites.get(key);
  if (!entry) {
    const img = new Image();
    entry = { img, ready: false, waiting: new Set() };
    img.onload = () => { entry.ready = true; for (const fn of entry.waiting) fn(); entry.waiting.clear(); };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(villagerSpriteSvg(kind, variant))}`;
    sprites.set(key, entry);
  }
  if (!entry.ready && onLoad) entry.waiting.add(onLoad);
  return entry;
}
const paths = new Map();
const path2d = (d) => { let p = paths.get(d); if (!p) { p = new Path2D(d); paths.set(d, p); } return p; };

/** 体の動き（足もとを中心に）。歩く: 左右に ゆれて はねる、建物の前で ♥: ぴょんと はねる */
function bodyMotion(w, time) {
  if (w.mode === 'walk') {
    const t = ((time / WADDLE_MS) + w.phase) % 1;
    return { rotate: Math.sin(t * Math.PI * 2) * -4 * (Math.PI / 180), lift: Math.abs(Math.sin(t * Math.PI * 2)) * 2.5 };
  }
  if (w.mode === 'visit' && w.emotion === 'heart') {
    const t = ((time / HOP_MS) + w.phase) % 1;
    return { rotate: 0, lift: t < 0.3 ? Math.sin((t / 0.3) * Math.PI) * 5 : 0 };
  }
  return { rotate: 0, lift: 0 };
}

/** 住民 1 人を描く（ctx は 町の座標。原点は 足もと） */
function drawVillager(ctx, v, w, look, time) {
  const kind = villagerKind(v.occupation);
  const sprite = spriteOf(kind, villagerVariantOf(v.id), look.requestDraw);
  const top = villagerTop(kind);
  const { rotate, lift } = bodyMotion(w, time);
  ctx.save();
  ctx.globalAlpha = look.alpha;
  ctx.translate(toIsoX(w.x, w.y) + w.offsetX, toIsoY(w.x, w.y) + w.offsetY);
  if (rotate) ctx.rotate(rotate);
  if (lift) ctx.translate(0, -lift);
  // 体（右を向くときだけ 左右を うら返す。名札は うら返さない）
  if (sprite.ready) {
    ctx.save();
    if (w.facesRight) ctx.scale(-1, 1);
    ctx.drawImage(sprite.img, B.x, B.y, B.width, B.height);
    ctx.restore();
  }
  // 名札
  ctx.fillStyle = '#fffdf5';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.lineJoin = 'round';
  const tag = path2d(villagerTagPath(top));
  ctx.fill(tag);
  ctx.stroke(tag);
  ctx.fillStyle = INK;
  ctx.font = `900 10.5px ${look.font}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(v.kanjiChar || '', 0, villagerTagTextY(top));
  // ふきだし
  if (w.emotion && EMOTION_ICON[w.emotion]) {
    const age = look.emotionAge;
    const scale = age >= POP_SECONDS ? 1 : age < POP_SECONDS / 2 ? 0.3 + (age / (POP_SECONDS / 2)) * 0.82 : 1.12 - ((age - POP_SECONDS / 2) / (POP_SECONDS / 2)) * 0.12;
    const cy = -(top + 18.6 + BUBBLE_R);
    ctx.translate(0, cy + BUBBLE_R);
    ctx.scale(scale, scale);
    ctx.translate(0, -BUBBLE_R);
    ctx.beginPath();
    ctx.arc(0, 0, BUBBLE_R - 0.75, 0, Math.PI * 2);
    ctx.fillStyle = '#fffdf5';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = INK;
    ctx.stroke();
    const icon = EMOTION_ICON[w.emotion];
    ctx.translate(-6, -6);
    ctx.lineCap = 'round';
    const p = path2d(icon.d);
    if (icon.fill) { ctx.fillStyle = icon.fill; ctx.fill(p); }
    ctx.lineWidth = icon.width;
    ctx.strokeStyle = icon.stroke;
    ctx.stroke(p);
  }
  ctx.restore();
}

/**
 * 町の住民ぜんいん（町の枠いっぱいの canvas）。
 * @param {{ villagers: object[], mapData: Object<string,string>, exploredRadius: number,
 *           view: { x: number, y: number, zoom: number }, width: number, height: number }} props
 *   view・width・height は 町マップと同じ（町のレイヤーは 枠の横のまん中を原点に、translate(view) → scale(zoom)）
 */
const VillagerCanvas = memo(({ villagers, mapData, exploredRadius, view, width, height }) => {
  const reduceMotion = useReducedMotionConfig();
  const canvasRef = useRef(null);
  const world = useMemo(() => buildWalkWorld(mapData, TOWN_ITEM_MAP, exploredRadius), [mapData, exploredRadius]);
  const walkers = useRef(new Map());
  // 描くときの見た目（建物の うしろの こさ・ふきだしが出てからの秒数）。住民ごと
  const looks = useRef(new Map());
  const state = useRef({ view, width, height, time: 0 });
  state.current.view = view;
  state.current.width = width;
  state.current.height = height;

  // 住民の顔ぶれ・地図が かわったら、ふるまいの入れものを 合わせる（同じ住民は 歩いている所から つづける）
  const ordered = useMemo(() => {
    const map = walkers.current;
    const ids = new Set(villagers.map((v) => v.id));
    for (const id of [...map.keys()]) if (!ids.has(id)) { map.delete(id); looks.current.delete(id); }
    for (const v of villagers) {
      const w = map.get(v.id);
      if (w) reconcileWalker(w, world);
      else map.set(v.id, createWalker(v, world));
    }
    return villagers.map((v) => [v, map.get(v.id)]);
  }, [villagers, world]);

  const draw = useRef(() => {});
  draw.current = (dt = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { view: vw, width: cw, height: ch } = state.current;
    const dpr = Math.min(MAX_DPR, globalThis.devicePixelRatio || 1);
    const pw = Math.max(1, Math.round(cw * dpr));
    const ph = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    if (!ordered.length) return;
    const z = vw.zoom > 0 ? vw.zoom : 1;
    const ox = cw / 2 + vw.x;
    const oy = vw.y;
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * ox, dpr * oy);
    const font = getComputedStyle(canvas).fontFamily || 'sans-serif';
    // 奥（x + y が小さい）から手前へ
    const list = ordered.filter(([, w]) => !w.stranded).sort((a, b) => (a[1].x + a[1].y) - (b[1].x + b[1].y));
    const minX = -ox / z - CULL_MARGIN; const maxX = (cw - ox) / z + CULL_MARGIN;
    const minY = -oy / z - CULL_MARGIN; const maxY = (ch - oy) / z + CULL_MARGIN * 2;
    for (const [v, w] of list) {
      const sx = toIsoX(w.x, w.y); const sy = toIsoY(w.x, w.y);
      let look = looks.current.get(w.id);
      if (!look) { look = { alpha: 1, emotion: null, emotionAge: 0, requestDraw: () => draw.current() }; looks.current.set(w.id, look); }
      const cell = walkerCell(w);
      const target = isCovered(world, cell.x, cell.y) ? COVERED_ALPHA : 1;
      look.alpha += (target - look.alpha) * Math.min(1, dt * 8 || 1);
      if (look.emotion !== w.emotion) { look.emotion = w.emotion; look.emotionAge = 0; } else look.emotionAge += dt;
      look.font = font;
      if (sx < minX || sx > maxX || sy < minY || sy > maxY) continue;
      drawVillager(ctx, v, w, look, state.current.time);
    }
  };

  // 刻みごとに ふるまいを進めて 描きなおす（canvas の中だけ。町の要素には さわらない）
  useEffect(() => {
    if (reduceMotion || !ordered.length) return undefined;
    const all = ordered.map(([, w]) => w);
    return subscribeTownAnimation((time, dt) => {
      for (const w of all) stepWalker(w, dt, world, all);
      state.current.time = time;
      draw.current(dt);
    });
  }, [ordered, world, reduceMotion]);

  // 町を ずらした・拡大した・枠の大きさが かわった・住民が かわったときは、すぐ描きなおす（町と ずれないように）
  useLayoutEffect(() => { draw.current(); }, [view, width, height, ordered]);

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 10 }} />
  );
});

export default VillagerCanvas;
