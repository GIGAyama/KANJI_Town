import React from 'react';

// --- Shared Defs for Rich Commercial Game Quality Visuals ---
const SharedDefs = () => (
  <defs>
    {/* Gradients for UI/Shadows */}
    <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1.5" dy="3" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.4" />
    </filter>
    <filter id="strong-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="-2" dy="5" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.6" />
    </filter>
    <filter id="glow-effect" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
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
    {/* Base element gradients */}
    <linearGradient id="grad-roof-red" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#ef4444" />
      <stop offset="100%" stopColor="#991b1b" />
    </linearGradient>
    <linearGradient id="grad-roof-blue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#3b82f6" />
      <stop offset="100%" stopColor="#1e3a8a" />
    </linearGradient>
    <linearGradient id="grad-roof-slate" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#64748b" />
      <stop offset="100%" stopColor="#334155" />
    </linearGradient>
    <linearGradient id="grad-roof-brown" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#d97706" />
      <stop offset="100%" stopColor="#78350f" />
    </linearGradient>
    <linearGradient id="grad-wood" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#b45309" />
      <stop offset="100%" stopColor="#78350f" />
    </linearGradient>
  </defs>
);

// Helper for color adjustments
const darken = (hex, amt = 20) => {
  let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  r = Math.max(0, r - amt); g = Math.max(0, g - amt); b = Math.max(0, b - amt);
  return `#${[r,g,b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};
const lighten = (hex, amt = 20) => {
  let [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
  r = Math.min(255, r + amt); g = Math.min(255, g + amt); b = Math.min(255, b + amt);
  return `#${[r,g,b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
};

// --- Rich Isometric Diamond Base for Terrain ---
// thickness: adds 3D block-like depth
const D = ({ cTop, cLeft, cRight, w=100, h=50, style, thickness=0, children, cx=50, cy=75 }) => {
  const cT = cTop;
  const cL = cLeft || darken(cTop, 30);
  const cR = cRight || darken(cTop, 15);
  return (
    <svg viewBox="0 0 100 100" className={`w-full h-full ${style || ''} drop-shadow-sm`}>
      <SharedDefs />
      <g transform={`translate(${cx-50}, ${cy-50})`}>
        {/* Thickness faces */}
        {thickness > 0 && (
          <>
            <polygon points={`0,50 50,75 50,${75+thickness} 0,${50+thickness}`} fill={cL} />
            <polygon points={`50,75 100,50 100,${50+thickness} 50,${75+thickness}`} fill={cR} />
          </>
        )}
        {/* Top Face */}
        <polygon points="50,25 100,50 50,75 0,50" fill={cT} />
        {/* Top Face Highlight Edge */}
        <polyline points="0,50 50,25 100,50" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <polyline points="0,50 50,75 100,50" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {children}
      </g>
    </svg>
  );
};

