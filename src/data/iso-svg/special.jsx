import React from 'react';
import { darken, isoPt, iso3, IsoCube, FaceSW, FaceSE, WinSW, WinSE, AwningSW, IsoShadow, MarketStall } from './shared.jsx';

// 名所・大型（鳥居・お寺・お城・メガ建築・レア建物など）

// ==========================================
// 6. Special & Mega Assets
// ==========================================
export const SvgMegaGrandMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 石畳広場 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 大ホールの壁 */}
      <IsoCube x={10} y={8} w={72} d={56} h={16} top="#f1f5f9" left="#fef3c7" right="#fde68a" sw={1.1} />
      {/* 正面の大アーチ開口（市場の入口） */}
      <FaceSW x1={20} x2={44} y={64.2} z1={0} z2={11} fill="#78350f" sw={1} />
      <path d={`M ${iso3(20, 64.2, 11)} Q ${iso3(32, 64.2, 17)} ${iso3(44, 64.2, 11)}`} fill="#78350f" stroke="#1e293b" strokeWidth="0.9" />
      <FaceSW x1={50} x2={74} y={64.2} z1={0} z2={11} fill="#92400e" sw={1} />
      <path d={`M ${iso3(50, 64.2, 11)} Q ${iso3(62, 64.2, 17)} ${iso3(74, 64.2, 11)}`} fill="#92400e" stroke="#1e293b" strokeWidth="0.9" />
      {/* 大きなアーチ屋根（赤白の縞） */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const x1 = 6 + i * 13.34; const x2 = 6 + (i + 1) * 13.34;
        return (
          <path key={i} d={`M ${iso3(x1, 64, 18)} L ${iso3(x2, 64, 18)} C ${iso3(x2, 36, 34)} ${iso3(x2, 32, 34)} ${iso3(x2, 4, 18)} L ${iso3(x1, 4, 18)} C ${iso3(x1, 32, 34)} ${iso3(x1, 36, 34)} ${iso3(x1, 64, 18)} Z`}
            fill={i % 2 === 0 ? '#ef4444' : '#f8fafc'} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        );
      })}
      {/* アーチ屋根の手前断面 */}
      <path d={`M ${iso3(86, 4, 18)} C ${iso3(86, 32, 34)} ${iso3(86, 36, 34)} ${iso3(86, 64, 18)} L ${iso3(86, 64, 15.5)} C ${iso3(86, 36, 31.5)} ${iso3(86, 32, 31.5)} ${iso3(86, 4, 15.5)} Z`}
        fill="#b91c1c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 旗 */}
      <line x1={isoPt(46, 34, 30)[0]} y1={isoPt(46, 34, 30)[1]} x2={isoPt(46, 34, 42)[0]} y2={isoPt(46, 34, 42)[1]} stroke="#1e293b" strokeWidth="1" />
      <polygon points={`${isoPt(46, 34, 42)[0]},${isoPt(46, 34, 42)[1]} ${isoPt(46, 34, 42)[0] + 7},${isoPt(46, 34, 42)[1] + 1.7} ${isoPt(46, 34, 42)[0]},${isoPt(46, 34, 42)[1] + 3.4}`} fill="#facc15" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      {/* 前面の屋台と木箱 */}
      <MarketStall gx={24} gy={82} c1="#3b82f6" c2="#f8fafc" goods={[[-5, -4.5, '#facc15'], [-1, -3.6, '#ef4444'], [3, -4.6, '#a3e635']]} />
      <MarketStall gx={62} gy={86} c1="#22c55e" c2="#fef9c3" goods={[[-4, -4.5, '#f97316'], [0, -3.5, '#ef4444'], [4, -5, '#facc15']]} />
      <IsoCube x={86} y={70} w={10} d={10} h={6.5} top="#fcd34d" left="#fbbf24" right="#f59e0b" sw={0.8} />
      <IsoCube x={88} y={82} w={9} d={9} h={5.5} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={0.8} />
    </g>
  </svg>
);

