import React from 'react';
import { isoPt, iso3, FaceSW, FaceSE } from './shared.jsx';
import { GROUND_ICON_VIEWBOX, paintGroundIcon } from '../../systems/town-ground-paint.js';
import { HOUSE_PALETTES } from './house-art.js';

// 平面・住宅（道・水路・家・お店・学校など）

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

export const SvgHouse2 = ({ seed = 0 }) => {
  const ptX = (i, j) => (i - 1.0) * 26 - (j - 0.5) * 26;
  const ptY = (i, j, k) => (i - 1.0) * 13 + (j - 0.5) * 13 - k * 22;
  const pt = (i, j, k) => `${ptX(i,j).toFixed(1)},${ptY(i,j,k).toFixed(1)}`;

  const p = HOUSE_PALETTES[seed % HOUSE_PALETTES.length];
  const wallSW = p.wallSW;
  const wallSE = p.wallSE;
  const wallBaseSW = p.baseSW;
  const wallBaseSE = p.baseSE;
  const roofSW = p.roofL;
  const roofSE = p.roofD;
  const roofNW = p.roofD;
  const roofNE = p.roofD;

  const FaceSW = ({ i1, i2, j, k1, k2, fill = wallSW, hasBase = true }) => (
    <g>
      {hasBase && <polygon points={`${pt(i1,j,k1)} ${pt(i2,j,k1)} ${pt(i2,j,k1+0.2)} ${pt(i1,j,k1+0.2)}`} fill={wallBaseSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />}
      <polygon points={`${pt(i1,j, k1 + (hasBase?0.2:0))} ${pt(i2,j, k1 + (hasBase?0.2:0))} ${pt(i2,j,k2)} ${pt(i1,j,k2)}`} fill={fill} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );

  const FaceSE = ({ i, j1, j2, k1, k2, fill = wallSE, hasBase = true }) => (
    <g>
      {hasBase && <polygon points={`${pt(i,j1,k1)} ${pt(i,j2,k1)} ${pt(i,j2,k1+0.2)} ${pt(i,j1,k1+0.2)}`} fill={wallBaseSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />}
      <polygon points={`${pt(i,j1,k1 + (hasBase?0.2:0))} ${pt(i,j2,k1 + (hasBase?0.2:0))} ${pt(i,j2,k2)} ${pt(i,j1,k2)}`} fill={fill} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );

  const WindowSW = ({ i, j, k }) => {
    const w = 0.12; const h = 0.35;
    return (
      <g>
        <polygon points={`${pt(i-w,j,k)} ${pt(i+w,j,k)} ${pt(i+w,j,k+h)} ${pt(i-w,j,k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points={`${pt(i-w*0.7,j,k+0.05)} ${pt(i+w*0.7,j,k+0.05)} ${pt(i+w*0.7,j,k+h-0.05)} ${pt(i-w*0.7,j,k+h-0.05)}`} fill="#38bdf8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
        <line x1={ptX(i,j)} y1={ptY(i,j,k+0.05)} x2={ptX(i,j)} y2={ptY(i,j,k+h-0.05)} stroke="#1e293b" strokeWidth="1"/>
        <line x1={ptX(i-w*0.7,j)} y1={ptY(i-w*0.7,j,k+h*0.5)} x2={ptX(i+w*0.7,j)} y2={ptY(i+w*0.7,j,k+h*0.5)} stroke="#1e293b" strokeWidth="1"/>
      </g>
    );
  };

  const WindowSE = ({ i, j, k }) => {
    const w = 0.12; const h = 0.35;
    return (
      <g>
        <polygon points={`${pt(i,j-w,k)} ${pt(i,j+w,k)} ${pt(i,j+w,k+h)} ${pt(i,j-w,k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points={`${pt(i,j-w*0.7,k+0.05)} ${pt(i,j+w*0.7,k+0.05)} ${pt(i,j+w*0.7,k+h-0.05)} ${pt(i,j-w*0.7,k+h-0.05)}`} fill="#38bdf8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
        <line x1={ptX(i,j)} y1={ptY(i,j,k+0.05)} x2={ptX(i,j)} y2={ptY(i,j,k+h-0.05)} stroke="#1e293b" strokeWidth="1"/>
        <line x1={ptX(i,j-w*0.7)} y1={ptY(i,j-w*0.7,k+h*0.5)} x2={ptX(i,j+w*0.7)} y2={ptY(i,j+w*0.7,k+h*0.5)} stroke="#1e293b" strokeWidth="1"/>
      </g>
    );
  };

  const RoofJ = ({ i1, i2, j1, j2, kBase, kPeak, drawGableSW = true }) => {
    const iMid = (i1 + i2) / 2;
    return (
      <g>
        {drawGableSW && <polygon points={`${pt(i1, j2, kBase)} ${pt(i2, j2, kBase)} ${pt(iMid, j2, kPeak)}`} fill={wallSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>}
        <polygon points={`${pt(iMid, j2, kPeak)} ${pt(i2, j2, kBase)} ${pt(i2, j1, kBase)} ${pt(iMid, j1, kPeak)}`} fill={roofSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
    );
  };

  const RoofI = ({ i1, i2, j1, j2, kBase, kPeak, drawGableSE = true }) => {
    const jMid = (j1 + j2) / 2;
    return (
      <g>
        {drawGableSE && <polygon points={`${pt(i2, j1, kBase)} ${pt(i2, j2, kBase)} ${pt(i2, jMid, kPeak)}`} fill={wallSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>}
        <polygon points={`${pt(i1, jMid, kPeak)} ${pt(i2, jMid, kPeak)} ${pt(i2, j2, kBase)} ${pt(i1, j2, kBase)}`} fill={roofSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
    );
  };

  const GarageDoor = ({ i, j, k }) => {
    const w = 0.25; const h = 0.55;
    return (
      <g>
         <polygon points={`${pt(i-w, j, k)} ${pt(i+w, j, k)} ${pt(i+w, j, k+h)} ${pt(i-w, j, k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
         <line x1={ptX(i-w,j)} y1={ptY(i-w,j,k+h*0.33)} x2={ptX(i+w,j)} y2={ptY(i+w,j,k+h*0.33)} stroke="#cbd5e1" strokeWidth="1"/>
         <line x1={ptX(i-w,j)} y1={ptY(i-w,j,k+h*0.66)} x2={ptX(i+w,j)} y2={ptY(i+w,j,k+h*0.66)} stroke="#cbd5e1" strokeWidth="1"/>
      </g>
    );
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <g transform="translate(50, 75) scale(2.5)">
        {/* Driveway & Path to use 2x1 ground space beautifully */}
        <polygon points={`${pt(0.2, 0.85, 0)} ${pt(0.7, 0.85, 0)} ${pt(0.7, 1.0, 0)} ${pt(0.2, 1.0, 0)}`} fill="#d1d5db" opacity="0.6" strokeLinejoin="round" />
        <polygon points={`${pt(1.4, 0.6, 0)} ${pt(1.8, 0.6, 0)} ${pt(1.8, 1.0, 0)} ${pt(1.4, 1.0, 0)}`} fill="#d1d5db" opacity="0.8" strokeLinejoin="round" />
        
        {/* Back Main House */}
        {/* Left Wall */}
        <FaceSE i={0.8} j1={0.1} j2={0.6} k1={0} k2={1.4} fill={wallSE} />
        {/* Right Wall */}
        <FaceSE i={1.9} j1={0.1} j2={0.6} k1={0} k2={1.4} fill={wallSE} />
        <WindowSE i={1.9} j={0.25} k={0.3} />
        <WindowSE i={1.9} j={0.45} k={0.3} />
        
        {/* Front Wall */}
        <FaceSW i1={0.8} i2={1.9} j={0.6} k1={0} k2={1.4} fill={wallSW} />
        
        {/* Main House Door & Windows 1F */}
        <polygon points={`${pt(1.5, 0.6, 0.2)} ${pt(1.7, 0.6, 0.2)} ${pt(1.7, 0.6, 0.75)} ${pt(1.5, 0.6, 0.75)}`} fill="#ea580c" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={ptX(1.53, 0.6)} cy={ptY(1.53, 0.6, 0.45)} r="0.6" fill="#fff" />
        <WindowSW i={1.05} j={0.6} k={0.25} />
        <WindowSW i={1.3} j={0.6} k={0.25} />

        {/* Main House Windows 2F */}
        <WindowSW i={1.05} j={0.6} k={0.9} />
        <WindowSW i={1.3} j={0.6} k={0.9} />
        <WindowSW i={1.6} j={0.6} k={0.9} />

        <RoofI i1={0.8} i2={1.9} j1={0.1} j2={0.6} kBase={1.4} kPeak={2.2} />

        {/* Front Garage Block */}
        <FaceSW i1={0.1} i2={0.8} j={0.85} k1={0} k2={1.0} />
        <FaceSE i={0.8} j1={0.3} j2={0.85} k1={0} k2={1.0} />
        
        <GarageDoor i={0.45} j={0.85} k={0.2} />
        <RoofJ i1={0.1} i2={0.8} j1={0.3} j2={0.85} kBase={1.0} kPeak={1.6} />

        {/* Small decorations */}
        <g>
          <ellipse cx={ptX(1.8, 0.75)} cy={ptY(1.8, 0.75, 0.05)} rx="4" ry="2" fill="#166534" />
          <ellipse cx={ptX(1.8, 0.75)} cy={ptY(1.8, 0.75, 0.15)} rx="3" ry="1.5" fill="#22c55e" />
        </g>
      </g>
    </svg>
  );
};

// SvgHouse3 helper components inside the file scope, or defined concisely within SvgHouse3
export const SvgHouse3 = ({ seed = 0 }) => {
  const ptX = (i, j) => (i - 1.5) * 24 - (j - 1) * 24;
  const ptY = (i, j, k) => (i - 1.5) * 12 + (j - 1) * 12 - k * 20;
  const pt = (i, j, k) => `${ptX(i,j).toFixed(1)},${ptY(i,j,k).toFixed(1)}`;

  const p = HOUSE_PALETTES[seed % HOUSE_PALETTES.length];
  const wallSW = p.wallSW;
  const wallSE = p.wallSE;
  const wallBaseSW = p.baseSW;
  const wallBaseSE = p.baseSE;
  const roofSW = p.roofL;
  const roofSE = p.roofD;
  const roofNW = p.roofD;
  const roofNE = p.roofD;

  // Wall helpers
  const FaceSW = ({ i1, i2, j, k1, k2, fill = wallSW, hasBase = true }) => (
    <g>
      {hasBase && <polygon points={`${pt(i1,j,k1)} ${pt(i2,j,k1)} ${pt(i2,j,k1+0.25)} ${pt(i1,j,k1+0.25)}`} fill={wallBaseSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />}
      <polygon points={`${pt(i1,j, k1 + (hasBase?0.25:0))} ${pt(i2,j, k1 + (hasBase?0.25:0))} ${pt(i2,j,k2)} ${pt(i1,j,k2)}`} fill={fill} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );

  const FaceSE = ({ i, j1, j2, k1, k2, fill = wallSE, hasBase = true }) => (
    <g>
      {hasBase && <polygon points={`${pt(i,j1,k1)} ${pt(i,j2,k1)} ${pt(i,j2,k1+0.25)} ${pt(i,j1,k1+0.25)}`} fill={wallBaseSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />}
      <polygon points={`${pt(i,j1,k1 + (hasBase?0.25:0))} ${pt(i,j2,k1 + (hasBase?0.25:0))} ${pt(i,j2,k2)} ${pt(i,j1,k2)}`} fill={fill} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );

  // Window helpers
  const WindowSW = ({ i, j, k }) => {
    const w = 0.1; const h = 0.35;
    return (
      <g>
        <polygon points={`${pt(i-w,j,k)} ${pt(i+w,j,k)} ${pt(i+w,j,k+h)} ${pt(i-w,j,k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points={`${pt(i-w*0.7,j,k+0.06)} ${pt(i+w*0.7,j,k+0.06)} ${pt(i+w*0.7,j,k+h-0.06)} ${pt(i-w*0.7,j,k+h-0.06)}`} fill="#bae6fd" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
        <line x1={ptX(i,j)} y1={ptY(i,j,k+0.06)} x2={ptX(i,j)} y2={ptY(i,j,k+h-0.06)} stroke="#1e293b" strokeWidth="1"/>
        <line x1={ptX(i-w*0.7,j)} y1={ptY(i-w*0.7,j,k+h*0.5)} x2={ptX(i+w*0.7,j)} y2={ptY(i+w*0.7,j,k+h*0.5)} stroke="#1e293b" strokeWidth="1"/>
      </g>
    );
  };

  const WindowSE = ({ i, j, k }) => {
    const w = 0.1; const h = 0.35;
    return (
      <g>
        <polygon points={`${pt(i,j-w,k)} ${pt(i,j+w,k)} ${pt(i,j+w,k+h)} ${pt(i,j-w,k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points={`${pt(i,j-w*0.7,k+0.06)} ${pt(i,j+w*0.7,k+0.06)} ${pt(i,j+w*0.7,k+h-0.06)} ${pt(i,j-w*0.7,k+h-0.06)}`} fill="#bae6fd" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
        <line x1={ptX(i,j)} y1={ptY(i,j,k+0.06)} x2={ptX(i,j)} y2={ptY(i,j,k+h-0.06)} stroke="#1e293b" strokeWidth="1"/>
        <line x1={ptX(i,j-w*0.7)} y1={ptY(i,j-w*0.7,k+h*0.5)} x2={ptX(i,j+w*0.7)} y2={ptY(i,j+w*0.7,k+h*0.5)} stroke="#1e293b" strokeWidth="1"/>
      </g>
    );
  };

  const GarageDoor = ({ i, j, k }) => {
    const w = 0.28; const h = 0.65;
    return (
      <g>
         <polygon points={`${pt(i-w, j, k)} ${pt(i+w, j, k)} ${pt(i+w, j, k+h)} ${pt(i-w, j, k+h)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
         <polygon points={`${pt(i-w*0.8, j, k)} ${pt(i+w*0.8, j, k)} ${pt(i+w*0.8, j, k+h-0.12)} ${pt(i-w*0.8, j, k+h-0.12)}`} fill="#b6b0a7" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round"/>
         <polygon points={`${pt(i-w*0.6, j, k+h-0.35)} ${pt(i-w*0.2, j, k+h-0.35)} ${pt(i-w*0.2, j, k+h-0.22)} ${pt(i-w*0.6, j, k+h-0.22)}`} fill="#bae6fd" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
         <polygon points={`${pt(i+w*0.2, j, k+h-0.35)} ${pt(i+w*0.6, j, k+h-0.35)} ${pt(i+w*0.6, j, k+h-0.22)} ${pt(i+w*0.2, j, k+h-0.22)}`} fill="#bae6fd" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"/>
      </g>
    );
  };

  const RoofJ = ({ i1, i2, j1, j2, kBase, kPeak, drawGableSW = true }) => {
    const iMid = (i1 + i2) / 2;
    return (
      <g>
        {drawGableSW && <polygon points={`${pt(i1, j2, kBase)} ${pt(i2, j2, kBase)} ${pt(iMid, j2, kPeak)}`} fill={wallSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>}
        <polygon points={`${pt(iMid, j2, kPeak)} ${pt(i2, j2, kBase)} ${pt(i2, j1, kBase)} ${pt(iMid, j1, kPeak)}`} fill={roofSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
    );
  };

  const RoofI = ({ i1, i2, j1, j2, kBase, kPeak, drawGableSE = true }) => {
    const jMid = (j1 + j2) / 2;
    return (
      <g>
        {drawGableSE && <polygon points={`${pt(i2, j1, kBase)} ${pt(i2, j2, kBase)} ${pt(i2, jMid, kPeak)}`} fill={wallSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>}
        <polygon points={`${pt(i1, jMid, kPeak)} ${pt(i2, jMid, kPeak)} ${pt(i2, j2, kBase)} ${pt(i1, j2, kBase)}`} fill={roofSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
    );
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <g transform="translate(50, 70) scale(2.5)">

        {/* 1. Back Right Wing */}
        <FaceSW i1={2.2} i2={3.0} j={1.2} k1={0} k2={1.0} />
        <FaceSE i={3.0} j1={0.4} j2={1.2} k1={0} k2={1.0} />
        <WindowSW i={2.5} j={1.2} k={0.3} />
        <WindowSW i={2.8} j={1.2} k={0.3} />
        <RoofI i1={2.2} i2={3.0} j1={0.4} j2={1.2} kBase={1.0} kPeak={1.6} />

        {/* 2. Main Block */}
        <FaceSE i={0.8} j1={0.4} j2={1.4} k1={0} k2={2.2} fill={wallSE} />
        <FaceSE i={2.2} j1={0.4} j2={1.4} k1={0} k2={2.2} fill={wallSE} />
        <FaceSW i1={0.8} i2={2.2} j={1.4} k1={0} k2={2.2} fill={wallSW} />
        
        {/* Main Block Windows & Doors 1F */}
        <WindowSW i={1.0} j={1.4} k={0.25} />
        <WindowSW i={2.0} j={1.4} k={0.25} />
        <polygon points={`${pt(1.4, 1.4, 0.25)} ${pt(1.6, 1.4, 0.25)} ${pt(1.6, 1.4, 0.85)} ${pt(1.4, 1.4, 0.85)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx={ptX(1.46, 1.4)} cy={ptY(1.46, 1.4, 0.55)} r="0.8" fill="#ea580c" />
        
        {/* Main Block Windows 2F */}
        <WindowSW i={1.0} j={1.4} k={1.3} />
        <WindowSW i={1.3} j={1.4} k={1.3} />
        <WindowSW i={1.7} j={1.4} k={1.3} />
        <WindowSW i={2.0} j={1.4} k={1.3} />
        
        <RoofI i1={0.8} i2={2.2} j1={0.4} j2={1.4} kBase={2.2} kPeak={3.2} drawGableSE={false} />
        <RoofJ i1={1.2} i2={1.8} j1={0.9} j2={1.4} kBase={2.2} kPeak={3.0} />
        {/* Small Attic Window */}
        <polygon points={`${pt(1.45, 1.4, 2.3)} ${pt(1.55, 1.4, 2.3)} ${pt(1.55, 1.4, 2.5)} ${pt(1.45, 1.4, 2.5)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1" />

        {/* Chimney */}
        <g>
          <polygon points={`${pt(1.8, 0.7, 2.7)} ${pt(2.0, 0.7, 2.7)} ${pt(2.0, 0.7, 3.6)} ${pt(1.8, 0.7, 3.6)}`} fill={wallSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points={`${pt(1.8, 0.6, 2.7)} ${pt(1.8, 0.7, 2.7)} ${pt(1.8, 0.7, 3.6)} ${pt(1.8, 0.6, 3.6)}`} fill={wallSE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points={`${pt(1.75, 0.75, 3.6)} ${pt(2.05, 0.75, 3.6)} ${pt(2.05, 0.75, 3.7)} ${pt(1.75, 0.75, 3.7)}`} fill={wallBaseSW} stroke="#1e293b" strokeWidth="1.5" />
        </g>

        {/* 3. Front Right Room */}
        <FaceSW i1={2.0} i2={2.6} j={1.8} k1={0} k2={1.2} />
        <FaceSE i={2.6} j1={1.2} j2={1.8} k1={0} k2={1.2} />
        <WindowSW i={2.2} j={1.8} k={0.35} />
        <WindowSW i={2.4} j={1.8} k={0.35} />
        <WindowSE i={2.6} j={1.4} k={0.35} />
        <WindowSE i={2.6} j={1.6} k={0.35} />
        <RoofJ i1={2.0} i2={2.6} j1={1.2} j2={1.8} kBase={1.2} kPeak={1.9} />

        {/* 4. Garage */}
        <FaceSW i1={0.0} i2={0.8} j={2.0} k1={0} k2={1.2} />
        <FaceSE i={0.8} j1={1.4} j2={2.0} k1={0} k2={1.2} />
        
        <GarageDoor i={0.25} j={2.0} k={0.25} />
        <GarageDoor i={0.55} j={2.0} k={0.25} />
        
        <RoofJ i1={0.0} i2={0.8} j1={0.6} j2={2.0} kBase={1.2} kPeak={2.0} />
        {/* Attic window on Garage */}
        <polygon points={`${pt(0.32, 2.0, 1.35)} ${pt(0.48, 2.0, 1.35)} ${pt(0.48, 2.0, 1.6)} ${pt(0.32, 2.0, 1.6)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${pt(0.35, 2.0, 1.4)} ${pt(0.45, 2.0, 1.4)} ${pt(0.45, 2.0, 1.55)} ${pt(0.35, 2.0, 1.55)}`} fill="#bae6fd" stroke="#1e293b" strokeWidth="0.8" />

        {/* 5. Porch */}
        <polygon points={`${pt(0.8, 1.4, 0.1)} ${pt(2.0, 1.4, 0.1)} ${pt(2.0, 2.0, 0.1)} ${pt(0.8, 2.0, 0.1)}`} fill="#9ca3af" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${pt(0.8, 2.0, 0.1)} ${pt(2.0, 2.0, 0.1)} ${pt(2.0, 2.0, 0)} ${pt(0.8, 2.0, 0)}`} fill="#6b7280" stroke="#1e293b" strokeWidth="1.5" />
        
        {[0.9, 1.25, 1.75, 1.95].map(ci => (
          <polygon key={ci} points={`${pt(ci-0.03, 1.9, 0.1)} ${pt(ci+0.03, 1.9, 0.1)} ${pt(ci+0.03, 1.9, 1.1)} ${pt(ci-0.03, 1.9, 1.1)}`} fill="#f5f5f4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        ))}

        <polygon points={`${pt(0.8, 1.4, 1.2)} ${pt(2.0, 1.4, 1.2)} ${pt(2.0, 2.0, 0.9)} ${pt(0.8, 2.0, 0.9)}`} fill={roofSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon points={`${pt(0.8, 2.0, 0.9)} ${pt(2.0, 2.0, 0.9)} ${pt(2.0, 2.0, 0.85)} ${pt(0.8, 2.0, 0.85)}`} fill={wallBaseSW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
      </g>
    </svg>
  );
};

export const SvgShop = ({ seed = 0 }) => {
  const variants = [
    { id: 'blue',   light: '#38bdf8', dark: '#0284c7' }, // Lawson
    { id: 'green',  light: '#4ade80', dark: '#16a34a' }, // FamilyMart
    { id: 'orange', light: '#fb923c', dark: '#ea580c' }, // Seicomart
  ];
  const v = variants[(seed || 0) % variants.length];

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <g transform="translate(50, 100) scale(2.5)">
        {/* Ground Shadow */}

        {/* Building Base / Walls */}
        <polygon points="0,-4 -20,-14 -20,-34 0,-24" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-4 20,-14 20,-34 0,-24" fill="#f8fafc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        {/* Roof */}
        <polygon points="0,-24 -20,-34 0,-44 20,-34" fill="#f1f5f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        
        {/* Colored Stripe on Wall */}
        <polygon points="0,-16 -20,-26 -20,-30 0,-20" fill={v.dark} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-16 20,-26 20,-30 0,-20" fill={v.light} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />

        {/* Small Logo / Sign on the Left Stripe */}
        <polygon points="-6,-18 -14,-22 -14,-26 -6,-22" fill="#ffffff" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="6,-18 14,-22 14,-26 6,-22" fill="#ffffff" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        
        {/* Door and Window on the Left Face */}
        {/* Door */}
        <polygon points="-2,-5 -10,-9 -10,-21 -2,-17" fill="#67e8f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="-6" y1="-7" x2="-6" y2="-19" stroke="#000" strokeWidth="1" />
        
        {/* Display Window */}
        <polygon points="-12,-13 -18,-16 -18,-25 -12,-22" fill="#67e8f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="-15" y1="-14.5" x2="-15" y2="-23.5" stroke="#000" strokeWidth="1" />
        
        {/* Display Window on Right Face */}
        <polygon points="2,-5 18,-13 18,-25 2,-17" fill="#67e8f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="6" y1="-7" x2="6" y2="-19" stroke="#000" strokeWidth="1" />
        <line x1="10" y1="-9" x2="10" y2="-21" stroke="#000" strokeWidth="1" />
        <line x1="14" y1="-11" x2="14" y2="-23" stroke="#000" strokeWidth="1" />

        {/* Pole Sign (drawn last so it is in front of the building walls) */}
        <g transform="translate(-24, 4)">
          {/* Pole */}
          <polygon points="0,0 -2,-1 -2,-25 0,-24" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,0 2,-1 2,-25 0,-24" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Sign box */}
          <polygon points="0,-18 -4,-20 -4,-30 0,-28" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,-18 6,-15 6,-25 0,-28" fill="#f8fafc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,-28 6,-25 2,-27 -4,-30" fill="#f1f5f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          {/* Sign colored area */}
          <polygon points="-1,-19 -3,-20 -3,-27 -1,-26" fill={v.dark} />
          <polygon points="1,-17.5 5,-15.5 5,-22.5 1,-24.5" fill={v.light} />
          <polygon points="-1,-19 -1,-26 0,-26.5 0,-19.5" fill="#ffffff" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
};

export const SvgSchool = () => {
  // 100x100の2Dグリッドを、現在の4×4マスのアイソメトリックベース（0,0を中心とする幅88, 奥行44のひし形）にマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* 既存の環境への互換性のため残しています */}
      
      <g transform="translate(50, 41) scale(3.55)">

        {/* === 地面（ベース） === */}
        <polygon 
          points={`${iso(0,0)} ${iso(100,0)} ${iso(100,100)} ${iso(0,100)}`} 
          fill="#4ade80" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" 
        />

        {/* === アスファルトの通路 === */}
        <polygon 
          points={`${iso(25,20)} ${iso(95,20)} ${iso(95,50)} ${iso(40,50)} ${iso(40,75)} ${iso(25,75)}`} 
          fill="#94a3b8" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" 
        />

        {/* === グラウンド（砂地） === */}
        <polygon 
          points={`${iso(35,50)} ${iso(95,50)} ${iso(95,95)} ${iso(35,95)}`} 
          fill="#e5c8a8" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" 
        />

        {/* トラックの白線（外側） */}
        <path 
          d={`M ${iso(55,65)} L ${iso(75,65)} C ${iso(80.5,65)} ${iso(85,69.5)} ${iso(85,75)} C ${iso(85,80.5)} ${iso(80.5,85)} ${iso(75,85)} L ${iso(55,85)} C ${iso(49.5,85)} ${iso(45,80.5)} ${iso(45,75)} C ${iso(45,69.5)} ${iso(49.5,65)} ${iso(55,65)} Z`} 
          fill="none" stroke="#fff" strokeWidth="1.2" 
        />
        {/* トラックの白線（内側） */}
        <path 
          d={`M ${iso(55,69)} L ${iso(75,69)} C ${iso(78.3,69)} ${iso(81,71.7)} ${iso(81,75)} C ${iso(81,78.3)} ${iso(78.3,81)} ${iso(75,81)} L ${iso(55,81)} C ${iso(51.7,81)} ${iso(49,78.3)} ${iso(49,75)} C ${iso(49,71.7)} ${iso(51.7,69)} ${iso(55,69)} Z`} 
          fill="none" stroke="#fff" strokeWidth="0.8" 
        />

        {/* === 奥の校舎（バックウィング） === */}
        {/* 前面（明るい） */}
        <polygon points={`${iso(25,25,0)} ${iso(65,25,0)} ${iso(65,25,22)} ${iso(25,25,22)}`} fill="#f1f5f9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 側面（暗い） */}
        <polygon points={`${iso(65,10,0)} ${iso(65,25,0)} ${iso(65,25,22)} ${iso(65,10,22)}`} fill="#cbd5e1" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 屋根 */}
        <polygon points={`${iso(25,10,22)} ${iso(65,10,22)} ${iso(65,25,22)} ${iso(25,25,22)}`} fill="#64748b" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        
        {/* 奥の校舎の窓（前面） */}
        {[4, 10, 16].map(z =>
          [28, 35, 42, 49, 56].map(x => (
            <polygon key={`bw-${x}-${z}`} points={`${iso(x,25,z)} ${iso(x+4,25,z)} ${iso(x+4,25,z+4)} ${iso(x,25,z+4)}`} fill="#7dd3fc" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          ))
        )}

        {/* === 中央の塔（角部分） === */}
        {/* 前面（明るい） */}
        <polygon points={`${iso(10,25,0)} ${iso(25,25,0)} ${iso(25,25,32)} ${iso(10,25,32)}`} fill="#f1f5f9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 側面（暗い） */}
        <polygon points={`${iso(25,10,0)} ${iso(25,25,0)} ${iso(25,25,32)} ${iso(25,10,32)}`} fill="#cbd5e1" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 屋根 */}
        <polygon points={`${iso(10,10,32)} ${iso(25,10,32)} ${iso(25,25,32)} ${iso(10,25,32)}`} fill="#475569" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        
        {/* 塔の時計 */}
        {(() => {
          const [cx, cy] = iso(17.5, 25, 26).split(',');
          return (
            <g>
              <circle cx={cx} cy={cy} r="2.5" fill="#f8fafc" stroke="#000" strokeWidth="0.8" />
              <line x1={cx} y1={cy} x2={cx} y2={Number(cy) - 1.5} stroke="#000" strokeWidth="0.6" strokeLinecap="round" />
              <line x1={cx} y1={cy} x2={Number(cx) + 1} y2={Number(cy) + 0.5} stroke="#000" strokeWidth="0.6" strokeLinecap="round" />
            </g>
          );
        })()}

        {/* === 手前の校舎（レフトウィング） === */}
        {/* 前面（明るい） */}
        <polygon points={`${iso(10,75,0)} ${iso(25,75,0)} ${iso(25,75,22)} ${iso(10,75,22)}`} fill="#f1f5f9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 側面（暗い） */}
        <polygon points={`${iso(25,25,0)} ${iso(25,75,0)} ${iso(25,75,22)} ${iso(25,25,22)}`} fill="#cbd5e1" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 屋根 */}
        <polygon points={`${iso(10,25,22)} ${iso(25,25,22)} ${iso(25,75,22)} ${iso(10,75,22)}`} fill="#64748b" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        
        {/* 手前の校舎の窓（側面） */}
        {[4, 10, 16].map(z =>
          [30, 37, 44, 51, 58, 65].map(y => (
            <polygon key={`lw-${y}-${z}`} points={`${iso(25,y,z)} ${iso(25,y+4,z)} ${iso(25,y+4,z+4)} ${iso(25,y,z+4)}`} fill="#7dd3fc" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          ))
        )}

        {/* === 体育館 === */}
        {/* 壁・前面 */}
        <polygon points={`${iso(70,45,0)} ${iso(95,45,0)} ${iso(95,45,15)} ${iso(70,45,15)}`} fill="#f1f5f9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 壁・側面 */}
        <polygon points={`${iso(95,15,0)} ${iso(95,45,0)} ${iso(95,45,15)} ${iso(95,15,15)}`} fill="#cbd5e1" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* かまぼこ屋根のアーチ面（前） */}
        <path d={`M ${iso(70,45,15)} Q ${iso(82.5,45,25)} ${iso(95,45,15)} Z`} fill="#f1f5f9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 屋根本体 */}
        <path d={`M ${iso(70,45,15)} Q ${iso(82.5,45,25)} ${iso(95,45,15)} L ${iso(95,15,15)} Q ${iso(82.5,15,25)} ${iso(70,15,15)} Z`} fill="#0ea5e9" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        
        {/* 体育館の窓 */}
        {[73, 80, 87].map(x => ( // 前面
            <polygon key={`gwf-${x}`} points={`${iso(x,45,5)} ${iso(x+3,45,5)} ${iso(x+3,45,10)} ${iso(x,45,10)}`} fill="#7dd3fc" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        ))}
        {[21, 28, 35].map(y => ( // 側面
            <polygon key={`gws-${y}`} points={`${iso(95,y,5)} ${iso(95,y+4,5)} ${iso(95,y+4,10)} ${iso(95,y,10)}`} fill="#7dd3fc" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
        ))}

        {/* === エントランス（校舎の交差部ポーチ） === */}
        {/* 前面 */}
        <polygon points={`${iso(25,35,0)} ${iso(35,35,0)} ${iso(35,35,6)} ${iso(25,35,6)}`} fill="#e2e8f0" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 側面 */}
        <polygon points={`${iso(35,25,0)} ${iso(35,35,0)} ${iso(35,35,6)} ${iso(35,25,6)}`} fill="#cbd5e1" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 屋根 */}
        <polygon points={`${iso(25,25,6)} ${iso(35,25,6)} ${iso(35,35,6)} ${iso(25,35,6)}`} fill="#38bdf8" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* ドア */}
        <polygon points={`${iso(28,35,0)} ${iso(32,35,0)} ${iso(32,35,4)} ${iso(28,35,4)}`} fill="#fff" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />

      </g>
    </svg>
  );
};

export const SvgWall = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -20,-10 -20,-30 0,-20" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 20,-10 20,-30 0,-20" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 -20,-30 0,-40 20,-30" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 -6,-23 -6,-28 0,-25" fill="#cbd5e1" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="0,-20 6,-23 6,-28 0,-25" fill="#94a3b8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFence = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      {/* 草地の細長い基礎 */}
      <polygon points={`${iso3(30, 6, 0)} ${iso3(70, 6, 0)} ${iso3(70, 94, 0)} ${iso3(30, 94, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 支柱4本（斜めのラインに沿って） */}
      {[14, 40, 64, 88].map(y => (
        <g key={y}>
          <polygon points={`${iso3(48, y, 0)} ${iso3(52, y, 0)} ${iso3(52, y, 15)} ${iso3(48, y, 15)}`} fill="#b45309" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
          <polygon points={`${iso3(52, y - 2, 0)} ${iso3(52, y, 0)} ${iso3(52, y, 15)} ${iso3(52, y - 2, 15)}`} fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          {/* 支柱の頭（斜めカット） */}
          <polygon points={`${iso3(48, y, 15)} ${iso3(52, y, 15)} ${iso3(52, y - 2, 15)} ${iso3(48, y - 2, 15)}`} fill="#d97706" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
        </g>
      ))}
      {/* 横板2段 */}
      <polygon points={`${iso3(47, 8, 10)} ${iso3(47, 92, 10)} ${iso3(47, 92, 13)} ${iso3(47, 8, 13)}`} fill="#f59e0b" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(47, 8, 4)} ${iso3(47, 92, 4)} ${iso3(47, 92, 7)} ${iso3(47, 8, 7)}`} fill="#d97706" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 足元の草 */}
      {[[42, 24], [58, 52], [42, 76]].map(([gx, gy], i) => (
        <g key={i} transform={`translate(${isoPt(gx, gy, 0)[0].toFixed(1)}, ${isoPt(gx, gy, 0)[1].toFixed(1)})`}>
          <path d="M 0,0 Q -1.4,-3 -2.6,-4 M 0,0 Q 0.2,-3.6 1,-5 M 0,0 Q 1.8,-2.6 3,-3.4" fill="none" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
        </g>
      ))}
    </g>
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
          fill="#a8a29e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 桁下のアーチ開口（影） */}
        <path d={`M ${iso3(30, 70, 0)} C ${iso3(30, 62, 7)} ${iso3(30, 38, 7)} ${iso3(30, 30, 0)} Z`} fill="#1e293b" opacity="0.55" />
        {/* 路面（上面） */}
        <path d={`M ${iso3(30, 96, 2)} C ${iso3(30, 74, 14)} ${iso3(30, 26, 14)} ${iso3(30, 4, 2)}
                 L ${iso3(58, 4, 2)} C ${iso3(58, 26, 14)} ${iso3(58, 74, 14)} ${iso3(58, 96, 2)} Z`}
          fill="#e7e5e4" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 石畳のライン */}
        {[20, 36, 50, 64, 80].map(y => {
          const zz = 2 + 10.5 * Math.sin(Math.PI * (y - 4) / 92);
          return <line key={y} x1={isoPt(31, y, zz)[0]} y1={isoPt(31, y, zz)[1]} x2={isoPt(57, y, zz)[0]} y2={isoPt(57, y, zz)[1]} stroke="#a8a29e" strokeWidth="0.7" opacity="0.9" />;
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
