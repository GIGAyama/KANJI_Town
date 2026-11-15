import React from 'react';
import { SharedDefs } from './shared.jsx';

// 地形（荒れ地・草地・森・砂地・浅瀬・高台など）

// ==========================================
// 2. Terrain Assets
// ==========================================
export const SvgGrassland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#78350f" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#451a03" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#4ade80" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="20" cy="25" r="1.5" fill="#000" />
      <circle cx="70" cy="20" r="1.5" fill="#000" />
      <path d="M 40,30 L 40,20 M 45,35 L 45,25" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgBedrock = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" ><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#334155" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#1e293b" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#64748b" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 30,20 L 50,30 L 70,20" fill="none" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 50,30 L 50,45" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgRoughland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#78350f" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#451a03" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#b45309" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="20,20 30,15 40,20 30,25" fill="#d97706" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="60,30 70,25 80,30 70,35" fill="#92400e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgCleared = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#92400e" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#78350f" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#d4a96a" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="30" cy="20" r="1.5" fill="#000" />
      <circle cx="50" cy="30" r="1.5" fill="#000" />
      <circle cx="70" cy="20" r="1.5" fill="#000" />
      <circle cx="40" cy="15" r="1.5" fill="#000" />
      <circle cx="60" cy="15" r="1.5" fill="#000" />
    </g>
  </svg>
);

export const SvgForestFloor = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#064e3b" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#022c22" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#14532d" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="30" cy="25" r="8" fill="#065f46" stroke="#000" strokeWidth="2" />
      <circle cx="75" cy="20" r="10" fill="#065f46" stroke="#000" strokeWidth="2" />
      <polygon points="45,40 55,40 50,30" fill="#ef4444" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgSand = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#d97706" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#b45309" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#fde68a" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 20,20 Q 35,15 50,20 T 80,20" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
      <path d="M 30,30 Q 45,25 60,30 T 90,30" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgShallowWater = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#0284c7" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#0369a1" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#38bdf8" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 20,15 L 40,25 M 60,15 L 80,25" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 30,35 L 50,45 M 10,25 L 20,30" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgHighland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full"><SharedDefs />
    <g transform="translate(0, 20)">
      <polygon points="0,25 50,50 50,80 0,55" fill="#44403c" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,50 100,25 100,55 50,80" fill="#292524" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#d6d3d1" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
      <polygon points="20,15 50,30 80,15 50,0" fill="#fff" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);
