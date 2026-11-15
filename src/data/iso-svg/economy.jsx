import React from 'react';
import { SharedDefs, isoPt, iso3, IsoCube, FaceSW, WinSE, IsoShadow, MarketStall } from './shared.jsx';

// 生産（倉庫・市場・港・工場など）

// ==========================================
// 5. Economy & Industry Assets
// ==========================================
export const SvgWarehouse = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    baseTop: '#7dd3fc', baseLeft: '#38bdf8', baseRight: '#0284c7',
    wallLight: '#f1f5f9', wallDark: '#e2e8f0',
    wallInnerL: '#cbd5e1', wallInnerR: '#94a3b8', floor: '#e2e8f0',
    pillarTop: '#94a3b8', pillarLeft: '#64748b', pillarRight: '#475569',
    roofBlue: '#60a5fa', roofBlueDark: '#3b82f6', roofEdge: '#475569',
    boxTop: '#fcd34d', boxLeft: '#fbbf24', boxRight: '#f59e0b',
    windowBorders: '#64748b', windowLight: '#fef08a', windowGlow: '#fde047'
  };

  // 直方体を描画するヘルパー
  const Cube = ({ x, y, z, w, d, h, cTop, cLeft, cRight }) => (
    <g>
      {/* 左面 */}
      <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cLeft} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      {/* 右面 */}
      <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={cRight} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      {/* 天面 */}
      <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cTop} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  );

  // 段ボールを描画するヘルパー
  const Box = ({ x, y, z, w=6, d=6, h=6 }) => (
    <g>
      <Cube x={x} y={y} z={z} w={w} d={d} h={h} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />
      {/* 梱包テープの線 */}
      <line x1={iso(x+w/2, y, z+h).split(',')[0]} y1={iso(x+w/2, y, z+h).split(',')[1]}
            x2={iso(x+w/2, y+d, z+h).split(',')[0]} y2={iso(x+w/2, y+d, z+h).split(',')[1]} stroke="#b45309" strokeWidth="0.8" />
    </g>
  );

  // パレットを描画するヘルパー
  const Pallet = ({ x, y, z }) => (
    <g>
      {/* 脚部分 */}
      <Cube x={x+1} y={y+1} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      <Cube x={x+9} y={y+1} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      <Cube x={x+5} y={y+9} z={z} w={2} d={2} h={1.5} cTop="#78350f" cLeft="#78350f" cRight="#451a03" />
      {/* 上板 */}
      <Cube x={x} y={y} z={z+1.5} w={12} d={12} h={1.5} cTop="#b45309" cLeft="#92400e" cRight="#78350f" />
    </g>
  );

  // 白い袋を描画するヘルパー
  const Bag = ({ x, y, z }) => {
    const [cx, cy] = iso(x, y, z).split(',').map(Number);
    return (
      <g>
        {/* 袋の本体 */}
        <path d={`M ${cx-12},${cy+2} Q ${cx-12},${cy-6} ${cx},${cy-10} Q ${cx+12},${cy-6} ${cx+12},${cy+2} Q ${cx+6},${cy+8} ${cx},${cy+8} Q ${cx-6},${cy+8} ${cx-12},${cy+2} Z`} fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
        <path d={`M ${cx-8},${cy-5} Q ${cx},${cy-2} ${cx+8},${cy-5}`} fill="none" stroke="#cbd5e1" strokeWidth="0.8" />
        {/* 袋の縛り口 */}
        <path d={`M ${cx-4},${cy-10} L ${cx-5},${cy-14} L ${cx+1},${cy-13} Z`} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" strokeLinejoin="round" />
      </g>
    );
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(50, 100) scale(2.2)">
        
        {/* === 1. 土台 === */}
        <polygon points={`${iso(5,5,5)} ${iso(95,5,5)} ${iso(95,95,5)} ${iso(5,95,5)}`} fill={colors.baseTop} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(5,95,0)} ${iso(95,95,0)} ${iso(95,95,5)} ${iso(5,95,5)}`} fill={colors.baseLeft} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(95,5,0)} ${iso(95,95,0)} ${iso(95,95,5)} ${iso(95,5,5)}`} fill={colors.baseRight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />

        {/* === 2. 倉庫の内部（床と奥の壁） === */}
        <polygon points={`${iso(20,20,5)} ${iso(80,20,5)} ${iso(80,80,5)} ${iso(20,80,5)}`} fill={colors.floor} stroke="#94a3b8" strokeWidth="0.5" />
        <polygon points={`${iso(20,80,5)} ${iso(20,20,5)} ${iso(20,20,35)} ${iso(20,80,35)}`} fill={colors.wallInnerL} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(80,20,5)} ${iso(20,20,5)} ${iso(20,20,35)} ${iso(80,20,35)}`} fill={colors.wallInnerR} stroke="#1e293b" strokeWidth="0.5" />

        {/* === 3. 奥の柱（右角・左角） === */}
        <Cube x={78} y={18} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />
        <Cube x={18} y={78} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />

        {/* === 4. 内部の段ボール === */}
        <Box x={65} y={50} z={5} />
        <Box x={55} y={55} z={5} />
        <Box x={60} y={60} z={5} />
        <Box x={58} y={54} z={11} />
        <Box x={63} y={60} z={11} />

        {/* === 5. 左壁（手前左）と窓 === */}
        <polygon points={`${iso(20,80,5)} ${iso(80,80,5)} ${iso(80,80,35)} ${iso(20,80,35)}`} fill={colors.wallLight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左壁上部の妻壁（三角形・空洞を塞ぐ） */}
        <polygon points={`${iso(20,80,35)} ${iso(20,20,35)} ${iso(20,50,45)}`} fill={colors.wallLight} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左の窓 */}
        <g>
          <polygon points={`${iso(32,80.1,15)} ${iso(44,80.1,15)} ${iso(44,80.1,23)} ${iso(32,80.1,23)}`} fill={colors.windowBorders} stroke="#1e293b" strokeWidth="0.8" />
          <polygon points={`${iso(33,80.2,16)} ${iso(43,80.2,16)} ${iso(43,80.2,22)} ${iso(33,80.2,22)}`} fill={colors.windowGlow} />
          <polygon points={`${iso(35,80.3,17.5)} ${iso(41,80.3,17.5)} ${iso(41,80.3,20.5)} ${iso(35,80.3,20.5)}`} fill={colors.windowLight} />
        </g>
        {/* 右の窓 */}
        <g>
          <polygon points={`${iso(56,80.1,15)} ${iso(68,80.1,15)} ${iso(68,80.1,23)} ${iso(56,80.1,23)}`} fill={colors.windowBorders} stroke="#1e293b" strokeWidth="0.8" />
          <polygon points={`${iso(57,80.2,16)} ${iso(67,80.2,16)} ${iso(67,80.2,22)} ${iso(57,80.2,22)}`} fill={colors.windowGlow} />
          <polygon points={`${iso(59,80.3,17.5)} ${iso(65,80.3,17.5)} ${iso(65,80.3,20.5)} ${iso(59,80.3,20.5)}`} fill={colors.windowLight} />
        </g>

        {/* === 6. 右壁（奥側）と奥のパレット === */}
        <polygon points={`${iso(80,40,5)} ${iso(80,20,5)} ${iso(80,20,35)} ${iso(80,40,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <Pallet x={83} y={23} z={5} />
        <Bag x={89} y={29} z={8} />

        {/* === 7. シャッターと妻壁（入り口上部） === */}
        <polygon points={`${iso(80,70,25)} ${iso(80,40,25)} ${iso(80,40,35)} ${iso(80,70,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(80,80,35)} ${iso(80,20,35)} ${iso(80,50,45)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* シャッター本体 */}
        <Cube x={78} y={39} z={25} w={4} d={32} h={4} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />
        <polygon points={`${iso(79.5,69,12)} ${iso(79.5,41,12)} ${iso(79.5,41,25)} ${iso(79.5,69,25)}`} fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {[14, 16, 18, 20, 22, 24].map(lz => (
          <line key={`sh-${lz}`} 
                x1={iso(79.5, 69, lz).split(',')[0]} y1={iso(79.5, 69, lz).split(',')[1]}
                x2={iso(79.5, 41, lz).split(',')[0]} y2={iso(79.5, 41, lz).split(',')[1]} 
                stroke="#64748b" strokeWidth="0.8" />
        ))}

        {/* === 8. 右壁（手前側）と手前の柱 === */}
        <polygon points={`${iso(80,80,5)} ${iso(80,70,5)} ${iso(80,70,35)} ${iso(80,80,35)}`} fill={colors.wallDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <Cube x={78} y={78} z={5} w={4} d={4} h={30} cTop={colors.pillarTop} cLeft={colors.pillarLeft} cRight={colors.pillarRight} />

        {/* === 9. 屋根 === */}
        {/* 右側面（奥側） */}
        <polygon points={`${iso(18,18,36)} ${iso(82,18,36)} ${iso(82,50,48)} ${iso(18,50,48)}`} fill={colors.roofBlueDark} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 左側面（手前側） */}
        <polygon points={`${iso(18,82,36)} ${iso(82,82,36)} ${iso(82,50,48)} ${iso(18,50,48)}`} fill={colors.roofBlue} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {/* 屋根の縁取り */}
        <polygon points={`${iso(82,82,33)} ${iso(82,50,45)} ${iso(82,18,33)} ${iso(82,18,36)} ${iso(82,50,48)} ${iso(82,82,36)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso(18,82,33)} ${iso(18,50,45)} ${iso(18,18,33)} ${iso(18,18,36)} ${iso(18,50,48)} ${iso(18,82,36)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />

        {/* === 10. 外の段ボール（左側） === */}
        <Box x={65} y={82} z={5} />
        <Box x={55} y={84} z={5} />
        <Box x={45} y={83} z={5} />
        <Box x={35} y={85} z={5} />
        <Box x={70} y={87} z={5} />
        <Box x={60} y={88} z={5} />
        <Box x={50} y={89} z={5} />
        <Box x={40} y={90} z={5} />
        <Box x={30} y={91} z={5} />
        <Box x={62} y={85} z={11} />
        <Box x={52} y={86} z={11} />
        <Box x={42} y={87} z={11} />
        <Box x={57} y={89} z={11} />
        <Box x={47} y={90} z={11} />
        <Box x={55} y={87} z={17} />

        {/* === 11. 手前のパレット === */}
        <Pallet x={83} y={75} z={5} />
        <Bag x={89} y={81} z={8} />

      </g>
    </svg>
  );
};

export const SvgGrandWarehouse = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    roofLight: '#0284c7', roofDark: '#0369a1',
    roofEdgeSide: '#075985', roofEdgeFront: '#0c4a6e',
    wallLeft: '#a1a1aa', wallRight: '#71717a',
    doorDark: '#27272a', shutter: '#3f3f46',
    windowFrame: '#0284c7', windowGlass: '#e0f2fe',
    boxTop: '#fbbf24', boxLeft: '#f59e0b', boxRight: '#d97706',
    eaveTop: '#f4f4f5', eaveLeft: '#e4e4e7', eaveRight: '#d4d4d8',
    platform: '#0284c7', base: '#f1f5f9'
  };

  // 直方体を描画するヘルパー
  const Cube = ({ x, y, z, w, d, h, cTop, cLeft, cRight }) => (
    <g>
      <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cLeft} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={cRight} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
      <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={cTop} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  );

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(82, 74) scale(2.9)">

        {/* === 1. ベース（1x2マスの敷地） === */}
        {/* 幅(X)を狭く、奥行き(Y)を長くすることで「左手前」に伸びる1x2マスを表現 */}
        <polygon points={`${iso(0,0,0)} ${iso(55,0,0)} ${iso(55,105,0)} ${iso(0,105,0)}`} fill={colors.base} stroke="#cbd5e1" strokeWidth="1" strokeLinejoin="round" />

        {/* === 2. 右下の壁（長方形・右面） === */}
        <polygon points={`${iso(5,95,0)} ${iso(45,95,0)} ${iso(45,95,25)} ${iso(5,95,25)}`} fill={colors.wallRight} stroke="#3f3f46" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 3. 右下の壁の開口部（プラットフォーム奥） === */}
        <polygon points={`${iso(15,95.1,5)} ${iso(35,95.1,5)} ${iso(35,95.1,18)} ${iso(15,95.1,18)}`} fill={colors.doorDark} stroke="#1e293b" strokeWidth="0.5" />
        
        {/* === 4. 開口部内の段ボール === */}
        <Cube x={17} y={89} z={5} w={7} d={6} h={7} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />
        <Cube x={27} y={89} z={5} w={7} d={6} h={7} cTop={colors.boxTop} cLeft={colors.boxLeft} cRight={colors.boxRight} />

        {/* === 5. プラットフォーム（青い出っ張り） === */}
        <Cube x={13} y={95} z={3} w={24} d={3} h={2} cTop={colors.platform} cLeft="#0369a1" cRight="#075985" />

        {/* === 6. 右下の壁の窓 === */}
        <polygon points={`${iso(19,95.1,20)} ${iso(25,95.1,20)} ${iso(25,95.1,23)} ${iso(19,95.1,23)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(19.5,95.2,20.5)} ${iso(24.5,95.2,20.5)} ${iso(24.5,95.2,22.5)} ${iso(19.5,95.2,22.5)}`} fill={colors.windowGlass} />

        {/* === 7. 左下の壁（M字・左面） === */}
        <polygon points={`
          ${iso(45,95,0)} ${iso(45,5,0)} ${iso(45,5,25)} 
          ${iso(45,27.5,45)} ${iso(45,50,25)} ${iso(45,72.5,45)} ${iso(45,95,25)}
        `} fill={colors.wallLeft} stroke="#3f3f46" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 8. 左下の壁の窓1 (奥の山の下) === */}
        <polygon points={`${iso(45.1,15,15)} ${iso(45.1,23,15)} ${iso(45.1,23,19)} ${iso(45.1,15,19)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,15.5,15.5)} ${iso(45.2,22.5,15.5)} ${iso(45.2,22.5,18.5)} ${iso(45.2,15.5,18.5)}`} fill={colors.windowGlass} />

        {/* === 9. 左下の壁の窓2 (奥の山の下・中央寄り) === */}
        <polygon points={`${iso(45.1,35,15)} ${iso(45.1,43,15)} ${iso(45.1,43,19)} ${iso(45.1,35,19)}`} fill={colors.windowFrame} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,35.5,15.5)} ${iso(45.2,42.5,15.5)} ${iso(45.2,42.5,18.5)} ${iso(45.2,35.5,18.5)}`} fill={colors.windowGlass} />

        {/* === 10. 左下の壁の搬入口（シャッター） === */}
        <polygon points={`${iso(45.1,65,0)} ${iso(45.1,83,0)} ${iso(45.1,83,14)} ${iso(45.1,65,14)}`} fill={colors.doorDark} stroke="#1e293b" strokeWidth="0.5" />
        <polygon points={`${iso(45.2,66,0)} ${iso(45.2,82,0)} ${iso(45.2,82,13)} ${iso(45.2,66,13)}`} fill={colors.shutter} />
        {/* シャッターの縞模様 */}
        {[2, 4, 6, 8, 10, 12].map(lz => (
          <line key={`sh-${lz}`} 
                x1={iso(45.3, 66, lz).split(',')[0]} y1={iso(45.3, 66, lz).split(',')[1]}
                x2={iso(45.3, 82, lz).split(',')[0]} y2={iso(45.3, 82, lz).split(',')[1]} 
                stroke="#27272a" strokeWidth="0.8" />
        ))}

        {/* === 11. 搬入口の白い庇と柱 === */}
        {/* 柱 (手前側のみ) */}
        <Cube x={49} y={81} z={0} w={2} d={2} h={14} cTop={colors.eaveRight} cLeft={colors.eaveLeft} cRight={colors.eaveRight} />
        {/* 庇本体 */}
        <Cube x={45.1} y={63} z={14} w={6} d={22} h={3} cTop={colors.eaveTop} cLeft={colors.eaveLeft} cRight={colors.eaveRight} />

        {/* === 12. 屋根 === */}
        {/* 斜面1 (一番奥、裏側で見えにくいが立体感のため描画) */}
        <polygon points={`${iso(3,27.5,47)} ${iso(47,27.5,47)} ${iso(47,3,27)} ${iso(3,3,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面2 (奥の山の手前斜面) */}
        <polygon points={`${iso(3,27.5,47)} ${iso(47,27.5,47)} ${iso(47,50,27)} ${iso(3,50,27)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面3 (手前の山の奥斜面) */}
        <polygon points={`${iso(3,72.5,47)} ${iso(47,72.5,47)} ${iso(47,50,27)} ${iso(3,50,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 斜面4 (一番手前) */}
        <polygon points={`${iso(3,72.5,47)} ${iso(47,72.5,47)} ${iso(47,97,25)} ${iso(3,97,25)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />

        {/* === 13. 屋根の縁取り（厚み） === */}
        {/* 左面のM字の断面 */}
        <polygon points={`
          ${iso(47, 3, 25)} ${iso(47, 27.5, 45)} ${iso(47, 50, 25)} ${iso(47, 72.5, 45)} ${iso(47, 97, 23)}
          ${iso(47, 97, 25)} ${iso(47, 72.5, 47)} ${iso(47, 50, 27)} ${iso(47, 27.5, 47)} ${iso(47, 3, 27)}
        `} fill={colors.roofEdgeSide} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />
        {/* 右手前（先端）の断面 */}
        <polygon points={`${iso(3,97,23)} ${iso(47,97,23)} ${iso(47,97,25)} ${iso(3,97,25)}`} fill={colors.roofEdgeFront} stroke="#1e293b" strokeWidth="0.8" strokeLinejoin="round" />

      </g>
    </svg>
  );
};


export const SvgMarket = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={42} />
      {/* 石畳の広場 */}
      <polygon points={`${iso3(4, 4, 0)} ${iso3(96, 4, 0)} ${iso3(96, 96, 0)} ${iso3(4, 96, 0)}`} fill="#e7e5e4" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <g stroke="#a8a29e" strokeWidth="0.6" opacity="0.7">
        <line x1={isoPt(4, 35, 0)[0]} y1={isoPt(4, 35, 0)[1]} x2={isoPt(96, 35, 0)[0]} y2={isoPt(96, 35, 0)[1]} />
        <line x1={isoPt(4, 66, 0)[0]} y1={isoPt(4, 66, 0)[1]} x2={isoPt(96, 66, 0)[0]} y2={isoPt(96, 66, 0)[1]} />
        <line x1={isoPt(35, 4, 0)[0]} y1={isoPt(35, 4, 0)[1]} x2={isoPt(35, 96, 0)[0]} y2={isoPt(35, 96, 0)[1]} />
        <line x1={isoPt(66, 4, 0)[0]} y1={isoPt(66, 4, 0)[1]} x2={isoPt(66, 96, 0)[0]} y2={isoPt(66, 96, 0)[1]} />
      </g>
      {/* 屋台3台（奥から手前へ） */}
      <MarketStall gx={30} gy={26} c1="#ef4444" c2="#f8fafc" goods={[[-5, -4.5, '#ef4444'], [-1.5, -3.5, '#f97316'], [2, -4.8, '#ef4444']]} />
      <MarketStall gx={72} gy={40} c1="#3b82f6" c2="#f8fafc" goods={[[-4, -4.5, '#facc15'], [0, -3.5, '#a3e635'], [4, -5, '#facc15']]} />
      <MarketStall gx={42} gy={70} c1="#22c55e" c2="#fef9c3" goods={[[-5, -4.5, '#f97316'], [-1, -3.6, '#ef4444'], [3, -4.6, '#a855f7']]} />
      {/* 木箱 */}
      <IsoCube x={80} y={74} w={11} d={11} h={7} top="#fcd34d" left="#fbbf24" right="#f59e0b" sw={0.8} />
      <IsoCube x={83} y={64} w={9} d={9} z={0} h={6} top="#d6d3d1" left="#a8a29e" right="#78716c" sw={0.8} />
      {/* のぼり旗 */}
      <g transform={`translate(${isoPt(12, 84, 0)[0].toFixed(1)}, ${isoPt(12, 84, 0)[1].toFixed(1)})`}>
        <line x1="0" y1="1" x2="0" y2="-21" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="0.4" y="-20" width="5.4" height="13" rx="0.6" fill="#ef4444" stroke="#1e293b" strokeWidth="0.8" />
        <circle cx="3.1" cy="-15.5" r="1.7" fill="#fef9c3" />
      </g>
    </g>
  </svg>
);

export const SvgPort = () => {
  // 100x100の2Dグリッドをアイソメトリックベースにマッピングする関数
  const iso = (x, y, z = 0) => {
    const ptX = (x - y) * 0.44;
    const ptY = -44 + (x + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };

  // カラーパレット
  const colors = {
    contWhite: { top: '#f8fafc', left: '#e2e8f0', right: '#cbd5e1' },
    contBlue:  { top: '#38bdf8', left: '#0284c7', right: '#0369a1' },
    contRed:   { top: '#f87171', left: '#dc2828', right: '#b91c1c' },
    contYellow:{ top: '#facc15', left: '#eab308', right: '#ca8a04' },
    contGreen: { top: '#4ade80', left: '#22c55e', right: '#16a34a' },
    shipHull:  { top: '#475569', left: '#c2410c', right: '#ea580c' },
    craneRed:  { top: '#f87171', left: '#ef4444', right: '#dc2828' },
    craneDark: { top: '#475569', left: '#334155', right: '#1e293b' },
  };

  const boxColors = [colors.contWhite, colors.contBlue, colors.contRed, colors.contYellow, colors.contGreen];

  // 描画オブジェクトを保持する配列
  const objects = [];

  // 直方体を追加
  const addCube = (x, y, z, w, d, h, c) => {
    objects.push({ cx: x + w / 2, cy: y + d / 2, cz: z + h / 2, type: 'cube', x, y, z, w, d, h, c });
  };

  // 船首（斜めカット）を追加
  const addBow = (x, y, z, w, d, h, c) => {
    objects.push({ cx: x + w / 2, cy: y + d / 3, cz: z + h / 2, type: 'bow', x, y, z, w, d, h, c });
  };

  // トラックを追加
  const addTruck = (x, y, z) => {
    addCube(x, y, z, 3, 8, 4, colors.contWhite);
    addCube(x + 0.5, y - 2, z, 2, 2, 3, colors.contBlue);
  };

  const seaZ = -4; // 海面の高さ

  // === 1. コンテナ船 ===
  addCube(56, 15, seaZ, 26, 60, 12, colors.shipHull); // 船体
  addBow(56, 5, seaZ, 26, 10, 12, colors.shipHull);   // 船首
  addCube(58, 65, seaZ + 12, 22, 8, 8, colors.contWhite); // ブリッジ1階
  addCube(60, 67, seaZ + 20, 18, 5, 6, colors.contWhite); // ブリッジ2階
  addCube(68, 70, seaZ + 26, 4, 3, 10, colors.craneDark); // 煙突

  // 船上のコンテナ
  for (let cx = 58; cx <= 74; cx += 8) {
    for (let cy = 20; cy <= 60; cy += 13) {
      for (let cz = seaZ + 12; cz <= seaZ + 24; cz += 6) {
        if ((cx * cy * cz) % 7 < 2) continue; // ランダムに間引く
        addCube(cx, cy, cz, 7, 12.5, 5.5, boxColors[(cx + cy + cz) % boxColors.length]);
      }
    }
  }

  // === 2. 陸のコンテナ山 ===
  for (let cx = 5; cx <= 25; cx += 8) {
    for (let cy = 10; cy <= 80; cy += 14) {
      for (let cz = 0; cz <= 6; cz += 6) {
        if ((cx + cy * cz) % 5 < 2) continue;
        addCube(cx, cy, cz, 7, 13, 5.5, boxColors[(cx * cy + cz) % boxColors.length]);
      }
    }
  }

  // === 3. ガントリークレーン（2基） ===
  [28, 58].forEach(cy => {
    // 左足 (陸奥側) と 右足 (海側・岸壁ギリギリ)
    addCube(25, cy, 0, 3, 3, 26, colors.craneRed);
    addCube(25, cy + 6, 0, 3, 3, 26, colors.craneRed);
    addCube(25, cy, 12, 3, 9, 2, colors.craneRed);
    
    addCube(45, cy, 0, 3, 3, 26, colors.craneRed);
    addCube(45, cy + 6, 0, 3, 3, 26, colors.craneRed);
    addCube(45, cy, 12, 3, 9, 2, colors.craneRed);

    // 足の間の横繋ぎ
    addCube(25, cy, 26, 23, 3, 3, colors.craneRed);
    addCube(25, cy + 6, 26, 23, 3, 3, colors.craneRed);

    // メインブーム (海へ突き出す梁) ※重心ハックのため陸側と海側に分割
    addCube(20, cy + 2.5, 29, 30, 4, 3, colors.craneRed); // 陸側
    addCube(50, cy + 2.5, 29, 35, 4, 3, colors.craneRed); // 海側

    // Aフレーム (上部の支柱)
    objects.push({ cx: 35, cy: cy + 2.5, cz: 37, type: 'poly', fill: colors.craneRed.left,
      points3d: [{x: 35, y: cy + 2.5, z: 44}, {x: 26, y: cy + 2.5, z: 32}, {x: 46, y: cy + 2.5, z: 32}] });
    objects.push({ cx: 35, cy: cy + 6.5, cz: 37, type: 'poly', fill: colors.craneRed.left,
      points3d: [{x: 35, y: cy + 6.5, z: 44}, {x: 26, y: cy + 6.5, z: 32}, {x: 46, y: cy + 6.5, z: 32}] });

    // ワイヤー
    objects.push({ cx: 55, cy: cy + 2.5, cz: 38, type: 'line', stroke: '#ef4444', strokeWidth: 1,
      p1: {x: 35, y: cy + 2.5, z: 44}, p2: {x: 75, y: cy + 2.5, z: 32} });
    objects.push({ cx: 55, cy: cy + 6.5, cz: 38, type: 'line', stroke: '#ef4444', strokeWidth: 1,
      p1: {x: 35, y: cy + 6.5, z: 44}, p2: {x: 75, y: cy + 6.5, z: 32} });

    // 吊り具とコンテナ
    objects.push({ cx: 65, cy: cy + 4.5, cz: 24, type: 'line', stroke: '#1e293b', strokeWidth: 1,
      p1: {x: 65, y: cy + 4.5, z: 29}, p2: {x: 65, y: cy + 4.5, z: 19} });
    addCube(61.5, cy + 3, 19, 7, 3, 1, colors.craneDark);
    addCube(61.5, cy + 2, 13.5, 7, 5, 5.5, boxColors[cy % boxColors.length]);
  });

  // === 4. トラック ===
  addTruck(35, 20, 0);
  addTruck(35, 45, 0);
  addTruck(30, 80, 0);

  // === Zソートの実行 (重心のX+Y+Zで奥から手前へ並び替え) ===
  objects.sort((a, b) => (a.cx + a.cy + a.cz) - (b.cx + b.cy + b.cz));

  // オブジェクトのレンダリング
  const renderObject = (obj, i) => {
    if (obj.type === 'cube') {
      const { x, y, z, w, d, h, c } = obj;
      return (
        <g key={`obj-${i}`}>
          <polygon points={`${iso(x,y+d,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={c.left} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x+w,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(x+w,y,z+h)}`} fill={c.right} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x,y,z+h)} ${iso(x+w,y,z+h)} ${iso(x+w,y+d,z+h)} ${iso(x,y+d,z+h)}`} fill={c.top} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      );
    }
    if (obj.type === 'bow') {
      const { x, y, z, w, d, h, c } = obj;
      const tipX = x + w / 2;
      return (
        <g key={`obj-${i}`}>
          <polygon points={`${iso(x,y+d,z)} ${iso(tipX,y,z)} ${iso(tipX,y,z+h)} ${iso(x,y+d,z+h)}`} fill={c.left} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(tipX,y,z)} ${iso(x+w,y+d,z)} ${iso(x+w,y+d,z+h)} ${iso(tipX,y,z+h)}`} fill={c.right} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
          <polygon points={`${iso(x,y+d,z+h)} ${iso(tipX,y,z+h)} ${iso(x+w,y+d,z+h)}`} fill={c.top} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />
        </g>
      );
    }
    if (obj.type === 'poly') {
      const pts = obj.points3d.map(p => iso(p.x, p.y, p.z)).join(' ');
      return <polygon key={`obj-${i}`} points={pts} fill={obj.fill} stroke="#1e293b" strokeWidth="0.5" strokeLinejoin="round" />;
    }
    if (obj.type === 'line') {
      const p1 = iso(obj.p1.x, obj.p1.y, obj.p1.z).split(',');
      const p2 = iso(obj.p2.x, obj.p2.y, obj.p2.z).split(',');
      return <line key={`obj-${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={obj.stroke} strokeWidth={obj.strokeWidth} />;
    }
    return null;
  };

  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(50, 67) scale(3.03)">
        <polygon points={`${iso(50,0,seaZ)} ${iso(100,0,seaZ)} ${iso(100,100,seaZ)} ${iso(50,100,seaZ)}`} fill="#0891b2" />
        <polygon points={`${iso(0,0,0)} ${iso(50,0,0)} ${iso(50,100,0)} ${iso(0,100,0)}`} fill="#94a3b8" />
        <polygon points={`${iso(50,0,seaZ)} ${iso(50,100,seaZ)} ${iso(50,100,0)} ${iso(50,0,0)}`} fill="#64748b" stroke="#334155" strokeWidth="0.5" />

        {/* トラックの通り道（アスファルトの装飾） */}
        <polygon points={`${iso(33,0,0.02)} ${iso(38,0,0.02)} ${iso(38,100,0.02)} ${iso(33,100,0.02)}`} fill="#cbd5e1" opacity="0.6" />

        {/* 岸壁のゼブラ模様 */}
        <polygon points={`${iso(46,0,0.05)} ${iso(50,0,0.05)} ${iso(50,100,0.05)} ${iso(46,100,0.05)}`} fill="#334155" />
        {Array.from({ length: 15 }).map((_, i) => (
          <polygon key={`zebra-${i}`} 
            points={`${iso(46, i*6.5+1, 0.1)} ${iso(50, i*6.5+3, 0.1)} ${iso(50, i*6.5+5.5, 0.1)} ${iso(46, i*6.5+3.5, 0.1)}`}
            fill="#eab308" />
        ))}

        {/* 海面の波 */}
        {[...Array(20)].map((_, i) => {
          const px = 60 + (i * 7) % 35;
          const py = 10 + (i * 13) % 85;
          return (
            <line key={`wave-${i}`}
              x1={iso(px, py, seaZ).split(',')[0]} y1={iso(px, py, seaZ).split(',')[1]}
              x2={iso(px+3, py, seaZ).split(',')[0]} y2={iso(px+3, py, seaZ).split(',')[1]}
              stroke="#22d3ee" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          );
        })}

        {/* Zソートされたすべての立体オブジェクト */}
        {objects.map(renderObject)}

      </g>
    </svg>
  );
};

