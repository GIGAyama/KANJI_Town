import React from 'react';

// ==========================================
// 1. Shared Definitions & Helpers (パステル調に調整)
// ==========================================
const SharedDefs = () => (
  <defs>
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#475569" floodOpacity="0.3" />
    </filter>
    <filter id="strong-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="-1" dy="4" stdDeviation="3" floodColor="#334155" floodOpacity="0.4" />
    </filter>
    <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="grad-glass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
      <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.6" />
      <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
    </linearGradient>
    <linearGradient id="grad-gold" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#f59e0b" />
      <stop offset="40%" stopColor="#fde047" />
      <stop offset="60%" stopColor="#fef08a" />
      <stop offset="100%" stopColor="#fbbf24" />
    </linearGradient>
    <linearGradient id="grad-water" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#a5f3fc" />
      <stop offset="100%" stopColor="#38bdf8" />
    </linearGradient>
    <linearGradient id="grad-roof-red" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#fca5a5" /><stop offset="100%" stopColor="#ef4444" />
    </linearGradient>
    <linearGradient id="grad-roof-blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#93c5fd" /><stop offset="100%" stopColor="#3b82f6" />
    </linearGradient>
    <linearGradient id="grad-roof-slate" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#cbd5e1" /><stop offset="100%" stopColor="#64748b" />
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

// --- Flat surface component (丸みを持たせたタイル) ---
const Fl = ({ cx = 50, cy = 75, color = '#f1f5f9', thickness = 4, scale = 1, type = 'road' }) => {
  const dx = 25 * scale;
  const dy = 12.5 * scale;
  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <SharedDefs />
      <path d={`M 0,${thickness} L ${dx},${-dy+thickness} Q ${dx+2},${-dy+thickness-1} ${dx},${-dy} L 0,0 Z`} fill={darken(color, 15)} />
      <path d={`M 0,${thickness} L -${dx},${-dy+thickness} Q -${dx+2},${-dy+thickness-1} -${dx},${-dy} L 0,0 Z`} fill={darken(color, 25)} />
      <path d={`M 0,0 L ${dx},-${dy} Q ${dx+2},-${dy+1} 0,-${dy*2} Q -${dx+2},-${dy+1} -${dx},-${dy} Z`} fill={type === 'water' ? 'url(#grad-water)' : lighten(color, 10)} stroke={darken(color, 10)} strokeWidth="2" strokeLinejoin="round" />
      {type === 'road' && (<>
        <path d={`M -${dx*0.7},-${dy} Q 0,-${dy*1.7} ${dx*0.7},-${dy}`} fill="none" stroke="#fff" strokeWidth="3" opacity="0.8" strokeLinecap="round" strokeDasharray="5,5"/>
      </>)}
      {type === 'water' && (<>
        <path d={`M -${dx*0.5},-${dy} Q 0,-${dy*1.4} ${dx*0.5},-${dy}`} fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" strokeLinecap="round"/>
        <circle cx="0" cy={-dy} r="2" fill="#fff" filter="url(#glow-effect)" opacity="0.9"/>
      </>)}
      {type === 'garden' && (<>
        <circle cx={-dx*0.3} cy={-dy*0.8} r="4" fill="#86efac" />
        <circle cx={dx*0.2} cy={-dy*1.2} r="5" fill="#4ade80" />
        <circle cx={dx*0.4} cy={-dy*0.6} r="3.5" fill="#22c55e" />
      </>)}
    </g>
  );
};

// ==========================================
// 2. Terrain Assets (角を丸く、ぽってりとしたベース)
// ==========================================
export const SvgGrassland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,60 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#b45309" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#86efac" stroke="#4ade80" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="50" cy="25" r="18" fill="#bbf7d0" opacity="0.5" />
      <circle cx="30" cy="20" r="3" fill="#bef264" />
      <circle cx="70" cy="30" r="2" fill="#bef264" />
    </g>
  </svg>
);

export const SvgBedrock = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,65 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#475569" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="35" cy="20" r="8" fill="#cbd5e1" />
      <circle cx="65" cy="25" r="10" fill="#cbd5e1" />
      <circle cx="50" cy="35" r="6" fill="#cbd5e1" />
    </g>
  </svg>
);

export const SvgRoughland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,60 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#92400e" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="40" cy="20" r="6" fill="#fbbf24" />
      <circle cx="60" cy="30" r="4" fill="#fbbf24" />
    </g>
  </svg>
);

export const SvgCleared = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,55 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#a16207" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#fde68a" stroke="#fef3c7" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="50" cy="25" rx="30" ry="12" fill="#fffbeb" opacity="0.6" />
    </g>
  </svg>
);

export const SvgForestFloor = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,60 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#064e3b" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#34d399" stroke="#6ee7b7" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="30" cy="15" r="12" fill="#10b981" opacity="0.8" />
      <circle cx="70" cy="30" r="14" fill="#10b981" opacity="0.8" />
      <circle cx="50" cy="25" r="18" fill="#10b981" opacity="0.5" />
    </g>
  </svg>
);

export const SvgSand = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,58 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#d97706" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#fef08a" stroke="#fffbeb" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 20,20 Q 50,10 80,25" fill="none" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
      <path d="M 30,30 Q 60,40 90,20" fill="none" stroke="#fde047" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgShallowWater = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,30 Q 0,40 50,55 Q 100,40 100,30 L 100,25 Q 50,55 0,25 Z" fill="#0284c7" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="url(#grad-water)" stroke="#bae6fd" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 20,20 Q 50,30 80,15" fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" strokeLinecap="round" />
      <circle cx="40" cy="15" r="3" fill="#fff" filter="url(#glow-effect)" />
      <circle cx="70" cy="25" r="2" fill="#fff" opacity="0.8" />
    </g>
  </svg>
);

export const SvgHighland = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(0, 25)">
      <path d="M 0,55 Q 0,65 50,85 Q 100,65 100,55 L 100,25 Q 50,55 0,25 Z" fill="#78716c" />
      <path d="M 0,25 Q 50,55 100,25 Q 50,-5 0,25 Z" fill="#e7e5e4" stroke="#f5f5f4" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="50" cy="20" r="15" fill="#f5f5f4" />
      <circle cx="30" cy="25" r="8" fill="#d6d3d1" />
      <circle cx="70" cy="15" r="10" fill="#d6d3d1" />
    </g>
  </svg>
);

// ==========================================
// 3. Nature Assets (モコモコ、丸み、ぽってり)
// ==========================================
export const SvgWeed = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="14" ry="6" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" />
      <path d="M 0,0 Q -15,-15 -20,-25 Q -5,-10 0,0" fill="#4ade80" />
      <path d="M 0,0 Q 15,-20 20,-35 Q 5,-15 0,0" fill="#86efac" />
      <path d="M 0,0 Q -5,-25 -10,-40 Q 5,-20 0,0" fill="#22c55e" />
      <circle cx="-20" cy="-25" r="2" fill="#bbf7d0" />
      <circle cx="20" cy="-35" r="2.5" fill="#bbf7d0" />
      <circle cx="-10" cy="-40" r="2" fill="#bbf7d0" />
    </g>
  </svg>
);

export const SvgGrass = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="16" ry="7" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" />
      <circle cx="-10" cy="-10" r="8" fill="#4ade80" />
      <circle cx="10" cy="-15" r="10" fill="#22c55e" />
      <circle cx="0" cy="-25" r="12" fill="#86efac" />
      <path d="M -10,-10 L 0,2 L 10,-15 Z" fill="#4ade80" />
    </g>
  </svg>
);

export const SvgFlower = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="12" ry="5" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" />
      <path d="M 0,0 Q -5,-15 -10,-30" fill="none" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" />
      <path d="M 0,0 Q 10,-10 15,-25" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(-10, -30)">
        <circle cx="-6" cy="-6" r="6" fill="#f9a8d4" />
        <circle cx="6" cy="-6" r="6" fill="#f9a8d4" />
        <circle cx="-6" cy="6" r="6" fill="#f9a8d4" />
        <circle cx="6" cy="6" r="6" fill="#f9a8d4" />
        <circle cx="0" cy="0" r="5" fill="#fef08a" />
      </g>
      <g transform="translate(15, -25) scale(0.8)">
        <circle cx="-5" cy="-5" r="5" fill="#fcd34d" />
        <circle cx="5" cy="-5" r="5" fill="#fcd34d" />
        <circle cx="-5" cy="5" r="5" fill="#fcd34d" />
        <circle cx="5" cy="5" r="5" fill="#fcd34d" />
        <circle cx="0" cy="0" r="4" fill="#fb923c" />
      </g>
    </g>
  </svg>
);

export const SvgTree = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <rect x="-5" y="-30" width="10" height="30" rx="4" fill="#d97706" />
      <circle cx="0" cy="-45" r="22" fill="#86efac" />
      <circle cx="-15" cy="-35" r="16" fill="#4ade80" />
      <circle cx="15" cy="-35" r="16" fill="#4ade80" />
      <circle cx="0" cy="-65" r="18" fill="#bbf7d0" />
      <circle cx="-8" cy="-55" r="5" fill="#fff" opacity="0.4" />
    </g>
  </svg>
);

export const SvgSakura = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <ellipse cx="0" cy="0" rx="16" ry="8" fill="#fbcfe8" opacity="0.5" />
      <rect x="-4" y="-30" width="8" height="30" rx="3" fill="#a16207" />
      <circle cx="0" cy="-45" r="24" fill="#fbcfe8" />
      <circle cx="-18" cy="-35" r="18" fill="#f9a8d4" />
      <circle cx="18" cy="-35" r="18" fill="#f9a8d4" />
      <circle cx="0" cy="-65" r="20" fill="#fce7f3" />
      <circle cx="-25" cy="-20" r="3" fill="#fce7f3" />
      <circle cx="20" cy="-25" r="2.5" fill="#fbcfe8" />
      <circle cx="-10" cy="5" r="2" fill="#fce7f3" />
    </g>
  </svg>
);

export const SvgPine = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="20" ry="10" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <rect x="-4" y="-30" width="8" height="30" rx="3" fill="#b45309" />
      <path d="M -25,-20 Q 0,-30 25,-20 Q 0,-60 0,-70 Q 0,-60 -25,-20 Z" fill="#34d399" stroke="#10b981" strokeWidth="4" strokeLinejoin="round" />
      <path d="M -15,-40 Q 0,-45 15,-40 Q 0,-75 0,-85 Q 0,-75 -15,-40 Z" fill="#6ee7b7" stroke="#34d399" strokeWidth="4" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgRock = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -25,0 Q -25,-20 -5,-30 Q 15,-35 25,-15 Q 30,5 15,10 Q -5,15 -25,0 Z" fill="#94a3b8" />
      <path d="M -10,-5 Q -10,-25 10,-25 Q 25,-20 15,0 Q 5,10 -10,-5 Z" fill="#cbd5e1" />
      <circle cx="-10" cy="-15" r="4" fill="#e2e8f0" />
      <circle cx="15" cy="5" r="3" fill="#64748b" />
    </g>
  </svg>
);

export const SvgBambooGrove = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 80)">
      <ellipse cx="0" cy="0" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      {[...Array(5)].map((_, i) => (
        <g key={`bamboo-${i}`} transform={`translate(${-15 + i*8}, 0) rotate(${i*5 - 10})`}>
          <rect x="-3" y="-60" width="6" height="60" rx="3" fill="#86efac" />
          <line x1="-3" y1="-20" x2="3" y2="-20" stroke="#4ade80" strokeWidth="2" />
          <line x1="-3" y1="-40" x2="3" y2="-40" stroke="#4ade80" strokeWidth="2" />
          <circle cx="-5" cy="-50" r="4" fill="#bbf7d0" />
          <circle cx="5" cy="-30" r="4" fill="#bbf7d0" />
        </g>
      ))}
    </g>
  </svg>
);

