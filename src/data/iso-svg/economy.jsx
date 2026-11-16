import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, WinSE, IsoShadow, MarketStall } from './shared.jsx';

// 生産（倉庫・市場・港・工場など）

// ==========================================
// 5. Economy & Industry Assets
// ==========================================
export const SvgGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