// --- Rich Isometric Block for Buildings ---
const B = ({ cx=50, cy=75, w=40, h=40, wall, roof, type='flat', roofH=20, children, scale=1 }) => {
  const dx = (w/2) * scale;
  const dy = (w/4) * scale; // iso projection
  const zh = h * scale;
  
  // Wall Colors
  const wTop = wall;
  const wLeft = darken(wall, 40);
  const wRight = darken(wall, 20);
  
  // Roof Colors
  const rTop = type === 'slope' ? (roof.startsWith('url') ? roof : lighten(roof, 20)) : (roof.startsWith('url') ? roof : roof);
  const rLeft = type === 'flat' ? darken(roof, 30) : darken(roof, 10);
  const rRight = type === 'flat' ? darken(roof, 15) : roof;
  const rAccent = darken(roof, 50);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {/* Base Shadow */}
      <ellipse cx="0" cy="0" rx={dx*1.2} ry={dy*1.2} fill="#020617" opacity="0.3" filter="url(#soft-shadow)" />

      {/* Building Walls */}
      {/* Left Wall */}
      <polygon points={`0,0 -${dx},-${dy} -${dx},-${dy+zh} 0,-${zh}`} fill={wLeft} />
      {/* Right Wall */}
      <polygon points={`0,0 ${dx},-${dy} ${dx},-${dy+zh} 0,-${zh}`} fill={wRight} />
      
      {/* Door (Right Face Default) */}
      <polygon points={`${dx*0.2},-${dy*0.2} ${dx*0.6},-${dy*0.6} ${dx*0.6},-${dy*0.6+zh*0.4} ${dx*0.2},-${dy*0.2+zh*0.4}`} fill={darken(wall, 60)} />
      <polygon points={`${dx*0.25},-${dy*0.25+zh*0.05} ${dx*0.55},-${dy*0.55+zh*0.05} ${dx*0.55},-${dy*0.55+zh*0.35} ${dx*0.25},-${dy*0.25+zh*0.35}`} fill="#854d0e" />
      {/* Door knob */}
      <circle cx={dx*0.3} cy={-(dy*0.3+zh*0.2)} r="1.5" fill="#fef08a" />
      
      {/* Standard Window (Left Face) */}
      <polygon points={`-${dx*0.6},-${dy*0.6+zh*0.3} -${dx*0.2},-${dy*0.2+zh*0.3} -${dx*0.2},-${dy*0.2+zh*0.6} -${dx*0.6},-${dy*0.6+zh*0.6}`} fill={darken(wall, 50)} />
      <polygon points={`-${dx*0.55},-${dy*0.55+zh*0.35} -${dx*0.25},-${dy*0.25+zh*0.35} -${dx*0.25},-${dy*0.25+zh*0.55} -${dx*0.55},-${dy*0.55+zh*0.55}`} fill="url(#grad-glass)" />

      {/* Roof */}
      {type === 'flat' && (
        <>
          <polygon points={`0,-${zh} -${dx},-${dy+zh} 0,-${dy*2+zh} ${dx},-${dy+zh}`} fill={rTop} />
          {/* Flat Roof Trim */}
          <polygon points={`0,-${zh} -${dx},-${dy+zh} -${dx},-${dy+zh-2} 0,-${zh-2}`} fill={rLeft} />
          <polygon points={`0,-${zh} ${dx},-${dy+zh} ${dx},-${dy+zh-2} 0,-${zh-2}`} fill={rRight} />
        </>
      )}
      
      {type === 'slope' && (
        <>
          {/* Gable Wall (破風) - 右面 */}
          <polygon points={`0,-${zh} ${dx},-${dy+zh} ${dx*0.5},-${dy*0.5+zh+roofH}`} fill={wRight} />
          
          {/* Left Roof Plane (手前の斜面) - 丸みと厚みを出すためにstrokeを太くする */}
          <polygon 
            points={`0,-${zh} -${dx},-${dy+zh} -${dx*0.5},-${dy*1.5+zh+roofH} ${dx*0.5},-${dy*0.5+zh+roofH}`} 
            fill={rLeft} 
            stroke={rLeft} 
            strokeWidth="5" 
            strokeLinejoin="round" 
          />
          
          {/* Roof Edge Trim (妻側の下辺の厚みとハイライト) */}
          <line x1="0" y1={`-${zh}`} x2={`${dx*0.5}`} y2={`-${dy*0.5+zh+roofH}`} stroke={rTop} strokeWidth="4" strokeLinecap="round" />
          <line x1={`${dx}`} y1={`-${dy+zh}`} x2={`${dx*0.5}`} y2={`-${dy*0.5+zh+roofH}`} stroke={darken(rTop, 15)} strokeWidth="4" strokeLinecap="round" />
          
          {/* Roof Ridge Trim (大棟のハイライト) */}
          <line x1={`${dx*0.5}`} y1={`-${dy*0.5+zh+roofH}`} x2={`-${dx*0.5}`} y2={`-${dy*1.5+zh+roofH}`} stroke={rTop} strokeWidth="5" strokeLinecap="round" />
        </>
      )}

      {/* Castle/Tower specific blocks */}
      {type === 'tower' && (
        <>
          {/* Crenellations */}
          <polygon points={`0,-${zh} -${dx},-${dy+zh} 0,-${dy*2+zh} ${dx},-${dy+zh}`} fill={wTop} />
          <path d={`M ${dx*0.1},-${dy*0.1+zh} L ${dx*0.3},-${dy*0.3+zh} v-${zh*0.2} L ${dx*0.1},-${dy*0.1+zh+zh*0.2} Z`} fill={wRight}/>
          <path d={`M -${dx*0.1},-${dy*0.1+zh} L -${dx*0.3},-${dy*0.3+zh} v-${zh*0.2} L -${dx*0.1},-${dy*0.1+zh+zh*0.2} Z`} fill={wLeft}/>
        </>
      )}

      {/* High-quality Base Trim */}
      <polyline points={`-${dx},-${dy} 0,0 ${dx},-${dy}`} fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
      {/* Edge Highlights */}
      <line x1="0" y1="0" x2="0" y2={`-${zh}`} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      <line x1={`-${dx}`} y1={`-${dy}`} x2="0" y2={`-${dy*2}`} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

      {/* Custom Overlays */}
      {children}
    </g>
  );
};