// ==========================================
// 4. Structures Assets (角丸、パステルカラー)
// ==========================================
export const SvgRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="road" color="#f8fafc" thickness={6} scale={1.6} cx={50} cy={75} /></svg>;
export const SvgWater = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="water" color="#bae6fd" thickness={5} scale={1.6} cx={50} cy={75} /></svg>;
export const SvgGarden = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="garden" color="#fef3c7" thickness={6} scale={1.6} cx={50} cy={75} /></svg>;

export const SvgFence = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <path d="M -20,0 L 20,-20 L 25,-18 L -15,2 Z" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" />
      <rect x="-18" y="-20" width="6" height="20" rx="3" fill="#fcd34d" />
      <rect x="2" y="-30" width="6" height="20" rx="3" fill="#fcd34d" />
      <path d="M -15,-10 L 5,-20" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
      <path d="M -15,-15 L 5,-25" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgHouse1 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -20,-14 L -20,-30 Q -20,-35 0,-40 Q 20,-35 20,-30 L 20,-14 Q 20,-9 0,-1 Q -20,-9 -20,-14 Z" fill="#fffbeb" />
      <path d="M 0,-1 L 0,-40 Q 20,-35 20,-30 L 20,-14 Q 20,-9 0,-1 Z" fill="#fef3c7" />
      <path d="M -24,-28 L 0,-46 L 24,-28 Q 24,-23 0,-42 Q -24,-23 -24,-28 Z" fill="url(#grad-roof-red)" stroke="#fca5a5" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 0,-46 L 24,-28 Q 24,-23 0,-42 Z" fill="#fecaca" />
      <rect x="4" y="-22" width="10" height="14" rx="5" fill="#fcd34d" />
      <circle cx="12" cy="-15" r="1.5" fill="#fff" />
      <circle cx="-10" cy="-18" r="6" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
    </g>
  </svg>
);

export const SvgHouse2 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -24,-15 L -24,-35 Q -24,-40 0,-45 Q 24,-40 24,-35 L 24,-15 Q 24,-10 0,-2 Q -24,-10 -24,-15 Z" fill="#ffedd5" />
      <path d="M 0,-2 L 0,-45 Q 24,-40 24,-35 L 24,-15 Q 24,-10 0,-2 Z" fill="#fed7aa" />
      <path d="M -28,-32 L 0,-52 L 28,-32 Q 28,-27 0,-48 Q -28,-27 -28,-32 Z" fill="url(#grad-roof-blue)" stroke="#93c5fd" strokeWidth="3" strokeLinejoin="round" />
      <path d="M 0,-52 L 28,-32 Q 28,-27 0,-48 Z" fill="#bfdbfe" />
      <rect x="-18" y="-24" width="12" height="12" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
      <rect x="6" y="-28" width="12" height="12" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
      <rect x="8" y="-38" width="6" height="10" rx="2" fill="#fef08a" />
    </g>
  </svg>
);

export const SvgHouse3 = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -26,-13 L -26,-30 Q -10,-40 0,-30 L 16,-38 L 16,-20 Q 16,-10 0,0 Q -26,-10 -26,-13 Z" fill="#f8fafc" />
      <path d="M 0,0 L 0,-30 L 16,-38 L 16,-20 Q 16,-10 0,0 Z" fill="#e2e8f0" />
      <circle cx="-12" cy="-18" r="6" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="8" cy="-18" r="5" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="8" cy="-28" r="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M -30,-28 L 0,-42 L 18,-33 L 0,-23 Z" fill="url(#grad-roof-slate)" stroke="#e2e8f0" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-20" cy="-26" r="4" fill="#86efac" />
    </g>
  </svg>
);

export const SvgShop = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -20,-12 L -20,-30 Q -20,-35 0,-40 Q 22,-35 22,-30 L 22,-12 Q 22,-7 0,0 Q -20,-7 -20,-12 Z" fill="#fef08a" />
      <path d="M 0,0 L 0,-40 Q 22,-35 22,-30 L 22,-12 Q 22,-7 0,0 Z" fill="#fde047" />
      <rect x="-16" y="-20" width="10" height="12" rx="4" fill="url(#grad-glass)" stroke="#f59e0b" strokeWidth="2" />
      <rect x="4" y="-26" width="14" height="16" rx="4" fill="url(#grad-glass)" stroke="#f59e0b" strokeWidth="2" />
      <path d="M 0,-18 L 22,-28 L 24,-24 L 2,-14 Z" fill="#fca5a5" />
      <path d="M 0,-40 L -24,-30 Q -24,-25 0,-35 Q 26,-25 26,-30 L 0,-40 Z" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgSchool = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="38" ry="19" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -32,-16 L -32,-35 Q -32,-40 0,-45 Q 32,-40 32,-35 L 32,-16 Q 32,-10 0,0 Q -32,-10 -32,-16 Z" fill="#f8fafc" />
      <path d="M 0,0 L 0,-45 Q 32,-40 32,-35 L 32,-16 Q 32,-10 0,0 Z" fill="#e2e8f0" />
      {[...Array(3)].map((_, i) => (
        <circle key={`w1-${i}`} cx={-24 + i*8} cy={-16 + i*4} r="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="1.5" />
      ))}
      {[...Array(4)].map((_, i) => (
        <circle key={`w2-${i}`} cx={4 + i*8} cy={-22 - i*4} r="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="1.5" />
      ))}
      <rect x="-12" y="-38" width="16" height="40" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="-4" cy="-28" r="6" fill="#fef08a" />
      <path d="M -36,-32 L 0,-50 L 36,-32 Q 36,-27 0,-45 Q -36,-27 -36,-32 Z" fill="url(#grad-roof-red)" stroke="#fca5a5" strokeWidth="2" strokeLinejoin="round" />
      <rect x="-6" y="-12" width="8" height="12" rx="4" fill="#fcd34d" />
    </g>
  </svg>
);

export const SvgWall = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -20,-10 L -20,-30 Q -20,-35 0,-40 Q 20,-35 20,-30 L 20,-10 Q 20,-5 0,0 Q -20,-5 -20,-10 Z" fill="#e2e8f0" />
      <path d="M 0,0 L 0,-40 Q 20,-35 20,-30 L 20,-10 Q 20,-5 0,0 Z" fill="#cbd5e1" />
      <path d="M -22,-28 L 0,-42 L 22,-28 Q 22,-25 0,-38 Q -22,-25 -22,-28 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="0" cy="-20" r="8" fill="#f8fafc" />
    </g>
  </svg>
);

export const SvgBridge = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 65)">
      <ellipse cx="0" cy="5" rx="18" ry="6" fill="#bae6fd" opacity="0.8" />
      <path d="M -25,10 Q 0,-20 25,10 L 25,20 Q 0,-10 -25,20 Z" fill="#fef08a" />
      <path d="M -25,10 Q 0,-20 25,10" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" />
      <rect x="-26" y="0" width="4" height="15" rx="2" fill="#fcd34d" />
      <rect x="22" y="0" width="4" height="15" rx="2" fill="#fcd34d" />
    </g>
  </svg>
);

// ==========================================
// 5. Economy & Industry Assets
// ==========================================
export const SvgWarehouse = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="34" ry="17" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -24,-15 L -24,-35 Q -24,-40 0,-45 Q 24,-40 24,-35 L 24,-15 Q 24,-10 0,-2 Q -24,-10 -24,-15 Z" fill="#e2e8f0" />
      <path d="M 0,-2 L 0,-45 Q 24,-40 24,-35 L 24,-15 Q 24,-10 0,-2 Z" fill="#cbd5e1" />
      <rect x="4" y="-24" width="14" height="18" rx="2" fill="#94a3b8" />
      <path d="M -28,-32 L 0,-48 L 28,-32 Q 28,-28 0,-44 Q -28,-28 -28,-32 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="-10" cy="-20" r="5" fill="#fcd34d" />
    </g>
  </svg>
);

export const SvgGrandWarehouse = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="40" ry="20" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -32,-16 L -32,-36 Q -32,-42 0,-48 Q 32,-42 32,-36 L 32,-16 Q 32,-10 0,0 Q -32,-10 -32,-16 Z" fill="#fca5a5" />
      <path d="M 0,0 L 0,-48 Q 32,-42 32,-36 L 32,-16 Q 32,-10 0,0 Z" fill="#f87171" />
      {[...Array(3)].map((_, i) => (
        <circle key={`w-${i}`} cx={12 + i*8} cy={-16 - i*4} r="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
      ))}
      <path d="M -36,-35 L 0,-54 L 36,-35 Q 36,-30 0,-49 Q -36,-30 -36,-35 Z" fill="#cbd5e1" stroke="#e2e8f0" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="-15" cy="-25" r="8" fill="#fcd34d" />
    </g>
  </svg>
);

