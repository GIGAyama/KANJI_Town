import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, FaceSE, AwningSW, IsoShadow } from './shared.jsx';

// 都市（オフィスビル・タワマン・テレビ塔など）

// ==========================================
// 9. 現代建築 (Modern Architecture)
// ==========================================
export const SvgOfficeBuilding = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