// --- Rich Nature Objects ---
const N = ({ cx=50, cy=75, type='round', cLeaf='#15803d', cTrunk='#78350f', scale=1 }) => {
  const w = 30 * scale;
  const h = 50 * scale;
  const lRight = lighten(cLeaf, 20);
  const lLeft = darken(cLeaf, 20);
  const tRight = lighten(cTrunk, 10);
  const tLeft = darken(cTrunk, 30);

  return (
    <g transform={`translate(${cx}, ${cy})`} filter="url(#soft-shadow)">
      <SharedDefs />
      {/* Ground Shadow */}
      <ellipse cx="0" cy="0" rx={w*0.8} ry={w*0.4} fill="#020617" opacity="0.4" />
      
      {/* Trunk */}
      <path d={`M -${w*0.1},0 C -${w*0.1},-${h*0.1} -${w*0.05},-${h*0.4} -${w*0.05},-${h*0.6} L ${w*0.05},-${h*0.6} C ${w*0.05},-${h*0.4} ${w*0.1},-${h*0.1} ${w*0.1},0 Z`} fill={cTrunk} />
      {/* Trunk shadow & highlight */}
      <path d={`M -${w*0.1},0 C -${w*0.1},-${h*0.1} -${w*0.05},-${h*0.4} -${w*0.05},-${h*0.6} L 0,-${h*0.6} L 0,0 Z`} fill={tLeft} opacity="0.8" />
      
      {/* Crowns */}
      {type === 'round' && (
        <g transform={`translate(0, -${h*0.6})`}>
          {/* Back clusters */}
          <circle cx={-w*0.4} cy={w*0.2} r={w*0.5} fill={darken(cLeaf, 30)} />
          <circle cx={w*0.4} cy={w*0.2} r={w*0.5} fill={darken(cLeaf, 20)} />
          {/* Main sphere */}
          <circle cx="0" cy="0" r={w*0.7} fill={cLeaf} />
          {/* Highlight/Shadow overlays for 3D sphere feel */}
          <path d={`M -${w*0.7},0 A ${w*0.7},${w*0.7} 0 0,0 ${w*0.7},0 A ${w*0.7},${w*0.5} 0 0,1 -${w*0.7},0 Z`} fill={lLeft} opacity="0.6" />
          <circle cx={10*scale} cy={-10*scale} r={w*0.4} fill={lRight} opacity="0.6" filter="blur(2px)" />
        </g>
      )}
      
      {type === 'pine' && (
        <g transform={`translate(0, -${h*0.2})`}>
          {/* Bottom tier */}
          <polygon points={`0,-${h*0.4} -${w*0.8},0 0,${h*0.1} ${w*0.8},0`} fill={cLeaf} />
          <polygon points={`0,-${h*0.4} -${w*0.8},0 0,${h*0.1}`} fill={lLeft} opacity="0.6"/>
          {/* Mid tier */}
          <polygon points={`0,-${h*0.6} -${w*0.6},-${h*0.2} 0,-${h*0.1} ${w*0.6},-${h*0.2}`} fill={lRight} />
          <polygon points={`0,-${h*0.6} -${w*0.6},-${h*0.2} 0,-${h*0.1}`} fill={lLeft} opacity="0.6"/>
          {/* Top tier */}
          <polygon points={`0,-${h*0.8} -${w*0.4},-${h*0.4} 0,-${h*0.3} ${w*0.4},-${h*0.4}`} fill={lighten(cLeaf, 30)} />
          <polygon points={`0,-${h*0.8} -${w*0.4},-${h*0.4} 0,-${h*0.3}`} fill={lLeft} opacity="0.6"/>
        </g>
      )}
    </g>
  );
};