export const SvgMarket = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-2" rx="36" ry="18" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" />
      <path d="M -30,-15 Q 0,-30 30,-15 Q 0,0 -30,-15 Z" fill="#fef3c7" />
      {[{x:-12,y:-5,c:'#fca5a5'},{x:15,y:-12,c:'#93c5fd'},{x:0,y:-22,c:'#fde047'}].map((s,i) => (
        <g key={`st-${i}`} transform={`translate(${s.x}, ${s.y})`}>
          <rect x="-8" y="-12" width="16" height="8" rx="2" fill="#fef08a" />
          <path d="M -10,-14 Q 0,-25 10,-14 Z" fill={s.c} stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="-6" cy="-6" r="2" fill="#fcd34d" />
          <circle cx="6" cy="-6" r="2" fill="#fcd34d" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgPort = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-2" rx="38" ry="19" fill="url(#grad-water)" />
      <path d="M -15,5 Q 0,10 15,5" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" strokeLinecap="round" />
      <path d="M -35,-2 Q -15,-15 5,-2 Q -15,10 -35,-2 Z" fill="#fef3c7" stroke="#fde68a" strokeWidth="2" />
      <rect x="0" y="-15" width="20" height="10" rx="3" fill="#fcd34d" transform="matrix(1 -0.5 0 1 0 0)" />
      <g transform="translate(-10, -5)">
        <rect x="-4" y="-15" width="8" height="15" rx="2" fill="#fca5a5" />
        <rect x="0" y="-15" width="4" height="15" rx="2" fill="#f87171" />
      </g>
      <circle cx="10" cy="-10" r="4" fill="#60a5fa" />
    </g>
  </svg>
);

export const SvgSmithy = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -20,-16 L -20,-30 Q -20,-35 0,-40 Q 10,-37 10,-20 L 10,-6 Q 10,-1 0,0 Q -20,-7 -20,-16 Z" fill="#fde68a" />
      <path d="M 0,0 L 0,-40 Q 10,-37 10,-20 L 10,-6 Q 10,-1 0,0 Z" fill="#fcd34d" />
      <circle cx="-8" cy="-12" r="6" fill="#cbd5e1" />
      <circle cx="-8" cy="-12" r="3" fill="#fca5a5" filter="url(#glow-effect)" />
      <rect x="2" y="-55" width="6" height="40" rx="3" fill="#cbd5e1" />
      <circle cx="5" cy="-55" r="8" fill="#fff" opacity="0.5" filter="url(#glow-effect)" />
      <path d="M -24,-28 L 0,-45 L 14,-35 Q 14,-30 0,-40 Q -24,-23 -24,-28 Z" fill="#f87171" stroke="#fca5a5" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFactory = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="36" ry="18" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -30,-18 L -30,-38 Q -30,-43 0,-48 Q 30,-43 30,-38 L 30,-18 Q 30,-12 0,-2 Q -30,-12 -30,-18 Z" fill="#fca5a5" />
      <path d="M 0,-2 L 0,-48 Q 30,-43 30,-38 L 30,-18 Q 30,-12 0,-2 Z" fill="#f87171" />
      <circle cx="-15" cy="-15" r="5" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
      <circle cx="5" cy="-10" r="5" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" />
      <g transform="translate(-18, -35)">
        <rect x="-4" y="-30" width="8" height="30" rx="4" fill="#cbd5e1" />
        <circle cx="0" cy="-35" r="8" fill="#fff" opacity="0.6" filter="url(#glow-effect)" />
      </g>
      <g transform="translate(-6, -41)">
        <rect x="-3" y="-25" width="6" height="25" rx="3" fill="#94a3b8" />
        <circle cx="0" cy="-30" r="6" fill="#fff" opacity="0.6" filter="url(#glow-effect)" />
      </g>
      <rect x="-4" y="-14" width="8" height="12" rx="4" fill="#fef08a" />
    </g>
  </svg>
);

export const SvgWatermill = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="0" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -30,5 Q -10,15 20,0 Q 0,-10 -30,5 Z" fill="url(#grad-water)" opacity="0.8" />
      <path d="M -16,-8 L -16,-20 Q -16,-25 0,-30 Q 16,-25 16,-20 L 16,-8 Q 16,-3 0,4 Q -16,-3 -16,-8 Z" fill="#fffbeb" />
      <path d="M 0,4 L 0,-30 Q 16,-25 16,-20 L 16,-8 Q 16,-3 0,4 Z" fill="#fef3c7" />
      <circle cx="-16" cy="-8" r="8" fill="#fcd34d" stroke="#f59e0b" strokeWidth="2" />
      <circle cx="-16" cy="-8" r="3" fill="#fef08a" />
      <path d="M -20,-24 L 0,-38 L 20,-24 Q 20,-19 0,-33 Q -20,-19 -20,-24 Z" fill="#fde047" stroke="#fef08a" strokeWidth="3" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgMine = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-2" rx="32" ry="16" fill="#475569" opacity="0.4" filter="url(#soft-shadow)" />
      <path d="M -25,-5 Q -15,-40 0,-45 Q 20,-40 30,-10 Q 15,10 -25,-5 Z" fill="#94a3b8" />
      <path d="M 0,-45 Q 20,-40 30,-10 Q 15,10 0,0 Q -10,-20 0,-45 Z" fill="#cbd5e1" />
      <circle cx="0" cy="0" r="10" fill="#475569" />
      <rect x="-12" y="-18" width="24" height="6" rx="3" fill="#fcd34d" />
      <rect x="-10" y="-12" width="4" height="12" rx="2" fill="#fcd34d" />
      <rect x="6" y="-12" width="4" height="12" rx="2" fill="#fcd34d" />
      <circle cx="-10" cy="-2" r="3" fill="#fef08a" filter="url(#glow-effect)" />
      <circle cx="15" cy="-5" r="4" fill="#fef08a" filter="url(#glow-effect)" />
      <rect x="-10" y="2" width="10" height="6" rx="2" fill="#94a3b8" />
      <circle cx="-6" cy="4" r="2" fill="#fef08a" />
    </g>
  </svg>
);

// ==========================================
// 6. Special & Mega Assets
// ==========================================
export const SvgCastle = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="38" ry="19" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -28,-14 L -28,-24 Q -28,-29 0,-34 Q 28,-29 28,-24 L 28,-14 Q 28,-9 0,-1 Q -28,-9 -28,-14 Z" fill="#f1f5f9" />
      <path d="M 0,-1 L 0,-34 Q 28,-29 28,-24 L 28,-14 Q 28,-9 0,-1 Z" fill="#e2e8f0" />
      {[{x:-28,y:-14},{x:28,y:-14},{x:-14,y:-28},{x:14,y:-28}].map((t, i) => (
        <g key={`t-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <rect x="-6" y="-25" width="12" height="25" rx="4" fill="#f8fafc" />
          <path d="M -8,-22 L 0,-40 L 8,-22 Q 8,-17 0,-35 Q -8,-17 -8,-22 Z" fill="url(#grad-roof-blue)" stroke="#93c5fd" strokeWidth="2" strokeLinejoin="round" />
        </g>
      ))}
      <g transform="translate(0, -18)">
        <rect x="-16" y="-30" width="32" height="30" rx="4" fill="#fff" />
        <path d="M -20,-28 L 0,-50 L 20,-28 Q 20,-23 0,-45 Q -20,-23 -20,-28 Z" fill="url(#grad-roof-blue)" stroke="#93c5fd" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="0" cy="-60" r="3" fill="#fef08a" />
        <rect x="-4" y="-58" width="8" height="4" rx="2" fill="#fca5a5" />
      </g>
      <rect x="-6" y="-12" width="12" height="12" rx="6" fill="#fcd34d" />
    </g>
  </svg>
);

export const SvgGoldCastle = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-5" rx="40" ry="20" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -30,-15 L -30,-25 Q -30,-30 0,-35 Q 30,-30 30,-25 L 30,-15 Q 30,-10 0,-2 Q -30,-10 -30,-15 Z" fill="url(#grad-gold)" />
      {[{x:-30,y:-15},{x:30,y:-15},{x:-15,y:-30},{x:15,y:-30}].map((t, i) => (
        <g key={`gt-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <rect x="-6" y="-30" width="12" height="30" rx="4" fill="url(#grad-gold)" />
          <path d="M -8,-27 L 0,-48 L 8,-27 Q 8,-22 0,-43 Q -8,-22 -8,-27 Z" fill="url(#grad-roof-red)" stroke="#fca5a5" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="0" cy="-49" r="3" fill="#fff" filter="url(#glow-effect)" />
        </g>
      ))}
      <g transform="translate(0, -20)">
        <rect x="-18" y="-35" width="36" height="35" rx="4" fill="#fffbeb" />
        <path d="M -22,-33 L 0,-60 L 22,-33 Q 22,-28 0,-55 Q -22,-28 -22,-33 Z" fill="url(#grad-roof-red)" stroke="#fca5a5" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="0" cy="-62" r="4" fill="#fff" filter="url(#glow-effect)" />
      </g>
      <rect x="-8" y="-14" width="16" height="16" rx="8" fill="#fef08a" />
    </g>
  </svg>
);

export const SvgTorii = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="-16" cy="-4" rx="6" ry="3" fill="#cbd5e1" />
      <ellipse cx="16" cy="4" rx="6" ry="3" fill="#cbd5e1" />
      <rect x="-18" y="-45" width="6" height="40" rx="3" fill="#fca5a5" />
      <rect x="12" y="-35" width="6" height="40" rx="3" fill="#fca5a5" />
      <rect x="-26" y="-30" width="52" height="6" rx="3" fill="#fca5a5" transform="rotate(10)" />
      <rect x="-32" y="-46" width="64" height="8" rx="4" fill="#f87171" transform="rotate(10)" />
      <rect x="-4" y="-34" width="8" height="8" rx="2" fill="#fef08a" />
    </g>
  </svg>
);

export const SvgTemple = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs />
    <g transform="translate(50, 75)">
      <ellipse cx="0" cy="-2" rx="36" ry="18" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" />
      <path d="M -28,-14 L -28,-18 Q -28,-23 0,-28 Q 28,-23 28,-18 L 28,-14 Q 28,-9 0,-1 Q -28,-9 -28,-14 Z" fill="#e7e5e4" />
      <rect x="-14" y="-28" width="10" height="15" rx="3" fill="#f8fafc" />
      <rect x="4" y="-28" width="10" height="15" rx="3" fill="#f1f5f9" />
      <path d="M -34,-26 L 0,-40 L 34,-26 Q 34,-21 0,-35 Q -34,-21 -34,-26 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" />
      <path d="M -22,-40 L 0,-52 L 22,-40 Q 22,-35 0,-47 Q -22,-35 -22,-40 Z" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="0" cy="-55" r="4" fill="#fef08a" filter="url(#glow-effect)" />
      <circle cx="-16" cy="-22" r="3" fill="#fca5a5" filter="url(#glow-effect)" />
      <circle cx="16" cy="-22" r="3" fill="#fca5a5" filter="url(#glow-effect)" />
    </g>
  </svg>
);

export const SvgDragon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs />
    <g transform="translate(50, 70)" filter="url(#strong-shadow)">
      <ellipse cx="0" cy="5" rx="22" ry="11" fill="#475569" opacity="0.3" />
      <circle cx="0" cy="0" r="16" fill="#a7f3d0" />
      <circle cx="-10" cy="-10" r="14" fill="#6ee7b7" />
      <circle cx="10" cy="-15" r="12" fill="#34d399" />
      <circle cx="0" cy="-25" r="16" fill="#10b981" />
      <circle cx="-15" cy="-35" r="14" fill="#10b981" />
      <circle cx="-25" cy="-45" r="12" fill="#059669" />
      <circle cx="-20" cy="-45" r="3" fill="#fef08a" />
      <circle cx="-28" cy="-42" r="3" fill="#fef08a" />
      <path d="M -35,-35 Q -40,-30 -45,-35 Q -40,-40 -35,-35 Z" fill="#fca5a5" opacity="0.8" />
      <circle cx="15" cy="5" r="4" fill="#fcd34d" />
      <circle cx="-15" cy="5" r="4" fill="#fcd34d" />
    </g>
  </svg>
);

export const SvgMegaGrandMarket = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="48" ry="24" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -42,-16 Q -42,-21 0,-26 Q 42,-21 42,-16 L 42,-12 Q 42,-7 0,2 Q -42,-7 -42,-12 Z" fill="#fef3c7" /><g transform="translate(0, -16)"><rect x="-16" y="-20" width="32" height="20" rx="4" fill="#fff" /><path d="M -20,-18 L 0,-36 L 20,-18 Q 20,-13 0,-31 Q -20,-13 -20,-18 Z" fill="url(#grad-glass)" stroke="#bae6fd" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-40" r="4" fill="#fef08a" filter="url(#glow-effect)" /></g><circle cx="-25" cy="-5" r="6" fill="#fca5a5" /><circle cx="25" cy="-15" r="6" fill="#93c5fd" /></g></svg>);

export const SvgMegaFortress = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="44" ry="22" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -35,-14.5 Q -35,-19.5 0,-24.5 Q 35,-19.5 35,-14.5 Q 35,-9.5 0,2 Q -35,-9.5 -35,-14.5 Z" fill="#fca5a5" /><rect x="-25" y="-25" width="50" height="25" rx="5" fill="#e2e8f0" /><rect x="-20" y="-38" width="40" height="16" rx="4" fill="#cbd5e1" /><g transform="translate(0, -32)"><rect x="-12" y="-30" width="24" height="30" rx="4" fill="#94a3b8" /><path d="M -16,-28 L 0,-42 L 16,-28 Q 16,-23 0,-37 Q -16,-23 -16,-28 Z" fill="#f87171" stroke="#fca5a5" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-20" r="5" fill="#fca5a5" /></g></g></svg>);

