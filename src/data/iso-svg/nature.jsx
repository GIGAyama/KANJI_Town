import React from 'react';
import { SharedDefs } from './shared.jsx';

// 自然（くさ・花・木・岩など）

// ==========================================
// 3. Nature Assets
// ==========================================
export const SvgWeed = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <path d="M 0,2 Q -10,-20 -20,-30" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 0,2 Q 10,-15 20,-25" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M -10,-20 Q -15,-25 -20,-15 Q -10,-10 -10,-20 Z" fill="#16a34a" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 10,-15 Q 15,-20 20,-10 Q 10,-5 10,-15 Z" fill="#22c55e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -5,-25 Q -10,-30 -15,-20 Q -5,-15 -5,-25 Z" fill="#15803d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 5,-20 Q 10,-25 15,-15 Q 5,-10 5,-20 Z" fill="#16a34a" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 0,-30 Q 5,-35 10,-25 Q 0,-20 0,-30 Z" fill="#22c55e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 0,-30 Q -5,-35 -10,-25 Q 0,-20 0,-30 Z" fill="#4ade80" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgGrass = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <path d="M -5,2 Q -15,-15 -25,-10 Q -15,-5 -5,2 Z" fill="#15803d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 5,2 Q 20,-10 25,-5 Q 15,0 5,2 Z" fill="#16a34a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -2,2 Q -10,-25 -5,-35 Q 0,-20 -2,2 Z" fill="#16a34a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 2,2 Q 15,-20 10,-30 Q 5,-15 2,2 Z" fill="#22c55e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,4 Q -5,-15 0,-25 Q 5,-15 0,4 Z" fill="#4ade80" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,4 Q 2,-10 5,-15 Q 0,-5 0,4 Z" fill="#86efac" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFlower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <path d="M -2,0 Q -10,-10 -5,-25" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 2,0 Q 15,-5 20,-20" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M -5,-10 Q -15,-15 -20,-5 Q -10,0 -5,-10 Z" fill="#22c55e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 10,-10 Q 20,-10 25,-5 Q 15,0 10,-10 Z" fill="#4ade80" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(-5, -25)">
        <circle cx="0" cy="-6" r="5" fill="#f472b6" stroke="#000" strokeWidth="2" />
        <circle cx="5" cy="-2" r="5" fill="#ec4899" stroke="#000" strokeWidth="2" />
        <circle cx="3" cy="4" r="5" fill="#db2777" stroke="#000" strokeWidth="2" />
        <circle cx="-3" cy="4" r="5" fill="#be185d" stroke="#000" strokeWidth="2" />
        <circle cx="-5" cy="-2" r="5" fill="#fbcfe8" stroke="#000" strokeWidth="2" />
        <circle cx="0" cy="0" r="3" fill="#fef08a" stroke="#000" strokeWidth="1.5" />
      </g>
      <g transform="translate(20, -20) scale(0.8)">
        <circle cx="0" cy="-6" r="5" fill="#fde047" stroke="#000" strokeWidth="2" />
        <circle cx="5" cy="-2" r="5" fill="#facc15" stroke="#000" strokeWidth="2" />
        <circle cx="3" cy="4" r="5" fill="#eab308" stroke="#000" strokeWidth="2" />
        <circle cx="-3" cy="4" r="5" fill="#ca8a04" stroke="#000" strokeWidth="2" />
        <circle cx="-5" cy="-2" r="5" fill="#fef08a" stroke="#000" strokeWidth="2" />
        <circle cx="0" cy="0" r="3" fill="#f97316" stroke="#000" strokeWidth="1.5" />
      </g>
    </g>
  </svg>
);