// --- Rich Flat Objects (Roads, Water, Garden) ---
const Fl = ({ cx=50, cy=75, color='#e2e8f0', thickness=2, scale=1, type='road' }) => {
  const dx = 25 * scale;
  const dy = 12.5 * scale;
  const fTop = color;
  const fLeft = darken(color, 25);
  const fRight = darken(color, 15);

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <SharedDefs />
      {/* Depth Slab */}
      <polygon points={`0,0 ${dx},-${dy} ${dx},-${dy}+${thickness} 0,${thickness}`} fill={fRight} />
      <polygon points={`0,0 -${dx},-${dy} -${dx},-${dy}+${thickness} 0,${thickness}`} fill={fLeft} />
      
      {/* Top Surface */}
      <polygon points={`0,0 ${dx},-${dy} 0,-${dy*2} -${dx},-${dy}`} fill={type==='water' ? 'url(#grad-water)' : fTop} />
      
      {/* Surface Details */}
      {type === 'road' && (
        <>
          <polygon points={`0,-${dy*1.8} ${dx*0.8},-${dy} 0,-${dy*0.2} -${dx*0.8},-${dy}`} fill="#f8fafc" opacity="0.3" />
          <line x1="0" y1={-dy*1.5} x2="0" y2={-dy*0.5} stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4,2" />
        </>
      )}
      {type === 'water' && (
        <>
          <path d={`M -${dx*0.5},-${dy} Q 0,-${dy*1.4} ${dx*0.5},-${dy}`} fill="none" stroke="#bae6fd" strokeWidth="1" opacity="0.8" />
          <path d={`M -${dx*0.3},-${dy*0.6} Q 0,-${dy*0.9} ${dx*0.3},-${dy*0.6}`} fill="none" stroke="#e0f2fe" strokeWidth="1" opacity="0.6" />
        </>
      )}
      {type === 'garden' && (
        <>
          <circle cx={-dx*0.3} cy={-dy} r={3} fill="#a3e635" filter="url(#soft-shadow)" />
          <circle cx={dx*0.4} cy={-dy*1.2} r={4} fill="#84cc16" filter="url(#soft-shadow)" />
          <circle cx={0} cy={-dy*0.5} r={3.5} fill="#4ade80" filter="url(#soft-shadow)" />
          <path d={`M -${dx*0.2},-${dy*1.5} C 0,-${dy*1.2} ${dx*0.2},-${dy*1.5}`} fill="none" stroke="#65a30d" strokeWidth="2" />
        </>
      )}
    </g>
  );
};


// ==========================================
// EXPORTS: Rich Terrain (Diamond style)
// ==========================================
export const SvgBedrock    = () => <D cTop="#1e293b" thickness={8} />;
export const SvgRoughland  = () => <D cTop="#92400e" cLeft="#78350f" cRight="#78350f" thickness={4} />;
export const SvgCleared    = () => <D cTop="#d4a96a" cLeft="#b45309" cRight="#92400e" thickness={2} />;
export const SvgGrassland  = () => <D cTop="#86efac" cLeft="#166534" cRight="#15803d" thickness={4}><text transform="scale(1,0.5) translate(40,110)" fontSize="18" fill="#4ade80">❦</text></D>;
export const SvgForestFloor= () => <D cTop="#14532d" cLeft="#064e3b" cRight="#064e3b" thickness={5} />;
export const SvgSand       = () => <D cTop="#fde68a" cLeft="#eab308" cRight="#d97706" thickness={2} />;
export const SvgShallowWater=() => <D cTop="url(#grad-water)" cLeft="#0284c7" cRight="#0369a1" thickness={2} />;
export const SvgHighland   = () => <D cTop="#a8a29e" cLeft="#57534e" cRight="#78716c" thickness={12} />;

// ==========================================
// EXPORTS: Rich Nature
// ==========================================
export const SvgWeed   = () => <svg viewBox="0 0 100 100"><SharedDefs/><path d="M45,70 Q30,50 25,30 M50,75 Q50,45 55,25 M60,70 Q75,55 80,40" fill="none" stroke="#65a30d" strokeWidth="3" strokeLinecap="round" filter="url(#soft-shadow)"/></svg>;
export const SvgGrass  = () => <svg viewBox="0 0 100 100"><SharedDefs/><circle cx="35" cy="65" r="8" fill="#4ade80" filter="url(#soft-shadow)"/><circle cx="65" cy="55" r="12" fill="#22c55e" filter="url(#soft-shadow)"/><circle cx="45" cy="45" r="10" fill="#16a34a" filter="url(#soft-shadow)"/></svg>;
export const SvgFlower = () => <svg viewBox="0 0 100 100"><SharedDefs/><g filter="url(#soft-shadow)"><circle cx="50" cy="50" r="12" fill="#fde047"/><circle cx="50" cy="30" r="15" fill="#ec4899"/><circle cx="50" cy="70" r="15" fill="#ec4899"/><circle cx="30" cy="50" r="15" fill="#ec4899"/><circle cx="70" cy="50" r="15" fill="#ec4899"/></g></svg>;
export const SvgTree   = () => <svg viewBox="0 0 100 100"><N scale={1.2}/></svg>;
export const SvgSakura = () => <svg viewBox="0 0 100 100"><N cLeaf="#fbcfe8" cTrunk="#713f12" scale={1.3}/></svg>;
export const SvgPine   = () => <svg viewBox="0 0 100 100"><N type="pine" cLeaf="#065f46" scale={1.2}/></svg>;
export const SvgRock   = () => <svg viewBox="0 0 100 100"><g transform="translate(50,75)" filter="url(#strong-shadow)"><polygon points="0,0 -20,-15 -10,-35 15,-30 25,-10" fill="#94a3b8"/><polygon points="0,0 -20,-15 0,-25 25,-10" fill="#cbd5e1"/></g></svg>;
export const SvgBambooGrove = () => <svg viewBox="0 0 100 100"><SharedDefs/><g transform="translate(50,80)" filter="url(#soft-shadow)"><rect x="-20" y="-40" width="6" height="40" fill="#22c55e" rx="3"/><rect x="-5" y="-50" width="6" height="50" fill="#16a34a" rx="3"/><rect x="10" y="-45" width="6" height="45" fill="#4ade80" rx="3"/></g></svg>;

