import React from 'react';
import { isoPt, iso3 } from './shared.jsx';
import { GROUND_ICON_VIEWBOX, paintGroundIcon } from '../../systems/town-ground-paint.js';
import { HOUSE_PALETTES } from './house-art.js';

// 平らなアイテムの見本（道・水路・芝生など）と、「小さな家」・橋。
// お店・学校などの建物の絵は buildings-art.js（部品は kit.js）にある。

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

export const SvgBridge = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      {/* 水面は描かない。橋の下の水は、地面のレイヤー（town-ground-paint.js）が となりの水路とつなげて描く */}
      {/* 橋（南西→北東方向のアーチ橋を横から見た立体） */}
      <g>
        {/* アーチの側面（手前・左面） */}
        <path d={`M ${iso3(30, 96, 2)} C ${iso3(30, 74, 14)} ${iso3(30, 26, 14)} ${iso3(30, 4, 2)}
                 L ${iso3(30, 12, 2)} C ${iso3(30, 30, 10)} ${iso3(30, 70, 10)} ${iso3(30, 88, 2)} Z`}
          fill="#a8a29e" stroke="#2b211c" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 桁下のアーチ開口（影） */}
        <path d={`M ${iso3(30, 70, 0)} C ${iso3(30, 62, 7)} ${iso3(30, 38, 7)} ${iso3(30, 30, 0)} Z`} fill="#1e293b" fillOpacity="0.55" />
        {/* 路面（上面） */}
        <path d={`M ${iso3(30, 96, 2)} C ${iso3(30, 74, 14)} ${iso3(30, 26, 14)} ${iso3(30, 4, 2)}
                 L ${iso3(58, 4, 2)} C ${iso3(58, 26, 14)} ${iso3(58, 74, 14)} ${iso3(58, 96, 2)} Z`}
          fill="#e7e5e4" stroke="#2b211c" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 石畳のライン */}
        {[20, 36, 50, 64, 80].map(y => {
          const zz = 2 + 10.5 * Math.sin(Math.PI * (y - 4) / 92);
          return <line key={y} x1={isoPt(31, y, zz)[0]} y1={isoPt(31, y, zz)[1]} x2={isoPt(57, y, zz)[0]} y2={isoPt(57, y, zz)[1]} stroke="#a8a29e" strokeWidth="0.7" strokeOpacity="0.9" />;
        })}
        {/* 欄干（手前側） */}
        {[8, 24, 40, 56, 72, 88].map(y => {
          const zz = 2 + 10.5 * Math.sin(Math.PI * (y - 4) / 92);
          return (
            <line key={y} x1={isoPt(30.5, y, zz)[0]} y1={isoPt(30.5, y, zz)[1]} x2={isoPt(30.5, y, zz + 6)[0]} y2={isoPt(30.5, y, zz + 6)[1]} stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          );
        })}
        <path d={`M ${iso3(30.5, 92, 9)} C ${iso3(30.5, 72, 20)} ${iso3(30.5, 28, 20)} ${iso3(30.5, 8, 9)}`} fill="none" stroke="#92400e" strokeWidth="2.2" strokeLinecap="round" />
        {/* 欄干（奥側） */}
        {[8, 24, 40, 56, 72, 88].map(y => {
          const zz = 2 + 10.5 * Math.sin(Math.PI * (y - 4) / 92);
          return (
            <line key={`b-${y}`} x1={isoPt(57.5, y, zz)[0]} y1={isoPt(57.5, y, zz)[1]} x2={isoPt(57.5, y, zz + 5)[0]} y2={isoPt(57.5, y, zz + 5)[1]} stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
          );
        })}
        <path d={`M ${iso3(57.5, 92, 8)} C ${iso3(57.5, 72, 19)} ${iso3(57.5, 28, 19)} ${iso3(57.5, 8, 8)}`} fill="none" stroke="#92400e" strokeWidth="1.8" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);