export const SvgMegaAcademy = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="44" ry="22" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -38,-15 Q -38,-20 0,-25 Q 38,-20 38,-15 Q 38,-10 0,2 Q -38,-10 -38,-15 Z" fill="#bbf7d0" /><g transform="translate(0, -18)"><rect x="-14" y="-25" width="28" height="25" rx="5" fill="#f8fafc" /><circle cx="0" cy="-32" r="16" fill="url(#grad-glass)" stroke="#e0f2fe" strokeWidth="2" /><circle cx="0" cy="-32" r="8" fill="#fef08a" /></g><g transform="translate(0, -65)"><circle cx="0" cy="0" r="6" fill="#a7f3d0" filter="url(#glow-effect)" opacity="0.9" /><ellipse cx="0" cy="0" rx="16" ry="6" fill="none" stroke="#6ee7b7" strokeWidth="2" transform="rotate(15)" opacity="0.8" filter="url(#glow-effect)"/></g><circle cx="-25" cy="-2" r="5" fill="#6ee7b7" filter="url(#soft-shadow)" /><circle cx="25" cy="-2" r="5" fill="#34d399" filter="url(#soft-shadow)" /></g></svg>);

export const SvgMegaImperialPalace = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="44" ry="22" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -35,-15.5 Q -35,-20.5 0,-25.5 Q 35,-20.5 35,-15.5 Q 35,-10.5 0,2 Q -35,-10.5 -35,-15.5 Z" fill="#e2e8f0" /><rect x="-4" y="-26" width="8" height="26" rx="3" fill="#f8fafc" /><g transform="translate(0, -25)"><rect x="-16" y="-20" width="32" height="20" rx="4" fill="#fca5a5" /><path d="M -24,-18 L 0,-30 L 24,-18 Q 24,-13 0,-25 Q -24,-13 -24,-18 Z" fill="url(#grad-gold)" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" /><rect x="-10" y="-27" width="20" height="8" rx="2" fill="#fca5a5" /><path d="M -18,-25 L 0,-36 L 18,-25 Q 18,-20 0,-31 Q -18,-20 -18,-25 Z" fill="url(#grad-gold)" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-40" r="4" fill="#fff" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgMegaWonder = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="36" ry="18" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -30,-18 L -30,-33 Q -30,-38 0,-43 Q 30,-38 30,-33 L 30,-18 Q 30,-13 0,-3 Q -30,-13 -30,-18 Z" fill="#fef08a" /><rect x="-14" y="-29" width="28" height="7" rx="3" fill="#fffbeb" /><g transform="translate(0, -45)" filter="url(#strong-shadow)"><circle cx="0" cy="-10" r="18" fill="url(#grad-glass)" stroke="#bae6fd" strokeWidth="2" /><ellipse cx="0" cy="-10" rx="26" ry="8" fill="none" stroke="url(#grad-gold)" strokeWidth="3" transform="rotate(20)" filter="url(#glow-effect)" /></g><circle cx="0" cy="-20" r="3" fill="#bae6fd" filter="url(#glow-effect)" opacity="0.8" /></g></svg>);

export const SvgMegaHarborTown = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="42" ry="21" fill="url(#grad-water)" /><path d="M -40,-2 Q -40,18 0,18 Q 40,18 40,-2 Q 40,-22 0,-22 Q -40,-22 -40,-2 Z" fill="#bae6fd" opacity="0.5" /><path d="M -40,-2 L -10,-17 Q 0,-22 10,-17 L 40,-2 Q 40,3 0,8 Q -40,3 -40,-2 Z" fill="#fef3c7" /><g transform="translate(0, 4)"><circle cx="0" cy="-5" r="10" fill="#fcd34d" /><rect x="-2" y="-20" width="4" height="15" rx="2" fill="#d97706" /><circle cx="0" cy="-22" r="8" fill="#fffbeb" opacity="0.9" /></g><g transform="translate(20, -8) scale(0.9)"><rect x="-5" y="-30" width="10" height="24" rx="3" fill="#f8fafc" /><path d="M -7,-28 L 0,-36 L 7,-28 Q 7,-23 0,-31 Q -7,-23 -7,-28 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-38" r="3" fill="#fef08a" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgMegaShrineComplex = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="44" ry="22" fill="#10b981" opacity="0.5" filter="url(#soft-shadow)" /><path d="M -38,-17 L -38,-36 Q -38,-41 0,-46 Q 38,-41 38,-36 L 38,-17 Q 38,-12 0,0 Q -38,-12 -38,-17 Z" fill="#6ee7b7" /><rect x="-16" y="-6" width="32" height="4" rx="2" fill="#e2e8f0" /><g transform="translate(0, -30)"><rect x="-20" y="-24" width="40" height="10" rx="3" fill="#fffbeb" /><rect x="-14" y="-28" width="28" height="5" rx="2" fill="#f8fafc" /><path d="M -26,-22 L 0,-36 L 26,-22 Q 26,-17 0,-31 Q -26,-17 -26,-22 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-40" r="3" fill="#fef08a" filter="url(#glow-effect)" /></g><circle cx="-25" cy="-12" r="10" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="-20" cy="-18" r="8" fill="#f9a8d4" /><circle cx="30" cy="-5" r="8" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="25" cy="0" r="7" fill="#f9a8d4" /></g></svg>);

export const SvgCherryPavilion = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -18,-14 L -18,-23 Q -18,-28 0,-33 Q 18,-28 18,-23 L 18,-14 Q 18,-9 0,-1 Q -18,-9 -18,-14 Z" fill="#fef08a" /><path d="M -26,-22 L 0,-40 L 26,-22 Q 26,-17 0,-35 Q -26,-17 -26,-22 Z" fill="#f9a8d4" stroke="#fbcfe8" strokeWidth="3" strokeLinejoin="round" /><circle cx="0" cy="-44" r="3" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="-25" cy="-10" r="8" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="-20" cy="-15" r="6" fill="#f9a8d4" /><circle cx="22" cy="-5" r="9" fill="#fbcfe8" filter="url(#soft-shadow)" /><circle cx="18" cy="-12" r="7" fill="#f9a8d4" /></g></svg>);

export const SvgCrystalTower = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><circle cx="0" cy="-5" r="14" fill="#bae6fd" opacity="0.8" filter="url(#glow-effect)" /><circle cx="-5" cy="-15" r="12" fill="#93c5fd" opacity="0.8" filter="url(#glow-effect)" /><circle cx="5" cy="-25" r="10" fill="#6ee7b7" opacity="0.9" filter="url(#glow-effect)" /><circle cx="0" cy="-45" r="16" fill="#a7f3d0" opacity="0.9" filter="url(#glow-effect)" /><circle cx="-8" cy="-35" r="8" fill="#bae6fd" filter="url(#glow-effect)" /><circle cx="8" cy="-35" r="6" fill="#93c5fd" filter="url(#glow-effect)" /><circle cx="0" cy="-65" r="4" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgPhilosophersLab = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><rect x="-14" y="-45" width="28" height="30" rx="6" fill="#cbd5e1" /><rect x="-8" y="-36" width="4" height="10" rx="2" fill="#fef08a" filter="url(#glow-effect)" opacity="0.8" /><rect x="4" y="-32" width="4" height="10" rx="2" fill="#d8b4fe" filter="url(#glow-effect)" opacity="0.8" /><path d="M -18,-40 L 0,-55 L 18,-40 Q 18,-35 0,-50 Q -18,-35 -18,-40 Z" fill="#a78bfa" stroke="#c4b5fd" strokeWidth="2" strokeLinejoin="round" /><circle cx="-14" cy="-52" r="6" fill="#e9d5ff" filter="url(#glow-effect)" opacity="0.8" /><circle cx="-20" cy="-58" r="4" fill="#d8b4fe" filter="url(#glow-effect)" opacity="0.6" /></g></svg>);

export const SvgDragonShrine = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -22,-19 L -22,-23 L 12,-26 L 12,-22 Z" fill="#cbd5e1" /><rect x="-14" y="-32" width="20" height="14" rx="4" fill="#f1f5f9" /><path d="M -22,-28 L -4,-42 L 14,-28 Q 14,-23 -4,-37 Q -22,-23 -22,-28 Z" fill="#6ee7b7" stroke="#a7f3d0" strokeWidth="2" strokeLinejoin="round" /><circle cx="-16" cy="-25" r="4" fill="#bbf7d0" filter="url(#glow-effect)" /><circle cx="8" cy="-25" r="4" fill="#bbf7d0" filter="url(#glow-effect)" /></g></svg>);

export const SvgPerfectMonument = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-5" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-15 L -20,-25 Q -20,-30 0,-35 Q 20,-30 20,-25 L 20,-15 Q 20,-10 0,-2 Q -20,-10 -20,-15 Z" fill="#f8fafc" /><g transform="translate(0, -40)" filter="url(#strong-shadow)"><circle cx="0" cy="0" r="18" fill="url(#grad-gold)" /><circle cx="-4" cy="-4" r="16" fill="#fef08a" opacity="0.6" /><circle cx="-6" cy="-6" r="8" fill="#fff" filter="url(#glow-effect)" opacity="0.8" /><ellipse cx="0" cy="0" rx="24" ry="8" fill="none" stroke="#fff" strokeWidth="2" transform="rotate(15)" filter="url(#glow-effect)" opacity="0.9" /></g><path d="M 0,-23 L 0,-26" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" filter="url(#glow-effect)" opacity="0.8" /></g></svg>);

export const SvgHotSpring = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#e2e8f0" /><path d="M -25,-2 Q -15,-12 5,-15 Q 18,-5 10,2 Q -10,2 -25,-2 Z" fill="url(#grad-water)" opacity="0.9" /><circle cx="-15" cy="-8" r="4" fill="#cbd5e1" /><circle cx="12" cy="-2" r="3.5" fill="#cbd5e1" /><path d="M -5,-10 Q -10,-20 -5,-30" stroke="#fff" strokeWidth="3" fill="none" opacity="0.8" filter="url(#glow-effect)" strokeLinecap="round" /><path d="M 8,-5 Q 15,-15 8,-25" stroke="#fff" strokeWidth="3" fill="none" opacity="0.7" filter="url(#glow-effect)" strokeLinecap="round" /><circle cx="20" cy="-12" r="4" fill="#fca5a5" /><circle cx="20" cy="-14" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgObservatory = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -16,0 L -16,-25 Q -16,-30 0,-35 Q 16,-30 16,-25 L 16,0 Q 16,5 0,10 Q -16,5 -16,0 Z" fill="#cbd5e1" /><circle cx="0" cy="-40" r="18" fill="#5eead4" /><rect x="-22" y="-18" width="20" height="15" rx="3" fill="#f8fafc" /><circle cx="-12" cy="-10" r="4" fill="#93c5fd" opacity="0.8" /><rect x="-4" y="-18" width="8" height="8" rx="2" fill="url(#grad-glass)" /></g></svg>);

export const SvgShoppingStreet = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="35" ry="17" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -25,-10 L 5,-28 L 35,-20 L 5,0 Z" fill="#f1f5f9" /><g transform="translate(-20, -10)"><rect x="-12" y="-20" width="20" height="13" rx="3" fill="#ffedd5" /><path d="M -14,-18 L -2,-26 L 10,-18 Q 10,-15 -2,-23 Q -14,-15 -14,-18 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /></g><g transform="translate(-14, -14)"><rect x="-12" y="-20" width="20" height="13" rx="3" fill="#fef3c7" /><path d="M -14,-18 L -2,-26 L 10,-18 Q 10,-15 -2,-23 Q -14,-15 -14,-18 Z" fill="#93c5fd" stroke="#bae6fd" strokeWidth="2" strokeLinejoin="round" /></g><g transform="translate(10, -25)"><rect x="-12" y="-20" width="20" height="13" rx="3" fill="#ecfccb" /><path d="M -14,-18 L -2,-26 L 10,-18 Q 10,-15 -2,-23 Q -14,-15 -14,-18 Z" fill="#6ee7b7" stroke="#a7f3d0" strokeWidth="2" strokeLinejoin="round" /></g></g></svg>);

export const SvgZenGarden = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-3" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -26,-16 L -26,-3 Q -26,2 0,7 Q 26,2 26,-3 L 26,-16 Q 26,-11 0,-6 Q -26,-11 -26,-16 Z" fill="#fef3c7" /><path d="M -20,-16 L 0,-26 L 20,-16 L 0,-6 Z" fill="none" stroke="#fde68a" strokeWidth="1" strokeLinejoin="round" /><path d="M -15,-13.5 L 0,-21 L 15,-13.5 L 0,-6 Z" fill="none" stroke="#fde68a" strokeWidth="1" strokeLinejoin="round" /><circle cx="-8" cy="-18" r="6" fill="#f8fafc" /><circle cx="-9" cy="-17" r="2" fill="#86efac" opacity="0.8" /><circle cx="12" cy="-12" r="5" fill="#e2e8f0" /><circle cx="11" cy="-12" r="1.5" fill="#86efac" opacity="0.8" /></g></svg>);

