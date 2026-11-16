import React from 'react';
import { isoPt, iso3, IsoCube, FaceSW, FaceSE, IsoShadow } from './shared.jsx';

// 乗り物（自動車・バス・船・飛行機など）

// ==========================================
// 11. 乗り物 (Vehicles)
// アイソメトリックの車体＋タイヤ＋窓で統一クオリティ
// ==========================================

/** アイソメトリックのタイヤ（南西面に見える車輪） */
const WheelSW = ({ x, y, r = 4.5 }) => {
  const [px, py] = isoPt(x, y, 0);
  return (
    <g transform={`translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(26.57)`}>
      <ellipse cx="0" cy={-r} rx={r * 0.62} ry={r} fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
      <ellipse cx="0" cy={-r} rx={r * 0.3} ry={r * 0.48} fill="#94a3b8" stroke="#2b211c" strokeWidth="0.6" />
    </g>
  );
};

export const SvgCar = ({ seed = 0 }) => {
  const bodies = [
    { l: '#ef4444', r: '#b91c1c', t: '#f87171' },
    { l: '#3b82f6', r: '#1d4ed8', t: '#60a5fa' },
    { l: '#facc15', r: '#ca8a04', t: '#fde047' },
  ];
  const c = bodies[(seed || 0) % bodies.length];
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      <g transform="translate(50, 100) scale(2.15)">
        <IsoShadow cy={-21} rx={26} ry={11} o={0.2} />
        {/* 奥のタイヤ */}
        <WheelSW x={34} y={44} r={4} />
        <WheelSW x={62} y={44} r={4} />
        {/* 車体（下段） */}
        <IsoCube x={24} y={40} z={3} w={52} d={22} h={8} top={c.t} left={c.l} right={c.r} sw={1} />
        {/* キャビン */}
        <IsoCube x={34} y={41.5} z={11} w={30} d={19} h={9} top={c.t} left={c.l} right={c.r} sw={1} />
        {/* 窓（サイド2枚 + 後部） */}
        <FaceSW x1={36.5} x2={47} y={60.5} z1={12.5} z2={18.5} fill="#bae6fd" sw={0.8} />
        <FaceSW x1={50} x2={61} y={60.5} z1={12.5} z2={18.5} fill="#7dd3fc" sw={0.8} />
        <FaceSE x={64.2} y1={44.5} y2={57.5} z1={12.5} z2={18.5} fill="#bae6fd" sw={0.8} />
        {/* ヘッドライト・テールランプ */}
        <FaceSE x={76.2} y1={43} y2={47} z1={6} z2={9} fill="#fef08a" sw={0.7} />
        <FaceSE x={76.2} y1={55} y2={59} z1={6} z2={9} fill="#fde047" sw={0.7} />
        <FaceSW x1={25.5} x2={29} y={62.2} z1={6} z2={9} fill="#f87171" sw={0.7} />
        {/* バンパー */}
        <FaceSE x={76.4} y1={42} y2={60} z1={3} z2={5} fill="#cbd5e1" sw={0.7} />
        {/* 手前のタイヤ */}
        <WheelSW x={34} y={63} r={4.5} />
        <WheelSW x={62} y={63} r={4.5} />
      </g>
    </svg>
  );
};

export const SvgBus = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow cy={-21} rx={32} ry={12} o={0.2} />
      <WheelSW x={26} y={42} r={4.5} />
      <WheelSW x={70} y={42} r={4.5} />
      {/* 車体 */}
      <IsoCube x={12} y={38} z={3} w={76} d={24} h={19} top="#4ade80" left="#22c55e" right="#15803d" sw={1.1} />
      {/* 白い帯 */}
      <FaceSW x1={12} x2={88} y={62.2} z1={12} z2={15} fill="#f8fafc" sw={0.7} />
      {/* サイド窓列 */}
      {[15, 29, 43, 57].map(x => (
        <FaceSW key={x} x1={x} x2={x + 11} y={62.3} z1={14.5} z2={20} fill="#bae6fd" sw={0.8} />
      ))}
      {/* 乗降ドア */}
      <FaceSW x1={71} x2={84} y={62.3} z1={4} z2={20} fill="#0f172a" sw={0.9} />
      <FaceSW x1={72.5} x2={77} y={62.5} z1={5} z2={19} fill="#7dd3fc" sw={0.5} />
      <FaceSW x1={78.5} x2={82.5} y={62.5} z1={5} z2={19} fill="#7dd3fc" sw={0.5} />
      {/* フロントガラス・ライト */}
      <FaceSE x={88.2} y1={41} y2={59} z1={13} z2={20.5} fill="#bae6fd" sw={0.9} />
      <FaceSE x={88.2} y1={40} y2={44} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      <FaceSE x={88.2} y1={56} y2={60} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      {/* 行き先表示 */}
      <FaceSE x={88.3} y1={45} y2={55} z1={21.5} z2={24.5} fill="#1e293b" sw={0.7} />
      <WheelSW x={26} y={64} r={5} />
      <WheelSW x={70} y={64} r={5} />
    </g>
  </svg>
);

