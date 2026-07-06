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

// ==========================================
// 共有アイソメトリック描画ヘルパー
// 100×100 の論理グリッドをひし形（幅88・高さ44）にマッピングする。
// SvgWarehouse / SvgSchool と同じ座標系で、
// translate(50, 100) scale(2.0〜2.4) と組み合わせて使う。
// ==========================================
const isoPt = (x, y, z = 0) => [(x - y) * 0.44, -44 + (x + y) * 0.22 - z];
const iso3 = (x, y, z = 0) => {
  const [px, py] = isoPt(x, y, z);
  return `${px.toFixed(2)},${py.toFixed(2)}`;
};

/** 直方体（左面=南西・右面=南東・天面） */
const IsoCube = ({ x, y, z = 0, w, d, h, top, left, right, stroke = '#1e293b', sw = 0.8 }) => (
  <g>
    <polygon points={`${iso3(x, y + d, z)} ${iso3(x + w, y + d, z)} ${iso3(x + w, y + d, z + h)} ${iso3(x, y + d, z + h)}`} fill={left} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    <polygon points={`${iso3(x + w, y, z)} ${iso3(x + w, y + d, z)} ${iso3(x + w, y + d, z + h)} ${iso3(x + w, y, z + h)}`} fill={right} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    <polygon points={`${iso3(x, y, z + h)} ${iso3(x + w, y, z + h)} ${iso3(x + w, y + d, z + h)} ${iso3(x, y + d, z + h)}`} fill={top} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
  </g>
);

/** 南西向きの壁面パネル（窓・ドア・看板用） */
const FaceSW = ({ x1, x2, y, z1, z2, fill, stroke = '#1e293b', sw = 0.8 }) => (
  <polygon points={`${iso3(x1, y, z1)} ${iso3(x2, y, z1)} ${iso3(x2, y, z2)} ${iso3(x1, y, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/** 南東向きの壁面パネル */
const FaceSE = ({ x, y1, y2, z1, z2, fill, stroke = '#1e293b', sw = 0.8 }) => (
  <polygon points={`${iso3(x, y1, z1)} ${iso3(x, y2, z1)} ${iso3(x, y2, z2)} ${iso3(x, y1, z2)}`} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
);

/** 格子入りの窓（南西向き） */
const WinSW = ({ x1, x2, y, z1, z2 }) => (
  <g>
    <FaceSW x1={x1} x2={x2} y={y} z1={z1} z2={z2} fill="#f8fafc" sw={1} />
    <FaceSW x1={x1 + 1} x2={x2 - 1} y={y + 0.1} z1={z1 + 1} z2={z2 - 1} fill="#7dd3fc" sw={0.5} />
    <line x1={isoPt((x1 + x2) / 2, y, z1)[0]} y1={isoPt((x1 + x2) / 2, y, z1)[1]} x2={isoPt((x1 + x2) / 2, y, z2)[0]} y2={isoPt((x1 + x2) / 2, y, z2)[1]} stroke="#1e293b" strokeWidth="0.6" />
  </g>
);

/** 格子入りの窓（南東向き） */
const WinSE = ({ x, y1, y2, z1, z2 }) => (
  <g>
    <FaceSE x={x} y1={y1} y2={y2} z1={z1} z2={z2} fill="#f8fafc" sw={1} />
    <FaceSE x={x + 0.1} y1={y1 + 1} y2={y2 - 1} z1={z1 + 1} z2={z2 - 1} fill="#7dd3fc" sw={0.5} />
    <line x1={isoPt(x, (y1 + y2) / 2, z1)[0]} y1={isoPt(x, (y1 + y2) / 2, z1)[1]} x2={isoPt(x, (y1 + y2) / 2, z2)[0]} y2={isoPt(x, (y1 + y2) / 2, z2)[1]} stroke="#1e293b" strokeWidth="0.6" />
  </g>
);

/** 縞模様のひさし（南西面から手前へ張り出す） */
const AwningSW = ({ x1, x2, y, z, c1 = '#ef4444', c2 = '#f8fafc', depth = 9, drop = 4, stripes = 6 }) => {
  const segs = [];
  for (let i = 0; i < stripes; i++) {
    const a = x1 + ((x2 - x1) * i) / stripes;
    const b = x1 + ((x2 - x1) * (i + 1)) / stripes;
    segs.push(
      <polygon key={i} points={`${iso3(a, y, z)} ${iso3(b, y, z)} ${iso3(b, y + depth, z - drop)} ${iso3(a, y + depth, z - drop)}`}
        fill={i % 2 === 0 ? c1 : c2} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    );
  }
  return (
    <g>
      {segs}
      <polygon points={`${iso3(x1, y + depth, z - drop)} ${iso3(x2, y + depth, z - drop)} ${iso3(x2, y + depth, z - drop - 2.5)} ${iso3(x1, y + depth, z - drop - 2.5)}`} fill={darken(c1, 40)} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    </g>
  );
};

/** 接地影 */
const IsoShadow = ({ cx = 0, cy = -21, rx = 40, ry = 19, o = 0.16 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#020617" opacity={o} />
);

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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 水面 */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="1" strokeLinejoin="round" />
      {[[16, 60], [80, 30], [24, 24], [76, 78]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 0)[0]},${isoPt(wx, wy, 0)[1]} q 4,-1.6 8,0`} fill="none" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
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

/** 屋台1台（縞テント＋商品台） */
const MarketStall = ({ gx, gy, c1, c2, goods }) => {
  const [px, py] = isoPt(gx, gy, 0);
  return (
    <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
      {/* 台（カウンター） */}
      <polygon points="-11,-2.5 0,3 11,-2.5 0,-8" fill="#d97706" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="-11,-2.5 0,3 0,7 -11,1.5" fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="11,-2.5 0,3 0,7 11,1.5" fill="#b45309" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 商品（果物かご） */}
      {goods.map(([ox, oy, c], i) => (
        <circle key={i} cx={ox} cy={oy} r="1.8" fill={c} stroke="#1e293b" strokeWidth="0.6" />
      ))}
      {/* 支柱 */}
      <line x1="-11" y1="-2.5" x2="-11" y2="-16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11" y1="-2.5" x2="11" y2="-16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" />
      {/* 縞テント屋根 */}
      {[0, 1, 2, 3].map(i => (
        <polygon key={i} points={`${-13 + i * 6.5},-15 ${-6.5 + i * 6.5},-15 ${-4.5 + i * 6.5},-20.5 ${-11 + i * 6.5},-20.5`}
          fill={i % 2 === 0 ? c1 : c2} stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      {/* テントの波形の縁 */}
      <path d="M -13,-15 Q -11.4,-12.8 -9.8,-15 Q -8.2,-12.8 -6.6,-15 Q -5,-12.8 -3.4,-15 Q -1.8,-12.8 -0.2,-15 Q 1.4,-12.8 3,-15 Q 4.6,-12.8 6.2,-15 Q 7.8,-12.8 9.4,-15 Q 11,-12.8 12.6,-15 L 13,-15 L 13,-16 L -13,-16 Z" fill={c1} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
    </g>
  );
};

export const SvgMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 石畳の広場 */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <g stroke="#a8a29e" strokeWidth="0.6" opacity="0.7">
        <line x1={isoPt(4, 35, 0)[0]} y1={isoPt(4, 35, 0)[1]} x2={isoPt(96, 35, 0)[0]} y2={isoPt(96, 35, 0)[1]} />
        <line x1={isoPt(4, 66, 0)[0]} y1={isoPt(4, 66, 0)[1]} x2={isoPt(96, 66, 0)[0]} y2={isoPt(96, 66, 0)[1]} />
        <line x1={isoPt(35, 4, 0)[0]} y1={isoPt(35, 4, 0)[1]} x2={isoPt(35, 96, 0)[0]} y2={isoPt(35, 96, 0)[1]} />
        <line x1={isoPt(66, 4, 0)[0]} y1={isoPt(66, 4, 0)[1]} x2={isoPt(66, 96, 0)[0]} y2={isoPt(66, 96, 0)[1]} />
      </g>
      {/* 屋台3台（奥から手前へ） */}
      <MarketStall gx={30} gy={26} c1="#ef4444" c2="#f8fafc" goods={[[-5, -4.5, '#ef4444'], [-1.5, -3.5, '#f97316'], [2, -4.8, '#ef4444']]} />
      <MarketStall gx={72} gy={40} c1="#3b82f6" c2="#f8fafc" goods={[[-4, -4.5, '#facc15'], [0, -3.5, '#a3e635'], [4, -5, '#facc15']]} />
      <MarketStall gx={42} gy={70} c1="#22c55e" c2="#fef9c3" goods={[[-5, -4.5, '#f97316'], [-1, -3.6, '#ef4444'], [3, -4.6, '#a855f7']]} />
      {/* 木箱 */}
      <IsoCube x={80} y={74} w={11} d={11} h={7} top="#fcd34d" left="#fbbf24" right="#f59e0b" sw={0.8} />
      <IsoCube x={83} y={64} w={9} d={9} z={0} h={6} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={0.8} />
      {/* のぼり旗 */}
      <g transform={`translate(${isoPt(12, 84, 0)[0].toFixed(1)}, ${isoPt(12, 84, 0)[1].toFixed(1)})`}>
        <line x1="0" y1="1" x2="0" y2="-21" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="0.4" y="-20" width="5.4" height="13" rx="0.6" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="3.1" cy="-15.5" r="1.7" fill="#fef9c3" />
      </g>
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

export const SvgGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 芝生ベース */}
      <IsoCube x={4} y={4} w={92} d={92} h={2.5} top="#4ade80" left="#22c55e" right="#16a34a" sw={1} />
      {/* 小道（斜めのS字） */}
      <path d={`M ${iso3(14, 88, 2.6)} C ${iso3(40, 70, 2.6)} ${iso3(36, 40, 2.6)} ${iso3(60, 30, 2.6)} C ${iso3(74, 24, 2.6)} ${iso3(82, 18, 2.6)} ${iso3(88, 12, 2.6)}`}
        fill="none" stroke="#e7e5e4" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
      <path d={`M ${iso3(14, 88, 2.6)} C ${iso3(40, 70, 2.6)} ${iso3(36, 40, 2.6)} ${iso3(60, 30, 2.6)}`}
        fill="none" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="2,3" opacity="0.9" />
      {/* 花壇（左） */}
      <g>
        <polygon points={`${iso3(14, 14, 2.6)} ${iso3(44, 14, 2.6)} ${iso3(44, 44, 2.6)} ${iso3(14, 44, 2.6)}`} fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(17, 17, 2.7)} ${iso3(41, 17, 2.7)} ${iso3(41, 41, 2.7)} ${iso3(17, 41, 2.7)}`} fill="#78350f" />
        {[[22, 22, '#f472b6'], [30, 20, '#facc15'], [36, 26, '#f472b6'], [24, 32, '#fb923c'], [34, 36, '#f8fafc']].map(([fx, fy, c], i) => (
          <g key={i} transform={`translate(${isoPt(fx, fy, 3)[0].toFixed(1)}, ${isoPt(fx, fy, 3)[1].toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-3" stroke="#16a34a" strokeWidth="0.9" />
            <circle cx="0" cy="-4.2" r="1.9" fill={c} stroke="#1e293b" strokeWidth="0.6" />
            <circle cx="0" cy="-4.2" r="0.7" fill="#fef08a" />
          </g>
        ))}
      </g>
      {/* 花壇（右手前・丸型） */}
      <g>
        <ellipse cx={isoPt(70, 66, 2.7)[0]} cy={isoPt(70, 66, 2.7)[1]} rx="12.5" ry="6" fill="#92400e" stroke="#1e293b" strokeWidth="1" />
        <ellipse cx={isoPt(70, 66, 2.9)[0]} cy={isoPt(70, 66, 2.9)[1]} rx="9.5" ry="4.4" fill="#78350f" />
        {[[66, 62, '#a855f7'], [74, 64, '#ef4444'], [69, 70, '#facc15']].map(([fx, fy, c], i) => (
          <g key={i} transform={`translate(${isoPt(fx, fy, 3.2)[0].toFixed(1)}, ${isoPt(fx, fy, 3.2)[1].toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-3.4" stroke="#16a34a" strokeWidth="0.9" />
            <circle cx="0" cy="-4.6" r="2.1" fill={c} stroke="#1e293b" strokeWidth="0.6" />
            <circle cx="0" cy="-4.6" r="0.8" fill="#fef9c3" />
          </g>
        ))}
      </g>
      {/* 刈り込みの丸い低木 */}
      {[[86, 42], [52, 82]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 2.6)[0].toFixed(1)}, ${isoPt(bx, by, 2.6)[1].toFixed(1)})`}>
          <ellipse cx="0" cy="0.6" rx="5" ry="2.2" fill="#020617" opacity="0.15" />
          <circle cx="0" cy="-3.6" r="4.6" fill="#16a34a" stroke="#1e293b" strokeWidth="1" />
          <path d="M -3.4,-5.4 A 4.6,4.6 0 0 1 0,-8.2" fill="none" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      {/* 蝶 */}
      <g transform={`translate(${isoPt(48, 48, 12)[0].toFixed(1)}, ${isoPt(48, 48, 12)[1].toFixed(1)})`}>
        <path d="M 0,0 Q -3,-2.6 -1,-4 Q 0.4,-4.4 0,-1 Q 1.6,-4.6 3.4,-3 Q 3.4,-0.8 0,0 Z" fill="#facc15" stroke="#1e293b" strokeWidth="0.6" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgSmithy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={40} />
      {/* 土の敷地 */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#a8a29e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 石造りの工房 */}
      <IsoCube x={18} y={14} w={62} d={58} h={22} top="#78716c" left="#a8a29e" right="#78716c" sw={1.1} />
      {/* 石のテクスチャ */}
      <g stroke="#57534e" strokeWidth="0.7" opacity="0.8">
        <line x1={isoPt(24, 72.1, 6)[0]} y1={isoPt(24, 72.1, 6)[1]} x2={isoPt(40, 72.1, 6)[0]} y2={isoPt(40, 72.1, 6)[1]} />
        <line x1={isoPt(60, 72.1, 9)[0]} y1={isoPt(60, 72.1, 9)[1]} x2={isoPt(74, 72.1, 9)[0]} y2={isoPt(74, 72.1, 9)[1]} />
        <line x1={isoPt(30, 72.1, 15)[0]} y1={isoPt(30, 72.1, 15)[1]} x2={isoPt(44, 72.1, 15)[0]} y2={isoPt(44, 72.1, 15)[1]} />
      </g>
      {/* 炉の開口（オレンジに光る） */}
      <FaceSW x1={26} x2={48} y={72.2} z1={0} z2={14} fill="#1c1917" sw={1.1} />
      <FaceSW x1={28.5} x2={45.5} y={72.4} z1={0} z2={11.5} fill="#7c2d12" sw={0.6} />
      <g transform={`translate(${isoPt(37, 72.5, 5)[0].toFixed(1)}, ${isoPt(37, 72.5, 5)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="4.6" fill="#f97316" filter="url(#glow-effect)" />
        <circle cx="0" cy="0.6" r="2.4" fill="#fde047" />
      </g>
      {/* 窓（南東面） */}
      <WinSE x={80.2} y1={28} y2={44} z1={8} z2={17} />
      {/* 傾斜屋根（片流れの板葺き） */}
      <polygon points={`${iso3(14, 10, 22)} ${iso3(84, 10, 22)} ${iso3(84, 78, 28)} ${iso3(14, 78, 28)}`} fill="#57534e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(14, 78, 28)} ${iso3(84, 78, 28)} ${iso3(84, 78, 25.5)} ${iso3(14, 78, 25.5)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(84, 10, 22)} ${iso3(84, 78, 28)} ${iso3(84, 78, 25.5)} ${iso3(84, 10, 19.5)}`} fill="#292524" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* れんが煙突＋煙 */}
      <IsoCube x={62} y={20} w={12} d={12} z={24} h={22} top="#57534e" left="#b91c1c" right="#7f1d1d" sw={1} />
      <g transform={`translate(${isoPt(68, 26, 48)[0].toFixed(1)}, ${isoPt(68, 26, 48)[1].toFixed(1)})`} opacity="0.85">
        <circle cx="0" cy="-2" r="3.4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="2.8" cy="-6.5" r="4.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="6.4" cy="-11.5" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.7" />
      </g>
      {/* 金床（アンビル） */}
      <g transform={`translate(${isoPt(74, 84, 0)[0].toFixed(1)}, ${isoPt(74, 84, 0)[1].toFixed(1)})`}>
        <polygon points="-4,0 4,0 3,-2.6 -3,-2.6" fill="#57534e" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M -5.5,-2.6 L 5.5,-2.6 L 6.8,-4.2 L 3,-6 L -3.6,-6 L -5.5,-4.4 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <path d="M -5.5,-4.4 L -8.5,-4.8 L -7,-6 L -3.6,-6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
      {/* ハンマー（立てかけ） */}
      <g transform={`translate(${isoPt(88, 60, 0)[0].toFixed(1)}, ${isoPt(88, 60, 0)[1].toFixed(1)}) rotate(18)`}>
        <line x1="0" y1="0" x2="0" y2="-9" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="-2.6" y="-12" width="5.2" height="3.2" rx="0.7" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
      </g>
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
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 石畳広場 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 大ホールの壁 */}
      <IsoCube x={10} y={8} w={72} d={56} h={16} top="#f1f5f9" left="#fef3c7" right="#fde68a" sw={1.1} />
      {/* 正面の大アーチ開口（市場の入口） */}
      <FaceSW x1={20} x2={44} y={64.2} z1={0} z2={11} fill="#78350f" sw={1} />
      <path d={`M ${iso3(20, 64.2, 11)} Q ${iso3(32, 64.2, 17)} ${iso3(44, 64.2, 11)}`} fill="#78350f" stroke="#1e293b" strokeWidth="0.9" />
      <FaceSW x1={50} x2={74} y={64.2} z1={0} z2={11} fill="#92400e" sw={1} />
      <path d={`M ${iso3(50, 64.2, 11)} Q ${iso3(62, 64.2, 17)} ${iso3(74, 64.2, 11)}`} fill="#92400e" stroke="#1e293b" strokeWidth="0.9" />
      {/* 大きなアーチ屋根（赤白の縞） */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const x1 = 6 + i * 13.34; const x2 = 6 + (i + 1) * 13.34;
        return (
          <path key={i} d={`M ${iso3(x1, 64, 18)} L ${iso3(x2, 64, 18)} C ${iso3(x2, 36, 34)} ${iso3(x2, 32, 34)} ${iso3(x2, 4, 18)} L ${iso3(x1, 4, 18)} C ${iso3(x1, 32, 34)} ${iso3(x1, 36, 34)} ${iso3(x1, 64, 18)} Z`}
            fill={i % 2 === 0 ? '#ef4444' : '#f8fafc'} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        );
      })}
      {/* アーチ屋根の手前断面 */}
      <path d={`M ${iso3(86, 4, 18)} C ${iso3(86, 32, 34)} ${iso3(86, 36, 34)} ${iso3(86, 64, 18)} L ${iso3(86, 64, 15.5)} C ${iso3(86, 36, 31.5)} ${iso3(86, 32, 31.5)} ${iso3(86, 4, 15.5)} Z`}
        fill="#b91c1c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 旗 */}
      <line x1={isoPt(46, 34, 30)[0]} y1={isoPt(46, 34, 30)[1]} x2={isoPt(46, 34, 42)[0]} y2={isoPt(46, 34, 42)[1]} stroke="#1e293b" strokeWidth="1" />
      <polygon points={`${isoPt(46, 34, 42)[0]},${isoPt(46, 34, 42)[1]} ${isoPt(46, 34, 42)[0] + 7},${isoPt(46, 34, 42)[1] + 1.7} ${isoPt(46, 34, 42)[0]},${isoPt(46, 34, 42)[1] + 3.4}`} fill="#facc15" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      {/* 前面の屋台と木箱 */}
      <MarketStall gx={24} gy={82} c1="#3b82f6" c2="#f8fafc" goods={[[-5, -4.5, '#facc15'], [-1, -3.6, '#ef4444'], [3, -4.6, '#a3e635']]} />
      <MarketStall gx={62} gy={86} c1="#22c55e" c2="#fef9c3" goods={[[-4, -4.5, '#f97316'], [0, -3.5, '#ef4444'], [4, -5, '#facc15']]} />
      <IsoCube x={86} y={70} w={10} d={10} h={6.5} top="#fcd34d" left="#fbbf24" right="#f59e0b" sw={0.8} />
      <IsoCube x={88} y={82} w={9} d={9} h={5.5} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={0.8} />
    </g>
  </svg>
);

