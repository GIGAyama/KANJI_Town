import React from 'react';
import { isoPt, iso3, IsoCube, IsoShadow } from './shared.jsx';

// 遊び（公園・遊具・プール・観覧車など）

// ==========================================
// 10. 公園・レジャー (Parks & Leisure)
// ==========================================
export const SvgPlayground = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