export const SvgBicycle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 78) scale(2.3)">
      {/* 車輪 */}
      {[-10.5, 10.5].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="1" r="9" fill="none" stroke="#2b211c" strokeWidth="2.4" />
          <circle cx={cx} cy="1" r="6.8" fill="none" stroke="#94a3b8" strokeWidth="0.9" />
          {[0, 45, 90, 135].map(a => (
            <line key={a} x1={cx - 6.6 * Math.cos(a * Math.PI / 180)} y1={1 - 6.6 * Math.sin(a * Math.PI / 180)}
              x2={cx + 6.6 * Math.cos(a * Math.PI / 180)} y2={1 + 6.6 * Math.sin(a * Math.PI / 180)}
              stroke="#94a3b8" strokeWidth="0.7" />
          ))}
          <circle cx={cx} cy="1" r="1.3" fill="#475569" stroke="#2b211c" strokeWidth="0.6" />
        </g>
      ))}
      {/* フレーム */}
      <path d="M -10.5,1 L -3,-9 L 8,-9 M -3,-9 L 2,1 L 10.5,1 L 8,-9 L 9.5,-12 M -10.5,1 L -3.5,-12 M 2,1 L -10.5,1"
        fill="none" stroke="#3b82f6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {/* サドル・ハンドル */}
      <path d="M -6.5,-13 L -0.5,-13" stroke="#2b211c" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 9.5,-12 Q 12.5,-13.5 13,-11" fill="none" stroke="#2b211c" strokeWidth="2" strokeLinecap="round" />
      {/* ペダル・チェーン */}
      <circle cx="2" cy="1" r="2.6" fill="none" stroke="#475569" strokeWidth="1" />
      <line x1="2" y1="1" x2="5.5" y2="4" stroke="#2b211c" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="4.5" y="3.4" width="3" height="1.4" rx="0.5" fill="#1e293b" />
      {/* 前かご */}
      <path d="M 10,-10.5 L 15,-10.5 L 14.4,-6.5 L 10.6,-6.5 Z" fill="#d6d3d1" stroke="#2b211c" strokeWidth="0.9" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgShipVehicle = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      {/* 水面パッド */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="1" strokeLinejoin="round" />
      {[[20, 70], [55, 82], [75, 30], [30, 30]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 0)[0]},${isoPt(wx, wy, 0)[1]} q 4,-1.6 8,0`} fill="none" stroke="#bae6fd" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* 船体（側面カーブ付き） */}
      <g transform={`translate(${isoPt(50, 52, 0)[0]}, ${isoPt(50, 52, 0)[1]})`}>
        {/* 船体外側 */}
        <path d="M -26,-6 C -27,-1 -23,3 -16,4 L 14,9 C 22,10 27,6 28,0 L 29,-4 L 22,-6 Z"
          fill="#b45309" stroke="#2b211c" strokeWidth="1.3" strokeLinejoin="round" transform="translate(0,-8)" />
        {/* 船縁（内側デッキ） */}
        <path d="M -24,-13 L 27,-11.5 C 25,-9 18,-7.5 8,-7.5 L -14,-10 C -20,-10.8 -23,-11.8 -24,-13 Z"
          fill="#f59e0b" stroke="#2b211c" strokeWidth="1.1" strokeLinejoin="round" />
        {/* 操舵室 */}
        <g transform="translate(9, -16)">
          <rect x="-6" y="-8" width="12" height="9" rx="1" fill="#f8fafc" stroke="#2b211c" strokeWidth="1.1" />
          <rect x="-4" y="-6.4" width="8" height="3.6" rx="0.6" fill="#7dd3fc" stroke="#2b211c" strokeWidth="0.7" />
          <rect x="-7.5" y="-9.6" width="15" height="2" rx="1" fill="#0ea5e9" stroke="#2b211c" strokeWidth="0.8" />
        </g>
        {/* マスト＋旗 */}
        <line x1="-12" y1="-11" x2="-12" y2="-30" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round" />
        <polygon points="-12,-30 -4,-27.5 -12,-25" fill="#ef4444" stroke="#2b211c" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 浮き輪 */}
        <circle cx="-19" cy="-9" r="2.6" fill="#f8fafc" stroke="#ef4444" strokeWidth="1.4" />
      </g>
    </g>
  </svg>
);

export const SvgAirplane = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      {/* 駐機場パッド */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#94a3b8" stroke="#2b211c" strokeWidth="0.9" strokeLinejoin="round" />
      <polygon points={`${iso3(46, 10, 0.1)} ${iso3(54, 10, 0.1)} ${iso3(54, 90, 0.1)} ${iso3(46, 90, 0.1)}`} fill="#fbbf24" opacity="0.7" />
      {/* 機体（斜め上から見たスタイル） */}
      <g transform="translate(0, -24) rotate(-24) scale(1.05)">
        <ellipse cx="0" cy="14" rx="9" ry="3.5" fill="#020617" opacity="0.15" />
        {/* 主翼（後ろ側） */}
        <polygon points="-2.5,-4 -21,6 -18,9 -1,2" fill="#cbd5e1" stroke="#2b211c" strokeWidth="1.1" strokeLinejoin="round" />
        {/* 胴体 */}
        <path d="M 0,-24 C 4,-18 4.6,-8 4.6,2 L 4.2,10 C 4,13 -4,13 -4.2,10 L -4.6,2 C -4.6,-8 -4,-18 0,-24 Z"
          fill="#f8fafc" stroke="#2b211c" strokeWidth="1.2" strokeLinejoin="round" />
        {/* コックピット窓 */}
        <path d="M -2.6,-17 C -1,-20.5 1,-20.5 2.6,-17 C 1,-18.2 -1,-18.2 -2.6,-17 Z" fill="#0ea5e9" stroke="#2b211c" strokeWidth="0.8" />
        {/* 客室窓 */}
        {[-12, -8, -4, 0, 4].map(y => <circle key={y} cx="0" cy={y} r="1" fill="#7dd3fc" stroke="#2b211c" strokeWidth="0.4" />)}
        {/* 主翼（手前側）＋エンジン */}
        <polygon points="2.5,-4 21,6 18,9 1,2" fill="#e2e8f0" stroke="#2b211c" strokeWidth="1.1" strokeLinejoin="round" />
        <ellipse cx="10.5" cy="4.6" rx="2" ry="3" fill="#64748b" stroke="#2b211c" strokeWidth="0.8" />
        <ellipse cx="-10.5" cy="4.6" rx="2" ry="3" fill="#475569" stroke="#2b211c" strokeWidth="0.8" />
        {/* 尾翼 */}
        <polygon points="-1.5,9 -8,15.5 -6.4,17 0,12" fill="#e2e8f0" stroke="#2b211c" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="1.5,9 8,15.5 6.4,17 0,12" fill="#cbd5e1" stroke="#2b211c" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="-1.2,10 0,17.5 1.2,10" fill="#ef4444" stroke="#2b211c" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgFireTruck = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow cy={-21} rx={32} ry={12} o={0.2} />
      <WheelSW x={26} y={42} r={4.5} />
      <WheelSW x={70} y={42} r={4.5} />
      {/* 荷台（後部） */}
      <IsoCube x={12} y={38} z={3} w={50} d={24} h={16} top="#f87171" left="#ef4444" right="#b91c1c" sw={1.1} />
      {/* キャブ（前部） */}
      <IsoCube x={62} y={38} z={3} w={26} d={24} h={19} top="#f87171" left="#ef4444" right="#b91c1c" sw={1.1} />
      {/* 白帯・器具箱 */}
      <FaceSW x1={12} x2={62} y={62.2} z1={5} z2={8} fill="#f8fafc" sw={0.7} />
      <FaceSW x1={16} x2={30} y={62.3} z1={9} z2={16} fill="#cbd5e1" sw={0.8} />
      <FaceSW x1={33} x2={47} y={62.3} z1={9} z2={16} fill="#cbd5e1" sw={0.8} />
      {/* キャブ窓・ライト */}
      <FaceSW x1={65} x2={76} y={62.3} z1={13} z2={20} fill="#bae6fd" sw={0.8} />
      <FaceSE x={88.2} y1={41} y2={59} z1={13} z2={20.5} fill="#7dd3fc" sw={0.9} />
      <FaceSE x={88.2} y1={40} y2={44} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      <FaceSE x={88.2} y1={56} y2={60} z1={6} z2={9} fill="#fef08a" sw={0.7} />
      {/* 赤色灯 */}
      <g transform={`translate(${isoPt(75, 50, 23)[0].toFixed(1)}, ${isoPt(75, 50, 23)[1].toFixed(1)})`}>
        <rect x="-3" y="-2.6" width="6" height="2.8" rx="1" fill="#dc2626" stroke="#2b211c" strokeWidth="0.7" filter="url(#glow-effect)" />
      </g>
      {/* はしご（銀色・荷台の上） */}
      <g>
        <polygon points={`${iso3(14, 46, 20)} ${iso3(58, 46, 24)} ${iso3(58, 49, 24)} ${iso3(14, 49, 20)}`} fill="#e2e8f0" stroke="#2b211c" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(14, 54, 20)} ${iso3(58, 54, 24)} ${iso3(58, 57, 24)} ${iso3(14, 57, 20)}`} fill="#cbd5e1" stroke="#2b211c" strokeWidth="1" strokeLinejoin="round" />
        {[20, 28, 36, 44, 52].map(x => (
          <line key={x} x1={isoPt(x, 49, 20 + (x - 14) / 11)[0]} y1={isoPt(x, 49, 20 + (x - 14) / 11)[1]}
            x2={isoPt(x, 54, 20 + (x - 14) / 11)[0]} y2={isoPt(x, 54, 20 + (x - 14) / 11)[1]}
            stroke="#94a3b8" strokeWidth="1.2" />
        ))}
      </g>
      <WheelSW x={26} y={64} r={5} />
      <WheelSW x={70} y={64} r={5} />
    </g>
  </svg>
);