export const SvgMegaFortress = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 岩盤の基礎 */}
      <IsoCube x={2} y={2} w={96} d={96} h={4} top="#78716c" left="#57534e" right="#44403c" sw={1} />
      {/* 城壁（外周） */}
      <IsoCube x={8} y={8} w={84} d={84} z={4} h={14} top="#94a3b8" left="#64748b" right="#475569" sw={1.1} />
      {/* 城壁の銃眼（手前2辺の凸凹） */}
      {[12, 26, 40, 54, 68, 82].map(x => (
        <IsoCube key={`m1-${x}`} x={x} y={88} w={7} d={4} z={18} h={4} top="#94a3b8" left="#64748b" right="#475569" sw={0.8} />
      ))}
      {[12, 26, 40, 54, 68, 82].map(y => (
        <IsoCube key={`m2-${y}`} x={88} y={y} w={4} d={7} z={18} h={4} top="#94a3b8" left="#64748b" right="#475569" sw={0.8} />
      ))}
      {/* 城門（落とし格子） */}
      <FaceSW x1={38} x2={62} y={92.2} z1={4} z2={15} fill="#1c1917" sw={1.1} />
      <path d={`M ${iso3(38, 92.2, 15)} Q ${iso3(50, 92.2, 21)} ${iso3(62, 92.2, 15)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="1" />
      {[42, 47, 52, 57].map(x => (
        <line key={x} x1={isoPt(x, 92.4, 4)[0]} y1={isoPt(x, 92.4, 4)[1]} x2={isoPt(x, 92.4, 16)[0]} y2={isoPt(x, 92.4, 16)[1]} stroke="#78716c" strokeWidth="1" />
      ))}
      {/* 四隅の円塔 */}
      {[[10, 10], [90, 10], [10, 90], [90, 90]].map(([tx, ty], i) => {
        const [px, py] = isoPt(tx, ty, 4);
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
            <path d="M -7,0 L -7,-26 A 7,3 0 0 1 7,-26 L 7,0 A 7,3 0 0 1 -7,0 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 0,0 L 0,-26 L 7,-26 L 7,0 A 7,3 0 0 1 0,0 Z" fill="#64748b" stroke="none" />
            <path d="M -7,0 L -7,-26 A 7,3 0 0 1 7,-26 L 7,0 A 7,3 0 0 1 -7,0 Z" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            {/* 狭間窓 */}
            <rect x="-1.2" y="-20" width="2.4" height="5" rx="1" fill="#1c1917" />
            {/* 円錐屋根 */}
            <path d="M -9,-26 A 9,3.6 0 0 1 9,-26 L 0,-42 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 0,-42 L 9,-26 A 9,3.6 0 0 1 4.5,-23.5 Z" fill="#7f1d1d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
            {/* 旗 */}
            <line x1="0" y1="-42" x2="0" y2="-49" stroke="#1e293b" strokeWidth="0.9" />
            <polygon points="0,-49 6,-47.4 0,-45.8" fill="#ef4444" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* 中央の天守（キープ） */}
      <IsoCube x={32} y={32} w={36} d={36} z={4} h={30} top="#64748b" left="#475569" right="#334155" sw={1.1} />
      {[36, 46, 56].map(x => (
        <rect key={x} x={isoPt(x, 68.2, 22)[0] - 1} y={isoPt(x, 68.2, 22)[1] - 5} width="2" height="5" rx="1" fill="#1c1917" />
      ))}
      {/* キープの銃眼 */}
      {[34, 46, 58].map(x => (
        <IsoCube key={`k-${x}`} x={x} y={64} w={7} d={4} z={34} h={4} top="#64748b" left="#475569" right="#334155" sw={0.8} />
      ))}
      <IsoCube x={40} y={40} w={20} d={20} z={38} h={8} top="#475569" left="#334155" right="#1e293b" sw={1} />
      {/* 大旗 */}
      <line x1={isoPt(50, 50, 46)[0]} y1={isoPt(50, 50, 46)[1]} x2={isoPt(50, 50, 62)[0]} y2={isoPt(50, 50, 62)[1]} stroke="#1e293b" strokeWidth="1.2" />
      <polygon points={`${isoPt(50, 50, 62)[0]},${isoPt(50, 50, 62)[1]} ${isoPt(50, 50, 62)[0] + 9},${isoPt(50, 50, 62)[1] + 2.2} ${isoPt(50, 50, 62)[0]},${isoPt(50, 50, 62)[1] + 4.4}`} fill="#dc2626" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgMegaAcademy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* キャンパス緑地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#4ade80" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(44, 52, 0.1)} ${iso3(56, 52, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" />
      {/* 左右の学舎 */}
      <IsoCube x={4} y={22} w={24} d={36} h={18} top="#cbd5e1" left="#f8fafc" right="#e2e8f0" sw={1} />
      <IsoCube x={72} y={22} w={24} d={36} h={18} top="#cbd5e1" left="#f8fafc" right="#e2e8f0" sw={1} />
      {[[7, 13], [18, 24]].map(([a, b], i) => <WinSW key={`l-${i}`} x1={a} x2={b} y={58.2} z1={5} z2={13} />)}
      {[[75, 81], [86, 92]].map(([a, b], i) => <WinSW key={`r-${i}`} x1={a} x2={b} y={58.2} z1={5} z2={13} />)}
      <IsoCube x={2} y={20} w={28} d={40} z={18} h={2.5} top="#3b82f6" left="#60a5fa" right="#1d4ed8" sw={0.9} />
      <IsoCube x={70} y={20} w={28} d={40} z={18} h={2.5} top="#3b82f6" left="#60a5fa" right="#1d4ed8" sw={0.9} />
      {/* 中央講堂 */}
      <IsoCube x={30} y={14} w={40} d={44} h={26} top="#e2e8f0" left="#fef3c7" right="#fde68a" sw={1.1} />
      {/* 講堂の列柱ファサード */}
      {[34, 41, 59, 66].map(x => (
        <polygon key={x} points={`${iso3(x - 1.5, 58.3, 0)} ${iso3(x + 1.5, 58.3, 0)} ${iso3(x + 1.5, 58.3, 18)} ${iso3(x - 1.5, 58.3, 18)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      <FaceSW x1={45} x2={55} y={58.4} z1={0} z2={13} fill="#7c2d12" sw={1} />
      <path d={`M ${iso3(45, 58.5, 13)} Q ${iso3(50, 58.5, 17.5)} ${iso3(55, 58.5, 13)}`} fill="#7c2d12" stroke="#1e293b" strokeWidth="0.9" />
      {/* ペディメント（三角破風） */}
      <polygon points={`${iso3(30, 59, 18)} ${iso3(70, 59, 18)} ${iso3(70, 59, 21)} ${iso3(30, 59, 21)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(28, 59.5, 21)} ${iso3(72, 59.5, 21)} ${iso3(50, 59.5, 32)}`} fill="#f5f5f4" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx={isoPt(50, 59.6, 25)[0]} cy={isoPt(50, 59.6, 25)[1]} r="2.6" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.8" />
      {/* 大ドーム（青銅） */}
      <ellipse cx={isoPt(50, 36, 26)[0]} cy={isoPt(50, 36, 26)[1]} rx="15" ry="6.5" fill="#a8a29e" stroke="#1e293b" strokeWidth="1" />
      <path d={`M ${isoPt(50, 36, 26)[0] - 14},${isoPt(50, 36, 26)[1]} C ${isoPt(50, 36, 26)[0] - 14},${isoPt(50, 36, 26)[1] - 20} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1] - 20} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1]} Z`}
        fill="#0f766e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M ${isoPt(50, 36, 26)[0]},${isoPt(50, 36, 26)[1] - 15} C ${isoPt(50, 36, 26)[0] + 8},${isoPt(50, 36, 26)[1] - 14} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1] - 8} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1]} L ${isoPt(50, 36, 26)[0]},${isoPt(50, 36, 26)[1]} Z`}
        fill="#14b8a6" opacity="0.6" />
      <line x1={isoPt(50, 36, 26)[0]} y1={isoPt(50, 36, 26)[1] - 15} x2={isoPt(50, 36, 26)[0]} y2={isoPt(50, 36, 26)[1] - 21} stroke="#1e293b" strokeWidth="1" />
      <circle cx={isoPt(50, 36, 26)[0]} cy={isoPt(50, 36, 26)[1] - 22} r="1.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" />
      {/* 並木 */}
      {[[16, 78], [84, 78], [30, 88], [70, 88]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 0)[0].toFixed(1)}, ${isoPt(bx, by, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-6" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="0" cy="-9.5" r="4.8" fill="#16a34a" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="-1.6" cy="-11" r="2" fill="#4ade80" opacity="0.8" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgMegaImperialPalace = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 玉砂利の敷地＋堀 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(0, 88, 0.1)} ${iso3(100, 88, 0.1)} ${iso3(100, 100, 0.1)} ${iso3(0, 100, 0.1)}`} fill="url(#grad-water)" />
      <polygon points={`${iso3(42, 88, 0.3)} ${iso3(58, 88, 0.3)} ${iso3(58, 100, 0.3)} ${iso3(42, 100, 0.3)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      {/* 石垣（算木積みの台座） */}
      <IsoCube x={12} y={12} w={76} d={64} h={12} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={1.1} />
      <g stroke="#57534e" strokeWidth="0.6" opacity="0.7">
        <line x1={isoPt(18, 76.1, 4)[0]} y1={isoPt(18, 76.1, 4)[1]} x2={isoPt(40, 76.1, 4)[0]} y2={isoPt(40, 76.1, 4)[1]} />
        <line x1={isoPt(52, 76.1, 8)[0]} y1={isoPt(52, 76.1, 8)[1]} x2={isoPt(80, 76.1, 8)[0]} y2={isoPt(80, 76.1, 8)[1]} />
      </g>
      {/* 御殿1層目（白壁＋朱柱） */}
      <IsoCube x={22} y={20} w={56} d={44} z={12} h={14} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1.1} />
      {[26, 38, 62, 74].map(x => (
        <polygon key={x} points={`${iso3(x - 1.3, 64.2, 12)} ${iso3(x + 1.3, 64.2, 12)} ${iso3(x + 1.3, 64.2, 26)} ${iso3(x - 1.3, 64.2, 26)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
      <FaceSW x1={44} x2={56} y={64.3} z1={12} z2={23} fill="#7c2d12" sw={1} />
      <line x1={isoPt(50, 64.4, 12)[0]} y1={isoPt(50, 64.4, 12)[1]} x2={isoPt(50, 64.4, 23)[0]} y2={isoPt(50, 64.4, 23)[1]} stroke="#1e293b" strokeWidth="0.8" />
      {/* 1層目の緑屋根（入母屋・反り） */}
      <path d={`M ${iso3(14, 14, 26)} L ${iso3(86, 14, 26)} L ${iso3(86, 70, 26)} L ${iso3(14, 70, 26)} Z`} fill="#15803d" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(14, 70, 26)} L ${iso3(86, 70, 26)} Q ${iso3(88, 74, 24)} ${iso3(90, 78, 24.5)} L ${iso3(10, 78, 24.5)} Q ${iso3(12, 74, 24)} ${iso3(14, 70, 26)} Z`}
        fill="#22c55e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 2層目（上御殿） */}
      <IsoCube x={32} y={26} w={36} d={30} z={26} h={11} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1} />
      {[36, 50, 64].map(x => (
        <polygon key={x} points={`${iso3(x - 1.2, 56.2, 26)} ${iso3(x + 1.2, 56.2, 26)} ${iso3(x + 1.2, 56.2, 37)} ${iso3(x - 1.2, 56.2, 37)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      ))}
      {/* 2層目の屋根（緑＋金の棟飾り） */}
      <polygon points={`${iso3(26, 20, 37)} ${iso3(74, 20, 37)} ${iso3(74, 62, 37)} ${iso3(26, 62, 37)}`} fill="#16a34a" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(26, 62, 37)} ${iso3(74, 62, 37)} ${iso3(50, 41, 50)}`} fill="#22c55e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(74, 20, 37)} ${iso3(74, 62, 37)} ${iso3(50, 41, 50)}`} fill="#166534" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(26, 20, 37)} ${iso3(74, 20, 37)} ${iso3(50, 41, 50)}`} fill="#4ade80" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 金鯱 */}
      <circle cx={isoPt(50, 41, 51.5)[0]} cy={isoPt(50, 41, 51.5)[1]} r="2" fill="url(#grad-gold)" stroke="#1e293b" strokeWidth="0.8" filter="url(#glow-effect)" />
      {/* 門灯篭 */}
      {[[34, 82], [66, 82]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${isoPt(lx, ly, 0)[0].toFixed(1)}, ${isoPt(lx, ly, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-6" stroke="#57534e" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-2.4" y="-9.6" width="4.8" height="3.6" rx="0.6" fill="#e7e5e4" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="0" cy="-7.8" r="1" fill="#fef08a" filter="url(#glow-effect)" />
          <polygon points="-3.2,-9.6 3.2,-9.6 0,-12" fill="#57534e" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgMegaWonder = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 神聖な床 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(20, 20, 0.1)} ${iso3(80, 20, 0.1)} ${iso3(80, 80, 0.1)} ${iso3(20, 80, 0.1)}`} fill="none" stroke="#d97706" strokeWidth="0.8" opacity="0.7" />
      {/* 黄金のジッグラト（3段） */}
      <IsoCube x={16} y={16} w={68} d={68} h={9} top="#fcd34d" left="#fbbf24" right="#d97706" sw={1.1} />
      <IsoCube x={26} y={26} w={48} d={48} z={9} h={9} top="#fde68a" left="#fcd34d" right="#f59e0b" sw={1.1} />
      <IsoCube x={36} y={36} w={28} d={28} z={18} h={9} top="#fef08a" left="#fde047" right="#fbbf24" sw={1.1} />
      {/* 正面階段 */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <polygon key={i} points={`${iso3(45, 84 - i * 10, i * 4.5)} ${iso3(55, 84 - i * 10, i * 4.5)} ${iso3(55, 79 - i * 10, i * 4.5 + 2.2)} ${iso3(45, 79 - i * 10, i * 4.5 + 2.2)}`}
          fill="#fef3c7" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
      {/* 頂上の4本柱 */}
      {[[40, 40], [60, 40], [40, 60], [60, 60]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.4, py0, 27)} ${iso3(px0 + 1.4, py0, 27)} ${iso3(px0 + 1.4, py0, 38)} ${iso3(px0 - 1.4, py0, 38)}`}
          fill="#f59e0b" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      {/* 浮遊する大クリスタル */}
      <g transform={`translate(${isoPt(50, 50, 52)[0].toFixed(1)}, ${isoPt(50, 50, 52)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="16" rx="10" ry="3.6" fill="#0ea5e9" opacity="0.25" />
        <g filter="url(#glow-effect)">
          <polygon points="0,-16 -9,-2 0,14 9,-2" fill="#38bdf8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="0,-16 -9,-2 0,2 " fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <polygon points="0,-16 0,2 9,-2" fill="#0284c7" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        </g>
        {/* 輝きの粒 */}
        <circle cx="-12" cy="-8" r="1.2" fill="#fef9c3" />
        <circle cx="13" cy="-4" r="1.5" fill="#fef9c3" />
        <circle cx="8" cy="-14" r="1" fill="#fff" />
        <path d="M -15,4 L -13,4 M -14,3 L -14,5" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      {/* 光柱 */}
      <polygon points={`${isoPt(50, 50, 27)[0] - 7},${isoPt(50, 50, 27)[1]} ${isoPt(50, 50, 27)[0] + 7},${isoPt(50, 50, 27)[1]} ${isoPt(50, 50, 60)[0] + 3},${isoPt(50, 50, 60)[1]} ${isoPt(50, 50, 60)[0] - 3},${isoPt(50, 50, 60)[1]}`}
        fill="#fef08a" opacity="0.35" />
    </g>
  </svg>
);

export const SvgMegaHarborTown = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 海と陸 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(0, 0, 0.1)} ${iso3(100, 0, 0.1)} ${iso3(100, 42, 0.1)} ${iso3(0, 42, 0.1)}`} fill="#fde68a" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {[[24, 66], [70, 60], [40, 84], [82, 82]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 0)[0]},${isoPt(wx, wy, 0)[1]} q 4,-1.6 8,0`} fill="none" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* 灯台（縞模様） */}
      <g transform={`translate(${isoPt(14, 30, 0)[0].toFixed(1)}, ${isoPt(14, 30, 0)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="0.5" rx="8" ry="3.2" fill="#020617" opacity="0.15" />
        <path d="M -6,-0.5 L -4,-26 L 4,-26 L 6,-0.5 A 6,2.4 0 0 1 -6,-0.5 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M -5.4,-8 L 5.4,-8 L 4.9,-14 L -4.9,-14 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <path d="M -4.6,-19 L 4.6,-19 L 4.3,-23 L -4.3,-23 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="-4.4" y="-31" width="8.8" height="5" rx="0.8" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
        <rect x="-3" y="-30.2" width="6" height="3.4" rx="0.5" fill="#fef08a" filter="url(#glow-effect)" />
        <polygon points="-5.2,-31 5.2,-31 0,-36" fill="#dc2626" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
      {/* 港町の家並み（3軒） */}
      {[[38, 16, '#ef4444', '#fff7ed'], [58, 22, '#3b82f6', '#f0f9ff'], [78, 14, '#f59e0b', '#fefce8']].map(([hx, hy, roof, wall], i) => (
        <g key={i}>
          <IsoCube x={hx} y={hy} w={16} d={14} h={10} top={wall} left={wall} right={darken(wall, 30)} sw={1} />
          <polygon points={`${iso3(hx - 2, hy - 1, 10)} ${iso3(hx + 18, hy - 1, 10)} ${iso3(hx + 18, hy + 7, 16)} ${iso3(hx - 2, hy + 7, 16)}`} fill={roof} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          <polygon points={`${iso3(hx - 2, hy + 7, 16)} ${iso3(hx + 18, hy + 7, 16)} ${iso3(hx + 18, hy + 15, 10)} ${iso3(hx - 2, hy + 15, 10)}`} fill={darken(roof, 40)} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          <FaceSW x1={hx + 3} x2={hx + 8} y={hy + 14.2} z1={2.5} z2={7.5} fill="#7dd3fc" sw={0.7} />
          <FaceSW x1={hx + 10} x2={hx + 13.5} y={hy + 14.2} z1={0} z2={6.5} fill="#78350f" sw={0.7} />
        </g>
      ))}
      {/* 桟橋 */}
      <polygon points={`${iso3(56, 42, 2)} ${iso3(68, 42, 2)} ${iso3(68, 84, 2)} ${iso3(56, 84, 2)}`} fill="#b45309" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {[50, 60, 70, 78].map(y => (
        <line key={y} x1={isoPt(56, y, 2)[0]} y1={isoPt(56, y, 2)[1]} x2={isoPt(68, y, 2)[0]} y2={isoPt(68, y, 2)[1]} stroke="#92400e" strokeWidth="0.8" />
      ))}
      {[[57, 46], [67, 46], [57, 80], [67, 80]].map(([px0, py0], i) => (
        <line key={i} x1={isoPt(px0, py0, 2)[0]} y1={isoPt(px0, py0, 2)[1]} x2={isoPt(px0, py0, -3)[0]} y2={isoPt(px0, py0, -3)[1] + 5} stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {/* 小舟 */}
      <g transform={`translate(${isoPt(82, 70, 0)[0].toFixed(1)}, ${isoPt(82, 70, 0)[1].toFixed(1)})`}>
        <path d="M -9,-3 C -9,0 -5,2 0,2 C 5,2 9,0 9,-3 L 6,-3 C 6,-1 3,0 0,0 C -3,0 -6,-1 -6,-3 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <path d="M -6,-3 L 6,-3 L 4.6,-1 L -4.6,-1 Z" fill="#b45309" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <line x1="0" y1="-3" x2="0" y2="-13" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <polygon points="0.8,-13 7,-9.5 0.8,-6.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      {/* カモメ */}
      <path d={`M ${isoPt(36, 62, 24)[0]},${isoPt(36, 62, 24)[1]} q 2,-2.4 4,0 q 2,-2.4 4,0`} fill="none" stroke="#334155" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgMegaShrineComplex = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 鎮守の森の緑地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#15803d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 参道 */}
      <polygon points={`${iso3(44, 30, 0.1)} ${iso3(56, 30, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="0.6" />
      {/* 本殿 */}
      <g>
        <IsoCube x={30} y={10} w={40} d={26} h={14} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1} />
        {[34, 46, 62].map(x => (
          <polygon key={x} points={`${iso3(x - 1.2, 36.2, 0)} ${iso3(x + 1.2, 36.2, 0)} ${iso3(x + 1.2, 36.2, 14)} ${iso3(x - 1.2, 36.2, 14)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        ))}
        <FaceSW x1={52} x2={58} y={36.3} z1={0} z2={10} fill="#7c2d12" sw={0.8} />
        {/* 千木のある屋根 */}
        <polygon points={`${iso3(24, 6, 14)} ${iso3(76, 6, 14)} ${iso3(76, 23, 24)} ${iso3(24, 23, 24)}`} fill="#292524" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <polygon points={`${iso3(24, 40, 14)} ${iso3(76, 40, 14)} ${iso3(76, 23, 24)} ${iso3(24, 23, 24)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <line x1={isoPt(24, 23, 24)[0]} y1={isoPt(24, 23, 24)[1]} x2={isoPt(24, 23, 30)[0] - 3} y2={isoPt(24, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(24, 23, 24)[0]} y1={isoPt(24, 23, 24)[1]} x2={isoPt(24, 23, 30)[0] + 3} y2={isoPt(24, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(76, 23, 24)[0]} y1={isoPt(76, 23, 24)[1]} x2={isoPt(76, 23, 30)[0] - 3} y2={isoPt(76, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(76, 23, 24)[0]} y1={isoPt(76, 23, 24)[1]} x2={isoPt(76, 23, 30)[0] + 3} y2={isoPt(76, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 摂社（小さな社） */}
      <g>
        <IsoCube x={10} y={46} w={18} d={14} h={9} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={0.9} />
        <polygon points={`${iso3(6, 44, 9)} ${iso3(32, 44, 9)} ${iso3(32, 53, 16)} ${iso3(6, 53, 16)}`} fill="#292524" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(6, 62, 9)} ${iso3(32, 62, 9)} ${iso3(32, 53, 16)} ${iso3(6, 53, 16)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 朱の鳥居（参道上） */}
      <g transform={`translate(${isoPt(50, 74, 0)[0].toFixed(1)}, ${isoPt(50, 74, 0)[1].toFixed(1)})`}>
        <polygon points="-11,0 -8.4,0 -8.4,-19 -11,-19" fill="#dc2626" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <polygon points="8.4,0 11,0 11,-19 8.4,-19" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <rect x="-12.5" y="-17.5" width="25" height="2.6" fill="#dc2626" stroke="#1e293b" strokeWidth="1" />
        <path d="M -15,-23.5 Q 0,-26.5 15,-23.5 L 15,-20.8 Q 0,-23.8 -15,-20.8 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <rect x="-1.3" y="-17.5" width="2.6" height="4.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.7" />
      </g>
      {/* 石灯篭（参道両脇） */}
      {[[38, 86], [62, 86]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${isoPt(lx, ly, 0)[0].toFixed(1)}, ${isoPt(lx, ly, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-5" stroke="#78716c" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="-2.2" y="-8.6" width="4.4" height="3.6" rx="0.5" fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="0" cy="-6.8" r="1" fill="#fef08a" filter="url(#glow-effect)" />
          <polygon points="-3,-8.6 3,-8.6 0,-11" fill="#78716c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      ))}
      {/* ご神木 */}
      {[[84, 30], [14, 20], [84, 74]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${isoPt(tx, ty, 0)[0].toFixed(1)}, ${isoPt(tx, ty, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-9" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="-14" r="6.6" fill="#166534" stroke="#1e293b" strokeWidth="1" />
          <circle cx="-2.2" cy="-16" r="2.6" fill="#22c55e" opacity="0.8" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgCherryPavilion = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={40} />
      {/* 庭園の地面 */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.1)[0]} cy={isoPt(50, 50, 0.1)[1]} rx="27" ry="12.5" fill="#fdf2f8" opacity="0.85" />
      {/* 高床の basement */}
      <IsoCube x={28} y={28} w={44} d={44} h={6} top="#e7e5e4" left="#d6d3d1" right="#a8a29e" sw={1} />
      {/* 朱塗りの柱4本 */}
      {[[33, 33], [67, 33], [33, 67], [67, 67]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.6, py0, 6)} ${iso3(px0 + 1.6, py0, 6)} ${iso3(px0 + 1.6, py0, 24)} ${iso3(px0 - 1.6, py0, 24)}`}
          fill="#dc2626" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      ))}
      {/* 高欄（手すり） */}
      <line x1={isoPt(30, 70, 12)[0]} y1={isoPt(30, 70, 12)[1]} x2={isoPt(70, 70, 12)[0]} y2={isoPt(70, 70, 12)[1]} stroke="#b91c1c" strokeWidth="1.4" />
      <line x1={isoPt(70, 30, 12)[0]} y1={isoPt(70, 30, 12)[1]} x2={isoPt(70, 70, 12)[0]} y2={isoPt(70, 70, 12)[1]} stroke="#991b1b" strokeWidth="1.4" />
      {/* 一層目の桜色屋根（反り屋根） */}
      <path d={`M ${iso3(20, 20, 24)} L ${iso3(80, 20, 24)} Q ${iso3(86, 50, 22)} ${iso3(80, 80, 24)} L ${iso3(20, 80, 24)} Q ${iso3(14, 50, 22)} ${iso3(20, 20, 24)} Z`}
        fill="#f472b6" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(28, 28, 30)} ${iso3(72, 28, 30)} ${iso3(72, 72, 30)} ${iso3(28, 72, 30)}`} fill="#ec4899" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 二層目（小さな楼閣） */}
      <IsoCube x={38} y={38} w={24} d={24} z={30} h={10} top="#fdf2f8" left="#fff1f2" right="#fce7f3" sw={1} />
      <FaceSW x1={44} x2={56} y={62.2} z1={32} z2={38} fill="#7c2d12" sw={0.8} />
      {/* 頂上の反り屋根 */}
      <path d={`M ${iso3(32, 32, 40)} L ${iso3(68, 32, 40)} L ${iso3(68, 68, 40)} L ${iso3(32, 68, 40)} Z`} fill="#db2777" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(32, 68, 40)} L ${iso3(68, 68, 40)} Q ${iso3(50, 50, 52)} ${iso3(32, 68, 40)} Z`} fill="#f472b6" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <path d={`M ${iso3(68, 32, 40)} L ${iso3(68, 68, 40)} Q ${iso3(50, 50, 52)} ${iso3(68, 32, 40)} Z`} fill="#be185d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <circle cx={isoPt(50, 50, 53)[0]} cy={isoPt(50, 50, 53)[1]} r="1.8" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.7" />
      {/* 桜の木2本 */}
      {[[14, 78], [86, 74]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${isoPt(tx, ty, 0)[0].toFixed(1)}, ${isoPt(tx, ty, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-3.4" cy="-11" r="4.6" fill="#f9a8d4" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="3.4" cy="-11" r="4.6" fill="#f472b6" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="0" cy="-15" r="5" fill="#fbcfe8" stroke="#1e293b" strokeWidth="0.9" />
        </g>
      ))}
      {/* 舞う花びら */}
      {[[30, 20, 26], [74, 40, 34], [20, 46, 18], [60, 14, 30]].map(([fx, fy, fz], i) => (
        <path key={i} d={`M ${isoPt(fx, fy, fz)[0]},${isoPt(fx, fy, fz)[1]} q 1.4,-1.8 2.8,0 q -1.4,1.8 -2.8,0`} fill="#fbcfe8" stroke="#ec4899" strokeWidth="0.5" />
      ))}
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
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={38} />
      {/* 魔法陣の刻まれた床 */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#312e81" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.2)[0]} cy={isoPt(50, 50, 0.2)[1]} rx="30" ry="14" fill="none" stroke="#a5b4fc" strokeWidth="0.9" opacity="0.8" />
      <ellipse cx={isoPt(50, 50, 0.2)[0]} cy={isoPt(50, 50, 0.2)[1]} rx="22" ry="10" fill="none" stroke="#818cf8" strokeWidth="0.7" opacity="0.7" />
      {[[50, 18], [82, 50], [50, 82], [18, 50]].map(([sx0, sy0], i) => (
        <path key={i} d={`M ${isoPt(sx0, sy0, 0.3)[0] - 1.8},${isoPt(sx0, sy0, 0.3)[1]} L ${isoPt(sx0, sy0, 0.3)[0] + 1.8},${isoPt(sx0, sy0, 0.3)[1]} M ${isoPt(sx0, sy0, 0.3)[0]},${isoPt(sx0, sy0, 0.3)[1] - 1.8} L ${isoPt(sx0, sy0, 0.3)[0]},${isoPt(sx0, sy0, 0.3)[1] + 1.8}`}
          stroke="#c7d2fe" strokeWidth="0.8" strokeLinecap="round" />
      ))}
      {/* 石造の塔 */}
      <g transform={`translate(${isoPt(50, 50, 0)[0].toFixed(1)}, ${isoPt(50, 50, 0)[1].toFixed(1)})`}>
        <path d="M -13,0 L -13,-36 A 13,5 0 0 1 13,-36 L 13,0 A 13,5.2 0 0 1 -13,0 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M 0,2.6 A 13,5.2 0 0 0 13,0 L 13,-36 L 0,-38 Z" fill="#64748b" />
        <path d="M -13,0 L -13,-36 A 13,5 0 0 1 13,-36 L 13,0 A 13,5.2 0 0 1 -13,0 Z" fill="none" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        {/* 石積みライン */}
        <path d="M -12.4,-8 A 12.4,4.8 0 0 0 12.4,-8 M -12.4,-20 A 12.4,4.8 0 0 0 12.4,-20" fill="none" stroke="#475569" strokeWidth="0.7" opacity="0.8" />
        {/* 扉と丸窓 */}
        <path d="M -4,1.6 L -4,-8 A 4,3.4 0 0 1 4,-8 L 4,1.6 Z" fill="#1e1b4b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="0" cy="-27" r="3.6" fill="#fbbf24" stroke="#1e293b" strokeWidth="1" filter="url(#glow-effect)" />
        <path d="M -3.6,-27 L 3.6,-27 M 0,-30.6 L 0,-23.4" stroke="#92400e" strokeWidth="0.7" />
        {/* とんがり屋根（藍色・星模様） */}
        <path d="M -16,-36 A 16,6 0 0 1 16,-36 L 0,-64 Z" fill="#4338ca" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M 0,-64 L 16,-36 A 16,6 0 0 1 8,-31.6 Z" fill="#312e81" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[[-6, -42], [4, -50], [-2, -56]].map(([px0, py0], i) => (
          <path key={i} d={`M ${px0 - 1.6},${py0} L ${px0 + 1.6},${py0} M ${px0},${py0 - 1.6} L ${px0},${py0 + 1.6}`} stroke="#fde047" strokeWidth="0.8" strokeLinecap="round" />
        ))}
        {/* 頂上の輝く宝珠 */}
        <circle cx="0" cy="-66.5" r="2.6" fill="#a5b4fc" stroke="#1e293b" strokeWidth="0.9" filter="url(#glow-effect)" />
      </g>
      {/* 浮遊する本 */}
      <g transform={`translate(${isoPt(20, 74, 14)[0].toFixed(1)}, ${isoPt(20, 74, 14)[1].toFixed(1)}) rotate(-8)`}>
        <path d="M -4.6,0 C -2.6,-1.8 -0.6,-1.8 0,-0.6 C 0.6,-1.8 2.6,-1.8 4.6,0 L 4.6,3 C 2.6,1.4 0.6,1.4 0,2.6 C -0.6,1.4 -2.6,1.4 -4.6,3 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      <g transform={`translate(${isoPt(82, 68, 20)[0].toFixed(1)}, ${isoPt(82, 68, 20)[1].toFixed(1)}) rotate(7)`}>
        <path d="M -4,0 C -2.2,-1.6 -0.5,-1.6 0,-0.5 C 0.5,-1.6 2.2,-1.6 4,0 L 4,2.6 C 2.2,1.2 0.5,1.2 0,2.2 C -0.5,1.2 -2.2,1.2 -4,2.6 Z" fill="#22c55e" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      {/* フラスコ台 */}
      <g transform={`translate(${isoPt(80, 88, 0)[0].toFixed(1)}, ${isoPt(80, 88, 0)[1].toFixed(1)})`}>
        <path d="M -1.4,-8 L -1.4,-4.6 L -4,-0.6 A 3.6,2.8 0 0 0 4,-0.6 L 1.4,-4.6 L 1.4,-8 Z" fill="#e0f2fe" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M -3,-0.8 A 3,2.2 0 0 0 3,-0.8 L 1.6,-3 L -1.6,-3 Z" fill="#a855f7" opacity="0.85" />
        <circle cx="0.6" cy="-4.6" r="0.7" fill="#d8b4fe" />
      </g>
    </g>
  </svg>
);

export const SvgDragonShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 神域の床 */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#064e3b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.2)[0]} cy={isoPt(50, 50, 0.2)[1]} rx="32" ry="15" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
      {/* 石の台座（2段） */}
      <IsoCube x={22} y={22} w={56} d={56} h={7} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={1.1} />
      <IsoCube x={32} y={32} w={36} d={36} z={7} h={6} top="#e7e5e4" left="#d6d3d1" right="#a8a29e" sw={1} />
      {/* 神殿（朱柱＋銅屋根） */}
      {[[37, 37], [63, 37], [37, 63], [63, 63]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.7, py0, 13)} ${iso3(px0 + 1.7, py0, 13)} ${iso3(px0 + 1.7, py0, 30)} ${iso3(px0 - 1.7, py0, 30)}`}
          fill="#b91c1c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      ))}
      {/* 銅葺きの反り屋根 */}
      <path d={`M ${iso3(28, 28, 30)} L ${iso3(72, 28, 30)} Q ${iso3(78, 50, 27)} ${iso3(72, 72, 30)} L ${iso3(28, 72, 30)} Q ${iso3(22, 50, 27)} ${iso3(28, 28, 30)} Z`}
        fill="#0f766e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 36, 35)} ${iso3(64, 36, 35)} ${iso3(64, 64, 35)} ${iso3(36, 64, 35)}`} fill="#14b8a6" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 64, 35)} ${iso3(64, 64, 35)} ${iso3(50, 50, 44)}`} fill="#0d9488" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(64, 36, 35)} ${iso3(64, 64, 35)} ${iso3(50, 50, 44)}`} fill="#115e59" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 御神体の宝珠 */}
      <circle cx={isoPt(50, 50, 21)[0]} cy={isoPt(50, 50, 21)[1]} r="4.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="1" filter="url(#glow-effect)" />
      {/* 巻きつく龍（塔を旋回） */}
      <g>
        <path d={`M ${isoPt(20, 84, 0)[0]},${isoPt(20, 84, 0)[1]}
                 C ${isoPt(4, 60, 6)[0]},${isoPt(4, 60, 6)[1]} ${isoPt(16, 30, 16)[0]},${isoPt(16, 30, 16)[1]} ${isoPt(42, 22, 24)[0]},${isoPt(42, 22, 24)[1]}
                 C ${isoPt(72, 16, 32)[0]},${isoPt(72, 16, 32)[1]} ${isoPt(88, 40, 40)[0]},${isoPt(88, 40, 40)[1]} ${isoPt(64, 56, 48)[0]},${isoPt(64, 56, 48)[1]}`}
          fill="none" stroke="#1e293b" strokeWidth="7.5" strokeLinecap="round" />
        <path d={`M ${isoPt(20, 84, 0)[0]},${isoPt(20, 84, 0)[1]}
                 C ${isoPt(4, 60, 6)[0]},${isoPt(4, 60, 6)[1]} ${isoPt(16, 30, 16)[0]},${isoPt(16, 30, 16)[1]} ${isoPt(42, 22, 24)[0]},${isoPt(42, 22, 24)[1]}
                 C ${isoPt(72, 16, 32)[0]},${isoPt(72, 16, 32)[1]} ${isoPt(88, 40, 40)[0]},${isoPt(88, 40, 40)[1]} ${isoPt(64, 56, 48)[0]},${isoPt(64, 56, 48)[1]}`}
          fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
        {/* 背びれ */}
        {[[10, 46, 11], [26, 24, 20], [58, 17, 28], [84, 28, 37]].map(([bx, by, bz], i) => (
          <path key={i} d={`M ${isoPt(bx, by, bz)[0]},${isoPt(bx, by, bz)[1]} l -1.6,-4.4 l 3.6,1.4 Z`} fill="#059669" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        ))}
        {/* 龍の頭 */}
        <g transform={`translate(${isoPt(64, 56, 48)[0].toFixed(1)}, ${isoPt(64, 56, 48)[1].toFixed(1)})`}>
          <polygon points="0,2 -7,-1 -8.6,-6.6 -3,-9.6 3.6,-7.6 5,-2" fill="#10b981" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="-2.6" cy="-5.4" r="1.4" fill="#fef08a" stroke="#1e293b" strokeWidth="0.6" />
          <path d="M -3,-9.6 L -5,-14 M 0.6,-8.6 L 0,-13" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M 5,-2 Q 9.6,-3 11,0.6" fill="none" stroke="#f8fafc" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
);

export const SvgPerfectMonument = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={36} />
      {/* 大理石の床 */}
      <polygon points={`${iso3(8, 8, 0)} ${iso3(92, 8, 0)} ${iso3(92, 92, 0)} ${iso3(8, 92, 0)}`} fill="#f5f5f4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 台座（3段） */}
      <IsoCube x={26} y={26} w={48} d={48} h={6} top="#e7e5e4" left="#d6d3d1" right="#a8a29e" sw={1} />
      <IsoCube x={34} y={34} w={32} d={32} z={6} h={6} top="#f5f5f4" left="#e7e5e4" right="#d6d3d1" sw={1} />
      <IsoCube x={42} y={42} w={16} d={16} z={12} h={22} top="#1e293b" left="#334155" right="#0f172a" sw={1.1} />
      {/* 金の月桂樹リース＋花丸メダル */}
      <g transform={`translate(${isoPt(50, 50, 46)[0].toFixed(1)}, ${isoPt(50, 50, 46)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="13" fill="url(#grad-gold)" stroke="#1e293b" strokeWidth="1.4" filter="url(#glow-effect)" />
        <circle cx="0" cy="0" r="9.4" fill="#fef3c7" stroke="#d97706" strokeWidth="0.9" />
        {/* 花丸（💮風の渦） */}
        <path d="M 0,4.6 C -4.6,4.6 -6.6,0.6 -4.6,-2.6 C -2.6,-5.6 2.6,-5.6 4.6,-2.6 C 6.2,-0.2 5,3 2,4 C 0.6,4.4 -0.8,4 -1.6,3 C -2.6,1.6 -2,-0.4 -0.4,-1 C 0.8,-1.4 2.2,-0.6 2.2,0.8"
          fill="none" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" />
        {/* 花びら */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
          const rad = a * Math.PI / 180;
          return <circle key={a} cx={11.4 * Math.cos(rad)} cy={11.4 * Math.sin(rad)} r="2.3" fill="#fbbf24" stroke="#b45309" strokeWidth="0.6" />;
        })}
        {/* リボン */}
        <polygon points="-4.6,11 -8.6,19.6 -4.6,17.6 -2,20.6" fill="#dc2626" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <polygon points="4.6,11 8.6,19.6 4.6,17.6 2,20.6" fill="#b91c1c" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      {/* 金の銘板 */}
      <FaceSW x1={44} x2={56} y={58.2} z1={16} z2={22} fill="#fbbf24" sw={0.8} />
      {/* きらめき */}
      {[[24, 30, 30], [78, 42, 40], [66, 78, 14]].map(([sx0, sy0, sz0], i) => (
        <path key={i} d={`M ${isoPt(sx0, sy0, sz0)[0] - 2.2},${isoPt(sx0, sy0, sz0)[1]} L ${isoPt(sx0, sy0, sz0)[0] + 2.2},${isoPt(sx0, sy0, sz0)[1]} M ${isoPt(sx0, sy0, sz0)[0]},${isoPt(sx0, sy0, sz0)[1] - 2.2} L ${isoPt(sx0, sy0, sz0)[0]},${isoPt(sx0, sy0, sz0)[1] + 2.2}`}
          stroke="#fde047" strokeWidth="1" strokeLinecap="round" />
      ))}
    </g>
  </svg>
);

export const SvgHotSpring = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 敷地（石畳） */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 湯屋（木造） */}
      <IsoCube x={8} y={8} w={44} d={38} h={16} top="#a16207" left="#d6bc8b" right="#b49468" sw={1.1} />
      <FaceSW x1={14} x2={26} y={46.2} z1={0} z2={12} fill="#57534e" sw={0.9} />
      <line x1={isoPt(20, 46.4, 0)[0]} y1={isoPt(20, 46.4, 0)[1]} x2={isoPt(20, 46.4, 12)[0]} y2={isoPt(20, 46.4, 12)[1]} stroke="#1e293b" strokeWidth="0.8" />
      <WinSW x1={32} x2={44} y={46.2} z1={5} z2={12} />
      {/* のれん（「ゆ」） */}
      <g>
        <line x1={isoPt(12, 47, 13.5)[0]} y1={isoPt(12, 47, 13.5)[1]} x2={isoPt(28, 47, 13.5)[0]} y2={isoPt(28, 47, 13.5)[1]} stroke="#78350f" strokeWidth="1.2" />
        <FaceSW x1={13} x2={27} y={47} z1={7} z2={13.5} fill="#1d4ed8" sw={0.9} />
        <line x1={isoPt(17.7, 47.1, 7)[0]} y1={isoPt(17.7, 47.1, 7)[1]} x2={isoPt(17.7, 47.1, 13.5)[0]} y2={isoPt(17.7, 47.1, 13.5)[1]} stroke="#1e3a8a" strokeWidth="0.8" />
        <line x1={isoPt(22.3, 47.1, 7)[0]} y1={isoPt(22.3, 47.1, 7)[1]} x2={isoPt(22.3, 47.1, 13.5)[0]} y2={isoPt(22.3, 47.1, 13.5)[1]} stroke="#1e3a8a" strokeWidth="0.8" />
        <circle cx={isoPt(20, 47.2, 10.2)[0]} cy={isoPt(20, 47.2, 10.2)[1]} r="2.2" fill="none" stroke="#f8fafc" strokeWidth="0.9" />
      </g>
      {/* 茅葺き屋根 */}
      <polygon points={`${iso3(4, 4, 16)} ${iso3(56, 4, 16)} ${iso3(56, 27, 26)} ${iso3(4, 27, 26)}`} fill="#92400e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(4, 50, 16)} ${iso3(56, 50, 16)} ${iso3(56, 27, 26)} ${iso3(4, 27, 26)}`} fill="#b45309" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(56, 4, 16)} ${iso3(56, 27, 26)} ${iso3(56, 50, 16)} ${iso3(56, 50, 14)} ${iso3(56, 27, 24)} ${iso3(56, 4, 14)}`} fill="#78350f" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 岩風呂 */}
      <g>
        {/* 岩の縁 */}
        {[[60, 52, 5], [74, 46, 6], [88, 54, 5], [92, 68, 6], [88, 84, 5], [72, 92, 6], [58, 86, 5], [54, 68, 6]].map(([rx, ry, rs], i) => (
          <g key={i} transform={`translate(${isoPt(rx, ry, 0)[0].toFixed(1)}, ${isoPt(rx, ry, 0)[1].toFixed(1)})`}>
            <path d={`M ${-rs},0 Q ${-rs},${-rs * 1.2} 0,${-rs * 1.3} Q ${rs},${-rs * 1.2} ${rs},0 Q 0,${rs * 0.5} ${-rs},0 Z`}
              fill={i % 2 === 0 ? '#78716c' : '#57534e'} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          </g>
        ))}
        {/* 湯面 */}
        <ellipse cx={isoPt(73, 69, 0.5)[0]} cy={isoPt(73, 69, 0.5)[1]} rx="14" ry="7" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.9" />
        <path d={`M ${isoPt(66, 66, 0.6)[0]},${isoPt(66, 66, 0.6)[1]} q 4,-1.6 8,0 M ${isoPt(70, 74, 0.6)[0]},${isoPt(70, 74, 0.6)[1]} q 4,-1.6 8,0`}
          fill="none" stroke="#e0f2fe" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        {/* 湯気 */}
        {[[68, 64], [78, 70]].map(([mx, my], i) => (
          <path key={i} d={`M ${isoPt(mx, my, 2)[0]},${isoPt(mx, my, 2)[1]} c -2,-4 2,-6 0,-10 c -2,-4 2,-6 0,-9`}
            fill="none" stroke="#f8fafc" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
        ))}
      </g>
      {/* 桶とタオル */}
      <g transform={`translate(${isoPt(48, 88, 0)[0].toFixed(1)}, ${isoPt(48, 88, 0)[1].toFixed(1)})`}>
        <path d="M -3.6,-4.4 L -3,0 A 3,1.4 0 0 0 3,0 L 3.6,-4.4 Z" fill="#d6bc8b" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
        <ellipse cx="0" cy="-4.4" rx="3.6" ry="1.7" fill="#b49468" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="-2.4" y="-7.4" width="4.8" height="2.2" rx="0.6" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.7" />
      </g>
      {/* 竹垣 */}
      {[8, 20, 32].map(y => (
        <line key={y} x1={isoPt(96, y, 0)[0]} y1={isoPt(96, y, 0)[1]} x2={isoPt(96, y, 9)[0]} y2={isoPt(96, y, 9)[1]} stroke="#15803d" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      <line x1={isoPt(96, 4, 7)[0]} y1={isoPt(96, 4, 7)[1]} x2={isoPt(96, 36, 7)[0]} y2={isoPt(96, 36, 7)[1]} stroke="#166534" strokeWidth="1.1" />
      <line x1={isoPt(96, 4, 3.5)[0]} y1={isoPt(96, 4, 3.5)[1]} x2={isoPt(96, 36, 3.5)[0]} y2={isoPt(96, 36, 3.5)[1]} stroke="#166534" strokeWidth="1.1" />
    </g>
  </svg>
);

export const SvgObservatory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={38} />
      {/* 星見の丘 */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#1e1b4b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {[[22, 30], [78, 24], [24, 76], [82, 70], [50, 88]].map(([sx0, sy0], i) => (
        <path key={i} d={`M ${isoPt(sx0, sy0, 0.2)[0] - 1.4},${isoPt(sx0, sy0, 0.2)[1]} L ${isoPt(sx0, sy0, 0.2)[0] + 1.4},${isoPt(sx0, sy0, 0.2)[1]} M ${isoPt(sx0, sy0, 0.2)[0]},${isoPt(sx0, sy0, 0.2)[1] - 1.4} L ${isoPt(sx0, sy0, 0.2)[0]},${isoPt(sx0, sy0, 0.2)[1] + 1.4}`}
          stroke="#a5b4fc" strokeWidth="0.7" strokeLinecap="round" opacity="0.85" />
      ))}
      {/* 管理棟 */}
      <IsoCube x={62} y={50} w={30} d={30} h={13} top="#cbd5e1" left="#f1f5f9" right="#cbd5e1" sw={1} />
      <WinSW x1={66} x2={76} y={80.2} z1={4} z2={10.5} />
      <FaceSE x={92.2} y1={58} y2={68} z1={0} z2={10} fill="#334155" sw={0.8} />
      <IsoCube x={60} y={48} w={34} d={34} z={13} h={2.5} top="#64748b" left="#94a3b8" right="#475569" sw={0.9} />
      {/* 観測ドームの円筒基部 */}
      <g transform={`translate(${isoPt(38, 36, 0)[0].toFixed(1)}, ${isoPt(38, 36, 0)[1].toFixed(1)})`}>
        <path d="M -16,0 L -16,-24 A 16,6.4 0 0 1 16,-24 L 16,0 A 16,6.4 0 0 1 -16,0 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M 0,6.4 A 16,6.4 0 0 0 16,0 L 16,-24 L 0,-24 Z" fill="#94a3b8" opacity="0.6" />
        <path d="M -16,0 L -16,-24 A 16,6.4 0 0 1 16,-24 L 16,0 A 16,6.4 0 0 1 -16,0 Z" fill="none" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        {/* ドア */}
        <path d="M -4,4.6 L -4,-6 A 4,3.4 0 0 1 4,-6 L 4,4.6 Z" fill="#334155" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 回転ドーム（スリット付き） */}
        <path d="M -18,-24 A 18,7.2 0 0 1 18,-24 A 18,18 0 0 0 -18,-24 Z" fill="#0f766e" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M 0,-42 A 18,18 0 0 1 18,-24 A 18,7.2 0 0 0 9,-30.2 Z" fill="#115e59" opacity="0.75" />
        <path d="M -18,-24 A 18,18 0 0 1 18,-24" fill="none" stroke="#1e293b" strokeWidth="1.3" />
        {/* 観測スリット */}
        <path d="M -4,-41.4 L -4,-28.6 A 16,6 0 0 1 4,-28.4 L 4,-41.4 A 8,8 0 0 0 -4,-41.4 Z" fill="#020617" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 望遠鏡の筒先 */}
        <g transform="rotate(-24 0 -34)">
          <rect x="-2.2" y="-46" width="4.4" height="9" rx="1" fill="#f59e0b" stroke="#1e293b" strokeWidth="0.9" />
          <ellipse cx="0" cy="-46" rx="2.2" ry="0.9" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.7" />
        </g>
      </g>
      {/* 月 */}
      <g transform={`translate(${isoPt(80, 8, 34)[0].toFixed(1)}, ${isoPt(80, 8, 34)[1].toFixed(1)})`}>
        <path d="M 0,-4.6 A 4.6,4.6 0 1 0 4.6,0 A 3.6,3.6 0 0 1 0,-4.6 Z" fill="#fde047" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgShoppingStreet = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 石畳の通り */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 4, 0.1)} ${iso3(64, 4, 0.1)} ${iso3(64, 96, 0.1)} ${iso3(36, 96, 0.1)}`} fill="#d6d3d1" />
      {/* 左列の店（2軒） */}
      {[[8, '#f97316', '#ffedd5'], [8, '#0ea5e9', '#e0f2fe']].map(([x0, awn, wall], i) => {
        const y0 = 10 + i * 40;
        return (
          <g key={i}>
            <IsoCube x={8} y={y0} w={24} d={28} h={14} top={darken(wall, 15)} left={wall} right={darken(wall, 35)} sw={1} />
            <FaceSE x={32.2} y1={y0 + 4} y2={y0 + 13} z1={2} z2={10} fill="#7dd3fc" sw={0.7} />
            <FaceSE x={32.2} y1={y0 + 16} y2={y0 + 24} z1={0} z2={10} fill="#78350f" sw={0.7} />
            {/* 通りに面したひさし（南東向き） */}
            {[0, 1, 2, 3].map(s => (
              <polygon key={s} points={`${iso3(32, y0 + 2 + s * 6.5, 12)} ${iso3(32, y0 + 2 + (s + 1) * 6.5, 12)} ${iso3(37, y0 + 2 + (s + 1) * 6.5, 9)} ${iso3(37, y0 + 2 + s * 6.5, 9)}`}
                fill={s % 2 === 0 ? awn : '#f8fafc'} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
            ))}
            <IsoCube x={6} y={y0 - 2} w={28} d={32} z={14} h={2.5} top={darken(wall, 45)} left={darken(wall, 30)} right={darken(wall, 55)} sw={0.8} />
          </g>
        );
      })}
      {/* 右列の店（2軒） */}
      {[['#ec4899', '#fdf2f8'], ['#22c55e', '#f0fdf4']].map(([awn, wall], i) => {
        const y0 = 14 + i * 40;
        return (
          <g key={i}>
            <IsoCube x={68} y={y0} w={24} d={28} h={14} top={darken(wall, 15)} left={darken(wall, 8)} right={darken(wall, 35)} sw={1} />
            {/* 通り側（南西…ではなく左面が通り側になるため、左面に店構え） */}
            <FaceSW x1={71} x2={80} y={y0 + 28.2} z1={2} z2={10} fill="#7dd3fc" sw={0.7} />
            <FaceSW x1={83} x2={89} y={y0 + 28.2} z1={0} z2={10} fill="#78350f" sw={0.7} />
            <AwningSW x1={69} x2={91} y={y0 + 28} z={12} c1={awn} c2="#f8fafc" depth={5} drop={2.5} stripes={4} />
            <IsoCube x={66} y={y0 - 2} w={28} d={32} z={14} h={2.5} top={darken(wall, 45)} left={darken(wall, 30)} right={darken(wall, 55)} sw={0.8} />
          </g>
        );
      })}
      {/* アーケードゲート */}
      <g>
        <IsoCube x={30} y={88} w={6} d={6} h={20} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <IsoCube x={64} y={88} w={6} d={6} h={20} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <path d={`M ${iso3(28, 91, 20)} Q ${iso3(50, 91, 32)} ${iso3(72, 91, 20)} L ${iso3(72, 91, 25)} Q ${iso3(50, 91, 37)} ${iso3(28, 91, 25)} Z`}
          fill="#ef4444" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <FaceSW x1={40} x2={60} y={91.2} z1={24.5} z2={31} fill="#fef3c7" sw={0.9} />
        {/* 提灯 */}
        {[36, 50, 64].map(x => (
          <g key={x} transform={`translate(${isoPt(x, 91.4, 21)[0].toFixed(1)}, ${isoPt(x, 91.4, 21)[1].toFixed(1)})`}>
            <line x1="0" y1="-1.6" x2="0" y2="0" stroke="#1e293b" strokeWidth="0.7" />
            <ellipse cx="0" cy="2.6" rx="2.2" ry="2.8" fill="#f97316" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="-2" y1="1.8" x2="2" y2="1.8" stroke="#7c2d12" strokeWidth="0.5" />
            <line x1="-2.2" y1="2.8" x2="2.2" y2="2.8" stroke="#7c2d12" strokeWidth="0.5" />
          </g>
        ))}
      </g>
      {/* 買い物客の自転車 */}
      <g transform={`translate(${isoPt(50, 30, 0)[0].toFixed(1)}, ${isoPt(50, 30, 0)[1].toFixed(1)}) scale(0.4)`}>
        <circle cx="-10.5" cy="1" r="9" fill="none" stroke="#1e293b" strokeWidth="2.6" />
        <circle cx="10.5" cy="1" r="9" fill="none" stroke="#1e293b" strokeWidth="2.6" />
        <path d="M -10.5,1 L -3,-9 L 8,-9 M -3,-9 L 2,1 L 10.5,1 M -10.5,1 L -3.5,-12" fill="none" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

export const SvgZenGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 木枠 */}
      <IsoCube x={4} y={4} w={92} d={92} h={3.5} top="#b45309" left="#92400e" right="#78350f" sw={1} />
      {/* 白砂 */}
      <polygon points={`${iso3(10, 10, 3.6)} ${iso3(90, 10, 3.6)} ${iso3(90, 90, 3.6)} ${iso3(10, 90, 3.6)}`} fill="#fef9c3" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 砂紋（縦の流れ） */}
      {[24, 34, 44, 54, 64, 74].map(y => (
        <line key={y} x1={isoPt(13, y, 3.7)[0]} y1={isoPt(13, y, 3.7)[1]} x2={isoPt(87, y, 3.7)[0]} y2={isoPt(87, y, 3.7)[1]} stroke="#eab308" strokeWidth="0.6" opacity="0.65" />
      ))}
      {/* 岩の周りの波紋＋岩（メイン） */}
      <g>
        <ellipse cx={isoPt(38, 40, 3.8)[0]} cy={isoPt(38, 40, 3.8)[1]} rx="17" ry="8" fill="none" stroke="#eab308" strokeWidth="0.7" opacity="0.8" />
        <ellipse cx={isoPt(38, 40, 3.8)[0]} cy={isoPt(38, 40, 3.8)[1]} rx="12" ry="5.6" fill="none" stroke="#ca8a04" strokeWidth="0.7" opacity="0.8" />
        <g transform={`translate(${isoPt(38, 40, 3.8)[0].toFixed(1)}, ${isoPt(38, 40, 3.8)[1].toFixed(1)})`}>
          <path d="M -7,0 Q -7.6,-6 -3,-9 Q 2,-11.6 6,-7 Q 8.4,-4 6.6,-0.6 Q 2,2.6 -7,0 Z" fill="#57534e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M -3,-9 Q 2,-11.6 6,-7 L 2.6,-4.6 Q -1,-7.6 -3,-9 Z" fill="#78716c" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
          <path d="M -5,-1 Q -2,0.6 2,0" fill="none" stroke="#a3e635" strokeWidth="1" strokeLinecap="round" opacity="0.9" />
        </g>
      </g>
      {/* 岩（サブ2つ） */}
      <g transform={`translate(${isoPt(66, 62, 3.8)[0].toFixed(1)}, ${isoPt(66, 62, 3.8)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="0" rx="10" ry="4.6" fill="none" stroke="#eab308" strokeWidth="0.6" opacity="0.8" />
        <path d="M -4,-0.6 Q -4.4,-4.4 -1,-5.6 Q 2.6,-6.6 4,-3.4 Q 4.8,-1 3,0.4 Q -0.6,1.6 -4,-0.6 Z" fill="#78716c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      </g>
      <g transform={`translate(${isoPt(74, 26, 3.8)[0].toFixed(1)}, ${isoPt(74, 26, 3.8)[1].toFixed(1)})`}>
        <path d="M -2.6,-0.4 Q -2.8,-3 -0.6,-3.8 Q 1.8,-4.4 2.6,-2.2 Q 3,-0.6 1.8,0.4 Q -0.6,1 -2.6,-0.4 Z" fill="#57534e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 苔とモミジ */}
      <g transform={`translate(${isoPt(20, 76, 3.8)[0].toFixed(1)}, ${isoPt(20, 76, 3.8)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="0" rx="7" ry="3.2" fill="#16a34a" stroke="#1e293b" strokeWidth="0.9" />
        <ellipse cx="-2" cy="-1" rx="3" ry="1.4" fill="#4ade80" opacity="0.8" />
        <line x1="3" y1="-1" x2="3" y2="-9" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="3" cy="-11.5" r="4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.9" />
        <circle cx="1.4" cy="-12.6" r="1.6" fill="#f87171" opacity="0.9" />
      </g>
      {/* 石灯篭（隅） */}
      <g transform={`translate(${isoPt(84, 82, 3.8)[0].toFixed(1)}, ${isoPt(84, 82, 3.8)[1].toFixed(1)})`}>
        <line x1="0" y1="0" x2="0" y2="-4.6" stroke="#78716c" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="-2" y="-7.8" width="4" height="3.2" rx="0.5" fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="0" cy="-6.2" r="0.9" fill="#fef08a" />
        <polygon points="-2.8,-7.8 2.8,-7.8 0,-10" fill="#78716c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      </g>
      {/* 熊手 */}
      <g transform={`translate(${isoPt(88, 46, 3.8)[0].toFixed(1)}, ${isoPt(88, 46, 3.8)[1].toFixed(1)}) rotate(24)`}>
        <line x1="0" y1="0" x2="0" y2="-11" stroke="#b45309" strokeWidth="1" strokeLinecap="round" />
        <path d="M -2.6,0 L 2.6,0 M -2.6,0 L -2.6,2 M 0,0 L 0,2 M 2.6,0 L 2.6,2" stroke="#92400e" strokeWidth="0.8" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

export const SvgNationalLibrary = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-lg" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.2)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="38" ry="19" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-4 -32,-20 0,-36 32,-20" fill="#cbd5e1" /><polygon points="0,-15 -28,-29 -28,-45 0,-31" fill="#fde68a" /><polygon points="0,-15 28,-29 28,-45 0,-31" fill="#fef08a" /><polygon points="0,-33 -30,-48 0,-60 30,-48" fill="#d6d3d1" /><polygon points="0,-31 -30,-46 -30,-48 0,-33" fill="#94a3b8" /><polygon points="0,-31 30,-46 30,-48 0,-33" fill="#cbd5e1" /><g transform="translate(0, -42)"><polygon points="0,0 -12,-6 -12,-12 0,-6" fill="#d4d4d8" /><polygon points="0,0 12,-6 12,-12 0,-6" fill="#e4e4e7" /><path d="M -12,-12 C -12,-28 12,-28 12,-12" fill="#0f766e" /><polygon points="-2,-27 2,-27 2,-30 -2,-30" fill="#e2e8f0" /><polygon points="-3,-30 3,-30 0,-33" fill="#0f766e" /></g></g></svg>);

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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 前庭と石畳アプローチ */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(42, 60, 0.1)} ${iso3(58, 60, 0.1)} ${iso3(58, 98, 0.1)} ${iso3(42, 98, 0.1)}`} fill="#d6d3d1" />
      {/* 本館 */}
      <IsoCube x={10} y={8} w={80} d={52} h={26} top="#cbd5e1" left="#f8fafc" right="#e2e8f0" sw={1.1} />
      <FaceSW x1={10} x2={90} y={60} z1={0} z2={4} fill="#94a3b8" sw={0.9} />
      {/* 窓列（1階・2階） */}
      {[[16, 24], [30, 38], [62, 70], [76, 84]].map(([a, b], i) => (
        <WinSW key={`w1-${i}`} x1={a} x2={b} y={60.2} z1={6} z2={13} />
      ))}
      {[[16, 24], [30, 38], [46, 54], [62, 70], [76, 84]].map(([a, b], i) => (
        <WinSW key={`w2-${i}`} x1={a} x2={b} y={60.2} z1={16.5} z2={23.5} />
      ))}
      {/* 玄関ポルチコ（柱＋三角ペディメント） */}
      <FaceSW x1={44} x2={56} y={60.3} z1={0} z2={12} fill="#1e293b" sw={1} />
      <FaceSW x1={45.5} x2={49.5} y={60.5} z1={1} z2={11} fill="#7dd3fc" sw={0.5} />
      <FaceSW x1={50.5} x2={54.5} y={60.5} z1={1} z2={11} fill="#7dd3fc" sw={0.5} />
      {[40, 60].map(x => (
        <g key={x}>
          <polygon points={`${iso3(x - 1.6, 66, 0)} ${iso3(x + 1.6, 66, 0)} ${iso3(x + 1.6, 66, 13)} ${iso3(x - 1.6, 66, 13)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        </g>
      ))}
      <polygon points={`${iso3(35, 67, 13)} ${iso3(65, 67, 13)} ${iso3(65, 67, 16)} ${iso3(35, 67, 16)}`} fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(35, 67, 16)} ${iso3(65, 67, 16)} ${iso3(50, 67, 24)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 屋根 */}
      <IsoCube x={8} y={6} w={84} d={56} z={26} h={3} top="#64748b" left="#94a3b8" right="#475569" sw={1} />
      {/* 中央の時計塔 */}
      <IsoCube x={40} y={20} w={20} d={20} z={29} h={16} top="#e2e8f0" left="#f8fafc" right="#e2e8f0" sw={1} />
      <g transform={`translate(${isoPt(50, 40.2, 37.5)[0].toFixed(1)}, ${isoPt(50, 40.2, 37.5)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="3.6" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.9" />
        <line x1="0" y1="0" x2="0" y2="-2.2" stroke="#1e293b" strokeWidth="0.7" strokeLinecap="round" />
        <line x1="0" y1="0" x2="1.6" y2="0.8" stroke="#1e293b" strokeWidth="0.7" strokeLinecap="round" />
      </g>
      {/* 塔の屋根（青い方形屋根＋旗） */}
      <polygon points={`${iso3(37, 17, 45)} ${iso3(63, 17, 45)} ${iso3(50, 30, 56)}`} fill="#3b82f6" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(63, 17, 45)} ${iso3(63, 43, 45)} ${iso3(50, 30, 56)}`} fill="#1d4ed8" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <line x1={isoPt(50, 30, 56)[0]} y1={isoPt(50, 30, 56)[1]} x2={isoPt(50, 30, 66)[0]} y2={isoPt(50, 30, 66)[1]} stroke="#1e293b" strokeWidth="1" />
      <polygon points={`${isoPt(50, 30, 66)[0]},${isoPt(50, 30, 66)[1]} ${isoPt(50, 30, 66)[0] + 6.5},${isoPt(50, 30, 66)[1] + 1.6} ${isoPt(50, 30, 66)[0]},${isoPt(50, 30, 66)[1] + 3.2}`} fill="#ef4444" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      {/* 両脇の植木 */}
      {[[24, 68], [76, 68]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 0)[0].toFixed(1)}, ${isoPt(bx, by, 0)[1].toFixed(1)})`}>
          <polygon points="-3,0 3,0 2.2,-3.6 -2.2,-3.6" fill="#78716c" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <circle cx="0" cy="-6.6" r="4" fill="#16a34a" stroke="#1e293b" strokeWidth="0.9" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgEmbassy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 敷地（芝生＋石畳） */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(40, 56, 0.1)} ${iso3(60, 56, 0.1)} ${iso3(60, 98, 0.1)} ${iso3(40, 98, 0.1)}`} fill="#e7e5e4" />
      {/* 鉄柵（手前2辺） */}
      {[10, 24, 38, 62, 76, 90].map(y => (
        <line key={`f1-${y}`} x1={isoPt(97, y, 0)[0]} y1={isoPt(97, y, 0)[1]} x2={isoPt(97, y, 6)[0]} y2={isoPt(97, y, 6)[1]} stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />
      ))}
      <line x1={isoPt(97, 4, 5)[0]} y1={isoPt(97, 4, 5)[1]} x2={isoPt(97, 96, 5)[0]} y2={isoPt(97, 96, 5)[1]} stroke="#334155" strokeWidth="1.2" />
      {[10, 24, 66, 80, 92].map(x => (
        <line key={`f2-${x}`} x1={isoPt(x, 97, 0)[0]} y1={isoPt(x, 97, 0)[1]} x2={isoPt(x, 97, 6)[0]} y2={isoPt(x, 97, 6)[1]} stroke="#1e293b" strokeWidth="1" strokeLinecap="round" />
      ))}
      <line x1={isoPt(4, 97, 5)[0]} y1={isoPt(4, 97, 5)[1]} x2={isoPt(36, 97, 5)[0]} y2={isoPt(36, 97, 5)[1]} stroke="#334155" strokeWidth="1.2" />
      <line x1={isoPt(62, 97, 5)[0]} y1={isoPt(62, 97, 5)[1]} x2={isoPt(96, 97, 5)[0]} y2={isoPt(96, 97, 5)[1]} stroke="#334155" strokeWidth="1.2" />
      {/* 洋館本体 */}
      <IsoCube x={12} y={8} w={76} d={48} h={24} top="#e2e8f0" left="#f8fafc" right="#e7e5e4" sw={1.1} />
      <FaceSW x1={12} x2={88} y={56} z1={0} z2={3.5} fill="#a8a29e" sw={0.9} />
      {/* 窓（アーチ窓風） */}
      {[[18, 26], [32, 40], [60, 68], [74, 82]].map(([a, b], i) => (
        <g key={i}>
          <WinSW x1={a} x2={b} y={56.2} z1={7} z2={15} />
          <FaceSW x1={a} x2={b} y={56.2} z1={15} z2={17} fill="#cbd5e1" sw={0.7} />
        </g>
      ))}
      {/* 中央玄関（両開き扉＋庇） */}
      <FaceSW x1={44} x2={56} y={56.3} z1={0} z2={13} fill="#7c2d12" sw={1} />
      <line x1={isoPt(50, 56.4, 0)[0]} y1={isoPt(50, 56.4, 0)[1]} x2={isoPt(50, 56.4, 13)[0]} y2={isoPt(50, 56.4, 13)[1]} stroke="#1e293b" strokeWidth="0.8" />
      <circle cx={isoPt(48, 56.5, 6.5)[0]} cy={isoPt(48, 56.5, 6.5)[1]} r="0.7" fill="#fbbf24" />
      <circle cx={isoPt(52, 56.5, 6.5)[0]} cy={isoPt(52, 56.5, 6.5)[1]} r="0.7" fill="#fbbf24" />
      <AwningSW x1={42} x2={58} y={56} z={16} c1="#1d4ed8" c2="#f8fafc" depth={6} drop={2.5} stripes={4} />
      {/* マンサード風屋根 */}
      <polygon points={`${iso3(10, 6, 24)} ${iso3(90, 6, 24)} ${iso3(84, 12, 34)} ${iso3(16, 12, 34)}`} fill="#334155" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" transform="translate(0,0)" />
      <polygon points={`${iso3(10, 58, 24)} ${iso3(90, 58, 24)} ${iso3(84, 52, 34)} ${iso3(16, 52, 34)}`} fill="#475569" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(90, 6, 24)} ${iso3(90, 58, 24)} ${iso3(84, 52, 34)} ${iso3(84, 12, 34)}`} fill="#1e293b" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(16, 12, 34)} ${iso3(84, 12, 34)} ${iso3(84, 52, 34)} ${iso3(16, 52, 34)}`} fill="#64748b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 屋根窓 */}
      <FaceSW x1={30} x2={38} y={57} z1={26} z2={31} fill="#f8fafc" sw={0.9} />
      <FaceSW x1={62} x2={70} y={57} z1={26} z2={31} fill="#f8fafc" sw={0.9} />
      {/* 国旗ポール */}
      <line x1={isoPt(50, 32, 34)[0]} y1={isoPt(50, 32, 34)[1]} x2={isoPt(50, 32, 52)[0]} y2={isoPt(50, 32, 52)[1]} stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" />
      <polygon points={`${isoPt(50, 32, 52)[0]},${isoPt(50, 32, 52)[1]} ${isoPt(50, 32, 52)[0] + 9},${isoPt(50, 32, 52)[1] + 1.2} ${isoPt(50, 32, 52)[0] + 9},${isoPt(50, 32, 52)[1] + 5} ${isoPt(50, 32, 52)[0]},${isoPt(50, 32, 52)[1] + 3.8}`} fill="#3b82f6" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      <circle cx={isoPt(50, 32, 52)[0] + 4.5} cy={isoPt(50, 32, 52)[1] + 3} r="1.1" fill="#fef08a" />
    </g>
  </svg>
);

export const SvgDepartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 本体（4フロア） */}
      <IsoCube x={12} y={10} w={76} d={70} h={42} top="#f1f5f9" left="#fef2f2" right="#fee2e2" sw={1.1} />
      {/* 各階のガラスバンド（南西面） */}
      {[4, 15, 26, 37].map((z, f) => (
        <g key={z}>
          <FaceSW x1={15} x2={85} y={80.2} z1={z} z2={z + 7.5} fill={f === 0 ? 'url(#grad-glass)' : '#bae6fd'} sw={0.7} />
          <FaceSW x1={15} x2={85} y={80.2} z1={z + 7.5} z2={z + 9.5} fill="#f87171" sw={0.6} />
          {[32, 50, 68].map(x => (
            <line key={x} x1={isoPt(x, 80.3, z)[0]} y1={isoPt(x, 80.3, z)[1]} x2={isoPt(x, 80.3, z + 7.5)[0]} y2={isoPt(x, 80.3, z + 7.5)[1]} stroke="#64748b" strokeWidth="0.6" />
          ))}
        </g>
      ))}
      {/* 南東面のガラスバンド */}
      {[4, 15, 26, 37].map(z => (
        <FaceSE key={z} x={88.2} y1={14} y2={76} z1={z} z2={z + 7.5} fill="#7dd3fc" sw={0.7} />
      ))}
      {/* エントランス（回転ドア風） */}
      <FaceSW x1={40} x2={60} y={80.4} z1={0} z2={10} fill="#0f172a" sw={1} />
      <FaceSW x1={43} x2={49} y={80.6} z1={1} z2={9} fill="#e0f2fe" sw={0.5} />
      <FaceSW x1={51} x2={57} y={80.6} z1={1} z2={9} fill="#bae6fd" sw={0.5} />
      <AwningSW x1={36} x2={64} y={80} z={11.5} c1="#ef4444" c2="#f8fafc" depth={7} drop={2.5} stripes={7} />
      {/* 屋上＋看板 */}
      <IsoCube x={10} y={8} w={80} d={74} z={42} h={3} top="#e2e8f0" left="#f1f5f9" right="#cbd5e1" sw={0.9} />
      <FaceSW x1={28} x2={36} y={40} z1={45} z2={50} fill="#7f1d1d" sw={0.7} />
      <FaceSW x1={64} x2={72} y={40} z1={45} z2={50} fill="#7f1d1d" sw={0.7} />
      <FaceSW x1={22} x2={78} y={40} z1={49} z2={64} fill="#ef4444" sw={1.1} />
      <FaceSW x1={25} x2={75} y={40.2} z1={51} z2={62} fill="#fef2f2" sw={0.6} />
      {/* 看板のギフトボックスグリフ */}
      <g transform={`translate(${isoPt(50, 40.2, 56.5)[0].toFixed(1)}, ${isoPt(50, 40.2, 56.5)[1].toFixed(1)})`}>
        <rect x="-4.6" y="-2.6" width="9.2" height="6.4" rx="0.8" fill="#f472b6" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="-5.4" y="-4.4" width="10.8" height="2.4" rx="0.7" fill="#ec4899" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="0" y1="-4.4" x2="0" y2="3.8" stroke="#fef08a" strokeWidth="1.4" />
        <path d="M 0,-4.6 C -3,-7.6 -6,-5 -2.6,-4.4 M 0,-4.6 C 3,-7.6 6,-5 2.6,-4.4" fill="none" stroke="#fef08a" strokeWidth="1.1" />
      </g>
      {/* 旗の列 */}
      {[24, 40, 60, 76].map((x, i) => (
        <g key={x}>
          <line x1={isoPt(x, 78, 45)[0]} y1={isoPt(x, 78, 45)[1]} x2={isoPt(x, 78, 53)[0]} y2={isoPt(x, 78, 53)[1]} stroke="#475569" strokeWidth="0.8" />
          <polygon points={`${isoPt(x, 78, 53)[0]},${isoPt(x, 78, 53)[1]} ${isoPt(x, 78, 53)[0] + 4.6},${isoPt(x, 78, 53)[1] + 1.1} ${isoPt(x, 78, 53)[0]},${isoPt(x, 78, 53)[1] + 2.2}`} fill={['#ef4444', '#facc15', '#22c55e', '#3b82f6'][i]} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgUniversity = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      {/* キャンパス敷地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(44, 56, 0.1)} ${iso3(56, 56, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" />
      {/* 両翼（低層） */}
      <IsoCube x={6} y={16} w={26} d={40} h={16} top="#b91c1c" left="#dc2626" right="#991b1b" sw={1} />
      <IsoCube x={68} y={16} w={26} d={40} h={16} top="#b91c1c" left="#dc2626" right="#991b1b" sw={1} />
      {[[10, 16], [22, 28]].map(([a, b], i) => <WinSW key={`lw-${i}`} x1={a} x2={b} y={56.2} z1={5} z2={12} />)}
      {[[72, 78], [84, 90]].map(([a, b], i) => <WinSW key={`rw-${i}`} x1={a} x2={b} y={56.2} z1={5} z2={12} />)}
      <WinSE x={94.2} y1={24} y2={40} z1={5} z2={12} />
      {/* 中央本館（れんが造り） */}
      <IsoCube x={30} y={10} w={40} d={46} h={26} top="#e7e5e4" left="#ef4444" right="#b91c1c" sw={1.1} />
      <FaceSW x1={30} x2={70} y={56} z1={0} z2={3.5} fill="#78716c" sw={0.9} />
      {/* 本館の窓（白枠アーチ） */}
      {[[34, 41], [59, 66]].map(([a, b], i) => (
        <g key={i}>
          <WinSW x1={a} x2={b} y={56.2} z1={7} z2={15} />
          <WinSW x1={a} x2={b} y={56.2} z1={18} z2={23} />
        </g>
      ))}
      {/* 正面玄関（石造アーチ） */}
      <FaceSW x1={44} x2={56} y={56.3} z1={0} z2={14} fill="#e7e5e4" sw={1} />
      <FaceSW x1={46} x2={54} y={56.5} z1={0} z2={11} fill="#1c1917" sw={0.9} />
      <path d={`M ${iso3(46, 56.6, 11)} Q ${iso3(50, 56.6, 15.5)} ${iso3(54, 56.6, 11)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="0.8" />
      {/* 本館屋根＋時計搭 */}
      <IsoCube x={28} y={8} w={44} d={50} z={26} h={3} top="#64748b" left="#94a3b8" right="#475569" sw={1} />
      <IsoCube x={42} y={22} w={16} d={16} z={29} h={12} top="#e7e5e4" left="#f5f5f4" right="#d6d3d1" sw={1} />
      <g transform={`translate(${isoPt(50, 38.2, 35)[0].toFixed(1)}, ${isoPt(50, 38.2, 35)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="3" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="0" y2="-1.8" stroke="#1e293b" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="1.3" y2="0.6" stroke="#1e293b" strokeWidth="0.6" strokeLinecap="round" />
      </g>
      {/* 緑青ドーム */}
      <path d={`M ${iso3(40, 30, 41)} C ${iso3(40, 30, 55)} ${iso3(60, 30, 55)} ${iso3(60, 30, 41)} Z`} fill="#0f766e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(50, 30, 51.5)} C ${iso3(56, 30, 51)} ${iso3(60, 30, 46)} ${iso3(60, 30, 41)} L ${iso3(50, 30, 41)} Z`} fill="#14b8a6" opacity="0.7" />
      <line x1={isoPt(50, 30, 51.5)[0]} y1={isoPt(50, 30, 51.5)[1]} x2={isoPt(50, 30, 57)[0]} y2={isoPt(50, 30, 57)[1]} stroke="#1e293b" strokeWidth="0.9" />
      <circle cx={isoPt(50, 30, 58)[0]} cy={isoPt(50, 30, 58)[1]} r="1.2" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" />
      {/* 両翼の屋根 */}
      <IsoCube x={4} y={14} w={30} d={44} z={16} h={2.5} top="#475569" left="#64748b" right="#334155" sw={0.9} />
      <IsoCube x={66} y={14} w={30} d={44} z={16} h={2.5} top="#475569" left="#64748b" right="#334155" sw={0.9} />
      {/* 並木 */}
      {[[22, 78], [78, 78]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 0)[0].toFixed(1)}, ${isoPt(bx, by, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-7" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="0" cy="-10.5" r="5.4" fill="#16a34a" stroke="#1e293b" strokeWidth="1" />
          <circle cx="-1.8" cy="-12" r="2.2" fill="#4ade80" opacity="0.8" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgLibrary = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 本体（クリーム色の石造り） */}
      <IsoCube x={12} y={12} w={76} d={60} h={24} top="#fde68a" left="#fef3c7" right="#fde68a" sw={1.1} />
      <FaceSW x1={12} x2={88} y={72} z1={0} z2={3.5} fill="#b45309" sw={0.9} />
      {/* アーチ窓の列 */}
      {[[17, 25], [30, 38], [62, 70], [75, 83]].map(([a, b], i) => (
        <g key={i}>
          <FaceSW x1={a} x2={b} y={72.2} z1={6} z2={16} fill="#f8fafc" sw={0.9} />
          <FaceSW x1={a + 1} x2={b - 1} y={72.4} z1={7} z2={14} fill="#7dd3fc" sw={0.5} />
          <path d={`M ${iso3(a + 1, 72.4, 14)} Q ${iso3((a + b) / 2, 72.4, 17)} ${iso3(b - 1, 72.4, 14)}`} fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.6" />
        </g>
      ))}
      {/* 大きな玄関アーチ */}
      <FaceSW x1={42} x2={58} y={72.3} z1={0} z2={15} fill="#d97706" sw={1} />
      <FaceSW x1={44.5} x2={55.5} y={72.5} z1={0} z2={12} fill="#451a03" sw={0.8} />
      <path d={`M ${iso3(44.5, 72.6, 12)} Q ${iso3(50, 72.6, 17.5)} ${iso3(55.5, 72.6, 12)}`} fill="#451a03" stroke="#1e293b" strokeWidth="0.8" />
      {/* 屋根（緑の寄棟） */}
      <polygon points={`${iso3(8, 8, 24)} ${iso3(92, 8, 24)} ${iso3(80, 24, 34)} ${iso3(20, 24, 34)}`} fill="#15803d" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(8, 76, 24)} ${iso3(92, 76, 24)} ${iso3(80, 60, 34)} ${iso3(20, 60, 34)}`} fill="#22c55e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(92, 8, 24)} ${iso3(92, 76, 24)} ${iso3(80, 60, 34)} ${iso3(80, 24, 34)}`} fill="#166534" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(20, 24, 34)} ${iso3(80, 24, 34)} ${iso3(80, 60, 34)} ${iso3(20, 60, 34)}`} fill="#4ade80" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 屋上の本のオブジェ */}
      <g transform={`translate(${isoPt(50, 42, 36)[0].toFixed(1)}, ${isoPt(50, 42, 36)[1].toFixed(1)})`}>
        <path d="M -7,-1 C -4,-3.4 -1,-3.4 0,-1.6 C 1,-3.4 4,-3.4 7,-1 L 7,4 C 4,1.8 1,1.8 0,3.6 C -1,1.8 -4,1.8 -7,4 Z"
          fill="#3b82f6" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <line x1="0" y1="-1.6" x2="0" y2="3.6" stroke="#1e293b" strokeWidth="0.8" />
        <path d="M -5.4,-0.4 C -3.4,-1.8 -1.4,-1.8 0,-0.6 M 5.4,-0.4 C 3.4,-1.8 1.4,-1.8 0,-0.6" fill="none" stroke="#bfdbfe" strokeWidth="0.7" />
      </g>
      {/* 玄関前の階段 */}
      <polygon points={`${iso3(40, 72, 0)} ${iso3(60, 72, 0)} ${iso3(60, 78, 0)} ${iso3(40, 78, 0)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      {/* 返却ポスト */}
      <g transform={`translate(${isoPt(66, 80, 0)[0].toFixed(1)}, ${isoPt(66, 80, 0)[1].toFixed(1)})`}>
        <rect x="-2.6" y="-7" width="5.2" height="6" rx="0.7" fill="#3b82f6" stroke="#1e293b" strokeWidth="0.9" />
        <rect x="-1.7" y="-5.8" width="3.4" height="1" fill="#1e293b" />
      </g>
    </g>
  </svg>
);

export const SvgFountain = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 78) scale(2.4)">
      <ellipse cx="0" cy="9" rx="21" ry="8.5" fill="#020617" opacity="0.18" />
      {/* 水盤（下段・石の縁） */}
      <path d="M -19,0 A 19,8 0 0 0 19,0 L 19,5 A 19,8 0 0 1 -19,5 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" />
      <ellipse cx="0" cy="0" rx="19" ry="8" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2" />
      <ellipse cx="0" cy="0" rx="16" ry="6.6" fill="url(#grad-water)" stroke="#0369a1" strokeWidth="0.8" />
      {/* 波紋 */}
      <ellipse cx="0" cy="0" rx="11" ry="4.4" fill="none" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.85" />
      <ellipse cx="0" cy="0" rx="6.5" ry="2.6" fill="none" stroke="#bae6fd" strokeWidth="0.7" opacity="0.8" />
      {/* 支柱 */}
      <path d="M -2.6,-1 L -1.8,-12 L 1.8,-12 L 2.6,-1 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 上段の水盤 */}
      <path d="M -8.5,-12 A 8.5,3.4 0 0 0 8.5,-12 L 8.5,-9.6 A 8.5,3.4 0 0 1 -8.5,-9.6 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" />
      <ellipse cx="0" cy="-12" rx="8.5" ry="3.4" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" />
      <ellipse cx="0" cy="-12" rx="6.4" ry="2.5" fill="#7dd3fc" stroke="#0369a1" strokeWidth="0.7" />
      {/* 噴き上がる水 */}
      <path d="M 0,-13 C -1.4,-19 -1.4,-22 0,-25 C 1.4,-22 1.4,-19 0,-13 Z" fill="#bae6fd" stroke="#0284c7" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M -1,-16 C -5,-19 -6.6,-15 -7.5,-12.6" fill="none" stroke="#7dd3fc" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M 1,-16 C 5,-19 6.6,-15 7.5,-12.6" fill="none" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
      {/* 上段からあふれる水 */}
      <path d="M -8,-10.6 C -9.4,-7 -10.5,-4 -11.5,-1.6 M 8,-10.6 C 9.4,-7 10.5,-4 11.5,-1.6" fill="none" stroke="#bae6fd" strokeWidth="1.3" strokeLinecap="round" opacity="0.9" />
      {/* しぶき */}
      <circle cx="0" cy="-26.5" r="1.3" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="0.5" />
      <circle cx="-4" cy="-21" r="0.8" fill="#e0f2fe" />
      <circle cx="4.4" cy="-20" r="0.8" fill="#e0f2fe" />
      {/* コイン */}
      <ellipse cx="6" cy="1.6" rx="1.4" ry="0.7" fill="#fbbf24" stroke="#b45309" strokeWidth="0.5" />
      <ellipse cx="-7" cy="2.4" rx="1.4" ry="0.7" fill="#facc15" stroke="#b45309" strokeWidth="0.5" />
    </g>
  </svg>
);

export const SvgPond = () => <svg viewBox="0 0 100 100" className="w-full h-full"><Fl type="pond" thickness={4} /></svg>;

export const SvgStoneLantern = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.4)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="10" ry="5" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,-2 -8,-6 0,-10 8,-6" fill="#cbd5e1" /><polygon points="0,-6 -3,-7.5 -3,-20 0,-18.5" fill="#475569" /><polygon points="0,-6 3,-7.5 3,-20 0,-18.5" fill="#64748b" /><polygon points="0,-20 -6,-23 0,-26 6,-23" fill="#e2e8f0" /><polygon points="0,-21 -3,-22.5 -3,-26.5 0,-25" fill="#fef08a" filter="url(#glow-effect)" /><polygon points="0,-21 3,-22.5 3,-26.5 0,-25" fill="#fcd34d" /><polygon points="0,-26 -10,-31 0,-36 10,-31" fill="#475569" /><polygon points="0,-26 -10,-31 -10,-29 0,-24" fill="#64748b" /><polygon points="0,-26 10,-31 10,-29 0,-24" fill="#94a3b8" /><polygon points="0,-37 -2,-38 0,-40 2,-38" fill="#e2e8f0" /><circle cx="-4" cy="-5" r="1.5" fill="#15803d" opacity="0.8" /></g></svg>);

export const SvgStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="-2" rx="14" ry="7" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,-2 -12,-8 0,-14 12,-8" fill="#cbd5e1" /><polygon points="0,-2 -12,-8 -12,-10 0,-4" fill="#94a3b8" /><polygon points="0,-2 12,-8 12,-10 0,-4" fill="#e2e8f0" /><polygon points="0,-10 -3,-11.5 -3,-30 0,-28.5" fill="#94a3b8" /><polygon points="0,-10 3,-11.5 3,-30 0,-28.5" fill="#cbd5e1" /><polygon points="0,-28.5 -8,-32.5 0,-36.5 8,-32.5" fill="#e2e8f0" /><polygon points="0,-32 -2,-33 -2,-42 0,-41" fill="#94a3b8" /><polygon points="0,-32 2,-33 2,-42 0,-41" fill="#cbd5e1" /><circle cx="0" cy="-44" r="4" fill="#e2e8f0" /><circle cx="-1" cy="-45" r="0.8" fill="#475569" /><circle cx="1" cy="-45" r="0.8" fill="#475569" /></g></svg>);

export const SvgGoldenTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.3)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="20" ry="10" fill="#020617" opacity="0.4" filter="url(#soft-shadow)" /><polygon points="0,0 -14,-7 -14,-25 0,-18" fill="#d97706" /><polygon points="0,0 14,-7 14,-25 0,-18" fill="url(#grad-gold)" /><polygon points="0,-18 -14,-25 0,-32 14,-25" fill="#fcd34d" /><polygon points="0,-22 -8,-26 -8,-40 0,-36" fill="#d97706" /><polygon points="0,-22 8,-26 8,-40 0,-36" fill="url(#grad-gold)" /><polygon points="0,-36 -8,-40 0,-44 8,-40" fill="#fef08a" /><polygon points="0,-38 -5,-41 0,-48 5,-41" fill="url(#grad-gold)" /><circle cx="0" cy="-50" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></svg>);

