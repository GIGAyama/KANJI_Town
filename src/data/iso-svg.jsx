import React from 'react';

// ==========================================
// 1. Shared Definitions & Helpers
// ==========================================
const SharedDefs = () => (
  <defs>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1.5" dy="3" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.4" />
    </filter>
    <filter id="strong-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="-2" dy="5" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.6" />
    </filter>
    <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="grad-glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.9" />
      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.6" />
      <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
    </linearGradient>
    <linearGradient id="grad-gold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#d97706" />
      <stop offset="40%" stopColor="#fbbf24" />
      <stop offset="60%" stopColor="#fef08a" />
      <stop offset="100%" stopColor="#b45309" />
    </linearGradient>
    <linearGradient id="grad-water" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#7dd3fc" />
      <stop offset="100%" stopColor="#0ea5e9" />
    </linearGradient>
    <linearGradient id="grad-roof-red" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#991b1b" />
    </linearGradient>
    <linearGradient id="grad-roof-blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" />
    </linearGradient>
    <linearGradient id="grad-roof-slate" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#64748b" /><stop offset="100%" stopColor="#334155" />
    </linearGradient>
  </defs>
);

const darken = (hex, amt = 20) => {
  if (!hex || typeof hex !== 'string' || hex.startsWith('url')) return hex || '#000';
  const match = hex.match(/\w\w/g);
  if (!match || match.length !== 3) return hex;
  let [r, g, b] = match.map(x => parseInt(x, 16));
  r = Math.max(0, r - amt); g = Math.max(0, g - amt); b = Math.max(0, b - amt);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};
const lighten = (hex, amt = 20) => {
  if (!hex || typeof hex !== 'string' || hex.startsWith('url')) return hex || '#fff';
  const match = hex.match(/\w\w/g);
  if (!match || match.length !== 3) return hex;
  let [r, g, b] = match.map(x => parseInt(x, 16));
  r = Math.min(255, r + amt); g = Math.min(255, g + amt); b = Math.min(255, b + amt);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

// --- Flat surface component (道・水路・庭園) ---
const Fl = ({ cx = 50, cy = 100, color = '#e2e8f0', thickness = 2, scale = 2.0, type = 'road' }) => {
  const dx = 25 * scale;
  const dy = 12.5 * scale;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <SharedDefs />
      <polygon points={`0,0 ${dx},-${dy} ${dx},${-dy + thickness} 0,${thickness}`} fill={darken(color, 20)} />
      <polygon points={`0,0 -${dx},-${dy} -${dx},${-dy + thickness} 0,${thickness}`} fill={darken(color, 30)} />
      <polygon points={`0,0 ${dx},-${dy} 0,-${dy * 2} -${dx},-${dy}`} fill={type === 'water' ? 'url(#grad-water)' : color} />
      {type === 'road' && (<>
        <polyline points={`-${dx*0.9},-${dy} 0,-${dy*1.9} ${dx*0.9},-${dy}`} fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.6"/>
        <polyline points={`-${dx*0.9},-${dy} 0,-${dy*0.1} ${dx*0.9},-${dy}`} fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.6"/>
        <path d={`M -${dx*0.5},-${dy*0.5} L -${dx*0.4},-${dy*0.4} M ${dx*0.3},-${dy*0.6} L ${dx*0.4},-${dy*0.5}`} stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
        <path d={`M 0,-${dy} L ${dx*0.1},-${dy*0.9}`} stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      </>)}
      {type === 'water' && (<>
        <path d={`M -${dx*0.5},-${dy} Q 0,-${dy*1.4} ${dx*0.5},-${dy}`} fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.8" strokeLinecap="round"/>
        <path d={`M -${dx*0.2},-${dy*0.6} Q 0,-${dy*0.8} ${dx*0.2},-${dy*0.6}`} fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.6" strokeLinecap="round"/>
        <circle cx="0" cy={-dy} r="1" fill="#ffffff" filter="url(#glow-effect)" opacity="0.8"/>
      </>)}
      {type === 'garden' && (<>
        <path d={`M -${dx*0.6},-${dy*1.1} L ${dx*0.2},-${dy*0.3} M -${dx*0.3},-${dy*1.4} L ${dx*0.5},-${dy*0.6}`} stroke="#92400e" strokeWidth="3" opacity="0.5" strokeLinecap="round"/>
        <circle cx={-dx*0.2} cy={-dy*0.7} r="2.5" fill="#4ade80" filter="url(#soft-shadow)" />
        <circle cx={dx*0.1} cy={-dy*1.0} r="3" fill="#22c55e" filter="url(#soft-shadow)" />
        <circle cx={dx*0.4} cy={-dy*1.3} r="2.5" fill="#16a34a" filter="url(#soft-shadow)" />
        <circle cx={dx*0.2} cy={-dy*0.5} r="2.5" fill="#22c55e" filter="url(#soft-shadow)" />
      </>)}
    </g>
  );
};

// ==========================================
// 2. Terrain Assets
// ==========================================
export const SvgGrassland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 40)">
      <polygon points="0,25 50,50 50,60 0,35" fill="#78350f" />
      <polygon points="50,50 100,25 100,35 50,60" fill="#451a03" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#4ade80" />
      <path d="M 0,25 Q 5,28 10,25 Q 15,30 20,26 Q 25,32 30,27 Q 35,35 40,29 Q 45,38 50,50 L 50,53 Q 45,41 40,32 Q 35,38 30,30 Q 25,35 20,29 Q 15,33 10,28 Q 5,31 0,28 Z" fill="#22c55e" />
      <path d="M 50,50 Q 55,48 60,51 Q 65,45 70,49 Q 75,42 80,45 Q 85,38 90,41 Q 95,33 100,25 L 100,28 Q 95,36 90,44 Q 85,41 80,48 Q 75,45 70,52 Q 65,48 60,54 Q 55,51 50,53 Z" fill="#16a34a" />
      <path d="M 10,25 Q 30,15 50,25 Q 70,35 90,25 Q 70,15 50,5 Q 30,15 10,25 Z" fill="#86efac" opacity="0.3"/>
      <circle cx="20" cy="20" r="1.5" fill="#bef264" opacity="0.8" />
      <circle cx="70" cy="25" r="1.2" fill="#bef264" opacity="0.8" />
      <circle cx="50" cy="12" r="1" fill="#fbbf24" opacity="0.9"/>
    </g>
  </svg>
);

export const SvgBedrock = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 35)">
      <polygon points="0,25 50,50 50,65 0,40" fill="#334155" />
      <polygon points="50,50 100,25 100,40 50,65" fill="#1e293b" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#64748b" />
      <polygon points="50,2 96,25 50,48 4,25" fill="#475569" />
      <path d="M 15,22 L 30,25 L 35,18 L 50,28 L 65,22 L 85,28" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M 30,25 L 40,35 L 35,42" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="40,10 55,8 50,15 35,18" fill="#94a3b8" opacity="0.3" />
      <polygon points="60,35 80,25 75,38" fill="#334155" opacity="0.4" />
      <polyline points="0,25 50,50 100,25" fill="none" stroke="#94a3b8" strokeWidth="1" opacity="0.5" />
    </g>
  </svg>
);

export const SvgRoughland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 42)">
      <polygon points="0,25 50,50 50,58 0,33" fill="#78350f" />
      <polygon points="50,50 100,25 100,33 50,58" fill="#451a03" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#b45309" />
      <polygon points="30,5 50,15 25,25" fill="#d97706" opacity="0.4" />
      <polygon points="70,15 90,25 60,35 50,25" fill="#92400e" opacity="0.4" />
      <path d="M 20,22 L 30,18 L 40,25 L 55,20 L 70,28 L 80,22" fill="none" stroke="#78350f" strokeWidth="1" strokeLinejoin="round" opacity="0.8" />
      <path d="M 25,30 Q 27,25 30,30 M 27,30 Q 27,27 25,28" fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="45" cy="15" r="1.5" fill="#78350f" />
      <circle cx="55" cy="25" r="2" fill="#92400e" />
    </g>
  </svg>
);

export const SvgCleared = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 46)">
      <polygon points="0,25 50,50 50,54 0,29" fill="#92400e" />
      <polygon points="50,50 100,25 100,29 50,54" fill="#78350f" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#d4a96a" />
      <path d="M 10,20 L 50,40 M 20,15 L 60,35 M 30,10 L 70,30 M 40,5 L 80,25" fill="none" stroke="#b45309" strokeWidth="1.5" opacity="0.2" />
      <path d="M 15,22 L 55,42 M 25,17 L 65,37 M 35,12 L 75,32" fill="none" stroke="#fde68a" strokeWidth="1.5" opacity="0.3" />
      <polygon points="50,5 90,25 50,45 10,25" fill="#fef08a" opacity="0.1" />
    </g>
  </svg>
);

export const SvgForestFloor = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 44)">
      <polygon points="0,25 50,50 50,56 0,31" fill="#064e3b" />
      <polygon points="50,50 100,25 100,31 50,56" fill="#022c22" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#14532d" />
      <path d="M 20,25 Q 30,15 50,20 T 80,25 Q 70,40 50,35 T 20,25 Z" fill="#064e3b" opacity="0.7"/>
      <circle cx="30" cy="15" r="8" fill="#065f46" opacity="0.6" />
      <circle cx="75" cy="25" r="10" fill="#065f46" opacity="0.6" />
      <polygon points="40,20 43,18 45,21 41,23" fill="#b45309" />
      <polygon points="60,30 64,29 62,32 58,31" fill="#92400e" />
      <polygon points="25,30 28,27 30,31 26,33" fill="#d97706" />
      <g transform="translate(15, -2)">
        <path d="M 50,25 L 50,28" stroke="#fef08a" strokeWidth="1.5" />
        <path d="M 48,25 Q 50,22 52,25 Z" fill="#ef4444" />
      </g>
    </g>
  </svg>
);

export const SvgSand = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 44)">
      <polygon points="0,25 50,50 50,56 0,31" fill="#d97706" />
      <polygon points="50,50 100,25 100,31 50,56" fill="#b45309" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#fde68a" />
      <path d="M 5,22 Q 25,10 50,22 T 95,22" fill="none" stroke="#fcd34d" strokeWidth="2.5" opacity="0.8" strokeLinecap="round" />
      <path d="M 15,32 Q 35,20 60,32 T 85,32" fill="none" stroke="#fcd34d" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <path d="M 35,12 Q 50,5 75,15" fill="none" stroke="#fcd34d" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <circle cx="20" cy="15" r="0.8" fill="#b45309" opacity="0.8" />
      <circle cx="70" cy="10" r="1.2" fill="#d97706" opacity="0.7" />
    </g>
  </svg>
);

export const SvgShallowWater = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 45)">
      <polygon points="0,25 50,50 50,55 0,30" fill="#0284c7" />
      <polygon points="50,50 100,25 100,30 50,55" fill="#0369a1" />
      <polygon points="50,0 100,25 50,50 0,25" fill="url(#grad-water)" />
      <polygon points="50,4 92,25 50,46 8,25" fill="#fde68a" opacity="0.25" />
      <path d="M 20,15 Q 30,10 40,20 T 60,20 T 80,15" fill="none" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.7" strokeLinecap="round" />
      <path d="M 25,25 Q 40,20 50,30 T 75,30" fill="none" stroke="#bae6fd" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
      <polygon points="45,10 50,8 55,10 50,12" fill="#ffffff" opacity="0.9" filter="url(#glow-effect)" />
      <polygon points="25,20 28,18 31,20 28,22" fill="#ffffff" opacity="0.8" />
    </g>
  </svg>
);

export const SvgHighland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" ><SharedDefs />
    <g transform="translate(0, 25)">
      <polygon points="0,25 50,50 50,75 0,50" fill="#44403c" />
      <polygon points="50,50 100,25 100,50 50,75" fill="#292524" />
      <polygon points="0,25 50,50 50,55 0,30" fill="#78716c" />
      <polygon points="50,50 100,25 100,30 50,55" fill="#57534e" />
      <polygon points="50,0 100,25 50,50 0,25" fill="#d6d3d1" />
      <polygon points="50,5 85,22 50,40 15,22" fill="#e7e5e4" />
      <path d="M 25,25 L 35,15 L 50,20 L 70,10 L 80,25 L 60,35 L 50,30 Z" fill="#f5f5f4" />
      <polygon points="30,20 35,18 33,23" fill="#a8a29e" />
      <polygon points="65,28 70,25 68,32" fill="#78716c" />
      <circle cx="20" cy="15" r="2.5" fill="#4ade80" opacity="0.7" />
      <circle cx="80" cy="20" r="3" fill="#22c55e" opacity="0.8" />
    </g>
  </svg>
);

// ==========================================
// 3. Nature Assets
// ==========================================
export const SvgWeed = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="12" ry="5" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M 0,2 Q -10,-20 -20,-30" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      <path d="M 0,2 Q 5,-25 15,-40" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 0,2 Q 15,-15 25,-20" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M -10,-10 Q -20,-15 -25,-10 Q -15,-5 -10,-10 Z" fill="#15803d" />
      <path d="M -15,-20 Q -25,-25 -25,-15 Q -15,-15 -15,-20 Z" fill="#16a34a" />
      <path d="M 5,-15 Q 15,-20 20,-10 Q 10,-5 5,-15 Z" fill="#22c55e" />
      <path d="M 10,-25 Q 25,-30 25,-20 Q 15,-15 10,-25 Z" fill="#4ade80" />
      <path d="M 12,-35 Q 20,-40 25,-35 Q 20,-30 12,-35 Z" fill="#86efac" />
      <path d="M -20,-30 L -25,-35 M -20,-30 L -15,-35 M -20,-30 L -22,-38" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgGrass = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="15" ry="6" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -5,2 Q -15,-15 -25,-10 Q -15,-5 -5,2 Z" fill="#15803d" />
      <path d="M 5,2 Q 20,-10 25,-5 Q 15,0 5,2 Z" fill="#16a34a" />
      <path d="M -2,2 Q -10,-25 -5,-35 Q 0,-20 -2,2 Z" fill="#16a34a" />
      <path d="M 2,2 Q 15,-20 10,-30 Q 5,-15 2,2 Z" fill="#22c55e" />
      <path d="M 0,4 Q -5,-15 0,-25 Q 5,-15 0,4 Z" fill="#4ade80" />
      <path d="M 0,4 Q 2,-10 5,-15 Q 0,-5 0,4 Z" fill="#86efac" />
    </g>
  </svg>
);

export const SvgFlower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <ellipse cx="0" cy="0" rx="10" ry="4" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -2,0 Q -10,-10 -5,-25" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
      <path d="M 2,0 Q 15,-5 20,-20" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      <path d="M -5,-10 Q -15,-15 -20,-5 Q -10,0 -5,-10 Z" fill="#22c55e" />
      <path d="M 10,-10 Q 20,-10 25,-5 Q 15,0 10,-10 Z" fill="#4ade80" />
      <g transform="translate(-5, -25)">
        <circle cx="0" cy="-6" r="5" fill="#f472b6" />
        <circle cx="5" cy="-2" r="5" fill="#ec4899" />
        <circle cx="3" cy="4" r="5" fill="#db2777" />
        <circle cx="-3" cy="4" r="5" fill="#be185d" />
        <circle cx="-5" cy="-2" r="5" fill="#fbcfe8" />
        <circle cx="0" cy="0" r="3" fill="#fef08a" />
      </g>
      <g transform="translate(20, -20) scale(0.8)">
        <circle cx="0" cy="-6" r="5" fill="#fde047" />
        <circle cx="5" cy="-2" r="5" fill="#facc15" />
        <circle cx="3" cy="4" r="5" fill="#eab308" />
        <circle cx="-3" cy="4" r="5" fill="#ca8a04" />
        <circle cx="-5" cy="-2" r="5" fill="#fef08a" />
        <circle cx="0" cy="0" r="3" fill="#f97316" />
      </g>
    </g>
  </svg>
);

export const SvgTree = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: 'visible' }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <ellipse cx="0" cy="0" rx="20" ry="10" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <path d="M -15,5 Q -5,0 -5,-10 L -4,-40 L 4,-40 L 5,-10 Q 5,0 15,5 Q 5,-2 0,0 Q -5,-2 -15,5 Z" fill="#451a03" />
      <path d="M -5,-10 L -4,-40 L 0,-40 L 0,-10 Z" fill="#78350f" opacity="0.8" />
      <path d="M -25,-40 C -45,-40 -40,-65 -20,-70 C -10,-85 10,-85 20,-70 C 40,-65 45,-40 25,-40 Z" fill="#064e3b" />
      <path d="M -20,-35 C -35,-35 -35,-55 -15,-60 C -5,-70 15,-70 20,-55 C 35,-55 35,-35 20,-35 Z" fill="#15803d" />
      <path d="M -15,-30 C -25,-30 -25,-45 -10,-50 C -5,-55 5,-55 10,-45 C 25,-45 25,-30 15,-30 Z" fill="#22c55e" />
      <circle cx="-15" cy="-50" r="8" fill="#4ade80" opacity="0.4" />
      <circle cx="5" cy="-45" r="6" fill="#4ade80" opacity="0.5" />
      <path d="M -15,-30 Q -10,-20 -5,-30 M 5,-32 Q 10,-22 15,-32" stroke="#15803d" strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