// ==========================================
// EXPORTS: Rich Structures
// ==========================================
export const SvgRoad     = () => <svg viewBox="0 0 64 34" className="w-full h-full drop-shadow-sm"><Fl type="road" color="#cbd5e1" thickness={3} scale={1.28} cx={32} cy={32} /></svg>;
export const SvgWater    = () => <svg viewBox="0 0 64 34" className="w-full h-full drop-shadow-sm"><Fl type="water" color="#7dd3fc" thickness={2} scale={1.28} cx={32} cy={32} /></svg>;
export const SvgGarden   = () => <svg viewBox="0 0 64 34" className="w-full h-full"><Fl type="garden" color="#d4a96a" thickness={4} scale={1.28} cx={32} cy={32} /></svg>;
export const SvgFence    = () => <svg viewBox="0 0 100 100"><g transform="translate(50,75)"><rect x="-25" y="-15" width="50" height="4" fill="#b45309"/><rect x="-20" y="-20" width="6" height="20" fill="#92400e"/><rect x="14" y="-20" width="6" height="20" fill="#92400e"/></g></svg>;

// Tier 1-3
export const SvgHouse1   = () => <svg viewBox="0 0 100 100"><B wall="#ffedd5" roof="#ea580c" type="slope" scale={1.2}>
  <g transform="translate(-10, -78)">
    <polygon points="-4,8 -4,-10 0,-8 0,11" fill="#c2410c" />
    <polygon points="0,11 0,-8 4,-10 4,6" fill="#f97316" />
    <polygon points="0,-8 -4,-10 0,-12 4,-10" fill="#fdba74" />
  </g>
  <circle cx="12" cy="-60" r="4.5" fill="url(#grad-glass)" stroke="#fcd34d" strokeWidth="1.5" />
</B></svg>;
export const SvgHouse2   = () => <svg viewBox="0 0 100 100"><B wall="#fef08a" roof="url(#grad-roof-blue)" type="slope" scale={1.4}>
  <g transform="translate(-12, -90)">
    <polygon points="-5,10 -5,-12 0,-10 0,14" fill="#1e3a8a" />
    <polygon points="0,14 0,-10 5,-12 5,8" fill="#3b82f6" />
    <polygon points="0,-10 -5,-12 0,-14 5,-12" fill="#93c5fd" />
  </g>
  <circle cx="14" cy="-68" r="5.5" fill="url(#grad-glass)" stroke="#fcd34d" strokeWidth="1.5" />
</B></svg>;
export const SvgHouse3   = () => <svg viewBox="0 0 100 100"><B wall="#fef9c3" roof="url(#grad-roof-slate)" type="flat" scale={1.6}/></svg>;
export const SvgShop     = () => <svg viewBox="0 0 100 100"><B wall="#fbbf24" roof="#c2410c" type="flat" scale={1.3}><rect x="-10" y="-15" width="20" height="10" fill="url(#grad-glass)"/></B></svg>;
export const SvgSchool   = () => <svg viewBox="0 0 100 100"><B wall="#f8fafc" roof="url(#grad-roof-slate)" type="flat" scale={1.8}><circle cx="0" cy="-35" r="5" fill="#fbbf24"/></B></svg>;