export const SvgTree = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: 'visible' }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Ground Shadow */}
      <ellipse cx="0" cy="1" rx="14" ry="7" fill="rgba(0,0,0,0.15)" />
      
      {/* Trunk Silhouette */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <polygon points="-2.5,0 -2.5,-30 2.5,-30 2.5,0" />
      </g>
      {/* Trunk Fill */}
      <polygon points="-2.5,0 -2.5,-30 0,-30 0,0" fill="#b45309" />
      <polygon points="0,0 0,-30 2.5,-30 2.5,0" fill="#78350f" />
      
      {/* Foliage Silhouette */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <circle cx="-13" cy="-30" r="14" />
        <circle cx="13" cy="-30" r="14" />
        <circle cx="0" cy="-44" r="16" />
        <circle cx="0" cy="-28" r="10" />
      </g>
      
      {/* Foliage Fill */}
      {/* Left Back Puff */}
      <circle cx="-13" cy="-30" r="14" fill="#16a34a" />
      <path d="M -13,-44 A 14 14 0 0 0 -13,-16 Z" fill="#4ade80" />
      
      {/* Right Back Puff */}
      <circle cx="13" cy="-30" r="14" fill="#16a34a" />
      <path d="M 13,-44 A 14 14 0 0 0 13,-16 Z" fill="#4ade80" />
      
      {/* Center Fill (Blocks gaps) */}
      <circle cx="0" cy="-28" r="10" fill="#16a34a" />
      <path d="M 0,-38 A 10 10 0 0 0 0,-18 Z" fill="#4ade80" />
      
      {/* Top Front Puff */}
      <circle cx="0" cy="-44" r="16" fill="#15803d" />
      <path d="M 0,-60 A 16 16 0 0 0 0,-28 Z" fill="#22c55e" />
    </g>
  </svg>
);

export const SvgSakura = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Ground Shadow */}
      <ellipse cx="0" cy="1" rx="16" ry="8" fill="rgba(0,0,0,0.15)" />
      
      {/* Trunk Silhouette */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <polygon points="-3,0 -3,-35 3,-35 3,0" />
      </g>
      {/* Trunk Fill */}
      <polygon points="-3,0 -3,-35 0,-35 0,0" fill="#451a03" />
      <polygon points="0,0 0,-35 3,-35 3,0" fill="#290f02" />
      
      {/* Foliage Silhouette */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <circle cx="-15" cy="-34" r="16" />
        <circle cx="15" cy="-34" r="16" />
        <circle cx="0" cy="-50" r="18" />
        <circle cx="0" cy="-30" r="12" />
      </g>
      
      {/* Foliage Fill */}
      {/* Left Puff */}
      <circle cx="-15" cy="-34" r="16" fill="#db2777" />
      <path d="M -15,-50 A 16 16 0 0 0 -15,-18 Z" fill="#f472b6" />
      
      {/* Right Puff */}
      <circle cx="15" cy="-34" r="16" fill="#db2777" />
      <path d="M 15,-50 A 16 16 0 0 0 15,-18 Z" fill="#f472b6" />
      
      {/* Center Fill */}
      <circle cx="0" cy="-30" r="12" fill="#db2777" />
      <path d="M 0,-42 A 12 12 0 0 0 0,-18 Z" fill="#f472b6" />
      
      {/* Top Puff */}
      <circle cx="0" cy="-50" r="18" fill="#be185d" />
      <path d="M 0,-68 A 18 18 0 0 0 0,-32 Z" fill="#ec4899" />
      
      {/* Sakura Petal Details */}
      <g fill="none" stroke="#fbcfe8" strokeWidth="2" strokeLinecap="round" opacity="0.8">
        <path d="M -20,-40 A 5 5 0 0 1 -15,-45" />
        <path d="M 12,-52 A 6 6 0 0 1 20,-48" />
        <path d="M -5,-58 A 5 5 0 0 1 5,-58" />
      </g>
    </g>
  </svg>
);

export const SvgPine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Ground Shadow */}
      <ellipse cx="0" cy="1" rx="14" ry="7" fill="rgba(0,0,0,0.15)" />
      
      {/* Trunk */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <polygon points="-2.5,0 -2.5,-20 2.5,-20 2.5,0" />
      </g>
      <polygon points="-2.5,0 -2.5,-20 0,-20 0,0" fill="#b45309" />
      <polygon points="0,0 0,-20 2.5,-20 2.5,0" fill="#78350f" />
      
      {/* Foliage Silhouette */}
      <g fill="#000" stroke="#000" strokeWidth="3" strokeLinejoin="round">
        <polygon points="0,-24 -18,-8 0,-4 18,-8" />
        <polygon points="0,-38 -14,-20 0,-16 14,-20" />
        <polygon points="0,-50 -10,-30 0,-26 10,-30" />
        <polygon points="0,-62 -7,-40 0,-36 7,-40" />
      </g>
      
      {/* Foliage Fill */}
      {/* Tier 1 */}
      <polygon points="0,-24 -18,-8 0,-4" fill="#4ade80" />
      <polygon points="0,-24 18,-8 0,-4" fill="#16a34a" />
      {/* Tier 2 */}
      <polygon points="0,-38 -14,-20 0,-16" fill="#4ade80" />
      <polygon points="0,-38 14,-20 0,-16" fill="#16a34a" />
      {/* Tier 3 */}
      <polygon points="0,-50 -10,-30 0,-26" fill="#4ade80" />
      <polygon points="0,-50 10,-30 0,-26" fill="#16a34a" />
      {/* Tier 4 (Top) */}
      <polygon points="0,-62 -7,-40 0,-36" fill="#4ade80" />
      <polygon points="0,-62 7,-40 0,-36" fill="#16a34a" />
    </g>
  </svg>
);