export const SvgGarden = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      {/* 芝生ベース */}
      <IsoCube x={4} y={4} w={92} d={92} h={2.5} top="#4ade80" left="#22c55e" right="#16a34a" sw={1} />
      {/* 小道（斜めのS字） */}
      <path d={`M ${iso3(14, 88, 2.6)} C ${iso3(40, 70, 2.6)} ${iso3(36, 40, 2.6)} ${iso3(60, 30, 2.6)} C ${iso3(74, 24, 2.6)} ${iso3(82, 18, 2.6)} ${iso3(88, 12, 2.6)}`}
        fill="none" stroke="#e7e5e4" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
      <path d={`M ${iso3(14, 88, 2.6)} C ${iso3(40, 70, 2.6)} ${iso3(36, 40, 2.6)} ${iso3(60, 30, 2.6)}`}
        fill="none" stroke="#d6d3d1" strokeWidth="1" strokeDasharray="2,3" opacity="0.9" />
      {/* 花壇（左） */}
      <g>
        <polygon points={`${iso3(14, 14, 2.6)} ${iso3(44, 14, 2.6)} ${iso3(44, 44, 2.6)} ${iso3(14, 44, 2.6)}`} fill="#92400e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <polygon points={`${iso3(17, 17, 2.7)} ${iso3(41, 17, 2.7)} ${iso3(41, 41, 2.7)} ${iso3(17, 41, 2.7)}`} fill="#78350f" />
        {[[22, 22, '#f472b6'], [30, 20, '#facc15'], [36, 26, '#f472b6'], [24, 32, '#fb923c'], [34, 36, '#f8fafc']].map(([fx, fy, c], i) => (
          <g key={i} transform={`translate(${isoPt(fx, fy, 3)[0].toFixed(1)}, ${isoPt(fx, fy, 3)[1].toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-3" stroke="#16a34a" strokeWidth="0.9" />
            <circle cx="0" cy="-4.2" r="1.9" fill={c} stroke="#1e293b" strokeWidth="0.6" />
            <circle cx="0" cy="-4.2" r="0.7" fill="#fef08a" />
          </g>
        ))}
      </g>
      {/* 花壇（右手前・丸型） */}
      <g>
        <ellipse cx={isoPt(70, 66, 2.7)[0]} cy={isoPt(70, 66, 2.7)[1]} rx="12.5" ry="6" fill="#92400e" stroke="#1e293b" strokeWidth="1" />
        <ellipse cx={isoPt(70, 66, 2.9)[0]} cy={isoPt(70, 66, 2.9)[1]} rx="9.5" ry="4.4" fill="#78350f" />
        {[[66, 62, '#a855f7'], [74, 64, '#ef4444'], [69, 70, '#facc15']].map(([fx, fy, c], i) => (
          <g key={i} transform={`translate(${isoPt(fx, fy, 3.2)[0].toFixed(1)}, ${isoPt(fx, fy, 3.2)[1].toFixed(1)})`}>
            <line x1="0" y1="0" x2="0" y2="-3.4" stroke="#16a34a" strokeWidth="0.9" />
            <circle cx="0" cy="-4.6" r="2.1" fill={c} stroke="#1e293b" strokeWidth="0.6" />
            <circle cx="0" cy="-4.6" r="0.8" fill="#fef9c3" />
          </g>
        ))}
      </g>
      {/* 刈り込みの丸い低木 */}
      {[[86, 42], [52, 82]].map(([bx, by], i) => (
        <g key={i} transform={`translate(${isoPt(bx, by, 2.6)[0].toFixed(1)}, ${isoPt(bx, by, 2.6)[1].toFixed(1)})`}>
          <ellipse cx="0" cy="0.6" rx="5" ry="2.2" fill="#020617" opacity="0.15" />
          <circle cx="0" cy="-3.6" r="4.6" fill="#16a34a" stroke="#1e293b" strokeWidth="1" />
          <path d="M -3.4,-5.4 A 4.6,4.6 0 0 1 0,-8.2" fill="none" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      ))}
      {/* 蝶 */}
      <g transform={`translate(${isoPt(48, 48, 12)[0].toFixed(1)}, ${isoPt(48, 48, 12)[1].toFixed(1)})`}>
        <path d="M 0,0 Q -3,-2.6 -1,-4 Q 0.4,-4.4 0,-1 Q 1.6,-4.6 3.4,-3 Q 3.4,-0.8 0,0 Z" fill="#facc15" stroke="#1e293b" strokeWidth="0.6" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

export const SvgSmithy = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.15)">
      <IsoShadow rx={40} />
      {/* 土の敷地 */}
      <polygon points={`${iso3(6, 6, 0)} ${iso3(94, 6, 0)} ${iso3(94, 94, 0)} ${iso3(6, 94, 0)}`} fill="#a8a29e" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* 石造りの工房 */}
      <IsoCube x={18} y={14} w={62} d={58} h={22} top="#78716c" left="#a8a29e" right="#78716c" sw={1.1} />
      {/* 石のテクスチャ */}
      <g stroke="#57534e" strokeWidth="0.7" opacity="0.8">
        <line x1={isoPt(24, 72.1, 6)[0]} y1={isoPt(24, 72.1, 6)[1]} x2={isoPt(40, 72.1, 6)[0]} y2={isoPt(40, 72.1, 6)[1]} />
        <line x1={isoPt(60, 72.1, 9)[0]} y1={isoPt(60, 72.1, 9)[1]} x2={isoPt(74, 72.1, 9)[0]} y2={isoPt(74, 72.1, 9)[1]} />
        <line x1={isoPt(30, 72.1, 15)[0]} y1={isoPt(30, 72.1, 15)[1]} x2={isoPt(44, 72.1, 15)[0]} y2={isoPt(44, 72.1, 15)[1]} />
      </g>
      {/* 炉の開口（オレンジに光る） */}
      <FaceSW x1={26} x2={48} y={72.2} z1={0} z2={14} fill="#1c1917" sw={1.1} />
      <FaceSW x1={28.5} x2={45.5} y={72.4} z1={0} z2={11.5} fill="#7c2d12" sw={0.6} />
      <g transform={`translate(${isoPt(37, 72.5, 5)[0].toFixed(1)}, ${isoPt(37, 72.5, 5)[1].toFixed(1)})`}>
        <circle cx="0" cy="0" r="4.6" fill="#f97316" filter="url(#glow-effect)" />
        <circle cx="0" cy="0.6" r="2.4" fill="#fde047" />
      </g>
      {/* 窓（南東面） */}
      <WinSE x={80.2} y1={28} y2={44} z1={8} z2={17} />
      {/* 傾斜屋根（片流れの板葺き） */}
      <polygon points={`${iso3(14, 10, 22)} ${iso3(84, 10, 22)} ${iso3(84, 78, 28)} ${iso3(14, 78, 28)}`} fill="#57534e" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
      <polygon points={`${iso3(14, 78, 28)} ${iso3(84, 78, 28)} ${iso3(84, 78, 25.5)} ${iso3(14, 78, 25.5)}`} fill="#44403c" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      <polygon points={`${iso3(84, 10, 22)} ${iso3(84, 78, 28)} ${iso3(84, 78, 25.5)} ${iso3(84, 10, 19.5)}`} fill="#292524" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      {/* れんが煙突＋煙 */}
      <IsoCube x={62} y={20} w={12} d={12} z={24} h={22} top="#57534e" left="#b91c1c" right="#7f1d1d" sw={1} />
      <g transform={`translate(${isoPt(68, 26, 48)[0].toFixed(1)}, ${isoPt(68, 26, 48)[1].toFixed(1)})`} opacity="0.85">
        <circle cx="0" cy="-2" r="3.4" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="2.8" cy="-6.5" r="4.2" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.7" />
        <circle cx="6.4" cy="-11.5" r="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.7" />
      </g>
      {/* 金床（アンビル） */}
      <g transform={`translate(${isoPt(74, 84, 0)[0].toFixed(1)}, ${isoPt(74, 84, 0)[1].toFixed(1)})`}>
        <polygon points="-4,0 4,0 3,-2.6 -3,-2.6" fill="#57534e" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
        <path d="M -5.5,-2.6 L 5.5,-2.6 L 6.8,-4.2 L 3,-6 L -3.6,-6 L -5.5,-4.4 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <path d="M -5.5,-4.4 L -8.5,-4.8 L -7,-6 L -3.6,-6" fill="#cbd5e1" stroke="#1e293b" strokeWidth="0.9" strokeLinejoin="round" />
      </g>
      {/* ハンマー（立てかけ） */}
      <g transform={`translate(${isoPt(88, 60, 0)[0].toFixed(1)}, ${isoPt(88, 60, 0)[1].toFixed(1)}) rotate(18)`}>
        <line x1="0" y1="0" x2="0" y2="-9" stroke="#92400e" strokeWidth="1.3" strokeLinecap="round" />
        <rect x="-2.6" y="-12" width="5.2" height="3.2" rx="0.7" fill="#64748b" stroke="#1e293b" strokeWidth="0.8" />
      </g>
    </g>
  </svg>
);

export const SvgFactory = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      {/* メイン工場棟 */}
      <polygon points="0,-3 -30,-18 -30,-38 0,-23" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-3 30,-18 30,-38 0,-23" fill="#b91c1c" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-23 -30,-38 -30,-40 0,-25" fill="#450a0a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-23 30,-38 30,-40 0,-25" fill="#7f1d1d" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      {/* 左側の倉庫棟 */}
      <polygon points="-30,-18 -48,-27 -48,-40 -30,-31" fill="#64748b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-30,-18 -18,-24 -18,-37 -30,-31" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="-30,-31 -48,-40 -33,-47 -18,-37" fill="#475569" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 窓 */}
      <g transform="translate(-15, -15)">
        <polygon points="0,-0.5 -9.5,-5.5 -9.5,-14.5 0,-9.5" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      <g transform="translate(5, -10)">
        <polygon points="0,-0.5 9.5,-5.5 9.5,-14.5 0,-9.5" fill="#93c5fd" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 煙突3本 */}
      <g transform="translate(-18, -35)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(-6, -41)">
        <polygon points="0,0 -4,-2 -4,-35 0,-33" fill="#7f1d1d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points="0,0 4,-2 4,-35 0,-33" fill="#b91c1c" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
      <g transform="translate(-35, -38)">
        <polygon points="0,0 -3,-1.5 -3,-25 0,-23.5" fill="#475569" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="0,0 3,-1.5 3,-25 0,-23.5" fill="#64748b" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
      {/* 入口 */}
      <polygon points="0,-3 -8,-7 -8,-15 0,-11" fill="#1e293b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  </svg>
);

export const SvgWatermill = () => {
  const iso = (x, y, z = 0) => {
    const ptX = (x * 2 - y) * 0.44;
    const ptY = -66 + (x * 2 + y) * 0.22 - z;
    return `${ptX.toFixed(2)},${ptY.toFixed(2)}`;
  };
  const colors = {
    base: '#f1f5f9', water: '#73a2a6',
    wallLeft: '#c0906a', wallRight: '#9b7150',
    roofLight: '#8c7961', roofDark: '#6e5f4d',
    roofEdge: '#524333', roofEdgeDark: '#3e3124',
    woodDark: '#3a2210', woodMedium: '#5a3820', woodLight: '#7a4a2a',
    stoneTop: '#a8b0b2', stoneSide: '#8b9396'
  };
  const getWheelPath = (x, cy, cz, r, thickness) => {
    const pts = [];
    for (let i = 0; i <= 360; i += 15) {
      const rad = i * Math.PI / 180;
      pts.push(iso(x, cy + r * Math.cos(rad), cz + r * Math.sin(rad)));
    }
    for (let i = 360; i >= 0; i -= 15) {
      const rad = i * Math.PI / 180;
      pts.push(iso(x, cy + (r - thickness) * Math.cos(rad), cz + (r - thickness) * Math.sin(rad)));
    }
    return pts.join(' ');
  };
  const drawPaddles = (x1, x2, cy, cz, r, thickness) => {
    const paddles = [];
    for (let i = 0; i < 360; i += 15) {
      const rad = i * Math.PI / 180;
      const dy1 = r * Math.cos(rad), dz1 = r * Math.sin(rad);
      const dy2 = (r - thickness) * Math.cos(rad), dz2 = (r - thickness) * Math.sin(rad);
      paddles.push(
        <polygon key={`pad-${i}`}
          points={`${iso(x1, cy+dy1, cz+dz1)} ${iso(x2, cy+dy1, cz+dz1)} ${iso(x2, cy+dy2, cz+dz2)} ${iso(x1, cy+dy2, cz+dz2)}`}
          fill="#4a3219" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      );
    }
    return paddles;
  };
  const drawSpokes = (x, cy, cz, r, count = 8) => {
    const spokes = [];
    const step = 180 / count;
    for (let i = 0; i < 180; i += step) {
      const rad = i * Math.PI / 180;
      const c = Math.cos(rad), s = Math.sin(rad);
      const w = 1.2;
      spokes.push(
        <polygon key={`spk-${x}-${i}`}
          points={`${iso(x, cy+r*c+w*s, cz+r*s-w*c)} ${iso(x, cy+r*c-w*s, cz+r*s+w*c)} ${iso(x, cy-r*c-w*s, cz-r*s+w*c)} ${iso(x, cy-r*c+w*s, cz-r*s-w*c)}`}
          fill="#8a5a33" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
      );
    }
    return spokes;
  };
  return (
    <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {typeof SharedDefs !== 'undefined' && <SharedDefs />}
      <g transform="translate(-2, 126) scale(2.35)">
        {/* 地面と水路 */}
        <polygon points={`${iso(0,0,0)} ${iso(65,0,0)} ${iso(65,100,0)} ${iso(0,100,0)}`} fill={colors.base} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(65,0,0)} ${iso(65,100,0)} ${iso(65,100,-5)} ${iso(65,0,-5)}`} fill={colors.stoneSide} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(65,0,-5)} ${iso(85,0,-5)} ${iso(85,100,-5)} ${iso(65,100,-5)}`} fill={colors.water} stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[10, 30, 50, 70, 90].map(wy => (
          <line key={`wave-${wy}`}
            x1={iso(70, wy, -5).split(',')[0]} y1={iso(70, wy, -5).split(',')[1]}
            x2={iso(78, wy+8, -5).split(',')[0]} y2={iso(78, wy+8, -5).split(',')[1]}
            stroke="#99c8cb" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        ))}
        {/* 建物の壁 */}
        <polygon points={`${iso(60,10,0)} ${iso(60,80,0)} ${iso(60,80,29.1)} ${iso(60,10,29.1)}`} fill={colors.wallRight} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(60.1,72,10)} ${iso(60.1,78,10)} ${iso(60.1,78,20)} ${iso(60.1,72,20)}`} fill="#382613" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(60.2,73,11)} ${iso(60.2,77,11)} ${iso(60.2,77,19)} ${iso(60.2,73,19)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        <line x1={iso(60.3,75,11).split(',')[0]} y1={iso(60.3,75,11).split(',')[1]} x2={iso(60.3,75,19).split(',')[0]} y2={iso(60.3,75,19).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        <line x1={iso(60.3,73,15).split(',')[0]} y1={iso(60.3,73,15).split(',')[1]} x2={iso(60.3,77,15).split(',')[0]} y2={iso(60.3,77,15).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        <polygon points={`${iso(15,80,0)} ${iso(60,80,0)} ${iso(60,80,29.1)} ${iso(37.5,80,45)} ${iso(15,80,29.1)}`} fill={colors.wallLeft} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 正面窓（格子引き戸） */}
        <polygon points={`${iso(25,80.1,5)} ${iso(45,80.1,5)} ${iso(45,80.1,20)} ${iso(25,80.1,20)}`} fill="#382613" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(26,80.1,6)} ${iso(44,80.1,6)} ${iso(44,80.1,19)} ${iso(26,80.1,19)}`} fill="#fef3c7" stroke="#1e293b" strokeWidth="1" strokeLinejoin="round" />
        {[29, 32, 35, 38, 41].map(wx => (
          <line key={`v-${wx}`} x1={iso(wx, 80.2, 6).split(',')[0]} y1={iso(wx, 80.2, 6).split(',')[1]} x2={iso(wx, 80.2, 19).split(',')[0]} y2={iso(wx, 80.2, 19).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        ))}
        {[9, 12.5, 16].map(wz => (
          <line key={`h-${wz}`} x1={iso(26, 80.2, wz).split(',')[0]} y1={iso(26, 80.2, wz).split(',')[1]} x2={iso(44, 80.2, wz).split(',')[0]} y2={iso(44, 80.2, wz).split(',')[1]} stroke="#1e293b" strokeWidth="1" />
        ))}
        {/* 屋根 */}
        <polygon points={`${iso(37.5,82,45)} ${iso(37.5,8,45)} ${iso(12,8,27)} ${iso(12,82,27)}`} fill={colors.roofDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,45)} ${iso(37.5,8,45)} ${iso(63,8,27)} ${iso(63,82,27)}`} fill={colors.roofLight} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,47)} ${iso(12,82,29)} ${iso(12,80,27)} ${iso(37.5,80,45)}`} fill={colors.roofEdgeDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(37.5,82,47)} ${iso(63,82,29)} ${iso(63,80,27)} ${iso(37.5,80,45)}`} fill={colors.roofEdge} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(36,79,47)} ${iso(36,11,47)} ${iso(39,11,47)} ${iso(39,79,47)}`} fill="#4a3b2c" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(39,79,47)} ${iso(39,11,47)} ${iso(39,11,45)} ${iso(39,79,45)}`} fill="#3e3124" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(36,79,47)} ${iso(39,79,47)} ${iso(39,79,45)} ${iso(36,79,45)}`} fill="#2c2219" stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        {/* 水車 */}
        <polygon points={getWheelPath(61, 45, 10, 19, 3)} fill={colors.woodMedium} stroke="#1e293b" strokeWidth="1" fillRule="evenodd" strokeLinejoin="round" />
        {drawSpokes(61.5, 45, 10, 16, 8)}
        {drawPaddles(61, 75, 45, 10, 19, 3)}
        <polygon points={`${iso(59, 43, 8)} ${iso(77, 43, 8)} ${iso(77, 47, 12)} ${iso(59, 47, 12)}`} fill={colors.woodDark} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={getWheelPath(75, 45, 10, 19, 3)} fill={colors.woodLight} stroke="#1e293b" strokeWidth="1" fillRule="evenodd" strokeLinejoin="round" />
        {drawSpokes(74.5, 45, 10, 16, 8)}
        {/* 手前の土手 */}
        <polygon points={`${iso(85,0,-5)} ${iso(85,100,-5)} ${iso(85,100,0)} ${iso(85,0,0)}`} fill={colors.stoneSide} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
        <polygon points={`${iso(85,0,0)} ${iso(100,0,0)} ${iso(100,100,0)} ${iso(85,100,0)}`} fill={colors.stoneTop} stroke="#1e293b" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

export const SvgMine = () => (
  <svg viewBox="0 -100 100 200" className="w-full h-full" style={{ overflow: "visible" }}><SharedDefs />
    <g transform="translate(50, 100) scale(2.5)">
      <polygon points="-25,-5 -15,-30 0,-45 20,-35 30,-10 15,5 -10,5" fill="#334155" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="0,-45 20,-35 30,-10 15,5 0,0 -10,-20" fill="#475569" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="20,-35 30,-10 25,-5 10,-20" fill="#64748b" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <path d="M -10,0 C -10,-20 10,-20 10,0 L 0,5 Z" fill="#000" />
      <polygon points="-12,-2 -10,-1 -10,-18 -12,-19" fill="#451a03" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="12,-2 10,-1 10,-18 12,-19" fill="#451a03" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      <polygon points="-14,-19 14,-19 12,-16 -12,-16" fill="#451a03" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <g transform="translate(-10, 4)">
        <polygon points="-6,-4 0,-7 6,-4 0,-1" fill="#64748b" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="-6,-4 0,-1 0,3 -6,0" fill="#475569" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
        <polygon points="0,-1 6,-4 6,0 0,3" fill="#94a3b8" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);