// Economy/Industry
export const SvgWarehouse = () => <svg viewBox="0 0 100 100"><B wall="#d4d4d8" roof="#71717a" type="slope" scale={1.4}/></svg>;
export const SvgGrandWarehouse = () => <svg viewBox="0 0 100 100"><B wall="#a1a1aa" roof="#52525b" type="flat" scale={1.7}/></svg>;
export const SvgMarket   = () => <svg viewBox="0 0 100 100"><B wall="#fde047" roof="#ea580c" type="flat" scale={1.5}><rect x="-25" y="-20" width="50" height="5" fill="#ef4444"/><rect x="-25" y="-15" width="50" height="5" fill="#f8fafc"/></B></svg>;
export const SvgPort     = () => <svg viewBox="0 0 100 100"><B wall="#bae6fd" roof="#0284c7" type="flat" scale={1.4}><path d="M-10,-40 v40 M10,-40 v40" stroke="#0ea5e9" strokeWidth="3"/></B></svg>;
export const SvgSmithy   = () => <svg viewBox="0 0 100 100"><B wall="#a8a29e" roof="#44403c" type="slope" scale={1.3}><rect x="0" y="-45" width="8" height="20" fill="#78716c"/><circle cx="0" cy="-20" r="10" fill="#f97316" filter="url(#glow-effect)"/></B></svg>;
export const SvgFactory  = () => <svg viewBox="0 0 100 100"><B wall="#94a3b8" roof="#334155" type="flat" scale={1.6}><rect x="-15" y="-60" width="8" height="30" fill="#64748b"/><rect x="5" y="-55" width="8" height="25" fill="#64748b"/></B></svg>;

export const SvgWall     = () => <svg viewBox="0 0 100 100"><B wall="#e2e8f0" roof="#94a3b8" type="tower" scale={1.2}/></svg>;
export const SvgBridge   = () => <svg viewBox="0 0 100 100"><g transform="translate(50,70)"><path d="M-30,0 Q0,-30 30,0 L30,10 Q0,-20 -30,10 Z" fill="#9ca3af"/><path d="M-30,-5 Q0,-35 30,-5 L30,0 Q0,-30 -30,0 Z" fill="#d1d5db"/></g></svg>;

// Special & Mega
export const SvgCastle   = () => <svg viewBox="0 0 100 100"><B wall="#f8fafc" roof="url(#grad-roof-blue)" type="tower" scale={2.5}><B cx="0" cy="-30" wall="#f1f5f9" roof="url(#grad-roof-blue)" type="slope" scale={1.5}/></B></svg>;
export const SvgGoldCastle=() => <svg viewBox="0 0 100 100"><B wall="url(#grad-gold)" roof="#ef4444" type="tower" scale={2.8}><B cx="0" cy="-40" wall="url(#grad-gold)" roof="#ef4444" type="slope" scale={1.8}/></B></svg>;
export const SvgTorii    = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><rect x="-25" y="-40" width="6" height="40" fill="#b91c1c"/><rect x="19" y="-40" width="6" height="40" fill="#b91c1c"/><rect x="-30" y="-35" width="60" height="6" fill="#ef4444"/><rect x="-35" y="-45" width="70" height="8" fill="#dc2626"/></g></svg>;
export const SvgTemple   = () => <svg viewBox="0 0 100 100"><B wall="#78716c" roof="#1c1917" type="slope" scale={2.0}><rect x="-10" y="-50" width="20" height="25" fill="#dc2626"/></B></svg>;
export const SvgDragon   = () => <svg viewBox="0 0 100 100"><g transform="translate(50,50)" filter="url(#strong-shadow)"><path d="M-30,20 Q0,-40 30,20 Q10,0 -10,10 Z" fill="#10b981"/><circle cx="20" cy="-10" r="10" fill="#14b8a6"/><circle cx="25" cy="-15" r="3" fill="#ef4444"/></g></svg>;

// Miscs & Others
export const SvgWell     = () => <svg viewBox="0 0 100 100"><B wall="#a8a29e" roof="#78350f" type="slope" scale={0.8}><ellipse cx="0" cy="-5" rx="10" ry="5" fill="#0ea5e9"/></B></svg>;
export const SvgTownhall = () => <svg viewBox="0 0 100 100"><B wall="#f8fafc" roof="url(#grad-roof-slate)" type="flat" scale={2.0}><B cx="0" cy="-30" wall="#f1f5f9" roof="url(#grad-roof-slate)" type="slope" scale={1.0}/></B></svg>;
export const SvgEmbassy  = () => <svg viewBox="0 0 100 100"><B wall="#fdf2f8" roof="#ec4899" type="flat" scale={2.0}/></svg>;

