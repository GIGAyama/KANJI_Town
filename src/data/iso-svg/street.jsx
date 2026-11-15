import React from 'react';
import { SharedDefs } from './shared.jsx';

// 街路（ベンチ・ポスト・街灯など）

// ==========================================
// 12. ストリートファニチャー (Street Furniture)
// 小物は正面寄りの2.5Dで大きく描き、太い輪郭線で統一
// ==========================================
export const SvgBench = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 82) scale(2.6)">
      <ellipse cx="0" cy="8" rx="17" ry="5" fill="#020617" opacity="0.18" />
      {/* 脚（鋳鉄風） */}
      <path d="M -11,7 L -11,-4 M -11,1 Q -13.5,1 -13.5,4 L -13.5,7" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <path d="M 11,7 L 11,-4 M 11,1 Q 13.5,1 13.5,4 L 13.5,7" fill="none" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      {/* 座面（板3枚） */}
      <rect x="-15" y="-4" width="30" height="2.4" rx="1.2" fill="#d97706" stroke="#1e293b" strokeWidth="1.1" />
      <rect x="-15" y="-1" width="30" height="2.4" rx="1.2" fill="#b45309" stroke="#1e293b" strokeWidth="1.1" />
      {/* 背もたれ（板2枚） */}
      <rect x="-15" y="-12.5" width="30" height="2.4" rx="1.2" fill="#f59e0b" stroke="#1e293b" strokeWidth="1.1" />
      <rect x="-15" y="-9" width="30" height="2.4" rx="1.2" fill="#d97706" stroke="#1e293b" strokeWidth="1.1" />
      {/* 背もたれ支柱 */}
      <line x1="-11" y1="-4" x2="-11" y2="-13" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      <line x1="11" y1="-4" x2="11" y2="-13" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgMailbox = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 85) scale(2.6)">
      <ellipse cx="0" cy="7" rx="10" ry="3.5" fill="#020617" opacity="0.2" />
      {/* 台座 */}
      <path d="M -6,7 L -5,3.5 L 5,3.5 L 6,7 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 円筒の本体 */}
      <rect x="-5.5" y="-16" width="11" height="19.5" rx="1" fill="#ef4444" stroke="#1e293b" strokeWidth="1.4" />
      <path d="M -5.5,-16 A 5.5,4.5 0 0 1 5.5,-16" fill="#f87171" stroke="#1e293b" strokeWidth="1.4" />
      {/* 帽子（キャップ） */}
      <path d="M -7,-15.5 L 7,-15.5 L 6,-18 L -6,-18 Z" fill="#dc2626" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 投函口 */}
      <rect x="-4" y="-13.5" width="8" height="2" rx="0.8" fill="#1e293b" />
      {/* 〒マークと取出口 */}
      <path d="M -2.6,-8.5 L 2.6,-8.5 M -2.6,-6.7 L 2.6,-6.7 M 0,-6.7 L 0,-3.4" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
      <rect x="-3.6" y="-1.6" width="7.2" height="3.6" rx="0.6" fill="#b91c1c" stroke="#1e293b" strokeWidth="0.9" />
    </g>
  </svg>
);

export const SvgPhoneBooth = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 88) scale(2.5)">
      <ellipse cx="0" cy="6" rx="12" ry="4" fill="#020617" opacity="0.2" />
      {/* ボックス本体（2.5D） */}
      <polygon points="-8,5 -8,-24 2,-28 2,1" fill="#166534" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="2,1 2,-28 9,-25 9,4" fill="#14532d" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      {/* ガラスパネル（正面ドア） */}
      <polygon points="-6.4,2.6 -6.4,-21 0.4,-24 0.4,-0.4" fill="url(#grad-glass)" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <line x1="-3" y1="1.2" x2="-3" y2="-22.4" stroke="#14532d" strokeWidth="1" />
      {/* ガラスパネル（側面） */}
      <polygon points="3.6,-1 3.6,-24.5 7.4,-22.8 7.4,0.8" fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" opacity="0.9" />
      {/* 屋根 */}
      <polygon points="-10,-23 2,-27.8 11,-24 -1,-19.4" fill="#22c55e" stroke="#1e293b" strokeWidth="1.3" strokeLinejoin="round" />
      <polygon points="-10,-23 -1,-19.4 -1,-17.6 -10,-21.2" fill="#15803d" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points="-1,-19.4 11,-24 11,-22.2 -1,-17.6" fill="#166534" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 中の電話機 */}
      <rect x="-5.6" y="-14" width="3.6" height="5" rx="0.6" fill="#334155" stroke="#1e293b" strokeWidth="0.7" />
      <path d="M -5.2,-14.4 Q -3.8,-16 -2.4,-14.4" fill="none" stroke="#1e293b" strokeWidth="1.1" strokeLinecap="round" />
      {/* 電話サイン */}
      <rect x="-6.2" y="-27.6" width="5" height="2.6" rx="0.5" fill="#fef08a" stroke="#1e293b" strokeWidth="0.7" transform="skewY(-21)" />
    </g>
  </svg>
);

