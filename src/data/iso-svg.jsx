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
    <linearGradient id="grad-magma" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f97316" />
      <stop offset="50%" stopColor="#ef4444" />
      <stop offset="100%" stopColor="#b91c1c" />
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
  
  let topFill = color;
  if (type === 'water' || type === 'pond') topFill = 'url(#grad-water)';
  if (type === 'magma') topFill = 'url(#grad-magma)';
  if (type === 'grass_flat' || type === 'garden') topFill = '#4ade80';
  if (type === 'asphalt' || type === 'crosswalk') topFill = '#334155';
  if (type === 'dirt') topFill = '#78350f';
  if (type === 'brick') topFill = '#b45309';
  if (type === 'railway') topFill = '#a8a29e';

  let leftFill = topFill.startsWith('url') ? '#075985' : darken(topFill, 20);
  let rightFill = topFill.startsWith('url') ? '#0369a1' : darken(topFill, 30);
  
  if (type === 'magma') {
    leftFill = '#7f1d1d'; rightFill = '#450a0a';
  } else if (type === 'water' || type === 'pond') {
    leftFill = '#0369a1'; rightFill = '#075985';
  }

  const topStroke = topFill.startsWith('url') ? 'none' : topFill;

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <SharedDefs />
      <polygon points={`0,0 ${dx},-${dy} ${dx},${-dy + thickness} 0,${thickness}`} fill={rightFill} stroke={rightFill} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`0,0 -${dx},-${dy} -${dx},${-dy + thickness} 0,${thickness}`} fill={leftFill} stroke={leftFill} strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`0,0 ${dx},-${dy} 0,-${dy * 2} -${dx},-${dy}`} fill={topFill} stroke={topStroke} strokeWidth={topStroke !== 'none' ? "1" : "0"} strokeLinejoin="round" />
      
      <g opacity="0.9">
        {type === 'road' && (
          <path d={`M ${dx*0.5},-${dy*0.5} L -${dx*0.5},-${dy*1.5}`} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6,4" opacity="0.6" />
        )}
        {type === 'asphalt' && (
          <g opacity="0.2">
            <circle cx={-dx*0.4} cy={-dy*1.2} r="1" fill="#fff" />
            <circle cx={dx*0.5} cy={-dy*0.8} r="1.5" fill="#000" />
            <circle cx={dx*0.1} cy={-dy*1.6} r="1" fill="#fff" />
            <circle cx={-dx*0.2} cy={-dy*0.5} r="1" fill="#000" />
          </g>
        )}
        {type === 'crosswalk' && (
          <g>
            {[-0.3, -0.15, 0, 0.15, 0.3].map((t, i) => {
               const cx = t * dx;
               const cy = -dy - t * dy;
               const s = 0.2;
               return (
                 <path key={i} d={`M ${cx - s*dx},${cy - s*dy} L ${cx + s*dx},${cy + s*dy}`} stroke="#fff" strokeWidth="4" opacity="0.9" />
               );
            })}
          </g>
        )}
        {type === 'railway' && (
          <g>
            {[-0.4, -0.2, 0, 0.2, 0.4].map((t, i) => {
              const cx = t * dx;
              const cy = -dy + t * dy;
              const s = 0.25;
              return (
                <path key={i} d={`M ${cx - s*dx},${cy + s*dy} L ${cx + s*dx},${cy - s*dy}`} stroke="#78350f" strokeWidth="3" />
              );
            })}
            <path d={`M ${dx*0.35},-${dy*0.35} L -${dx*0.65},-${dy*1.35}`} stroke="#94a3b8" strokeWidth="1.5" />
            <path d={`M ${dx*0.65},-${dy*0.65} L -${dx*0.35},-${dy*1.65}`} stroke="#94a3b8" strokeWidth="1.5" />
          </g>
        )}
        {(type === 'water' || type === 'pond') && (
          <g>
            <path d={`M -${dx*0.6},-${dy*0.8} Q 0,-${dy*1.2} ${dx*0.6},-${dy*0.8}`} fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.6" strokeLinecap="round"/>
            <path d={`M -${dx*0.3},-${dy*1.5} Q 0,-${dy*1.8} ${dx*0.3},-${dy*1.5}`} fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.4" strokeLinecap="round"/>
            {type === 'pond' && (
              <g transform={`translate(0, -${dy*1.2})`}>
                <path d="M 5,2 C 8,0 12,3 8,6 C 4,3 2,0 5,2 Z" fill="#22c55e" />
                <ellipse cx="-4" cy="-2" rx="3" ry="1.5" fill="#f97316" transform="rotate(30 -4 -2)" />
                <circle cx="8" cy="-5" r="1.5" fill="#f472b6" />
              </g>
            )}
          </g>
        )}
        {type === 'magma' && (
          <g opacity="0.8">
            <circle cx={-dx*0.4} cy={-dy*1.2} r="4" fill="#fbbf24" filter="url(#glow-effect)" />
            <circle cx={dx*0.3} cy={-dy*0.8} r="6" fill="#fef08a" opacity="0.6" />
            <path d={`M -${dx*0.2},-${dy*0.6} Q ${dx*0.2},-${dy*1.2} ${dx*0.5},-${dy*1.4}`} fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
            <circle cx={0} cy={-dy*1.5} r="3" fill="#ef4444" />
          </g>
        )}
        {type === 'dirt' && (
          <g opacity="0.4">
            <circle cx={-dx*0.3} cy={-dy*1.4} r="2" fill="#451a03" />
            <circle cx={dx*0.5} cy={-dy*0.7} r="1.5" fill="#b45309" />
            <path d={`M -${dx*0.1},-${dy*0.8} L ${dx*0.2},-${dy*0.9}`} stroke="#451a03" strokeWidth="1" />
          </g>
        )}
        {type === 'brick' && (
          <g stroke="#78350f" strokeWidth="1" opacity="0.4">
            <line x1={-dx*0.8} y1={-dy*1.0} x2={dx*0.8} y2={-dy*1.0} />
            <line x1={-dx*0.4} y1={-dy*0.6} x2={dx*0.4} y2={-dy*0.6} />
            <line x1={-dx*0.4} y1={-dy*1.4} x2={dx*0.4} y2={-dy*1.4} />
            <line x1={0} y1={-dy*0.6} x2={dx*0.4} y2={-dy*1.0} />
            <line x1={-dx*0.4} y1={-dy*1.0} x2={0} y2={-dy*1.4} />
          </g>
        )}
        {(type === 'garden' || type === 'grass_flat') && (
          <g>
            <path d={`M -${dx*0.4},-${dy*0.8} Q -${dx*0.3},-${dy*1.1} -${dx*0.2},-${dy*0.8}`} fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.6"/>
            <path d={`M ${dx*0.4},-${dy*1.2} Q ${dx*0.5},-${dy*1.5} ${dx*0.6},-${dy*1.2}`} fill="none" stroke="#15803d" strokeWidth="1.5" opacity="0.6"/>
            {type === 'garden' && (
              <>
                <circle cx={-dx*0.2} cy={-dy*0.7} r="2.5" fill="#f472b6" stroke="#000" strokeWidth="0.5" />
                <circle cx={dx*0.1} cy={-dy*1.0} r="3" fill="#eab308" stroke="#000" strokeWidth="0.5" />
                <circle cx={dx*0.4} cy={-dy*1.3} r="2.5" fill="#38bdf8" stroke="#000" strokeWidth="0.5" />
              </>
            )}
          </g>
        )}
      </g>
    </g>
  );
};

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

// ==========================================
// 4. Structures Assets
// ==========================================
export const SvgRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="road" color="#cbd5e1" thickness={4} /></svg>;
export const SvgWater = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="water" color="#7dd3fc" thickness={4} /></svg>;
export const SvgGrassFlat = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="grass_flat" thickness={4} /></svg>;
export const SvgBrick = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="brick" thickness={4} /></svg>;
export const SvgAsphalt = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="asphalt" thickness={4} /></svg>;
export const SvgMagma = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="magma" thickness={4} /></svg>;
export const SvgCrosswalk = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="crosswalk" thickness={4} /></svg>;
export const SvgRailway = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="railway" thickness={4} /></svg>;
export const SvgDirt = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="dirt" thickness={4} /></svg>;


const HOUSE_PALETTES = [
  { wallSW: '#fdf8f6', wallSE: '#e7e5e4', baseSW: '#a8a29e', baseSE: '#78716c', roofL: '#ef4444', roofD: '#b91c1c' }, // Classic Red
  { wallSW: '#f8fafc', wallSE: '#e2e8f0', baseSW: '#94a3b8', baseSE: '#64748b', roofL: '#3b82f6', roofD: '#1d4ed8' }, // Slate Blue
  { wallSW: '#fef3c7', wallSE: '#fde68a', baseSW: '#fbbf24', baseSE: '#f59e0b', roofL: '#22c55e', roofD: '#15803d' }, // Forest Green
  { wallSW: '#f5f5f4', wallSE: '#d6d3d1', baseSW: '#57534e', baseSE: '#44403c', roofL: '#334155', roofD: '#0f172a' }, // Dark Modern
  { wallSW: '#fdf2f8', wallSE: '#fbcfe8', baseSW: '#f472b6', baseSE: '#db2777', roofL: '#ec4899', roofD: '#be185d' }, // Pink Pop
  { wallSW: '#ecfdf5', wallSE: '#a7f3d0', baseSW: '#6ee7b7', baseSE: '#34d399', roofL: '#d97706', roofD: '#92400e' }, // Mint Orange
  { wallSW: '#f5f3ff', wallSE: '#ede9fe', baseSW: '#c4b5fd', baseSE: '#a78bfa', roofL: '#a855f7', roofD: '#7e22ce' }, // Lavender
  { wallSW: '#ffedd5', wallSE: '#fed7aa', baseSW: '#fdba74', baseSE: '#f97316', roofL: '#0ea5e9', roofD: '#0369a1' }, // Warm Cyan
];

export const SvgHouse1 = ({ seed = 0 }) => {
  const p = HOUSE_PALETTES[seed % HOUSE_PALETTES.length];
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 100) scale(2.5)">
        <polygon points="0,-4 -20,-14 -20,-30 -10,-42 0,-20" fill={p.wallSW} stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,-4 20,-14 20,-30 0,-20" fill={p.wallSE} stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        
        <polygon points="3,-17 24,-27.5 12,-48 -10,-41" fill={p.roofL} stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="3,-17 -10,-41 -13,-39 -1,-15" fill={p.roofD} stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="3,-17 24,-27.5 24,-25.5 3,-15" fill={p.roofD} stroke="#000000" strokeWidth="2" strokeLinejoin="round" />

        <polygon points="6,-7 14,-11 14,-25 6,-21" fill="#d97706" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="12" cy="-16" r="1" fill="#000000" />

        <polygon points="-14,-11 -6,-7 -6,-17 -14,-21" fill="#93c5fd" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
        <line x1="-10" y1="-9" x2="-10" y2="-19" stroke="#000000" strokeWidth="1.5" />
        <line x1="-14" y1="-16" x2="-6" y2="-12" stroke="#000000" strokeWidth="1.5" />

        <g transform="translate(6, -38)">
          <polygon points="0,0 5,-2.5 5,-12 0,-9.5" fill={p.baseSW} stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,0 -5,-2.5 -5,-12 0,-9.5" fill={p.baseSE} stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,-9.5 -5,-12 0,-14.5 5,-12" fill={p.wallSE} stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      </g>
    </svg>
  );
};

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
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
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
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 70) scale(2.5)">
        <ellipse cx="0" cy="18" rx="46" ry="23" fill="rgba(0,0,0,0.15)" />

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
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 100) scale(2.5)">
        {/* Ground Shadow */}
        <ellipse cx="0" cy="0" rx="26" ry="13" fill="rgba(0,0,0,0.15)" />

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
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-16,-8 -18,-9 -18,-19 -16,-18" fill="#92400e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-16,-8 -14,-9 -14,-19 -16,-18" fill="#b45309" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="0,0 -2,-1 -2,-11 0,-10" fill="#92400e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="0,0 2,-1 2,-11 0,-10" fill="#b45309" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="16,8 14,7 14,-3 16,-2" fill="#92400e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="16,8 18,7 18,-3 16,-2" fill="#b45309" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -16,-14 L 16,0" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M -16,-10 L 16,4" stroke="#000" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgBridge = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <path d="M -25,10 Q -5,-15 25,10 L 25,20 Q -5,-5 -25,20 Z" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -25,10 Q -5,-15 25,10 L 20,5 Q 0,-20 -20,5 Z" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-25,10 -27,15 -27,5 -25,0" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-25,0 -23,-3 -23,7 -25,10" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="25,10 23,15 23,5 25,0" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="25,0 27,-3 27,7 25,10" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

