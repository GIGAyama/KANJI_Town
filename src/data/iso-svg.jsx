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


export const SvgHouse1 = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* Base/Walls */}
      <polygon points="0,-4 -20,-14 -20,-30 -10,-42 0,-20" fill="#fdf8f6" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-4 20,-14 20,-30 0,-20" fill="#e7e5e4" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Roof */}
      <polygon points="3,-17 24,-27.5 12,-48 -10,-41" fill="#ef4444" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="3,-17 -10,-41 -13,-39 -1,-15" fill="#b91c1c" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="3,-17 24,-27.5 24,-25.5 3,-15" fill="#b91c1c" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />

      {/* Door */}
      <polygon points="6,-7 14,-11 14,-25 6,-21" fill="#d97706" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="-16" r="1" fill="#000000" />

      {/* Window */}
      <polygon points="-14,-11 -6,-7 -6,-17 -14,-21" fill="#93c5fd" stroke="#000000" strokeWidth="2" strokeLinejoin="round" />
      <line x1="-10" y1="-9" x2="-10" y2="-19" stroke="#000000" strokeWidth="1.5" />
      <line x1="-14" y1="-16" x2="-6" y2="-12" stroke="#000000" strokeWidth="1.5" />

      {/* Chimney */}
      <g transform="translate(6, -38)">
        <polygon points="0,0 5,-2.5 5,-12 0,-9.5" fill="#a8a29e" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 -5,-2.5 -5,-12 0,-9.5" fill="#78716c" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-9.5 -5,-12 0,-14.5 5,-12" fill="#d6d3d1" stroke="#000000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgHouse2 = () => {
  const ptX = (i, j) => (i - 1.0) * 26 - (j - 0.5) * 26;
  const ptY = (i, j, k) => (i - 1.0) * 13 + (j - 0.5) * 13 - k * 22;
  const pt = (i, j, k) => `${ptX(i,j).toFixed(1)},${ptY(i,j,k).toFixed(1)}`;

  const wallSW = "#f5f5f4";
  const wallSE = "#e7e5e4";
  const wallBaseSW = "#a8a29e";
  const wallBaseSE = "#78716c";
  const roofSW = "#ef4444";
  const roofSE = "#dc2626";
  const roofNW = "#b91c1c";
  const roofNE = "#b91c1c";

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
        <polygon points={`${pt(i1, j2, kBase)} ${pt(iMid, j2, kPeak)} ${pt(iMid, j1, kPeak)} ${pt(i1, j1, kBase)}`} fill={roofNW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
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
        <polygon points={`${pt(i1, j1, kBase)} ${pt(i2, j1, kBase)} ${pt(i2, jMid, kPeak)} ${pt(i1, jMid, kPeak)}`} fill={roofNE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
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
export const SvgHouse3 = () => {
  const ptX = (i, j) => (i - 1.5) * 24 - (j - 1) * 24;
  const ptY = (i, j, k) => (i - 1.5) * 12 + (j - 1) * 12 - k * 20;
  const pt = (i, j, k) => `${ptX(i,j).toFixed(1)},${ptY(i,j,k).toFixed(1)}`;

  const wallSW = "#b6b0a7";
  const wallSE = "#9c968f";
  const wallBaseSW = "#788796";
  const wallBaseSE = "#5e6a75";
  const roofSW = "#8394a1";
  const roofSE = "#70818c";
  const roofNW = "#5b6b75";
  const roofNE = "#5b6b75";

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
        <polygon points={`${pt(i1, j2, kBase)} ${pt(iMid, j2, kPeak)} ${pt(iMid, j1, kPeak)} ${pt(i1, j1, kBase)}`} fill={roofNW} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
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
        <polygon points={`${pt(i1, j1, kBase)} ${pt(i2, j1, kBase)} ${pt(i2, jMid, kPeak)} ${pt(i1, jMid, kPeak)}`} fill={roofNE} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round"/>
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

export const SvgSchool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* 左棟（体育館風） */}
      <polygon points="-35,-14 -52,-22 -52,-36 -35,-28" fill="#f1f5f9" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-35,-14 -20,-22 -20,-36 -35,-28" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-35,-28 -52,-36 -36,-44 -20,-36" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 右棟（教室棟） */}
      <polygon points="-8,-4 -32,-16 -32,-32 -8,-20" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,-4 32,-24 32,-40 -8,-20" fill="#e2e8f0" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 左壁の窓 */}
      {[...Array(3)].map((_, i) => (
        <g key={`sw1-${i}`} transform={`translate(${-28 + i * 8}, ${-16 + i * 4})`}>
          <polygon points="0,-3 4,-1 4,-7 0,-9" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        </g>
      ))}
      {/* 右壁の窓 */}
      {[...Array(5)].map((_, i) => (
        <g key={`sw2-${i}`} transform={`translate(${-2 + i * 7}, ${-21 - i * 3.5})`}>
          <polygon points="0,-3 4,-5 4,-11 0,-9" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        </g>
      ))}
      {/* 時計塔（中央） */}
      <polygon points="-8,2 -16,-2 -16,-38 -8,-34" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,2 8,-6 8,-42 -8,-34" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,-34 8,-42 0,-55 -16,-47" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 時計 */}
      <circle cx="-4" cy="-38" r="3" fill="#f8fafc" stroke="#000" strokeWidth="0.8" />
      <line x1="-4" y1="-38" x2="-4" y2="-40" stroke="#000" strokeWidth="0.5" />
      <line x1="-4" y1="-38" x2="-2.5" y2="-37.5" stroke="#000" strokeWidth="0.5" />
      {/* 屋根 */}
      <polygon points="-8,-20 -32,-32 -20,-44 4,-32" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-8,-20 32,-40 20,-52 -20,-32" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 入口 */}
      <polygon points="-6,-1 -2,-3 -2,-10 -6,-8" fill="#78350f" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="-2,-3 2,-5 2,-12 -2,-10" fill="#451a03" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      {/* グラウンド */}
      <polygon points="-50,-10 -35,-3 -15,-13 -30,-20" fill="#92400e" stroke="#000" strokeWidth="0.5" opacity="0.3" />
    </g>
  </svg>
);

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
export const SvgWarehouse = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,-3 -24,-15 -24,-35 0,-23" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-23 -24,-35 -12,-41" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-3 24,-15 24,-35 0,-23" fill="#cbd5e1" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="4,-7 16,-13 16,-25 4,-19" fill="#334155" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="5,-8 15,-13 15,-24 5,-19" fill="#1e293b" />
      <path d="M 5,-11 L 15,-16 M 5,-14 L 15,-19 M 5,-17 L 15,-22" stroke="#475569" strokeWidth="1" />
      <polygon points="-2,-24 26,-38 14,-44 -14,-30" fill="#71717a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-2,-24 26,-38 26,-36 -2,-22" fill="#d4d4d8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-2,-24 -26,-36 -26,-34 -2,-22" fill="#a1a1aa" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-10, -5)">
        <polygon points="0,0 -4,-2 -4,-8 0,-6" fill="#b45309" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-8 0,-6" fill="#d97706" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgGrandWarehouse = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -32,-16 -32,-36 0,-20" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 32,-16 32,-36 0,-20" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {[...Array(3)].map((_, i) => (
        <g key={`gw-${i}`} transform={`translate(${12 + i * 8}, ${-16 - i * 4})`}>
          <path d="M -2,0 L -2,-6 Q 0,-9 2,-6 L 2,0 Z" fill="#93c5fd" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      ))}
      <polygon points="0,-20 -34,-37 0,-54 34,-37" fill="#52525b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 -34,-37 -34,-35 0,-18" fill="#27272a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-20 34,-37 34,-35 0,-18" fill="#71717a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

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

