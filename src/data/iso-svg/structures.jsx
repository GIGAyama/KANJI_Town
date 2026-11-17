import React from 'react';
import { GROUND_ICON_VIEWBOX, paintGroundIcon } from '../../systems/town-ground-paint.js';
import { HOUSE_PALETTES } from './house-art.js';

// 平らなアイテムの見本（道・水路・芝生など）と、「小さな家」。
// お店・学校などの建物の絵は buildings-art.js、橋や井戸などの小さなものは props-art.js にある。

// ==========================================
// 4. Structures Assets
// ==========================================
// 平らなアイテム（道・水路・芝生など）は、町では地面のレイヤー（systems/town-ground-paint.js）が
// となりとつなげて描く。ここの絵は、もちもの欄・クラフト・ガチャに出す見本で、町と同じ絵を
// 土の厚みつきの 1 マスとして出す。
const groundIcons = new Map();
const GroundIcon = ({ kind }) => {
  let markup = groundIcons.get(kind);
  if (markup === undefined) {
    markup = paintGroundIcon(kind);
    groundIcons.set(kind, markup);
  }
  return (
    <svg viewBox={GROUND_ICON_VIEWBOX} className="w-full h-full">
      <g dangerouslySetInnerHTML={{ __html: markup }} />
    </svg>
  );
};
export const SvgRoad = () => <GroundIcon kind="road" />;
export const SvgWater = () => <GroundIcon kind="water" />;
export const SvgGrassFlat = () => <GroundIcon kind="lawn" />;
export const SvgBrick = () => <GroundIcon kind="brick" />;
export const SvgAsphalt = () => <GroundIcon kind="asphalt" />;
export const SvgMagma = () => <GroundIcon kind="magma" />;
export const SvgCrosswalk = () => <GroundIcon kind="crosswalk" />;
export const SvgRailway = () => <GroundIcon kind="rail" />;
export const SvgDirt = () => <GroundIcon kind="dirt" />;
export const SvgPond = () => <GroundIcon kind="pond" />;
export const SvgPaddy = () => <GroundIcon kind="paddy" />;
export const SvgField = () => <GroundIcon kind="field" />;
export const SvgStonePath = () => <GroundIcon kind="stone" />;
export const SvgBeach = () => <GroundIcon kind="sand" />;

// 「小さな家」の絵のおおもとは house-art.js にあり、文書に 1 回だけ置いてある（shared.jsx）。
// 町にいちばん多く建つので、置いたマスでは <use> で呼びだす（1 軒 2 要素）。色は seed で決まる。
export const SvgHouse1 = ({ seed = 0 }) => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: 'visible' }}>
    <use href={`#house1-${(Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : 0) % HOUSE_PALETTES.length}`} />
  </svg>
);