export const SvgNationalLibrary = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="40" ry="20" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -32,-20 L -32,-36 Q -32,-41 0,-46 Q 32,-41 32,-36 L 32,-20 Q 32,-15 0,-5 Q -32,-15 -32,-20 Z" fill="#e2e8f0" /><rect x="-28" y="-45" width="56" height="16" rx="4" fill="#fef08a" /><rect x="-30" y="-48" width="60" height="5" rx="2" fill="#cbd5e1" /><g transform="translate(0, -42)"><rect x="-12" y="-12" width="24" height="6" rx="2" fill="#f1f5f9" /><circle cx="0" cy="-20" r="8" fill="#5eead4" /><rect x="-2" y="-30" width="4" height="3" rx="1" fill="#f8fafc" /><circle cx="0" cy="-31.5" r="1.5" fill="#5eead4" /></g></g></svg>);

export const SvgWell = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="16" ry="8" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,-6 L -12,-14 Q -12,-18 0,-22 Q 12,-18 12,-14 L 12,-6 Q 12,-2 0,2 Q -12,-2 -12,-6 Z" fill="#94a3b8" /><ellipse cx="0" cy="-15" rx="8" ry="4" fill="url(#grad-water)" opacity="0.9" /><path d="M -14,-22 L -14,-37 L 0,-44 L 14,-37 L 14,-22" fill="none" stroke="#fcd34d" strokeWidth="3" strokeLinejoin="round" /><rect x="-2" y="-10" width="4" height="5" rx="1" fill="#f59e0b" /></g></svg>);

export const SvgTownhall = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="32" ry="16" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -24,-16 L -24,-28 Q -24,-33 0,-38 Q 24,-33 24,-28 L 24,-16 Q 24,-11 0,-3 Q -24,-11 -24,-16 Z" fill="#f8fafc" /><path d="M -22,-15 L -22,-24 Q -22,-29 0,-34 Q 22,-29 22,-24 L 22,-15 Q 22,-10 0,-2 Q -22,-10 -22,-15 Z" fill="#fca5a5" /><path d="M -26,-25 L 0,-40 L 26,-25 Q 26,-20 0,-35 Q -26,-20 -26,-25 Z" fill="url(#grad-roof-slate)" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" /><rect x="-8" y="-40" width="16" height="32" rx="4" fill="#fff" /><rect x="-4" y="-12" width="8" height="6" rx="2" fill="#fcd34d" /><circle cx="-4" cy="-28" r="3" fill="#fef08a" /><circle cx="4" cy="-28" r="3" fill="#fef08a" /><path d="M -10,-39 L 0,-50 L 10,-39 Q 10,-34 0,-45 Q -10,-34 -10,-39 Z" fill="url(#grad-roof-blue)" stroke="#93c5fd" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-57" r="2" fill="#fef08a" /></g></svg>);

export const SvgEmbassy = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="32" ry="16" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><rect x="-12" y="-2" width="24" height="4" rx="2" fill="#fca5a5" /><path d="M -26,-17 L -26,-30 Q -26,-35 0,-40 Q 26,-35 26,-30 L 26,-17 Q 26,-12 0,-4 Q -26,-12 -26,-17 Z" fill="#fff" /><path d="M -30,-31 L 0,-45 L 30,-31 Q 30,-26 0,-40 Q -30,-26 -30,-31 Z" fill="#f9a8d4" stroke="#fbcfe8" strokeWidth="3" strokeLinejoin="round" /><line x1="0" y1="-45" x2="0" y2="-65" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /><circle cx="0" cy="-67" r="2" fill="#fef08a" /><rect x="0" y="-64" width="8" height="5" rx="1" fill="#93c5fd" /></g></svg>);

export const SvgDepartment = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="32" ry="16" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -24,-12 L -24,-30 Q -24,-35 0,-40 Q 24,-35 24,-30 L 24,-12 Q 24,-7 0,0 Q -24,-7 -24,-12 Z" fill="#f1f5f9" /><rect x="-21" y="-17" width="19" height="10" rx="3" fill="url(#grad-glass)" /><rect x="2" y="-17" width="19" height="10" rx="3" fill="url(#grad-glass)" /><rect x="-23" y="-18" width="22" height="11" rx="4" fill="#86efac" /><rect x="1" y="-18" width="22" height="11" rx="4" fill="#86efac" /><rect x="-19" y="-25" width="15" height="8" rx="2" fill="url(#grad-glass)" /><rect x="4" y="-25" width="15" height="8" rx="2" fill="url(#grad-glass)" /><path d="M -26,-33 L 0,-45 L 26,-33 Q 26,-28 0,-40 Q -26,-28 -26,-33 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-33" r="4" fill="#fef08a" /></g></svg>);

export const SvgUniversity = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="36" ry="18" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -28,-14 L -28,-30 Q -28,-35 0,-40 Q 28,-35 28,-30 L 28,-14 Q 28,-9 0,-1 Q -28,-9 -28,-14 Z" fill="#fca5a5" /><path d="M -30,-22 L 0,-36 L 30,-22 Q 30,-17 0,-31 Q -30,-17 -30,-22 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" /><rect x="-6" y="-16" width="12" height="16" rx="3" fill="#f8fafc" /><rect x="-3" y="-6" width="6" height="6" rx="2" fill="#fcd34d" /><g transform="translate(0, -25)"><circle cx="0" cy="-12" r="10" fill="#5eead4" stroke="#a7f3d0" strokeWidth="2" /></g></g></svg>);

export const SvgLibrary = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-10 L -20,-22 Q -20,-27 0,-32 Q 20,-27 20,-22 L 20,-10 Q 20,-5 0,0 Q -20,-5 -20,-10 Z" fill="#f5f5f4" /><rect x="-6" y="-18" width="12" height="15" rx="6" fill="#fcd34d" /><rect x="-5" y="-16" width="10" height="12" rx="5" fill="url(#grad-glass)" /><path d="M -24,-21 L 0,-32 L 24,-21 Q 24,-16 0,-27 Q -24,-16 -24,-21 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="3" strokeLinejoin="round" /></g></svg>);

export const SvgFountain = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,0 L 0,10 L 20,0 L 0,-10 Z" fill="#cbd5e1" /><path d="M -20,0 L 0,10 L 0,14 L -20,4 Z" fill="#94a3b8" /><path d="M 20,0 L 0,10 L 0,14 L 20,4 Z" fill="#e2e8f0" /><ellipse cx="0" cy="0" rx="18" ry="9" fill="url(#grad-water)" /><rect x="-4" y="-14" width="8" height="14" rx="2" fill="#cbd5e1" /><ellipse cx="0" cy="-13" r="8" fill="#cbd5e1" /><ellipse cx="0" cy="-13" rx="7" ry="3" fill="url(#grad-water)" /><path d="M 0,-16 Q -8,-25 -10,-13" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" strokeLinecap="round" /><path d="M 0,-16 Q 8,-25 10,-13" fill="none" stroke="#fff" strokeWidth="2" opacity="0.8" strokeLinecap="round" /><circle cx="0" cy="-22" r="2" fill="#fff" filter="url(#glow-effect)" opacity="0.9" /></g></svg>);

export const SvgPond = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#4ade80" /><ellipse cx="0" cy="0" rx="28" ry="14" fill="#cbd5e1" /><ellipse cx="0" cy="0" rx="24" ry="12" fill="url(#grad-water)" /><path d="M -10,3 Q 0,8 10,3" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" strokeLinecap="round" /><g transform="translate(-5, 2) rotate(30)"><ellipse cx="0" cy="0" rx="4" ry="2" fill="#fca5a5" /><circle cx="-4" cy="0" r="1.5" fill="#fca5a5" /></g><circle cx="10" cy="6" r="3" fill="#86efac" /><circle cx="-12" cy="-6" r="2.5" fill="#6ee7b7" /><circle cx="-11" cy="-5" r="1.5" fill="#f9a8d4" /></g></svg>);

export const SvgStoneLantern = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="12" ry="6" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -8,-6 L 0,-10 L 8,-6 Q 8,-2 0,2 Q -8,-2 -8,-6 Z" fill="#e2e8f0" /><rect x="-3" y="-20" width="6" height="14" rx="1" fill="#cbd5e1" /><rect x="-6" y="-26" width="12" height="6" rx="2" fill="#f1f5f9" /><rect x="-3" y="-25" width="6" height="4" rx="1" fill="#fef08a" filter="url(#glow-effect)" /><path d="M -10,-31 L 0,-36 L 10,-31 Q 10,-26 0,-21 Q -10,-26 -10,-31 Z" fill="#cbd5e1" /><rect x="-2" y="-40" width="4" height="4" rx="2" fill="#f8fafc" /><circle cx="-4" cy="-5" r="2" fill="#4ade80" opacity="0.8" /></g></svg>);

export const SvgStatue = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="-2" rx="16" ry="8" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,-8 L 0,-14 L 12,-8 Q 12,-2 0,4 Q -12,-2 -12,-8 Z" fill="#f1f5f9" /><rect x="-3" y="-30" width="6" height="20" rx="2" fill="#e2e8f0" /><rect x="-8" y="-36" width="16" height="6" rx="3" fill="#f8fafc" /><rect x="-2" y="-42" width="4" height="10" rx="2" fill="#cbd5e1" /><circle cx="0" cy="-44" r="5" fill="#f8fafc" /><circle cx="-1.5" cy="-45" r="1" fill="#94a3b8" /><circle cx="1.5" cy="-45" r="1" fill="#94a3b8" /></g></svg>);