export const SvgGuardianShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={38} />
      {/* 神秘の床 */}
      <polygon points={`${iso3(8, 8, 0)} ${iso3(92, 8, 0)} ${iso3(92, 92, 0)} ${iso3(8, 92, 0)}`} fill="#3b0764" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.2)[0]} cy={isoPt(50, 50, 0.2)[1]} rx="28" ry="13" fill="none" stroke="#c084fc" strokeWidth="0.8" opacity="0.7" />
      {/* 石の台座 */}
      <IsoCube x={24} y={24} w={52} d={52} h={7} top="#e9d5ff" left="#d8b4fe" right="#a855f7" sw={1} />
      {/* 4本の結界柱 */}
      {[[30, 30], [70, 30], [30, 70], [70, 70]].map(([px0, py0], i) => (
        <g key={i}>
          <polygon points={`${iso3(px0 - 1.8, py0, 7)} ${iso3(px0 + 1.8, py0, 7)} ${iso3(px0 + 1.8, py0, 26)} ${iso3(px0 - 1.8, py0, 26)}`}
            fill="#7e22ce" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          <circle cx={isoPt(px0, py0, 28.5)[0]} cy={isoPt(px0, py0, 28.5)[1]} r="1.8" fill="#e9d5ff" stroke="#1e293b" strokeWidth="0.7" filter="url(#glow-effect)" />
        </g>
      ))}
      {/* 注連縄（柱間） */}
      <path d={`M ${isoPt(30, 70, 24)[0]},${isoPt(30, 70, 24)[1]} Q ${isoPt(50, 70, 21)[0]},${isoPt(50, 70, 21)[1]} ${isoPt(70, 70, 24)[0]},${isoPt(70, 70, 24)[1]}`}
        fill="none" stroke="#a16207" strokeWidth="1.8" strokeLinecap="round" />
      {[40, 50, 60].map(x => (
        <polygon key={x} points={`${isoPt(x, 70, 22)[0] - 1.2},${isoPt(x, 70, 22)[1]} ${isoPt(x, 70, 22)[0] + 1.2},${isoPt(x, 70, 22)[1]} ${isoPt(x, 70, 22)[0]},${isoPt(x, 70, 22)[1] + 4}`}
          fill="#f8fafc" stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      ))}
      {/* 浮遊する守り神の宝珠 */}
      <g transform={`translate(${isoPt(50, 50, 30)[0].toFixed(1)}, ${isoPt(50, 50, 30)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="12" rx="8" ry="3" fill="#a855f7" opacity="0.3" />
        <circle cx="0" cy="0" r="8.5" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.3" filter="url(#glow-effect)" />
        <circle cx="-2.4" cy="-2.6" r="3" fill="#fef3c7" />
        {/* 炎のオーラ */}
        <path d="M -8.5,-2 Q -12,-6 -9,-10 Q -8,-6.6 -5.6,-6.4 M 8.5,-2 Q 12,-6 9,-10 Q 8,-6.6 5.6,-6.4 M 0,-8.5 Q 0,-13.6 3,-15 Q 1.4,-11 2.6,-8.2"
          fill="none" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 小さな狛犬（左右） */}
      {[[18, 84], [84, 18]].map(([sx0, sy0], i) => (
        <g key={i} transform={`translate(${isoPt(sx0, sy0, 0)[0].toFixed(1)}, ${isoPt(sx0, sy0, 0)[1].toFixed(1)})`}>
          <polygon points="-3.4,0 3.4,0 2.6,-2.6 -2.6,-2.6" fill="#d8b4fe" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M -2,-2.6 Q -2.6,-6.6 0,-7 Q 2.6,-7.2 2.2,-4 L 1.6,-2.6 Z" fill="#a8a29e" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <circle cx="0.6" cy="-6" r="1.6" fill="#78716c" stroke="#1e293b" strokeWidth="0.7" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgMonument = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={34} />
      {/* 広場の床 */}
      <polygon points={`${iso3(10, 10, 0)} ${iso3(90, 10, 0)} ${iso3(90, 90, 0)} ${iso3(10, 90, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 二段の台座 */}
      <IsoCube x={30} y={30} w={40} d={40} h={5} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={1} />
      <IsoCube x={38} y={38} w={24} d={24} z={5} h={6} top="#e7e5e4" left="#cbd5e1" right="#94a3b8" sw={1} />
      {/* 銘板 */}
      <FaceSW x1={42} x2={58} y={62.2} z1={6.5} z2={10} fill="#fbbf24" sw={0.7} />
      {/* オベリスク */}
      <g transform={`translate(${isoPt(50, 50, 11)[0].toFixed(1)}, ${isoPt(50, 50, 11)[1].toFixed(1)})`}>
        <polygon points="-5.4,0 0,2.6 0,-38 -3.6,-40" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="5.4,0 0,2.6 0,-38 3.6,-40" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        {/* ピラミッド型の頂部 */}
        <polygon points="-3.6,-40 0,-38 0,-48" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="3.6,-40 0,-38 0,-48" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 刻まれた模様 */}
        <path d="M -2.8,-8 L -2.8,-30 M 2.8,-9 L 2.8,-31" stroke="#64748b" strokeWidth="0.7" opacity="0.9" />
      </g>
      {/* 献花 */}
      <g transform={`translate(${isoPt(42, 74, 0)[0].toFixed(1)}, ${isoPt(42, 74, 0)[1].toFixed(1)})`}>
        <circle cx="-1.6" cy="-1.6" r="1.6" fill="#f472b6" stroke="#1e293b" strokeWidth="0.5" />
        <circle cx="1.6" cy="-1" r="1.6" fill="#facc15" stroke="#1e293b" strokeWidth="0.5" />
        <path d="M -2.6,0 Q 0,1.4 2.6,0.6" fill="none" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

export const SvgGrandSmithy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      {/* 石畳の敷地 */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#78716c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 母屋（石造の大工房） */}
      <IsoCube x={10} y={10} w={64} d={62} h={26} top="#44403c" left="#78716c" right="#57534e" sw={1.1} />
      {/* 大アーチ炉口（正面） */}
      <FaceSW x1={18} x2={48} y={72.2} z1={0} z2={15} fill="#1c1917" sw={1.1} />
      <path d={`M ${iso3(18, 72.2, 15)} Q ${iso3(33, 72.2, 22)} ${iso3(48, 72.2, 15)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="1" />
      <g transform={`translate(${isoPt(33, 72.4, 6)[0].toFixed(1)}, ${isoPt(33, 72.4, 6)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="6.5" fill="#ef4444" filter="url(#glow-effect)" />
        <circle cx="0" cy="0.8" r="3.4" fill="#fbbf24" />
        <circle cx="0.6" cy="1.4" r="1.6" fill="#fef9c3" />
      </g>
      {/* 窓 */}
      <WinSW x1={56} x2={66} y={72.2} z1={8} z2={17} />
      <WinSE x={74.2} y1={22} y2={38} z1={8} z2={17} />
      <WinSE x={74.2} y1={46} y2={62} z1={8} z2={17} />
      {/* 切妻の大屋根 */}
      <polygon points={`${iso3(6, 6, 26)} ${iso3(78, 6, 26)} ${iso3(78, 41, 38)} ${iso3(6, 41, 38)}`} fill="#292524" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(6, 76, 26)} ${iso3(78, 76, 26)} ${iso3(78, 41, 38)} ${iso3(6, 41, 38)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(78, 6, 26)} ${iso3(78, 41, 38)} ${iso3(78, 76, 26)} ${iso3(78, 76, 23.5)} ${iso3(78, 41, 35.5)} ${iso3(78, 6, 23.5)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* れんが大煙突2本＋煙 */}
      {[[16, 18], [34, 14]].map(([cx0, cy0], i) => (
        <g key={i}>
          <IsoCube x={cx0} y={cy0} w={11} d={11} z={30} h={26 + i * 5} top="#57534e" left="#b91c1c" right="#7f1d1d" sw={1} />
          <g transform={`translate(${isoPt(cx0 + 5.5, cy0 + 5.5, 58 + i * 5)[0].toFixed(1)}, ${isoPt(cx0 + 5.5, cy0 + 5.5, 58 + i * 5)[1].toFixed(1)})`} opacity="0.85">
            <circle cx="0" cy="-2" r="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.6" />
            <circle cx="2.6" cy="-6" r="3.8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
            <circle cx="5.6" cy="-10.5" r="4.4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.6" />
          </g>
        </g>
      ))}
      {/* 別棟（資材置き場・鉄骨屋根） */}
      <IsoCube x={80} y={30} w={16} d={42} h={12} top="#78716c" left="#a8a29e" right="#57534e" sw={1} />
      <polygon points={`${iso3(78, 26, 12)} ${iso3(98, 26, 12)} ${iso3(98, 76, 17)} ${iso3(78, 76, 17)}`} fill="#57534e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 巨大な金床 */}
      <g transform={`translate(${isoPt(62, 86, 0)[0].toFixed(1)}, ${isoPt(62, 86, 0)[1].toFixed(1)})`}>
        <polygon points="-5,0 5,0 3.8,-3.4 -3.8,-3.4" fill="#44403c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <path d="M -7,-3.4 L 7,-3.4 L 8.6,-5.4 L 4,-7.6 L -4.6,-7.6 L -7,-5.6 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M -7,-5.6 L -11,-6.2 L -9,-7.6 L -4.6,-7.6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 剣のディスプレイ */}
      <g transform={`translate(${isoPt(86, 86, 0)[0].toFixed(1)}, ${isoPt(86, 86, 0)[1].toFixed(1)}) rotate(-8)`}>
        <line x1="0" y1="-3" x2="0" y2="-15" stroke="#e2e8f0" strokeWidth="1.7" strokeLinecap="round" />
        <line x1="0" y1="-15" x2="0" y2="-16.6" stroke="#f8fafc" strokeWidth="1" strokeLinecap="round" />
        <line x1="-2.6" y1="-3.4" x2="2.6" y2="-3.4" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="0" y1="-3" x2="0" y2="0" stroke="#78350f" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

export const SvgWindmill = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 96) scale(2.3)">
      <ellipse cx="0" cy="1.5" rx="16" ry="6.5" fill="#020617" opacity="0.18" />
      {/* 塔（すぼまった円錐台） */}
      <path d="M -9,0 L -6,-30 L 6,-30 L 9,0 A 9,3.6 0 0 1 -9,0 Z" fill="#fde047" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M 0,1.8 A 9,3.6 0 0 0 9,0 L 6,-30 L 0,-30 Z" fill="#eab308" />
      <path d="M -9,0 L -6,-30 L 6,-30 L 9,0 A 9,3.6 0 0 1 -9,0 Z" fill="none" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M -8.4,-4 L 8.4,-4 M -7.6,-11 L 7.6,-11" stroke="#ca8a04" strokeWidth="0.8" opacity="0.8" />
      {/* 窓とドア */}
      <path d="M -3,0.6 L -3,-7 A 3,2.6 0 0 1 3,-7 L 3,0.6 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="0" cy="-20" r="2.6" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.9" />
      <path d="M -2.6,-20 L 2.6,-20 M 0,-22.6 L 0,-17.4" stroke="#1e293b" strokeWidth="0.6" />
      {/* キャップ屋根 */}
      <path d="M -7.5,-30 A 7.5,3 0 0 1 7.5,-30 L 0,-40 Z" fill="#dc2626" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 羽根4枚（格子入り帆） */}
      <g transform="translate(0, -33) rotate(18)">
        {[0, 90, 180, 270].map(a => (
          <g key={a} transform={`rotate(${a})`}>
            <line x1="0" y1="0" x2="0" y2="-19" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
            <polygon points="0.4,-4 6.4,-6.5 6.4,-17.5 0.4,-19" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
            <line x1="0.4" y1="-9" x2="6.4" y2="-10.2" stroke="#94a3b8" strokeWidth="0.7" />
            <line x1="0.4" y1="-14" x2="6.4" y2="-14.6" stroke="#94a3b8" strokeWidth="0.7" />
            <line x1="3.4" y1="-5.2" x2="3.4" y2="-18.2" stroke="#94a3b8" strokeWidth="0.7" />
          </g>
        ))}
        <circle cx="0" cy="0" r="2.6" fill="#d97706" stroke="#1e293b" strokeWidth="1" />
      </g>
      {/* チューリップ */}
      {[[-13, 1, '#ef4444'], [13, 0, '#f472b6']].map(([fx, fy, c], i) => (
        <g key={i} transform={`translate(${fx}, ${fy})`}>
          <line x1="0" y1="0" x2="0" y2="-4" stroke="#16a34a" strokeWidth="0.9" />
          <path d="M -1.8,-4 Q -1.8,-7 0,-7 Q 1.8,-7 1.8,-4 Q 0.9,-2.8 0,-4 Q -0.9,-2.8 -1.8,-4 Z" fill={c} stroke="#1e293b" strokeWidth="0.6" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgBellTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.4)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -12,-6 -12,-24 0,-18" fill="#ffedd5" /><polygon points="0,0 12,-6 12,-24 0,-18" fill="#fde68a" /><polygon points="0,-18 -14,-25 0,-38 14,-25" fill="#78350f" /><polygon points="0,-18 14,-25 14,-23 0,-16" fill="#451a03" /><circle cx="0" cy="-22" r="4" fill="#fbbf24" filter="url(#glow-effect)" /><path d="M 0,-26 L 0,-18" stroke="#78350f" strokeWidth="1" /></g></svg>);

export const SvgCherryRoad = () => <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md"><Fl type="road" color="#fce7f3" thickness={4} /></svg>;

export const SvgClockTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.3)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="16" ry="8" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -10,-5 -10,-35 0,-30" fill="#fef3c7" /><polygon points="0,0 10,-5 10,-35 0,-30" fill="#fde68a" /><polygon points="0,-30 -12,-36 0,-48 12,-36" fill="#92400e" /><polygon points="0,-30 -12,-36 -12,-34 0,-28" fill="#78350f" /><circle cx="-5" cy="-20" r="5" fill="#f8fafc" /><circle cx="5" cy="-20" r="5" fill="#f8fafc" /><line x1="-5" y1="-20" x2="-5" y2="-23" stroke="#1e293b" strokeWidth="1" /><line x1="5" y1="-20" x2="6" y2="-22" stroke="#1e293b" strokeWidth="1" /></g></svg>);

export const SvgGoldStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <SharedDefs />
    <g transform="translate(50, 88) scale(2.4)">
      <ellipse cx="0" cy="6" rx="14" ry="5.5" fill="#020617" opacity="0.2" />
      {/* 大理石の台座（2段） */}
      <polygon points="-11,5 11,5 9,0.6 -9,0.6" fill="#d6d3d1" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points="-7.5,0.6 7.5,0.6 6.2,-5.4 -6.2,-5.4" fill="#e7e5e4" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 銘板 */}
      <rect x="-3.4" y="-4" width="6.8" height="3" rx="0.5" fill="#78350f" stroke="#1e293b" strokeWidth="0.7" />
      {/* 黄金の人物像（掲げるポーズ） */}
      <g stroke="#1e293b" strokeLinejoin="round">
        {/* マント */}
        <path d="M -4.6,-6 C -7,-12 -6,-19 -3.4,-22 L 0.6,-21 L -0.6,-7 Z" fill="#d97706" strokeWidth="1" />
        {/* 脚と胴 */}
        <path d="M -2.8,-5.4 L -2.2,-13 L 2.6,-13 L 3.4,-5.4 L 0.8,-5.4 L 0.4,-10 L -0.6,-5.4 Z" fill="url(#grad-gold)" strokeWidth="1" />
        <path d="M -2.6,-13 C -3.2,-18.4 -2,-21.6 0.2,-22 C 2.6,-21.8 3.6,-18 3,-13 Z" fill="url(#grad-gold)" strokeWidth="1" />
        {/* 掲げた腕＋星 */}
        <path d="M 2.6,-19.6 C 4.6,-21.6 6,-24 6.6,-26.6" fill="none" strokeWidth="2.4" stroke="#d97706" strokeLinecap="round" />
        <path d="M 2.6,-19.6 C 4.6,-21.6 6,-24 6.6,-26.6" fill="none" strokeWidth="1.2" stroke="#fbbf24" strokeLinecap="round" />
        {/* もう片方の腕（腰） */}
        <path d="M -2.8,-18.6 C -4.2,-17.6 -4.6,-16 -4,-14.6" fill="none" strokeWidth="2.2" stroke="#d97706" strokeLinecap="round" />
        {/* 頭部＋月桂冠 */}
        <circle cx="0.2" cy="-25" r="3.4" fill="url(#grad-gold)" strokeWidth="1" />
        <path d="M -3.2,-26.4 Q -3.8,-24 -2.6,-22.4 M 3.6,-26.4 Q 4.2,-24 3,-22.4" fill="none" stroke="#15803d" strokeWidth="1.1" strokeLinecap="round" />
      </g>
      {/* 星 */}
      <g transform="translate(7.4, -29.4)">
        <path d="M 0,-2.6 L 0.8,-0.8 L 2.6,-0.6 L 1.2,0.6 L 1.6,2.4 L 0,1.4 L -1.6,2.4 L -1.2,0.6 L -2.6,-0.6 L -0.8,-0.8 Z"
          fill="#fef08a" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" filter="url(#glow-effect)" />
      </g>
      {/* きらめき */}
      <path d="M -6.6,-24 L -4.6,-24 M -5.6,-25 L -5.6,-23" stroke="#fde047" strokeWidth="0.8" strokeLinecap="round" />
      <path d="M 5.4,-12 L 7,-12 M 6.2,-12.8 L 6.2,-11.2" stroke="#fde047" strokeWidth="0.7" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgFestivalStage = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full drop-shadow-md" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.3)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><ellipse cx="0" cy="0" rx="24" ry="12" fill="#020617" opacity="0.3" filter="url(#soft-shadow)" /><polygon points="0,0 -20,-10 0,-20 20,-10" fill="#fef9c3" /><polygon points="0,0 -20,-10 -20,-14 0,-4" fill="#d97706" /><polygon points="0,0 20,-10 20,-14 0,-4" fill="#b45309" /><polygon points="0,-14 -22,-25 0,-30 22,-25" fill="#ef4444" /><polygon points="0,-14 -22,-25 -22,-23 0,-12" fill="#dc2626" /><circle cx="-10" cy="-20" r="2" fill="#fbbf24" filter="url(#glow-effect)" /><circle cx="10" cy="-20" r="2" fill="#fbbf24" filter="url(#glow-effect)" /><circle cx="0" cy="-25" r="2" fill="#fbbf24" filter="url(#glow-effect)" /></g></svg>);

export const SvgVillager = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)"><rect x="-10" y="-30" width="20" height="20" rx="4" fill="#3b82f6"/><circle cx="0" cy="-40" r="12" fill="#fde047"/><circle cx="-4" cy="-42" r="2" fill="#1e293b"/><circle cx="4" cy="-42" r="2" fill="#1e293b"/><path d="M-5,-35 Q0,-30 5,-35" fill="none" stroke="#1e293b" strokeWidth="2"/></g></svg>);

export const SvgGhostBoss = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><SharedDefs /><g transform="translate(50, 100) scale(2.5)" filter="url(#glow-effect)"><path d="M-30,20 Q0,-40 30,20 Q15,10 0,20 Q-15,10 -30,20 Z" fill="#9333ea" opacity="0.8"/><circle cx="-10" cy="0" r="5" fill="#f8fafc"/><circle cx="10" cy="0" r="5" fill="#f8fafc"/></g></svg>);

