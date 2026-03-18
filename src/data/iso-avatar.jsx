import React from 'react';

// === 定数 ===
const TILE_W = 64;
const TILE_H = 32;

// === SVGパーツ（ちびキャラアイソメトリック） ===
// 胴体 (Body) - 丸みのあるボクセル
const Body = ({ color, zZ }) => {
  const t = color.top, l = color.left, r = color.right;
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="32,26 38,29 32,32 26,29" fill={t} stroke={t} strokeWidth="1" strokeLinejoin="round" />
      <polygon points="26,29 32,32 32,40 26,37" fill={l} stroke={l} strokeWidth="1" strokeLinejoin="round" />
      <polygon points="32,32 38,29 38,37 32,40" fill={r} stroke={r} strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
};

// 頭 (Head) - 大きくて丸みを帯びた形状、少し胴体にめり込ませる
const Head = ({ color, zZ }) => {
  const t = color.top, l = color.left, r = color.right;
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="32,12 40,16 32,20 24,16" fill={t} stroke={t} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="24,16 32,20 32,28 24,24" fill={l} stroke={l} strokeWidth="2" strokeLinejoin="round" />
      <polygon points="32,20 40,16 40,24 32,28" fill={r} stroke={r} strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
};

// 腕 (Arm) - 短くてぽっちゃり
const Arm = ({ color, type, zZ }) => {
  const l = color.left, r = color.right;
  if (type === 'left') {
    return (
      <g transform={`translate(0, ${zZ})`}>
        <polygon points="24,30 28,32 28,38 24,36" fill={l} stroke={l} strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="36,32 40,30 40,36 36,38" fill={r} stroke={r} strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
};

// 脚 (Leg) - 短い
const Leg = ({ color, type, zZ }) => {
  const l = color.left, r = color.right;
  if (type === 'left') {
    return (
      <g transform={`translate(0, ${zZ})`}>
        <polygon points="27,37 31,39 31,44 27,42" fill={l} stroke={l} strokeWidth="1" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="33,39 37,37 37,42 33,44" fill={r} stroke={r} strokeWidth="1" strokeLinejoin="round" />
    </g>
  );
};

// 持ち物 (Prop)
const Prop = ({ svgContent, type, zZ }) => {
  // 左手首付近: (25, 38), 右手首付近: (39, 38)
  const transform = type === 'left' ? `translate(25, ${zZ + 38}) scale(0.6)` : `translate(39, ${zZ + 38}) scale(0.6)`;
  return (
    <g transform={transform}>
      {svgContent}
    </g>
  );
};

// 帽子 (Hat)
const Hat = ({ svgContent, zZ }) => {
  return (
    <g transform={`translate(0, ${zZ})`}>
      {svgContent}
    </g>
  );
};

// ちびアバターテンプレート
const Humanoid = ({ headColor, bodyColor, legColor, hat, propLeft, propRight, scale = 1 }) => {
  const skin = { top: '#fde68a', left: '#fcd34d', right: '#fbbf24' };
  const hC = headColor || skin;
  const bC = bodyColor || { top: '#9ca3af', left: '#6b7280', right: '#4b5563' };
  const lC = legColor || { left: '#1e3a8a', right: '#1e40af' };

  // 全体を少し小さくしてタイルの中心に合わせる（スケール調整）
  return (
    <svg viewBox="0 0 64 64" width={TILE_W} height={TILE_W} className="drop-shadow-md">
      <g transform={`scale(${scale}) translate(${32 * (1 - scale)}, ${16 * (1 - scale)})`}>
        {/* 奥側の腕 (右腕想定) */}
        <Arm color={skin} type="right" zZ={0} />
        
        {/* 脚 */}
        <Leg color={lC} type="left" zZ={0} />
        <Leg color={lC} type="right" zZ={0} />

        {/* 胴体 */}
        <Body color={bC} zZ={0} />
        
        {/* 手前の腕 (左腕想定) */}
        <Arm color={skin} type="left" zZ={0} />

        {/* 頭（少し下げて胴体に接続させる zZ=0 またはわずかに上げる） */}
        <Head color={hC} zZ={0} />

        {/* 帽子などの装飾 */}
        {hat && <Hat svgContent={hat} zZ={2} />}

        {/* 持ち物 */}
        {propRight && <Prop svgContent={propRight} type="right" zZ={0} />}
        {propLeft && <Prop svgContent={propLeft} type="left" zZ={0} />}
      </g>
    </svg>
  );
};

// ==========================================
// 職業別アバター定義
// ==========================================

export const IsoAvatar = {
  // 1. 農民 (Farmer): 麦わら帽子、クワ
  Farmer: () => (
    <Humanoid
      bodyColor={{ top: '#d1d5db', left: '#9ca3af', right: '#6b7280' }}
      legColor={{ left: '#1e3a8a', right: '#1e40af' }}
      hat={
        <g transform="translate(0, 10)">
          <polygon points="32,-2 48,6 32,14 16,6" fill="#fde047" opacity="0.9" />
          <polygon points="32,-4 40,0 32,4 24,0" fill="#fef08a" />
        </g>
      }
      propLeft={
        <g transform="translate(-10, -10)">
          {/* 柄 */}
          <line x1="15" y1="20" x2="-5" y2="-5" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          {/* 刃 */}
          <polygon points="-5,-5 -12,-1 -8,-10" fill="#9ca3af" />
        </g>
      }
    />
  ),

  // 2. 商人 (Merchant): 頭巾、コイン袋
  Merchant: () => (
    <Humanoid
      bodyColor={{ top: '#34d399', left: '#10b981', right: '#059669' }}
      legColor={{ left: '#047857', right: '#064e3b' }}
      hat={
        <g transform="translate(0, 8)">
          <polygon points="32,-4 42,1 32,6 22,1" fill="#a7f3d0" />
        </g>
      }
      propLeft={
        <g transform="translate(5, 5)">
          <circle cx="0" cy="0" r="7" fill="#fbbf24" />
          <polygon points="-4,-6 4,-6 0,0" fill="#f59e0b" />
          <text x="-3" y="2" fontSize="7" fill="#78350f" style={{ fontWeight: 'bold' }}>¥</text>
        </g>
      }
    />
  ),

  // 3. 職人 (Craftsman): エプロン、ノコギリ
  Craftsman: () => (
    <Humanoid
      bodyColor={{ top: '#fbcfe8', left: '#f472b6', right: '#ec4899' }}
      legColor={{ left: '#4b5563', right: '#374151' }}
      hat={
        <g transform="translate(0, 10)">
          <polygon points="22,6 42,6 32,1" fill="#be185d" /> // バンダナ風
        </g>
      }
      propLeft={
        <g transform="translate(5, 0)">
          <polygon points="0,0 0,18 -6,14" fill="#cbd5e1" />
          <line x1="0" y1="0" x2="-6" y2="-6" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      }
    />
  ),

  // 4. 鍛冶師 (Blacksmith): 耐熱エプロン、ゴーグル、ハンマー
  Blacksmith: () => (
    <Humanoid
      bodyColor={{ top: '#a3a3a3', left: '#737373', right: '#525252' }}
      legColor={{ left: '#262626', right: '#171717' }}
      hat={
        <g transform="translate(0, 10)">
          <polygon points="20,12 44,12 44,15 20,15" fill="#1e293b" />
          <circle cx="28" cy="13.5" r="2.5" fill="#38bdf8" />
          <circle cx="36" cy="13.5" r="2.5" fill="#38bdf8" />
        </g>
      }
      propLeft={
        <g transform="translate(5, 0)">
          <line x1="5" y1="18" x2="-3" y2="0" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="-6,-3 2,-6 5,2 -3,5" fill="#475569" />
        </g>
      }
    />
  ),

  // 5. 学者 (Scholar): 学士帽、本
  Scholar: () => (
    <Humanoid
      bodyColor={{ top: '#bfdbfe', left: '#60a5fa', right: '#3b82f6' }}
      legColor={{ left: '#1e40af', right: '#1d4ed8' }}
      hat={
        <g transform="translate(0, 9)">
          <polygon points="32,-5 46,1 32,7 18,1" fill="#1e3a8a" />
          <line x1="46" y1="1" x2="46" y2="7" stroke="#fbbf24" strokeWidth="1.5" />
        </g>
      }
      propLeft={
        <g transform="translate(0, 8)">
          <polygon points="-8,0 0,-4 8,0 0,4" fill="#ffffff" />
          <polygon points="-8,0 0,4 0,6 -8,2" fill="#e2e8f0" />
          <polygon points="0,4 8,0 8,2 0,6" fill="#cbd5e1" />
          <path d="M-5,0 L-1,-2 M1,-2 L5,0" stroke="#94a3b8" strokeWidth="0.8" />
        </g>
      }
    />
  ),

  // 6. 伝説職人 (Legendary): 豪華なローブ、光る杖
  Legendary: () => (
    <Humanoid
      bodyColor={{ top: '#e9d5ff', left: '#c084fc', right: '#a855f7' }}
      legColor={{ left: '#6b21a8', right: '#581c87' }}
      hat={
        <g transform="translate(0, 10)">
          <polygon points="32,-3 38,4 32,10 26,4" fill="#fcd34d" />
          <polygon points="32,2 35,5 32,8 29,5" fill="#fbbf24" />
        </g>
      }
      propLeft={
        <g transform="translate(-3, 0)">
          <line x1="5" y1="20" x2="-8" y2="-12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <circle cx="-8" cy="-12" r="4" fill="#fde047" opacity="0.8" />
          <circle cx="-8" cy="-12" r="2" fill="#ffffff" />
          {/* 光彩 */}
          <circle cx="-8" cy="-12" r="8" fill="#fef08a" opacity="0.4" />
        </g>
      }
    />
  ),
};