export const SvgMegaFortress = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 岩盤の基礎 */}
      <IsoCube x={2} y={2} w={96} d={96} h={4} top="#78716c" left="#57534e" right="#44403c" sw={1} />
      {/* 城壁（外周） */}
      <IsoCube x={8} y={8} w={84} d={84} z={4} h={14} top="#94a3b8" left="#64748b" right="#475569" sw={1.1} />
      {/* 城壁の銃眼（手前2辺の凸凹） */}
      {[12, 26, 40, 54, 68, 82].map(x => (
        <IsoCube key={`m1-${x}`} x={x} y={88} w={7} d={4} z={18} h={4} top="#94a3b8" left="#64748b" right="#475569" sw={0.8} />
      ))}
      {[12, 26, 40, 54, 68, 82].map(y => (
        <IsoCube key={`m2-${y}`} x={88} y={y} w={4} d={7} z={18} h={4} top="#94a3b8" left="#64748b" right="#475569" sw={0.8} />
      ))}
      {/* 城門（落とし格子） */}
      <FaceSW x1={38} x2={62} y={92.2} z1={4} z2={15} fill="#1c1917" sw={1.1} />
      <path d={`M ${iso3(38, 92.2, 15)} Q ${iso3(50, 92.2, 21)} ${iso3(62, 92.2, 15)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="1" />
      {[42, 47, 52, 57].map(x => (
        <line key={x} x1={isoPt(x, 92.4, 4)[0]} y1={isoPt(x, 92.4, 4)[1]} x2={isoPt(x, 92.4, 16)[0]} y2={isoPt(x, 92.4, 16)[1]} stroke="#78716c" strokeWidth="1" />
      ))}
      {/* 四隅の円塔 */}
      {[[10, 10], [90, 10], [10, 90], [90, 90]].map(([tx, ty], i) => {
        const [px, py] = isoPt(tx, ty, 4);
        return (
          <g key={i} transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)})`}>
            <path d="M -7,0 L -7,-26 A 7,3 0 0 1 7,-26 L 7,0 A 7,3 0 0 1 -7,0 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 0,0 L 0,-26 L 7,-26 L 7,0 A 7,3 0 0 1 0,0 Z" fill="#64748b" stroke="none" />
            <path d="M -7,0 L -7,-26 A 7,3 0 0 1 7,-26 L 7,0 A 7,3 0 0 1 -7,0 Z" fill="none" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            {/* 狭間窓 */}
            <rect x="-1.2" y="-20" width="2.4" height="5" rx="1" fill="#1c1917" />
            {/* 円錐屋根 */}
            <path d="M -9,-26 A 9,3.6 0 0 1 9,-26 L 0,-42 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M 0,-42 L 9,-26 A 9,3.6 0 0 1 4.5,-23.5 Z" fill="#7f1d1d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
            {/* 旗 */}
            <line x1="0" y1="-42" x2="0" y2="-49" stroke="#1e293b" strokeWidth="0.9" />
            <polygon points="0,-49 6,-47.4 0,-45.8" fill="#ef4444" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
          </g>
        );
      })}
      {/* 中央の天守（キープ） */}
      <IsoCube x={32} y={32} w={36} d={36} z={4} h={30} top="#64748b" left="#475569" right="#334155" sw={1.1} />
      {[36, 46, 56].map(x => (
        <rect key={x} x={isoPt(x, 68.2, 22)[0] - 1} y={isoPt(x, 68.2, 22)[1] - 5} width="2" height="5" rx="1" fill="#1c1917" />
      ))}
      {/* キープの銃眼 */}
      {[34, 46, 58].map(x => (
        <IsoCube key={`k-${x}`} x={x} y={64} w={7} d={4} z={34} h={4} top="#64748b" left="#475569" right="#334155" sw={0.8} />
      ))}
      <IsoCube x={40} y={40} w={20} d={20} z={38} h={8} top="#475569" left="#334155" right="#1e293b" sw={1} />
      {/* 大旗 */}
      <line x1={isoPt(50, 50, 46)[0]} y1={isoPt(50, 50, 46)[1]} x2={isoPt(50, 50, 62)[0]} y2={isoPt(50, 50, 62)[1]} stroke="#1e293b" strokeWidth="1.2" />
      <polygon points={`${isoPt(50, 50, 62)[0]},${isoPt(50, 50, 62)[1]} ${isoPt(50, 50, 62)[0] + 9},${isoPt(50, 50, 62)[1] + 2.2} ${isoPt(50, 50, 62)[0]},${isoPt(50, 50, 62)[1] + 4.4}`} fill="#dc2626" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgMegaAcademy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* キャンパス緑地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#4ade80" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(44, 52, 0.1)} ${iso3(56, 52, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" />
      {/* 左右の学舎 */}
      <IsoCube x={4} y={22} w={24} d={36} h={18} top="#cbd5e1" left="#f8fafc" right="#e2e8f0" sw={1} />
      <IsoCube x={72} y={22} w={24} d={36} h={18} top="#cbd5e1" left="#f8fafc" right="#e2e8f0" sw={1} />
      {[[7, 13], [18, 24]].map(([a, b], i) => <WinSW key={`l-${i}`} x1={a} x2={b} y={58.2} z1={5} z2={13} />)}
      {[[75, 81], [86, 92]].map(([a, b], i) => <WinSW key={`r-${i}`} x1={a} x2={b} y={58.2} z1={5} z2={13} />)}
      <IsoCube x={2} y={20} w={28} d={40} z={18} h={2.5} top="#3b82f6" left="#60a5fa" right="#1d4ed8" sw={0.9} />
      <IsoCube x={70} y={20} w={28} d={40} z={18} h={2.5} top="#3b82f6" left="#60a5fa" right="#1d4ed8" sw={0.9} />
      {/* 中央講堂 */}
      <IsoCube x={30} y={14} w={40} d={44} h={26} top="#e2e8f0" left="#fef3c7" right="#fde68a" sw={1.1} />
      {/* 講堂の列柱ファサード */}
      {[34, 41, 59, 66].map(x => (
        <polygon key={x} points={`${iso3(x - 1.5, 58.3, 0)} ${iso3(x + 1.5, 58.3, 0)} ${iso3(x + 1.5, 58.3, 18)} ${iso3(x - 1.5, 58.3, 18)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      <FaceSW x1={45} x2={55} y={58.4} z1={0} z2={13} fill="#7c2d12" sw={1} />
      <path d={`M ${iso3(45, 58.5, 13)} Q ${iso3(50, 58.5, 17.5)} ${iso3(55, 58.5, 13)}`} fill="#7c2d12" stroke="#1e293b" strokeWidth="0.9" />
      {/* ペディメント（三角破風） */}
      <polygon points={`${iso3(30, 59, 18)} ${iso3(70, 59, 18)} ${iso3(70, 59, 21)} ${iso3(30, 59, 21)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(28, 59.5, 21)} ${iso3(72, 59.5, 21)} ${iso3(50, 59.5, 32)}`} fill="#f5f5f4" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <circle cx={isoPt(50, 59.6, 25)[0]} cy={isoPt(50, 59.6, 25)[1]} r="2.6" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.8" />
      {/* 大ドーム（青銅） */}
      <ellipse cx={isoPt(50, 36, 26)[0]} cy={isoPt(50, 36, 26)[1]} rx="15" ry="6.5" fill="#a8a29e" stroke="#1e293b" strokeWidth="1" />
      <path d={`M ${isoPt(50, 36, 26)[0] - 14},${isoPt(50, 36, 26)[1]} C ${isoPt(50, 36, 26)[0] - 14},${isoPt(50, 36, 26)[1] - 20} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1] - 20} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1]} Z`}
        fill="#0f766e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={`M ${isoPt(50, 36, 26)[0]},${isoPt(50, 36, 26)[1] - 15} C ${isoPt(50, 36, 26)[0] + 8},${isoPt(50, 36, 26)[1] - 14} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1] - 8} ${isoPt(50, 36, 26)[0] + 14},${isoPt(50, 36, 26)[1]} L ${isoPt(50, 36, 26)[0]},${isoPt(50, 36, 26)[1]} Z`}
        fill="#14b8a6" opacity="0.6" />
      <line x1={isoPt(50, 36, 26)[0]} y1={isoPt(50, 36, 26)[1] - 15} x2={isoPt(50, 36, 26)[0]} y2={isoPt(50, 36, 26)[1] - 21} stroke="#1e293b" strokeWidth="1" />
      <circle cx={isoPt(50, 36, 26)[0]} cy={isoPt(50, 36, 26)[1] - 22} r="1.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" />
      {/* 並木 */}
      {[[16, 78], [84, 78], [30, 88], [70, 88]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 0)[0].toFixed(1)}, ${isoPt(bx, by, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-6" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="0" cy="-9.5" r="4.8" fill="#16a34a" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="-1.6" cy="-11" r="2" fill="#4ade80" opacity="0.8" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgMegaImperialPalace = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 玉砂利の敷地＋堀 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(0, 88, 0.1)} ${iso3(100, 88, 0.1)} ${iso3(100, 100, 0.1)} ${iso3(0, 100, 0.1)}`} fill="url(#grad-water)" />
      <polygon points={`${iso3(42, 88, 0.3)} ${iso3(58, 88, 0.3)} ${iso3(58, 100, 0.3)} ${iso3(42, 100, 0.3)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      {/* 石垣（算木積みの台座） */}
      <IsoCube x={12} y={12} w={76} d={64} h={12} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={1.1} />
      <g stroke="#57534e" strokeWidth="0.6" opacity="0.7">
        <line x1={isoPt(18, 76.1, 4)[0]} y1={isoPt(18, 76.1, 4)[1]} x2={isoPt(40, 76.1, 4)[0]} y2={isoPt(40, 76.1, 4)[1]} />
        <line x1={isoPt(52, 76.1, 8)[0]} y1={isoPt(52, 76.1, 8)[1]} x2={isoPt(80, 76.1, 8)[0]} y2={isoPt(80, 76.1, 8)[1]} />
      </g>
      {/* 御殿1層目（白壁＋朱柱） */}
      <IsoCube x={22} y={20} w={56} d={44} z={12} h={14} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1.1} />
      {[26, 38, 62, 74].map(x => (
        <polygon key={x} points={`${iso3(x - 1.3, 64.2, 12)} ${iso3(x + 1.3, 64.2, 12)} ${iso3(x + 1.3, 64.2, 26)} ${iso3(x - 1.3, 64.2, 26)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
      <FaceSW x1={44} x2={56} y={64.3} z1={12} z2={23} fill="#7c2d12" sw={1} />
      <line x1={isoPt(50, 64.4, 12)[0]} y1={isoPt(50, 64.4, 12)[1]} x2={isoPt(50, 64.4, 23)[0]} y2={isoPt(50, 64.4, 23)[1]} stroke="#1e293b" strokeWidth="0.8" />
      {/* 1層目の緑屋根（入母屋・反り） */}
      <path d={`M ${iso3(14, 14, 26)} L ${iso3(86, 14, 26)} L ${iso3(86, 70, 26)} L ${iso3(14, 70, 26)} Z`} fill="#15803d" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(14, 70, 26)} L ${iso3(86, 70, 26)} Q ${iso3(88, 74, 24)} ${iso3(90, 78, 24.5)} L ${iso3(10, 78, 24.5)} Q ${iso3(12, 74, 24)} ${iso3(14, 70, 26)} Z`}
        fill="#22c55e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {/* 2層目（上御殿） */}
      <IsoCube x={32} y={26} w={36} d={30} z={26} h={11} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1} />
      {[36, 50, 64].map(x => (
        <polygon key={x} points={`${iso3(x - 1.2, 56.2, 26)} ${iso3(x + 1.2, 56.2, 26)} ${iso3(x + 1.2, 56.2, 37)} ${iso3(x - 1.2, 56.2, 37)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
      ))}
      {/* 2層目の屋根（緑＋金の棟飾り） */}
      <polygon points={`${iso3(26, 20, 37)} ${iso3(74, 20, 37)} ${iso3(74, 62, 37)} ${iso3(26, 62, 37)}`} fill="#16a34a" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(26, 62, 37)} ${iso3(74, 62, 37)} ${iso3(50, 41, 50)}`} fill="#22c55e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(74, 20, 37)} ${iso3(74, 62, 37)} ${iso3(50, 41, 50)}`} fill="#166534" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={`${iso3(26, 20, 37)} ${iso3(74, 20, 37)} ${iso3(50, 41, 50)}`} fill="#4ade80" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 金鯱 */}
      <circle cx={isoPt(50, 41, 51.5)[0]} cy={isoPt(50, 41, 51.5)[1]} r="2" fill="url(#grad-gold)" stroke="#1e293b" strokeWidth="0.8" filter="url(#glow-effect)" />
      {/* 門灯篭 */}
      {[[34, 82], [66, 82]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${isoPt(lx, ly, 0)[0].toFixed(1)}, ${isoPt(lx, ly, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-6" stroke="#57534e" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-2.4" y="-9.6" width="4.8" height="3.6" rx="0.6" fill="#e7e5e4" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="0" cy="-7.8" r="1" fill="#fef08a" filter="url(#glow-effect)" />
          <polygon points="-3.2,-9.6 3.2,-9.6 0,-12" fill="#57534e" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgMegaWonder = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 神聖な床 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(20, 20, 0.1)} ${iso3(80, 20, 0.1)} ${iso3(80, 80, 0.1)} ${iso3(20, 80, 0.1)}`} fill="none" stroke="#d97706" strokeWidth="0.8" opacity="0.7" />
      {/* 黄金のジッグラト（3段） */}
      <IsoCube x={16} y={16} w={68} d={68} h={9} top="#fcd34d" left="#fbbf24" right="#d97706" sw={1.1} />
      <IsoCube x={26} y={26} w={48} d={48} z={9} h={9} top="#fde68a" left="#fcd34d" right="#f59e0b" sw={1.1} />
      <IsoCube x={36} y={36} w={28} d={28} z={18} h={9} top="#fef08a" left="#fde047" right="#fbbf24" sw={1.1} />
      {/* 正面階段 */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <polygon key={i} points={`${iso3(45, 84 - i * 10, i * 4.5)} ${iso3(55, 84 - i * 10, i * 4.5)} ${iso3(55, 79 - i * 10, i * 4.5 + 2.2)} ${iso3(45, 79 - i * 10, i * 4.5 + 2.2)}`}
          fill="#fef3c7" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      ))}
      {/* 頂上の4本柱 */}
      {[[40, 40], [60, 40], [40, 60], [60, 60]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.4, py0, 27)} ${iso3(px0 + 1.4, py0, 27)} ${iso3(px0 + 1.4, py0, 38)} ${iso3(px0 - 1.4, py0, 38)}`}
          fill="#f59e0b" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      ))}
      {/* 浮遊する大クリスタル */}
      <g transform={`translate(${isoPt(50, 50, 52)[0].toFixed(1)}, ${isoPt(50, 50, 52)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="16" rx="10" ry="3.6" fill="#0ea5e9" opacity="0.25" />
        <g filter="url(#glow-effect)">
          <polygon points="0,-16 -9,-2 0,14 9,-2" fill="#38bdf8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
          <polygon points="0,-16 -9,-2 0,2 " fill="#7dd3fc" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
          <polygon points="0,-16 0,2 9,-2" fill="#0284c7" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        </g>
        {/* 輝きの粒 */}
        <circle cx="-12" cy="-8" r="1.2" fill="#fef9c3" />
        <circle cx="13" cy="-4" r="1.5" fill="#fef9c3" />
        <circle cx="8" cy="-14" r="1" fill="#fff" />
        <path d="M -15,4 L -13,4 M -14,3 L -14,5" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" />
      </g>
      {/* 光柱 */}
      <polygon points={`${isoPt(50, 50, 27)[0] - 7},${isoPt(50, 50, 27)[1]} ${isoPt(50, 50, 27)[0] + 7},${isoPt(50, 50, 27)[1]} ${isoPt(50, 50, 60)[0] + 3},${isoPt(50, 50, 60)[1]} ${isoPt(50, 50, 60)[0] - 3},${isoPt(50, 50, 60)[1]}`}
        fill="#fef08a" opacity="0.35" />
    </g>
  </svg>
);

export const SvgMegaHarborTown = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 海と陸 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(0, 0, 0.1)} ${iso3(100, 0, 0.1)} ${iso3(100, 42, 0.1)} ${iso3(0, 42, 0.1)}`} fill="#fde68a" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {[[24, 66], [70, 60], [40, 84], [82, 82]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 0)[0]},${isoPt(wx, wy, 0)[1]} q 4,-1.6 8,0`} fill="none" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* 灯台（縞模様） */}
      <g transform={`translate(${isoPt(14, 30, 0)[0].toFixed(1)}, ${isoPt(14, 30, 0)[1].toFixed(1)})`}>
        <ellipse cx="0" cy="0.5" rx="8" ry="3.2" fill="#020617" opacity="0.15" />
        <path d="M -6,-0.5 L -4,-26 L 4,-26 L 6,-0.5 A 6,2.4 0 0 1 -6,-0.5 Z" fill="#f8fafc" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M -5.4,-8 L 5.4,-8 L 4.9,-14 L -4.9,-14 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <path d="M -4.6,-19 L 4.6,-19 L 4.3,-23 L -4.3,-23 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="-4.4" y="-31" width="8.8" height="5" rx="0.8" fill="#1e293b" stroke="#0f172a" strokeWidth="0.8" />
        <rect x="-3" y="-30.2" width="6" height="3.4" rx="0.5" fill="#fef08a" filter="url(#glow-effect)" />
        <polygon points="-5.2,-31 5.2,-31 0,-36" fill="#dc2626" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
      {/* 港町の家並み（3軒） */}
      {[[38, 16, '#ef4444', '#fff7ed'], [58, 22, '#3b82f6', '#f0f9ff'], [78, 14, '#f59e0b', '#fefce8']].map(([hx, hy, roof, wall], i) => (
        <g key={i}>
          <IsoCube x={hx} y={hy} w={16} d={14} h={10} top={wall} left={wall} right={darken(wall, 30)} sw={1} />
          <polygon points={`${iso3(hx - 2, hy - 1, 10)} ${iso3(hx + 18, hy - 1, 10)} ${iso3(hx + 18, hy + 7, 16)} ${iso3(hx - 2, hy + 7, 16)}`} fill={roof} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          <polygon points={`${iso3(hx - 2, hy + 7, 16)} ${iso3(hx + 18, hy + 7, 16)} ${iso3(hx + 18, hy + 15, 10)} ${iso3(hx - 2, hy + 15, 10)}`} fill={darken(roof, 40)} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
          <FaceSW x1={hx + 3} x2={hx + 8} y={hy + 14.2} z1={2.5} z2={7.5} fill="#7dd3fc" sw={0.7} />
          <FaceSW x1={hx + 10} x2={hx + 13.5} y={hy + 14.2} z1={0} z2={6.5} fill="#78350f" sw={0.7} />
        </g>
      ))}
      {/* 桟橋 */}
      <polygon points={`${iso3(56, 42, 2)} ${iso3(68, 42, 2)} ${iso3(68, 84, 2)} ${iso3(56, 84, 2)}`} fill="#b45309" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      {[50, 60, 70, 78].map(y => (
        <line key={y} x1={isoPt(56, y, 2)[0]} y1={isoPt(56, y, 2)[1]} x2={isoPt(68, y, 2)[0]} y2={isoPt(68, y, 2)[1]} stroke="#92400e" strokeWidth="0.8" />
      ))}
      {[[57, 46], [67, 46], [57, 80], [67, 80]].map(([px0, py0], i) => (
        <line key={i} x1={isoPt(px0, py0, 2)[0]} y1={isoPt(px0, py0, 2)[1]} x2={isoPt(px0, py0, -3)[0]} y2={isoPt(px0, py0, -3)[1] + 5} stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      {/* 小舟 */}
      <g transform={`translate(${isoPt(82, 70, 0)[0].toFixed(1)}, ${isoPt(82, 70, 0)[1].toFixed(1)})`}>
        <path d="M -9,-3 C -9,0 -5,2 0,2 C 5,2 9,0 9,-3 L 6,-3 C 6,-1 3,0 0,0 C -3,0 -6,-1 -6,-3 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <path d="M -6,-3 L 6,-3 L 4.6,-1 L -4.6,-1 Z" fill="#b45309" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        <line x1="0" y1="-3" x2="0" y2="-13" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <polygon points="0.8,-13 7,-9.5 0.8,-6.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
      {/* カモメ */}
      <path d={`M ${isoPt(36, 62, 24)[0]},${isoPt(36, 62, 24)[1]} q 2,-2.4 4,0 q 2,-2.4 4,0`} fill="none" stroke="#334155" strokeWidth="1" strokeLinecap="round" />
    </g>
  </svg>
);

export const SvgMegaShrineComplex = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={46} />
      {/* 鎮守の森の緑地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#15803d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 参道 */}
      <polygon points={`${iso3(44, 30, 0.1)} ${iso3(56, 30, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" stroke="#a8a29e" strokeWidth="0.6" />
      {/* 本殿 */}
      <g>
        <IsoCube x={30} y={10} w={40} d={26} h={14} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={1} />
        {[34, 46, 62].map(x => (
          <polygon key={x} points={`${iso3(x - 1.2, 36.2, 0)} ${iso3(x + 1.2, 36.2, 0)} ${iso3(x + 1.2, 36.2, 14)} ${iso3(x - 1.2, 36.2, 14)}`} fill="#b91c1c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        ))}
        <FaceSW x1={52} x2={58} y={36.3} z1={0} z2={10} fill="#7c2d12" sw={0.8} />
        {/* 千木のある屋根 */}
        <polygon points={`${iso3(24, 6, 14)} ${iso3(76, 6, 14)} ${iso3(76, 23, 24)} ${iso3(24, 23, 24)}`} fill="#292524" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <polygon points={`${iso3(24, 40, 14)} ${iso3(76, 40, 14)} ${iso3(76, 23, 24)} ${iso3(24, 23, 24)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <line x1={isoPt(24, 23, 24)[0]} y1={isoPt(24, 23, 24)[1]} x2={isoPt(24, 23, 30)[0] - 3} y2={isoPt(24, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(24, 23, 24)[0]} y1={isoPt(24, 23, 24)[1]} x2={isoPt(24, 23, 30)[0] + 3} y2={isoPt(24, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(76, 23, 24)[0]} y1={isoPt(76, 23, 24)[1]} x2={isoPt(76, 23, 30)[0] - 3} y2={isoPt(76, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
        <line x1={isoPt(76, 23, 24)[0]} y1={isoPt(76, 23, 24)[1]} x2={isoPt(76, 23, 30)[0] + 3} y2={isoPt(76, 23, 30)[1]} stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      {/* 摂社（小さな社） */}
      <g>
        <IsoCube x={10} y={46} w={18} d={14} h={9} top="#e7e5e4" left="#f8fafc" right="#e7e5e4" sw={0.9} />
        <polygon points={`${iso3(6, 44, 9)} ${iso3(32, 44, 9)} ${iso3(32, 53, 16)} ${iso3(6, 53, 16)}`} fill="#292524" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(6, 62, 9)} ${iso3(32, 62, 9)} ${iso3(32, 53, 16)} ${iso3(6, 53, 16)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 朱の鳥居（参道上） */}
      <g transform={`translate(${isoPt(50, 74, 0)[0].toFixed(1)}, ${isoPt(50, 74, 0)[1].toFixed(1)})`}>
        <polygon points="-11,0 -8.4,0 -8.4,-19 -11,-19" fill="#dc2626" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <polygon points="8.4,0 11,0 11,-19 8.4,-19" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <rect x="-12.5" y="-17.5" width="25" height="2.6" fill="#dc2626" stroke="#1e293b" strokeWidth="1" />
        <path d="M -15,-23.5 Q 0,-26.5 15,-23.5 L 15,-20.8 Q 0,-23.8 -15,-20.8 Z" fill="#b91c1c" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
        <rect x="-1.3" y="-17.5" width="2.6" height="4.5" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.7" />
      </g>
      {/* 石灯篭（参道両脇） */}
      {[[38, 86], [62, 86]].map(([lx, ly], i) => (
        <g key={i} transform={`translate(${isoPt(lx, ly, 0)[0].toFixed(1)}, ${isoPt(lx, ly, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-5" stroke="#78716c" strokeWidth="1.7" strokeLinecap="round" />
          <rect x="-2.2" y="-8.6" width="4.4" height="3.6" rx="0.5" fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.8" />
          <circle cx="0" cy="-6.8" r="1" fill="#fef08a" filter="url(#glow-effect)" />
          <polygon points="-3,-8.6 3,-8.6 0,-11" fill="#78716c" stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
        </g>
      ))}
      {/* ご神木 */}
      {[[84, 30], [14, 20], [84, 74]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${isoPt(tx, ty, 0)[0].toFixed(1)}, ${isoPt(tx, ty, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-9" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <circle cx="0" cy="-14" r="6.6" fill="#166534" stroke="#1e293b" strokeWidth="1" />
          <circle cx="-2.2" cy="-16" r="2.6" fill="#22c55e" opacity="0.8" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgCherryPavilion = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={40} />
      {/* 庭園の地面 */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.1)[0]} cy={isoPt(50, 50, 0.1)[1]} rx="27" ry="12.5" fill="#fdf2f8" opacity="0.85" />
      {/* 高床の basement */}
      <IsoCube x={28} y={28} w={44} d={44} h={6} top="#e7e5e4" left="#d6d3d1" right="#a8a29e" sw={1} />
      {/* 朱塗りの柱4本 */}
      {[[33, 33], [67, 33], [33, 67], [67, 67]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.6, py0, 6)} ${iso3(px0 + 1.6, py0, 6)} ${iso3(px0 + 1.6, py0, 24)} ${iso3(px0 - 1.6, py0, 24)}`}
          fill="#dc2626" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      ))}
      {/* 高欄（手すり） */}
      <line x1={isoPt(30, 70, 12)[0]} y1={isoPt(30, 70, 12)[1]} x2={isoPt(70, 70, 12)[0]} y2={isoPt(70, 70, 12)[1]} stroke="#b91c1c" strokeWidth="1.4" />
      <line x1={isoPt(70, 30, 12)[0]} y1={isoPt(70, 30, 12)[1]} x2={isoPt(70, 70, 12)[0]} y2={isoPt(70, 70, 12)[1]} stroke="#991b1b" strokeWidth="1.4" />
      {/* 一層目の桜色屋根（反り屋根） */}
      <path d={`M ${iso3(20, 20, 24)} L ${iso3(80, 20, 24)} Q ${iso3(86, 50, 22)} ${iso3(80, 80, 24)} L ${iso3(20, 80, 24)} Q ${iso3(14, 50, 22)} ${iso3(20, 20, 24)} Z`}
        fill="#f472b6" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(28, 28, 30)} ${iso3(72, 28, 30)} ${iso3(72, 72, 30)} ${iso3(28, 72, 30)}`} fill="#ec4899" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 二層目（小さな楼閣） */}
      <IsoCube x={38} y={38} w={24} d={24} z={30} h={10} top="#fdf2f8" left="#fff1f2" right="#fce7f3" sw={1} />
      <FaceSW x1={44} x2={56} y={62.2} z1={32} z2={38} fill="#7c2d12" sw={0.8} />
      {/* 頂上の反り屋根 */}
      <path d={`M ${iso3(32, 32, 40)} L ${iso3(68, 32, 40)} L ${iso3(68, 68, 40)} L ${iso3(32, 68, 40)} Z`} fill="#db2777" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(32, 68, 40)} L ${iso3(68, 68, 40)} Q ${iso3(50, 50, 52)} ${iso3(32, 68, 40)} Z`} fill="#f472b6" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <path d={`M ${iso3(68, 32, 40)} L ${iso3(68, 68, 40)} Q ${iso3(50, 50, 52)} ${iso3(68, 32, 40)} Z`} fill="#be185d" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <circle cx={isoPt(50, 50, 53)[0]} cy={isoPt(50, 50, 53)[1]} r="1.8" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.7" />
      {/* 桜の木2本 */}
      {[[14, 78], [86, 74]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${isoPt(tx, ty, 0)[0].toFixed(1)}, ${isoPt(tx, ty, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-8" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="-3.4" cy="-11" r="4.6" fill="#f9a8d4" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="3.4" cy="-11" r="4.6" fill="#f472b6" stroke="#1e293b" strokeWidth="0.9" />
          <circle cx="0" cy="-15" r="5" fill="#fbcfe8" stroke="#1e293b" strokeWidth="0.9" />
        </g>
      ))}
      {/* 舞う花びら */}
      {[[30, 20, 26], [74, 40, 34], [20, 46, 18], [60, 14, 30]].map(([fx, fy, fz], i) => (
        <path key={i} d={`M ${isoPt(fx, fy, fz)[0]},${isoPt(fx, fy, fz)[1]} q 1.4,-1.8 2.8,0 q -1.4,1.8 -2.8,0`} fill="#fbcfe8" stroke="#ec4899" strokeWidth="0.5" />
      ))}
    </g>
  </svg>
);

export const SvgDragonShrine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 神域の床 */}
      <polygon points={`${iso3(2, 2, 0)} ${iso3(98, 2, 0)} ${iso3(98, 98, 0)} ${iso3(2, 98, 0)}`} fill="#064e3b" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <ellipse cx={isoPt(50, 50, 0.2)[0]} cy={isoPt(50, 50, 0.2)[1]} rx="32" ry="15" fill="none" stroke="#34d399" strokeWidth="0.8" opacity="0.6" />
      {/* 石の台座（2段） */}
      <IsoCube x={22} y={22} w={56} d={56} h={7} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={1.1} />
      <IsoCube x={32} y={32} w={36} d={36} z={7} h={6} top="#e7e5e4" left="#d6d3d1" right="#a8a29e" sw={1} />
      {/* 神殿（朱柱＋銅屋根） */}
      {[[37, 37], [63, 37], [37, 63], [63, 63]].map(([px0, py0], i) => (
        <polygon key={i} points={`${iso3(px0 - 1.7, py0, 13)} ${iso3(px0 + 1.7, py0, 13)} ${iso3(px0 + 1.7, py0, 30)} ${iso3(px0 - 1.7, py0, 30)}`}
          fill="#b91c1c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      ))}
      {/* 銅葺きの反り屋根 */}
      <path d={`M ${iso3(28, 28, 30)} L ${iso3(72, 28, 30)} Q ${iso3(78, 50, 27)} ${iso3(72, 72, 30)} L ${iso3(28, 72, 30)} Q ${iso3(22, 50, 27)} ${iso3(28, 28, 30)} Z`}
        fill="#0f766e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 36, 35)} ${iso3(64, 36, 35)} ${iso3(64, 64, 35)} ${iso3(36, 64, 35)}`} fill="#14b8a6" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 64, 35)} ${iso3(64, 64, 35)} ${iso3(50, 50, 44)}`} fill="#0d9488" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(64, 36, 35)} ${iso3(64, 64, 35)} ${iso3(50, 50, 44)}`} fill="#115e59" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 御神体の宝珠 */}
      <circle cx={isoPt(50, 50, 21)[0]} cy={isoPt(50, 50, 21)[1]} r="4.4" fill="#fbbf24" stroke="#1e293b" strokeWidth="1" filter="url(#glow-effect)" />
      {/* 巻きつく龍（塔を旋回） */}
      <g>
        <path d={`M ${isoPt(20, 84, 0)[0]},${isoPt(20, 84, 0)[1]}
                 C ${isoPt(4, 60, 6)[0]},${isoPt(4, 60, 6)[1]} ${isoPt(16, 30, 16)[0]},${isoPt(16, 30, 16)[1]} ${isoPt(42, 22, 24)[0]},${isoPt(42, 22, 24)[1]}
                 C ${isoPt(72, 16, 32)[0]},${isoPt(72, 16, 32)[1]} ${isoPt(88, 40, 40)[0]},${isoPt(88, 40, 40)[1]} ${isoPt(64, 56, 48)[0]},${isoPt(64, 56, 48)[1]}`}
          fill="none" stroke="#1e293b" strokeWidth="7.5" strokeLinecap="round" />
        <path d={`M ${isoPt(20, 84, 0)[0]},${isoPt(20, 84, 0)[1]}
                 C ${isoPt(4, 60, 6)[0]},${isoPt(4, 60, 6)[1]} ${isoPt(16, 30, 16)[0]},${isoPt(16, 30, 16)[1]} ${isoPt(42, 22, 24)[0]},${isoPt(42, 22, 24)[1]}
                 C ${isoPt(72, 16, 32)[0]},${isoPt(72, 16, 32)[1]} ${isoPt(88, 40, 40)[0]},${isoPt(88, 40, 40)[1]} ${isoPt(64, 56, 48)[0]},${isoPt(64, 56, 48)[1]}`}
          fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
        {/* 背びれ */}
        {[[10, 46, 11], [26, 24, 20], [58, 17, 28], [84, 28, 37]].map(([bx, by, bz], i) => (
          <path key={i} d={`M ${isoPt(bx, by, bz)[0]},${isoPt(bx, by, bz)[1]} l -1.6,-4.4 l 3.6,1.4 Z`} fill="#059669" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        ))}
        {/* 龍の頭 */}
        <g transform={`translate(${isoPt(64, 56, 48)[0].toFixed(1)}, ${isoPt(64, 56, 48)[1].toFixed(1)})`}>
          <polygon points="0,2 -7,-1 -8.6,-6.6 -3,-9.6 3.6,-7.6 5,-2" fill="#10b981" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="-2.6" cy="-5.4" r="1.4" fill="#fef08a" stroke="#1e293b" strokeWidth="0.6" />
          <path d="M -3,-9.6 L -5,-14 M 0.6,-8.6 L 0,-13" stroke="#1e293b" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M 5,-2 Q 9.6,-3 11,0.6" fill="none" stroke="#f8fafc" strokeWidth="1.1" strokeLinecap="round" />
        </g>
      </g>
    </g>
  </svg>
);

