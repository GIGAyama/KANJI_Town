import React from 'react';
import { SharedDefs, isoPt, iso3, IsoCube, IsoShadow } from './shared.jsx';

// 遊び（公園・遊具・プール・観覧車など）

// ==========================================
// 10. 公園・レジャー (Parks & Leisure)
// ==========================================
export const SvgPark = ({ seed = 0 }) => {
  // 4×5マスの大きな公園 — seedに応じて遊具の配置パターンを変える
  const variant = seed % 4;

  // アイソメトリック座標ヘルパー (タイル単位 → SVG座標)
  // 4×5グリッドの中心を原点に、1タイル = 約12px単位
  const U = 11; // half-tile width unit
  const V = 5.5; // half-tile height unit
  const isoX = (gx, gy) => (gx - gy) * U;
  const isoY = (gx, gy) => (gx + gy) * V;

  // グリッド中心 (1.5, 2) を原点とした座標系
  const cx = 1.5, cy = 2;
  const toX = (gx, gy) => isoX(gx - cx, gy - cy);
  const toY = (gx, gy) => isoY(gx - cx, gy - cy);

  // 地面ダイヤモンドの4頂点
  const groundPts = `${toX(0,0)},${toY(0,0)} ${toX(4,0)},${toY(4,0)} ${toX(4,5)},${toY(4,5)} ${toX(0,5)},${toY(0,5)}`;
  // 内側の芝生
  const innerPts = `${toX(0.15,0.15)},${toY(0.15,0.15)} ${toX(3.85,0.15)},${toY(3.85,0.15)} ${toX(3.85,4.85)},${toY(3.85,4.85)} ${toX(0.15,4.85)},${toY(0.15,4.85)}`;

  // === 各遊具コンポーネント ===

  // 木 (大)
  const TreeBig = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <line x1="0" y1="1" x2="0" y2="-14" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
        <ellipse cx="0" cy="-17" rx="5.5" ry="6.5" fill="#15803d" stroke="#000" strokeWidth="1.2" />
        <ellipse cx="-2" cy="-19" rx="3" ry="3.5" fill="#22c55e" opacity="0.5" />
      </g>
    );
  };

  // 木 (小)
  const TreeSmall = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <line x1="0" y1="1" x2="0" y2="-10" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        <ellipse cx="0" cy="-12.5" rx="4" ry="5" fill="#16a34a" stroke="#000" strokeWidth="1" />
      </g>
    );
  };

  // 砂場 (sandbox) — 中央付近
  const Sandbox = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 枠（上面） */}
        <polygon points={`0,${-V*1.6} ${U*1.6},0 0,${V*1.6} ${-U*1.6},0`} fill="#d4d4d8" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
        {/* 砂 */}
        <polygon points={`0,${-V*1.2} ${U*1.2},0 0,${V*1.2} ${-U*1.2},0`} fill="#fde68a" stroke="#a3a3a3" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 砂の質感 */}
        <circle cx="-2" cy="-1" r="0.8" fill="#fbbf24" opacity="0.6" />
        <circle cx="3" cy="0.5" r="0.6" fill="#fbbf24" opacity="0.5" />
      </g>
    );
  };

  // すべり台
  const Slide = ({ gx, gy, flip }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    const s = flip ? -1 : 1;
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 支柱 */}
        <line x1={s*(-2)} y1="1" x2={s*(-2)} y2="-14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={s*2} y1="1" x2={s*2} y2="-14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
        {/* はしご横棒 */}
        <line x1={s*(-2)} y1="-4" x2={s*2} y2="-4" stroke="#475569" strokeWidth="1" />
        <line x1={s*(-2)} y1="-8" x2={s*2} y2="-8" stroke="#475569" strokeWidth="1" />
        <line x1={s*(-2)} y1="-12" x2={s*2} y2="-12" stroke="#475569" strokeWidth="1" />
        {/* 上部プラットフォーム */}
        <rect x={s*(-3)} y="-15" width="6" height="2" rx="0.5" fill="#94a3b8" stroke="#000" strokeWidth="1" />
        {/* スライド面（斜め） */}
        <line x1={s*3} y1="-14" x2={s*10} y2="0" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" />
        {/* スライドの縁 */}
        <line x1={s*2.5} y1="-14.5" x2={s*9.5} y2="-0.5" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
      </g>
    );
  };

  // ベンチ
  const Bench = ({ gx, gy, dir }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    // dir: 0=SE facing, 1=SW facing
    return (
      <g transform={`translate(${x},${y})`}>
        {dir === 0 ? (
          <>
            {/* 脚 */}
            <line x1="-4" y1="0.5" x2="-4" y2="-3" stroke="#78350f" strokeWidth="1" />
            <line x1="4" y1="-3.5" x2="4" y2="-6.5" stroke="#78350f" strokeWidth="1" />
            {/* 座面 */}
            <polygon points="-5,-3 5,-7 6,-6 -4,0" fill="#92400e" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
            {/* 背もたれ */}
            <polygon points="5,-7 6,-6 6,-9 5,-10" fill="#78350f" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <line x1="-4" y1="-3.5" x2="-4" y2="-6.5" stroke="#78350f" strokeWidth="1" />
            <line x1="4" y1="0.5" x2="4" y2="-3" stroke="#78350f" strokeWidth="1" />
            <polygon points="-5,-7 5,-3 4,0 -6,-6" fill="#92400e" stroke="#000" strokeWidth="0.8" strokeLinejoin="round" />
            <polygon points="-5,-7 -6,-6 -6,-9 -5,-10" fill="#78350f" stroke="#000" strokeWidth="0.6" strokeLinejoin="round" />
          </>
        )}
      </g>
    );
  };

  // うんてい/ジャングルジム (climbing frame)
  const ClimbingFrame = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* 柱 */}
        <line x1="-6" y1="2" x2="-6" y2="-12" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="0" y1="0" x2="0" y2="-14" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="6" y1="-2" x2="6" y2="-16" stroke="#3b82f6" strokeWidth="1.3" strokeLinecap="round" />
        {/* 横棒 */}
        <line x1="-6" y1="-12" x2="0" y2="-14" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="0" y1="-14" x2="6" y2="-16" stroke="#2563eb" strokeWidth="1.2" />
        <line x1="-6" y1="-8" x2="0" y2="-10" stroke="#2563eb" strokeWidth="1" />
        <line x1="0" y1="-10" x2="6" y2="-12" stroke="#2563eb" strokeWidth="1" />
        <line x1="-6" y1="-4" x2="0" y2="-6" stroke="#2563eb" strokeWidth="1" />
        <line x1="0" y1="-6" x2="6" y2="-8" stroke="#2563eb" strokeWidth="1" />
      </g>
    );
  };

  // 水飲み場/噴水
  const Fountain = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        <ellipse cx="0" cy="0" rx="4" ry="2" fill="#94a3b8" stroke="#000" strokeWidth="1" />
        <rect x="-1" y="-5" width="2" height="5" fill="#94a3b8" stroke="#000" strokeWidth="0.8" />
        <ellipse cx="0" cy="-5" rx="2" ry="1" fill="#7dd3fc" stroke="#64748b" strokeWidth="0.6" />
        {/* 水しぶき */}
        <line x1="0" y1="-6" x2="0" y2="-8" stroke="#7dd3fc" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="-1" y1="-6.5" x2="-1.5" y2="-7.5" stroke="#7dd3fc" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="1" y1="-6.5" x2="1.5" y2="-7.5" stroke="#7dd3fc" strokeWidth="0.6" strokeLinecap="round" />
      </g>
    );
  };

  // ブランコ
  const Swing = ({ gx, gy }) => {
    const x = toX(gx, gy), y = toY(gx, gy);
    return (
      <g transform={`translate(${x},${y})`}>
        {/* A型フレーム */}
        <line x1="-5" y1="2" x2="-3" y2="-13" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="5" y1="-2" x2="3" y2="-15" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" />
        {/* 上部バー */}
        <line x1="-3" y1="-13" x2="3" y2="-15" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
        {/* チェーン */}
        <line x1="-1" y1="-13.5" x2="-2" y2="-4" stroke="#000" strokeWidth="0.6" />
        <line x1="1" y1="-14" x2="0" y2="-4.5" stroke="#000" strokeWidth="0.6" />
        {/* 座面 */}
        <rect x="-3" y="-5" width="4" height="1.5" rx="0.5" fill="#1e293b" stroke="#000" strokeWidth="0.6" />
      </g>
    );
  };

  // 柵（フェンス） — 辺に沿って描画
  const FenceSegment = ({ x1, y1, x2, y2 }) => (
    <g>
      <line x1={x1} y1={y1-2} x2={x2} y2={y2-2} stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
      <line x1={x1} y1={y1-4} x2={x2} y2={y2-4} stroke="#78350f" strokeWidth="1" strokeLinecap="round" />
      {/* 柵の支柱 */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const px = x1 + (x2-x1)*t;
        const py = y1 + (y2-y1)*t;
        return <line key={i} x1={px} y1={py} x2={px} y2={py-5} stroke="#92400e" strokeWidth="1" strokeLinecap="round" />;
      })}
    </g>
  );

  // 遊具配置パターン（seedで変化）
  const layouts = [
    // パターン0: 定番公園（砂場中央、すべり台、ベンチ、木多め）
    { sandbox: [2, 2.5], slide: [3, 1.2, false], bench1: [0.5, 1.5, 0], bench2: [0.5, 3, 1],
      trees: [[0.3,0.3], [3.7,0.3], [3.7,4.7], [0.3,4.7], [2,0.2]],
      extra: 'climbing', climbPos: [1, 1.2], fountain: null, swing: null },
    // パターン1: 噴水公園（噴水中央、ベンチ多め、木でリラックス空間）
    { sandbox: [3, 3.5], slide: null, bench1: [1, 1, 0], bench2: [1, 3.5, 1],
      trees: [[0.3,0.3], [3.7,0.3], [0.3,4.7], [3.7,4.7], [0.3,2.5], [3.7,2.5]],
      extra: 'fountain', climbPos: null, fountain: [2, 2], swing: null },
    // パターン2: アスレチック公園（ジャングルジム＋ブランコ＋すべり台）
    { sandbox: [1, 3.5], slide: [3, 2, true], bench1: [0.5, 1, 0], bench2: [3.5, 4, 1],
      trees: [[0.3,0.3], [3.7,0.3], [3.7,4.7], [0.3,4.7]],
      extra: 'climbing', climbPos: [1.5, 1.5], fountain: null, swing: [2.8, 3.8] },
    // パターン3: 自然公園（木たくさん、ブランコ、ベンチ）
    { sandbox: null, slide: null, bench1: [1.5, 1, 0], bench2: [1.5, 3.5, 1],
      trees: [[0.3,0.3], [3.7,0.3], [0.3,4.7], [3.7,4.7], [2,0.3], [0.3,2.5], [3.7,2.5], [2,4.8]],
      extra: 'fountain', climbPos: null, fountain: [2, 2.5], swing: [3, 1.5] },
  ];
  const L = layouts[variant];

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 68) scale(1.5)">
        {/* === 地面 === */}
        <polygon points={groundPts} fill="#4ade80" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={innerPts} fill="#86efac" stroke="none" />

        {/* === 小道 (十字) === */}
        <line x1={toX(2,0.2)} y1={toY(2,0.2)} x2={toX(2,4.8)} y2={toY(2,4.8)} stroke="#d4d4d8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />
        <line x1={toX(0.2,2.5)} y1={toY(0.2,2.5)} x2={toX(3.8,2.5)} y2={toY(3.8,2.5)} stroke="#d4d4d8" strokeWidth="2.5" opacity="0.5" strokeLinecap="round" />

        {/* === 柵（手前2辺のみ — SE辺とSW辺） === */}
        <FenceSegment x1={toX(4,0)} y1={toY(4,0)} x2={toX(4,5)} y2={toY(4,5)} />
        <FenceSegment x1={toX(0,5)} y1={toY(0,5)} x2={toX(4,5)} y2={toY(4,5)} />

        {/* === 砂場 === */}
        {L.sandbox && <Sandbox gx={L.sandbox[0]} gy={L.sandbox[1]} />}

        {/* === すべり台 === */}
        {L.slide && <Slide gx={L.slide[0]} gy={L.slide[1]} flip={L.slide[2]} />}

        {/* === ベンチ === */}
        <Bench gx={L.bench1[0]} gy={L.bench1[1]} dir={L.bench1[2]} />
        <Bench gx={L.bench2[0]} gy={L.bench2[1]} dir={L.bench2[2]} />

        {/* === うんてい === */}
        {L.extra === 'climbing' && L.climbPos && <ClimbingFrame gx={L.climbPos[0]} gy={L.climbPos[1]} />}

        {/* === 噴水 === */}
        {L.fountain && <Fountain gx={L.fountain[0]} gy={L.fountain[1]} />}

        {/* === ブランコ === */}
        {L.swing && <Swing gx={L.swing[0]} gy={L.swing[1]} />}

        {/* === 木 (奥から描画するためソート) === */}
        {L.trees
          .slice()
          .sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]))
          .map(([gx, gy], i) => {
            const big = (i + seed) % 3 !== 0;
            return big
              ? <TreeBig key={`t${i}`} gx={gx} gy={gy} />
              : <TreeSmall key={`t${i}`} gx={gx} gy={gy} />;
          })}
      </g>
    </svg>
  );
};

