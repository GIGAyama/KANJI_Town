import React from 'react';
import { NATURE_VARIANTS } from './nature-art.js';

// 自然（くさ・花・木・岩など）
//
// 絵のおおもとは nature-art.js にあり、文書に 1 回だけ置いてある（shared.jsx の mountSharedDefs）。
// ここの部品は、それを <use> で呼びだすだけ。町に何十本も置かれるので、1 本を 2 要素ですませる。

// ==========================================
// 3. Nature Assets
// ==========================================

/**
 * 置いた場所（seed）から、どの絵にするかを決める。weights は絵ごとの出やすさ
 * （例: [3, 3, 2, 1, 1] なら、実のなる木は 10 本に 2 本）。
 */
const pickVariant = (kind, seed, weights) => {
  const count = NATURE_VARIANTS[kind];
  const value = Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0;
  if (!weights) return value % count;
  const total = weights.reduce((sum, w) => sum + w, 0);
  let rest = value % total;
  for (let i = 0; i < weights.length; i++) {
    if (rest < weights[i]) return i;
    rest -= weights[i];
  }
  return 0;
};

const Nature = ({ kind, seed, weights }) => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: 'visible' }}>
    <use href={`#nat-${kind}-${pickVariant(kind, seed, weights)}`} />
  </svg>
);

export const SvgWeed = () => <Nature kind="weed" />;
export const SvgGrass = ({ seed }) => <Nature kind="grass" seed={seed} />;
export const SvgFlower = ({ seed }) => <Nature kind="flower" seed={seed} />;
export const SvgTree = ({ seed }) => <Nature kind="tree" seed={seed} weights={[3, 3, 2, 1, 1]} />;
export const SvgSakura = ({ seed }) => <Nature kind="sakura" seed={seed} weights={[3, 2, 2]} />;
export const SvgPine = ({ seed }) => <Nature kind="pine" seed={seed} />;
export const SvgRock = ({ seed }) => <Nature kind="rock" seed={seed} />;
export const SvgBambooGrove = () => <Nature kind="bamboo" />;
export const SvgCherryRoad = ({ seed }) => <Nature kind="cherryroad" seed={seed} />;

// 2026-11 に足した自然物と かざり
export const SvgMaple = ({ seed }) => <Nature kind="maple" seed={seed} />;
export const SvgGinkgo = () => <Nature kind="ginkgo" />;
export const SvgPalm = () => <Nature kind="palm" />;
export const SvgSunflower = () => <Nature kind="sunflower" />;
export const SvgBush = ({ seed }) => <Nature kind="bush" seed={seed} weights={[3, 1]} />;
export const SvgScarecrow = () => <Nature kind="scarecrow" />;
export const SvgKoinobori = () => <Nature kind="koinobori" />;
export const SvgSignal = () => <Nature kind="signal" />;