export const SvgGoldenTower = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -14,-7 L -14,-25 Q -14,-30 0,-35 Q 14,-30 14,-25 L 14,-7 Q 14,-2 0,5 Q -14,-2 -14,-7 Z" fill="url(#grad-gold)" /><path d="M -14,-25 L 0,-32 L 14,-25 Q 14,-20 0,-13 Q -14,-20 -14,-25 Z" fill="#fcd34d" /><rect x="-8" y="-40" width="16" height="18" rx="3" fill="url(#grad-gold)" /><path d="M -8,-40 L 0,-44 L 8,-40 Q 8,-35 0,-31 Q -8,-35 -8,-40 Z" fill="#fef08a" /><path d="M -5,-41 L 0,-48 L 5,-41 Q 5,-36 0,-29 Q -5,-36 -5,-41 Z" fill="url(#grad-gold)" /><circle cx="0" cy="-50" r="3" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgGuardianShrine = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -18,-9 L -18,-22 Q -18,-27 0,-32 Q 18,-27 18,-22 L 18,-9 Q 18,-4 0,3 Q -18,-4 -18,-9 Z" fill="#e9d5ff" /><path d="M -20,-21 L 0,-11 L 20,-21 L 0,-31 Z" fill="#c084fc" /><path d="M -20,-21 L 0,-11 L 0,-28 L -20,-38 Z" fill="#c084fc" /><path d="M 20,-21 L 0,-11 L 0,-28 L 20,-38 Z" fill="#a855f7" /><circle cx="0" cy="-20" r="10" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="0" cy="-20" r="5" fill="#fff" /></g></svg>);

export const SvgMonument = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 80)" filter="url(#strong-shadow)"><path d="M -15,-10 L 0,-60 L 15,-10 Q 15,-5 0,0 Q -15,-5 -15,-10 Z" fill="#e2e8f0" /><line x1="0" y1="-60" x2="0" y2="0" stroke="#fff" strokeWidth="2" opacity="0.8" strokeLinecap="round" /></g></svg>);

export const SvgGrandSmithy = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -22,-11 L -22,-28 Q -22,-33 0,-38 Q 22,-33 22,-28 L 22,-11 Q 22,-6 0,2 Q -22,-6 -22,-11 Z" fill="#f1f5f9" /><path d="M -22,-28 L 0,-39 L 22,-28 Q 22,-23 0,-12 Q -22,-23 -22,-28 Z" fill="#cbd5e1" /><path d="M -12,-29 L 2,-18 L 24,-29 L 12,-41 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-10" r="14" fill="#fca5a5" filter="url(#glow-effect)" /><circle cx="0" cy="-10" r="7" fill="#fef08a" /></g></svg>);

export const SvgWindmill = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="20" ry="10" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,-6 L -12,-30 Q -12,-35 0,-40 Q 12,-35 12,-30 L 12,-6 Q 12,-1 0,4 Q -12,-1 -12,-6 Z" fill="#fef08a" /><path d="M -12,-30 L 0,-36 L 12,-30 Q 12,-25 0,-19 Q -12,-25 -12,-30 Z" fill="#fcd34d" /><path d="M 0,-28 L -18,-48 M 0,-28 L 18,-48 M 0,-28 L -18,-8 M 0,-28 L 18,-8" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.9" /><circle cx="0" cy="-28" r="4" fill="#f59e0b" /></g></svg>);

export const SvgBellTower = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,-6 L -12,-24 Q -12,-29 0,-34 Q 12,-29 12,-24 L 12,-6 Q 12,-1 0,4 Q -12,-1 -12,-6 Z" fill="#fffbeb" /><path d="M -14,-25 L 0,-38 L 14,-25 Q 14,-20 0,-7 Q -14,-20 -14,-25 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="2" strokeLinejoin="round" /><circle cx="0" cy="-22" r="5" fill="#fef08a" filter="url(#glow-effect)" /><path d="M 0,-26 L 0,-18" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /></g></svg>);

export const SvgCherryRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="road" color="#fce7f3" thickness={6} scale={1.6} cx={50} cy={75} /></svg>;

export const SvgClockTower = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -10,-5 L -10,-35 Q -10,-40 0,-45 Q 10,-40 10,-35 L 10,-5 Q 10,0 0,5 Q -10,0 -10,-5 Z" fill="#fffbeb" /><path d="M -12,-36 L 0,-48 L 12,-36 Q 12,-31 0,-19 Q -12,-31 -12,-36 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="-5" cy="-20" r="6" fill="#fff" /><circle cx="5" cy="-20" r="6" fill="#fff" /><line x1="-5" y1="-20" x2="-5" y2="-23" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /><line x1="5" y1="-20" x2="6" y2="-22" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /></g></svg>);

export const SvgGoldStatue = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 80)" filter="url(#strong-shadow)"><path d="M -15,-10 L 0,-60 L 15,-10 Q 15,-5 0,0 Q -15,-5 -15,-10 Z" fill="url(#grad-gold)" /><line x1="0" y1="-60" x2="0" y2="0" stroke="#fff" strokeWidth="2" opacity="0.5" strokeLinecap="round" /><circle cx="0" cy="-62" r="3" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgFestivalStage = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-10 L 0,-20 L 20,-10 L 0,0 Z" fill="#fef9c3" /><path d="M -20,-10 L -20,-14 L 0,-4 L 0,0 Z" fill="#fcd34d" /><path d="M 20,-10 L 20,-14 L 0,-4 L 0,0 Z" fill="#f59e0b" /><path d="M -22,-25 L 0,-30 L 22,-25 Q 22,-20 0,-15 Q -22,-20 -22,-25 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="-10" cy="-20" r="3" fill="#fff" filter="url(#glow-effect)" /><circle cx="10" cy="-20" r="3" fill="#fff" filter="url(#glow-effect)" /><circle cx="0" cy="-25" r="3" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgVillager = () => (<svg viewBox="0 0 100 100"><SharedDefs /><g transform="translate(50,80)" filter="url(#strong-shadow)"><rect x="-12" y="-25" width="24" height="25" rx="10" fill="#93c5fd"/><circle cx="0" cy="-35" r="14" fill="#fffbeb"/><circle cx="-5" cy="-35" r="2.5" fill="#475569"/><circle cx="5" cy="-35" r="2.5" fill="#475569"/><path d="M-4,-30 Q0,-25 4,-30" fill="none" stroke="#fca5a5" strokeWidth="2" strokeLinecap="round"/></g></svg>);

export const SvgGhostBoss = () => (<svg viewBox="0 0 100 100"><SharedDefs /><g transform="translate(50,70)" filter="url(#glow-effect)"><path d="M-35,20 Q0,-50 35,20 Q15,10 0,25 Q-15,10 -35,20 Z" fill="#d8b4fe" opacity="0.9" stroke="#e9d5ff" strokeWidth="2" strokeLinejoin="round" /><circle cx="-12" cy="0" r="6" fill="#fff"/><circle cx="12" cy="0" r="6" fill="#fff"/></g></svg>);

// ==========================================
// 7. 商業施設 (Commercial)
// ==========================================
export const SvgCafe = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -18,-9 L -18,-22 Q -18,-27 0,-32 Q 18,-27 18,-22 L 18,-9 Q 18,-4 0,3 Q -18,-4 -18,-9 Z" fill="#fcd34d" /><rect x="-14" y="-17" width="8" height="12" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><rect x="6" y="-20" width="8" height="10" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -20,-23 L 0,-33 L 20,-23 Q 20,-18 0,-8 Q -20,-18 -20,-23 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(0, -6)"><rect x="-6" y="-6" width="12" height="6" rx="2" fill="#fff" /><rect x="-2" y="-8" width="4" height="2" rx="1" fill="#fef08a" /></g><circle cx="-12" cy="-28" r="2.5" fill="#fff" filter="url(#glow-effect)" /><circle cx="8" cy="-28" r="2.5" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgBakery = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -18,-9 L -18,-24 Q -18,-29 0,-34 Q 18,-29 18,-24 L 18,-9 Q 18,-4 0,3 Q -18,-4 -18,-9 Z" fill="#fffbeb" /><rect x="4" y="-20" width="10" height="12" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -20,-25 L 0,-35 L 20,-25 Q 20,-20 0,-10 Q -20,-20 -20,-25 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="3" strokeLinejoin="round" /><ellipse cx="-3" cy="-4" rx="3" ry="2" fill="#fef08a" /><ellipse cx="9" cy="-9" rx="3" ry="2" fill="#fef08a" /><g transform="translate(-6, -30)"><rect x="-4" y="-12" width="8" height="12" rx="3" fill="#fca5a5" /><circle cx="2" cy="-18" r="5" fill="#fff" opacity="0.6" filter="url(#glow-effect)" /></g></g></svg>);

export const SvgBurgerShop = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-10 L -20,-25 Q -20,-30 0,-35 Q 20,-30 20,-25 L 20,-10 Q 20,-5 0,2 Q -20,-5 -20,-10 Z" fill="#fffbeb" /><rect x="6" y="-21" width="10" height="13" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><rect x="-16" y="-16" width="10" height="13" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -22,-26 L 0,-37 L 22,-26 Q 22,-21 0,-10 Q -22,-21 -22,-26 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(-5, -32)"><ellipse cx="0" cy="0" rx="6" ry="3" fill="#fcd34d" /><ellipse cx="0" cy="-1" rx="6" ry="2.5" fill="#86efac" /><ellipse cx="0" cy="-2.5" rx="6" ry="2.5" fill="#fca5a5" /><ellipse cx="0" cy="-4.5" rx="6" ry="3.5" fill="#fef08a" /></g><circle cx="16" cy="-30" r="2.5" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgFamilyRestaurant = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -24,-12 L -24,-28 Q -24,-33 0,-38 Q 24,-33 24,-28 L 24,-12 Q 24,-7 0,0 Q -24,-7 -24,-12 Z" fill="#fffbeb" /><rect x="6" y="-24" width="14" height="16" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><rect x="-20" y="-20" width="12" height="16" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -26,-29 L 0,-42 L 26,-29 Q 26,-24 0,-11 Q -26,-24 -26,-29 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="3" strokeLinejoin="round" /><path d="M -20,-30 L 0,-20 L 20,-30" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><circle cx="-15" cy="-34" r="2.5" fill="#fff" filter="url(#glow-effect)" /><circle cx="15" cy="-34" r="2.5" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgConvenienceStore = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-10 L -20,-24 Q -20,-29 0,-34 Q 20,-29 20,-24 L 20,-10 Q 20,-5 0,2 Q -20,-5 -20,-10 Z" fill="#f8fafc" /><rect x="4" y="-22" width="14" height="16" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><rect x="-16" y="-18" width="12" height="16" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><path d="M -22,-25 L 0,-32 L 22,-25 Q 22,-20 0,-13 Q -22,-20 -22,-25 Z" fill="#bae6fd" stroke="#e0f2fe" strokeWidth="3" strokeLinejoin="round" /><rect x="-10" y="-24" width="20" height="2" rx="1" fill="#fca5a5" /><rect x="-10" y="-26" width="20" height="2" rx="1" fill="#86efac" /><rect x="-10" y="-28" width="20" height="2" rx="1" fill="#93c5fd" /><circle cx="-2" cy="-1" r="2" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgFlowerShop = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="22" ry="11" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -16,-8 L -16,-22 Q -16,-27 0,-32 Q 16,-27 16,-22 L 16,-8 Q 16,-3 0,4 Q -16,-3 -16,-8 Z" fill="#fce7f3" /><rect x="6" y="-18" width="8" height="12" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -18,-23 L 0,-32 L 18,-23 Q 18,-18 0,-9 Q -18,-18 -18,-23 Z" fill="#f9a8d4" stroke="#fbcfe8" strokeWidth="3" strokeLinejoin="round" /><circle cx="-6" cy="-2" r="3" fill="#f9a8d4" filter="url(#soft-shadow)" /><circle cx="-10" cy="-4" r="2.5" fill="#fca5a5" /><circle cx="4" cy="-4" r="3" fill="#fef08a" filter="url(#soft-shadow)" /><circle cx="8" cy="-6" r="2.5" fill="#fcd34d" /><circle cx="-2" cy="-6" r="2.5" fill="#e9d5ff" /><path d="M -6,-2 L -6,-8 M 4,-4 L 4,-10" stroke="#86efac" strokeWidth="2" strokeLinecap="round" /></g></svg>);

export const SvgCinema = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="32" ry="16" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -26,-13 L -26,-32 Q -26,-37 0,-42 Q 26,-37 26,-32 L 26,-13 Q 26,-8 0,0 Q -26,-8 -26,-13 Z" fill="#f1f5f9" /><rect x="6" y="-28" width="16" height="20" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><rect x="-22" y="-23" width="14" height="20" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><path d="M -28,-33 L 0,-47 L 28,-33 Q 28,-28 0,-14 Q -28,-28 -28,-33 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="3" strokeLinejoin="round" /><circle cx="-18" cy="-38" r="2.5" fill="#fff" filter="url(#glow-effect)" /><circle cx="0" cy="-42" r="2.5" fill="#fff" filter="url(#glow-effect)" /><circle cx="18" cy="-38" r="2.5" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgHotel = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -22,-11 L -22,-38 Q -22,-43 0,-48 Q 22,-43 22,-38 L 22,-11 Q 22,-6 0,2 Q -22,-6 -22,-11 Z" fill="#f8fafc" />{[0,1,2].map(r=>[0,1].map(c=><circle key={`hw-${r}-${c}`} cx={4+c*10} cy={-10-r*8-c*5} r="3" fill={r===2&&c===0?"#fef08a":"url(#grad-glass)"} stroke="#cbd5e1" strokeWidth="1.5" />))}<path d="M -24,-39 L 0,-51 L 24,-39 Q 24,-34 0,-22 Q -24,-34 -24,-39 Z" fill="#fcd34d" stroke="#fef08a" strokeWidth="3" strokeLinejoin="round" /><rect x="-6" y="-14" width="10" height="11" rx="4" fill="#fcd34d" /><circle cx="0" cy="-48" r="3" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

// ==========================================
// 8. 公共施設 (Public Services)
// ==========================================
export const SvgHospital = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -24,-12 L -24,-32 Q -24,-37 0,-42 Q 24,-37 24,-32 L 24,-12 Q 24,-7 0,0 Q -24,-7 -24,-12 Z" fill="#fff" />{[0,1,2].map(r=>[0,1].map(c=><circle key={`hpw-${r}-${c}`} cx={6+c*10} cy={-10-r*7-c*5} r="3" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="1.5" />))}<path d="M -26,-33 L 0,-46 L 26,-33 Q 26,-28 0,-15 Q -26,-28 -26,-33 Z" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(0, -36)"><rect x="-3" y="-5" width="6" height="5" rx="1" fill="#fca5a5" /><rect x="-5" y="-3" width="10" height="1" rx="0.5" fill="#fca5a5" /></g><rect x="-4" y="-14" width="8" height="12" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /></g></svg>);

export const SvgFireStation = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -22,-11 L -22,-28 Q -22,-33 0,-38 Q 22,-33 22,-28 L 22,-11 Q 22,-6 0,2 Q -22,-6 -22,-11 Z" fill="#fca5a5" /><rect x="6" y="-12" width="12" height="10" rx="3" fill="#f8fafc" /><rect x="-18" y="-18" width="12" height="16" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -24,-29 L 0,-41 L 24,-29 Q 24,-24 0,-12 Q -24,-24 -24,-29 Z" fill="#f87171" stroke="#fca5a5" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(-8, -34)"><rect x="-4" y="-15" width="8" height="15" rx="3" fill="#f1f5f9" /><circle cx="0" cy="-17" r="3" fill="#fca5a5" /></g><circle cx="-14" cy="-34" r="2.5" fill="#fff" filter="url(#glow-effect)" /></g></svg>);

export const SvgPoliceBox = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,-6 L -12,-20 Q -12,-25 0,-30 Q 12,-25 12,-20 L 12,-6 Q 12,-1 0,4 Q -12,-1 -12,-6 Z" fill="#bae6fd" /><rect x="4" y="-16" width="6" height="11" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="2" /><path d="M -14,-21 L 0,-28 L 14,-21 Q 14,-16 0,-9 Q -14,-16 -14,-21 Z" fill="#93c5fd" stroke="#bfdbfe" strokeWidth="2" strokeLinejoin="round" /><circle cx="-8" cy="-24" r="3" fill="#fff" filter="url(#glow-effect)" /><line x1="0" y1="-28" x2="0" y2="-36" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /><circle cx="0" cy="-37" r="2.5" fill="#fca5a5" filter="url(#glow-effect)" /></g></svg>);

export const SvgPostOffice = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="26" ry="13" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -20,-10 L -20,-26 Q -20,-31 0,-36 Q 20,-31 20,-26 L 20,-10 Q 20,-5 0,0 Q -20,-5 -20,-10 Z" fill="#fff" /><rect x="6" y="-22" width="10" height="16" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><rect x="-16" y="-19" width="10" height="16" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><path d="M -22,-27 L 0,-38 L 22,-27 Q 22,-22 0,-11 Q -22,-22 -22,-27 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(0, -30)"><circle cx="0" cy="-3" r="3" fill="#fca5a5" /></g><rect x="-2" y="-10" width="4" height="8" rx="2" fill="#fca5a5" /></g></svg>);

export const SvgStation = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="36" ry="18" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -30,-15 L 0,-30 L 30,-15 L 0,0 Z" fill="#f1f5f9" /><path d="M -22,-19 L -22,-34 Q -22,-39 0,-44 Q 22,-39 22,-34 L 22,-19 Q 22,-14 0,-3 Q -22,-14 -22,-19 Z" fill="#fff" /><rect x="4" y="-30" width="14" height="16" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><rect x="-18" y="-27" width="14" height="18" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><path d="M -24,-35 L 0,-47 L 24,-35 Q 24,-30 0,-18 Q -24,-30 -24,-35 Z" fill="url(#grad-roof-slate)" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(0, -38)"><circle cx="0" cy="0" r="5" fill="#fff" /><circle cx="0" cy="0" r="3" fill="#fef08a" /><line x1="0" y1="0" x2="0" y2="-2" stroke="#475569" strokeWidth="1" strokeLinecap="round" /><line x1="0" y1="0" x2="2" y2="1" stroke="#475569" strokeWidth="1" strokeLinecap="round" /></g><path d="M -30,-2 L -20,3 L 20,-12 L 30,-17" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" /><path d="M -30,0 L -20,5 L 20,-10 L 30,-15" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinecap="round" /></g></svg>);

export const SvgAirport = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="44" ry="22" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -38,-14 Q -38,-19 0,-24 Q 38,-19 38,-14 Q 38,-9 0,3 Q -38,-9 -38,-14 Z" fill="#f1f5f9" /><path d="M -30,-20 L -30,-36 Q -30,-41 0,-46 Q 30,-41 30,-36 L 30,-20 Q 30,-15 0,-5 Q -30,-15 -30,-20 Z" fill="#fff" /><rect x="8" y="-34" width="18" height="20" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><rect x="-26" y="-31" width="18" height="22" rx="4" fill="url(#grad-glass)" stroke="#cbd5e1" strokeWidth="2" /><path d="M -32,-37 L 0,-53 L 32,-37 Q 32,-32 0,-16 Q -32,-32 -32,-37 Z" fill="#cbd5e1" stroke="#e2e8f0" strokeWidth="3" strokeLinejoin="round" /><g transform="translate(0, -42)"><rect x="-8" y="-15" width="16" height="15" rx="4" fill="#f1f5f9" /><circle cx="0" cy="-19" r="4" fill="#bae6fd" /></g><g transform="translate(25, 2) scale(0.5)"><path d="M -25,0 L 0,-15 L 25,0 Q 25,5 0,-5 Q -25,5 -25,0 Z" fill="#fff" /><circle cx="0" cy="-10" r="5" fill="#bae6fd" /><rect x="-3" y="-25" width="6" height="15" rx="3" fill="#cbd5e1" /></g></g></svg>);


// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgOfficeBuilding = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="28" ry="14" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -18,-9 L -18,-42 Q -18,-47 0,-52 Q 18,-47 18,-42 L 18,-9 Q 18,-4 0,3 Q -18,-4 -18,-9 Z" fill="#e2e8f0" />{[0,1,2,3].map(r=>[0,1].map(c=><rect key={`ob-${r}-${c}`} x={4+c*8} y={-8-r*7-c*4} width="5" height="5" rx="2" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1" />))}<path d="M -20,-43 L 0,-53 L 20,-43 Q 20,-38 0,-28 Q -20,-38 -20,-43 Z" fill="#cbd5e1" stroke="#f1f5f9" strokeWidth="2" strokeLinejoin="round" /><rect x="-4" y="-12" width="8" height="9" rx="3" fill="#cbd5e1" /></g></svg>);

export const SvgTowerApartment = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#475569" opacity="0.4" filter="url(#soft-shadow)" /><path d="M -14,-7 L -14,-52 Q -14,-57 0,-62 Q 14,-57 14,-52 L 14,-7 Q 14,-2 0,5 Q -14,-2 -14,-7 Z" fill="#f8fafc" />{[0,1,2,3,4,5].map(r=><rect key={`ta-${r}`} x={4} y={-6-r*6.5} width="8" height="4" rx="2" fill="url(#grad-glass)" stroke="#e2e8f0" strokeWidth="1" />)}<path d="M -16,-53 L 0,-61 L 16,-53 Q 16,-48 0,-40 Q -16,-48 -16,-53 Z" fill="#e2e8f0" stroke="#fff" strokeWidth="2" strokeLinejoin="round" /><circle cx="-7" cy="-50" r="3" fill="url(#grad-glass)" stroke="#e2e8f0" strokeWidth="1" /><circle cx="7" cy="-50" r="3" fill="url(#grad-glass)" stroke="#e2e8f0" strokeWidth="1" /><rect x="-3" y="-8" width="6" height="6" rx="2" fill="#cbd5e1" /><line x1="0" y1="-61" x2="0" y2="-68" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /><circle cx="0" cy="-69" r="1.5" fill="#fca5a5" filter="url(#glow-effect)" /></g></svg>);

export const SvgTvTower = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="18" ry="9" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -12,0 L -4,-15 L 0,-30 L 4,-15 L 12,0 Z" fill="#fca5a5" stroke="#f87171" strokeWidth="2" strokeLinejoin="round" /><ellipse cx="0" cy="-38" rx="6" ry="3" fill="#fff" /><rect x="-2" y="-80" width="4" height="42" rx="2" fill="#fca5a5" /><circle cx="0" cy="-80" r="3" fill="#fca5a5" filter="url(#glow-effect)" /><circle cx="0" cy="-50" r="2" fill="#fef08a" filter="url(#glow-effect)" /><rect x="-4" y="-22" width="8" height="4" rx="2" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1" /></g></svg>);

export const SvgStadium = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="42" ry="21" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><ellipse cx="0" cy="-5" rx="40" ry="20" fill="#f1f5f9" /><ellipse cx="0" cy="-8" rx="40" ry="20" fill="#fff" /><ellipse cx="0" cy="-8" rx="34" ry="17" fill="#4ade80" /><ellipse cx="0" cy="-10" rx="34" ry="17" fill="#86efac" /><path d="M 0,-10 L -15,-18 M 0,-10 L 15,-2 M 0,-10 L 15,-18 M 0,-10 L -15,-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /><ellipse cx="0" cy="-10" rx="8" ry="4" fill="none" stroke="#fff" strokeWidth="1.5" /><path d="M -40,-8 C -40,-22 -20,-30 0,-30 C 20,-30 40,-22 40,-8" fill="none" stroke="#bae6fd" strokeWidth="4" strokeLinecap="round" /><g transform="translate(30, -22)"><rect x="-3" y="-8" width="6" height="8" rx="2" fill="#cbd5e1" /><circle cx="0" cy="-9" r="2.5" fill="#fef08a" filter="url(#glow-effect)" /></g></g></svg>);

// ==========================================
// 10. 公園・レジャー (Parks & Leisure)
// ==========================================
export const SvgPark = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><path d="M -28,-12 Q -28,-7 0,3 Q 28,-7 28,-12 Q 28,-17 0,-27 Q -28,-17 -28,-12 Z" fill="#bbf7d0" /><path d="M -20,-12 L 0,-22 L 20,-12" fill="none" stroke="#fef3c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><g transform="translate(-16, -16)"><circle cx="-4" cy="-14" r="6" fill="#4ade80" /><circle cx="4" cy="-12" r="7" fill="#22c55e" /><circle cx="0" cy="-16" r="6" fill="#86efac" /></g><g transform="translate(16, -16)"><circle cx="-3" cy="-11" r="5" fill="#4ade80" /><circle cx="3" cy="-10" r="6" fill="#22c55e" /><circle cx="0" cy="-13" r="5" fill="#86efac" /></g><rect x="-1" y="-10" width="6" height="4" rx="1" fill="#fcd34d" /></g></svg>);

export const SvgPlayground = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><path d="M -22,-9 Q -22,-4 0,4 Q 22,-4 22,-9 Q 22,-14 0,-22 Q -22,-14 -22,-9 Z" fill="#fef08a" /><g transform="translate(-8, -12)"><rect x="-5" y="-14" width="10" height="14" rx="3" fill="#fca5a5" /><path d="M 0,-16.5 Q -8,-10 -12,-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /><circle cx="-12" cy="-1" r="3" fill="#93c5fd" /></g><g transform="translate(10, -10)"><circle cx="0" cy="-2" r="5" fill="#fcd34d" /><path d="M 0,-3.5 0,5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" /><circle cx="0" cy="5" r="1.5" fill="#f59e0b" /></g></g></svg>);

export const SvgPool = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><path d="M -26,-11 Q -26,-6 0,5 Q 26,-6 26,-11 Q 26,-16 0,-27 Q -26,-16 -26,-11 Z" fill="#e2e8f0" /><path d="M -20,-12 Q -20,-7 0,-1 Q 20,-7 20,-12 Q 20,-17 0,-23 Q -20,-17 -20,-12 Z" fill="url(#grad-water)" /><path d="M -10,-8 Q 0,-5 10,-8 Q 0,-11 -10,-8 Z" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.8" strokeLinecap="round" /><path d="M -8,-12 Q -2,-9 8,-12" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.6" strokeLinecap="round" /><circle cx="-16" cy="-14" r="4" fill="#fca5a5" /><circle cx="-16" cy="-14" r="2" fill="#fff" /><circle cx="16" cy="-18" r="4" fill="#93c5fd" /><circle cx="16" cy="-18" r="2" fill="#fff" /></g></svg>);