// ==========================================
// 7. 商業施設 (Commercial)
// 共通ビルダー ShopBase + 店舗ごとのグリフで統一クオリティ
// ==========================================

/**
 * 小型商業建築の共通ビルダー
 * 敷地パッド・2トーンの壁・大きなショーウィンドウ・ガラスドア・
 * 縞ひさし・屋上看板（グリフ付き）・植木をワンセットで描画する
 */
const ShopBase = ({ wall = '#fff7ed', base, roof = '#e7e5e4', awn1 = '#ef4444', awn2 = '#f8fafc', sign = '#ffffff', signEdge, h = 24, glyph = null, pad = '#e7e5e4', wide = false }) => {
  const wallD = darken(wall, 28);
  const baseC = base || darken(wall, 60);
  const roofD = darken(roof, 35);
  const signB = signEdge || awn1;
  const X1 = wide ? 8 : 16, X2 = wide ? 92 : 84; // 建物の幅
  const [gx, gy] = isoPt(50, 42, h + 15.5); // 看板グリフの中心
  return (
    <g>
      <IsoShadow rx={wide ? 46 : 40} />
      {/* 敷地パッド */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill={pad} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      {/* 本体 */}
      <IsoCube x={X1} y={16} w={X2 - X1} d={68} h={h} top={roof} left={wall} right={wallD} sw={1} />
      {/* 幅木（ベーストリム） */}
      <FaceSW x1={X1} x2={X2} y={84} z1={0} z2={3.5} fill={baseC} sw={0.8} />
      <FaceSE x={X2} y1={16} y2={84} z1={0} z2={3.5} fill={darken(baseC, 20)} sw={0.8} />
      {/* ショーウィンドウ（正面） */}
      <FaceSW x1={X1 + 6} x2={52} y={84.2} z1={5} z2={h - 7} fill="#1e293b" sw={1} />
      <FaceSW x1={X1 + 7.5} x2={50.5} y={84.4} z1={6} z2={h - 8} fill="url(#grad-glass)" sw={0.5} />
      <line x1={isoPt((X1 + 58) / 2, 84.4, 6)[0]} y1={isoPt((X1 + 58) / 2, 84.4, 6)[1]} x2={isoPt((X1 + 58) / 2, 84.4, h - 8)[0]} y2={isoPt((X1 + 58) / 2, 84.4, h - 8)[1]} stroke="#1e293b" strokeWidth="0.7" />
      {/* ガラスドア */}
      <FaceSW x1={60} x2={X2 - 8} y={84.2} z1={0} z2={h - 7} fill="#1e293b" sw={1} />
      <FaceSW x1={61.5} x2={X2 - 9.5} y={84.4} z1={1} z2={h - 8} fill="#bae6fd" sw={0.5} />
      <line x1={isoPt((60 + X2 - 8) / 2, 84.4, 1)[0]} y1={isoPt((60 + X2 - 8) / 2, 84.4, 1)[1]} x2={isoPt((60 + X2 - 8) / 2, 84.4, h - 8)[0]} y2={isoPt((60 + X2 - 8) / 2, 84.4, h - 8)[1]} stroke="#1e293b" strokeWidth="0.9" />
      {/* 側面の窓 */}
      <WinSE x={X2 + 0.2} y1={28} y2={44} z1={8} z2={h - 7} />
      <WinSE x={X2 + 0.2} y1={52} y2={68} z1={8} z2={h - 7} />
      {/* 縞ひさし */}
      <AwningSW x1={X1 + 4} x2={X2 - 4} y={84} z={h - 4.5} c1={awn1} c2={awn2} />
      {/* 屋上パラペット */}
      <IsoCube x={X1 - 2} y={14} w={X2 - X1 + 4} d={72} z={h} h={3} top={roof} left={lighten(roof, 8)} right={roofD} sw={0.9} />
      {/* 屋上看板 */}
      <FaceSW x1={30} x2={38} y={42} z1={h + 3} z2={h + 8} fill={darken(sign, 70)} sw={0.7} />
      <FaceSW x1={62} x2={70} y={42} z1={h + 3} z2={h + 8} fill={darken(sign, 70)} sw={0.7} />
      <FaceSW x1={24} x2={76} y={42} z1={h + 7} z2={h + 24} fill={signB} sw={1.1} />
      <FaceSW x1={27} x2={73} y={42.2} z1={h + 9} z2={h + 22} fill={sign} sw={0.6} />
      {glyph && <g transform={`translate(${gx.toFixed(1)}, ${gy.toFixed(1)})`}>{glyph}</g>}
      {/* 入口横の植木 */}
      <g transform={`translate(${isoPt(92, 91, 0)[0].toFixed(1)}, ${isoPt(92, 91, 0)[1].toFixed(1)})`}>
        <polygon points="-3.5,0 3.5,0 2.5,-4.5 -2.5,-4.5" fill="#b45309" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <circle cx="0" cy="-7.5" r="4.2" fill="#16a34a" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="-1.4" cy="-8.8" r="1.8" fill="#4ade80" />
      </g>
    </g>
  );
};

export const SvgCafe = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#ffedd5" base="#78350f" roof="#a16207" awn1="#b45309" awn2="#fef3c7" sign="#fff7ed" signEdge="#78350f"
        glyph={<g>
          <path d="M -4,-3 L -3.2,3 L 3.2,3 L 4,-3 Z" fill="#78350f" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <path d="M 4,-2 C 7,-2 7,1.5 3.6,1.2" fill="none" stroke="#78350f" strokeWidth="1.2" />
          <path d="M -1.8,-5 Q -0.8,-6.5 -1.8,-8 M 1.2,-5 Q 2.2,-6.5 1.2,-8" fill="none" stroke="#a8a29e" strokeWidth="0.9" strokeLinecap="round" />
        </g>} />
    </g>
  </svg>
);