export const SvgPlayground = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
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

export const SvgPool = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* デッキ */}
      <IsoCube x={4} y={4} w={92} d={92} h={4} top="#e2e8f0" left="#cbd5e1" right="#94a3b8" sw={1} />
      {/* プール縁 */}
      <polygon points={`${iso3(16, 16, 4.1)} ${iso3(84, 16, 4.1)} ${iso3(84, 84, 4.1)} ${iso3(16, 84, 4.1)}`} fill="#f8fafc" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 水面（少し下げて内壁を見せる） */}
      <polygon points={`${iso3(19, 19, 4.1)} ${iso3(81, 19, 4.1)} ${iso3(81, 19, 1.8)} ${iso3(19, 19, 1.8)}`.replace(/ /g, ' ')} fill="none" />
      <polygon points={`${iso3(19, 81, 1.8)} ${iso3(19, 19, 1.8)} ${iso3(19, 19, 4.1)} ${iso3(19, 81, 4.1)}`} fill="#bae6fd" stroke="#0369a1" strokeWidth="0.6" />
      <polygon points={`${iso3(19, 19, 1.8)} ${iso3(81, 19, 1.8)} ${iso3(81, 19, 4.1)} ${iso3(19, 19, 4.1)}`} fill="#e0f2fe" stroke="#0369a1" strokeWidth="0.6" />
      <polygon points={`${iso3(19, 19, 1.8)} ${iso3(81, 19, 1.8)} ${iso3(81, 81, 1.8)} ${iso3(19, 81, 1.8)}`} fill="url(#grad-water)" stroke="#0369a1" strokeWidth="0.8" strokeLinejoin="round" />
      {/* コースロープ */}
      <line x1={isoPt(19, 40, 1.9)[0]} y1={isoPt(19, 40, 1.9)[1]} x2={isoPt(81, 40, 1.9)[0]} y2={isoPt(81, 40, 1.9)[1]} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3,2" opacity="0.9" />
      <line x1={isoPt(19, 60, 1.9)[0]} y1={isoPt(19, 60, 1.9)[1]} x2={isoPt(81, 60, 1.9)[0]} y2={isoPt(81, 60, 1.9)[1]} stroke="#f8fafc" strokeWidth="1" strokeDasharray="3,2" opacity="0.9" />
      {/* 波のきらめき */}
      {[[32, 30], [55, 50], [40, 68], [68, 72]].map(([wx, wy], i) => (
        <path key={i} d={`M ${isoPt(wx, wy, 1.9)[0]},${isoPt(wx, wy, 1.9)[1]} q 3.5,-1.4 7,0`} fill="none" stroke="#e0f2fe" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      ))}
      {/* はしご */}
      <g transform={`translate(${isoPt(84, 30, 4.1)[0].toFixed(1)}, ${isoPt(84, 30, 4.1)[1].toFixed(1)})`}>
        <path d="M 0,-4 L 0,4 M 3.4,-2.5 L 3.4,5.5" fill="none" stroke="#94a3b8" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="0" y1="-1.5" x2="3.4" y2="0" stroke="#94a3b8" strokeWidth="1" />
        <line x1="0" y1="1.5" x2="3.4" y2="3" stroke="#94a3b8" strokeWidth="1" />
      </g>
      {/* ビーチボール */}
      <g transform={`translate(${isoPt(60, 88, 5)[0].toFixed(1)}, ${isoPt(60, 88, 5)[1].toFixed(1)})`}>
        <circle cx="0" cy="-2.6" r="3.4" fill="#f8fafc" stroke="#1e293b" strokeWidth="0.9" />
        <path d="M 0,-6 C 2.6,-5 2.6,-0.2 0,0.8 M 0,-6 C -2.6,-5 -2.6,-0.2 0,0.8" fill="none" stroke="#ef4444" strokeWidth="0.9" />
      </g>
    </g>
  </svg>
);