export const SvgSakura = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <ellipse cx="0" cy="0" rx="15" ry="7" fill="#be185d" opacity="0.2" />
      <path d="M -12,4 Q -2,-5 -4,-15 Q -6,-25 -2,-35 L 3,-35 Q -1,-25 1,-15 Q 3,-5 12,4 Q 2,-2 0,0 Q -2,-2 -12,4 Z" fill="#292524" />
      <circle cx="-15" cy="-45" r="18" fill="#db2777" opacity="0.8" />
      <circle cx="20" cy="-40" r="15" fill="#be185d" opacity="0.9" />
      <circle cx="-5" cy="-55" r="20" fill="#f472b6" />
      <circle cx="10" cy="-50" r="18" fill="#ec4899" />
      <circle cx="-10" cy="-60" r="14" fill="#fbcfe8" />
      <circle cx="5" cy="-65" r="12" fill="#fce7f3" />
      <circle cx="-25" cy="-20" r="1.5" fill="#fbcfe8" />
      <circle cx="25" cy="-30" r="1.5" fill="#f9a8d4" />
      <ellipse cx="-10" cy="4" rx="3" ry="1" fill="#fbcfe8" />
      <ellipse cx="8" cy="2" rx="4" ry="1.5" fill="#f9a8d4" />
    </g>
  </svg>
);

export const SvgPine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <ellipse cx="0" cy="0" rx="18" ry="9" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <path d="M -8,2 Q -3,-5 -3,-15 L -2,-50 L 2,-50 L 3,-15 Q 3,-5 8,2 Q 3,0 0,-2 Q -3,0 -8,2 Z" fill="#451a03" />
      <path d="M 0,-60 L 30,-20 L 25,-18 L 15,-22 L 10,-15 L 0,-20 L -10,-15 L -15,-22 L -25,-18 L -30,-20 Z" fill="#064e3b" />
      <path d="M 0,-60 L 0,-20 L -10,-15 L -15,-22 L -25,-18 L -30,-20 Z" fill="#065f46" />
      <path d="M 0,-70 L 25,-35 L 20,-33 L 10,-38 L 5,-30 L -5,-38 L -15,-33 L -25,-35 Z" fill="#047857" />
      <path d="M 0,-70 L 0,-35 L -5,-38 L -15,-33 L -25,-35 Z" fill="#059669" />
      <path d="M 0,-85 L 18,-50 L 12,-48 L 5,-52 L -5,-52 L -12,-48 L -18,-50 Z" fill="#10b981" />
      <path d="M 0,-85 L 0,-52 L -5,-52 L -12,-48 L -18,-50 Z" fill="#34d399" />
      <path d="M 0,-85 L -5,-70 L 0,-75 Z" fill="#6ee7b7" opacity="0.6"/>
    </g>
  </svg>
);

export const SvgRock = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="25" ry="12" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="-25,0 -15,-20 0,-35 15,-25 25,5 15,10 -15,5" fill="#334155" />
      <polygon points="0,-35 15,-25 25,5 5,0 -5,-10" fill="#1e293b" />
      <polygon points="-25,0 -15,-20 -5,-10 5,0 -15,5" fill="#475569" />
      <polygon points="-15,-20 0,-35 5,-15 -5,-10" fill="#64748b" />
      <polygon points="-15,-20 0,-35 -10,-25" fill="#94a3b8" />
      <polygon points="-5,-10 5,-15 0,-5" fill="#94a3b8" opacity="0.8"/>
      <polyline points="-15,-20 -5,-10 5,0 15,10" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.8"/>
      <path d="M -20,2 Q -15,-5 -10,0 Q -5,5 -20,2 Z" fill="#15803d" opacity="0.8"/>
      <circle cx="-12" cy="0" r="1" fill="#4ade80" />
      <polygon points="20,8 25,5 28,10 22,12" fill="#475569" />
    </g>
  </svg>
);

export const SvgBambooGrove = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <ellipse cx="0" cy="0" rx="20" ry="10" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <g transform="translate(12, -2)">
        <rect x="-2" y="-65" width="4" height="65" fill="#15803d" />
        <rect x="-2" y="-65" width="2" height="65" fill="#22c55e" />
        <line x1="-3" y1="-15" x2="3" y2="-15" stroke="#14532d" strokeWidth="1.5" />
        <line x1="-3" y1="-30" x2="3" y2="-30" stroke="#14532d" strokeWidth="1.5" />
        <line x1="-3" y1="-45" x2="3" y2="-45" stroke="#14532d" strokeWidth="1.5" />
      </g>
      <g transform="translate(-15, 2) rotate(-2)">
        <rect x="-2.5" y="-70" width="5" height="70" fill="#16a34a" />
        <rect x="-2.5" y="-70" width="2.5" height="70" fill="#4ade80" />
        <line x1="-3.5" y1="-20" x2="3.5" y2="-20" stroke="#065f46" strokeWidth="1.5" />
        <line x1="-3.5" y1="-40" x2="3.5" y2="-40" stroke="#065f46" strokeWidth="1.5" />
        <line x1="-3.5" y1="-60" x2="3.5" y2="-60" stroke="#065f46" strokeWidth="1.5" />
      </g>
      <g transform="translate(-2, 5) rotate(1)">
        <rect x="-3" y="-75" width="6" height="75" fill="#22c55e" />
        <rect x="-3" y="-75" width="3" height="75" fill="#86efac" />
        <line x1="-4" y1="-25" x2="4" y2="-25" stroke="#16a34a" strokeWidth="2" />
        <line x1="-4" y1="-50" x2="4" y2="-50" stroke="#16a34a" strokeWidth="2" />
        <path d="M 3,-30 Q 15,-35 20,-25 Q 15,-28 3,-30 Z" fill="#4ade80" />
        <path d="M 3,-55 Q 18,-65 25,-50 Q 18,-55 3,-55 Z" fill="#22c55e" />
        <path d="M -3,-40 Q -15,-45 -22,-35 Q -15,-38 -3,-40 Z" fill="#16a34a" />
        <path d="M -3,-65 Q -18,-75 -25,-60 Q -18,-65 -3,-65 Z" fill="#4ade80" />
        <path d="M 0,-75 Q 5,-85 10,-90 Q 5,-80 0,-75 Z" fill="#86efac" />
        <path d="M 0,-75 Q -5,-85 -10,-90 Q -5,-80 0,-75 Z" fill="#4ade80" />
      </g>
      <path d="M -8,5 L -5,-5 L -2,5 Z" fill="#4ade80" />
      <path d="M 5,2 L 8,-8 L 11,2 Z" fill="#22c55e" />
    </g>
  </svg>
);

// ==========================================
// 4. Structures Assets
// ==========================================
export const SvgRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="road" color="#cbd5e1" thickness={4} /></svg>;
export const SvgWater = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="water" color="#7dd3fc" thickness={4} /></svg>;


export const SvgHouse1 = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="26" ry="13" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,-4 -20,-14 -20,-30 0,-20" fill="#fdf8f6" />
      <polygon points="0,-20 -20,-30 -10,-42" fill="#fdf8f6" />
      <polygon points="0,-4 20,-14 20,-30 0,-20" fill="#e7e5e4" />
      <path d="M 0,-4 L 0,-20 M -10,-9 L -10,-42 M -20,-14 L -20,-30" stroke="#57534e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 10,-9 L 10,-25 M 20,-14 L 20,-30 M 0,-20 L 20,-30" stroke="#44403c" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="4,-10 12,-14 12,-24 4,-20" fill="#292524" />
      <polygon points="5,-11 11,-14 11,-23 5,-20" fill="#78350f" />
      <circle cx="10" cy="-18" r="0.8" fill="#fbbf24" />
      <polygon points="-16,-10 -6,-5 -6,-15 -16,-20" fill="#1c1917" />
      <polygon points="-15,-10.5 -7,-6.5 -7,-14.5 -15,-18.5" fill="url(#grad-glass)" />
      <polygon points="3,-17 24,-27.5 12,-48 -10,-41" fill="url(#grad-roof-red)" />
      <polygon points="3,-17 24,-27.5 24,-25.5 3,-15" fill="#7f1d1d" />
      <polygon points="3,-17 -10,-41 -13,-39 -1,-15" fill="#7f1d1d" />
      <g transform="translate(6, -38)">
        <polygon points="0,0 5,-2.5 5,-12 0,-9.5" fill="#78716c" />
        <polygon points="0,0 -5,-2.5 -5,-12 0,-9.5" fill="#a8a29e" />
        <polygon points="0,-9.5 -5,-12 0,-14.5 5,-12" fill="#d6d3d1" />
      </g>
    </g>
  </svg>
);

export const SvgHouse2 = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="30" ry="15" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,-3 -24,-15 -24,-35 0,-23" fill="#b45309" />
      <polygon points="0,-23 -24,-35 -12,-47" fill="#b45309" />
      <polygon points="0,-3 24,-15 24,-35 0,-23" fill="#92400e" />
      <polygon points="-18,-12 -8,-7 -8,-18 -18,-23" fill="#1e293b" />
      <polygon points="-17,-13 -9,-9 -9,-17 -17,-21" fill="#f8fafc" />
      <polygon points="4,-12 10,-15 10,-22 4,-19" fill="#1e293b" />
      <polygon points="5,-13 9,-15 9,-21 5,-19" fill="url(#grad-glass)" />
      <polygon points="14,-17 20,-20 20,-27 14,-24" fill="#1e293b" />
      <polygon points="15,-18 19,-20 19,-26 15,-24" fill="url(#grad-glass)" />
      <polygon points="3,-20 26,-31.5 14,-53 -12,-46" fill="url(#grad-roof-slate)" />
      <polygon points="3,-20 26,-31.5 26,-29.5 3,-18" fill="#334155" />
      <polygon points="3,-20 -12,-46 -15,-44 0,-18" fill="#475569" />
      <g transform="translate(10, -32)">
        <polygon points="0,0 -8,-4 -8,-12 0,-8" fill="#e2e8f0" />
        <polygon points="0,0 6,-3 6,-11 0,-8" fill="#cbd5e1" />
        <polygon points="0,-8 -8,-12 -4,-18" fill="#e2e8f0" />
        <polygon points="-6,-6 -2,-4 -2,-9 -6,-11" fill="#1e293b" />
        <polygon points="-5,-6.5 -3,-5.5 -3,-8.5 -5,-9.5" fill="url(#grad-glass)" />
      </g>
    </g>
  </svg>
);

export const SvgHouse3 = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="28" ry="14" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <polygon points="0,0 -26,-13 -4,-24 22,-11" fill="#e2e8f0" />
      <polygon points="-4,-2 -22,-11 -22,-26 -4,-17" fill="#ffffff" />
      <polygon points="-4,-2 16,-12 16,-27 -4,-17" fill="#f1f5f9" />
      <polygon points="-18,-10 -8,-5 -8,-14 -18,-19" fill="#94a3b8" />
      <polygon points="-17,-10 -9,-6 -9,-13 -17,-17" fill="url(#grad-glass)" />
      <polygon points="0,-5 12,-11 12,-22 0,-16" fill="#94a3b8" />
      <polygon points="1,-6 6,-8.5 6,-18.5 1,-16" fill="url(#grad-glass)" />
      <polygon points="6,-8.5 11,-11 11,-21 6,-18.5" fill="url(#grad-glass)" opacity="0.8"/>
      <polygon points="-4,-17 -22,-26 0,-37 16,-27" fill="#e2e8f0" />
      <polygon points="-4,-17 16,-27 16,-29 -4,-19" fill="#cbd5e1" />
      <polygon points="-4,-17 -22,-26 -22,-28 -4,-19" fill="#f8fafc" />
      <circle cx="10" cy="-18" r="1.5" fill="#4ade80" />
      <circle cx="14" cy="-15" r="1.5" fill="#4ade80" />
      <circle cx="-20" cy="-26" r="2" fill="#16a34a" />
    </g>
  </svg>
);

export const SvgShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="26" ry="13" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,-2 -20,-12 -20,-30 0,-20" fill="#fef08a" />
      <polygon points="0,-2 22,-13 22,-31 0,-20" fill="#fde047" />
      <polygon points="-16,-10 -10,-7 -10,-17 -16,-20" fill="#78350f" />
      <polygon points="-15,-10.5 -11,-8.5 -11,-16.5 -15,-18.5" fill="url(#grad-glass)" />
      <polygon points="4,-14 18,-21 18,-27 4,-20" fill="#1e293b" />
      <polygon points="5,-14.5 17,-20.5 17,-26 5,-20" fill="url(#grad-glass)" />
      <path d="M 4,-18 Q 6,-16 8,-18 Q 10,-16 12,-18 Q 14,-16 16,-18 Q 18,-16 20,-18 L 22,-27 L 4,-18 Z" fill="#ef4444" />
      <path d="M 8,-18 Q 10,-16 12,-18 L 10,-25 L 6,-23 Z" fill="#ffffff" />
      <path d="M 16,-18 Q 18,-16 20,-18 L 18,-29 L 14,-27 Z" fill="#ffffff" />
      <polygon points="0,-20 -20,-30 2,-41 22,-31" fill="#ca8a04" />
      <polygon points="0,-20 -20,-30 -20,-32 0,-22" fill="#fef08a" />
      <polygon points="0,-20 22,-31 22,-33 0,-22" fill="#fde047" />
    </g>
  </svg>
);

export const SvgSchool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="36" ry="18" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="-8,-4 -32,-16 -32,-32 -8,-20" fill="#f8fafc" />
      <polygon points="-8,-4 32,-24 32,-40 -8,-20" fill="#e2e8f0" />
      {[...Array(3)].map((_, i) => (
        <g key={`w1-${i}`} transform={`translate(${-28 + i * 8}, ${-16 + i * 4})`}>
          <polygon points="0,-3 4,-1 4,-7 0,-9" fill="#94a3b8" />
          <polygon points="1,-3.5 3,-2.5 3,-6.5 1,-7.5" fill="url(#grad-glass)" />
        </g>
      ))}
      {[...Array(4)].map((_, i) => (
        <g key={`w2-${i}`} transform={`translate(${0 + i * 8}, ${-22 - i * 4})`}>
          <polygon points="0,-3 4,-5 4,-11 0,-9" fill="#94a3b8" />
          <polygon points="1,-4.5 3,-5.5 3,-9.5 1,-8.5" fill="url(#grad-glass)" />
        </g>
      ))}
      <polygon points="-8,2 -16,-2 -16,-38 -8,-34" fill="#cbd5e1" />
      <polygon points="-8,2 8,-6 8,-42 -8,-34" fill="#94a3b8" />
      <g transform="translate(-1, -28)">
        <ellipse cx="0" cy="0" rx="4" ry="2" fill="#fef08a" />
        <circle cx="0" cy="-0.5" r="0.5" fill="#1e293b" />
        <line x1="0" y1="-0.5" x2="2" y2="-1" stroke="#1e293b" strokeWidth="0.5" />
        <line x1="0" y1="-0.5" x2="0" y2="-2" stroke="#1e293b" strokeWidth="0.5" />
      </g>
      <polygon points="-8,-34 8,-42 0,-55 -16,-47" fill="url(#grad-roof-slate)" />
      <polygon points="-8,-20 -32,-32 -20,-44 4,-32" fill="url(#grad-roof-slate)" />
      <polygon points="-8,-20 -32,-32 -32,-30 -8,-18" fill="#334155" />
      <polygon points="-8,-20 32,-40 20,-52 -20,-32" fill="url(#grad-roof-slate)" />
      <polygon points="-8,-20 32,-40 32,-38 -8,-18" fill="#475569" />
      <polygon points="-6,-1 -2,-3 -2,-10 -6,-8" fill="#78350f" />
      <polygon points="-2,-3 2,-5 2,-12 -2,-10" fill="#451a03" />
    </g>
  </svg>
);

export const SvgWall = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,0 -20,-10 -20,-30 0,-20" fill="#94a3b8" />
      <polygon points="0,0 20,-10 20,-30 0,-20" fill="#64748b" />
      <path d="M 0,-5 L -20,-15 M 0,-10 L -20,-20 M 0,-15 L -20,-25" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
      <path d="M 0,-5 L 20,-15 M 0,-10 L 20,-20 M 0,-15 L 20,-25" stroke="#475569" strokeWidth="0.5" opacity="0.3" />
      <polygon points="0,-20 -20,-30 0,-40 20,-30" fill="#475569" />
      <polygon points="0,-20 -6,-23 -6,-28 0,-25" fill="#cbd5e1" />
      <polygon points="0,-20 6,-23 6,-28 0,-25" fill="#94a3b8" />
      <polygon points="-12,-26 -18,-29 -18,-34 -12,-31" fill="#cbd5e1" />
      <polygon points="12,-26 18,-29 18,-34 12,-31" fill="#94a3b8" />
    </g>
  </svg>
);