export const SvgGoldenTower = () => <svg viewBox="0 0 100 100"><B wall="url(#grad-gold)" roof="#f59e0b" type="tower" scale={1.5}><B cx="0" cy="-20" wall="url(#grad-gold)" roof="#f59e0b" type="tower" scale={1.0}/></B></svg>;
export const SvgGuardianShrine = () => <svg viewBox="0 0 100 100"><B wall="#e9d5ff" roof="#9333ea" type="slope" scale={1.5}><circle cx="0" cy="-20" r="8" fill="#fbbf24"/></B></svg>;
export const SvgMonument = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><polygon points="0,-60 -15,-10 0,0 15,-10" fill="#cbd5e1"/><polygon points="0,-60 -15,-10 0,-20" fill="#94a3b8"/></g></svg>;

export const SvgDepartment = () => <svg viewBox="0 0 100 100"><B wall="#e2e8f0" roof="#cbd5e1" type="flat" scale={2.2}><rect x="-20" y="-30" width="40" height="20" fill="url(#grad-glass)" opacity="0.8"/></B></svg>;
export const SvgGrandSmithy = () => <svg viewBox="0 0 100 100"><B wall="#57534e" roof="#292524" type="slope" scale={1.8}><circle cx="0" cy="-15" r="15" fill="#ef4444" filter="url(#glow-effect)"/></B></svg>;
export const SvgUniversity = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#b45309" type="flat" scale={2.0}><path d="M-15,-40 h30 M-10,-45 h20" stroke="#d97706" strokeWidth="4"/></B></svg>;

// Megas
export const SvgMegaGrandMarket = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#ea580c" type="flat" scale={2.5}/></svg>;
export const SvgMegaFortress = () => <svg viewBox="0 0 100 100"><B wall="#475569" roof="#1e293b" type="tower" scale={3.0}/></svg>;
export const SvgMegaAcademy = () => <svg viewBox="0 0 100 100"><B wall="#f0fdf4" roof="#15803d" type="flat" scale={3.0}><circle cx="0" cy="-40" r="15" fill="url(#grad-glass)"/></B></svg>;
export const SvgMegaImperialPalace = () => <svg viewBox="0 0 100 100"><B wall="#fef9c3" roof="url(#grad-gold)" type="slope" scale={4.0}><B cx="0" cy="-50" wall="#fef08a" roof="url(#grad-gold)" type="slope" scale={2.0}/></B></svg>;
export const SvgMegaWonder = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><polygon points="0,-70 -40,-10 0,10 40,-10" fill="#fef08a"/><polygon points="0,-70 -40,-10 0,-20" fill="url(#grad-gold)"/></g></svg>;

// Rares
export const SvgCherryPavilion = () => <svg viewBox="0 0 100 100"><B wall="#fdf2f8" roof="#db2777" type="slope" scale={1.8}/></svg>;
export const SvgCrystalTower = () => <svg viewBox="0 0 100 100"><B wall="url(#grad-glass)" roof="#bae6fd" type="tower" scale={2.0}/></svg>;
export const SvgPhilosophersLab = () => <svg viewBox="0 0 100 100"><B wall="#eef2ff" roof="#6366f1" type="flat" scale={1.8}><circle cx="0" cy="-30" r="12" fill="#818cf8" filter="url(#glow-effect)"/></B></svg>;
export const SvgDragonShrine = () => <svg viewBox="0 0 100 100"><B wall="#ecfdf5" roof="#059669" type="slope" scale={2.2}><circle cx="0" cy="-20" r="8" fill="#10b981" filter="url(#glow-effect)"/></B></svg>;
export const SvgPerfectMonument = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><circle cx="0" cy="-40" r="25" fill="url(#grad-gold)"/></g></svg>;
export const SvgHotSpring = () => <svg viewBox="0 0 100 100"><B wall="#e0f2fe" roof="#0284c7" type="flat" scale={1.2}><ellipse cx="15" cy="-5" rx="15" ry="8" fill="url(#grad-water)"/></B></svg>;
export const SvgObservatory = () => <svg viewBox="0 0 100 100"><B wall="#f8fafc" roof="#1e293b" type="flat" scale={1.5}><circle cx="0" cy="-30" r="20" fill="#e2e8f0"/></B></svg>;

export const SvgShoppingStreet = () => <svg viewBox="0 0 100 100"><B wall="#ffedd5" roof="#f97316" type="slope" scale={1.6}/></svg>;
export const SvgZenGarden = () => <svg viewBox="0 0 64 34" className="w-full h-full drop-shadow-sm"><Fl type="garden" color="#e5e5e5" thickness={3} scale={1.28} cx={32} cy={32} /></svg>;
export const SvgNationalLibrary = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#92400e" type="slope" scale={2.4}/></svg>;

export const SvgMegaHarborTown = () => <svg viewBox="0 0 100 100"><B wall="#e0f2fe" roof="#0369a1" type="flat" scale={3.0}/></svg>;
export const SvgMegaShrineComplex = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#b91c1c" type="slope" scale={3.5}/></svg>;

