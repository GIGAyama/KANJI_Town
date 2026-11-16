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