export const SvgBakery = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#fff7ed" base="#9a3412" roof="#ea580c" awn1="#ea580c" awn2="#ffedd5" sign="#fff7ed" signEdge="#9a3412"
        glyph={<g>
          <ellipse cx="0" cy="-2" rx="5.5" ry="3.2" fill="#f59e0b" stroke="#1e293b" strokeWidth="0.8" />
          <path d="M -3,-3.6 L -2.2,-1 M -0.4,-4.2 L 0.4,-1.4 M 2.2,-3.6 L 3,-1" stroke="#92400e" strokeWidth="0.8" strokeLinecap="round" />
        </g>} />
    </g>
  </svg>
);

export const SvgBurgerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#fef9c3" base="#a16207" roof="#dc2626" awn1="#dc2626" awn2="#fef08a" sign="#fef9c3" signEdge="#dc2626"
        glyph={<g>
          <path d="M -4.5,-3.5 C -4.5,-6.5 4.5,-6.5 4.5,-3.5 Z" fill="#f59e0b" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <rect x="-4.5" y="-3.2" width="9" height="1.6" rx="0.8" fill="#4ade80" stroke="#1e293b" strokeWidth="0.6" />
          <rect x="-4.8" y="-1.4" width="9.6" height="2" rx="1" fill="#78350f" stroke="#1e293b" strokeWidth="0.7" />
          <path d="M -4.5,0.8 L 4.5,0.8 C 4.5,3 -4.5,3 -4.5,0.8 Z" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        </g>} />
    </g>
  </svg>
);