export const SvgFerrisWheel = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -10,0 L 0,-40 L 10,0 Z" fill="none" stroke="#cbd5e1" strokeWidth="4" strokeLinejoin="round" /><circle cx="0" cy="-40" r="18" fill="none" stroke="#cbd5e1" strokeWidth="3" /><circle cx="0" cy="-40" r="16" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="6,6" />{[0,45,90,135,180,225,270,315].map((a,i)=>{const r=16;const x=Math.cos(a*Math.PI/180)*r;const y=Math.sin(a*Math.PI/180)*r;const colors=['#fca5a5','#fcd34d','#86efac','#93c5fd','#c4b5fd','#f9a8d4','#fdba74','#5eead4'];return(<circle key={`fw-${i}`} cx={x} cy={-40+y} r="3.5" fill={colors[i]} />);})}<circle cx="0" cy="-40" r="4" fill="#fff" /></g></svg>);

export const SvgAmusementPark = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="0" rx="44" ry="22" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><path d="M -38,-14 Q -38,-19 0,-24 Q 38,-19 38,-14 Q 38,-9 0,3 Q -38,-9 -38,-14 Z" fill="#bbf7d0" /><g transform="translate(-18, -18)"><path d="M -8,0 L 0,-30 L 8,0 Z" fill="none" stroke="#cbd5e1" strokeWidth="3" strokeLinejoin="round" /><circle cx="0" cy="-30" r="12" fill="none" stroke="#fff" strokeWidth="2" />{[0,60,120,180,240,300].map((a,i)=>{const r=12;const x=Math.cos(a*Math.PI/180)*r;const y=Math.sin(a*Math.PI/180)*r;const c=['#fca5a5','#fcd34d','#86efac','#93c5fd','#f9a8d4','#fdba74'];return <circle key={`ap-${i}`} cx={x} cy={-30+y} r="2.5" fill={c[i]} />;})}<circle cx="0" cy="-30" r="3" fill="#fff" /></g><g transform="translate(15, -10)"><rect x="-14" y="-11" width="28" height="11" rx="4" fill="#fef08a" /><path d="M -14,-11 L 0,-18 L 14,-11 Z" fill="#fca5a5" stroke="#fecaca" strokeWidth="2" strokeLinejoin="round" /><circle cx="-8" cy="-13" r="2" fill="#fff" filter="url(#glow-effect)" /><circle cx="8" cy="-13" r="2" fill="#fff" filter="url(#glow-effect)" /></g><path d="M -8,2 Q -5,-8 0,-2 Q 5,-12 8,-2 Q 12,-15 15,0" fill="none" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" /></g></svg>);