export const SvgFence = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="18" ry="9" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <polygon points="-16,-8 -18,-9 -18,-19 -16,-18" fill="#92400e" />
      <polygon points="-16,-8 -14,-9 -14,-19 -16,-18" fill="#b45309" />
      <polygon points="0,0 -2,-1 -2,-11 0,-10" fill="#92400e" />
      <polygon points="0,0 2,-1 2,-11 0,-10" fill="#b45309" />
      <polygon points="16,8 14,7 14,-3 16,-2" fill="#92400e" />
      <polygon points="16,8 18,7 18,-3 16,-2" fill="#b45309" />
      <path d="M -16,-14 L 16,0" stroke="#b45309" strokeWidth="2" strokeOpacity="0.8" />
      <path d="M -16,-10 L 16,4" stroke="#b45309" strokeWidth="2" strokeOpacity="0.8" />
    </g>
  </svg>
);

export const SvgBridge = () => (

  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="5" rx="15" ry="5" fill="#0284c7" opacity="0.8" />
      <path d="M -25,10 Q -5,-15 25,10 L 25,20 Q -5,-5 -25,20 Z" fill="#64748b" />
      <path d="M -25,10 Q -5,-15 25,10 L 20,5 Q 0,-20 -20,5 Z" fill="#cbd5e1" />
      <path d="M -20,5 Q 0,-20 20,5" fill="none" stroke="#f8fafc" strokeWidth="1.5" opacity="0.6"/>
      <polygon points="-25,10 -27,15 -27,5 -25,0" fill="#94a3b8" />
      <polygon points="-25,0 -23,-3 -23,7 -25,10" fill="#cbd5e1" />
      <polygon points="25,10 23,15 23,5 25,0" fill="#64748b" />
      <polygon points="25,0 27,-3 27,7 25,10" fill="#94a3b8" />
      <path d="M -15,10 L -15,15 M 0,0 L 0,5 M 15,10 L 15,15" stroke="#475569" strokeWidth="1" opacity="0.5" strokeLinecap="round" />
    </g>
  </svg>
);

// ==========================================
// 5. Economy & Industry Assets
// ==========================================
export const SvgWarehouse = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="32" ry="16" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,-3 -24,-15 -24,-35 0,-23" fill="#94a3b8" />
      <polygon points="0,-23 -24,-35 -12,-41" fill="#94a3b8" />
      <polygon points="0,-3 24,-15 24,-35 0,-23" fill="#cbd5e1" />
      {[...Array(6)].map((_, i) => (
        <line key={`cl-${i}`} x1={-4 - i * 4} y1={-5 - i * 2} x2={-4 - i * 4} y2={-25 - i * 2} stroke="#64748b" strokeWidth="0.5" opacity="0.6" />
      ))}
      <polygon points="4,-7 16,-13 16,-25 4,-19" fill="#334155" />
      <polygon points="5,-8 15,-13 15,-24 5,-19" fill="#1e293b" />
      <path d="M 5,-11 L 15,-16 M 5,-14 L 15,-19 M 5,-17 L 15,-22" stroke="#0f172a" strokeWidth="1" />
      <polygon points="4,-7 16,-13 20,-11 8,-5" fill="#a8a29e" />
      <polygon points="-2,-24 26,-38 14,-44 -14,-30" fill="#71717a" />
      <polygon points="-2,-24 26,-38 26,-36 -2,-22" fill="#d4d4d8" />
      <polygon points="-2,-24 -26,-36 -26,-34 -2,-22" fill="#a1a1aa" />
      <g transform="translate(-10, -5)">
        <polygon points="0,0 -4,-2 -4,-8 0,-6" fill="#b45309" />
        <polygon points="0,0 4,-2 4,-8 0,-6" fill="#d97706" />
        <polygon points="0,-6 -4,-8 0,-10 4,-8" fill="#fcd34d" />
      </g>
    </g>
  </svg>
);

export const SvgGrandWarehouse = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="38" ry="19" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,0 -32,-16 -32,-36 0,-20" fill="#7f1d1d" />
      <polygon points="0,0 32,-16 32,-36 0,-20" fill="#b91c1c" />
      <path d="M 0,-5 L -32,-21 M 0,-10 L -32,-26 M 0,-15 L -32,-31" stroke="#450a0a" strokeWidth="0.5" opacity="0.3" />
      {[...Array(3)].map((_, i) => (
        <g key={`w-${i}`} transform={`translate(${12 + i * 8}, ${-16 - i * 4})`}>
          <path d="M -2,0 L -2,-6 Q 0,-9 2,-6 L 2,0 Z" fill="#1e293b" />
          <path d="M -1.5,-0.5 L -1.5,-5.5 Q 0,-8 1.5,-5.5 L 1.5,-0.5 Z" fill="url(#grad-glass)" />
        </g>
      ))}
      <polygon points="0,-20 -34,-37 0,-54 34,-37" fill="#52525b" />
      <polygon points="0,-20 -34,-37 -34,-35 0,-18" fill="#27272a" />
      <polygon points="0,-20 34,-37 34,-35 0,-18" fill="#71717a" />
      <g transform="translate(0, -35)">
        <polygon points="0,0 -4,-2 -4,-6 0,-4" fill="#3f3f46" />
        <polygon points="0,0 4,-2 4,-6 0,-4" fill="#71717a" />
        <polygon points="0,-4 -4,-6 0,-8 4,-6" fill="#18181b" />
      </g>
    </g>
  </svg>
);

export const SvgMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-2" rx="35" ry="17" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />
      <polygon points="0,0 -30,-15 0,-30 30,-15" fill="#d6d3d1" />
      <polygon points="0,0 30,-15 30,-12 0,3" fill="#a8a29e" />
      <polygon points="0,0 -30,-15 -30,-12 0,3" fill="#78716c" />
      {[{x:-12,y:-5,c:'#ef4444'},{x:15,y:-12,c:'#3b82f6'},{x:0,y:-22,c:'#facc15'}].map((s,i) => (
        <g key={`st-${i}`} transform={`translate(${s.x}, ${s.y})`}>
          <polygon points="0,-4 -8,-8 -8,-10 0,-6" fill="#78350f" />
          <polygon points="0,-4 8,-8 8,-10 0,-6" fill="#b45309" />
          <polygon points="0,-6 -8,-10 0,-14 8,-10" fill="#d97706" />
          <line x1="-8" y1="-8" x2="-8" y2="-20" stroke="#78350f" strokeWidth="1" />
          <line x1="8" y1="-8" x2="8" y2="-20" stroke="#78350f" strokeWidth="1" />
          <polygon points="-2,-16 -12,-21 0,-27 10,-22" fill="#f8fafc" />
          <polygon points="-2,-16 -7,-18.5 -1,-22 4,-19.5" fill={s.c} />
          <polygon points="-12,-21 -9,-19.5 -3,-23 -6,-24.5" fill={s.c} />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgPort = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-2" rx="35" ry="17" fill="#0284c7" />
      <polygon points="-35,-2 0,15 35,-2 0,-19" fill="url(#grad-water)" />
      <path d="M -15,5 Q 0,10 15,5" fill="none" stroke="#7dd3fc" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" />
      <polygon points="-35,-2 -15,-12 5,-2 -15,8" fill="#94a3b8" />
      <polygon points="-35,-2 -15,8 -15,12 -35,2" fill="#64748b" />
      <polygon points="0,-15 -10,-10 15,2.5 25,-2.5" fill="#78350f" />
      <polygon points="0,-15 15,2.5 15,5 0,-12" fill="#451a03" />
      <path d="M -8,-9 L 17,3.5 M -6,-8 L 19,4.5 M -4,-7 L 21,5.5" stroke="#451a03" strokeWidth="0.5" opacity="0.8" />
      <g transform="translate(-10, -5)">
        <polygon points="0,0 -2,-1 -2,-15 0,-14" fill="#ca8a04" />
        <polygon points="0,0 2,-1 2,-15 0,-14" fill="#facc15" />
        <polygon points="-1,-2 -1,-20 1,-19 1,-1" fill="#eab308" />
        <polygon points="0,-20 15,-28 15,-26 0,-18" fill="#facc15" />
        <line x1="14" y1="-27" x2="14" y2="-12" stroke="#1e293b" strokeWidth="0.5" />
      </g>
      <g transform="translate(8, -5)">
        <polygon points="0,0 -4,-2 -4,-8 0,-6" fill="#78350f" />
        <polygon points="0,0 4,-2 4,-8 0,-6" fill="#b45309" />
        <polygon points="0,-6 -4,-8 0,-10 4,-8" fill="#d97706" />
      </g>
    </g>
  </svg>
);

export const SvgGarden = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="garden" color="#86efac" thickness={3} /></svg>;

export const SvgSmithy = () => (

  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="26" ry="13" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="-20,-16 -20,-30 0,-20 0,-6" fill="#78350f" />
      <polygon points="0,-20 -20,-30 -10,-40" fill="#78350f" />
      <polygon points="-20,-16 -18,-17 -18,-30 -20,-30" fill="#451a03" />
      <polygon points="-2,-6 0,-7 0,-21 -2,-20" fill="#451a03" />
      <g transform="translate(-8, -10)">
        <polygon points="0,0 -8,-4 -8,-16 0,-12" fill="#334155" />
        <polygon points="0,0 8,-4 8,-16 0,-12" fill="#64748b" />
        <polygon points="0,-12 -8,-16 0,-20 8,-16" fill="#94a3b8" />
        <circle cx="0" cy="-8" r="4" fill="#f97316" filter="url(#glow-effect)" />
        <circle cx="0" cy="-8" r="2" fill="#fef08a" />
        <polygon points="0,-20 -4,-22 -4,-45 0,-43" fill="#334155" />
        <polygon points="0,-20 4,-22 4,-45 0,-43" fill="#64748b" />
        <circle cx="0" cy="-50" r="5" fill="#94a3b8" opacity="0.4" filter="url(#glow-effect)" />
        <circle cx="4" cy="-55" r="7" fill="#64748b" opacity="0.3" filter="url(#glow-effect)" />
      </g>
      <g transform="translate(8, -6)">
        <polygon points="0,0 -3,-1.5 -3,-5 0,-3.5" fill="#451a03" />
        <polygon points="0,0 3,-1.5 3,-5 0,-3.5" fill="#78350f" />
        <polygon points="0,-6.5 -2,-7.5 -2,-10 0,-9" fill="#1e293b" />
        <polygon points="0,-6.5 3,-8 3,-10 0,-9" fill="#334155" />
        <polygon points="0,-9 -4,-11 2,-14 6,-12" fill="#94a3b8" />
      </g>
      <polygon points="4,-19 24,-29 12,-43 -12,-31" fill="#451a03" />
      <polygon points="4,-19 24,-29 24,-27 4,-17" fill="#290F02" />
    </g>
  </svg>
);

export const SvgFactory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="35" ry="17" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,-3 -30,-18 -30,-38 0,-23" fill="#7f1d1d" />
      <polygon points="0,-23 -30,-38 -15,-45" fill="#7f1d1d" />
      <polygon points="0,-3 30,-18 30,-38 0,-23" fill="#b91c1c" />
      <polygon points="0,-23 -30,-38 -30,-40 0,-25" fill="#450a0a" />
      <polygon points="0,-23 30,-38 30,-40 0,-25" fill="#7f1d1d" />
      <g transform="translate(-15, -15)">
        <polygon points="0,0 -10,-5 -10,-15 0,-10" fill="#1e293b" />
        <polygon points="0,-0.5 -9.5,-5.5 -9.5,-14.5 0,-9.5" fill="url(#grad-glass)" />
        <line x1="-5" y1="-2.5" x2="-5" y2="-12.5" stroke="#475569" strokeWidth="0.5" />
      </g>
      <g transform="translate(5, -10)">
        <polygon points="0,0 10,-5 10,-15 0,-10" fill="#1e293b" />
        <polygon points="0,-0.5 9.5,-5.5 9.5,-14.5 0,-9.5" fill="url(#grad-glass)" />
        <line x1="5" y1="-2.5" x2="5" y2="-12.5" stroke="#475569" strokeWidth="0.5" />
      </g>
      <g transform="translate(-18, -35)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" />
        <polygon points="0,-33 -4,-35 0,-37 4,-35" fill="#450a0a" />
        <circle cx="0" cy="-45" r="6" fill="#cbd5e1" opacity="0.6" filter="url(#glow-effect)" />
        <circle cx="-5" cy="-55" r="8" fill="#94a3b8" opacity="0.5" filter="url(#glow-effect)" />
      </g>
      <g transform="translate(-6, -41)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" />
        <polygon points="0,-33 -4,-35 0,-37 4,-35" fill="#450a0a" />
        <circle cx="2" cy="-42" r="5" fill="#cbd5e1" opacity="0.6" filter="url(#glow-effect)" />
      </g>
      <polygon points="0,-3 -8,-7 -8,-15 0,-11" fill="#1e293b" />
      <polygon points="-1,-4 -7,-7 -7,-14 -1,-11" fill="#475569" />
    </g>
  </svg>
);

export const SvgWatermill = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="0" rx="25" ry="12" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="-30,5 -10,15 20,0 0,-10" fill="url(#grad-water)" opacity="0.8" />
      <polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#64748b" />
      <polygon points="0,0 16,-8 16,-20 0,-12" fill="#94a3b8" />
      <g transform="translate(-16, -8)">
        <ellipse cx="0" cy="0" rx="4" ry="12" fill="#451a03" />
        <ellipse cx="-4" cy="2" rx="4" ry="12" fill="#78350f" />
        <ellipse cx="-4" cy="2" rx="1" ry="3" fill="#b45309" />
        <line x1="-4" y1="-10" x2="-4" y2="14" stroke="#451a03" strokeWidth="1" />
        <line x1="-8" y1="2" x2="0" y2="2" stroke="#451a03" strokeWidth="1" />
        <line x1="-6" y1="-7" x2="-2" y2="11" stroke="#451a03" strokeWidth="1" />
        <line x1="-6" y1="11" x2="-2" y2="-7" stroke="#451a03" strokeWidth="1" />
        <circle cx="0" cy="14" r="2" fill="#e0f2fe" opacity="0.8" filter="url(#glow-effect)" />
      </g>
      <polygon points="0,-14 -16,-22 -16,-34 0,-26" fill="#fdf8f6" />
      <polygon points="0,-14 16,-22 16,-34 0,-26" fill="#f8fafc" />
      <polygon points="0,-14 -2,-15 -2,-27 0,-26" fill="#451a03" />
      <polygon points="0,-14 -16,-22 -16,-20 0,-12" fill="#451a03" />
      <line x1="-8" y1="-18" x2="-8" y2="-30" stroke="#451a03" strokeWidth="1.5" />
      <polygon points="2,-26 18,-34 8,-44 -10,-38" fill="#a16207" />
      <polygon points="2,-26 18,-34 18,-32 2,-24" fill="#713f12" />
    </g>
  </svg>
);

export const SvgMine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-2" rx="30" ry="15" fill="#020617" opacity="0.5" filter="url(#soft-shadow)" />
      <polygon points="-25,-5 -15,-30 0,-45 20,-35 30,-10 15,5 -10,5" fill="#334155" />
      <polygon points="0,-45 20,-35 30,-10 15,5 0,0 -10,-20" fill="#475569" />
      <polygon points="20,-35 30,-10 25,-5 10,-20" fill="#64748b" />
      <path d="M -10,0 C -10,-20 10,-20 10,0 L 0,5 Z" fill="#020617" />
      <polygon points="-12,-2 -10,-1 -10,-18 -12,-19" fill="#451a03" />
      <polygon points="-10,-1 -8,-2 -8,-17 -10,-18" fill="#78350f" />
      <polygon points="12,-2 10,-1 10,-18 12,-19" fill="#451a03" />
      <polygon points="10,-1 8,-2 8,-17 10,-18" fill="#78350f" />
      <polygon points="-14,-19 14,-19 12,-16 -12,-16" fill="#451a03" />
      <polygon points="-12,-16 12,-16 10,-14 -10,-14" fill="#78350f" />
      <line x1="-4" y1="-2" x2="-20" y2="6" stroke="#94a3b8" strokeWidth="1.5" />
      <line x1="4" y1="2" x2="-12" y2="10" stroke="#94a3b8" strokeWidth="1.5" />
      <g transform="translate(-10, 4)">
        <polygon points="-6,-4 0,-7 6,-4 0,-1" fill="#64748b" />
        <polygon points="-6,-4 0,-1 0,3 -6,0" fill="#475569" />
        <polygon points="0,-1 6,-4 6,0 0,3" fill="#94a3b8" />
        <circle cx="-1" cy="-5" r="1.5" fill="#fbbf24" filter="url(#glow-effect)" />
        <circle cx="0" cy="-3" r="1.5" fill="#fcd34d" />
      </g>
      <circle cx="15" cy="-5" r="1.5" fill="#fbbf24" filter="url(#glow-effect)" />
    </g>
  </svg>
);