// ==========================================
// 5. Economy & Industry Assets
// ==========================================
export const SvgWarehouse = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    baseTop: '#7dd3fc', baseLeft: '#38bdf8', baseRight: '#0284c7',
    wallLight: '#f1f5f9', wallDark: '#e2e8f0',
    wallInnerL: '#cbd5e1', wallInnerR: '#94a3b8', floor: '#e2e8f0',
    pillarTop: '#94a3b8', pillarLeft: '#64748b', pillarRight: '#475569',
    roofBlue: '#60a5fa', roofBlueDark: '#3b82f6', roofEdge: '#475569',
    boxTop: '#fcd34d', boxLeft: '#fbbf24', boxRight: '#f59e0b',
    windowBorders: '#64748b', windowLight: '#fef08a', windowGlow: '#fde047'
  };

  // 直方体を描画するヘルパー
  const Cube = ({ x, y, z, w, d, h, cTop, cLeft, cRight }) => (
    <g>
      {/* 左面 */}
      <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cLeft} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      {/* 右面 */}
      <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={cRight} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      {/* 天面 */}
      <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cTop} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  );

  // 段ボールを描画するヘルパー
  const Box = ({ x, y, z, w=6, d=6, h=6 }) => (
    <g>
      <Cube x={x} y={y} z={z} w={w} d={d} h={h} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />
      {/* 梱包テープの線 */}
      <line x1={iso(x+w/2, y, z+h).split(',')[0]} y1={iso(x+w/2, y, z+h).split(',')[1]}
            x2={iso(x+w/2, y+d, z+h).split(',')[0]} y2={iso(x+w/2, y+d, z+h).split(',')[1]} stroke="#b45309" strokeWidth="0.8" />
    </g>
  );

  // パレットを描画するヘルパー
  const Pallet = ({ x, y, z }) => (
    <g>
      {/* 脚部分 */}
      <Cube x={x+1} y={y+1} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      <Cube x={x+9} y={y+1} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      <Cube x={x+5} y={y+9} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      {/* 上板 */}
      <Cube x={x} y={y} z={z+1.5} w={12} d={12} h={1.5} cTop="#b45309" cLeft="#92400e" cRight="#78350f" />
    </g>
  );

  // 白い袋を描画するヘルパー
  const Bag = ({ x, y, z }) => {
    const [cx, cy] = iso(x, y, z).split(',').map(Number);
    return (
      <g>
        {/* 袋の本体 */}
        <path d={`M ${cx-12},${cy+2} Q ${cx-12},${cy-6} ${cx},${cy-10} Q ${cx+12},${cy-6} ${cx+12},${cy+2} Q ${cx+6},${cy+8} ${cx},${cy+8} Q ${cx-6},${cy+8} ${cx-12},${cy+2} Z`} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
        <path d={`M ${cx-8},${cy-5} Q ${cx},${cy-2} ${cx+8},${cy-5}`} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
        {/* 袋の縛り口 */}
        <path d={`M ${cx-4},${cy-10} L ${cx-5},${cy-14} L ${cx+1},${cy-13} Z`} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
    );
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(50, 100) scale(2.2)">
        
        {/* === 1. 土台 === */}
        <polygon points={`${iso(5,5,5)} ${iso(95,5,5)} ${iso(95,95,5)} ${iso(5,95,5)}`} fill={colors.baseTop} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(5,95,0)} ${iso(95,95,0)} ${iso(95,95,5)} ${iso(5,95,5)}`} fill={colors.baseLeft} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(95,5,0)} ${iso(95,95,0)} ${iso(95,95,5)} ${iso(95,5,5)}`} fill={colors.baseRight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />

        {/* === 2. 倉庫の内部（床と奥の壁） === */}
        <polygon points={`${iso(20,20,5)} ${iso(80,20,5)} ${iso(80,80,5)} ${iso(20,80,5)}`} fill={colors.floor} stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points={`${iso(20,80,5)} ${iso(20,20,5)} ${iso(20,20,35)} ${iso(20,80,35)}`} fill={colors.wallInnerL} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(80,20,5)} ${iso(20,20,5)} ${iso(20,20,35)} ${iso(80,20,35)}`} fill={colors.wallInnerR} stroke="#1e293b" strokeWidth="0.5" />

        {/* === 3. 奥の柱（右角・左角） === */}
        <Cube x={78} y={18} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />
        <Cube x={18} y={78} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />

        {/* === 4. 内部の段ボール === */}
        <Box x={65} y={50} z={5} />
        <Box x={55} y={55} z={5} />
        <Box x={60} y={60} z={5} />
        <Box x={58} y={54} z={11} />
        <Box x={63} y={60} z={11} />

        {/* === 5. 左壁（手前左）と窓 === */}
        <polygon points={`${iso(20,80,5)} ${iso(80,80,5)} ${iso(80,80,35)} ${iso(20,80,35)}`} fill={colors.wallLight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左壁上部の妻壁（三角形・空洞を塞ぐ） */}
        <polygon points={`${iso(20,80,35)} ${iso(20,20,35)} ${iso(20,50,45)}`} fill={colors.wallLight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左の窓 */}
        <g>
          <polygon points={`${iso(32,80.1,15)} ${iso(44,80.1,15)} ${iso(44,80.1,23)} ${iso(32,80.1,23)}`} fill={colors.windowBorders} stroke="#1e293b" strokeWidth="0.8" />
          <polygon points={`${iso(33,80.2,16)} ${iso(43,80.2,16)} ${iso(43,80.2,22)} ${iso(33,80.2,22)}`} fill={colors.windowGlow} />
          <polygon points={`${iso(35,80.3,17.5)} ${iso(41,80.3,17.5)} ${iso(41,80.3,20.5)} ${iso(35,80.3,20.5)}`} fill={colors.windowLight} />
        </g>
        {/* 右の窓 */}
        <g>
          <polygon points={`${iso(56,80.1,15)} ${iso(68,80.1,15)} ${iso(68,80.1,23)} ${iso(56,80.1,23)}`} fill={colors.windowBorders} stroke="#1e293b" strokeWidth="0.8" />
          <polygon points={`${iso(57,80.2,16)} ${iso(67,80.2,16)} ${iso(67,80.2,22)} ${iso(57,80.2,22)}`} fill={colors.windowGlow} />
          <polygon points={`${iso(59,80.3,17.5)} ${iso(65,80.3,17.5)} ${iso(65,80.3,20.5)} ${iso(59,80.3,20.5)}`} fill={colors.windowLight} />
        </g>

        {/* === 6. 右壁（奥側）と奥のパレット === */}
        <polygon points={`${iso(80,40,5)} ${iso(80,20,5)} ${iso(80,20,35)} ${iso(80,40,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <Pallet x={83} y={23} z={5} />
        <Bag x={89} y={29} z={8} />

        {/* === 7. シャッターと妻壁（入り口上部） === */}
        <polygon points={`${iso(80,70,25)} ${iso(80,40,25)} ${iso(80,40,35)} ${iso(80,70,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(80,80,35)} ${iso(80,20,35)} ${iso(80,50,45)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* シャッター本体 */}
        <Cube x={78} y={39} z={25} w={4} d={32} h={4} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />
        <polygon points={`${iso(79.5,69,12)} ${iso(79.5,41,12)} ${iso(79.5,41,25)} ${iso(79.5,69,25)}`} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {[14, 16, 18, 20, 22, 24].map(lz => (
          <line key={`sh-${lz}`} 
                x1={iso(79.5, 69, lz).split(',')[0]} y1={iso(79.5, 69, lz).split(',')[1]}
                x2={iso(79.5, 41, lz).split(',')[0]} y2={iso(79.5, 41, lz).split(',')[1]} 
                stroke="#64748b" strokeWidth="0.8" />
        ))}

        {/* === 8. 右壁（手前側）と手前の柱 === */}
        <polygon points={`${iso(80,80,5)} ${iso(80,70,5)} ${iso(80,70,35)} ${iso(80,80,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <Cube x={78} y={78} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />

        {/* === 9. 屋根 === */}
        {/* 右側面（奥側） */}
        <polygon points={`${iso(18,18,36)} ${iso(82,18,36)} ${iso(82,50,48)} ${iso(18,50,48)}`} fill={colors.roofBlueDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左側面（手前側） */}
        <polygon points={`${iso(18,82,36)} ${iso(82,82,36)} ${iso(82,50,48)} ${iso(18,50,48)}`} fill={colors.roofBlue} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 屋根の縁取り */}
        <polygon points={`${iso(82,82,33)} ${iso(82,50,45)} ${iso(82,18,33)} ${iso(82,18,36)} ${iso(82,50,48)} ${iso(82,82,36)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(18,82,33)} ${iso(18,50,45)} ${iso(18,18,33)} ${iso(18,18,36)} ${iso(18,50,48)} ${iso(18,82,36)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />

        {/* === 10. 外の段ボール（左側） === */}
        <Box x={65} y={82} z={5} />
        <Box x={55} y={84} z={5} />
        <Box x={45} y={83} z={5} />
        <Box x={35} y={85} z={5} />
        <Box x={70} y={87} z={5} />
        <Box x={60} y={88} z={5} />
        <Box x={50} y={89} z={5} />
        <Box x={40} y={90} z={5} />
        <Box x={30} y={91} z={5} />
        <Box x={62} y={85} z={11} />
        <Box x={52} y={86} z={11} />
        <Box x={42} y={87} z={11} />
        <Box x={57} y={89} z={11} />
        <Box x={47} y={90} z={11} />
        <Box x={55} y={87} z={17} />

        {/* === 11. 手前のパレット === */}
        <Pallet x={83} y={75} z={5} />
        <Bag x={89} y={81} z={8} />

      </g>
    </svg>
  );
};

export const SvgGrandWarehouse = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    roofLight: '#0284c7', roofDark: '#0369a1',
    roofEdgeSide: '#075985', roofEdgeFront: '#0c4a6e',
    wallLeft: '#a1a1aa', wallRight: '#71717a',
    doorDark: '#27272a', shutter: '#3f3f46',
    windowFrame: '#0284c7', windowGlass: '#e0f2fe',
    boxTop: '#fbbf24', boxLeft: '#f59e0b', boxRight: '#d97706',
    eaveTop: '#f4f4f5', eaveLeft: '#e4e4e7', eaveRight: '#d4d4d8',
    platform: '#0284c7', base: '#f1f5f9'
  };

  // 直方体を描画するヘルパー
  const Cube = ({ x, y, z, w, d, h, cTop, cLeft, cRight }) => (
    <g>
      <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cLeft} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={cRight} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cTop} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  );

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(82, 74) scale(2.9)">

        {/* === 1. ベース（1x2マスの敷地） === */}
        {/* 幅(X)を狭く、奥行き(Y)を長くすることで「左手前」に伸びる1x2マスを表現 */}
        <polygon points={`${iso(0,0,0)} ${iso(55,0,0)} ${iso(55,105,0)} ${iso(0,105,0)}`} fill={colors.base} stroke="#cbd5e1" strokeWidth="1" strokeLinejoin="round" />

        {/* === 2. 右下の壁（長方形・右面） === */}
        <polygon points={`${iso(5,95,0)} ${iso(45,95,0)} ${iso(45,95,25)} ${iso(5,95,25)}`} fill={colors.wallRight} stroke="#3f3f46" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 3. 右下の壁の開口部（プラットフォーム奥） === */}
        <polygon points={`${iso(15,95.1,5)} ${iso(35,95.1,5)} ${iso(35,95.1,18)} ${iso(15,95.1,18)}`} fill={colors.doorDark} stroke="#1e293b" strokeWidth="0.5" />
        
        {/* === 4. 開口部内の段ボール === */}
        <Cube x={17} y={89} z={5} w={7} d={6} h={7} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />
        <Cube x={27} y={89} z={5} w={7} d={6} h={7} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />

        {/* === 5. プラットフォーム（青い出っ張り） === */}
        <Cube x={13} y={95} z={3} w={24} d={3} h={2} cTop={colors.platform} cLeft="#0369a1" cRight="#075985" />

        {/* === 6. 右下の壁の窓 === */}
        <polygon points={`${iso(19,95.1,20)} ${iso(25,95.1,20)} ${iso(25,95.1,23)} ${iso(19,95.1,23)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(19.5,95.2,20.5)} ${iso(24.5,95.2,20.5)} ${iso(24.5,95.2,22.5)} ${iso(19.5,95.2,22.5)}`} fill={colors.windowGlass} />

        {/* === 7. 左下の壁（M字・左面） === */}
        <polygon points={`
          ${iso(45,95,0)} ${iso(45,5,0)} ${iso(45,5,25)} 
          ${iso(45,27.5,45)} ${iso(45,50,25)} ${iso(45,72.5,45)} ${iso(45,95,25)}
        `} fill={colors.wallLeft} stroke="#3f3f46" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 8. 左下の壁の窓1 (奥の山の下) === */}
        <polygon points={`${iso(45.1,15,15)} ${iso(45.1,23,15)} ${iso(45.1,23,19)} ${iso(45.1,15,19)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,15.5,15.5)} ${iso(45.2,22.5,15.5)} ${iso(45.2,22.5,18.5)} ${iso(45.2,15.5,18.5)}`} fill={colors.windowGlass} />

        {/* === 9. 左下の壁の窓2 (奥の山の下・中央寄り) === */}
        <polygon points={`${iso(45.1,35,15)} ${iso(45.1,43,15)} ${iso(45.1,43,19)} ${iso(45.1,35,19)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,35.5,15.5)} ${iso(45.2,42.5,15.5)} ${iso(45.2,42.5,18.5)} ${iso(45.2,35.5,18.5)}`} fill={colors.windowGlass} />

        {/* === 10. 左下の壁の搬入口（シャッター） === */}
        <polygon points={`${iso(45.1,65,0)} ${iso(45.1,83,0)} ${iso(45.1,83,14)} ${iso(45.1,65,14)}`} fill={colors.doorDark} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,66,0)} ${iso(45.2,82,0)} ${iso(45.2,82,13)} ${iso(45.2,66,13)}`} fill={colors.shutter} />
        {/* シャッターの縞模様 */}
        {[2, 4, 6, 8, 10, 12].map(lz => (
          <line key={`sh-${lz}`} 
                x1={iso(45.3, 66, lz).split(',')[0]} y1={iso(45.3, 66, lz).split(',')[1]}
                x2={iso(45.3, 82, lz).split(',')[0]} y2={iso(45.3, 82, lz).split(',')[1]} 
                stroke="#27272a" strokeWidth="0.8" />
        ))}

        {/* === 11. 搬入口の白い庇と柱 === */}
        {/* 柱 (手前側のみ) */}
        <Cube x={49} y={81} z={0} w={2} d={2} h={14} cTop={colors.eaveRight} cLeft={colors.eaveLeft} cRight={colors.eaveRight} />
        {/* 庇本体 */}
        <Cube x={45.1} y={63} z={14} w={6} d={22} h={3} cTop={colors.eaveTop} cLeft={colors.eaveLeft} cRight={colors.eaveRight} />

        {/* === 12. 屋根 === */}
        {/* 斜面1 (一番奥、裏側で見えにくいが立体感のため描画) */}
        <polygon points={`${iso(3,27.5,47)} ${iso(47,27.5,47)} ${iso(47,3,27)} ${iso(3,3,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面2 (奥の山の手前斜面) */}
        <polygon points={`${iso(3,27.5,47)} ${iso(47,27.5,47)} ${iso(47,50,27)} ${iso(3,50,27)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面3 (手前の山の奥斜面) */}
        <polygon points={`${iso(3,72.5,47)} ${iso(47,72.5,47)} ${iso(47,50,27)} ${iso(3,50,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面4 (一番手前) */}
        <polygon points={`${iso(3,72.5,47)} ${iso(47,72.5,47)} ${iso(47,97,25)} ${iso(3,97,25)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 13. 屋根の縁取り（厚み） === */}
        {/* 左面のM字の断面 */}
        <polygon points={`
          ${iso(47, 3, 25)} ${iso(47, 27.5, 45)} ${iso(47, 50, 25)} ${iso(47, 72.5, 45)} ${iso(47, 97, 23)}
          ${iso(47, 97, 25)} ${iso(47, 72.5, 47)} ${iso(47, 50, 27)} ${iso(47, 27.5, 47)} ${iso(47, 3, 27)}
        `} fill={colors.roofEdgeSide} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 右手前（先端）の断面 */}
        <polygon points={`${iso(3,97,23)} ${iso(47,97,23)} ${iso(47,97,25)} ${iso(3,97,25)}`} fill={colors.roofEdgeFront} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />

      </g>
    </svg>
  );
};

export const SvgMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -30,-15 0,-30 30,-15" fill="#d6d3d1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 30,-15 30,-12 0,3" fill="#a8a29e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 -30,-15 -30,-12 0,3" fill="#78716c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {[{x:-12,y:-5,c:'#ef4444'},{x:15,y:-12,c:'#3b82f6'},{x:0,y:-22,c:'#facc15'}].map((s,i) => (
        <g key={`mst-${i}`} transform={`translate(${s.x}, ${s.y})`}>
          <polygon points="0,-4 -8,-8 -8,-10 0,-6" fill="#78350f" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <polygon points="0,-4 8,-8 8,-10 0,-6" fill="#b45309" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <polygon points="0,-6 -8,-10 0,-14 8,-10" fill="#d97706" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
          <polygon points="-2,-16 -12,-21 0,-27 10,-22" fill="#fff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="-2,-16 -7,-18.5 -1,-22 4,-19.5" fill={s.c} stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgPort = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    contWhite: { top: '#f8fafc', left: '#e2e8f0', right: '#cbd5e1' },
    contBlue:  { top: '#38bdf8', left: '#0284c7', right: '#0369a1' },
    contRed:   { top: '#f87171', left: '#dc2828', right: '#b91c1c' },
    contYellow:{ top: '#facc15', left: '#eab308', right: '#ca8a04' },
    contGreen: { top: '#4ade80', left: '#22c55e', right: '#16a34a' },
    shipHull:  { top: '#475569', left: '#c2410c', right: '#ea580c' },
    craneRed:  { top: '#f87171', left: '#ef4444', right: '#dc2828' },
    craneDark: { top: '#475569', left: '#334155', right: '#1e293b' },
  };

  const boxColors = [colors.contWhite, colors.contBlue, colors.contRed, colors.contYellow, colors.contGreen];

  // 描画オブジェクトを保持する配列
  const objects = [];

  // 直方体を追加
  const addCube = (x, y, z, w, d, h, c) => {
    objects.push({ cx: x + w / 2, cy: y + d / 2, cz: z + h / 2, type: 'cube', x, y, z, w, d, h, c });
  };

  // 船首（斜めカット）を追加
  const addBow = (x, y, z, w, d, h, c) => {
    objects.push({ cx: x + w / 2, cy: y + d / 3, cz: z + h / 2, type: 'bow', x, y, z, w, d, h, c });
  };

  // トラックを追加
  const addTruck = (x, y, z) => {
    addCube(x, y, z, 3, 8, 4, colors.contWhite);
    addCube(x + 0.5, y - 2, z, 2, 2, 3, colors.contBlue);
  };

  const seaZ = -4; // 海面の高さ

  // === 1. コンテナ船 ===
  addCube(56, 15, seaZ, 26, 60, 12, colors.shipHull); // 船体
  addBow(56, 5, seaZ, 26, 10, 12, colors.shipHull);   // 船首
  addCube(58, 65, seaZ + 12, 22, 8, 8, colors.contWhite); // ブリッジ1階
  addCube(60, 67, seaZ + 20, 18, 5, 6, colors.contWhite); // ブリッジ2階
  addCube(68, 70, seaZ + 26, 4, 3, 10, colors.craneDark); // 煙突

  // 船上のコンテナ
  for (let cx = 58; cx <= 74; cx += 8) {
    for (let cy = 20; cy <= 60; cy += 13) {
      for (let cz = seaZ + 12; cz <= seaZ + 24; cz += 6) {
        if ((cx * cy * cz) % 7 < 2) continue; // ランダムに間引く
        addCube(cx, cy, cz, 7, 12.5, 5.5, boxColors[(cx + cy + cz) % boxColors.length]);
      }
    }
  }

  // === 2. 陸のコンテナ山 ===
  for (let cx = 5; cx <= 25; cx += 8) {
    for (let cy = 10; cy <= 80; cy += 14) {
      for (let cz = 0; cz <= 6; cz += 6) {
        if ((cx + cy * cz) % 5 < 2) continue;
        addCube(cx, cy, cz, 7, 13, 5.5, boxColors[(cx * cy + cz) % boxColors.length]);
      }
    }
  }

  // === 3. ガントリークレーン（2基） ===
  [28, 58].forEach(cy => {
    // 左足 (陸奥側) と 右足 (海側・岸壁ギリギリ)
    addCube(25, cy, 0, 3, 3, 26, colors.craneRed);
    addCube(25, cy + 6, 0, 3, 3, 26, colors.craneRed);
    addCube(25, cy, 12, 3, 9, 2, colors.craneRed);
    
    addCube(45, cy, 0, 3, 3, 26, colors.craneRed);
    addCube(45, cy + 6, 0, 3, 3, 26, colors.craneRed);
    addCube(45, cy, 12, 3, 9, 2, colors.craneRed);

    // 足の間の横繋ぎ
    addCube(25, cy, 26, 23, 3, 3, colors.craneRed);
    addCube(25, cy + 6, 26, 23, 3, 3, colors.craneRed);

    // メインブーム (海へ突き出す梁) ※重心ハックのため陸側と海側に分割
    addCube(20, cy + 2.5, 29, 30, 4, 3, colors.craneRed); // 陸側
    addCube(50, cy + 2.5, 29, 35, 4, 3, colors.craneRed); // 海側

    // Aフレーム (上部の支柱)
    objects.push({ cx: 35, cy: cy + 2.5, cz: 37, type: 'poly', fill: colors.craneRed.left,
      points3d: [{x: 35, y: cy + 2.5, z: 44}, {x: 26, y: cy + 2.5, z: 32}, {x: 46, y: cy + 2.5, z: 32}] });
    objects.push({ cx: 35, cy: cy + 6.5, cz: 37, type: 'poly', fill: colors.craneRed.left,
      points3d: [{x: 35, y: cy + 6.5, z: 44}, {x: 26, y: cy + 6.5, z: 32}, {x: 46, y: cy + 6.5, z: 32}] });

    // ワイヤー
    objects.push({ cx: 55, cy: cy + 2.5, cz: 38, type: 'line', stroke: '#ef4444', strokeWidth: 1,
      p1: {x: 35, y: cy + 2.5, z: 44}, p2: {x: 75, y: cy + 2.5, z: 32} });
    objects.push({ cx: 55, cy: cy + 6.5, cz: 38, type: 'line', stroke: '#ef4444', strokeWidth: 1,
      p1: {x: 35, y: cy + 6.5, z: 44}, p2: {x: 75, y: cy + 6.5, z: 32} });

    // 吊り具とコンテナ
    objects.push({ cx: 65, cy: cy + 4.5, cz: 24, type: 'line', stroke: '#1e293b', strokeWidth: 1,
      p1: {x: 65, y: cy + 4.5, z: 29}, p2: {x: 65, y: cy + 4.5, z: 19} });
    addCube(61.5, cy + 3, 19, 7, 3, 1, colors.craneDark);
    addCube(61.5, cy + 2, 13.5, 7, 5, 5.5, boxColors[cy % boxColors.length]);
  });

  // === 4. トラック ===
  addTruck(35, 20, 0);
  addTruck(35, 45, 0);
  addTruck(30, 80, 0);

  // === Zソートの実行 (重心のX+Y+Zで奥から手前へ並び替え) ===
  objects.sort((a, b) => (a.cx + a.cy + a.cz) - (b.cx + b.cy + b.cz));

  // オブジェクトのレンダリング
  const renderObject = (obj, i) => {
    if (obj.type === 'cube') {
      const { x, y, z, w, d, h, c } = obj;
      return (
        <g key={`obj-${i}`}>
          <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={c.left} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={c.right} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={c.top} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      );
    }
    if (obj.type === 'bow') {
      const { x, y, z, w, d, h, c } = obj;
      const tipX = x + w / 2;
      return (
        <g key={`obj-${i}`}>
          <polygon points={`${iso(x,y+d,z)} ${iso(tipX,y,z)} ${iso(tipX,y,z+h)} ${iso(x,y+d,z+h)}`} fill={c.left} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(tipX,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(tipX,y,z+h)}`} fill={c.right} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x,y+d,z+h)} ${iso(tipX,y,z+h)} ${iso(x+w,y+d,z+h)}`} fill={c.top} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      );
    }
    if (obj.type === 'poly') {
      const pts = obj.points3d.map(p => iso(p.x, p.y, p.z)).join(' ');
      return <polygon key={`obj-${i}`} points={pts} fill={obj.fill} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />;
    }
    if (obj.type === 'line') {
      const p1 = iso(obj.p1.x, obj.p1.y, obj.p1.z).split(',');
      const p2 = iso(obj.p2.x, obj.p2.y, obj.p2.z).split(',');
      return <line key={`obj-${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
    }
    return null;
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(50, 67) scale(3.03)">
        <polygon points={`${iso(50,0,seaZ)} ${iso(100,0,seaZ)} ${iso(100,100,seaZ)} ${iso(50,100,seaZ)}`} fill="#0891b2" />
        <polygon points={`${iso(0,0,0)} ${iso(50,0,0)} ${iso(50,100,0)} ${iso(0,100,0)}`} fill="#94a3b8" />
        <polygon points={`${iso(50,0,seaZ)} ${iso(50,100,seaZ)} ${iso(50,100,0)} ${iso(50,0,0)}`} fill="#64748b" stroke="#334155" strokeWidth="0.5" />

        {/* トラックの通り道（アスファルトの装飾） */}
        <polygon points={`${iso(33,0,0.02)} ${iso(38,0,0.02)} ${iso(38,100,0.02)} ${iso(33,100,0.02)}`} fill="#cbd5e1" opacity="0.6" />

        {/* 岸壁のゼブラ模様 */}
        <polygon points={`${iso(46,0,0.05)} ${iso(50,0,0.05)} ${iso(50,100,0.05)} ${iso(46,100,0.05)}`} fill="#334155" />
        {Array.from({ length: 15 }).map((_, i) => (
          <polygon key={`zebra-${i}`} 
            points={`${iso(46, i*6.5+1, 0.1)} ${iso(50, i*6.5+3, 0.1)} ${iso(50, i*6.5+5.5, 0.1)} ${iso(46, i*6.5+3.5, 0.1)}`}
            fill="#eab308" />
        ))}

        {/* 海面の波 */}
        {[...Array(20)].map((_, i) => {
          const px = 60 + (i * 7) % 35;
          const py = 10 + (i * 13) % 85;
          return (
            <line key={`wave-${i}`}
              x1={iso(px, py, seaZ).split(',')[0]} y1={iso(px, py, seaZ).split(',')[1]}
              x2={iso(px+3, py, seaZ).split(',')[0]} y2={iso(px+3, py, seaZ).split(',')[1]}
              stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          );
        })}

        {/* Zソートされたすべての立体オブジェクト */}
        {objects.map(renderObject)}

      </g>
    </svg>
  );
};

export const SvgGarden = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="garden" color="#86efac" thickness={3} /></svg>;

export const SvgSmithy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-20,-16 -20,-30 0,-20 0,-6" fill="#78350f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 -20,-30 -10,-40" fill="#78350f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-8, -10)">
        <polygon points="0,0 -8,-4 -8,-16 0,-12" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 8,-4 8,-16 0,-12" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,-12 -8,-16 0,-20 8,-16" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="0" cy="-8" r="3" fill="#f97316" stroke="#000" strokeWidth="1" />
        <polygon points="0,-20 -4,-22 -4,-45 0,-43" fill="#334155" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-20 4,-22 4,-45 0,-43" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(8, -6)">
        <polygon points="0,-9 -4,-11 2,-14 6,-12" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <polygon points="4,-19 24,-29 12,-43 -12,-31" fill="#451a03" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFactory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* メイン工場棟 */}
      <polygon points="0,-3 -30,-18 -30,-38 0,-23" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-3 30,-18 30,-38 0,-23" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-23 -30,-38 -30,-40 0,-25" fill="#450a0a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-23 30,-38 30,-40 0,-25" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 左側の倉庫棟 */}
      <polygon points="-30,-18 -48,-27 -48,-40 -30,-31" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-30,-18 -18,-24 -18,-37 -30,-31" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-30,-31 -48,-40 -33,-47 -18,-37" fill="#475569" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 窓 */}
      <g transform="translate(-15, -15)">
        <polygon points="0,-0.5 -9.5,-5.5 -9.5,-14.5 0,-9.5" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      <g transform="translate(5, -10)">
        <polygon points="0,-0.5 9.5,-5.5 9.5,-14.5 0,-9.5" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 煙突3本 */}
      <g transform="translate(-18, -35)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(-6, -41)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(-35, -38)">
        <polygon points="0,0 -3,-1.5 -3,-25 0,-23.5" fill="#475569" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="0,0 3,-1.5 3,-25 0,-23.5" fill="#64748b" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 入口 */}
      <polygon points="0,-3 -8,-7 -8,-15 0,-11" fill="#1e293b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgWatermill = () => {
  const iso = (x, y, z = 0) => {
    const ptX = (x * 2 - y) * 0.44;
    const ptY = -66 + (x * 2 + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };
  const colors = {
    base: '#f1f5f9', water: '#73a2a6',
    wallLeft: '#c0906a', wallRight: '#9b7150',
    roofLight: '#8c7961', roofDark: '#6e5f4d',
    roofEdge: '#524333', roofEdgeDark: '#3e3124',
    woodDark: '#3a2210', woodMedium: '#5a3820', woodLight: '#7a4a2a',
    stoneTop: '#a8b0b2', stoneSide: '#8b9396'
  };
  const getWheelPath = (x, cy, cz, r, thickness) => {
    const pts = [];
    for (let i = 0; i <= 360; i += 15) {
      const rad = i * Math.PI / 180;
      pts.push(iso(x, cy + r * Math.cos(rad), cz + r * Math.sin(rad)));
    }
    for (let i = 360; i >= 0; i -= 15) {
      const rad = i * Math.PI / 180;
      pts.push(iso(x, cy + (r - thickness) * Math.cos(rad), cz + (r - thickness) * Math.sin(rad)));
    }
    return pts.join(' ');
  };
  const drawPaddles = (x1, x2, cy, cz, r, thickness) => {
    const paddles = [];
    for (let i = 0; i < 360; i += 15) {
      const rad = i * Math.PI / 180;
      const dy1 = r * Math.cos(rad), dz1 = r * Math.sin(rad);
      const dy2 = (r - thickness) * Math.cos(rad), dz2 = (r - thickness) * Math.sin(rad);
      paddles.push(
        <polygon key={`pad-${i}`}
          points={`${iso(x1, cy+dy1, cz+dz1)} ${iso(x2, cy+dy1, cz+dz1)} ${iso(x2, cy+dy2, cz+dz2)} ${iso(x1, cy+dy2, cz+dz2)}`}
          fill="#4a3219" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      );
    }
    return paddles;
  };
  const drawSpokes = (x, cy, cz, r, count = 8) => {
    const spokes = [];
    const step = 180 / count;
    for (let i = 0; i < 180; i += step) {
      const rad = i * Math.PI / 180;
      const c = Math.cos(rad), s = Math.sin(rad);
      const w = 1.2;
      spokes.push(
        <polygon key={`spk-${x}-${i}`}
          points={`${iso(x, cy+r*c+w*s, cz+r*s-w*c)} ${iso(x, cy+r*c-w*s, cz+r*s+w*c)} ${iso(x, cy-r*c-w*s, cz-r*s+w*c)} ${iso(x, cy-r*c+w*s, cz-r*s-w*c)}`}
          fill="#8a5a33" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      );
    }
    return spokes;
  };
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(-2, 126) scale(2.35)">
        {/* 地面と水路 */}
        <polygon points={`${iso(0,0,0)} ${iso(65,0,0)} ${iso(65,100,0)} ${iso(0,100,0)}`} fill={colors.base} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(65,0,0)} ${iso(65,100,0)} ${iso(65,100,-5)} ${iso(65,0,-5)}`} fill={colors.stoneSide} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(65,0,-5)} ${iso(85,0,-5)} ${iso(85,100,-5)} ${iso(65,100,-5)}`} fill={colors.water} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[10, 30, 50, 70, 90].map(wy => (
          <line key={`wave-${wy}`}
            x1={iso(70, wy, -5).split(',')[0]} y1={iso(70, wy, -5).split(',')[1]}
            x2={iso(78, wy+8, -5).split(',')[0]} y2={iso(78, wy+8, -5).split(',')[1]}
            stroke="#99c8cb" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        ))}
        {/* 建物の壁 */}
        <polygon points={`${iso(60,10,0)} ${iso(60,80,0)} ${iso(60,80,29.1)} ${iso(60,10,29.1)}`} fill={colors.wallRight} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(60.1,72,10)} ${iso(60.1,78,10)} ${iso(60.1,78,20)} ${iso(60.1,72,20)}`} fill="#382613" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(60.2,73,11)} ${iso(60.2,77,11)} ${iso(60.2,77,19)} ${iso(60.2,73,19)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <line x1={iso(60.3,75,11).split(',')[0]} y1={iso(60.3,75,11).split(',')[1]} x2={iso(60.3,75,19).split(',')[0]} y2={iso(60.3,75,19).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        <line x1={iso(60.3,73,15).split(',')[0]} y1={iso(60.3,73,15).split(',')[1]} x2={iso(60.3,77,15).split(',')[0]} y2={iso(60.3,77,15).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        <polygon points={`${iso(15,80,0)} ${iso(60,80,0)} ${iso(60,80,29.1)} ${iso(37.5,80,45)} ${iso(15,80,29.1)}`} fill={colors.wallLeft} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 正面窓（格子引き戸） */}
        <polygon points={`${iso(25,80.1,5)} ${iso(45,80.1,5)} ${iso(45,80.1,20)} ${iso(25,80.1,20)}`} fill="#382613" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(26,80.1,6)} ${iso(44,80.1,6)} ${iso(44,80.1,19)} ${iso(26,80.1,19)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[29, 32, 35, 38, 41].map(wx => (
          <line key={`v-${wx}`} x1={iso(wx, 80.2, 6).split(',')[0]} y1={iso(wx, 80.2, 6).split(',')[1]} x2={iso(wx, 80.2, 19).split(',')[0]} y2={iso(wx, 80.2, 19).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        ))}
        {[9, 12.5, 16].map(wz => (
          <line key={`h-${wz}`} x1={iso(26, 80.2, wz).split(',')[0]} y1={iso(26, 80.2, wz).split(',')[1]} x2={iso(44, 80.2, wz).split(',')[0]} y2={iso(44, 80.2, wz).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        ))}
        {/* 屋根 */}
        <polygon points={`${iso(37.5,82,45)} ${iso(37.5,8,45)} ${iso(12,8,27)} ${iso(12,82,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,45)} ${iso(37.5,8,45)} ${iso(63,8,27)} ${iso(63,82,27)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,47)} ${iso(12,82,29)} ${iso(12,80,27)} ${iso(37.5,80,45)}`} fill={colors.roofEdgeDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,47)} ${iso(63,82,29)} ${iso(63,80,27)} ${iso(37.5,80,45)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(36,79,47)} ${iso(36,11,47)} ${iso(39,11,47)} ${iso(39,79,47)}`} fill="#4a3b2c" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(39,79,47)} ${iso(39,11,47)} ${iso(39,11,45)} ${iso(39,79,45)}`} fill="#3e3124" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(36,79,47)} ${iso(39,79,47)} ${iso(39,79,45)} ${iso(36,79,45)}`} fill="#2c2219" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 水車 */}
        <polygon points={getWheelPath(61, 45, 10, 19, 3)} fill={colors.woodMedium} stroke="#1e293b" strokeWidth="1" fillRule="evenodd" strokeLinejoin="round" />
        {drawSpokes(61.5, 45, 10, 16, 8)}
        {drawPaddles(61, 75, 45, 10, 19, 3)}
        <polygon points={`${iso(59, 43, 8)} ${iso(77, 43, 8)} ${iso(77, 47, 12)} ${iso(59, 47, 12)}`} fill={colors.woodDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={getWheelPath(75, 45, 10, 19, 3)} fill={colors.woodLight} stroke="#1e293b" strokeWidth="1" fillRule="evenodd" strokeLinejoin="round" />
        {drawSpokes(74.5, 45, 10, 16, 8)}
        {/* 手前の土手 */}
        <polygon points={`${iso(85,0,-5)} ${iso(85,100,-5)} ${iso(85,100,0)} ${iso(85,0,0)}`} fill={colors.stoneSide} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(85,0,0)} ${iso(100,0,0)} ${iso(100,100,0)} ${iso(85,100,0)}`} fill={colors.stoneTop} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