export const SvgFerrisWheel = () => {
  const R = 26; const CX = 0; const CY = -58;
  const cabinColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#facc15'];
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
      <g transform="translate(50, 100) scale(2.1)">
        <IsoShadow rx={30} ry={13} />
        {/* 支柱（A型フレーム前後） */}
        <polygon points={`${CX - 14},-6 ${CX - 2},${CY + 4} ${CX + 2},${CY + 4} ${CX - 9},-6`} fill="#64748b" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={`${CX + 14},-6 ${CX + 2},${CY + 4} ${CX - 2},${CY + 4} ${CX + 9},-6`} fill="#94a3b8" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={`${CX - 16},-4 ${CX + 16},-4 ${CX + 13},-9 ${CX - 13},-9`} fill="#475569" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" transform="translate(0, 3)" />
        {/* リム（二重） */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1e293b" strokeWidth="3.6" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#f59e0b" strokeWidth="1.8" />
        <circle cx={CX} cy={CY} r={R - 4.6} fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.8" />
        {/* スポーク */}
        {[0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5].map(a => {
          const rad = a * Math.PI / 180;
          return <line key={a} x1={CX - R * Math.cos(rad)} y1={CY - R * Math.sin(rad)} x2={CX + R * Math.cos(rad)} y2={CY + R * Math.sin(rad)} stroke="#94a3b8" strokeWidth="1" />;
        })}
        {/* ハブ */}
        <circle cx={CX} cy={CY} r="4.6" fill="#475569" stroke="#1e293b" strokeWidth="1.2" />
        <circle cx={CX} cy={CY} r="2" fill="#e2e8f0" stroke="#1e293b" strokeWidth="0.7" />
        {/* ゴンドラ（8基） */}
        {cabinColors.map((c, i) => {
          const a = (i * 45 + 22.5) * Math.PI / 180;
          const gx = CX + R * Math.cos(a);
          const gy = CY + R * Math.sin(a);
          return (
            <g key={i} transform={`translate(${gx.toFixed(1)}, ${gy.toFixed(1)})`}>
              <line x1="0" y1="0" x2="0" y2="3" stroke="#1e293b" strokeWidth="0.9" />
              <path d="M -3.4,3 L 3.4,3 L 2.6,9 Q 0,10.4 -2.6,9 Z" fill={c} stroke="#1e293b" strokeWidth="1.1" strokeLinejoin="round" />
              <rect x="-2" y="4.2" width="4" height="2.2" rx="0.8" fill="#e0f2fe" stroke="#1e293b" strokeWidth="0.5" />
            </g>
          );
        })}
        {/* 乗り場 */}
        <IsoCube x={40} y={58} w={22} d={18} h={7} top="#f8fafc" left="#e2e8f0" right="#cbd5e1" sw={0.9} />
      </g>
    </svg>
  );
};

export const SvgAmusementPark = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
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