export const SvgRock = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Ground Shadow */}
      <ellipse cx="0" cy="1" rx="22" ry="10" fill="rgba(0,0,0,0.15)" />
      <polygon points="-25,0 -15,-20 0,-35 15,-25 25,5 15,10 -15,5" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-35 15,-25 25,5 5,0 -5,-10" fill="#1e293b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-25,0 -15,-20 -5,-10 5,0 -15,5" fill="#475569" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-15,-20 0,-35 5,-15 -5,-10" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -20,2 Q -15,-5 -10,0 Q -5,5 -20,2 Z" fill="#15803d" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgBambooGrove = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Ground Shadow */}
      <ellipse cx="0" cy="2" rx="20" ry="10" fill="rgba(0,0,0,0.15)" />
      <g transform="translate(12, -2)">
        <rect x="-2" y="-65" width="4" height="65" fill="#15803d" stroke="#000" strokeWidth="1.5" />
        <rect x="-2" y="-65" width="2" height="65" fill="#22c55e" />
      </g>
      <g transform="translate(-15, 2) rotate(-2)">
        <rect x="-2.5" y="-70" width="5" height="70" fill="#16a34a" stroke="#000" strokeWidth="1.5" />
        <rect x="-2.5" y="-70" width="2.5" height="70" fill="#4ade80" />
      </g>
      <g transform="translate(-2, 5) rotate(1)">
        <rect x="-3" y="-75" width="6" height="75" fill="#22c55e" stroke="#000" strokeWidth="2" />
        <rect x="-3" y="-75" width="3" height="75" fill="#86efac" />
        <path d="M 3,-30 Q 15,-35 20,-25 Q 15,-28 3,-30 Z" fill="#4ade80" stroke="#000" strokeWidth="1" />
        <path d="M 3,-55 Q 18,-65 25,-50 Q 18,-55 3,-55 Z" fill="#22c55e" stroke="#000" strokeWidth="1" />
        <path d="M -3,-40 Q -15,-45 -22,-35 Q -15,-38 -3,-40 Z" fill="#16a34a" stroke="#000" strokeWidth="1" />
        <path d="M -3,-65 Q -18,-75 -25,-60 Q -18,-65 -3,-65 Z" fill="#4ade80" stroke="#000" strokeWidth="1" />
        <path d="M 0,-75 Q 5,-85 10,-90 Q 5,-80 0,-75 Z" fill="#86efac" stroke="#000" strokeWidth="1" />
        <path d="M 0,-75 Q -5,-85 -10,-90 Q -5,-80 0,-75 Z" fill="#4ade80" stroke="#000" strokeWidth="1" />
      </g>
    </g>
  </svg>
);