// ==========================================
// 11. 乗り物 (Vehicles) - チョロQのような丸っこさ
// ==========================================
export const SvgCar = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="2" rx="16" ry="8" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><rect x="-12" y="-10" width="24" height="14" rx="6" fill="#fca5a5" /><rect x="-8" y="-14" width="16" height="8" rx="4" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1.5" /><circle cx="-6" cy="2" r="3" fill="#475569" /><circle cx="8" cy="-3" r="3" fill="#475569" /><circle cx="10" cy="-5" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="-10" cy="0" r="1" fill="#fca5a5" /></g></svg>);

export const SvgBus = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="2" rx="20" ry="10" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><rect x="-16" y="-18" width="32" height="24" rx="6" fill="#86efac" /><rect x="-14" y="-14" width="20" height="8" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1.5" /><rect x="8" y="-14" width="6" height="8" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1.5" /><circle cx="-8" cy="4" r="3.5" fill="#475569" /><circle cx="10" cy="-2" r="3.5" fill="#475569" /><circle cx="14" cy="-9" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgBicycle = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><circle cx="-8" cy="0" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" /><circle cx="8" cy="-4" r="4" fill="none" stroke="#94a3b8" strokeWidth="2" /><path d="M -8,0 L 0,-6 L 8,-4 M 0,-6 L 2,-10 L -2,-10 M -2,-10 L -8,0 M 2,-10 L 8,-4" fill="none" stroke="#93c5fd" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" /><circle cx="2" cy="-12" r="2" fill="#cbd5e1" /><circle cx="-8" cy="0" r="1.5" fill="#cbd5e1" /><circle cx="8" cy="-4" r="1.5" fill="#cbd5e1" /></g></svg>);

export const SvgShipVehicle = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="2" rx="22" ry="10" fill="#bae6fd" opacity="0.6" /><path d="M -18,2 C -15,-4 -5,-10 10,-8 C 20,-6 22,-2 18,2 C 10,6 -10,6 -18,2 Z" fill="#fcd34d" /><rect x="-10" y="-18" width="20" height="12" rx="4" fill="#fff" /><rect x="0" y="-22" width="6" height="6" rx="2" fill="#fca5a5" /></g></svg>);

export const SvgAirplane = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 65)"><ellipse cx="0" cy="10" rx="18" ry="8" fill="#475569" opacity="0.2" /><rect x="-20" y="-20" width="40" height="14" rx="7" fill="#fff" transform="rotate(-15)" /><path d="M -5,-12 Q 0,-25 5,-12 Z" fill="#bae6fd" /><path d="M -5,0 Q 0,15 5,0 Z" fill="#bae6fd" /><path d="M 12,-25 Q 15,-35 18,-25 Z" fill="#fca5a5" /><circle cx="-10" cy="-10" r="3" fill="url(#grad-glass)" /><circle cx="-2" cy="-12" r="2" fill="url(#grad-glass)" /><circle cx="4" cy="-14" r="2" fill="url(#grad-glass)" /></g></svg>);

export const SvgFireTruck = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 75)"><ellipse cx="0" cy="2" rx="20" ry="10" fill="#475569" opacity="0.3" filter="url(#soft-shadow)" /><rect x="-16" y="-18" width="32" height="24" rx="6" fill="#fca5a5" /><rect x="-14" y="-14" width="8" height="8" rx="3" fill="url(#grad-glass)" stroke="#fff" strokeWidth="1.5" /><rect x="-2" y="-14" width="16" height="8" rx="3" fill="#f87171" /><path d="M -10,2 L 10,-8 L 12,-20 L 14,-22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="-8" cy="4" r="3.5" fill="#475569" /><circle cx="10" cy="-2" r="3.5" fill="#475569" /><circle cx="14" cy="-9" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /><circle cx="-14" cy="-1" r="2" fill="#93c5fd" filter="url(#glow-effect)" /></g></svg>);

// ==========================================
// 12. ストリートファニチャー (Street Furniture)
// ==========================================
export const SvgBench = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="12" ry="6" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><rect x="-10" y="-4" width="20" height="4" rx="2" fill="#fcd34d" /><rect x="-10" y="-10" width="20" height="4" rx="2" fill="#fcd34d" /><rect x="-8" y="-10" width="2" height="12" rx="1" fill="#f59e0b" /><rect x="6" y="-10" width="2" height="12" rx="1" fill="#f59e0b" /></g></svg>);

export const SvgMailbox = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="6" ry="3" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><rect x="-4" y="-14" width="8" height="14" rx="4" fill="#fca5a5" /><rect x="-2" y="-10" width="4" height="2" rx="1" fill="#fff" /><rect x="-1" y="-2" width="2" height="2" rx="1" fill="#cbd5e1" /></g></svg>);

export const SvgPhoneBooth = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="8" ry="4" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><rect x="-6" y="-18" width="12" height="18" rx="3" fill="#fca5a5" /><rect x="-4" y="-14" width="8" height="10" rx="2" fill="url(#grad-glass)" /><circle cx="0" cy="-20" r="2" fill="#fca5a5" /><circle cx="0" cy="-10" r="1.5" fill="#86efac" filter="url(#glow-effect)" /></g></svg>);

export const SvgStreetLight = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="4" ry="2" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><path d="M 0,0 L 0,-30 Q 0,-32 10,-28" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" /><circle cx="10" cy="-26" r="3" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgBusStop = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="10" ry="5" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><line x1="0" y1="0" x2="0" y2="-22" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" /><circle cx="0" cy="-22" r="5" fill="#93c5fd" /><circle cx="0" cy="-22" r="3" fill="#fff" /><rect x="-6" y="-4" width="12" height="2" rx="1" fill="#cbd5e1" /></g></svg>);

export const SvgVendingMachine = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="10" ry="5" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><rect x="-8" y="-18" width="16" height="18" rx="3" fill="#f8fafc" /><rect x="-6" y="-16" width="12" height="10" rx="2" fill="#bae6fd" /><rect x="-6" y="-4" width="12" height="2" rx="1" fill="#93c5fd" /><circle cx="4" cy="-5" r="1.5" fill="#fef08a" filter="url(#glow-effect)" /></g></svg>);

export const SvgTrashCan = () => (<svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><SharedDefs /><g transform="translate(50, 78)"><ellipse cx="0" cy="0" rx="6" ry="3" fill="#475569" opacity="0.2" filter="url(#soft-shadow)" /><rect x="-5" y="-10" width="10" height="10" rx="2" fill="#cbd5e1" /><path d="M -6,-10 Q 0,-14 6,-10 Z" fill="#94a3b8" /></g></svg>);