// ==========================================
// 6. Special & Mega Assets
// ==========================================
export const SvgCastle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="36" ry="18" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,0 -28,-14 -28,-24 0,-10" fill="#64748b" />
      <polygon points="0,0 28,-14 28,-24 0,-10" fill="#94a3b8" />
      {[...Array(5)].map((_, i) => (
        <g key={`cl-${i}`} transform={`translate(${-24 + i*5}, ${-13 + i*2.5})`}>
          <polygon points="0,-10 -3,-11.5 -3,-14 0,-12.5" fill="#475569" />
          <polygon points="0,-10 3,-11.5 3,-14 0,-12.5" fill="#94a3b8" />
        </g>
      ))}
      {[{x:-28,y:-14},{x:28,y:-14},{x:-14,y:-28},{x:14,y:-28}].map((t, i) => (
        <g key={`t-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <path d="M -6,0 L -6,-25 C -6,-28 6,-28 6,-25 L 6,0 C 6,3 -6,3 -6,0 Z" fill="#94a3b8" />
          <polygon points="-8,-24 8,-24 0,-40" fill="url(#grad-roof-blue)" />
        </g>
      ))}
      <g transform="translate(0, -18)">
        <polygon points="0,0 -16,-8 -16,-30 0,-22" fill="#e2e8f0" />
        <polygon points="0,0 16,-8 16,-30 0,-22" fill="#f8fafc" />
        <polygon points="-18,-28 0,-20 0,-50" fill="url(#grad-roof-blue)" />
        <polygon points="18,-28 0,-20 0,-50" fill="#1e3a8a" />
        <line x1="0" y1="-50" x2="0" y2="-62" stroke="#fbbf24" strokeWidth="1.5" />
        <polygon points="0,-60 8,-58 0,-56" fill="#ef4444" />
      </g>
      <polygon points="-6,-3 6,-9 6,-18 -6,-12" fill="#475569" />
      <path d="M -4,-4 L 4,-8 L 4,-14 C 4,-16 -4,-12 -4,-10 Z" fill="#020617" />
      <polygon points="-4,-4 4,-8 10,2 2,6" fill="#78350f" />
    </g>
  </svg>
);

export const SvgGoldCastle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-5" rx="38" ry="19" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="-5,5 5,0 15,20 5,25" fill="#b91c1c" />
      <polygon points="-3,5 3,2 13,20 7,23" fill="#ef4444" />
      <polygon points="0,0 -30,-15 -30,-25 0,-10" fill="#d97706" />
      <polygon points="0,0 30,-15 30,-25 0,-10" fill="url(#grad-gold)" />
      {[{x:-30,y:-15},{x:30,y:-15},{x:-15,y:-30},{x:15,y:-30}].map((t, i) => (
        <g key={`gt-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <path d="M -6,0 L -6,-30 C -6,-33 6,-33 6,-30 L 6,0 C 6,3 -6,3 -6,0 Z" fill="url(#grad-gold)" />
          <polygon points="-8,-29 8,-29 0,-48" fill="url(#grad-roof-red)" />
          <circle cx="0" cy="-49" r="2" fill="#fbbf24" filter="url(#glow-effect)" />
        </g>
      ))}
      <g transform="translate(0, -20)">
        <polygon points="0,0 -18,-9 -18,-35 0,-26" fill="#e2e8f0" />
        <polygon points="0,0 18,-9 18,-35 0,-26" fill="#ffffff" />
        <polygon points="-20,-33 0,-23 0,-60" fill="url(#grad-roof-red)" />
        <polygon points="20,-33 0,-23 0,-60" fill="#7f1d1d" />
        <polyline points="-20,-33 0,-23 20,-33" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="0" cy="-62" r="3" fill="#fbbf24" filter="url(#glow-effect)" />
      </g>
      <polygon points="-8,-4 8,-12 8,-22 -8,-14" fill="#fcd34d" />
      <path d="M -5,-7 L 5,-12 L 5,-18 C 5,-20 -5,-15 -5,-13 Z" fill="#020617" />
    </g>
  </svg>
);

export const SvgTorii = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <g transform="translate(-16, -8)">
        <polygon points="0,0 -4,-2 -4,-6 0,-4" fill="#64748b" />
        <polygon points="0,0 4,-2 4,-6 0,-4" fill="#94a3b8" />
        <polygon points="0,-4 -4,-6 0,-8 4,-6" fill="#cbd5e1" />
      </g>
      <g transform="translate(16, 8)">
        <polygon points="0,0 -4,-2 -4,-6 0,-4" fill="#64748b" />
        <polygon points="0,0 4,-2 4,-6 0,-4" fill="#94a3b8" />
        <polygon points="0,-4 -4,-6 0,-8 4,-6" fill="#cbd5e1" />
      </g>
      <polygon points="-18,-13 -14,-15 -14,-45 -18,-43" fill="#b91c1c" />
      <polygon points="-14,-15 -12,-14 -12,-44 -14,-45" fill="#ef4444" />
      <polygon points="14,-3 18,-5 18,-35 14,-33" fill="#b91c1c" />
      <polygon points="18,-5 20,-4 20,-34 18,-35" fill="#ef4444" />
      <polygon points="-24,-29 24,-5 24,-8 -24,-32" fill="#b91c1c" />
      <path d="M -15,-36 Q 0,-34 16,-20" fill="none" stroke="#fcd34d" strokeWidth="2.5" strokeLinecap="round" filter="url(#soft-shadow)" />
      <polygon points="-5,-31 -7,-28 -5,-27 -7,-24 -5,-23" fill="#ffffff" />
      <polygon points="5,-25 3,-22 5,-21 3,-18 5,-17" fill="#ffffff" />
      <path d="M -30,-41 Q 0,-33 30,-11 L 30,-14 Q 0,-36 -30,-44 Z" fill="#b91c1c" />
      <path d="M -32,-46 Q 0,-38 28,-16 L 32,-18 Q 0,-42 -34,-50 Z" fill="#1e293b" />
      <polygon points="-2,-34 2,-32 2,-25 -2,-27" fill="#fef08a" />
      <polygon points="-1.5,-33.5 1.5,-32 1.5,-25.5 -1.5,-27" fill="#1c1917" />
    </g>
  </svg>
);

export const SvgTemple = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-2" rx="34" ry="17" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" />
      <polygon points="0,0 -28,-14 -28,-18 0,-4" fill="#78716c" />
      <polygon points="0,0 28,-14 28,-18 0,-4" fill="#a8a29e" />
      <polygon points="0,-4 -28,-18 0,-32 28,-18" fill="#e7e5e4" />
      <polygon points="-14,-13 -4,-18 -4,-28 -14,-23" fill="#f8fafc" />
      <polygon points="14,-13 4,-18 4,-28 14,-23" fill="#e2e8f0" />
      <path d="M -32,-26 Q 0,-15 32,-26 L 30,-28 Q 0,-18 -30,-28 Z" fill="#1c1917" />
      <path d="M 0,-50 Q -15,-30 -32,-26 Q 0,-38 0,-50" fill="#292524" />
      <path d="M 0,-50 Q 15,-30 32,-26 Q 0,-38 0,-50" fill="#44403c" />
      <path d="M -20,-40 Q 0,-32 20,-40 L 18,-42 Q 0,-35 -18,-42 Z" fill="#1c1917" />
      <path d="M 0,-65 Q -10,-45 -20,-40 Q 0,-52 0,-65" fill="#292524" />
      <path d="M 0,-65 Q 10,-45 20,-40 Q 0,-52 0,-65" fill="#44403c" />
      <circle cx="0" cy="-66" r="2" fill="#fbbf24" filter="url(#glow-effect)" />
      <circle cx="-16" cy="-22" r="2" fill="#ef4444" filter="url(#glow-effect)" />
      <circle cx="16" cy="-22" r="2" fill="#ef4444" filter="url(#glow-effect)" />
    </g>
  </svg>
);

export const SvgDragon = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)">
      <ellipse cx="0" cy="5" rx="20" ry="10" fill="#020617" opacity="0.5" />
      <polygon points="-15,5 0,-10 15,0 10,10 -5,12" fill="#334155" />
      <path d="M -10,8 C -25,5 -20,-10 -5,-5 C 5,-2 15,-5 20,-15 C 25,-25 10,-35 0,-25" fill="none" stroke="#047857" strokeWidth="6" strokeLinecap="round" />
      <path d="M -10,8 C -25,5 -20,-10 -5,-5 C 5,-2 15,-5 20,-15 C 25,-25 10,-35 0,-25" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
      <path d="M -16,4 L -20,2 M -18,-2 L -23,-5 M -12,-8 L -15,-12 M 8,-8 L 10,-13 M 18,-12 L 23,-15 M 12,-28 L 15,-33" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 0,-20 Q -25,-40 -35,-25 Q -15,-20 0,-15 Z" fill="#065f46" opacity="0.9" />
      <path d="M 5,-22 Q 25,-50 35,-35 Q 20,-25 10,-20 Z" fill="#064e3b" opacity="0.9" />
      <path d="M 0,-25 C -10,-15 -25,-30 -15,-45" fill="none" stroke="#047857" strokeWidth="7" strokeLinecap="round" />
      <path d="M 0,-25 C -10,-15 -25,-30 -15,-45" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" />
      <polygon points="-15,-45 -22,-40 -25,-48 -18,-52 -10,-48" fill="#10b981" />
      <path d="M -12,-50 Q -5,-55 -8,-60 M -18,-52 Q -15,-58 -20,-62" fill="none" stroke="#fcd34d" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-18" cy="-46" r="1.5" fill="#ef4444" filter="url(#glow-effect)" />
      <path d="M -23,-43 C -30,-35 -35,-40 -40,-35 C -45,-30 -35,-25 -30,-30 C -25,-35 -20,-35 -23,-43 Z" fill="#f97316" filter="url(#glow-effect)" opacity="0.8" />
      <path d="M -24,-42 C -28,-38 -32,-38 -35,-35 C -38,-32 -32,-30 -30,-32 C -27,-34 -25,-36 -24,-42 Z" fill="#fef08a" />
    </g>
  </svg>
);


export const SvgMegaGrandMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="46" ry="23" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,5 -42,-16 0,-37 42,-16" fill="#cbd5e1" /><polygon points="0,5 42,-16 42,-12 0,9" fill="#94a3b8" /><g transform="translate(0, -16)"><polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#f1f5f9" /><polygon points="0,0 16,-8 16,-20 0,-12" fill="#e2e8f0" /><polygon points="0,-12 -16,-20 0,-36 16,-20" fill="url(#grad-glass)" opacity="0.7" /><path d="M -16,-20 Q 0,-40 16,-20" fill="none" stroke="#94a3b8" strokeWidth="1.5" /><circle cx="0" cy="-46" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgMegaFortress = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="42" ry="21" fill="#020617" opacity="0.5" filter="url(#soft-shadow)" /><polygon points="0,3 -35,-14.5 0,-32 35,-14.5" fill="#dc2626" /><polygon points="0,-2 -25,-14.5 -25,-25 0,-12.5" fill="#1e293b" /><polygon points="0,-2 25,-14.5 25,-25 0,-12.5" fill="#334155" /><polygon points="0,-12 -20,-22 -20,-38 0,-28" fill="#334155" /><polygon points="0,-12 20,-22 20,-38 0,-28" fill="#475569" /><g transform="translate(0, -32)"><polygon points="0,0 -12,-6 -12,-30 0,-24" fill="#0f172a" /><polygon points="0,0 12,-6 12,-30 0,-24" fill="#1e293b" /><polygon points="0,-24 -15,-31.5 0,-39 15,-31.5" fill="#b91c1c" /><polygon points="-12,-15 -12,-6 -8,-10 -8,-17" fill="#ef4444" /><polygon points="12,-15 12,-6 8,-10 8,-17" fill="#dc2626" /></g></g></svg>);

export const SvgMegaAcademy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="42" ry="21" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,4 -38,-15 0,-34 38,-15" fill="#22c55e" /><polygon points="0,4 38,-15 38,-11 0,8" fill="#16a34a" /><path d="M 0,2 L -15,-5.5 M 0,2 L 15,-5.5 M 0,2 L 0,-12.5" stroke="#f1f5f9" strokeWidth="3" strokeLinecap="round" opacity="0.8" /><g transform="translate(0, -18)"><polygon points="0,0 -14,-7 -14,-25 0,-18" fill="#e2e8f0" /><polygon points="0,0 14,-7 14,-25 0,-18" fill="#f8fafc" /><path d="M -12,-32 C -12,-48 12,-48 12,-32" fill="url(#grad-glass)" opacity="0.9" /><line x1="6" y1="-38" x2="16" y2="-46" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" /></g><g transform="translate(0, -65)"><polygon points="0,-8 -4,0 0,8 4,0" fill="#34d399" filter="url(#glow-effect)" opacity="0.9" /><ellipse cx="0" cy="0" rx="14" ry="4" fill="none" stroke="#6ee7b7" strokeWidth="1" transform="rotate(15)" opacity="0.8" filter="url(#glow-effect)"/></g><circle cx="-25" cy="-2" r="3" fill="#10b981" filter="url(#soft-shadow)" /><circle cx="25" cy="-2" r="3" fill="#059669" filter="url(#soft-shadow)" /></g></svg>);

export const SvgMegaImperialPalace = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="42" ry="21" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,2 -35,-15.5 -35,-20 0,-2.5" fill="#94a3b8" /><polygon points="0,2 35,-15.5 35,-20 0,-2.5" fill="#cbd5e1" /><polygon points="0,-2.5 -35,-20 0,-37.5 35,-20" fill="#e2e8f0" /><polygon points="-4,0 4,-4 4,-26 -4,-22" fill="#f8fafc" /><g transform="translate(0, -25)"><polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#991b1b" /><polygon points="0,0 16,-8 16,-20 0,-12" fill="#b91c1c" /><path d="M -22,-16 Q 0,-2 22,-16 L 20,-18 Q 0,-6 -20,-18 Z" fill="url(#grad-gold)" /><polygon points="0,-14 -16,-22 0,-30 16,-22" fill="#fcd34d" /><polygon points="0,-14 -10,-19 -10,-27 0,-22" fill="#991b1b" /><polygon points="0,-14 10,-19 10,-27 0,-22" fill="#b91c1c" /><path d="M -16,-24 Q 0,-14 16,-24" fill="url(#grad-gold)" /><polygon points="0,-22 -10,-30 0,-38 10,-30" fill="#fcd34d" /><circle cx="0" cy="-39" r="2.5" fill="#fef08a" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgMegaWonder = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="35" ry="17" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-3 -30,-18 0,-33 30,-18" fill="#fcd34d" /><polygon points="0,-9 -22,-20 0,-31 22,-20" fill="#fef08a" /><polygon points="0,-15 -14,-22 0,-29 14,-22" fill="#fffbeb" /><g transform="translate(0, -45)" filter="url(#strong-shadow)"><polygon points="0,-25 -15,0 0,25 15,0" fill="#38bdf8" filter="url(#glow-effect)" opacity="0.6" /><polygon points="0,-25 -15,0 0,5" fill="#bae6fd" opacity="0.9" /><polygon points="0,-25 15,0 0,5" fill="#0284c7" opacity="0.8" /><polygon points="0,25 -15,0 0,5" fill="#0369a1" opacity="0.9" /><polygon points="0,25 15,0 0,5" fill="#0c4a6e" opacity="0.8" /><ellipse cx="0" cy="0" rx="24" ry="6" fill="none" stroke="url(#grad-gold)" strokeWidth="1.5" transform="rotate(20)" filter="url(#glow-effect)" /></g><path d="M -2,-15 L 2,-15 L 1,-25 L -1,-25 Z" fill="#bae6fd" filter="url(#glow-effect)" opacity="0.8" /></g></svg>);

export const SvgMegaHarborTown = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="40" ry="20" fill="#0369a1" /><polygon points="-40,-2 0,18 40,-2 0,-22" fill="url(#grad-water)" /><polygon points="-40,-2 -10,-17 0,-12 -30,3" fill="#94a3b8" /><polygon points="-40,-2 -30,3 -30,8 -40,3" fill="#64748b" /><polygon points="40,-2 10,-17 0,-12 30,3" fill="#94a3b8" /><g transform="translate(0, 4)"><path d="M -12,-2 C -15,5 -5,8 10,5 C 15,3 18,-2 15,-6 C 5,-4 -5,-4 -12,-2 Z" fill="#78350f" /><path d="M -12,-2 C -5,-4 5,-4 15,-6 L 12,-10 C 5,-8 -5,-8 -10,-6 Z" fill="#b45309" /><line x1="-2" y1="-5" x2="-2" y2="-22" stroke="#451a03" strokeWidth="1.5" /><path d="M -2,-20 C -8,-15 -8,-10 -2,-8 C 4,-10 4,-15 -2,-20 Z" fill="#fdf8f6" opacity="0.9" /></g><g transform="translate(20, -8) scale(0.9)"><path d="M -6,-6 L -4,-30 C -4,-31 4,-31 4,-30 L 6,-6" fill="#f8fafc" /><path d="M -5,-12 L -4,-18 C -4,-19 4,-19 4,-18 L 5,-12" fill="#ef4444" /><polygon points="-5,-36 5,-36 0,-42" fill="#1e293b" /><circle cx="0" cy="-33" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgMegaShrineComplex = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="42" ry="21" fill="#064e3b" opacity="0.8" filter="url(#soft-shadow)" /><polygon points="0,2 -38,-17 0,-36 38,-17" fill="#15803d" /><polygon points="0,2 38,-17 38,-13 0,6" fill="#16a34a" /><polygon points="-8,-2 8,-2 16,-6 -16,-6" fill="#e2e8f0" /><g transform="translate(0, -30)"><polygon points="0,-4 -20,-14 0,-24 20,-14" fill="#e7e5e4" /><polygon points="-14,-13 -4,-18 -4,-28 -14,-23" fill="#f8fafc" /><polygon points="14,-13 4,-18 4,-28 14,-23" fill="#e2e8f0" /><path d="M -24,-18 Q 0,-8 24,-18" fill="none" stroke="#1c1917" strokeWidth="2" /><path d="M 0,-40 Q -12,-25 -24,-18 Q 0,-28 0,-40" fill="#292524" /><path d="M 0,-40 Q 12,-25 24,-18 Q 0,-28 0,-40" fill="#44403c" /><circle cx="0" cy="-41" r="1.5" fill="#fbbf24" filter="url(#glow-effect)" /></g><circle cx="-25" cy="-12" r="8" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="-20" cy="-18" r="7" fill="#f472b6" /><circle cx="30" cy="-5" r="7" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="25" cy="0" r="6" fill="#f9a8d4" /></g></svg>);