export const SvgMine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-25,-5 -15,-30 0,-45 20,-35 30,-10 15,5 -10,5" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-45 20,-35 30,-10 15,5 0,0 -10,-20" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="20,-35 30,-10 25,-5 10,-20" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -10,0 C -10,-20 10,-20 10,0 L 0,5 Z" fill="#000" />
      <polygon points="-12,-2 -10,-1 -10,-18 -12,-19" fill="#451a03" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="12,-2 10,-1 10,-18 12,-19" fill="#451a03" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="-14,-19 14,-19 12,-16 -12,-16" fill="#451a03" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(-10, 4)">
        <polygon points="-6,-4 0,-7 6,-4 0,-1" fill="#64748b" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="-6,-4 0,-1 0,3 -6,0" fill="#475569" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="0,-1 6,-4 6,0 0,3" fill="#94a3b8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

// ==========================================
// 6. Special & Mega Assets
// ==========================================
export const SvgCastle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* 城壁（外周） */}
      <polygon points="0,5 -36,-13 -36,-20 0,-2" fill="#57534e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="0,5 36,-13 36,-20 0,-2" fill="#78716c" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* メイン天守閣の土台 */}
      <polygon points="0,0 -28,-14 -28,-24 0,-10" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 28,-14 28,-24 0,-10" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 四隅の櫓 */}
      {[{x:-28,y:-14},{x:28,y:-14},{x:-14,y:-28},{x:14,y:-28}].map((t, i) => (
        <g key={`t-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <polygon points="-6,0 -6,-25 6,-25 6,0" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="-8,-24 8,-24 0,-40" fill="#3b82f6" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          {/* 小さな旗 */}
          <line x1="0" y1="-40" x2="0" y2="-46" stroke="#000" strokeWidth="0.8" />
          <polygon points="0,-46 5,-44 0,-42" fill="#ef4444" />
        </g>
      ))}
      {/* 天守閣（3層） */}
      <g transform="translate(0, -18)">
        {/* 1層目 */}
        <polygon points="0,0 -16,-8 -16,-18 0,-10" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 16,-8 16,-18 0,-10" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        {/* 2層目 */}
        <polygon points="0,-10 -12,-16 -12,-26 0,-20" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-10 12,-16 12,-26 0,-20" fill="#f8fafc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 屋根1 */}
        <polygon points="-18,-16 0,-8 0,-12 -18,-20" fill="#3b82f6" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="18,-16 0,-8 0,-12 18,-20" fill="#1e3a8a" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 最上部の屋根 */}
        <polygon points="-14,-25 0,-19 0,-52" fill="#3b82f6" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="14,-25 0,-19 0,-52" fill="#1e3a8a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        {/* 金のシャチホコ */}
        <circle cx="0" cy="-53" r="2" fill="#fbbf24" stroke="#000" strokeWidth="0.8" />
      </g>
      {/* 入口 */}
      <path d="M -4,-4 L 4,-8 L 4,-14 C 4,-16 -4,-12 -4,-10 Z" fill="#000" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgGoldCastle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -30,-15 -30,-25 0,-10" fill="#d97706" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 30,-15 30,-25 0,-10" fill="#fbbf24" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {[{x:-30,y:-15},{x:30,y:-15},{x:-15,y:-30},{x:15,y:-30}].map((t, i) => (
        <g key={`gt-${i}`} transform={`translate(${t.x}, ${t.y})`}>
          <polygon points="-6,0 -6,-30 6,-30 6,0" fill="#fbbf24" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="-8,-29 8,-29 0,-48" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="0" cy="-49" r="1.5" fill="#fcd34d" stroke="#000" strokeWidth="1" />
        </g>
      ))}
      <g transform="translate(0, -20)">
        <polygon points="0,0 -18,-9 -18,-35 0,-26" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 18,-9 18,-35 0,-26" fill="#ffffff" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="-20,-33 0,-23 0,-60" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="20,-33 0,-23 0,-60" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <path d="M -5,-7 L 5,-12 L 5,-18 C 5,-20 -5,-15 -5,-13 Z" fill="#000" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgTorii = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-18,-13 -14,-15 -14,-45 -18,-43" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-14,-15 -10,-13 -10,-43 -14,-45" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="14,-3 18,-5 18,-35 14,-33" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="18,-5 22,-3 22,-33 18,-35" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-24,-29 24,-5 24,-11 -24,-35" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -30,-41 Q 0,-33 30,-11 L 30,-17 Q 0,-39 -30,-47 Z" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -32,-46 Q 0,-38 28,-16 L 32,-22 Q 0,-44 -34,-52 Z" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgTemple = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* 境内の敷地 */}
      <polygon points="0,10 -38,-9 0,-28 38,-9" fill="#d6d3d1" stroke="#000" strokeWidth="0.5" opacity="0.3" />
      {/* 石段 */}
      <polygon points="-5,8 5,3 5,1 -5,6" fill="#a8a29e" stroke="#000" strokeWidth="0.5" />
      <polygon points="-5,6 5,1 5,-1 -5,4" fill="#d6d3d1" stroke="#000" strokeWidth="0.5" />
      {/* 本堂 */}
      <polygon points="0,0 -28,-14 -28,-18 0,-4" fill="#78716c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 28,-14 28,-18 0,-4" fill="#a8a29e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-4 -28,-18 0,-32 28,-18" fill="#e7e5e4" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 壁面 */}
      <polygon points="-14,-13 -4,-18 -4,-28 -14,-23" fill="#f8fafc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="14,-13 4,-18 4,-28 14,-23" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 屋根（反り返り） */}
      <path d="M -32,-26 Q 0,-15 32,-26 L 30,-30 Q 0,-19 -30,-30 Z" fill="#1c1917" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,-50 Q -15,-30 -32,-26 Q 0,-38 0,-50" fill="#292524" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,-50 Q 15,-30 32,-26 Q 0,-38 0,-50" fill="#44403c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 鐘楼（右手前） */}
      <g transform="translate(25, 0)">
        <polygon points="0,0 -6,-3 -6,-10 0,-7" fill="#78716c" stroke="#000" strokeWidth="1" />
        <polygon points="0,0 6,-3 6,-10 0,-7" fill="#a8a29e" stroke="#000" strokeWidth="1" />
        <polygon points="0,-7 -8,-11 0,-15 8,-11" fill="#292524" stroke="#000" strokeWidth="1" />
        <circle cx="0" cy="-9" r="1.5" fill="#d97706" />
      </g>
      {/* 灯篭（左手前） */}
      <g transform="translate(-25, 0)">
        <polygon points="0,0 -3,-1.5 -3,-8 0,-6.5" fill="#94a3b8" stroke="#000" strokeWidth="0.8" />
        <polygon points="0,0 3,-1.5 3,-8 0,-6.5" fill="#cbd5e1" stroke="#000" strokeWidth="0.8" />
        <circle cx="0" cy="-9" r="1.5" fill="#fef08a" filter="url(#glow-effect)" />
      </g>
    </g>
  </svg>
);

export const SvgDragon = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <path d="M -10,8 C -25,5 -20,-10 -5,-5 C 5,-2 15,-5 20,-15 C 25,-25 10,-35 0,-25" fill="none" stroke="#000" strokeWidth="8" strokeLinecap="round" />
      <path d="M -10,8 C -25,5 -20,-10 -5,-5 C 5,-2 15,-5 20,-15 C 25,-25 10,-35 0,-25" fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
      <path d="M 0,-25 C -10,-15 -25,-30 -15,-45" fill="none" stroke="#000" strokeWidth="9" strokeLinecap="round" />
      <path d="M 0,-25 C -10,-15 -25,-30 -15,-45" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round" />
      <polygon points="-15,-45 -22,-40 -25,-48 -18,-52 -10,-48" fill="#10b981" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-18" cy="-46" r="1.5" fill="#ef4444" stroke="#000" strokeWidth="0.5" />
    </g>
  </svg>
);


export const SvgMegaGrandMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,5 -42,-16 0,-37 42,-16" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,5 42,-16 42,-12 0,9" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -16)">
        <polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#f1f5f9" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 16,-8 16,-20 0,-12" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,-12 -16,-20 0,-36 16,-20" fill="#93c5fd" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgMegaFortress = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,3 -35,-14.5 0,-32 35,-14.5" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-2 -25,-14.5 -25,-25 0,-12.5" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-2 25,-14.5 25,-25 0,-12.5" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-12 -20,-22 -20,-38 0,-28" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-12 20,-22 20,-38 0,-28" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -32)">
        <polygon points="0,0 -12,-6 -12,-30 0,-24" fill="#0f172a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 12,-6 12,-30 0,-24" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,-24 -15,-31.5 0,-39 15,-31.5" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgMegaAcademy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,4 -38,-15 0,-34 38,-15" fill="#22c55e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,4 38,-15 38,-11 0,8" fill="#16a34a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -18)">
        <polygon points="0,0 -14,-7 -14,-25 0,-18" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 14,-7 14,-25 0,-18" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <path d="M -12,-32 C -12,-48 12,-48 12,-32" fill="#93c5fd" stroke="#000" strokeWidth="2" />
      </g>
    </g>
  </svg>
);

export const SvgMegaImperialPalace = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,2 -35,-15.5 -35,-20 0,-2.5" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,2 35,-15.5 35,-20 0,-2.5" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-2.5 -35,-20 0,-37.5 35,-20" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -25)">
        <polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#991b1b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 16,-8 16,-20 0,-12" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,-14 -16,-22 0,-30 16,-22" fill="#fbbf24" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgMegaWonder = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,-3 -30,-18 0,-33 30,-18" fill="#fbbf24" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-9 -22,-20 0,-31 22,-20" fill="#fcd34d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -45)">
        <polygon points="0,-25 -15,0 0,25 15,0" fill="#38bdf8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgMegaHarborTown = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-40,-2 0,18 40,-2 0,-22" fill="#0ea5e9" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-40,-2 -10,-17 0,-12 -30,3" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="40,-2 10,-17 0,-12 30,3" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, 4)">
        <path d="M -12,-2 C -15,5 -5,8 10,5 C 15,3 18,-2 15,-6" fill="#78350f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgMegaShrineComplex = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,2 -38,-17 0,-36 38,-17" fill="#15803d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,2 38,-17 38,-13 0,6" fill="#16a34a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -30)">
        <polygon points="0,-4 -20,-14 0,-24 20,-14" fill="#e7e5e4" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="-14,-13 -4,-18 -4,-28 -14,-23" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="14,-13 4,-18 4,-28 14,-23" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgCherryPavilion = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,-5 -18,-14 0,-23 18,-14" fill="#b45309" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,-45 Q -12,-30 -24,-24 Q 0,-35 0,-45" fill="#be185d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 0,-45 Q 12,-30 24,-24 Q 0,-35 0,-45" fill="#db2777" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="-25" cy="-10" r="6" fill="#fbcfe8" stroke="#000" strokeWidth="1.5" />
      <circle cx="22" cy="-5" r="7" fill="#fbcfe8" stroke="#000" strokeWidth="1.5" />
    </g>
  </svg>
);

export const SvgCrystalTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-5,-10 0,-60 5,-15" fill="#a7f3d0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-5,-10 0,-60 -12,-20" fill="#34d399" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="5,-15 0,-60 12,-25" fill="#059669" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgPhilosophersLab = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,-15 -14,-22 -14,-45 0,-38" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 14,-22 14,-45 0,-38" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-16,-44 0,-36 0,-60" fill="#6366f1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="16,-44 0,-36 0,-60" fill="#4f46e5" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgDragonShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-8,-12 -22,-19 -22,-23 -8,-16" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,-12 12,-22 12,-26 -8,-16" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -4,-50 Q -14,-35 -20,-30 Q -4,-38 -4,-50" fill="#047857" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -4,-50 Q 6,-35 12,-30 Q -4,-38 -4,-50" fill="#059669" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgPerfectMonument = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,-5 -20,-15 0,-25 20,-15" fill="#0f172a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(0, -40)">
        <circle cx="0" cy="0" r="16" fill="#fbbf24" stroke="#000" strokeWidth="2" />
        <circle cx="-4" cy="-4" r="6" fill="#ffffff" stroke="#000" strokeWidth="1" />
      </g>
    </g>
  </svg>
);

export const SvgHotSpring = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-20,5 -30,-5 -20,-15 -5,-20 15,-15 25,-5 15,5 0,10" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -22,-5 C -15,-12 5,-15 18,-5 C 10,2 -10,2 -22,-5 Z" fill="#7dd3fc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgObservatory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <path d="M -16,0 L -16,-25 C -16,-28 16,-28 16,-25 L 16,0 C 16,4 -16,4 -16,0 Z" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -16,-30 C -16,-55 16,-55 16,-30" fill="#0f766e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -4,-30 L -4,-50 C 0,-52 4,-50 4,-30 Z" fill="#020617" stroke="#000" strokeWidth="2" />
    </g>
  </svg>
);

export const SvgShoppingStreet = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-5,2 -25,-10 5,-28 25,-16" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-20, -10)">
        <polygon points="0,0 -12,-7 -12,-20 0,-13" fill="#ffedd5" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-13 -12,-20 -4,-24 8,-17" fill="#fdba74" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(10, -25)">
        <polygon points="0,0 -12,-7 -12,-20 0,-13" fill="#ecfccb" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-13 -12,-20 -4,-24 8,-17" fill="#bef264" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgZenGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,-3 -26,-16 0,-29 26,-16" fill="#fef08a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 -26,-13 -26,-16 0,-3" fill="#92400e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 26,-13 26,-16 0,-3" fill="#b45309" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-8, -18)">
        <polygon points="-3,0 -1,-4 2,-3 3,1 0,2" fill="#475569" stroke="#000" strokeWidth="1" />
      </g>
      <g transform="translate(12, -12)">
        <polygon points="-2,0 -1,-3 2,-2 2,1" fill="#334155" stroke="#000" strokeWidth="1" />
      </g>
    </g>
  </svg>
);

export const SvgNationalLibrary = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.0)"><ellipse cx="0" cy="0" rx="38" ry="19" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-4 -32,-20 0,-36 32,-20" fill="#cbd5e1" /><polygon points="0,-15 -28,-29 -28,-45 0,-31" fill="#fde68a" /><polygon points="0,-15 28,-29 28,-45 0,-31" fill="#fef08a" /><polygon points="0,-33 -30,-48 0,-60 30,-48" fill="#d6d3d1" /><polygon points="0,-31 -30,-46 -30,-48 0,-33" fill="#94a3b8" /><polygon points="0,-31 30,-46 30,-48 0,-33" fill="#cbd5e1" /><g transform="translate(0, -42)"><polygon points="0,0 -12,-6 -12,-12 0,-6" fill="#d4d4d8" /><polygon points="0,0 12,-6 12,-12 0,-6" fill="#e4e4e7" /><path d="M -12,-12 C -12,-28 12,-28 12,-12" fill="#0f766e" /><polygon points="-2,-27 2,-27 2,-30 -2,-30" fill="#e2e8f0" /><polygon points="-3,-30 3,-30 0,-33" fill="#0f766e" /></g></g></svg>);

export const SvgWell = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 50) scale(1.6)">
      {/* 影 */}
      <ellipse cx="0" cy="22" rx="24" ry="12" fill="#020617" opacity="0.18" filter="url(#soft-shadow)" />

      {/* === 井戸の本体（石造り円筒） === */}
      {/* 奥の壁面 */}
      <path d="M -20,2 A 20,10 0 0 1 20,2 L 20,18 A 20,10 0 0 0 -20,18 Z" fill="#475569" opacity="0.5" />
      {/* 手前の壁面 */}
      <path d="M -20,2 L -20,18 A 20,10 0 0 0 20,18 L 20,2" fill="#64748b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 石のテクスチャ */}
      <path d="M -19,7 A 19,9.5 0 0 0 19,7" stroke="#1e293b" strokeWidth="0.5" fill="none" opacity="0.3" />
      <path d="M -18,12 A 18,9 0 0 0 18,12" stroke="#1e293b" strokeWidth="0.5" fill="none" opacity="0.3" />
      {/* 縁の厚み（上部リング） */}
      <ellipse cx="0" cy="2" rx="20" ry="10" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" />
      <ellipse cx="0" cy="0" rx="21" ry="10.5" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2" />
      {/* 内側の穴 */}
      <ellipse cx="0" cy="0" rx="16" ry="8" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
      {/* 水面 */}
      <ellipse cx="0" cy="1" rx="14" ry="7" fill="url(#grad-water)" opacity="0.85" />

      {/* === 支柱（アイソメトリック立体） === */}
      {/* 左柱 - 西面（暗い） */}
      <polygon points="-15,-5 -12,-7 -12,-47 -15,-45" fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 左柱 - 南面（明るい） */}
      <polygon points="-12,-7 -9,-5 -9,-45 -12,-47" fill="#b45309" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 右柱 - 西面 */}
      <polygon points="9,-5 12,-7 12,-47 9,-45" fill="#b45309" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 右柱 - 南面（明るい） */}
      <polygon points="12,-7 15,-5 15,-45 12,-47" fill="#d97706" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />

      {/* === 巻上げ機構 === */}
      {/* 横軸 */}
      <line x1="-11" y1="-46" x2="13" y2="-46" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
      {/* ハンドル */}
      <path d="M 13,-46 L 19,-43 L 19,-38 L 16,-37" fill="none" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* 縄 */}
      <path d="M 1,-46 Q 2,-28 1,-5" stroke="#78350f" strokeWidth="1.2" fill="none" />
      {/* 釣瓶（バケツ） */}
      <g transform="translate(1, -3)">
        <path d="M -4,0 L -3,5 L 3,5 L 4,0 Z" fill="#92400e" stroke="#1e293b" strokeWidth="0.8" />
        <path d="M -3,-1 Q 0,-3 3,-1" stroke="#78350f" strokeWidth="0.8" fill="none" />
      </g>

      {/* === 切妻屋根（センタリング済み） === */}
      {/* SW斜面（暗い面 - 左手前） */}
      <polygon points="-23,-46 -11,-52 11,-46 -1,-40" fill="#b45309" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* SE斜面（明るい面 - 右奥） */}
      <polygon points="-11,-52 1,-58 23,-52 11,-46" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 厚み - SW手前エッジ */}
      <polygon points="-23,-46 -1,-40 -1,-37 -23,-43" fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 厚み - SE右エッジ */}
      <polygon points="11,-46 23,-52 23,-49 11,-43" fill="#d97706" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 棟（頂上ライン） */}
      <line x1="-11" y1="-52" x2="11" y2="-46" stroke="#78350f" strokeWidth="1.5" />
    </g>
  </svg>
);

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

export const SvgPond = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="pond" thickness={4} /></svg>;

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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -18,-9 -18,-22 0,-13" fill="#92400e" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 18,-9 18,-22 0,-13" fill="#b45309" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-13 -20,-23 0,-33 20,-23" fill="#78350f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -13,-8.5 L -9,-6.5 L -9,-13.5 L -13,-15.5 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgBakery = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -18,-9 -18,-24 0,-15" fill="#ffedd5" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 18,-9 18,-24 0,-15" fill="#fed7aa" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 -20,-25 0,-35 20,-25" fill="#ea580c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 5,-8.5 L 13,-12.5 L 13,-19 L 5,-15 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgBurgerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -20,-10 -20,-25 0,-15" fill="#fef08a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 20,-10 20,-25 0,-15" fill="#fde047" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 -22,-26 0,-37 22,-26" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFamilyRestaurant = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -24,-12 -24,-28 0,-16" fill="#fef9c3" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 24,-12 24,-28 0,-16" fill="#fef08a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-16 -26,-29 0,-42 26,-29" fill="#f97316" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 7,-8.5 L 19,-14.5 L 19,-23 L 7,-17 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgConvenienceStore = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -20,-10 -20,-24 0,-14" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 20,-10 20,-24 0,-14" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-14 -22,-25 0,-32 22,-25" fill="#0ea5e9" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M 5,-6.5 L 17,-12.5 L 17,-21 L 5,-15 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgFlowerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -16,-8 -16,-22 0,-14" fill="#fce7f3" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 16,-8 16,-22 0,-14" fill="#fbcfe8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-14 -18,-23 0,-32 18,-23" fill="#db2777" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgCinema = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -26,-13 -26,-32 0,-19" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 26,-13 26,-32 0,-19" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-19 -28,-33 0,-47 28,-33" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgHotel = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      {/* メインビル */}
      <polygon points="0,0 -22,-11 -22,-45 0,-34" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 22,-11 22,-45 0,-34" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-34 -24,-46 0,-58 24,-46" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 窓（左面） */}
      {[0, 1, 2, 3].map(i => (
        <g key={`hl-${i}`} transform={`translate(-18, ${-16 - i * 7})`}>
          <polygon points="0,0 4,2 4,-2 0,-4" fill="#fef08a" stroke="#000" strokeWidth="0.5" opacity="0.9" />
        </g>
      ))}
      {/* 窓（右面） */}
      {[0, 1, 2, 3].map(i => (
        <g key={`hr-${i}`} transform={`translate(14, ${-14 - i * 7})`}>
          <polygon points="0,0 4,-2 4,-6 0,-4" fill="#fef08a" stroke="#000" strokeWidth="0.5" opacity="0.9" />
        </g>
      ))}
      {/* 入口（キャノピー） */}
      <polygon points="-6,0 6,-6 6,-3 -6,3" fill="#d97706" stroke="#000" strokeWidth="1" />
      {/* "HOTEL"サイン */}
      <polygon points="6,-18 18,-24 18,-20 6,-14" fill="#fbbf24" stroke="#000" strokeWidth="0.5" />
    </g>
  </svg>
);

// ==========================================
// 8. 公共施設 (Public Services)
// ==========================================
export const SvgHospital = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      {/* メイン棟 */}
      <polygon points="0,0 -24,-12 -24,-32 0,-20" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 24,-12 24,-32 0,-20" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 -26,-33 0,-46 26,-33" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 別棟（左側） */}
      <polygon points="-24,-12 -42,-21 -42,-35 -24,-26" fill="#f1f5f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-24,-12 -15,-16 -15,-30 -24,-26" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-24,-26 -42,-35 -28,-41 -15,-30" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 別棟の窓 */}
      {[0, 1].map(i => (
        <g key={`hw-${i}`} transform={`translate(${-38 + i * 8}, ${-24 + i * 4})`}>
          <polygon points="0,-2 4,0 4,-6 0,-8" fill="#93c5fd" stroke="#000" strokeWidth="0.5" />
        </g>
      ))}
      {/* メイン棟の窓（2階） */}
      {[0, 1, 2].map(i => (
        <g key={`mw-${i}`} transform={`translate(${4 + i * 7}, ${-14 - i * 3.5})`}>
          <polygon points="0,-2 4,-4 4,-9 0,-7" fill="#93c5fd" stroke="#000" strokeWidth="0.5" />
        </g>
      ))}
      {/* 赤十字マーク */}
      <g transform="translate(0, -36)">
        <polygon points="-3,0 3,0 3,-5 -3,-5" fill="#ef4444" stroke="#000" strokeWidth="1" />
        <polygon points="-5,-2 5,-2 5,-3 -5,-3" fill="#ef4444" stroke="#000" strokeWidth="1" />
      </g>
      {/* 救急車の入口 */}
      <polygon points="-3,0 3,-3 3,-8 -3,-5" fill="#1e293b" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgFireStation = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      {/* メイン建物 */}
      <polygon points="0,0 -22,-11 -22,-28 0,-17" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 22,-11 22,-28 0,-17" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-17 -24,-29 0,-41 24,-29" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 車庫（左側） */}
      <polygon points="-22,-11 -40,-20 -40,-32 -22,-23" fill="#991b1b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-22,-11 -15,-14 -15,-26 -22,-23" fill="#dc2626" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 車庫の入口（大きなシャッター） */}
      <polygon points="-37,-22 -24,-16 -24,-27 -37,-33" fill="#1e293b" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      {/* 望楼 */}
      <g transform="translate(-8, -34)">
        <polygon points="0,0 -4,-2 -4,-15 0,-13" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-15 0,-13" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="0" cy="-16" r="2" fill="#ef4444" filter="url(#glow-effect)" />
      </g>
      {/* 窓 */}
      <polygon points="5,-6 12,-9.5 12,-15 5,-11.5" fill="#93c5fd" stroke="#000" strokeWidth="0.5" />
    </g>
  </svg>
);

export const SvgPoliceBox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -12,-6 -12,-20 0,-14" fill="#1e3a8a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 12,-6 12,-20 0,-14" fill="#1d4ed8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-14 -14,-21 0,-28 14,-21" fill="#1e3a8a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="0" cy="-37" r="2" fill="#ef4444" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgPostOffice = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -20,-10 -20,-26 0,-16" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 20,-10 20,-26 0,-16" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-16 -22,-27 0,-38 22,-27" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgStation = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      {/* ホーム（プラットフォーム） */}
      <polygon points="0,10 -40,-10 0,-30 40,-10" fill="#94a3b8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      {/* 駅舎 */}
      <polygon points="0,-8 -22,-19 -22,-38 0,-27" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-8 22,-19 22,-38 0,-27" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-27 -24,-39 0,-51 24,-39" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 時計 */}
      <circle cx="0" cy="-42" r="3" fill="#f8fafc" stroke="#000" strokeWidth="0.8" />
      <line x1="0" y1="-42" x2="0" y2="-44" stroke="#000" strokeWidth="0.5" />
      <line x1="0" y1="-42" x2="1.5" y2="-41" stroke="#000" strokeWidth="0.5" />
      {/* 窓 */}
      <polygon points="5,-13 15,-18 15,-26 5,-21" fill="#93c5fd" stroke="#000" strokeWidth="0.5" />
      {/* 線路 */}
      <path d="M -38,0 L -25,7 L 25,-8 L 38,-15" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <path d="M -38,3 L -25,10 L 25,-5 L 38,-12" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      {/* 枕木 */}
      {[-2, -1, 0, 1, 2].map(i => (
        <line key={`sl-${i}`} x1={-5 + i * 12} y1={7 - i * 3.5} x2={-5 + i * 12 + 4} y2={4.5 - i * 3.5} stroke="#78716c" strokeWidth="2" />
      ))}
      {/* 改札入口 */}
      <polygon points="-4,-6 4,-10 4,-16 -4,-12" fill="#1e293b" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgAirport = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,5 -38,-14 0,-33 38,-14" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-5 -30,-20 -30,-36 0,-21" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-5 30,-20 30,-36 0,-21" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-21 -32,-37 0,-53 32,-37" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);


// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgOfficeBuilding = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -18,-9 -18,-42 0,-33" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 18,-9 18,-42 0,-33" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-33 -20,-43 0,-53 20,-43" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgTowerApartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,0 -14,-7 -14,-52 0,-45" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 14,-7 14,-52 0,-45" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-45 -16,-53 0,-61 16,-53" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="0" cy="-69" r="1.5" fill="#ef4444" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgTvTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-12,0 -4,-15 0,-30 4,-15 12,0" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 -4,-15 0,-30" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 4,-15 0,-30" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-30 -6,-38 6,-38" fill="#f8fafc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="0" cy="-80" r="2" fill="#ef4444" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgStadium = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <ellipse cx="0" cy="-8" rx="38" ry="19" fill="#cbd5e1" stroke="#000" strokeWidth="2" />
      <ellipse cx="0" cy="-10" rx="32" ry="16" fill="#4ade80" stroke="#000" strokeWidth="2" />
      <path d="M -38,-8 C -38,-22 -20,-30 0,-30 C 20,-30 38,-22 38,-8" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);

// ==========================================
// 10. 公園・レジャー (Parks & Leisure)
// ==========================================
export const SvgPark = ({ seed = 0 }) => {
  // 4×5マスの大きな公園 — seedに応じて遊具の配置パターンを変える
  const variant = seed % 4;

  // アイソメトリック座標ヘルパー (タイル単位 → SVG座標)
  // 4×5グリッドの中心を原点に、1タイル = 約12px単位
  const U = 11; // half-tile width unit
  const V = 5.5; // half-tile height unit
  const isoX = (gx, gy) => (gx - gy) * U;
  const isoY = (gx, gy) => (gx + gy) * V;

  // グリッド中心 (1.5, 2) を原点とした座標系
  const cx = 1.5, cy = 2;
  const toX = (gx, gy) => isoX(gx - cx, gy - cy);
  const toY = (gx, gy) => isoY(gx - cx, gy - cy);

  // 地面ダイヤモンドの4頂点
  const groundPts = `${toX(0,0)},${toY(0,0)} ${toX(4,0)},${toY(4,0)} ${toX(4,5)},${toY(4,5)} ${toX(0,5)},${toY(0,5)}`;
  // 内側の芝生
  const innerPts = `${toX(0.15,0.15)},${toY(0.15,0.15)} ${toX(3.85,0.15)},${toY(3.85,0.15)} ${toX(3.85,4.85)},${toY(3.85,4.85)} ${toX(0.15,4.85)},${toY(0.15,4.85)}`;

  // === 各遊具コンポーネント ===

  // 木 (大)
  const TreeBig = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <line x1="0" y1="1" x2="0" y2="-14" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="0" cy="-17" rx="5.5" ry="6.5" fill="#15803d" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="-2" cy="-19" rx="3" ry="3.5" fill="#22c55e" opacity="0.5" />
      </g>
    );
  };

  // 木 (小)
  const TreeSmall = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <line x1="0" y1="1" x2="0" y2="-10" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="0" cy="-12.5" rx="4" ry="5" fill="#16a34a" stroke="#000" strokeWidth="1" />
      </g>
    );
  };

  // 砂場 (sandbox) — 中央付近
  const Sandbox = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 枠（上面） */}
        <polygon points={`0,${-V*1.6} ${U*1.6},0 0,${V*1.6} ${-U*1.6},0`} fill="#d4d4d8" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 砂 */}
        <polygon points={`0,${-V*1.2} ${U*1.2},0 0,${V*1.2} ${-U*1.2},0`} fill="#fde68a" stroke="#a3a3a3" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 砂の質感 */}
        <circle cx="-2" cy="-1" r="0.8" fill="#fbbf24" opacity="0.6" />
        <circle cx="3" cy="0.5" r="0.6" fill="#fbbf24" opacity="0.5" />
      </g>
    );
  };

  // すべり台
  const Slide = ({ gx, gy, flip }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    const s = flip ? -1 : 1;
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 支柱 */}
        <line x1={s*(-2)} y1="1" x2={s*(-2)} y2="-14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={s*2} y1="1" x2={s*2} y2="-14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        {/* はしご横棒 */}
        <line x1={s*(-2)} y1="-4" x2={s*2} y2="-4" stroke="#475569" strokeWidth="1" />
        <line x1={s*(-2)} y1="-8" x2={s*2} y2="-8" stroke="#475569" strokeWidth="1" />
        <line x1={s*(-2)} y1="-12" x2={s*2} y2="-12" stroke="#475569" strokeWidth="1" />
        {/* 上部プラットフォーム */}
        <rect x={s*(-3)} y="-15" width="6" height="2" rx="0.5" fill="#94a3b8" stroke="#000" strokeWidth="1" />
        {/* スライド面（斜め） */}
        <line x1={s*3} y1="-14" x2={s*10} y2="0" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
        {/* スライドの縁 */}
        <line x1={s*2.5} y1="-14.5" x2={s*9.5} y2="-0.5" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      </g>
    );
  };

  // ベンチ
  const Bench = ({ gx, gy, dir }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    // dir: 0=SE facing, 1=SW facing
    return (
      <g transform={`translate(${x},${y})`}>
        {dir === 0 ? (
          <>
            {/* 脚 */}
            <line x1="-4" y1="0.5" x2="-4" y2="-3" stroke="#78350f" strokeWidth="1" />
            <line x1="4" y1="-3.5" x2="4" y2="-6.5" stroke="#78350f" strokeWidth="1" />
            {/* 座面 */}
            <polygon points="-5,-3 5,-7 6,-6 -4,0" fill="#92400e" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
            {/* 背もたれ */}
            <polygon points="5,-7 6,-6 6,-9 5,-10" fill="#78350f" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <line x1="-4" y1="-3.5" x2="-4" y2="-6.5" stroke="#78350f" strokeWidth="1" />
            <line x1="4" y1="0.5" x2="4" y2="-3" stroke="#78350f" strokeWidth="1" />
            <polygon points="-5,-7 5,-3 4,0 -6,-6" fill="#92400e" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
            <polygon points="-5,-7 -6,-6 -6,-9 -5,-10" fill="#78350f" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          </>
        )}
      </g>
    );
  };

  // うんてい/ジャングルジム (climbing frame)
  const ClimbingFrame = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 柱 */}
        <line x1="-6" y1="2" x2="-6" y2="-12" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="6" y1="-2" x2="6" y2="-16" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        {/* 横棒 */}
        <line x1="-6" y1="-12" x2="0" y2="-14" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="0" y1="-14" x2="6" y2="-16" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="-6" y1="-8" x2="0" y2="-10" stroke="#2563eb" strokeWidth="1" />
        <line x1="0" y1="-10" x2="6" y2="-12" stroke="#2563eb" strokeWidth="1" />
        <line x1="-6" y1="-4" x2="0" y2="-6" stroke="#2563eb" strokeWidth="1" />
        <line x1="0" y1="-6" x2="6" y2="-8" stroke="#2563eb" strokeWidth="1" />
      </g>
    );
  };

  // 水飲み場/噴水
  const Fountain = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="4" ry="2" fill="#94a3b8" stroke="#000" strokeWidth="1" />
        <rect x="-1" y="-5" width="2" height="5" fill="#94a3b8" stroke="#000" strokeWidth="0.8" />
        <ellipse cx="0" cy="-5" rx="2" ry="1" fill="#7dd3fc" stroke="#64748b" strokeWidth="0.6" />
        {/* 水しぶき */}
        <line x1="0" y1="-6" x2="0" y2="-8" stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="-1" y1="-6.5" x2="-1.5" y2="-7.5" stroke="#7dd3fc" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="1" y1="-6.5" x2="1.5" y2="-7.5" stroke="#7dd3fc" strokeWidth="0.6" strokeLinecap="round" />
      </g>
    );
  };

  // ブランコ
  const Swing = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* A型フレーム */}
        <line x1="-5" y1="2" x2="-3" y2="-13" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="5" y1="-2" x2="3" y2="-15" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        {/* 上部バー */}
        <line x1="-3" y1="-13" x2="3" y2="-15" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        {/* チェーン */}
        <line x1="-1" y1="-13.5" x2="-2" y2="-4" stroke="#000" strokeWidth="0.6" />
        <line x1="1" y1="-14" x2="0" y2="-4.5" stroke="#000" strokeWidth="0.6" />
        {/* 座面 */}
        <rect x="-3" y="-5" width="4" height="1.5" rx="0.5" fill="#1e293b" stroke="#000" strokeWidth="0.6" />
      </g>
    );
  };

  // 柵（フェンス） — 辺に沿って描画
  const FenceSegment = ({ x1, y1, x2, y2 }) => (
    <g>
      <line x1={x1} y1={y1-2} x2={x2} y2={y2-2} stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={x1} y1={y1-4} x2={x2} y2={y2-4} stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      {/* 柵の支柱 */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const px = x1 + (x2-x1)*t;
        const py = y1 + (y2-y1)*t;
        return <line key={i} x1={px} y1={py} x2={px} y2={py-5} stroke="#92400e" strokeWidth="1" strokeLinecap="round" />;
      })}
    </g>
  );

  // 遊具配置パターン（seedで変化）
  const layouts = [
    // パターン0: 定番公園（砂場中央、すべり台、ベンチ、木多め）
    { sandbox: [2, 2.5], slide: [3, 1.2, false], bench1: [0.5, 1.5, 0], bench2: [0.5, 3, 1],
      trees: [[0.3,0.3], [3.7,0.3], [3.7,4.7], [0.3,4.7], [2,0.2]],
      extra: 'climbing', climbPos: [1, 1.2], fountain: null, swing: null },
    // パターン1: 噴水公園（噴水中央、ベンチ多め、木でリラックス空間）
    { sandbox: [3, 3.5], slide: null, bench1: [1, 1, 0], bench2: [1, 3.5, 1],
      trees: [[0.3,0.3], [3.7,0.3], [0.3,4.7], [3.7,4.7], [0.3,2.5], [3.7,2.5]],
      extra: 'fountain', climbPos: null, fountain: [2, 2], swing: null },
    // パターン2: アスレチック公園（ジャングルジム＋ブランコ＋すべり台）
    { sandbox: [1, 3.5], slide: [3, 2, true], bench1: [0.5, 1, 0], bench2: [3.5, 4, 1],
      trees: [[0.3,0.3], [3.7,0.3], [3.7,4.7], [0.3,4.7]],
      extra: 'climbing', climbPos: [1.5, 1.5], fountain: null, swing: [2.8, 3.8] },
    // パターン3: 自然公園（木たくさん、ブランコ、ベンチ）
    { sandbox: null, slide: null, bench1: [1.5, 1, 0], bench2: [1.5, 3.5, 1],
      trees: [[0.3,0.3], [3.7,0.3], [0.3,4.7], [3.7,4.7], [2,0.3], [0.3,2.5], [3.7,2.5], [2,4.8]],
      extra: 'fountain', climbPos: null, fountain: [2, 2.5], swing: [3, 1.5] },
  ];
  const L = layouts[variant];

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 95) scale(1.05)">
        {/* === 地面 === */}
        <polygon points={groundPts} fill="#4ade80" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={innerPts} fill="#86efac" stroke="none" />

        {/* === 小道 (十字) === */}
        <line x1={toX(2,0.2)} y1={toY(2,0.2)} x2={toX(2,4.8)} y2={toY(2,4.8)} stroke="#d4d4d8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        <line x1={toX(0.2,2.5)} y1={toY(0.2,2.5)} x2={toX(3.8,2.5)} y2={toY(3.8,2.5)} stroke="#d4d4d8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />

        {/* === 柵（手前2辺のみ — SE辺とSW辺） === */}
        <FenceSegment x1={toX(4,0)} y1={toY(4,0)} x2={toX(4,5)} y2={toY(4,5)} />
        <FenceSegment x1={toX(0,5)} y1={toY(0,5)} x2={toX(4,5)} y2={toY(4,5)} />

        {/* === 砂場 === */}
        {L.sandbox && <Sandbox gx={L.sandbox[0]} gy={L.sandbox[1]} />}

        {/* === すべり台 === */}
        {L.slide && <Slide gx={L.slide[0]} gy={L.slide[1]} flip={L.slide[2]} />}

        {/* === ベンチ === */}
        <Bench gx={L.bench1[0]} gy={L.bench1[1]} dir={L.bench1[2]} />
        <Bench gx={L.bench2[0]} gy={L.bench2[1]} dir={L.bench2[2]} />

        {/* === うんてい === */}
        {L.extra === 'climbing' && L.climbPos && <ClimbingFrame gx={L.climbPos[0]} gy={L.climbPos[1]} />}

        {/* === 噴水 === */}
        {L.fountain && <Fountain gx={L.fountain[0]} gy={L.fountain[1]} />}

        {/* === ブランコ === */}
        {L.swing && <Swing gx={L.swing[0]} gy={L.swing[1]} />}

        {/* === 木 (奥から描画するためソート) === */}
        {L.trees
          .slice()
          .sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))
          .map(([gx, gy], i) => {
            const big = (i + seed) % 3 !== 0;
            return big
              ? <TreeBig key={`t${i}`} gx={gx} gy={gy} />
              : <TreeSmall key={`t${i}`} gx={gx} gy={gy} />;
          })}
      </g>
    </svg>
  );
};

export const SvgPlayground = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,2 -22,-9 0,-20 22,-9" fill="#fde68a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-8, -12)">
        <polygon points="0,0 -5,-2.5 -5,-14 0,-11.5" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 5,-2.5 5,-14 0,-11.5" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <path d="M 0,-16.5 Q -8,-10 -12,-4" stroke="#000" strokeWidth="2" fill="none" />
      </g>
    </g>
  </svg>
);

export const SvgPool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,2 -26,-11 0,-24 26,-11" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-2 -20,-12 0,-22 20,-12" fill="#7dd3fc" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFerrisWheel = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-10,0 0,-40 -2,-40" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="10,0 0,-40 2,-40" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="0" cy="-40" r="18" fill="none" stroke="#000" strokeWidth="2" />
      <circle cx="0" cy="-40" r="3" fill="#64748b" stroke="#000" strokeWidth="1.5" />
    </g>
  </svg>
);

export const SvgAmusementPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,5 -38,-14 0,-33 38,-14" fill="#86efac" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-18, -18)">
        <circle cx="0" cy="-30" r="12" fill="none" stroke="#000" strokeWidth="2" />
        <circle cx="0" cy="-30" r="2" fill="#64748b" stroke="#000" strokeWidth="1" />
      </g>
      <g transform="translate(15, -10)">
        <polygon points="0,-4 -14,-11 0,-18 14,-11" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="0,0 -14,-7 -14,-11 0,-4" fill="#fde047" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

// ==========================================
// 11. 乗り物 (Vehicles)
// ==========================================
export const SvgCar = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-12,2 -8,-2 8,-10 12,-6 12,2 -12,8" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-12,2 -8,-2 8,-10 12,-6" fill="#ef4444" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -7,-2 L -3,-4 L 3,-7 L 7,-9 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgBus = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-16,4 -14,-4 14,-18 16,-10 16,4 -16,10" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-16,4 -14,-4 14,-18 16,-10" fill="#22c55e" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -9,-6 L 1,-11 L 5,-13 L -13,-4 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgBicycle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <circle cx="-8" cy="2" r="3.5" fill="none" stroke="#000" strokeWidth="1.5" />
      <circle cx="8" cy="-2" r="3.5" fill="none" stroke="#000" strokeWidth="1.5" />
      <path d="M -8,2 L 0,-6 L 8,-2" fill="none" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgShipVehicle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <path d="M -18,2 C -15,-2 -5,-8 10,-6 C 18,-4 20,0 18,4 C 10,6 -10,6 -18,2 Z" fill="#b45309" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -10,-18 L 20,-6" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgAirplane = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,-15 -25,0 -25,-5 0,-20" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="0,-15 25,0 25,-5 0,-20" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="0,-20 -6,-12 0,5 6,-12" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgFireTruck = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="-16,4 -14,-4 14,-18 16,-10 16,4 -16,10" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-16,4 -14,-4 14,-18 16,-10" fill="#ef4444" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M -10,2 L 10,-8 L 12,-20 L 14,-22" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

// ==========================================
// 12. ストリートファニチャー (Street Furniture)
// ==========================================
export const SvgBench = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-10,0 10,-6 10,-4 -10,2" fill="#d97706" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-10,-2 10,-8 10,-6 -10,0" fill="#f59e0b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgMailbox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -4,-2 -4,-14 0,-12" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 4,-2 4,-14 0,-12" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-12 -4,-14 0,-16 4,-14" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgPhoneBooth = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -6,-3 -6,-18 0,-15" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 6,-3 6,-18 0,-15" fill="#dc2626" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 -6,-18 0,-21 6,-18" fill="#ef4444" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -2,-5 L -4,-6 L -4,-14 L -2,-13 Z" fill="#93c5fd" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgStreetLight = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-1,-3 1,-4 1,-30 -1,-29" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="2" cy="-28" r="3" fill="#fef08a" stroke="#000" strokeWidth="1.5" />
    </g>
  </svg>
);

export const SvgBusStop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-1,0 1,-1 1,-22 -1,-21" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,-18 8,-24 8,-16 -8,-10" fill="#3b82f6" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgVendingMachine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -8,-4 -8,-18 0,-14" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 8,-4 8,-18 0,-14" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-14 -8,-18 0,-22 8,-18" fill="#1e293b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <rect x="-6" y="-12" width="4" height="6" fill="#ef4444" stroke="#000" strokeWidth="1" />
      <rect x="2" y="-12" width="4" height="6" fill="#3b82f6" stroke="#000" strokeWidth="1" />
    </g>
  </svg>
);

export const SvgTrashCan = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -5,-2.5 -5,-10 0,-7.5" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 5,-2.5 5,-10 0,-7.5" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-7.5 -5,-10 0,-12.5 5,-10" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