export const SvgFamilyRestaurant = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wide wall="#fef9c3" base="#b45309" roof="#f97316" awn1="#f97316" awn2="#fffbeb" sign="#fffbeb" signEdge="#ea580c"
        glyph={<g>
          <circle cx="1.5" cy="-1" r="4.4" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="1.5" cy="-1" r="2.2" fill="#fde68a" stroke="#e2e8f0" strokeWidth="0.5" />
          <path d="M -5.5,-5.5 L -5.5,4 M -7,-5.5 L -7,-2.5 Q -7,-1 -5.5,-1 M -4,-5.5 L -4,-2.5 Q -4,-1 -5.5,-1" fill="none" stroke="#475569" strokeWidth="0.9" strokeLinecap="round" />
        </g>} />
    </g>
  </svg>
);

export const SvgConvenienceStore = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#f8fafc" base="#475569" roof="#e2e8f0" awn1="#0ea5e9" awn2="#f8fafc" sign="#f8fafc" signEdge="#0284c7" h={22}
        glyph={<g>
          <rect x="-7" y="-4.5" width="14" height="9" rx="1" fill="#0ea5e9" stroke="#1e293b" strokeWidth="0.8" />
          <rect x="-7" y="-1.6" width="14" height="3.2" fill="#f8fafc" />
          <rect x="-7" y="1.6" width="14" height="2.9" rx="0.6" fill="#22c55e" />
          <text x="0" y="1" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#0c4a6e" fontFamily="sans-serif">24</text>
        </g>} />
    </g>
  </svg>
);

export const SvgFlowerShop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#fdf2f8" base="#9d174d" roof="#f472b6" awn1="#db2777" awn2="#fce7f3" sign="#fdf2f8" signEdge="#db2777"
        glyph={<g>
          <path d="M 0,4 L 0,-1" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" />
          <path d="M 0,1 Q -3,0 -3.5,2.5 Q -1,3 0,1 Z" fill="#22c55e" stroke="#1e293b" strokeWidth="0.5" />
          <path d="M -2.8,-3.5 Q -2.8,-6.5 0,-6.5 Q 2.8,-6.5 2.8,-3.5 L 2.8,-2 Q 1.4,-0.8 0,-2 Q -1.4,-0.8 -2.8,-2 Z" fill="#ec4899" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <line x1="0" y1="-6.5" x2="0" y2="-2" stroke="#be185d" strokeWidth="0.6" />
        </g>} />
      {/* 店先の花のディスプレイ */}
      <g transform={`translate(${isoPt(10, 91, 0)[0].toFixed(1)}, ${isoPt(10, 91, 0)[1].toFixed(1)})`}>
        <polygon points="-4,0 4,0 3,-4 -3,-4" fill="#92400e" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <circle cx="-2" cy="-6" r="2" fill="#f472b6" stroke="#1e293b" strokeWidth="0.6" />
        <circle cx="1.5" cy="-6.6" r="2" fill="#facc15" stroke="#1e293b" strokeWidth="0.6" />
        <circle cx="0" cy="-4.6" r="1.6" fill="#38bdf8" stroke="#1e293b" strokeWidth="0.6" />
      </g>
    </g>
  </svg>
);

export const SvgCinema = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wide wall="#334155" base="#0f172a" roof="#1e293b" awn1="#dc2626" awn2="#fef3c7" sign="#0f172a" signEdge="#dc2626" h={30} pad="#475569"
        glyph={<g>
          {/* カチンコ */}
          <rect x="-5.5" y="-2" width="11" height="6.5" rx="0.8" fill="#1e293b" stroke="#fef3c7" strokeWidth="0.7" />
          <g transform="rotate(-15 -5.5 -2)">
            <rect x="-5.5" y="-5" width="11" height="3" rx="0.8" fill="#1e293b" stroke="#fef3c7" strokeWidth="0.7" />
            <path d="M -4.5,-5 L -2.5,-2 M -1,-5 L 1,-2 M 2.5,-5 L 4.5,-2" stroke="#fef3c7" strokeWidth="0.9" />
          </g>
          <circle cx="0" cy="1.4" r="1.4" fill="#fbbf24" />
        </g>} />
      {/* 電飾マーキー */}
      {[30, 40, 50, 60, 70].map(x => (
        <circle key={x} cx={isoPt(x, 84.6, 27)[0]} cy={isoPt(x, 84.6, 27)[1]} r="1" fill="#fde047" stroke="#1e293b" strokeWidth="0.4" />
      ))}
    </g>
  </svg>
);

export const SvgHotel = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.1)">
      <IsoShadow rx={32} />
      <polygon points={`${iso3(10, 10, 0)} ${iso3(90, 10, 0)} ${iso3(90, 90, 0)} ${iso3(10, 90, 0)}`} fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* タワー本体 */}
      <IsoCube x={24} y={24} w={52} d={52} h={66} top="#64748b" left="#475569" right="#334155" sw={1.1} />
      {/* 客室窓（南西面・暖色の明かり） */}
      {[14, 26, 38, 50].map((z, r) => (
        <g key={z}>
          {[[28, 36], [40, 48], [52, 60], [64, 72]].map(([a, b], c) => (
            <FaceSW key={c} x1={a} x2={b} y={76.2} z1={z} z2={z + 7} fill={(r + c) % 3 === 0 ? '#fef08a' : (r + c) % 3 === 1 ? '#fde047' : '#94a3b8'} sw={0.6} />
          ))}
        </g>
      ))}
      {/* 客室窓（南東面） */}
      {[14, 26, 38, 50].map((z, r) => (
        <g key={z}>
          {[[30, 40], [46, 56], [60, 70]].map(([a, b], c) => (
            <FaceSE key={c} x={76.2} y1={a} y2={b} z1={z} z2={z + 7} fill={(r + c) % 2 === 0 ? '#fbbf24' : '#78716c'} sw={0.6} />
          ))}
        </g>
      ))}
      {/* エントランス＋赤い絨毯とキャノピー */}
      <polygon points={`${iso3(42, 76, 0.2)} ${iso3(58, 76, 0.2)} ${iso3(58, 92, 0.2)} ${iso3(42, 92, 0.2)}`} fill="#dc2626" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      <FaceSW x1={42} x2={58} y={76.4} z1={0} z2={9.5} fill="#0f172a" sw={1} />
      <FaceSW x1={44.5} x2={49.5} y={76.6} z1={0.8} z2={8.6} fill="#fde68a" sw={0.5} />
      <FaceSW x1={50.5} x2={55.5} y={76.6} z1={0.8} z2={8.6} fill="#fcd34d" sw={0.5} />
      <AwningSW x1={40} x2={60} y={76} z={11} c1="#b91c1c" c2="#fef3c7" depth={8} drop={2} stripes={5} />
      {/* キャノピー支柱 */}
      {[42, 58].map(x => (
        <line key={x} x1={isoPt(x, 84, 0)[0]} y1={isoPt(x, 84, 0)[1]} x2={isoPt(x, 84, 8.5)[0]} y2={isoPt(x, 84, 8.5)[1]} stroke="#fbbf24" strokeWidth="1.4" strokeLinecap="round" />
      ))}
      {/* 縦型HOTELサイン */}
      <FaceSW x1={22} x2={30} y={76.5} z1={20} z2={58} fill="#b91c1c" sw={1} />
      {['H', 'O', 'T', 'E', 'L'].map((ch, i) => (
        <text key={ch} x={isoPt(26, 76.7, 55 - i * 7.5)[0]} y={isoPt(26, 76.7, 55 - i * 7.5)[1]} textAnchor="middle" fontSize="6.5" fontWeight="900" fill="#fef9c3" fontFamily="sans-serif">{ch}</text>
      ))}
      {/* 屋上（パラペット＋ルーフバー） */}
      <IsoCube x={22} y={22} w={56} d={56} z={66} h={3} top="#94a3b8" left="#cbd5e1" right="#64748b" sw={0.9} />
      <IsoCube x={34} y={34} w={22} d={16} z={69} h={7} top="#e2e8f0" left="#f8fafc" right="#cbd5e1" sw={0.8} />
      <FaceSW x1={36} x2={54} y={50.2} z1={71} z2={75} fill="#7dd3fc" sw={0.6} />
      {/* 星型ネオン */}
      <g transform={`translate(${isoPt(62, 44, 74)[0].toFixed(1)}, ${isoPt(62, 44, 74)[1].toFixed(1)})`}>
        <path d="M 0,-4 L 1.2,-1.2 L 4,-1 L 1.8,0.8 L 2.4,3.6 L 0,2 L -2.4,3.6 L -1.8,0.8 L -4,-1 L -1.2,-1.2 Z"
          fill="#fde047" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" filter="url(#glow-effect)" />
      </g>
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
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={32} />
      {/* 敷地パッド */}
      <polygon points={`${iso3(10, 10, 0)} ${iso3(90, 10, 0)} ${iso3(90, 90, 0)} ${iso3(10, 90, 0)}`} fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      {/* 本体 */}
      <IsoCube x={22} y={22} w={56} d={56} h={26} top="#e2e8f0" left="#f8fafc" right="#e2e8f0" sw={1} />
      {/* 青い帯 */}
      <FaceSW x1={22} x2={78} y={78} z1={19} z2={24} fill="#1d4ed8" sw={0.9} />
      <FaceSE x={78} y1={22} y2={78} z1={19} z2={24} fill="#1e3a8a" sw={0.9} />
      {/* 入口（引き戸） */}
      <FaceSW x1={32} x2={56} y={78.2} z1={0} z2={17} fill="#1e293b" sw={1} />
      <FaceSW x1={33.5} x2={44} y={78.4} z1={1} z2={16} fill="#bae6fd" sw={0.6} />
      <FaceSW x1={45} x2={54.5} y={78.4} z1={1} z2={16} fill="#7dd3fc" sw={0.6} />
      {/* 窓（正面右・側面） */}
      <WinSW x1={62} x2={74} y={78.2} z1={7} z2={17} />
      <WinSE x={78.2} y1={32} y2={48} z1={7} z2={17} />
      {/* 庇屋根 */}
      <IsoCube x={18} y={18} w={64} d={64} z={26} h={4} top="#1d4ed8" left="#2563eb" right="#1e3a8a" sw={1} />
      {/* 赤色灯 */}
      <IsoCube x={46} y={46} w={8} d={8} z={30} h={3} top="#94a3b8" left="#cbd5e1" right="#64748b" sw={0.8} />
      <g transform={`translate(${isoPt(50, 50, 36)[0].toFixed(1)}, ${isoPt(50, 50, 36)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="3.2" fill="#ef4444" stroke="#1e293b" strokeWidth="0.9" filter="url(#glow-effect)" />
        <circle cx="-1" cy="-1" r="1" fill="#fecaca" />
      </g>
      {/* 「交番」の金色プレート */}
      <FaceSW x1={60} x2={76} y={78.4} z1={20} z2={23.4} fill="#fbbf24" sw={0.6} />
    </g>
  </svg>
);

export const SvgPostOffice = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <ShopBase wall="#f8fafc" base="#991b1b" roof="#e2e8f0" awn1="#ef4444" awn2="#f8fafc" sign="#f8fafc" signEdge="#dc2626"
        glyph={<g>
          {/* 〒マーク */}
          <path d="M -5,-4 L 5,-4 M -5,-1 L 5,-1 M 0,-1 L 0,5" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" />
        </g>} />
      {/* 店先の郵便ポスト */}
      <g transform={`translate(${isoPt(8, 90, 0)[0].toFixed(1)}, ${isoPt(8, 90, 0)[1].toFixed(1)})`}>
        <polygon points="-3.5,0 3.5,0 3,-2 -3,-2" fill="#64748b" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        <rect x="-2.6" y="-11" width="5.2" height="9" rx="0.6" fill="#dc2626" stroke="#1e293b" strokeWidth="0.9" />
        <path d="M -2.6,-11 A 2.6,2.2 0 0 1 2.6,-11" fill="#ef4444" stroke="#1e293b" strokeWidth="0.9" />
        <rect x="-1.7" y="-9.6" width="3.4" height="1" fill="#1e293b" />
      </g>
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
    <g transform="translate(50, 100) scale(2.1)">
      <IsoShadow rx={46} />
      {/* エプロン（駐機場） */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#94a3b8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 滑走路帯 */}
      <polygon points={`${iso3(0, 78, 0.1)} ${iso3(100, 78, 0.1)} ${iso3(100, 96, 0.1)} ${iso3(0, 96, 0.1)}`} fill="#334155" />
      {[8, 24, 40, 56, 72, 88].map(x => (
        <polygon key={x} points={`${iso3(x, 86, 0.2)} ${iso3(x + 8, 86, 0.2)} ${iso3(x + 8, 88, 0.2)} ${iso3(x, 88, 0.2)}`} fill="#fde047" />
      ))}
      {/* ターミナル本体 */}
      <IsoCube x={10} y={8} w={70} d={42} h={20} top="#e2e8f0" left="#f8fafc" right="#cbd5e1" sw={1.1} />
      {/* ガラスファサード（南西面） */}
      <FaceSW x1={13} x2={77} y={50.2} z1={4} z2={17} fill="url(#grad-glass)" sw={0.8} />
      {[25, 37, 49, 61].map(x => (
        <line key={x} x1={isoPt(x, 50.3, 4)[0]} y1={isoPt(x, 50.3, 4)[1]} x2={isoPt(x, 50.3, 17)[0]} y2={isoPt(x, 50.3, 17)[1]} stroke="#475569" strokeWidth="0.7" />
      ))}
      {/* 曲面屋根 */}
      <path d={`M ${iso3(8, 6, 20)} Q ${iso3(45, 6, 34)} ${iso3(82, 6, 20)} L ${iso3(82, 52, 20)} Q ${iso3(45, 52, 34)} ${iso3(8, 52, 20)} Z`}
        fill="#0ea5e9" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M ${iso3(82, 6, 20)} Q ${iso3(45, 6, 34)} ${iso3(8, 6, 20)} L ${iso3(8, 6, 18.5)} Q ${iso3(45, 6, 32.5)} ${iso3(82, 6, 18.5)} Z`}
        fill="#0284c7" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 管制塔 */}
      <g>
        <IsoCube x={84} y={14} w={12} d={12} h={30} top="#cbd5e1" left="#f1f5f9" right="#cbd5e1" sw={1} />
        <IsoCube x={81} y={11} w={18} d={18} z={30} h={8} top="#475569" left="#38bdf8" right="#0284c7" sw={1} />
        <line x1={isoPt(90, 20, 38)[0]} y1={isoPt(90, 20, 38)[1]} x2={isoPt(90, 20, 48)[0]} y2={isoPt(90, 20, 48)[1]} stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx={isoPt(90, 20, 49)[0]} cy={isoPt(90, 20, 49)[1]} r="1.4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.6" />
      </g>
      {/* ボーディングブリッジ */}
      <polygon points={`${iso3(30, 50, 8)} ${iso3(38, 50, 8)} ${iso3(38, 64, 6)} ${iso3(30, 64, 6)}`} fill="#e2e8f0" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points={`${iso3(30, 64, 6)} ${iso3(38, 64, 6)} ${iso3(38, 64, 0)} ${iso3(30, 64, 0)}`} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      {/* 駐機中の小型機 */}
      <g transform={`translate(${isoPt(38, 68, 0)[0].toFixed(1)}, ${isoPt(38, 68, 0)[1].toFixed(1)}) rotate(18) scale(0.62)`}>
        <polygon points="-2.5,-4 -21,6 -18,9 -1,2" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M 0,-22 C 4,-16 4.6,-7 4.6,2 L 4.2,9 C 4,12 -4,12 -4.2,9 L -4.6,2 C -4.6,-7 -4,-16 0,-22 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
        <polygon points="2.5,-4 21,6 18,9 1,2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <polygon points="-1.2,9 0,16.5 1.2,9" fill="#ef4444" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <path d="M -2.4,-15.5 C -1,-18.5 1,-18.5 2.4,-15.5 C 1,-16.6 -1,-16.6 -2.4,-15.5 Z" fill="#0ea5e9" stroke="#1e293b" strokeWidth="0.8" />
      </g>
    </g>
  </svg>
);


// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgOfficeBuilding = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.1)">
      <IsoShadow rx={34} />
      {/* 敷地 */}
      <polygon points={`${iso3(8, 8, 0)} ${iso3(92, 8, 0)} ${iso3(92, 92, 0)} ${iso3(8, 92, 0)}`} fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* タワー本体 */}
      <IsoCube x={20} y={20} w={60} d={60} h={62} top="#94a3b8" left="#475569" right="#334155" sw={1.1} />
      {/* ガラスカーテンウォール（南西面） */}
      {[6, 16, 26, 36, 46].map(z => (
        <FaceSW key={`w-${z}`} x1={24} x2={76} y={80.2} z1={z} z2={z + 7} fill={z % 20 === 6 ? '#7dd3fc' : '#38bdf8'} sw={0.6} />
      ))}
      {[30, 44, 58].map(x => (
        <line key={`v-${x}`} x1={isoPt(x, 80.3, 6)[0]} y1={isoPt(x, 80.3, 6)[1]} x2={isoPt(x, 80.3, 53)[0]} y2={isoPt(x, 80.3, 53)[1]} stroke="#334155" strokeWidth="0.7" />
      ))}
      {/* ガラスカーテンウォール（南東面） */}
      {[6, 16, 26, 36, 46].map(z => (
        <FaceSE key={`e-${z}`} x={80.2} y1={24} y2={76} z1={z} z2={z + 7} fill="#0ea5e9" sw={0.6} />
      ))}
      {[38, 62].map(y => (
        <line key={`ve-${y}`} x1={isoPt(80.3, y, 6)[0]} y1={isoPt(80.3, y, 6)[1]} x2={isoPt(80.3, y, 53)[0]} y2={isoPt(80.3, y, 53)[1]} stroke="#334155" strokeWidth="0.7" />
      ))}
      {/* エントランス */}
      <FaceSW x1={38} x2={62} y={80.4} z1={0} z2={9} fill="#0f172a" sw={1} />
      <FaceSW x1={41} x2={49} y={80.6} z1={0.8} z2={8} fill="#bae6fd" sw={0.5} />
      <FaceSW x1={51} x2={59} y={80.6} z1={0.8} z2={8} fill="#7dd3fc" sw={0.5} />
      <AwningSW x1={36} x2={64} y={80} z={10.5} c1="#475569" c2="#94a3b8" depth={7} drop={2} stripes={1} />
      {/* パラペットと屋上設備 */}
      <IsoCube x={18} y={18} w={64} d={64} z={62} h={3} top="#64748b" left="#94a3b8" right="#475569" sw={0.9} />
      <IsoCube x={28} y={30} w={14} d={12} z={65} h={6} top="#e2e8f0" left="#cbd5e1" right="#94a3b8" sw={0.8} />
      <IsoCube x={52} y={48} w={10} d={10} z={65} h={4} top="#e2e8f0" left="#cbd5e1" right="#94a3b8" sw={0.8} />
      {/* アンテナ */}
      <line x1={isoPt(66, 34, 65)[0]} y1={isoPt(66, 34, 65)[1]} x2={isoPt(66, 34, 82)[0]} y2={isoPt(66, 34, 82)[1]} stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx={isoPt(66, 34, 83)[0]} cy={isoPt(66, 34, 83)[1]} r="1.4" fill="#ef4444" stroke="#1e293b" strokeWidth="0.6" />
    </g>
  </svg>
);

export const SvgTowerApartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.1)">
      <IsoShadow rx={32} />
      <polygon points={`${iso3(10, 10, 0)} ${iso3(90, 10, 0)} ${iso3(90, 90, 0)} ${iso3(10, 90, 0)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* タワー本体 */}
      <IsoCube x={26} y={26} w={48} d={48} h={74} top="#e7e5e4" left="#f5f5f4" right="#d6d3d1" sw={1.1} />
      {/* バルコニー（南西面・各階の張り出し） */}
      {[8, 20, 32, 44, 56].map(z => (
        <g key={`b-${z}`}>
          <FaceSW x1={29} x2={71} y={74.2} z1={z} z2={z + 6.5} fill="#93c5fd" sw={0.6} />
          <line x1={isoPt(50, 74.3, z)[0]} y1={isoPt(50, 74.3, z)[1]} x2={isoPt(50, 74.3, z + 6.5)[0]} y2={isoPt(50, 74.3, z + 6.5)[1]} stroke="#78716c" strokeWidth="0.7" />
          <polygon points={`${iso3(28, 74, z - 1.5)} ${iso3(72, 74, z - 1.5)} ${iso3(72, 79, z - 2.5)} ${iso3(28, 79, z - 2.5)}`} fill="#f5f5f4" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <polygon points={`${iso3(28, 79, z - 2.5)} ${iso3(72, 79, z - 2.5)} ${iso3(72, 79, z - 4)} ${iso3(28, 79, z - 4)}`} fill="#a8a29e" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      ))}
      {/* 窓（南東面） */}
      {[8, 20, 32, 44, 56].map(z => (
        <g key={`e-${z}`}>
          <FaceSE x={74.2} y1={32} y2={48} z1={z} z2={z + 6.5} fill="#bae6fd" sw={0.6} />
          <FaceSE x={74.2} y1={54} y2={68} z1={z} z2={z + 6.5} fill="#7dd3fc" sw={0.6} />
        </g>
      ))}
      {/* エントランス */}
      <FaceSW x1={40} x2={60} y={74.4} z1={0} z2={6} fill="#1e293b" sw={0.9} />
      <FaceSW x1={43} x2={57} y={74.6} z1={0.8} z2={5.2} fill="#bae6fd" sw={0.5} />
      {/* 屋上 */}
      <IsoCube x={24} y={24} w={52} d={52} z={74} h={3} top="#d6d3d1" left="#e7e5e4" right="#a8a29e" sw={0.9} />
      <IsoCube x={40} y={40} w={20} d={20} z={77} h={5} top="#a8a29e" left="#d6d3d1" right="#78716c" sw={0.8} />
      {/* 赤色航空灯 */}
      <line x1={isoPt(50, 50, 82)[0]} y1={isoPt(50, 50, 82)[1]} x2={isoPt(50, 50, 92)[0]} y2={isoPt(50, 50, 92)[1]} stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx={isoPt(50, 50, 93)[0]} cy={isoPt(50, 50, 93)[1]} r="1.6" fill="#ef4444" stroke="#1e293b" strokeWidth="0.6" filter="url(#glow-effect)" />
    </g>
  </svg>
);

export const SvgTvTower = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.1)">
      <IsoShadow rx={30} ry={13} />
      {/* 4本脚がカーブを描くラティス構造（東京タワー風） */}
      <path d="M -22,-8 C -18,-26 -8,-38 -4,-52 L 4,-52 C 8,-38 18,-26 22,-8 L 14,-8 C 11,-22 5,-34 2,-46 L -2,-46 C -5,-34 -11,-22 -14,-8 Z"
        fill="#f97316" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      {/* トラス（クロスブレース） */}
      <g stroke="#7c2d12" strokeWidth="0.9" opacity="0.9">
        <path d="M -20,-12 L 20,-12 M -17,-20 L 17,-20 M -14,-28 L 14,-28 M -11,-36 L 11,-36 M -8,-44 L 8,-44" fill="none" />
        <path d="M -20,-12 L -13,-20 M -13,-12 L -20,-20 M 20,-12 L 13,-20 M 13,-12 L 20,-20" fill="none" />
        <path d="M -16,-20 L -10,-28 M -10,-20 L -16,-28 M 16,-20 L 10,-28 M 10,-20 L 16,-28" fill="none" />
        <path d="M -13,-28 L -8,-36 M -8,-28 L -13,-36 M 13,-28 L 8,-36 M 8,-28 L 13,-36" fill="none" />
      </g>
      {/* メイン展望台 */}
      <g transform="translate(0, -52)">
        <polygon points="-9,0 9,0 7.5,-6 -7.5,-6" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <rect x="-7" y="-4.8" width="14" height="2.4" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.6" />
      </g>
      {/* 上部タワー */}
      <polygon points="-6,-58 6,-58 2,-78 -2,-78" fill="#fb923c" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M -5,-63 L 5,-63 M -4,-68 L 4,-68 M -3,-73 L 3,-73" stroke="#7c2d12" strokeWidth="0.8" />
      {/* 特別展望台 */}
      <polygon points="-4.5,-78 4.5,-78 3.5,-82 -3.5,-82" fill="#f8fafc" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* アンテナ */}
      <line x1="0" y1="-82" x2="0" y2="-96" stroke="#1e293b" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="0" y1="-86" x2="0" y2="-96" stroke="#f8fafc" strokeWidth="0.6" />
      <circle cx="0" cy="-97" r="1.8" fill="#ef4444" stroke="#1e293b" strokeWidth="0.7" filter="url(#glow-effect)" />
      {/* 基部の建物 */}
      <IsoCube x={34} y={34} w={32} d={32} h={7} top="#e2e8f0" left="#f8fafc" right="#cbd5e1" sw={0.9} />
    </g>
  </svg>
);

export const SvgStadium = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 78) scale(2.1)">
      <ellipse cx="0" cy="8" rx="42" ry="20" fill="#020617" opacity="0.16" />
      {/* 外壁（下段） */}
      <path d="M -40,0 A 40,19 0 0 0 40,0 L 40,-8 A 40,19 0 0 1 -40,-8 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.3" />
      {/* 外壁の柱 */}
      {[-36, -26, -14, 0, 14, 26, 36].map(x => {
        const yy = Math.sqrt(Math.max(0, 1 - (x * x) / 1600)) * 19;
        return <line key={x} x1={x} y1={yy - 8} x2={x} y2={yy} stroke="#475569" strokeWidth="1.1" />;
      })}
      {/* スタンド上段（外周リング） */}
      <path d="M -40,-8 A 40,19 0 0 1 40,-8 A 40,19 0 0 1 -40,-8 Z" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.3" />
      {/* 観客席（段差リング） */}
      <ellipse cx="0" cy="-8" rx="40" ry="19" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.3" />
      <ellipse cx="0" cy="-9.5" rx="34" ry="16" fill="#3b82f6" stroke="#1e293b" strokeWidth="1" />
      <ellipse cx="0" cy="-11" rx="29" ry="13.5" fill="#60a5fa" stroke="#1e293b" strokeWidth="0.9" />
      {/* 観客のドット */}
      {[[-30, -12], [-20, -19], [0, -22.5], [20, -19], [30, -12], [-26, -3], [26, -3], [10, -21.5], [-10, -21.5]].map(([px, py], i) => (
        <circle key={i} cx={px} cy={py} r="0.9" fill={['#fef08a', '#fca5a5', '#f8fafc'][i % 3]} opacity="0.95" />
      ))}
      {/* フィールド */}
      <ellipse cx="0" cy="-12.5" rx="24" ry="10.5" fill="#4ade80" stroke="#1e293b" strokeWidth="1.1" />
      <ellipse cx="0" cy="-12.5" rx="23" ry="9.7" fill="none" stroke="#f8fafc" strokeWidth="0.8" opacity="0.9" />
      <line x1="0" y1="-22" x2="0" y2="-3" stroke="#f8fafc" strokeWidth="0.8" opacity="0.9" />
      <ellipse cx="0" cy="-12.5" rx="6" ry="2.6" fill="none" stroke="#f8fafc" strokeWidth="0.8" opacity="0.9" />
      {/* 照明塔 */}
      {[[-38, -22], [38, -22]].map(([px, py], i) => (
        <g key={i} transform={`translate(${px}, ${py})`}>
          <line x1="0" y1="14" x2="0" y2="-8" stroke="#334155" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-4.5" y="-14" width="9" height="6" rx="1" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
          {[-2.8, 0, 2.8].map(lx => <circle key={lx} cx={lx} cy="-12.4" r="1" fill="#fef08a" />)}
          {[-2.8, 0, 2.8].map(lx => <circle key={`b-${lx}`} cx={lx} cy="-9.8" r="1" fill="#fde047" />)}
        </g>
      ))}
      {/* 電光掲示板 */}
      <g transform="translate(0, -29)">
        <rect x="-9" y="-6" width="18" height="7" rx="1" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
        <rect x="-7.4" y="-4.6" width="14.8" height="4.2" fill="#166534" />
        <circle cx="-4" cy="-2.5" r="0.8" fill="#4ade80" />
        <circle cx="0" cy="-2.5" r="0.8" fill="#facc15" />
        <circle cx="4" cy="-2.5" r="0.8" fill="#4ade80" />
        <line x1="0" y1="1" x2="0" y2="6" stroke="#334155" strokeWidth="1.4" />
      </g>
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
      <g transform="translate(50, 68) scale(1.5)">
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
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={38} />
      {/* 砂地パッド */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#fde68a" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <circle cx={isoPt(30, 74, 0)[0]} cy={isoPt(30, 74, 0)[1]} r="1" fill="#f59e0b" />
      <circle cx={isoPt(70, 82, 0)[0]} cy={isoPt(70, 82, 0)[1]} r="1.2" fill="#f59e0b" />
      {/* すべり台 */}
      <g transform={`translate(${isoPt(30, 34, 0)[0].toFixed(1)}, ${isoPt(30, 34, 0)[1].toFixed(1)})`}>
        {/* やぐら */}
        <line x1="-6" y1="0" x2="-6" y2="-16" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="0" y1="3" x2="0" y2="-13" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" />
        {/* はしご */}
        <line x1="-6" y1="-4" x2="0" y2="-1" stroke="#64748b" strokeWidth="1.1" />
        <line x1="-6" y1="-8" x2="0" y2="-5" stroke="#64748b" strokeWidth="1.1" />
        <line x1="-6" y1="-12" x2="0" y2="-9" stroke="#64748b" strokeWidth="1.1" />
        {/* プラットフォーム＋屋根 */}
        <polygon points="-8,-16 0,-13 6,-16 -2,-19" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <polygon points="-9,-24 -1,-21 7,-24.5 -1,-27.5" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points="-9,-24 -1,-21 -1,-19.4 -9,-22.4" fill="#b91c1c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 滑走面 */}
        <polygon points="1,-14 6,-16 20,-2 15,0.5" fill="#fbbf24" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
        <polygon points="1,-14 15,0.5 15,2.5 1,-12" fill="#d97706" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* ブランコ */}
      <g transform={`translate(${isoPt(66, 70, 0)[0].toFixed(1)}, ${isoPt(66, 70, 0)[1].toFixed(1)})`}>
        <path d="M -10,2 L -8,-16 M -6,3.5 L -8,-16" fill="none" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 10,-3 L 8,-20 M 14,-1.5 L 8,-20" fill="none" stroke="#0ea5e9" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="-8" y1="-16" x2="8" y2="-20" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
        <line x1="-3" y1="-17.2" x2="-3.5" y2="-6" stroke="#334155" strokeWidth="0.8" />
        <line x1="0.5" y1="-18" x2="0" y2="-6.8" stroke="#334155" strokeWidth="0.8" />
        <rect x="-5" y="-6.4" width="6.5" height="1.8" rx="0.7" fill="#dc2626" stroke="#1e293b" strokeWidth="0.8" />
      </g>
    </g>
  </svg>
);

export const SvgPool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* デッキ */}
      <IsoCube x={4} y={4} w={92} d={92} h={4} top="#e2e8f0" left="#cbd5e1" right="#94a3b8" sw={1} />
      {/* プール縁 */}
      <polygon points={`${iso3(16, 16, 4.1)} ${iso3(84, 16, 4.1)} ${iso3(84, 84, 4.1)} ${iso3(16, 84, 4.1)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 水面（少し下げて内壁を見せる） */}
      <polygon points={`${iso3(19, 19, 4.1)} ${iso3(81, 19, 4.1)} ${iso3(81, 19, 1.8)} ${iso3(19, 19, 1.8)}`.replace(/ /g, ' ')} fill="none" />
      <polygon points={`${iso3(19, 81, 1.8)} ${iso3(19, 19, 1.8)} ${iso3(19, 19, 4.1)} ${iso3(19, 81, 4.1)}`} fill="#bae6fd" stroke="#0369a1" strokeWidth="0.6" />
      <polygon points={`${iso3(19, 19, 1.8)} ${iso3(81, 19, 1.8)} ${iso3(81, 19, 4.1)} ${iso3(19, 19, 4.1)}`} fill="#e0f2fe" stroke="#0369a1" strokeWidth="0.6" />
      <polygon points={`${iso3(19, 19, 1.8)} ${iso3(81, 19, 1.8)} ${iso3(81, 81, 1.8)} ${iso3(19, 81, 1.8)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="0.8" strokeLinejoin="round" />
      {/* コースロープ */}
      <line x1={isoPt(19, 40, 1.9)[0]} y1={isoPt(19, 40, 1.9)[1]} x2={isoPt(81, 40, 1.9)[0]} y2={isoPt(81, 40, 1.9)[1]} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3,2" opacity="0.9" />
      <line x1={isoPt(19, 60, 1.9)[0]} y1={isoPt(19, 60, 1.9)[1]} x2={isoPt(81, 60, 1.9)[0]} y2={isoPt(81, 60, 1.9)[1]} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3,2" opacity="0.9" />
      {/* 波のきらめき */}
      {[[32, 30], [55, 50], [40, 68], [68, 72]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 1.9)[0]},${isoPt(wx, wy, 1.9)[1]} q 3.5,-1.4 7,0`} fill="none" stroke="#e0f2fe" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* はしご */}
      <g transform={`translate(${isoPt(84, 30, 4.1)[0].toFixed(1)}, ${isoPt(84, 30, 4.1)[1].toFixed(1)})`}>
        <path d="M 0,-4 L 0,4 M 3.4,-2.5 L 3.4,5.5" fill="none" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="0" y1="-1.5" x2="3.4" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <line x1="0" y1="1.5" x2="3.4" y2="3" stroke="#94a3b8" strokeWidth="1" />
      </g>
      {/* ビーチボール */}
      <g transform={`translate(${isoPt(60, 88, 5)[0].toFixed(1)}, ${isoPt(60, 88, 5)[1].toFixed(1)})`}>
        <circle cx="0" cy="-2.6" r="3.4" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.9" />
        <path d="M 0,-6 C 2.6,-5 2.6,-0.2 0,0.8 M 0,-6 C -2.6,-5 -2.6,-0.2 0,0.8" fill="none" stroke="#ef4444" strokeWidth="0.9" />
      </g>
    </g>
  </svg>
);

export const SvgFerrisWheel = () => {
  const R = 26; const CX = 0; const CY = -58;
  const cabinColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 100) scale(2.1)">
        <IsoShadow rx={30} ry={13} />
        {/* 支柱（A型フレーム前後） */}
        <polygon points={`${CX - 14},-6 ${CX - 2},${CY + 4} ${CX + 2},${CY + 4} ${CX - 9},-6`} fill="#64748b" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={`${CX + 14},-6 ${CX + 2},${CY + 4} ${CX - 2},${CY + 4} ${CX + 9},-6`} fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={`${CX - 16},-4 ${CX + 16},-4 ${CX + 13},-9 ${CX - 13},-9`} fill="#475569" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" transform="translate(0, 3)" />
        {/* リム（二重） */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth="3.6" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx={CX} cy={CY} r={R - 4.6} fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
        {/* スポーク */}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map(a => {
          const rad = a * Math.PI / 180;
          return <line key={a} x1={CX - R * Math.cos(rad)} y1={CY - R * Math.sin(rad)} x2={CX + R * Math.cos(rad)} y2={CY + R * Math.sin(rad)} stroke="#94a3b8" strokeWidth="1" />;
        })}
        {/* ハブ */}
        <circle cx={CX} cy={CY} r="4.6" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
        <circle cx={CX} cy={CY} r="2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="0.7" />
        {/* ゴンドラ（8基） */}
        {cabinColors.map((c, i) => {
          const a = (i * 45 + 22.5) * Math.PI / 180;
          const gx = CX + R * Math.cos(a);
          const gy = CY + R * Math.sin(a);
          return (
            <g key={i} transform={`translate(${gx.toFixed(1)}, ${gy.toFixed(1)})`}>
              <line x1="0" y1="0" x2="0" y2="3" stroke="#1e293b" strokeWidth="0.9" />
              <path d="M -3.4,3 L 3.4,3 L 2.6,9 Q 0,10.4 -2.6,9 Z" fill={c} stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
              <rect x="-2" y="4.2" width="4" height="2.2" rx="0.8" fill="#e0f2fe" stroke="#1e293b" strokeWidth="0.5" />
            </g>
          );
        })}
        {/* 乗り場 */}
        <IsoCube x={40} y={58} w={22} d={18} h={7} top="#f8fafc" left="#e2e8f0" right="#cbd5e1" sw={0.9} />
      </g>
    </svg>
  );
};

