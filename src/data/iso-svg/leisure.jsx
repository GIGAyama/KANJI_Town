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

export const SvgAmusementPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