export const SvgStreetLight = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 92) scale(2.5)">
      <ellipse cx="0" cy="3.5" rx="8" ry="3" fill="#020617" opacity="0.18" />
      {/* 台座 */}
      <path d="M -3.5,3 L -2.2,-0.5 L 2.2,-0.5 L 3.5,3 Z" fill="#475569" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* ポール（上部でカーブ） */}
      <path d="M 0,-0.5 L 0,-30 Q 0,-36 6,-36 L 10,-36" fill="none" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 0,-0.5 L 0,-30 Q 0,-35 5.5,-35.2" fill="none" stroke="#64748b" strokeWidth="1" strokeLinecap="round" />
      {/* ランプヘッド */}
      <path d="M 7,-36.8 L 13,-36.8 L 14.4,-33.4 L 5.6,-33.4 Z" fill="#1e293b" stroke="#0f172a" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx="10" cy="-33" rx="3.6" ry="1.6" fill="#fef08a" stroke="#1e293b" strokeWidth="0.9" filter="url(#glow-effect)" />
      {/* 光のこぼれ */}
      <path d="M 6.5,-32 L 3.5,-24 M 13.5,-32 L 16.5,-24" stroke="#fde047" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      {/* 小さな装飾バナー */}
      <rect x="-4.6" y="-26" width="4.6" height="9" rx="0.8" fill="#22c55e" stroke="#1e293b" strokeWidth="0.9" />
      <circle cx="-2.3" cy="-21.5" r="1.5" fill="#fef9c3" />
    </g>
  </svg>
);