export const SvgCherryPavilion = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="28" ry="14" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-5 -18,-14 0,-23 18,-14" fill="#b45309" /><path d="M -24,-24 Q 0,-15 24,-24" fill="none" stroke="#db2777" strokeWidth="2" /><path d="M 0,-45 Q -12,-30 -24,-24 Q 0,-35 0,-45" fill="#9d174d" /><path d="M 0,-45 Q 12,-30 24,-24 Q 0,-35 0,-45" fill="#be185d" /><circle cx="0" cy="-46" r="1.5" fill="#fcd34d" filter="url(#glow-effect)" /><circle cx="-25" cy="-10" r="6" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="-20" cy="-15" r="5" fill="#f9a8d4" /><circle cx="22" cy="-5" r="7" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="18" cy="-12" r="5" fill="#f9a8d4" /></g></svg>);

export const SvgCrystalTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="-15,0 -5,-10 15,-5 5,5" fill="#334155" /><polygon points="-10,-5 -5,-25 0,-5" fill="#38bdf8" opacity="0.8" filter="url(#glow-effect)" /><polygon points="10,-2 15,-18 5,-8" fill="#818cf8" opacity="0.8" filter="url(#glow-effect)" /><polygon points="-5,-10 0,-60 5,-15" fill="#a7f3d0" opacity="0.9" filter="url(#glow-effect)" /><polygon points="-5,-10 0,-60 -12,-20" fill="#34d399" opacity="0.8" /><polygon points="5,-15 0,-60 12,-25" fill="#059669" opacity="0.7" /><polygon points="-2,-15 0,-50 2,-15" fill="#ffffff" filter="url(#glow-effect)" opacity="0.9" /><polygon points="-18,-40 -15,-50 -12,-42" fill="#38bdf8" filter="url(#glow-effect)" /><polygon points="15,-35 20,-45 18,-33" fill="#818cf8" filter="url(#glow-effect)" /><circle cx="0" cy="-65" r="2" fill="#a7f3d0" filter="url(#glow-effect)" /></g></svg>);

export const SvgPhilosophersLab = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="0,-15 -14,-22 -14,-45 0,-38" fill="#475569" /><polygon points="0,-15 14,-22 14,-45 0,-38" fill="#64748b" /><polygon points="0,-15 -20,-25 0,-35 20,-25" fill="#cbd5e1" /><polygon points="-8,-28 -8,-36 -4,-34 -4,-26" fill="#fcd34d" filter="url(#glow-effect)" opacity="0.8" /><polygon points="4,-24 8,-22 8,-30 4,-32" fill="#c084fc" filter="url(#glow-effect)" opacity="0.8" /><polygon points="-16,-44 0,-36 0,-60" fill="#6366f1" /><polygon points="16,-44 0,-36 0,-60" fill="#4f46e5" /><polygon points="-10,-35 -14,-37 -14,-48 -10,-46" fill="#334155" /><circle cx="-14" cy="-52" r="4" fill="#a855f7" filter="url(#glow-effect)" opacity="0.6" /><circle cx="-18" cy="-58" r="5" fill="#c084fc" filter="url(#glow-effect)" opacity="0.4" /></g></svg>);

export const SvgDragonShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="-8,-12 -22,-19 -22,-23 -8,-16" fill="#475569" /><polygon points="-8,-12 12,-22 12,-26 -8,-16" fill="#64748b" /><polygon points="-8,-16 -22,-23 0,-34 12,-26" fill="#cbd5e1" /><polygon points="-4,-18 -14,-23 -14,-32 -4,-27" fill="#f8fafc" /><polygon points="-4,-18 6,-23 6,-32 -4,-27" fill="#e2e8f0" /><path d="M -20,-30 Q -4,-22 12,-30" fill="none" stroke="#065f46" strokeWidth="2" /><path d="M -4,-50 Q -14,-35 -20,-30 Q -4,-38 -4,-50" fill="#047857" /><path d="M -4,-50 Q 6,-35 12,-30 Q -4,-38 -4,-50" fill="#059669" /><circle cx="-16" cy="-25" r="2.5" fill="#34d399" filter="url(#glow-effect)" /><circle cx="8" cy="-25" r="2.5" fill="#34d399" filter="url(#glow-effect)" /></g></svg>);

export const SvgPerfectMonument = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,-5 -20,-15 0,-25 20,-15" fill="#0f172a" /><polygon points="0,-8.5 -15,-16 0,-23.5 15,-16" fill="#1e293b" /><g transform="translate(0, -40)" filter="url(#strong-shadow)"><circle cx="0" cy="0" r="16" fill="url(#grad-gold)" /><circle cx="-4" cy="-4" r="14" fill="#fcd34d" opacity="0.6" /><circle cx="-6" cy="-6" r="6" fill="#ffffff" filter="url(#glow-effect)" opacity="0.8" /><ellipse cx="0" cy="0" rx="22" ry="6" fill="none" stroke="#fef08a" strokeWidth="1" transform="rotate(15)" filter="url(#glow-effect)" opacity="0.9" /></g><path d="M 0,-23 L 0,-26" stroke="#fef08a" strokeWidth="2" filter="url(#glow-effect)" opacity="0.5" /></g></svg>);

export const SvgHotSpring = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="-20,5 -30,-5 -20,-15 -5,-20 15,-15 25,-5 15,5 0,10" fill="#64748b" /><polygon points="0,10 -20,5 15,5" fill="#94a3b8" /><path d="M -22,-5 C -15,-12 5,-15 18,-5 C 10,2 -10,2 -22,-5 Z" fill="url(#grad-water)" opacity="0.9" /><circle cx="-15" cy="-8" r="3" fill="#475569" /><circle cx="12" cy="-2" r="2.5" fill="#64748b" /><path d="M -5,-10 Q -10,-20 -5,-30" stroke="#f1f5f9" strokeWidth="2" fill="none" opacity="0.6" filter="url(#glow-effect)" strokeLinecap="round" /><path d="M 8,-5 Q 15,-15 8,-25" stroke="#e2e8f0" strokeWidth="2.5" fill="none" opacity="0.5" filter="url(#glow-effect)" strokeLinecap="round" /><polygon points="20,-10 18,-12 18,-16 20,-14" fill="#b91c1c" /><polygon points="20,-10 22,-12 22,-16 20,-14" fill="#ef4444" /><polygon points="20,-14 18,-16 20,-18 22,-16" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgObservatory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="20" ry="10" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><path d="M -16,0 L -16,-25 C -16,-28 16,-28 16,-25 L 16,0 C 16,4 -16,4 -16,0 Z" fill="#94a3b8" /><path d="M 0,0 L 0,-25 C 0,-28 16,-28 16,-25 L 16,0 C 16,4 0,4 0,0 Z" fill="#64748b" /><path d="M -16,-30 C -16,-55 16,-55 16,-30" fill="#0f766e" /><path d="M 0,-30 C 0,-55 16,-55 16,-30" fill="#065f46" /><path d="M -4,-30 L -4,-50 C 0,-52 4,-50 4,-30 Z" fill="#020617" /><g transform="translate(0, -40)"><polygon points="0,0 -20,-15 -22,-12 -2,-3" fill="#cbd5e1" /><polygon points="0,0 2,-3 -20,-18 -22,-15" fill="#f8fafc" /><polygon points="-20,-15 -22,-12 -26,-15 -24,-18" fill="#3b82f6" opacity="0.8" /></g><polygon points="-4,-10 -4,-18 4,-18 4,-10" fill="#1e293b" /><polygon points="-3,-11 -3,-17 3,-17 3,-11" fill="url(#grad-glass)" /></g></svg>);

export const SvgShoppingStreet = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="-10,5 -35,-10 10,-35 35,-20" fill="#94a3b8" /><polygon points="-5,2 -25,-10 5,-28 25,-16" fill="#cbd5e1" /><g transform="translate(-20, -10)"><polygon points="0,0 -12,-7 -12,-20 0,-13" fill="#ffedd5" /><polygon points="0,0 8,-4 8,-17 0,-13" fill="#fed7aa" /><polygon points="0,-13 -12,-20 -4,-24 8,-17" fill="#fdba74" /><polygon points="-1,-5 9,-10 7,-12 -3,-7" fill="#ef4444" /></g><g transform="translate(-14, -14)"><polygon points="0,0 -12,-7 -12,-20 0,-13" fill="#fef3c7" /><polygon points="0,0 8,-4 8,-17 0,-13" fill="#fde68a" /><polygon points="0,-13 -12,-20 -4,-24 8,-17" fill="#fcd34d" /><polygon points="-1,-5 9,-10 7,-12 -3,-7" fill="#3b82f6" /></g><g transform="translate(10, -25)"><polygon points="0,0 -12,-7 -12,-20 0,-13" fill="#ecfccb" /><polygon points="0,0 8,-4 8,-17 0,-13" fill="#d9f99d" /><polygon points="0,-13 -12,-20 -4,-24 8,-17" fill="#bef264" /><polygon points="-11,-7 1,-1 3,-3 -9,-9" fill="#22c55e" /></g></g></svg>);

export const SvgZenGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="0,-3 -26,-16 0,-29 26,-16" fill="#fef08a" /><polygon points="0,0 -26,-13 -26,-16 0,-3" fill="#92400e" /><polygon points="0,0 26,-13 26,-16 0,-3" fill="#b45309" /><path d="M -20,-16 L 0,-26 L 20,-16 L 0,-6 Z" fill="none" stroke="#fde047" strokeWidth="0.5" /><path d="M -15,-13.5 L 0,-21 L 15,-13.5 L 0,-6 Z" fill="none" stroke="#fde047" strokeWidth="0.5" /><path d="M -10,-11 L 0,-16 L 10,-11 L 0,-6 Z" fill="none" stroke="#fde047" strokeWidth="0.5" /><ellipse cx="-8" cy="-18" rx="5" ry="2.5" fill="none" stroke="#fde047" strokeWidth="0.5" /><ellipse cx="12" cy="-12" rx="4" ry="2" fill="none" stroke="#fde047" strokeWidth="0.5" /><g transform="translate(-8, -18)"><polygon points="-3,0 -1,-4 2,-3 3,1 0,2" fill="#475569" /><circle cx="-1" cy="1" r="1.5" fill="#15803d" opacity="0.8" /></g><g transform="translate(12, -12)"><polygon points="-2,0 -1,-3 2,-2 2,1" fill="#334155" /><circle cx="-1" cy="0" r="1.2" fill="#15803d" opacity="0.8" /></g></g></svg>);

export const SvgNationalLibrary = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="38" ry="19" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-4 -32,-20 0,-36 32,-20" fill="#cbd5e1" /><polygon points="0,-15 -28,-29 -28,-45 0,-31" fill="#fde68a" /><polygon points="0,-15 28,-29 28,-45 0,-31" fill="#fef08a" /><polygon points="0,-33 -30,-48 0,-60 30,-48" fill="#d6d3d1" /><polygon points="0,-31 -30,-46 -30,-48 0,-33" fill="#94a3b8" /><polygon points="0,-31 30,-46 30,-48 0,-33" fill="#cbd5e1" /><g transform="translate(0, -42)"><polygon points="0,0 -12,-6 -12,-12 0,-6" fill="#d4d4d8" /><polygon points="0,0 12,-6 12,-12 0,-6" fill="#e4e4e7" /><path d="M -12,-12 C -12,-28 12,-28 12,-12" fill="#0f766e" /><polygon points="-2,-27 2,-27 2,-30 -2,-30" fill="#e2e8f0" /><polygon points="-3,-30 3,-30 0,-33" fill="#0f766e" /></g></g></svg>);

export const SvgWell = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="14" ry="7" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -12,-6 -12,-14 0,-8" fill="#64748b" /><polygon points="0,0 12,-6 12,-14 0,-8" fill="#94a3b8" /><polygon points="0,-8 -12,-14 0,-20 12,-14" fill="#cbd5e1" /><polygon points="0,-11 -8,-15 0,-19 8,-15" fill="url(#grad-water)" opacity="0.9" /><polygon points="-14,-22 0,-15 0,-30 -14,-37" fill="#b45309" /><polygon points="14,-22 0,-15 0,-30 14,-37" fill="#d97706" /><polygon points="-2,-10 2,-8 2,-5 -2,-7" fill="#92400e" /></g></svg>);

export const SvgTownhall = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="-2" rx="30" ry="15" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,-4 -24,-16 0,-28 24,-16" fill="#e2e8f0" /><polygon points="0,-4 -22,-15 -22,-24 0,-13" fill="#b91c1c" /><polygon points="0,-4 22,-15 22,-24 0,-13" fill="#ef4444" /><polygon points="-2,-14 -24,-25 -14,-31 8,-20" fill="url(#grad-roof-slate)" /><polygon points="2,-14 24,-25 14,-31 -8,-20" fill="url(#grad-roof-slate)" /><polygon points="0,-4 -8,-8 -8,-40 0,-36" fill="#f8fafc" /><polygon points="0,-4 8,-8 8,-40 0,-36" fill="#e2e8f0" /><polygon points="0,-4 -4,-6 -4,-12 0,-10" fill="#1e293b" /><circle cx="-4" cy="-28" r="2.5" fill="#fcd34d" /><circle cx="4" cy="-28" r="2.5" fill="#fcd34d" /><polygon points="-10,-39 0,-34 10,-39 0,-50" fill="url(#grad-roof-blue)" /><line x1="0" y1="-50" x2="0" y2="-56" stroke="#fcd34d" strokeWidth="1" /><circle cx="0" cy="-57" r="1" fill="#fcd34d" /></g></svg>);

export const SvgEmbassy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-4,2 4,2 12,-2 -12,-2" fill="#ef4444" /><polygon points="0,-4 -26,-17 -26,-30 0,-17" fill="#f1f5f9" /><polygon points="0,-4 26,-17 26,-30 0,-17" fill="#ffffff" /><polygon points="0,-17 -28,-31 -28,-34 0,-20" fill="#db2777" /><polygon points="0,-17 28,-31 28,-34 0,-20" fill="#f472b6" /><polygon points="0,-20 -28,-34 0,-48 28,-34" fill="#ec4899" /><line x1="0" y1="-48" x2="0" y2="-65" stroke="#94a3b8" strokeWidth="1" /><circle cx="0" cy="-66" r="1" fill="#fbbf24" /><polygon points="0,-64 8,-62 0,-60" fill="#3b82f6" /></g></svg>);

export const SvgDepartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -24,-12 -24,-30 0,-18" fill="#cbd5e1" /><polygon points="0,0 24,-12 24,-30 0,-18" fill="#e2e8f0" /><polygon points="-2,-3 -21,-12.5 -21,-17 -2,-7.5" fill="url(#grad-glass)" /><polygon points="2,-3 21,-12.5 21,-17 2,-7.5" fill="url(#grad-glass)" /><polygon points="-1,-7 -23,-18 -23,-16 -1,-5" fill="#15803d" /><polygon points="1,-7 23,-18 23,-16 1,-5" fill="#22c55e" /><polygon points="-4,-13 -19,-20.5 -19,-25 -4,-17.5" fill="url(#grad-glass)" /><polygon points="4,-13 19,-20.5 19,-25 4,-17.5" fill="url(#grad-glass)" /><polygon points="0,-21 -24,-33 0,-45 24,-33" fill="#e2e8f0" /><circle cx="0" cy="-33" r="3" fill="#fef08a" /></g></svg>);

export const SvgUniversity = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="34" ry="17" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -28,-14 -28,-30 0,-16" fill="#991b1b" /><polygon points="0,0 28,-14 28,-30 0,-16" fill="#b91c1c" /><polygon points="0,-8 -28,-22 -28,-24 0,-10" fill="#cbd5e1" /><polygon points="0,-8 28,-22 28,-24 0,-10" fill="#e2e8f0" /><polygon points="0,2 -6,-1 -6,-16 0,-13" fill="#cbd5e1" /><polygon points="0,2 6,-1 6,-16 0,-13" fill="#e2e8f0" /><polygon points="0,-13 -8,-17 0,-21 8,-17" fill="#94a3b8" /><polygon points="0,1 -3,-0.5 -3,-6 0,-4.5" fill="#451a03" /><polygon points="0,1 3,-0.5 3,-6 0,-4.5" fill="#78350f" /><g transform="translate(0, -25)"><path d="M -10,-12 C -10,-24 10,-24 10,-12" fill="#0f766e" /><path d="M 0,-7 C 0,-24 10,-24 10,-12" fill="#14b8a6" /></g></g></svg>);

