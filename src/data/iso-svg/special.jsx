import React from 'react';
import { darken, isoPt, iso3, IsoCube, FaceSW, FaceSE, WinSW, WinSE, AwningSW, IsoShadow, MarketStall } from './shared.jsx';

// 名所・大型（鳥居・お寺・お城・メガ建築・レア建物など）

// ==========================================
// 6. Special & Mega Assets
// ==========================================
export const SvgZenGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
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

export const SvgWell = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 50) scale(1.6)">
      {/* 影 */}

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

export const SvgFountain = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 78) scale(2.4)">
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

// 池の見本は structures.jsx（ほかの平らなアイテムと同じく、地面の絵から作る）

export const SvgStoneLantern = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><g transform="translate(50, 100) scale(2.4)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><polygon points="0,-2 -8,-6 0,-10 8,-6" fill="#cbd5e1" /><polygon points="0,-6 -3,-7.5 -3,-20 0,-18.5" fill="#475569" /><polygon points="0,-6 3,-7.5 3,-20 0,-18.5" fill="#64748b" /><polygon points="0,-20 -6,-23 0,-26 6,-23" fill="#e2e8f0" /><polygon points="0,-21 -3,-22.5 -3,-26.5 0,-25" fill="#fef08a" filter="url(#glow-effect)" /><polygon points="0,-21 3,-22.5 3,-26.5 0,-25" fill="#fcd34d" /><polygon points="0,-26 -10,-31 0,-36 10,-31" fill="#475569" /><polygon points="0,-26 -10,-31 -10,-29 0,-24" fill="#64748b" /><polygon points="0,-26 10,-31 10,-29 0,-24" fill="#94a3b8" /><polygon points="0,-37 -2,-38 0,-40 2,-38" fill="#e2e8f0" /><circle cx="-4" cy="-5" r="1.5" fill="#15803d" opacity="0.8" /></g></svg>);

export const SvgStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><g transform="translate(50, 100) scale(2.5)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round"><polygon points="0,-2 -12,-8 0,-14 12,-8" fill="#cbd5e1" /><polygon points="0,-2 -12,-8 -12,-10 0,-4" fill="#94a3b8" /><polygon points="0,-2 12,-8 12,-10 0,-4" fill="#e2e8f0" /><polygon points="0,-10 -3,-11.5 -3,-30 0,-28.5" fill="#94a3b8" /><polygon points="0,-10 3,-11.5 3,-30 0,-28.5" fill="#cbd5e1" /><polygon points="0,-28.5 -8,-32.5 0,-36.5 8,-32.5" fill="#e2e8f0" /><polygon points="0,-32 -2,-33 -2,-42 0,-41" fill="#94a3b8" /><polygon points="0,-32 2,-33 2,-42 0,-41" fill="#cbd5e1" /><circle cx="0" cy="-44" r="4" fill="#e2e8f0" /><circle cx="-1" cy="-45" r="0.8" fill="#475569" /><circle cx="1" cy="-45" r="0.8" fill="#475569" /></g></svg>);

export const SvgWindmill = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 96) scale(2.3)">
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

export const SvgGoldStatue = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 88) scale(2.4)">
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

export const SvgVillager = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><g transform="translate(50, 100) scale(2.5)" filter="url(#strong-shadow)"><rect x="-10" y="-30" width="20" height="20" rx="4" fill="#3b82f6"/><circle cx="0" cy="-40" r="12" fill="#fde047"/><circle cx="-4" cy="-42" r="2" fill="#1e293b"/><circle cx="4" cy="-42" r="2" fill="#1e293b"/><path d="M-5,-35 Q0,-30 5,-35" fill="none" stroke="#1e293b" strokeWidth="2"/></g></svg>);

export const SvgGhostBoss = () => (
  <svg viewBox="0 -100 100 200" style={{ overflow: "visible" }}><g transform="translate(50, 100) scale(2.5)" filter="url(#glow-effect)"><path d="M-30,20 Q0,-40 30,20 Q15,10 0,20 Q-15,10 -30,20 Z" fill="#9333ea" opacity="0.8"/><circle cx="-10" cy="0" r="5" fill="#f8fafc"/><circle cx="10" cy="0" r="5" fill="#f8fafc"/></g></svg>);