export const SvgBusStop = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 88) scale(2.5)">
      <ellipse cx="0" cy="5" rx="12" ry="4" fill="#020617" opacity="0.18" />
      {/* 台座とポール */}
      <ellipse cx="-4" cy="3.4" rx="4.4" ry="1.8" fill="#64748b" stroke="#1e293b" strokeWidth="1" />
      <line x1="-4" y1="3" x2="-4" y2="-27" stroke="#334155" strokeWidth="2.4" strokeLinecap="round" />
      {/* 標識（丸板） */}
      <circle cx="-4" cy="-30" r="7.5" fill="#3b82f6" stroke="#1e293b" strokeWidth="1.4" />
      <circle cx="-4" cy="-30" r="5.8" fill="none" stroke="#f8fafc" strokeWidth="1" />
      {/* バスのピクトグラム */}
      <g transform="translate(-4, -30)">
        <rect x="-3.6" y="-2.6" width="7.2" height="4.4" rx="0.8" fill="#f8fafc" />
        <rect x="-2.8" y="-1.8" width="2.2" height="1.6" fill="#3b82f6" />
        <rect x="0.6" y="-1.8" width="2.2" height="1.6" fill="#3b82f6" />
        <circle cx="-2" cy="2.2" r="0.9" fill="#f8fafc" />
        <circle cx="2" cy="2.2" r="0.9" fill="#f8fafc" />
      </g>
      {/* 時刻表ボックス */}
      <rect x="-2.8" y="-18" width="7" height="9" rx="0.8" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.1" />
      <line x1="-1.2" y1="-15.6" x2="2.6" y2="-15.6" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="-1.2" y1="-13.6" x2="2.6" y2="-13.6" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="-1.2" y1="-11.6" x2="1.4" y2="-11.6" stroke="#94a3b8" strokeWidth="0.8" />
      {/* 小さなベンチ */}
      <rect x="2" y="-3.5" width="10" height="2" rx="1" fill="#d97706" stroke="#1e293b" strokeWidth="0.9" />
      <line x1="3.6" y1="-1.5" x2="3.6" y2="2.5" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="10.4" y1="-1.5" x2="10.4" y2="2.5" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgVendingMachine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 86) scale(2.5)">
      <ellipse cx="0" cy="6" rx="11" ry="4" fill="#020617" opacity="0.2" />
      {/* 本体（2.5D） */}
      <polygon points="-8,5 -8,-22 3,-26 3,1" fill="#dc2626" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="3,1 3,-26 9,-23.5 9,3.5" fill="#991b1b" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      <polygon points="-8,-22 3,-26 9,-23.5 -2,-19.5" fill="#f87171" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      {/* 光る商品ディスプレイ */}
      <polygon points="-6.6,-11.5 1.6,-14.5 1.6,-23 -6.6,-20 " fill="#fef9c3" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 缶（2段） */}
      {[0, 1].map(row => (
        [0, 1, 2].map(col => (
          <rect key={`${row}-${col}`} x={-6 + col * 2.7} y={-19.2 + row * 3.6 - col * 1.0} width="2" height="2.8" rx="0.4"
            fill={['#3b82f6', '#22c55e', '#f59e0b'][col]} stroke="#1e293b" strokeWidth="0.5" />
        ))
      ))}
      {/* サンプル表示の仕切り */}
      <line x1="-6.6" y1="-16" x2="1.6" y2="-19" stroke="#94a3b8" strokeWidth="0.6" />
      {/* コイン投入口・ボタン */}
      <rect x="-6.6" y="-9.5" width="3" height="1.4" rx="0.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" transform="skewY(-20)" />
      <circle cx="0.4" cy="-9.6" r="0.8" fill="#fef08a" stroke="#1e293b" strokeWidth="0.5" />
      {/* 取出口 */}
      <polygon points="-6.4,0.8 1,-1.9 1,-4.9 -6.4,-2.2" fill="#450a0a" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points="-5.6,-0.1 0.2,-2.2 0.2,-3.9 -5.6,-1.8" fill="#7f1d1d" />
    </g>
  </svg>
);

export const SvgTrashCan = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 84) scale(2.5)">
      <ellipse cx="0" cy="5" rx="9.5" ry="3.5" fill="#020617" opacity="0.2" />
      {/* 本体（円筒） */}
      <path d="M -7,-13 L -6,3 A 6,2.6 0 0 0 6,3 L 7,-13 Z" fill="#64748b" stroke="#1e293b" strokeWidth="1.4" strokeLinejoin="round" />
      {/* 縦のリブ */}
      <line x1="-3.5" y1="-12.4" x2="-3" y2="4.6" stroke="#475569" strokeWidth="1" />
      <line x1="0" y1="-12.2" x2="0" y2="5.4" stroke="#475569" strokeWidth="1" />
      <line x1="3.5" y1="-12.4" x2="3" y2="4.6" stroke="#475569" strokeWidth="1" />
      {/* 帯 */}
      <path d="M -6.6,-7 Q 0,-4.6 6.6,-7" fill="none" stroke="#334155" strokeWidth="1.4" />
      {/* フタ */}
      <ellipse cx="0" cy="-13" rx="7.6" ry="3.2" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.3" />
      <ellipse cx="0" cy="-14" rx="7.6" ry="3.2" fill="#cbd5e1" stroke="#1e293b" strokeWidth="1.3" />
      {/* 投入口（スイングドア） */}
      <path d="M -3,-17.6 Q 0,-19.8 3,-17.6 L 3,-13.4 Q 0,-15 -3,-13.4 Z" fill="#475569" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* リサイクルマーク */}
      <g transform="translate(0, -3)" stroke="#4ade80" strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M -1.8,1.4 L 0,-1.6 L 1.8,1.4 Z" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);
