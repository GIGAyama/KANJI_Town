import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, FaceSE, AwningSW, IsoShadow, ShopBase } from './shared.jsx';

// 店（カフェ・パン屋・コンビニなど）

// ==========================================
// 7. 商業施設 (Commercial)
// 共通ビルダー ShopBase + 店舗ごとのグリフで統一クオリティ
// ==========================================


export const SvgCafe = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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