export const SvgStoneLantern = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><rect x="-5" y="-30" width="10" height="30" fill="#94a3b8"/><polygon points="-10,-30 10,-30 0,-40" fill="#cbd5e1"/><circle cx="0" cy="-25" r="4" fill="#fbbf24" filter="url(#glow-effect)"/></g></svg>;
export const SvgFountain = () => <svg viewBox="0 0 100 100"><g transform="translate(50,70)" filter="url(#soft-shadow)"><ellipse cx="0" cy="0" rx="30" ry="15" fill="#e2e8f0"/><ellipse cx="0" cy="-2" rx="28" ry="13" fill="url(#grad-water)"/><rect x="-4" y="-20" width="8" height="20" fill="#f8fafc"/><path d="M-15,-10 Q0,-30 15,-10" fill="none" stroke="#7dd3fc" strokeWidth="3" opacity="0.8"/></g></svg>;
export const SvgStatue = () => <svg viewBox="0 0 100 100"><SvgMonument/></svg>;
export const SvgWindmill = () => <svg viewBox="0 0 100 100"><B wall="#fde047" roof="#ca8a04" type="tower" scale={1.5}><path d="M0,-30 L-20,-50 M0,-30 L20,-50 M0,-30 L-20,-10 M0,-30 L20,-10" stroke="#f8fafc" strokeWidth="4"/></B></svg>;
export const SvgBellTower = () => <svg viewBox="0 0 100 100"><B wall="#ffedd5" roof="#78350f" type="slope" scale={1.4}><circle cx="0" cy="-20" r="5" fill="#fbbf24"/></B></svg>;
export const SvgPond = () => <svg viewBox="0 0 100 100"><SvgWater/></svg>;
export const SvgCherryRoad = () => <svg viewBox="0 0 64 34" className="w-full h-full drop-shadow-sm"><Fl type="road" color="#fce7f3" thickness={3} scale={1.28} cx={32} cy={32} /></svg>;
export const SvgClockTower = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#92400e" type="tower" scale={1.8}><circle cx="0" cy="-35" r="10" fill="#f8fafc"/><line x1="0" y1="-35" x2="0" y2="-40" stroke="#1e293b" strokeWidth="2"/></B></svg>;
export const SvgGoldStatue = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><polygon points="0,-60 -15,-10 0,0 15,-10" fill="url(#grad-gold)"/><polygon points="0,-60 -15,-10 0,-20" fill="#fcd34d"/></g></svg>;
export const SvgFestivalStage = () => <svg viewBox="0 0 100 100"><B wall="#fef9c3" roof="#ef4444" type="flat" scale={1.2}><circle cx="-10" cy="-20" r="3" fill="#fbbf24" filter="url(#glow-effect)"/></B></svg>;

export const SvgVillager = () => <svg viewBox="0 0 100 100"><g transform="translate(50,80)" filter="url(#strong-shadow)"><rect x="-10" y="-30" width="20" height="20" rx="4" fill="#3b82f6"/><circle cx="0" cy="-40" r="12" fill="#fde047"/><circle cx="-4" cy="-42" r="2" fill="#1e293b"/><circle cx="4" cy="-42" r="2" fill="#1e293b"/><path d="M-5,-35 Q0,-30 5,-35" fill="none" stroke="#1e293b" strokeWidth="2"/></g></svg>;
export const SvgWatermill = () => <svg viewBox="0 0 100 100"><B wall="#d4a96a" roof="#78350f" type="slope" scale={1.4}><circle cx="-15" cy="-10" r="10" fill="#64748b"/></B></svg>;
export const SvgMine = () => <svg viewBox="0 0 100 100"><B wall="#78716c" roof="#44403c" type="slope" scale={1.5}><polygon points="-10,0 -5,-20 5,-20 10,0" fill="#1c1917"/></B></svg>;
export const SvgLibrary = () => <svg viewBox="0 0 100 100"><B wall="#fef3c7" roof="#b45309" type="flat" scale={1.8}/></svg>;
export const SvgGhostBoss = () => <svg viewBox="0 0 100 100"><g transform="translate(50,70)" filter="url(#glow-effect)"><path d="M-30,20 Q0,-40 30,20 Q15,10 0,20 Q-15,10 -30,20 Z" fill="#9333ea" opacity="0.8"/><circle cx="-10" cy="0" r="5" fill="#f8fafc"/><circle cx="10" cy="0" r="5" fill="#f8fafc"/></g></svg>;