export const SvgLibrary = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 -20,-22 0,-12" fill="#d6d3d1" /><polygon points="0,0 20,-10 20,-22 0,-12" fill="#e7e5e4" /><polygon points="0,-12 -20,-22 0,-32 20,-22" fill="#f5f5f4" /><path d="M -6,-13 C -6,-18 0,-18 0,-15 C 0,-18 6,-18 6,-13 L 6,-3 L 0,0 L -6,-3 Z" fill="#1e293b" /><path d="M -5,-12 C -5,-16 0,-16 0,-14 C 0,-16 5,-16 5,-12 L 5,-4 L 0,-1 L -5,-4 Z" fill="url(#grad-glass)" /><polygon points="-22,-21 0,-10 0,-20 -22,-31" fill="#b45309" /><polygon points="22,-21 0,-10 0,-20 22,-31" fill="#d97706" /></g></svg>);

export const SvgFountain = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><ellipse cx="0" cy="-2" rx="26" ry="13" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-20,0 0,10 20,0 0,-10" fill="#94a3b8" /><polygon points="-20,0 0,10 0,14 -20,4" fill="#64748b" /><polygon points="20,0 0,10 0,14 20,4" fill="#cbd5e1" /><polygon points="-18,0 0,9 18,0 0,-9" fill="url(#grad-water)" /><polygon points="-4,-2 0,0 4,-2 0,-4" fill="#cbd5e1" /><polygon points="-4,-2 0,0 0,-12 -4,-14" fill="#94a3b8" /><polygon points="4,-2 0,0 0,-12 4,-14" fill="#e2e8f0" /><polygon points="-10,-13 0,-8 10,-13 0,-18" fill="#94a3b8" /><polygon points="-8,-13 0,-9 8,-13 0,-17" fill="url(#grad-water)" /><path d="M 0,-16 C -5,-25 -8,-20 -10,-13" fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.8" /><path d="M 0,-16 C 5,-25 8,-20 10,-13" fill="none" stroke="#e0f2fe" strokeWidth="1.5" opacity="0.8" /><circle cx="0" cy="-22" r="1.5" fill="#ffffff" filter="url(#glow-effect)" opacity="0.9" /></g></svg>);

export const SvgPond = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#15803d" /><ellipse cx="0" cy="0" rx="26" ry="13" fill="#64748b" /><ellipse cx="0" cy="0" rx="22" ry="11" fill="url(#grad-water)" /><path d="M -10,3 Q 0,6 10,3" fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.6" /><g transform="translate(-5, 2) rotate(30)"><ellipse cx="0" cy="0" rx="3" ry="1" fill="#f97316" /><polygon points="-3,0 -5,-1 -5,1" fill="#f97316" /></g><path d="M 10,5 C 13,4 15,6 12,8 C 9,6 7,5 10,5 Z" fill="#22c55e" /><path d="M -12,-6 C -9,-7 -7,-5 -10,-3 C -13,-5 -15,-6 -12,-6 Z" fill="#16a34a" /><circle cx="-11" cy="-5" r="1.5" fill="#f472b6" /></g></svg>);

export const SvgStoneLantern = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="10" ry="5" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-2 -8,-6 0,-10 8,-6" fill="#cbd5e1" /><polygon points="0,-6 -3,-7.5 -3,-20 0,-18.5" fill="#475569" /><polygon points="0,-6 3,-7.5 3,-20 0,-18.5" fill="#64748b" /><polygon points="0,-20 -6,-23 0,-26 6,-23" fill="#e2e8f0" /><polygon points="0,-21 -3,-22.5 -3,-26.5 0,-25" fill="#fef08a" filter="url(#glow-effect)" /><polygon points="0,-21 3,-22.5 3,-26.5 0,-25" fill="#fcd34d" /><polygon points="0,-26 -10,-31 0,-36 10,-31" fill="#475569" /><polygon points="0,-26 -10,-31 -10,-29 0,-24" fill="#64748b" /><polygon points="0,-26 10,-31 10,-29 0,-24" fill="#94a3b8" /><polygon points="0,-37 -2,-38 0,-40 2,-38" fill="#e2e8f0" /><circle cx="-4" cy="-5" r="1.5" fill="#15803d" opacity="0.8" /></g></svg>);

export const SvgStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><ellipse cx="0" cy="-2" rx="14" ry="7" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,-2 -12,-8 0,-14 12,-8" fill="#cbd5e1" /><polygon points="0,-2 -12,-8 -12,-10 0,-4" fill="#94a3b8" /><polygon points="0,-2 12,-8 12,-10 0,-4" fill="#e2e8f0" /><polygon points="0,-10 -3,-11.5 -3,-30 0,-28.5" fill="#94a3b8" /><polygon points="0,-10 3,-11.5 3,-30 0,-28.5" fill="#cbd5e1" /><polygon points="0,-28.5 -8,-32.5 0,-36.5 8,-32.5" fill="#e2e8f0" /><polygon points="0,-32 -2,-33 -2,-42 0,-41" fill="#94a3b8" /><polygon points="0,-32 2,-33 2,-42 0,-41" fill="#cbd5e1" /><circle cx="0" cy="-44" r="4" fill="#e2e8f0" /><circle cx="-1" cy="-45" r="0.8" fill="#475569" /><circle cx="1" cy="-45" r="0.8" fill="#475569" /></g></svg>);

export const SvgGoldenTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="20" ry="10" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -14,-7 -14,-25 0,-18" fill="#d97706" /><polygon points="0,0 14,-7 14,-25 0,-18" fill="url(#grad-gold)" /><polygon points="0,-18 -14,-25 0,-32 14,-25" fill="#fcd34d" /><polygon points="0,-22 -8,-26 -8,-40 0,-36" fill="#d97706" /><polygon points="0,-22 8,-26 8,-40 0,-36" fill="url(#grad-gold)" /><polygon points="0,-36 -8,-40 0,-44 8,-40" fill="#fef08a" /><polygon points="0,-38 -5,-41 0,-48 5,-41" fill="url(#grad-gold)" /><circle cx="0" cy="-50" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></svg>);

export const SvgGuardianShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -18,-9 -18,-22 0,-13" fill="#e9d5ff" /><polygon points="0,0 18,-9 18,-22 0,-13" fill="#d8b4fe" /><polygon points="0,-13 -18,-22 0,-31 18,-22" fill="#c084fc" /><polygon points="-20,-21 0,-11 0,-28 -20,-38" fill="#9333ea" /><polygon points="20,-21 0,-11 0,-28 20,-38" fill="#7e22ce" /><circle cx="0" cy="-20" r="8" fill="#fbbf24" filter="url(#glow-effect)" /><circle cx="0" cy="-20" r="4" fill="#fef08a" /></g></svg>);

export const SvgMonument = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)"><polygon points="0,-60 -15,-10 0,0 15,-10" fill="#cbd5e1" /><polygon points="0,-60 -15,-10 0,-20" fill="#94a3b8" /><polygon points="0,-60 15,-10 0,-20" fill="#e2e8f0" /><line x1="0" y1="-60" x2="0" y2="0" stroke="#f8fafc" strokeWidth="0.5" opacity="0.3" /></g></svg>);

export const SvgGrandSmithy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -22,-11 -22,-28 0,-17" fill="#57534e" /><polygon points="0,0 22,-11 22,-28 0,-17" fill="#78716c" /><polygon points="0,-17 -22,-28 0,-39 22,-28" fill="#292524" /><polygon points="2,-18 24,-29 12,-41 -12,-29" fill="#292524" /><polygon points="2,-18 24,-29 24,-27 2,-16" fill="#1c1917" /><circle cx="0" cy="-10" r="12" fill="#ef4444" filter="url(#glow-effect)" /><circle cx="0" cy="-10" r="6" fill="#fef08a" /></g></svg>);

export const SvgWindmill = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -12,-6 -12,-30 0,-24" fill="#fde047" /><polygon points="0,0 12,-6 12,-30 0,-24" fill="#fef08a" /><polygon points="0,-24 -12,-30 0,-36 12,-30" fill="#ca8a04" /><path d="M 0,-28 L -18,-48 M 0,-28 L 18,-48 M 0,-28 L -18,-8 M 0,-28 L 18,-8" stroke="#f8fafc" strokeWidth="4" strokeLinecap="round" /><circle cx="0" cy="-28" r="3" fill="#d97706" /></g></svg>);

export const SvgBellTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -12,-6 -12,-24 0,-18" fill="#ffedd5" /><polygon points="0,0 12,-6 12,-24 0,-18" fill="#fde68a" /><polygon points="0,-18 -14,-25 0,-38 14,-25" fill="#78350f" /><polygon points="0,-18 14,-25 14,-23 0,-16" fill="#451a03" /><circle cx="0" cy="-22" r="4" fill="#fbbf24" filter="url(#glow-effect)" /><path d="M 0,-26 L 0,-18" stroke="#78350f" strokeWidth="1" /></g></svg>);

export const SvgCherryRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="road" color="#fce7f3" thickness={4} /></svg>;

export const SvgClockTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -10,-5 -10,-35 0,-30" fill="#fef3c7" /><polygon points="0,0 10,-5 10,-35 0,-30" fill="#fde68a" /><polygon points="0,-30 -12,-36 0,-48 12,-36" fill="#92400e" /><polygon points="0,-30 -12,-36 -12,-34 0,-28" fill="#78350f" /><circle cx="-5" cy="-20" r="5" fill="#f8fafc" /><circle cx="5" cy="-20" r="5" fill="#f8fafc" /><line x1="-5" y1="-20" x2="-5" y2="-23" stroke="#1e293b" strokeWidth="1" /><line x1="5" y1="-20" x2="6" y2="-22" stroke="#1e293b" strokeWidth="1" /></g></svg>);

export const SvgGoldStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)"><polygon points="0,-60 -15,-10 0,0 15,-10" fill="url(#grad-gold)" /><polygon points="0,-60 -15,-10 0,-20" fill="#fcd34d" /><polygon points="0,-60 15,-10 0,-20" fill="#b45309" /><circle cx="0" cy="-62" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgFestivalStage = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 0,-20 20,-10" fill="#fef9c3" /><polygon points="0,0 -20,-10 -20,-14 0,-4" fill="#d97706" /><polygon points="0,0 20,-10 20,-14 0,-4" fill="#b45309" /><polygon points="0,-14 -22,-25 0,-30 22,-25" fill="#ef4444" /><polygon points="0,-14 -22,-25 -22,-23 0,-12" fill="#dc2626" /><circle cx="-10" cy="-20" r="2" fill="#fbbf24" filter="url(#glow-effect)" /><circle cx="10" cy="-20" r="2" fill="#fbbf24" filter="url(#glow-effect)" /><circle cx="0" cy="-25" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></svg>);

export const SvgVillager = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)"><rect x="-10" y="-30" width="20" height="20" rx="4" fill="#3b82f6"/><circle cx="0" cy="-40" r="12" fill="#fde047"/><circle cx="-4" cy="-42" r="2" fill="#1e293b"/><circle cx="4" cy="-42" r="2" fill="#1e293b"/><path d="M-5,-35 Q0,-30 5,-35" fill="none" stroke="#1e293b" strokeWidth="2"/></g></svg>);

export const SvgGhostBoss = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#glow-effect)"><path d="M-30,20 Q0,-40 30,20 Q15,10 0,20 Q-15,10 -30,20 Z" fill="#9333ea" opacity="0.8"/><circle cx="-10" cy="0" r="5" fill="#f8fafc"/><circle cx="10" cy="0" r="5" fill="#f8fafc"/></g></svg>);

// ==========================================
// 7. 商業施設 (Commercial)
// ==========================================
export const SvgCafe = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -18,-9 -18,-22 0,-13" fill="#92400e" /><polygon points="0,0 18,-9 18,-22 0,-13" fill="#b45309" /><polygon points="-14,-8 -8,-5 -8,-14 -14,-17" fill="#1e293b" /><polygon points="-13,-8.5 -9,-6.5 -9,-13.5 -13,-15.5" fill="url(#grad-glass)" /><polygon points="4,-10 14,-15 14,-20 4,-15" fill="#1e293b" /><polygon points="5,-10.5 13,-14.5 13,-19 5,-15" fill="url(#grad-glass)" /><polygon points="0,-13 -20,-23 0,-33 20,-23" fill="#78350f" /><polygon points="0,-13 -20,-23 -20,-21 0,-11" fill="#451a03" /><g transform="translate(0, -6)"><polygon points="-2,-2 -6,-4 -6,-6 -2,-4" fill="#f8fafc" /><polygon points="-2,-2 2,-4 2,-6 -2,-4" fill="#e2e8f0" /><polygon points="-2,-4 -6,-6 -2,-8 2,-6" fill="#fef08a" /></g><circle cx="-12" cy="-28" r="2" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="8" cy="-28" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgBakery = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -18,-9 -18,-24 0,-15" fill="#ffedd5" /><polygon points="0,0 18,-9 18,-24 0,-15" fill="#fed7aa" /><polygon points="4,-8 14,-13 14,-20 4,-15" fill="#1e293b" /><polygon points="5,-8.5 13,-12.5 13,-19 5,-15" fill="url(#grad-glass)" /><polygon points="0,-15 -20,-25 0,-35 20,-25" fill="#ea580c" /><polygon points="0,-15 -20,-25 -20,-23 0,-13" fill="#c2410c" /><polygon points="-6,-3 -2,-1 0,-5 -4,-7" fill="#d97706" /><ellipse cx="-3" cy="-4" rx="2" ry="1" fill="#fde68a" /><polygon points="8,-6 12,-8 10,-12 6,-10" fill="#d97706" /><ellipse cx="9" cy="-9" rx="2" ry="1" fill="#fde68a" /><g transform="translate(-6, -30)"><polygon points="0,0 -4,-2 -4,-12 0,-10" fill="#92400e" /><polygon points="0,0 4,-2 4,-12 0,-10" fill="#b45309" /><polygon points="0,-10 -4,-12 0,-14 4,-12" fill="#d97706" /><circle cx="2" cy="-18" r="4" fill="#94a3b8" opacity="0.4" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgBurgerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 -20,-25 0,-15" fill="#fef08a" /><polygon points="0,0 20,-10 20,-25 0,-15" fill="#fde047" /><polygon points="6,-8 16,-13 16,-21 6,-16" fill="#1e293b" /><polygon points="7,-8.5 15,-12.5 15,-20 7,-16" fill="url(#grad-glass)" /><polygon points="-16,-8 -6,-3 -6,-11 -16,-16" fill="#1e293b" /><polygon points="-15,-8.5 -7,-4.5 -7,-10.5 -15,-14.5" fill="url(#grad-glass)" /><polygon points="0,-15 -22,-26 0,-37 22,-26" fill="#ef4444" /><polygon points="0,-15 -22,-26 -22,-24 0,-13" fill="#dc2626" /><g transform="translate(-5, -32)"><ellipse cx="0" cy="0" rx="5" ry="2.5" fill="#d97706" /><ellipse cx="0" cy="-1" rx="5" ry="2" fill="#22c55e" /><ellipse cx="0" cy="-2" rx="5" ry="2" fill="#b91c1c" /><ellipse cx="0" cy="-3.5" rx="5" ry="2.5" fill="#fbbf24" /></g><circle cx="16" cy="-30" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgFamilyRestaurant = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -24,-12 -24,-28 0,-16" fill="#fef9c3" /><polygon points="0,0 24,-12 24,-28 0,-16" fill="#fef08a" /><polygon points="6,-8 20,-15 20,-24 6,-17" fill="#1e293b" /><polygon points="7,-8.5 19,-14.5 19,-23 7,-17" fill="url(#grad-glass)" /><polygon points="-20,-10 -8,-4 -8,-14 -20,-20" fill="#1e293b" /><polygon points="-19,-10 -9,-5 -9,-13 -19,-18" fill="url(#grad-glass)" /><polygon points="0,-1 -6,-4 -6,-7 0,-4" fill="#ef4444" /><polygon points="0,-1 6,-4 6,-7 0,-4" fill="#dc2626" /><polygon points="0,-16 -26,-29 0,-42 26,-29" fill="#f97316" /><polygon points="0,-16 -26,-29 -26,-27 0,-14" fill="#ea580c" /><path d="M -20,-30 L 0,-20 L 20,-30" fill="none" stroke="#fef08a" strokeWidth="1.5" /><circle cx="-15" cy="-34" r="2" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="15" cy="-34" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgConvenienceStore = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 -20,-24 0,-14" fill="#f8fafc" /><polygon points="0,0 20,-10 20,-24 0,-14" fill="#e2e8f0" /><polygon points="4,-6 18,-13 18,-22 4,-15" fill="#1e293b" /><polygon points="5,-6.5 17,-12.5 17,-21 5,-15" fill="url(#grad-glass)" /><polygon points="-16,-8 -4,-2 -4,-12 -16,-18" fill="#1e293b" /><polygon points="-15,-8 -5,-3 -5,-11 -15,-16" fill="url(#grad-glass)" /><polygon points="0,-14 -22,-25 0,-32 22,-25" fill="#0ea5e9" /><polygon points="0,-14 22,-25 22,-23 0,-12" fill="#0284c7" /><polygon points="0,-14 -22,-25 -22,-23 0,-12" fill="#0369a1" /><polygon points="-10,-22 10,-22 10,-24 -10,-24" fill="#f97316" /><polygon points="-10,-24 10,-24 10,-26 -10,-26" fill="#22c55e" /><polygon points="-10,-26 10,-26 10,-28 -10,-28" fill="#ef4444" /><circle cx="-2" cy="-1" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgFlowerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><ellipse cx="0" cy="0" rx="20" ry="10" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -16,-8 -16,-22 0,-14" fill="#fce7f3" /><polygon points="0,0 16,-8 16,-22 0,-14" fill="#fbcfe8" /><polygon points="6,-6 14,-10 14,-18 6,-14" fill="#1e293b" /><polygon points="7,-6.5 13,-9.5 13,-17 7,-14" fill="url(#grad-glass)" /><polygon points="0,-14 -18,-23 0,-32 18,-23" fill="#db2777" /><polygon points="0,-14 -18,-23 -18,-21 0,-12" fill="#9d174d" /><circle cx="-6" cy="-2" r="2.5" fill="#f472b6" filter="url(#soft-shadow)" /><circle cx="-10" cy="-4" r="2" fill="#ec4899" /><circle cx="4" cy="-4" r="2.5" fill="#fbbf24" filter="url(#soft-shadow)" /><circle cx="8" cy="-6" r="2" fill="#f59e0b" /><circle cx="-2" cy="-6" r="2" fill="#a855f7" /><path d="M -6,-2 L -6,-8 M 4,-4 L 4,-10" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" /></g></svg>);

