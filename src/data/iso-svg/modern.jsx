import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, FaceSE, AwningSW, IsoShadow } from './shared.jsx';

// 都市（オフィスビル・タワマン・テレビ塔など）

// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgStadium = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 78) scale(2.1)">
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
