import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, FaceSE, WinSW, WinSE, IsoShadow, ShopBase } from './shared.jsx';

// 公共（病院・消防署・交番・駅など）

// ==========================================
// 8. 公共施設 (Public Services)
// ==========================================
export const SvgHospital = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