export const SvgCinema = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -26,-13 -26,-32 0,-19" fill="#1e293b" /><polygon points="0,0 26,-13 26,-32 0,-19" fill="#334155" /><polygon points="6,-8 22,-16 22,-28 6,-20" fill="#475569" /><polygon points="7,-9 21,-16 21,-27 7,-20" fill="#020617" /><polygon points="8,-10 20,-16 20,-26 8,-20" fill="#f8fafc" opacity="0.8" /><polygon points="-22,-10 -8,-3 -8,-16 -22,-23" fill="#475569" /><polygon points="-21,-11 -9,-5 -9,-15 -21,-21" fill="url(#grad-glass)" /><polygon points="0,-19 -28,-33 0,-47 28,-33" fill="#ef4444" /><polygon points="0,-19 -28,-33 -28,-31 0,-17" fill="#dc2626" /><polygon points="0,-19 28,-33 28,-31 0,-17" fill="#b91c1c" /><circle cx="-18" cy="-38" r="2" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="0" cy="-42" r="2" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="18" cy="-38" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgHotel = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -22,-11 -22,-38 0,-27" fill="#334155" /><polygon points="0,0 22,-11 22,-38 0,-27" fill="#475569" />{[0,1,2].map(r=>[0,1].map(c=><g key={`hw-${r}-${c}`} transform={`translate(${4+c*10}, ${-10-r*8-c*5})`}><polygon points="0,0 6,-3 6,-6 0,-3" fill="#1e293b" /><polygon points="1,-0.5 5,-2.5 5,-5.5 1,-3.5" fill={r===2&&c===0?"#fef08a":"url(#grad-glass)"} /></g>))}<polygon points="0,-27 -24,-39 0,-51 24,-39" fill="#64748b" /><polygon points="0,-27 -24,-39 -24,-37 0,-25" fill="#475569" /><polygon points="0,-3 -6,-6 -6,-14 0,-11" fill="#475569" /><polygon points="0,-3 4,-5 4,-13 0,-11" fill="#64748b" /><polygon points="0,-11 -6,-14 0,-17 4,-13" fill="#fde68a" /><circle cx="0" cy="-48" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></svg>);

// ==========================================
// 8. 公共施設 (Public Services)
// ==========================================
export const SvgHospital = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -24,-12 -24,-32 0,-20" fill="#f8fafc" /><polygon points="0,0 24,-12 24,-32 0,-20" fill="#e2e8f0" />{[0,1,2].map(r=>[0,1].map(c=><g key={`hpw-${r}-${c}`} transform={`translate(${6+c*10}, ${-10-r*7-c*5})`}><polygon points="0,0 6,-3 6,-5 0,-2" fill="#94a3b8" /><polygon points="1,-0.5 5,-2.5 5,-4.5 1,-2.5" fill="url(#grad-glass)" /></g>))}<polygon points="0,-20 -26,-33 0,-46 26,-33" fill="#e2e8f0" /><polygon points="0,-20 -26,-33 -26,-31 0,-18" fill="#cbd5e1" /><g transform="translate(0, -36)"><polygon points="-3,0 3,0 3,-5 -3,-5" fill="#ef4444" /><polygon points="0,-2 -5,-2 -5,-3 0,-3" fill="#ef4444" /><polygon points="0,-2 5,-2 5,-3 0,-3" fill="#ef4444" /></g><polygon points="-4,-2 4,-6 4,-14 -4,-10" fill="#94a3b8" /><polygon points="-3,-3 3,-6 3,-13 -3,-10" fill="url(#grad-glass)" /></g></svg>);

export const SvgFireStation = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -22,-11 -22,-28 0,-17" fill="#dc2626" /><polygon points="0,0 22,-11 22,-28 0,-17" fill="#ef4444" /><polygon points="6,-6 18,-12 18,-8 6,-2" fill="#94a3b8" /><polygon points="7,-5 17,-10 17,-3 7,2" fill="#1e293b" opacity="0.8" /><polygon points="-18,-8 -6,-2 -6,-12 -18,-18" fill="#94a3b8" /><polygon points="-17,-9 -7,-4 -7,-11 -17,-16" fill="url(#grad-glass)" /><polygon points="0,-17 -24,-29 0,-41 24,-29" fill="#b91c1c" /><polygon points="0,-17 -24,-29 -24,-27 0,-15" fill="#991b1b" /><g transform="translate(-8, -34)"><polygon points="0,0 -4,-2 -4,-15 0,-13" fill="#94a3b8" /><polygon points="0,0 4,-2 4,-15 0,-13" fill="#cbd5e1" /><polygon points="0,-13 -4,-15 0,-17 4,-15" fill="#ef4444" /></g><circle cx="-14" cy="-34" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgPoliceBox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -12,-6 -12,-20 0,-14" fill="#1e3a8a" /><polygon points="0,0 12,-6 12,-20 0,-14" fill="#1d4ed8" /><polygon points="4,-5 10,-8 10,-16 4,-13" fill="#1e293b" /><polygon points="5,-5.5 9,-7.5 9,-15 5,-13" fill="url(#grad-glass)" /><polygon points="0,-14 -14,-21 0,-28 14,-21" fill="#1e3a8a" /><polygon points="0,-14 -14,-21 -14,-19 0,-12" fill="#172554" /><circle cx="-8" cy="-24" r="2.5" fill="#fef08a" filter="url(#glow-effect)" /><line x1="0" y1="-28" x2="0" y2="-36" stroke="#94a3b8" strokeWidth="1" /><circle cx="0" cy="-37" r="2" fill="#ef4444" filter="url(#glow-effect)" /></g></svg>);

export const SvgPostOffice = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 -20,-26 0,-16" fill="#f8fafc" /><polygon points="0,0 20,-10 20,-26 0,-16" fill="#e2e8f0" /><polygon points="6,-6 16,-11 16,-22 6,-17" fill="#1e293b" /><polygon points="7,-6.5 15,-10.5 15,-21 7,-17" fill="url(#grad-glass)" /><polygon points="-16,-8 -6,-3 -6,-14 -16,-19" fill="#1e293b" /><polygon points="-15,-8.5 -7,-4.5 -7,-13 -15,-17" fill="url(#grad-glass)" /><polygon points="0,-16 -22,-27 0,-38 22,-27" fill="#ef4444" /><polygon points="0,-16 -22,-27 -22,-25 0,-14" fill="#dc2626" /><g transform="translate(0, -30)"><polygon points="0,0 -4,-2 0,-4 4,-2" fill="#ef4444" /><path d="M -3,-1 L 0,-3 L 3,-1" fill="none" stroke="#f8fafc" strokeWidth="1" /></g><polygon points="-2,-2 2,-4 2,-10 -2,-8" fill="#ef4444" /><polygon points="-1,-3 1,-4 1,-9 -1,-8" fill="#f8fafc" /></g></svg>);

export const SvgStation = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="34" ry="17" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -30,-15 0,-30 30,-15" fill="#cbd5e1" /><polygon points="0,0 30,-15 30,-11 0,4" fill="#94a3b8" /><polygon points="0,0 -30,-15 -30,-11 0,4" fill="#64748b" /><polygon points="0,-8 -22,-19 -22,-34 0,-23" fill="#f8fafc" /><polygon points="0,-8 22,-19 22,-34 0,-23" fill="#e2e8f0" /><polygon points="4,-14 18,-21 18,-30 4,-23" fill="url(#grad-glass)" /><polygon points="-18,-16 -4,-9 -4,-20 -18,-27" fill="url(#grad-glass)" /><polygon points="0,-23 -24,-35 0,-47 24,-35" fill="url(#grad-roof-slate)" /><polygon points="0,-23 -24,-35 -24,-33 0,-21" fill="#334155" /><g transform="translate(0, -38)"><circle cx="0" cy="0" r="4" fill="#f8fafc" /><circle cx="0" cy="0" r="2" fill="#fbbf24" /><line x1="0" y1="0" x2="0" y2="-1.5" stroke="#1e293b" strokeWidth="0.5" /><line x1="0" y1="0" x2="1.5" y2="0.5" stroke="#1e293b" strokeWidth="0.5" /></g><path d="M -30,-2 L -20,3 L 20,-12 L 30,-17" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /><path d="M -30,0 L -20,5 L 20,-10 L 30,-15" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /></g></svg>);

export const SvgAirport = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="42" ry="21" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,5 -38,-14 0,-33 38,-14" fill="#cbd5e1" /><polygon points="0,5 38,-14 38,-10 0,9" fill="#94a3b8" /><polygon points="0,-5 -30,-20 -30,-36 0,-21" fill="#f8fafc" /><polygon points="0,-5 30,-20 30,-36 0,-21" fill="#e2e8f0" /><polygon points="8,-14 26,-23 26,-34 8,-25" fill="url(#grad-glass)" /><polygon points="-26,-18 -8,-9 -8,-22 -26,-31" fill="url(#grad-glass)" /><polygon points="0,-21 -32,-37 0,-53 32,-37" fill="#94a3b8" /><polygon points="0,-21 -32,-37 -32,-35 0,-19" fill="#64748b" /><g transform="translate(0, -42)"><polygon points="0,0 -8,-4 -8,-15 0,-11" fill="#334155" /><polygon points="0,0 8,-4 8,-15 0,-11" fill="#475569" /><polygon points="0,-11 -8,-15 0,-19 8,-15" fill="#94a3b8" /></g><g transform="translate(25, 2) scale(0.5)"><polygon points="0,-10 -25,0 -25,-5 0,-15" fill="#e2e8f0" /><polygon points="0,-10 25,0 25,-5 0,-15" fill="#cbd5e1" /><polygon points="0,-15 -10,-10 0,-5 10,-10" fill="#94a3b8" /><polygon points="0,-10 -3,-11.5 -3,-25 0,-23.5" fill="#64748b" /><polygon points="0,-10 3,-11.5 3,-25 0,-23.5" fill="#94a3b8" /></g></g></svg>);


// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgOfficeBuilding = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -18,-9 -18,-42 0,-33" fill="#334155" /><polygon points="0,0 18,-9 18,-42 0,-33" fill="#475569" />{[0,1,2,3].map(r=>[0,1].map(c=><g key={`ob-${r}-${c}`} transform={`translate(${4+c*8}, ${-8-r*7-c*4})`}><polygon points="0,0 5,-2.5 5,-5 0,-2.5" fill="#1e293b" /><polygon points="0.5,-0.5 4.5,-2.5 4.5,-4.5 0.5,-2.5" fill="url(#grad-glass)" /></g>))}<polygon points="0,-33 -20,-43 0,-53 20,-43" fill="#64748b" /><polygon points="0,-33 -20,-43 -20,-41 0,-31" fill="#475569" /><polygon points="0,-3 -4,-5 -4,-12 0,-10" fill="#1e293b" /><polygon points="0,-3 4,-5 4,-12 0,-10" fill="#334155" /></g></svg>);

export const SvgTowerApartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#020617" opacity="0.5" filter="url(#soft-shadow)" /><polygon points="0,0 -14,-7 -14,-52 0,-45" fill="#64748b" /><polygon points="0,0 14,-7 14,-52 0,-45" fill="#94a3b8" />{[0,1,2,3,4,5].map(r=><g key={`ta-${r}`} transform={`translate(4, ${-6-r*6.5})`}><polygon points="0,0 8,-4 8,-4.5 0,-0.5" fill="#1e293b" /><polygon points="0.5,-0.3 7.5,-3.8 7.5,-4.3 0.5,-0.8" fill="url(#grad-glass)" /></g>)}<polygon points="0,-45 -16,-53 0,-61 16,-53" fill="#cbd5e1" /><polygon points="0,-45 -16,-53 -16,-51 0,-43" fill="#94a3b8" /><polygon points="-10,-50 -4,-47 -4,-52 -10,-55" fill="url(#grad-glass)" opacity="0.8" /><polygon points="4,-47 10,-50 10,-55 4,-52" fill="url(#grad-glass)" opacity="0.8" /><polygon points="0,-2 -3,-3.5 -3,-8 0,-6.5" fill="#1e293b" /><polygon points="0,-2 3,-3.5 3,-8 0,-6.5" fill="#334155" /><line x1="0" y1="-61" x2="0" y2="-68" stroke="#94a3b8" strokeWidth="1" /><circle cx="0" cy="-69" r="1" fill="#ef4444" filter="url(#glow-effect)" /></g></svg>);

export const SvgTvTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="-12,0 -4,-15 0,-30 4,-15 12,0" fill="#ef4444" /><polygon points="0,0 -4,-15 0,-30" fill="#dc2626" /><polygon points="0,0 4,-15 0,-30" fill="#b91c1c" /><polygon points="-8,-5 -3,-18 3,-18 8,-5" fill="#f8fafc" opacity="0.3" /><polygon points="0,-30 -6,-38 6,-38" fill="#f8fafc" /><polygon points="0,-30 -6,-38 0,-35" fill="#e2e8f0" /><polygon points="0,-30 6,-38 0,-35" fill="#cbd5e1" /><polygon points="0,-38 -2,-42 0,-80 2,-42" fill="#94a3b8" /><polygon points="0,-38 -2,-42 0,-80" fill="#64748b" /><polygon points="-10,-15 10,-15 8,-17 -8,-17" fill="#f8fafc" /><circle cx="0" cy="-80" r="2" fill="#ef4444" filter="url(#glow-effect)" /><circle cx="0" cy="-50" r="1" fill="#fef08a" filter="url(#glow-effect)" /><polygon points="-4,-18 -3,-22 3,-22 4,-18" fill="url(#grad-glass)" opacity="0.8" /></g></svg>);

export const SvgStadium = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="40" ry="20" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><ellipse cx="0" cy="-5" rx="38" ry="19" fill="#94a3b8" /><ellipse cx="0" cy="-8" rx="38" ry="19" fill="#cbd5e1" /><ellipse cx="0" cy="-8" rx="32" ry="16" fill="#22c55e" /><ellipse cx="0" cy="-10" rx="32" ry="16" fill="#4ade80" /><path d="M 0,-10 L -15,-18 M 0,-10 L 15,-2 M 0,-10 L 15,-18 M 0,-10 L -15,-2" stroke="#f8fafc" strokeWidth="0.8" opacity="0.8" /><ellipse cx="0" cy="-10" rx="6" ry="3" fill="none" stroke="#f8fafc" strokeWidth="0.8" opacity="0.8" /><path d="M -38,-8 C -38,-22 -20,-30 0,-30 C 20,-30 38,-22 38,-8" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeLinecap="round" /><path d="M -38,-8 C -38,-26 -20,-34 0,-34 C 20,-34 38,-26 38,-8" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /><g transform="translate(30, -22)"><polygon points="0,0 -3,-1.5 -3,-8 0,-6.5" fill="#94a3b8" /><polygon points="0,0 3,-1.5 3,-8 0,-6.5" fill="#cbd5e1" /><circle cx="0" cy="-9" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /></g></g></svg>);