export const SvgAmusementPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      {/* 敷地 */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(40, 40, 0.1)} ${iso3(60, 40, 0.1)} ${iso3(60, 98, 0.1)} ${iso3(40, 98, 0.1)}`} fill="#fde68a" opacity="0.8" />
      {/* ミニ観覧車（左奥） */}
      <g transform={`translate(${isoPt(28, 28, 0)[0].toFixed(1)}, ${isoPt(28, 28, 0)[1].toFixed(1)})`}>
        <polygon points="-6,0 -0.8,-20 0.8,-20 -3,0" fill="#64748b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="6,0 0.8,-20 -0.8,-20 3,0" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <circle cx="0" cy="-20" r="11" fill="none" stroke="#1e293b" strokeWidth="2.2" />
        <circle cx="0" cy="-20" r="11" fill="none" stroke="#38bdf8" strokeWidth="1" />
        {[0, 45, 90, 135].map(a => {
          const rad = a * Math.PI / 180;
          return <line key={a} x1={-11 * Math.cos(rad)} y1={-20 - 11 * Math.sin(rad)} x2={11 * Math.cos(rad)} y2={-20 + 11 * Math.sin(rad)} stroke="#94a3b8" strokeWidth="0.8" />;
        })}
        <circle cx="0" cy="-20" r="2.2" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
        {[0, 90, 180, 270].map((a, i) => {
          const rad = (a + 45) * Math.PI / 180;
          return <circle key={a} cx={11 * Math.cos(rad)} cy={-20 + 11 * Math.sin(rad) + 1.6} r="1.9"
            fill={['#ef4444', '#facc15', '#3b82f6', '#22c55e'][i]} stroke="#1e293b" strokeWidth="0.7" />;
        })}
      </g>
      {/* メリーゴーラウンド（右手前） */}
      <g transform={`translate(${isoPt(72, 62, 0)[0].toFixed(1)}, ${isoPt(72, 62, 0)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="0" rx="13" ry="6" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.1" />
        <ellipse cx="0" cy="-1.6" rx="13" ry="6" fill="#fda4af" stroke="#1e293b" strokeWidth="1.1" />
        {[-9, -3, 3, 9].map((px, i) => (
          <line key={i} x1={px} y1={-3 + Math.abs(px) * 0.16} x2={px} y2={-12} stroke="#fbbf24" strokeWidth="1" />
        ))}
        {/* テント屋根 */}
        <path d="M -14,-11 Q 0,-15.5 14,-11 L 0,-24 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M -7,-12.8 L 0,-24 L -0.5,-13.4 Z M 7,-12.8 L 0,-24 L 0.5,-13.4 Z" fill="#fef3c7" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        <circle cx="0" cy="-25" r="1.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.7" />
        {/* 木馬 */}
        <g transform="translate(-6, -5)"><path d="M -1.6,0 Q -2.4,-2.4 0,-2.6 Q 2.4,-2.8 2,-1 L 1.2,0.8 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.7" /></g>
        <g transform="translate(6, -6.6)"><path d="M -1.6,0 Q -2.4,-2.4 0,-2.6 Q 2.4,-2.8 2,-1 L 1.2,0.8 Z" fill="#a78bfa" stroke="#1e293b" strokeWidth="0.7" /></g>
      </g>
      {/* 入場ゲート（手前） */}
      <g>
        <IsoCube x={38} y={88} w={5} d={7} h={13} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <IsoCube x={57} y={88} w={5} d={7} h={13} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <polygon points={`${iso3(34, 95, 13)} ${iso3(66, 95, 13)} ${iso3(66, 95, 19)} ${iso3(34, 95, 19)}`} fill="#fbbf24" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx={isoPt(42, 95, 16)[0]} cy={isoPt(42, 95, 16)[1]} r="1.2" fill="#ef4444" />
        <circle cx={isoPt(50, 95, 16)[0]} cy={isoPt(50, 95, 16)[1]} r="1.2" fill="#3b82f6" />
        <circle cx={isoPt(58, 95, 16)[0]} cy={isoPt(58, 95, 16)[1]} r="1.2" fill="#22c55e" />
        {/* 旗 */}
        <line x1={isoPt(40.5, 91.5, 13)[0]} y1={isoPt(40.5, 91.5, 13)[1] - 6} x2={isoPt(40.5, 91.5, 13)[0]} y2={isoPt(40.5, 91.5, 13)[1] - 13} stroke="#1e293b" strokeWidth="0.8" />
        <polygon points={`${isoPt(40.5, 91.5, 13)[0]},${isoPt(40.5, 91.5, 13)[1] - 13} ${isoPt(40.5, 91.5, 13)[0] + 6},${isoPt(40.5, 91.5, 13)[1] - 11.4} ${isoPt(40.5, 91.5, 13)[0]},${isoPt(40.5, 91.5, 13)[1] - 9.8}`} fill="#ef4444" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

// ==========================================
// 11. 乗り物 (Vehicles)
// アイソメトリックの車体＋タイヤ＋窓で統一クオリティ
// ==========================================

/** アイソメトリックのタイヤ（南西面に見える車輪） */
const WheelSW = ({ x, y, r = 4.5 }) => {
  const [px, py] = isoPt(x, y, 0);
  return (
    <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(26.57)`}>
      <ellipse cx="0" cy={-r} rx={r * 0.62} ry={r} fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
      <ellipse cx="0" cy={-r} rx={r * 0.3} ry={r * 0.48} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.6" />
    </g>
  );
};

export const SvgCar = ({ seed = 0 }) => {
  const bodies = [
    { l: '#ef4444', r: '#b91c1c', t: '#f87171' },
    { l: '#3b82f6', r: '#1d4ed8', t: '#60a5fa' },
    { l: '#facc15', r: '#ca8a04', t: '#fde047' },
  ];
  const c = bodies[(seed || 0) % bodies.length];
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 100) scale(2.15)">
        <IsoShadow cy={-21} rx={26} ry={11} o={0.2} />
        {/* 奥のタイヤ */}
        <WheelSW x={34} y={44} r={4} />
        <WheelSW x={62} y={44} r={4} />
        {/* 車体（下段） */}
        <IsoCube x={24} y={40} z={3} w={52} d={22} h={8} top={c.t} left={c.l} right={c.r} sw={1} />
        {/* キャビン */}
        <IsoCube x={34} y={41.5} z={11} w={30} d={19} h={9} top={c.t} left={c.l} right={c.r} sw={1} />
        {/* 窓（サイド2枚 + 後部） */}
        <FaceSW x1={36.5} x2={47} y={60.5} z1={12.5} z2={18.5} fill="#bae6fd" sw={0.8} />
        <FaceSW x1={50} x2={61} y={60.5} z1={12.5} z2={18.5} fill="#7dd3fc" sw={0.8} />
        <FaceSE x={64.2} y1={44.5} y2={57.5} z1={12.5} z2={18.5} fill="#bae6fd" sw={0.8} />
        {/* ヘッドライト・テールランプ */}
        <FaceSE x={76.2} y1={43} y2={47} z1={6} z2={9} fill="#fef08a" sw={0.7} />
        <FaceSE x={76.2} y1={55} y2={59} z1={6} z2={9} fill="#fde047" sw={0.7} />
        <FaceSW x1={25.5} x2={29} y={62.2} z1={6} z2={9} fill="#f87171" sw={0.7} />
        {/* バンパー */}
        <FaceSE x={76.4} y1={42} y2={60} z1={3} z2={5} fill="#cbd5e1" sw={0.7} />
        {/* 手前のタイヤ */}
        <WheelSW x={34} y={63} r={4.5} />
        <WheelSW x={62} y={63} r={4.5} />
      </g>
    </svg>
  );
};

export const SvgBus = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow cy={-21} rx={32} ry={12} o={0.2} />
      <WheelSW x={26} y={42} r={4.5} />
      <WheelSW x={70} y={42} r={4.5} />
      {/* 車体 */}
      <IsoCube x={12} y={38} z={3} w={76} d={24} h={19} top="#4ade80" left="#22c55e" right="#15803d" sw={1.1} />
      {/* 白い帯 */}
      <FaceSW x1={12} x2={88} y={62.2} z1={12} z2={15} fill="#f8fafc" sw={0.7} />
      {/* サイド窓列 */}
      {[15, 29, 43, 57].map(x => (
        <FaceSW key={x} x1={x} x2={x + 11} y={62.3} z1={14.5} z2={20} fill="#bae6fd" sw={0.8} />
      ))}
      {/* 乗降ドア */}
      <FaceSW x1={71} x2={84} y={62.3} z1={4} z2={20} fill="#0f172a" sw={0.9} />
      <FaceSW x1={72.5} x2={77} y={62.5} z1={5} z2={19} fill="#7dd3fc" sw={0.5} />
      <FaceSW x1={78.5} x2={82.5} y={62.5} z1={5} z2={19} fill="#7dd3fc" sw={0.5} />
      {/* フロントガラス・ライト */}
      <FaceSE x={88.2} y1={41} y2={59} z1={13} z2={20.5} fill="#bae6fd" sw={0.9} />
      <FaceSE x={88.2} y1={40} y2={44} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      <FaceSE x={88.2} y1={56} y2={60} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      {/* 行き先表示 */}
      <FaceSE x={88.3} y1={45} y2={55} z1={21.5} z2={24.5} fill="#1e293b" sw={0.7} />
      <WheelSW x={26} y={64} r={5} />
      <WheelSW x={70} y={64} r={5} />
    </g>
  </svg>
);

export const SvgBicycle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 78) scale(2.3)">
      <ellipse cx="0" cy="10" rx="18" ry="5" fill="#020617" opacity="0.18" />
      {/* 車輪 */}
      {[-10.5, 10.5].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="1" r="9" fill="none" stroke="#1e293b" strokeWidth="2.4" />
          <circle cx={cx} cy="1" r="6.8" fill="none" stroke="#94a3b8" strokeWidth="0.9" />
          {[0, 45, 90, 135].map(a => (
            <line key={a} x1={cx - 6.6 * Math.cos(a * Math.PI / 180)} y1={1 - 6.6 * Math.sin(a * Math.PI / 180)}
              x2={cx + 6.6 * Math.cos(a * Math.PI / 180)} y2={1 + 6.6 * Math.sin(a * Math.PI / 180)}
              stroke="#94a3b8" strokeWidth="0.7" />
          ))}
          <circle cx={cx} cy="1" r="1.3" fill="#475569" stroke="#1e293b" strokeWidth="0.6" />
        </g>
      ))}
      {/* フレーム */}
      <path d="M -10.5,1 L -3,-9 L 8,-9 M -3,-9 L 2,1 L 10.5,1 L 8,-9 L 9.5,-12 M -10.5,1 L -3.5,-12 M 2,1 L -10.5,1"
        fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* サドル・ハンドル */}
      <path d="M -6.5,-13 L -0.5,-13" stroke="#1e293b" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 9.5,-12 Q 12.5,-13.5 13,-11" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {/* ペダル・チェーン */}
      <circle cx="2" cy="1" r="2.6" fill="none" stroke="#475569" strokeWidth="1" />
      <line x1="2" y1="1" x2="5.5" y2="4" stroke="#1e293b" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4.5" y="3.4" width="3" height="1.4" rx="0.5" fill="#1e293b" />
      {/* 前かご */}
      <path d="M 10,-10.5 L 15,-10.5 L 14.4,-6.5 L 10.6,-6.5 Z" fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgShipVehicle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 水面パッド */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="1" strokeLinejoin="round" />
      {[[20, 70], [55, 82], [75, 30], [30, 30]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 0)[0]},${isoPt(wx, wy, 0)[1]} q 4,-1.6 8,0`} fill="none" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* 船体（側面カーブ付き） */}
      <g transform={`translate(${isoPt(50, 52, 0)[0]}, ${isoPt(50, 52, 0)[1]})`}>
        {/* 船体外側 */}
        <path d="M -26,-6 C -27,-1 -23,3 -16,4 L 14,9 C 22,10 27,6 28,0 L 29,-4 L 22,-6 Z"
          fill="#b45309" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" transform="translate(0,-8)" />
        {/* 船縁（内側デッキ） */}
        <path d="M -24,-13 L 27,-11.5 C 25,-9 18,-7.5 8,-7.5 L -14,-10 C -20,-10.8 -23,-11.8 -24,-13 Z"
          fill="#f59e0b" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        {/* 操舵室 */}
        <g transform="translate(9, -16)">
          <rect x="-6" y="-8" width="12" height="9" rx="1" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.1" />
          <rect x="-4" y="-6.4" width="8" height="3.6" rx="0.6" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.7" />
          <rect x="-7.5" y="-9.6" width="15" height="2" rx="1" fill="#0ea5e9" stroke="#1e293b" strokeWidth="0.8" />
        </g>
        {/* マスト＋旗 */}
        <line x1="-12" y1="-11" x2="-12" y2="-30" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
        <polygon points="-12,-30 -4,-27.5 -12,-25" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 浮き輪 */}
        <circle cx="-19" cy="-9" r="2.6" fill="#f8fafc" stroke="#ef4444" strokeWidth="1.4" />
      </g>
    </g>
  </svg>
);

export const SvgAirplane = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 駐機場パッド */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points={`${iso3(46, 10, 0.1)} ${iso3(54, 10, 0.1)} ${iso3(54, 90, 0.1)} ${iso3(46, 90, 0.1)}`} fill="#fbbf24" opacity="0.7" />
      {/* 機体（斜め上から見たスタイル） */}
      <g transform="translate(0, -24) rotate(-24) scale(1.05)">
        <ellipse cx="0" cy="14" rx="9" ry="3.5" fill="#020617" opacity="0.15" />
        {/* 主翼（後ろ側） */}
        <polygon points="-2.5,-4 -21,6 -18,9 -1,2" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        {/* 胴体 */}
        <path d="M 0,-24 C 4,-18 4.6,-8 4.6,2 L 4.2,10 C 4,13 -4,13 -4.2,10 L -4.6,2 C -4.6,-8 -4,-18 0,-24 Z"
          fill="#f8fafc" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        {/* コックピット窓 */}
        <path d="M -2.6,-17 C -1,-20.5 1,-20.5 2.6,-17 C 1,-18.2 -1,-18.2 -2.6,-17 Z" fill="#0ea5e9" stroke="#1e293b" strokeWidth="0.8" />
        {/* 客室窓 */}
        {[-12, -8, -4, 0, 4].map(y => <circle key={y} cx="0" cy={y} r="1" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.4" />)}
        {/* 主翼（手前側）＋エンジン */}
        <polygon points="2.5,-4 21,6 18,9 1,2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <ellipse cx="10.5" cy="4.6" rx="2" ry="3" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
        <ellipse cx="-10.5" cy="4.6" rx="2" ry="3" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
        {/* 尾翼 */}
        <polygon points="-1.5,9 -8,15.5 -6.4,17 0,12" fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="1.5,9 8,15.5 6.4,17 0,12" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="-1.2,10 0,17.5 1.2,10" fill="#ef4444" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgFireTruck = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow cy={-21} rx={32} ry={12} o={0.2} />
      <WheelSW x={26} y={42} r={4.5} />
      <WheelSW x={70} y={42} r={4.5} />
      {/* 荷台（後部） */}
      <IsoCube x={12} y={38} z={3} w={50} d={24} h={16} top="#f87171" left="#ef4444" right="#b91c1c" sw={1.1} />
      {/* キャブ（前部） */}
      <IsoCube x={62} y={38} z={3} w={26} d={24} h={19} top="#f87171" left="#ef4444" right="#b91c1c" sw={1.1} />
      {/* 白帯・器具箱 */}
      <FaceSW x1={12} x2={62} y={62.2} z1={5} z2={8} fill="#f8fafc" sw={0.7} />
      <FaceSW x1={16} x2={30} y={62.3} z1={9} z2={16} fill="#cbd5e1" sw={0.8} />
      <FaceSW x1={33} x2={47} y={62.3} z1={9} z2={16} fill="#cbd5e1" sw={0.8} />
      {/* キャブ窓・ライト */}
      <FaceSW x1={65} x2={76} y={62.3} z1={13} z2={20} fill="#bae6fd" sw={0.8} />
      <FaceSE x={88.2} y1={41} y2={59} z1={13} z2={20.5} fill="#7dd3fc" sw={0.9} />
      <FaceSE x={88.2} y1={40} y2={44} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      <FaceSE x={88.2} y1={56} y2={60} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      {/* 赤色灯 */}
      <g transform={`translate(${isoPt(75, 50, 23)[0].toFixed(1)}, ${isoPt(75, 50, 23)[1].toFixed(1)})`}>
        <rect x="-3" y="-2.6" width="6" height="2.8" rx="1" fill="#dc2626" stroke="#1e293b" strokeWidth="0.7" filter="url(#glow-effect)" />
      </g>
      {/* はしご（銀色・荷台の上） */}
      <g>
        <polygon points={`${iso3(14, 46, 20)} ${iso3(58, 46, 24)} ${iso3(58, 49, 24)} ${iso3(14, 49, 20)}`} fill="#e2e8f0" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(14, 54, 20)} ${iso3(58, 54, 24)} ${iso3(58, 57, 24)} ${iso3(14, 57, 20)}`} fill="#cbd5e1" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[20, 28, 36, 44, 52].map(x => (
          <line key={x} x1={isoPt(x, 49, 20 + (x - 14) / 11)[0]} y1={isoPt(x, 49, 20 + (x - 14) / 11)[1]}
            x2={isoPt(x, 54, 20 + (x - 14) / 11)[0]} y2={isoPt(x, 54, 20 + (x - 14) / 11)[1]}
            stroke="#94a3b8" strokeWidth="1.2" />
        ))}
      </g>
      <WheelSW x={26} y={64} r={5} />
      <WheelSW x={70} y={64} r={5} />
    </g>
  </svg>
);

// ==========================================
// 12. ストリートファニチャー (Street Furniture)
// 小物は正面寄りの2.5Dで大きく描き、太い輪郭線で統一
// ==========================================
export const SvgBench = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 82) scale(2.6)">
      <ellipse cx="0" cy="8" rx="17" ry="5" fill="#020617" opacity="0.18" />
      {/* 脚（鋳鉄風） */}
      <path d="M -11,7 L -11,-4 M -11,1 Q -13.5,1 -13.5,4 L -13.5,7" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d="M 11,7 L 11,-4 M 11,1 Q 13.5,1 13.5,4 L 13.5,7" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {/* 座面（板3枚） */}
      <rect x="-15" y="-4" width="30" height="2.4" rx="1.2" fill="#d97706" stroke="#1e293b" strokeWidth="1.1" />
      <rect x="-15" y="-1" width="30" height="2.4" rx="1.2" fill="#b45309" stroke="#1e293b" strokeWidth="1.1" />
      {/* 背もたれ（板2枚） */}
      <rect x="-15" y="-12.5" width="30" height="2.4" rx="1.2" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.1" />
      <rect x="-15" y="-9" width="30" height="2.4" rx="1.2" fill="#d97706" stroke="#1e293b" strokeWidth="1.1" />
      {/* 背もたれ支柱 */}
      <line x1="-11" y1="-4" x2="-11" y2="-13" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="-4" x2="11" y2="-13" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgMailbox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 85) scale(2.6)">
      <ellipse cx="0" cy="7" rx="10" ry="3.5" fill="#020617" opacity="0.2" />
      {/* 台座 */}
      <path d="M -6,7 L -5,3.5 L 5,3.5 L 6,7 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 円筒の本体 */}
      <rect x="-5.5" y="-16" width="11" height="19.5" rx="1" fill="#ef4444" stroke="#1e293b" strokeWidth="1.4" />
      <path d="M -5.5,-16 A 5.5,4.5 0 0 1 5.5,-16" fill="#f87171" stroke="#1e293b" strokeWidth="1.4" />
      {/* 帽子（キャップ） */}
      <path d="M -7,-15.5 L 7,-15.5 L 6,-18 L -6,-18 Z" fill="#dc2626" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 投函口 */}
      <rect x="-4" y="-13.5" width="8" height="2" rx="0.8" fill="#1e293b" />
      {/* 〒マークと取出口 */}
      <path d="M -2.6,-8.5 L 2.6,-8.5 M -2.6,-6.7 L 2.6,-6.7 M 0,-6.7 L 0,-3.4" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="-3.6" y="-1.6" width="7.2" height="3.6" rx="0.6" fill="#b91c1c" stroke="#1e293b" strokeWidth="0.9" />
    </g>
  </svg>
);

export const SvgPhoneBooth = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 88) scale(2.5)">
      <ellipse cx="0" cy="6" rx="12" ry="4" fill="#020617" opacity="0.2" />
      {/* ボックス本体（2.5D） */}
      <polygon points="-8,5 -8,-24 2,-28 2,1" fill="#166534" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="2,1 2,-28 9,-25 9,4" fill="#14532d" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      {/* ガラスパネル（正面ドア） */}
      <polygon points="-6.4,2.6 -6.4,-21 0.4,-24 0.4,-0.4" fill="url(#grad-glass)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <line x1="-3" y1="1.2" x2="-3" y2="-22.4" stroke="#14532d" strokeWidth="1" />
      {/* ガラスパネル（側面） */}
      <polygon points="3.6,-1 3.6,-24.5 7.4,-22.8 7.4,0.8" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" opacity="0.9" />
      {/* 屋根 */}
      <polygon points="-10,-23 2,-27.8 11,-24 -1,-19.4" fill="#22c55e" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
      <polygon points="-10,-23 -1,-19.4 -1,-17.6 -10,-21.2" fill="#15803d" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points="-1,-19.4 11,-24 11,-22.2 -1,-17.6" fill="#166534" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 中の電話機 */}
      <rect x="-5.6" y="-14" width="3.6" height="5" rx="0.6" fill="#334155" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M -5.2,-14.4 Q -3.8,-16 -2.4,-14.4" fill="none" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
      {/* 電話サイン */}
      <rect x="-6.2" y="-27.6" width="5" height="2.6" rx="0.5" fill="#fef08a" stroke="#1e293b" strokeWidth="0.7" transform="skewY(-21)" />
    </g>
  </svg>
);

export const SvgStreetLight = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 92) scale(2.5)">
      <ellipse cx="0" cy="3.5" rx="8" ry="3" fill="#020617" opacity="0.18" />
      {/* 台座 */}
      <path d="M -3.5,3 L -2.2,-0.5 L 2.2,-0.5 L 3.5,3 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* ポール（上部でカーブ） */}
      <path d="M 0,-0.5 L 0,-30 Q 0,-36 6,-36 L 10,-36" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 0,-0.5 L 0,-30 Q 0,-35 5.5,-35.2" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
      {/* ランプヘッド */}
      <path d="M 7,-36.8 L 13,-36.8 L 14.4,-33.4 L 5.6,-33.4 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="10" cy="-33" rx="3.6" ry="1.6" fill="#fef08a" stroke="#1e293b" strokeWidth="0.9" filter="url(#glow-effect)" />
      {/* 光のこぼれ */}
      <path d="M 6.5,-32 L 3.5,-24 M 13.5,-32 L 16.5,-24" stroke="#fde047" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* 小さな装飾バナー */}
      <rect x="-4.6" y="-26" width="4.6" height="9" rx="0.8" fill="#22c55e" stroke="#1e293b" strokeWidth="0.9" />
      <circle cx="-2.3" cy="-21.5" r="1.5" fill="#fef9c3" />
    </g>
  </svg>
);

export const SvgBusStop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 88) scale(2.5)">
      <ellipse cx="0" cy="5" rx="12" ry="4" fill="#020617" opacity="0.18" />
      {/* 台座とポール */}
      <ellipse cx="-4" cy="3.4" rx="4.4" ry="1.8" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
      <line x1="-4" y1="3" x2="-4" y2="-27" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      {/* 標識（丸板） */}
      <circle cx="-4" cy="-30" r="7.5" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.4" />
      <circle cx="-4" cy="-30" r="5.8" fill="none" stroke="#f8fafc" strokeWidth="1" />
      {/* バスのピクトグラム */}
      <g transform="translate(-4, -30)">
        <rect x="-3.6" y="-2.6" width="7.2" height="4.4" rx="0.8" fill="#f8fafc" />
        <rect x="-2.8" y="-1.8" width="2.2" height="1.6" fill="#3b82f6" />
        <rect x="0.6" y="-1.8" width="2.2" height="1.6" fill="#3b82f6" />
        <circle cx="-2" cy="2.2" r="0.9" fill="#f8fafc" />
        <circle cx="2" cy="2.2" r="0.9" fill="#f8fafc" />
      </g>
      {/* 時刻表ボックス */}
      <rect x="-2.8" y="-18" width="7" height="9" rx="0.8" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.1" />
      <line x1="-1.2" y1="-15.6" x2="2.6" y2="-15.6" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="-1.2" y1="-13.6" x2="2.6" y2="-13.6" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="-1.2" y1="-11.6" x2="1.4" y2="-11.6" stroke="#94a3b8" strokeWidth="0.8" />
      {/* 小さなベンチ */}
      <rect x="2" y="-3.5" width="10" height="2" rx="1" fill="#d97706" stroke="#1e293b" strokeWidth="0.9" />
      <line x1="3.6" y1="-1.5" x2="3.6" y2="2.5" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10.4" y1="-1.5" x2="10.4" y2="2.5" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgVendingMachine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 86) scale(2.5)">
      <ellipse cx="0" cy="6" rx="11" ry="4" fill="#020617" opacity="0.2" />
      {/* 本体（2.5D） */}
      <polygon points="-8,5 -8,-22 3,-26 3,1" fill="#dc2626" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="3,1 3,-26 9,-23.5 9,3.5" fill="#991b1b" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="-8,-22 3,-26 9,-23.5 -2,-19.5" fill="#f87171" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 光る商品ディスプレイ */}
      <polygon points="-6.6,-11.5 1.6,-14.5 1.6,-23 -6.6,-20 " fill="#fef9c3" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 缶（2段） */}
      {[0, 1].map(row => (
        [0, 1, 2].map(col => (
          <rect key={`${row}-${col}`} x={-6 + col * 2.7} y={-19.2 + row * 3.6 - col * 1.0} width="2" height="2.8" rx="0.4"
            fill={['#3b82f6', '#22c55e', '#f59e0b'][col]} stroke="#1e293b" strokeWidth="0.5" />
        ))
      ))}
      {/* サンプル表示の仕切り */}
      <line x1="-6.6" y1="-16" x2="1.6" y2="-19" stroke="#94a3b8" strokeWidth="0.6" />
      {/* コイン投入口・ボタン */}
      <rect x="-6.6" y="-9.5" width="3" height="1.4" rx="0.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" transform="skewY(-20)" />
      <circle cx="0.4" cy="-9.6" r="0.8" fill="#fef08a" stroke="#1e293b" strokeWidth="0.5" />
      {/* 取出口 */}
      <polygon points="-6.4,0.8 1,-1.9 1,-4.9 -6.4,-2.2" fill="#450a0a" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points="-5.6,-0.1 0.2,-2.2 0.2,-3.9 -5.6,-1.8" fill="#7f1d1d" />
    </g>
  </svg>
);

export const SvgTrashCan = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 84) scale(2.5)">
      <ellipse cx="0" cy="5" rx="9.5" ry="3.5" fill="#020617" opacity="0.2" />
      {/* 本体（円筒） */}
      <path d="M -7,-13 L -6,3 A 6,2.6 0 0 0 6,3 L 7,-13 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      {/* 縦のリブ */}
      <line x1="-3.5" y1="-12.4" x2="-3" y2="4.6" stroke="#475569" strokeWidth="1" />
      <line x1="0" y1="-12.2" x2="0" y2="5.4" stroke="#475569" strokeWidth="1" />
      <line x1="3.5" y1="-12.4" x2="3" y2="4.6" stroke="#475569" strokeWidth="1" />
      {/* 帯 */}
      <path d="M -6.6,-7 Q 0,-4.6 6.6,-7" fill="none" stroke="#334155" strokeWidth="1.4" />
      {/* フタ */}
      <ellipse cx="0" cy="-13" rx="7.6" ry="3.2" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.3" />
      <ellipse cx="0" cy="-14" rx="7.6" ry="3.2" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.3" />
      {/* 投入口（スイングドア） */}
      <path d="M -3,-17.6 Q 0,-19.8 3,-17.6 L 3,-13.4 Q 0,-15 -3,-13.4 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* リサイクルマーク */}
      <g transform="translate(0, -3)" stroke="#4ade80" strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M -1.8,1.4 L 0,-1.6 L 1.8,1.4 Z" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