export const SvgPort = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-35,-2 -15,-12 5,-2 -15,8" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="-35,-2 -15,8 -15,12 -35,2" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 -10,-10 15,2.5 25,-2.5" fill="#78350f" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-15 15,2.5 15,5 0,-12" fill="#451a03" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-10, -5)">
        <polygon points="0,0 -2.5,-1 -2.5,-20 0,-18" fill="#ca8a04" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 2.5,-1 2.5,-20 0,-18" fill="#facc15" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,-20 15,-28 15,-26 0,-18" fill="#facc15" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

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

export const SvgWatermill = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="0,0 -16,-8 -16,-20 0,-12" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,0 16,-8 16,-20 0,-12" fill="#94a3b8" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <g transform="translate(-16, -8)">
        <ellipse cx="-2" cy="1" rx="6" ry="12" fill="#78350f" stroke="#000" strokeWidth="2" />
        <line x1="-2" y1="-11" x2="-2" y2="13" stroke="#000" strokeWidth="1.5" />
        <line x1="-8" y1="1" x2="4" y2="1" stroke="#000" strokeWidth="1.5" />
      </g>
      <polygon points="0,-14 -16,-22 -16,-34 0,-26" fill="#fdf8f6" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-14 16,-22 16,-34 0,-26" fill="#f8fafc" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="2,-26 18,-34 8,-44 -10,-38" fill="#a16207" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
    </g>
  </svg>
);

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
export const SvgPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.0)">
      <polygon points="0,2 -28,-12 0,-26 28,-12" fill="#4ade80" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-2 -20,-12 0,-22 20,-12" fill="#86efac" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(-16, -16)">
        <path d="M 0,2 L 0,-15" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-14" r="5" fill="#15803d" stroke="#000" strokeWidth="1.5" />
      </g>
      <g transform="translate(16, -16)">
        <path d="M 0,2 L 0,-12" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-11" r="4" fill="#16a34a" stroke="#000" strokeWidth="1.5" />
      </g>
    </g>
  </svg>
);

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