// ==========================================
// 10. 公園・レジャー (Parks & Leisure)
// ==========================================
export const SvgPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="0,2 -28,-12 0,-26 28,-12" fill="#4ade80" /><polygon points="0,2 28,-12 28,-9 0,5" fill="#22c55e" /><polygon points="0,2 -28,-12 -28,-9 0,5" fill="#16a34a" /><polygon points="0,-2 -20,-12 0,-22 20,-12" fill="#86efac" /><path d="M -10,-8 Q 0,-4 10,-8 Q 0,-12 -10,-8 Z" fill="#d6d3d1" /><g transform="translate(-16, -16)"><path d="M 0,2 L 0,-15" stroke="#451a03" strokeWidth="2" strokeLinecap="round" /><circle cx="-4" cy="-14" r="5" fill="#064e3b" /><circle cx="4" cy="-12" r="6" fill="#15803d" /><circle cx="0" cy="-16" r="5" fill="#22c55e" /></g><g transform="translate(16, -16)"><path d="M 0,2 L 0,-12" stroke="#451a03" strokeWidth="2" strokeLinecap="round" /><circle cx="-3" cy="-11" r="4" fill="#064e3b" /><circle cx="3" cy="-10" r="5" fill="#15803d" /><circle cx="0" cy="-13" r="4" fill="#22c55e" /></g><g transform="translate(2, -8)"><polygon points="0,0 -3,-1 -3,-3 0,-2" fill="#78350f" /><polygon points="0,0 3,-1 3,-3 0,-2" fill="#92400e" /><polygon points="0,-2 -3,-3 0,-4 3,-3" fill="#b45309" /></g></g></svg>);

export const SvgPlayground = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="0,2 -22,-9 0,-20 22,-9" fill="#fde68a" /><polygon points="0,2 22,-9 22,-7 0,4" fill="#eab308" /><g transform="translate(-8, -12)"><polygon points="0,0 -5,-2.5 -5,-14 0,-11.5" fill="#ef4444" /><polygon points="0,0 5,-2.5 5,-14 0,-11.5" fill="#dc2626" /><polygon points="0,-11.5 -5,-14 0,-16.5 5,-14" fill="#f87171" /><path d="M 0,-16.5 Q -8,-10 -12,-4" stroke="#94a3b8" strokeWidth="1.5" fill="none" /><polygon points="-15,-1 -12,-4 -9,-2 -12,1" fill="#3b82f6" /></g><g transform="translate(10, -10)"><polygon points="-6,0 0,-3 6,0" fill="#f97316" /><polygon points="-5,-1 0,-3.5 5,-1" fill="#fb923c" /><polygon points="0,-3.5 0,5" stroke="#78350f" strokeWidth="1" /><circle cx="0" cy="5" r="1" fill="#78350f" /></g></g></svg>);

export const SvgPool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><polygon points="0,2 -26,-11 0,-24 26,-11" fill="#cbd5e1" /><polygon points="0,2 26,-11 26,-8 0,5" fill="#94a3b8" /><polygon points="0,2 -26,-11 -26,-8 0,5" fill="#64748b" /><polygon points="0,-2 -20,-12 0,-22 20,-12" fill="url(#grad-water)" /><path d="M -10,-8 Q 0,-5 10,-8 Q 0,-11 -10,-8 Z" fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.8" /><path d="M -8,-12 Q -2,-9 8,-12" fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.6" /><polygon points="-20,-12 -18,-10 -16,-12 -14,-10 -12,-12 -12,-14 -20,-14" fill="#ef4444" /><polygon points="-20,-14 -12,-14 -12,-16 -20,-16" fill="#f8fafc" /><polygon points="12,-18 14,-16 16,-18 18,-16 20,-18 20,-20 12,-20" fill="#3b82f6" /><polygon points="12,-20 20,-20 20,-22 12,-22" fill="#f8fafc" /></g></svg>);

export const SvgFerrisWheel = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="14" ry="7" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-10,0 0,-40 -2,-40" fill="#94a3b8" /><polygon points="10,0 0,-40 2,-40" fill="#cbd5e1" /><circle cx="0" cy="-40" r="18" fill="none" stroke="#cbd5e1" strokeWidth="2" /><circle cx="0" cy="-40" r="16" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=16;const x=Math.cos(a*Math.PI/180)*r;const y=Math.sin(a*Math.PI/180)*r;const colors=['#ef4444','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#ec4899','#f97316','#14b8a6'];return(<g key={`fw-${i}`} transform={`translate(${x}, ${-40+y})`}><rect x="-2.5" y="-2" width="5" height="4" rx="1" fill={colors[i]} /><rect x="-2" y="-1.5" width="4" height="3" rx="0.5" fill={lighten(colors[i],30)} /></g>);})}<circle cx="0" cy="-40" r="3" fill="#64748b" /><circle cx="0" cy="-40" r="1.5" fill="#cbd5e1" /></g></svg>);

export const SvgAmusementPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="42" ry="21" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,5 -38,-14 0,-33 38,-14" fill="#86efac" /><polygon points="0,5 38,-14 38,-10 0,9" fill="#22c55e" /><g transform="translate(-18, -18)"><polygon points="-8,0 0,-30 -2,-30" fill="#94a3b8" /><polygon points="8,0 0,-30 2,-30" fill="#cbd5e1" /><circle cx="0" cy="-30" r="12" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />{[0,60,120,180,240,300].map((a,i)=>{const r=12;const x=Math.cos(a*Math.PI/180)*r;const y=Math.sin(a*Math.PI/180)*r;const c=['#ef4444','#f59e0b','#22c55e','#3b82f6','#ec4899','#f97316'];return <rect key={`ap-${i}`} x={x-2} y={-30+y-1.5} width="4" height="3" rx="1" fill={c[i]} />;})}<circle cx="0" cy="-30" r="2" fill="#64748b" /></g><g transform="translate(15, -10)"><polygon points="0,0 -14,-7 -14,-11 0,-4" fill="#fde047" /><polygon points="0,0 14,-7 14,-11 0,-4" fill="#fbbf24" /><polygon points="0,-4 -14,-11 0,-18 14,-11" fill="#ef4444" /><circle cx="-8" cy="-13" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="8" cy="-13" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /></g><path d="M -8,2 Q -5,-8 0,-2 Q 5,-12 8,-2 Q 12,-15 15,0" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" /></g></svg>);

// ==========================================
// 11. 乗り物 (Vehicles)
// ==========================================
export const SvgCar = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="2" rx="14" ry="6" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-12,2 -8,-2 8,-10 12,-6 12,2 -12,8" fill="#1e293b" /><polygon points="-12,2 -8,-2 8,-10 12,-6" fill="#ef4444" /><polygon points="-8,-2 -4,-4 4,-8 8,-10" fill="#334155" /><polygon points="-7,-2 -3,-4 3,-7 7,-9" fill="url(#grad-glass)" /><ellipse cx="-6" cy="4" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="-6" cy="4" rx="2" ry="1" fill="#334155" /><ellipse cx="8" cy="-2" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="8" cy="-2" rx="2" ry="1" fill="#334155" /><circle cx="10" cy="-5" r="1" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="-10" cy="5" r="0.8" fill="#ef4444" /></g></svg>);

export const SvgBus = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="2" rx="18" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-16,4 -14,-4 14,-18 16,-10 16,4 -16,10" fill="#1e293b" /><polygon points="-16,4 -14,-4 14,-18 16,-10" fill="#22c55e" /><polygon points="-14,-4 -10,-6 6,-14 10,-16" fill="#334155" /><polygon points="-13,-4 -9,-6 5,-13 9,-15" fill="url(#grad-glass)" /><polygon points="-10,-6 -6,-8 2,-12 6,-14" fill="#334155" /><polygon points="-9,-6 -5,-8 1,-11 5,-13" fill="url(#grad-glass)" /><ellipse cx="-8" cy="6" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="-8" cy="6" rx="2" ry="1" fill="#334155" /><ellipse cx="10" cy="-2" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="10" cy="-2" rx="2" ry="1" fill="#334155" /><circle cx="14" cy="-9" r="1.2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgBicycle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="-8" cy="2" rx="5" ry="2.5" fill="none" stroke="#334155" strokeWidth="1.5" /><ellipse cx="8" cy="-2" rx="5" ry="2.5" fill="none" stroke="#334155" strokeWidth="1.5" /><path d="M -8,2 L 0,-6 L 8,-2 M 0,-6 L 2,-10 L -2,-10 M -2,-10 L -8,2 M 2,-10 L 8,-2" fill="none" stroke="#3b82f6" strokeWidth="1" strokeLinejoin="round" /><polygon points="-3,-10 3,-10 2,-12 -2,-12" fill="#94a3b8" /><circle cx="-8" cy="2" r="1" fill="#94a3b8" /><circle cx="8" cy="-2" r="1" fill="#94a3b8" /></g></svg>);

export const SvgShipVehicle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="2" rx="20" ry="8" fill="#0284c7" opacity="0.6" /><path d="M -18,2 C -15,-2 -5,-8 10,-6 C 18,-4 20,0 18,4 C 10,6 -10,6 -18,2 Z" fill="#78350f" /><path d="M -18,2 C -15,-2 -5,-8 10,-6 C 18,-4 20,0 18,2 C 10,4 -10,4 -18,0 Z" fill="#b45309" /><path d="M -10,-2 L -10,-20 L -8,-20 L -8,-2 Z" fill="#451a03" /><polygon points="-10,-18 20,-6 20,-4 -10,-16" fill="#f8fafc" /><polygon points="-10,-14 20,-2 20,0 -10,-12" fill="#f8fafc" /><polygon points="10,-6 15,-4 15,-10" fill="#ef4444" /></g></svg>);

export const SvgAirplane = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><ellipse cx="0" cy="10" rx="16" ry="6" fill="#020617" opacity="0.2" /><polygon points="0,-15 -25,0 -25,-5 0,-20" fill="#e2e8f0" /><polygon points="0,-15 25,0 25,-5 0,-20" fill="#cbd5e1" /><polygon points="0,-20 -6,-12 0,5 6,-12" fill="#94a3b8" /><polygon points="0,-20 -6,-12 0,-5" fill="#64748b" /><polygon points="0,-20 6,-12 0,-5" fill="#cbd5e1" /><polygon points="0,5 -8,0 0,-5 8,0" fill="#64748b" /><polygon points="0,-25 -3,-20 0,-15 3,-20" fill="url(#grad-glass)" /><polygon points="0,-10 -10,-5 -10,-8 0,-13" fill="#e2e8f0" /><polygon points="0,-10 10,-5 10,-8 0,-13" fill="#cbd5e1" /><circle cx="-2" cy="-22" r="1" fill="#1e293b" /><circle cx="2" cy="-22" r="1" fill="#1e293b" /></g></svg>);

export const SvgFireTruck = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="2" rx="18" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="-16,4 -14,-4 14,-18 16,-10 16,4 -16,10" fill="#7f1d1d" /><polygon points="-16,4 -14,-4 14,-18 16,-10" fill="#ef4444" /><polygon points="-14,-4 -10,-6 -6,-8" fill="#334155" /><polygon points="-13,-4 -9,-6 -5,-7" fill="url(#grad-glass)" /><polygon points="-4,-6 14,-18 16,-10 0,-4" fill="#dc2626" /><path d="M -10,2 L 10,-8 L 12,-20 L 14,-22" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" /><ellipse cx="-8" cy="6" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="-8" cy="6" rx="2" ry="1" fill="#334155" /><ellipse cx="10" cy="-2" rx="3" ry="1.5" fill="#0f172a" /><ellipse cx="10" cy="-2" rx="2" ry="1" fill="#334155" /><circle cx="14" cy="-9" r="1.2" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="-14" cy="-1" r="1.5" fill="#3b82f6" filter="url(#glow-effect)" /></g></svg>);

// ==========================================
// 12. ストリートファニチャー (Street Furniture)
// ==========================================
export const SvgBench = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="-10,2 10,-4 12,-3 -8,3" fill="#020617" opacity="0.3" /><polygon points="-10,0 10,-6 10,-4 -10,2" fill="#b45309" /><polygon points="-10,-2 10,-8 10,-6 -10,0" fill="#d97706" /><polygon points="-10,-4 10,-10 10,-8 -10,-2" fill="#b45309" /><polygon points="-10,-4 -8,-5 -8,2 -10,3" fill="#78350f" /><polygon points="10,-10 12,-11 12,-4 10,-3" fill="#78350f" /><polygon points="-10,0 -12,1 -12,5 -10,4" fill="#451a03" /><polygon points="10,-6 8,-5 8,-1 10,-2" fill="#451a03" /></g></svg>);

export const SvgMailbox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,0 -4,-2 -4,-14 0,-12" fill="#b91c1c" /><polygon points="0,0 4,-2 4,-14 0,-12" fill="#ef4444" /><polygon points="0,-12 -4,-14 0,-16 4,-14" fill="#dc2626" /><path d="M -4,-14 C -4,-18 4,-18 4,-14" fill="#7f1d1d" /><polygon points="-3,-10 3,-10 3,-8 -3,-8" fill="#1e293b" opacity="0.5" /><polygon points="0,0 -3,-1.5 -3,-3 0,-1.5" fill="#94a3b8" /><polygon points="0,0 3,-1.5 3,-3 0,-1.5" fill="#cbd5e1" /></g></svg>);

export const SvgPhoneBooth = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,0 -6,-3 -6,-18 0,-15" fill="#dc2626" /><polygon points="0,0 6,-3 6,-18 0,-15" fill="#ef4444" /><polygon points="0,-15 -6,-18 0,-21 6,-18" fill="#b91c1c" /><polygon points="-2,-5 -4,-6 -4,-14 -2,-13" fill="#475569" /><polygon points="-1.5,-5.5 -3.5,-6.5 -3.5,-13.5 -1.5,-12.5" fill="url(#grad-glass)" /><polygon points="2,-5 4,-6 4,-14 2,-13" fill="#475569" /><polygon points="2.5,-5.5 3.5,-6.5 3.5,-13.5 2.5,-12.5" fill="url(#grad-glass)" /><polygon points="-1,-8 1,-9 1,-12 -1,-11" fill="#1e293b" /><circle cx="0" cy="-10" r="0.5" fill="#22c55e" filter="url(#glow-effect)" /></g></svg>);

export const SvgStreetLight = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,0 -3,-1.5 -3,-3 0,-1.5" fill="#64748b" /><polygon points="0,0 3,-1.5 3,-3 0,-1.5" fill="#94a3b8" /><polygon points="0,-1.5 -3,-3 0,-4.5 3,-3" fill="#cbd5e1" /><polygon points="-1,-3 1,-4 1,-30 -1,-29" fill="#64748b" /><polygon points="1,-4 -1,-3 -1,-29 1,-30" fill="#94a3b8" /><path d="M 0,-30 Q 8,-32 10,-28 L 10,-26 Q 8,-30 0,-28 Z" fill="#94a3b8" /><polygon points="8,-28 12,-26 12,-24 8,-26" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="10" cy="-25" r="3" fill="#fef08a" filter="url(#glow-effect)" opacity="0.5" /></g></svg>);

export const SvgBusStop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="-8,2 8,-4 10,-3 -6,3" fill="#020617" opacity="0.3" /><polygon points="-1,0 1,-1 1,-22 -1,-21" fill="#64748b" /><polygon points="1,-1 -1,0 -1,-21 1,-22" fill="#94a3b8" /><polygon points="-8,-18 8,-24 8,-22 -8,-16" fill="#3b82f6" /><polygon points="-8,-18 -6,-19 -6,-23 -8,-22" fill="#1e3a8a" /><polygon points="8,-24 6,-23 6,-27 8,-28" fill="#1d4ed8" /><polygon points="-7,-19 7,-24 7,-27 -7,-22" fill="#60a5fa" /><polygon points="-6,-20 2,-23 2,-25 -6,-22" fill="#bfdbfe" /><polygon points="-8,-2 8,-8 10,-7 -6,-1" fill="#94a3b8" /><polygon points="-8,-2 -6,-3 -6,-7 -8,-6" fill="#64748b" /></g></svg>);

export const SvgVendingMachine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,0 -8,-4 -8,-18 0,-14" fill="#1e293b" /><polygon points="0,0 8,-4 8,-18 0,-14" fill="#334155" /><polygon points="0,-14 -8,-18 0,-22 8,-18" fill="#0f172a" /><polygon points="-6,-6 -2,-4 -2,-10 -6,-12" fill="#dc2626" /><polygon points="-5.5,-6.5 -2.5,-5 -2.5,-9.5 -5.5,-11" fill="#ef4444" /><polygon points="2,-6 6,-8 6,-14 2,-12" fill="#1d4ed8" /><polygon points="2.5,-6.5 5.5,-8 5.5,-13.5 2.5,-12" fill="#3b82f6" /><polygon points="-3,-3 1,-1 1,-3 -3,-5" fill="#1e293b" /><polygon points="-2.5,-3.5 0.5,-2 0.5,-2.5 -2.5,-4" fill="#f8fafc" /><circle cx="4" cy="-5" r="1" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgTrashCan = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)"><polygon points="0,0 -5,-2.5 -5,-10 0,-7.5" fill="#475569" /><polygon points="0,0 5,-2.5 5,-10 0,-7.5" fill="#64748b" /><polygon points="0,-7.5 -5,-10 0,-12.5 5,-10" fill="#334155" /><polygon points="0,-9 -6,-12 0,-15 6,-12" fill="#94a3b8" /><polygon points="0,-9 6,-12 6,-10 0,-7" fill="#64748b" /><polygon points="0,-9 -6,-12 -6,-10 0,-7" fill="#475569" /></g></svg>);