export const SvgShoppingStreet = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 石畳の通り */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(36, 4, 0.1)} ${iso3(64, 4, 0.1)} ${iso3(64, 96, 0.1)} ${iso3(36, 96, 0.1)}`} fill="#d6d3d1" />
      {/* 左列の店（2軒） */}
      {[[8, '#f97316', '#ffedd5'], [8, '#0ea5e9', '#e0f2fe']].map(([x0, awn, wall], i) => {
        const y0 = 10 + i * 40;
        return (
          <g key={i}>
            <IsoCube x={8} y={y0} w={24} d={28} h={14} top={darken(wall, 15)} left={wall} right={darken(wall, 35)} sw={1} />
            <FaceSE x={32.2} y1={y0 + 4} y2={y0 + 13} z1={2} z2={10} fill="#7dd3fc" sw={0.7} />
            <FaceSE x={32.2} y1={y0 + 16} y2={y0 + 24} z1={0} z2={10} fill="#78350f" sw={0.7} />
            {/* 通りに面したひさし（南東向き） */}
            {[0, 1, 2, 3].map(s => (
              <polygon key={s} points={`${iso3(32, y0 + 2 + s * 6.5, 12)} ${iso3(32, y0 + 2 + (s + 1) * 6.5, 12)} ${iso3(37, y0 + 2 + (s + 1) * 6.5, 9)} ${iso3(37, y0 + 2 + s * 6.5, 9)}`}
                fill={s % 2 === 0 ? awn : '#f8fafc'} stroke="#1e293b" strokeWidth="0.7" strokeLinejoin="round" />
            ))}
            <IsoCube x={6} y={y0 - 2} w={28} d={32} z={14} h={2.5} top={darken(wall, 45)} left={darken(wall, 30)} right={darken(wall, 55)} sw={0.8} />
          </g>
        );
      })}
      {/* 右列の店（2軒） */}
      {[['#ec4899', '#fdf2f8'], ['#22c55e', '#f0fdf4']].map(([awn, wall], i) => {
        const y0 = 14 + i * 40;
        return (
          <g key={i}>
            <IsoCube x={68} y={y0} w={24} d={28} h={14} top={darken(wall, 15)} left={darken(wall, 8)} right={darken(wall, 35)} sw={1} />
            {/* 通り側（南西…ではなく左面が通り側になるため、左面に店構え） */}
            <FaceSW x1={71} x2={80} y={y0 + 28.2} z1={2} z2={10} fill="#7dd3fc" sw={0.7} />
            <FaceSW x1={83} x2={89} y={y0 + 28.2} z1={0} z2={10} fill="#78350f" sw={0.7} />
            <AwningSW x1={69} x2={91} y={y0 + 28} z={12} c1={awn} c2="#f8fafc" depth={5} drop={2.5} stripes={4} />
            <IsoCube x={66} y={y0 - 2} w={28} d={32} z={14} h={2.5} top={darken(wall, 45)} left={darken(wall, 30)} right={darken(wall, 55)} sw={0.8} />
          </g>
        );
      })}
      {/* アーケードゲート */}
      <g>
        <IsoCube x={30} y={88} w={6} d={6} h={20} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <IsoCube x={64} y={88} w={6} d={6} h={20} top="#fca5a5" left="#ef4444" right="#b91c1c" sw={0.9} />
        <path d={`M ${iso3(28, 91, 20)} Q ${iso3(50, 91, 32)} ${iso3(72, 91, 20)} L ${iso3(72, 91, 25)} Q ${iso3(50, 91, 37)} ${iso3(28, 91, 25)} Z`}
          fill="#ef4444" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <FaceSW x1={40} x2={60} y={91.2} z1={24.5} z2={31} fill="#fef3c7" sw={0.9} />
        {/* 提灯 */}
        {[36, 50, 64].map(x => (
          <g key={x} transform={`translate(${isoPt(x, 91.4, 21)[0].toFixed(1)}, ${isoPt(x, 91.4, 21)[1].toFixed(1)})`}>
            <line x1="0" y1="-1.6" x2="0" y2="0" stroke="#1e293b" strokeWidth="0.7" />
            <ellipse cx="0" cy="2.6" rx="2.2" ry="2.8" fill="#f97316" stroke="#1e293b" strokeWidth="0.8" />
            <line x1="-2" y1="1.8" x2="2" y2="1.8" stroke="#7c2d12" strokeWidth="0.5" />
            <line x1="-2.2" y1="2.8" x2="2.2" y2="2.8" stroke="#7c2d12" strokeWidth="0.5" />
          </g>
        ))}
      </g>
      {/* 買い物客の自転車 */}
      <g transform={`translate(${isoPt(50, 30, 0)[0].toFixed(1)}, ${isoPt(50, 30, 0)[1].toFixed(1)}) scale(0.4)`}>
        <circle cx="-10.5" cy="1" r="9" fill="none" stroke="#1e293b" strokeWidth="2.6" />
        <circle cx="10.5" cy="1" r="9" fill="none" stroke="#1e293b" strokeWidth="2.6" />
        <path d="M -10.5,1 L -3,-9 L 8,-9 M -3,-9 L 2,1 L 10.5,1 M -10.5,1 L -3.5,-12" fill="none" stroke="#dc2626" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </g>
  </svg>
);

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

export const SvgDepartment = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#d6d3d1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      {/* 本体（4フロア） */}
      <IsoCube x={12} y={10} w={76} d={70} h={42} top="#f1f5f9" left="#fef2f2" right="#fee2e2" sw={1.1} />
      {/* 各階のガラスバンド（南西面） */}
      {[4, 15, 26, 37].map((z, f) => (
        <g key={z}>
          <FaceSW x1={15} x2={85} y={80.2} z1={z} z2={z + 7.5} fill={f === 0 ? 'url(#grad-glass)' : '#bae6fd'} sw={0.7} />
          <FaceSW x1={15} x2={85} y={80.2} z1={z + 7.5} z2={z + 9.5} fill="#f87171" sw={0.6} />
          {[32, 50, 68].map(x => (
            <line key={x} x1={isoPt(x, 80.3, z)[0]} y1={isoPt(x, 80.3, z)[1]} x2={isoPt(x, 80.3, z + 7.5)[0]} y2={isoPt(x, 80.3, z + 7.5)[1]} stroke="#64748b" strokeWidth="0.6" />
          ))}
        </g>
      ))}
      {/* 南東面のガラスバンド */}
      {[4, 15, 26, 37].map(z => (
        <FaceSE key={z} x={88.2} y1={14} y2={76} z1={z} z2={z + 7.5} fill="#7dd3fc" sw={0.7} />
      ))}
      {/* エントランス（回転ドア風） */}
      <FaceSW x1={40} x2={60} y={80.4} z1={0} z2={10} fill="#0f172a" sw={1} />
      <FaceSW x1={43} x2={49} y={80.6} z1={1} z2={9} fill="#e0f2fe" sw={0.5} />
      <FaceSW x1={51} x2={57} y={80.6} z1={1} z2={9} fill="#bae6fd" sw={0.5} />
      <AwningSW x1={36} x2={64} y={80} z={11.5} c1="#ef4444" c2="#f8fafc" depth={7} drop={2.5} stripes={7} />
      {/* 屋上＋看板 */}
      <IsoCube x={10} y={8} w={80} d={74} z={42} h={3} top="#e2e8f0" left="#f1f5f9" right="#cbd5e1" sw={0.9} />
      <FaceSW x1={28} x2={36} y={40} z1={45} z2={50} fill="#7f1d1d" sw={0.7} />
      <FaceSW x1={64} x2={72} y={40} z1={45} z2={50} fill="#7f1d1d" sw={0.7} />
      <FaceSW x1={22} x2={78} y={40} z1={49} z2={64} fill="#ef4444" sw={1.1} />
      <FaceSW x1={25} x2={75} y={40.2} z1={51} z2={62} fill="#fef2f2" sw={0.6} />
      {/* 看板のギフトボックスグリフ */}
      <g transform={`translate(${isoPt(50, 40.2, 56.5)[0].toFixed(1)}, ${isoPt(50, 40.2, 56.5)[1].toFixed(1)})`}>
        <rect x="-4.6" y="-2.6" width="9.2" height="6.4" rx="0.8" fill="#f472b6" stroke="#1e293b" strokeWidth="0.8" />
        <rect x="-5.4" y="-4.4" width="10.8" height="2.4" rx="0.7" fill="#ec4899" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="0" y1="-4.4" x2="0" y2="3.8" stroke="#fef08a" strokeWidth="1.4" />
        <path d="M 0,-4.6 C -3,-7.6 -6,-5 -2.6,-4.4 M 0,-4.6 C 3,-7.6 6,-5 2.6,-4.4" fill="none" stroke="#fef08a" strokeWidth="1.1" />
      </g>
      {/* 旗の列 */}
      {[24, 40, 60, 76].map((x, i) => (
        <g key={x}>
          <line x1={isoPt(x, 78, 45)[0]} y1={isoPt(x, 78, 45)[1]} x2={isoPt(x, 78, 53)[0]} y2={isoPt(x, 78, 53)[1]} stroke="#475569" strokeWidth="0.8" />
          <polygon points={`${isoPt(x, 78, 53)[0]},${isoPt(x, 78, 53)[1]} ${isoPt(x, 78, 53)[0] + 4.6},${isoPt(x, 78, 53)[1] + 1.1} ${isoPt(x, 78, 53)[0]},${isoPt(x, 78, 53)[1] + 2.2}`} fill={['#ef4444', '#facc15', '#22c55e', '#3b82f6'][i]} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      ))}
    </g>
  </svg>
);

export const SvgUniversity = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={44} />
      {/* キャンパス敷地 */}
      <polygon points={`${iso3(0, 0, 0)} ${iso3(100, 0, 0)} ${iso3(100, 100, 0)} ${iso3(0, 100, 0)}`} fill="#86efac" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(44, 56, 0.1)} ${iso3(56, 56, 0.1)} ${iso3(56, 100, 0.1)} ${iso3(44, 100, 0.1)}`} fill="#e7e5e4" />
      {/* 両翼（低層） */}
      <IsoCube x={6} y={16} w={26} d={40} h={16} top="#b91c1c" left="#dc2626" right="#991b1b" sw={1} />
      <IsoCube x={68} y={16} w={26} d={40} h={16} top="#b91c1c" left="#dc2626" right="#991b1b" sw={1} />
      {[[10, 16], [22, 28]].map(([a, b], i) => <WinSW key={`lw-${i}`} x1={a} x2={b} y={56.2} z1={5} z2={12} />)}
      {[[72, 78], [84, 90]].map(([a, b], i) => <WinSW key={`rw-${i}`} x1={a} x2={b} y={56.2} z1={5} z2={12} />)}
      <WinSE x={94.2} y1={24} y2={40} z1={5} z2={12} />
      {/* 中央本館（れんが造り） */}
      <IsoCube x={30} y={10} w={40} d={46} h={26} top="#e7e5e4" left="#ef4444" right="#b91c1c" sw={1.1} />
      <FaceSW x1={30} x2={70} y={56} z1={0} z2={3.5} fill="#78716c" sw={0.9} />
      {/* 本館の窓（白枠アーチ） */}
      {[[34, 41], [59, 66]].map(([a, b], i) => (
        <g key={i}>
          <WinSW x1={a} x2={b} y={56.2} z1={7} z2={15} />
          <WinSW x1={a} x2={b} y={56.2} z1={18} z2={23} />
        </g>
      ))}
      {/* 正面玄関（石造アーチ） */}
      <FaceSW x1={44} x2={56} y={56.3} z1={0} z2={14} fill="#e7e5e4" sw={1} />
      <FaceSW x1={46} x2={54} y={56.5} z1={0} z2={11} fill="#1c1917" sw={0.9} />
      <path d={`M ${iso3(46, 56.6, 11)} Q ${iso3(50, 56.6, 15.5)} ${iso3(54, 56.6, 11)}`} fill="#1c1917" stroke="#1e293b" strokeWidth="0.8" />
      {/* 本館屋根＋時計搭 */}
      <IsoCube x={28} y={8} w={44} d={50} z={26} h={3} top="#64748b" left="#94a3b8" right="#475569" sw={1} />
      <IsoCube x={42} y={22} w={16} d={16} z={29} h={12} top="#e7e5e4" left="#f5f5f4" right="#d6d3d1" sw={1} />
      <g transform={`translate(${isoPt(50, 38.2, 35)[0].toFixed(1)}, ${isoPt(50, 38.2, 35)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="3" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.8" />
        <line x1="0" y1="0" x2="0" y2="-1.8" stroke="#1e293b" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="0" y1="0" x2="1.3" y2="0.6" stroke="#1e293b" strokeWidth="0.6" strokeLinecap="round" />
      </g>
      {/* 緑青ドーム */}
      <path d={`M ${iso3(40, 30, 41)} C ${iso3(40, 30, 55)} ${iso3(60, 30, 55)} ${iso3(60, 30, 41)} Z`} fill="#0f766e" stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
      <path d={`M ${iso3(50, 30, 51.5)} C ${iso3(56, 30, 51)} ${iso3(60, 30, 46)} ${iso3(60, 30, 41)} L ${iso3(50, 30, 41)} Z`} fill="#14b8a6" opacity="0.7" />
      <line x1={isoPt(50, 30, 51.5)[0]} y1={isoPt(50, 30, 51.5)[1]} x2={isoPt(50, 30, 57)[0]} y2={isoPt(50, 30, 57)[1]} stroke="#1e293b" strokeWidth="0.9" />
      <circle cx={isoPt(50, 30, 58)[0]} cy={isoPt(50, 30, 58)[1]} r="1.2" fill="#fbbf24" stroke="#1e293b" strokeWidth="0.6" />
      {/* 両翼の屋根 */}
      <IsoCube x={4} y={14} w={30} d={44} z={16} h={2.5} top="#475569" left="#64748b" right="#334155" sw={0.9} />
      <IsoCube x={66} y={14} w={30} d={44} z={16} h={2.5} top="#475569" left="#64748b" right="#334155" sw={0.9} />
      {/* 並木 */}
      {[[22, 78], [78, 78]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 0)[0].toFixed(1)}, ${isoPt(bx, by, 0)[1].toFixed(1)})`}>
          <line x1="0" y1="0" x2="0" y2="-7" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="0" cy="-10.5" r="5.4" fill="#16a34a" stroke="#1e293b" strokeWidth="1" />
          <circle cx="-1.8" cy="-12" r="2.2" fill="#4ade80" opacity="0.8" />
        </g>
      ))}
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
