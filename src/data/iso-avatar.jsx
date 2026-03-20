import React from 'react';

// === 共通定義 (Shared Definitions for Effects) ===
const AvatarEffects = () => (
  <defs>
    <filter id="avatar-soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0.5" dy="1" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.3" />
    </filter>
    <filter id="eye-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="0.5" result="blur" />
      <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <linearGradient id="grad-hair-shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
    </linearGradient>
  </defs>
);

// === 定数 ===
const TILE_W = 64;
const TILE_H = 32;

// === SVGパーツ（ちびキャラアイソメトリック） ===
// 胴体 (Body) - 立体感と質感を強調
const Body = ({ color, zZ }) => {
  const t = color.top, l = color.left, r = color.right;
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="32,26 38,29 32,32 26,29" fill={t} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="26,29 32,32 32,40 26,37" fill={l} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      <polygon points="32,32 38,29 38,37 32,40" fill={r} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      {/* 衣服のシワやボタンなどの微細なディテールを追加可能 */}
      <line x1="29" y1="31" x2="29" y2="38" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
    </g>
  );
};

// 頭 (Head) - 表情豊かでプレミアムな造形
const Head = ({ color, zZ }) => {
  const t = color.top, l = color.left, r = color.right;
  const faceColor = '#fff1f2'; // 少し血色の良い肌色
  return (
    <g transform={`translate(0, ${zZ})`}>
      {/* 頭部本体 */}
      <polygon points="32,12 40,16 32,20 24,16" fill={t} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="24,16 32,20 32,28 24,24" fill={l} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="32,20 40,16 40,24 32,28" fill={r} stroke="#000" strokeWidth="2" strokeLinejoin="round" />
      
      {/* 顔の面 (表情のベース) */}
      <polygon points="25.5,17.5 31.5,20.5 31.5,26.5 25.5,23.5" fill={faceColor} stroke="#000" strokeWidth="1" strokeLinejoin="round" opacity="0.9" />
      
      {/* 瞳 (Eyes) - 生き生きした表現 */}
      <g transform="translate(27.5, 21.5) skewY(15)">
        <ellipse cx="0" cy="0" rx="1.2" ry="1.8" fill="#1e293b" />
        <circle cx="-0.4" cy="-0.6" r="0.4" fill="#fff" />
      </g>
      <g transform="translate(30, 22.8) skewY(15)">
        <ellipse cx="0" cy="0" rx="1.2" ry="1.8" fill="#1e293b" />
        <circle cx="-0.4" cy="-0.6" r="0.4" fill="#fff" />
      </g>
      
      {/* ほっぺ (Cheeks) */}
      <circle cx="26.5" cy="24.5" r="1.2" fill="#fda4af" opacity="0.6" />
      <circle cx="29.5" cy="26" r="1.2" fill="#fda4af" opacity="0.6" />
    </g>
  );
};

// 腕 (Arm)
const Arm = ({ color, type, zZ }) => {
  const l = color.left, r = color.right;
  if (type === 'left') {
    return (
      <g transform={`translate(0, ${zZ})`}>
        <polygon points="24,30 28,32 28,38 24,36" fill={l} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="36,32 40,30 40,36 36,38" fill={r} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
    </g>
  );
};

// 脚 (Leg)
const Leg = ({ color, type, zZ }) => {
  const l = color.left, r = color.right;
  if (type === 'left') {
    return (
      <g transform={`translate(0, ${zZ})`}>
        <polygon points="27,37 31,39 31,44 27,42" fill={l} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
      </g>
    );
  }
  return (
    <g transform={`translate(0, ${zZ})`}>
      <polygon points="33,39 37,37 37,42 33,44" fill={r} stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
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
const Humanoid = ({ headColor, bodyColor, legColor, hat, propLeft, propRight, scale = 0.65 }) => {
  const skin = { top: '#fef3c7', left: '#fde68a', right: '#fcd34d' };
  const hC = headColor || skin;
  const bC = bodyColor || { top: '#cbd5e1', left: '#94a3b8', right: '#64748b' };
  const lC = legColor || { left: '#334155', right: '#1e293b' };

  // 全体を少し小さくしてタイルの中心に合わせる（スケール調整）
  return (
    <svg viewBox="0 0 64 64" width={TILE_W} height={TILE_W} className="drop-shadow-sm">
      <AvatarEffects />
      <g transform={`scale(${scale}) translate(${32 * (1 - scale) / scale}, ${32 * (1 - scale) / scale})`}>
        {/* 接地シャドウ */}
        <ellipse cx="32" cy="42" rx="10" ry="5" fill="#0f172a" opacity="0.15" />

        {/* 奥側の腕 (右腕想定) */}
        <Arm color={skin} type="right" zZ={0} />
        
        {/* 脚 */}
        <Leg color={lC} type="left" zZ={0} />
        <Leg color={lC} type="right" zZ={0} />

        {/* 胴体 */}
        <Body color={bC} zZ={0} />
        
        {/* 手前の腕 (左腕想定) */}
        <Arm color={skin} type="left" zZ={0} />

        {/* 頭 */}
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
      bodyColor={{ top: '#94a3b8', left: '#64748b', right: '#475569' }}
      legColor={{ left: '#1e3a8a', right: '#1e40af' }}
      hat={
        <g transform="translate(0, 10)">
          {/* 麦わら帽子 (テクスチャ感) */}
          <polygon points="32,-2 48,6 32,14 16,6" fill="#fde047" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="32,-4 40,0 32,4 24,0" fill="#fef08a" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <line x1="24" y1="4" x2="40" y2="12" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
          <line x1="40" y1="4" x2="24" y2="12" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        </g>
      }
      propLeft={
        <g transform="translate(-10, -10)">
          <line x1="15" y1="20" x2="-5" y2="-5" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          <line x1="15" y1="20" x2="-5" y2="-5" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <polygon points="-5,-5 -12,-1 -8,-10" fill="#94a3b8" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      }
    />
  ),

  // 2. 商人 (Merchant): 頭巾、コイン袋
  Merchant: () => (
    <Humanoid
      bodyColor={{ top: '#6ee7b7', left: '#10b981', right: '#059669' }}
      legColor={{ left: '#064e3b', right: '#022c22' }}
      hat={
        <g transform="translate(0, 8)">
          <polygon points="32,-4 44,2 32,8 20,2" fill="#a7f3d0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M 28,1 L 36,5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      }
      propLeft={
        <g transform="translate(5, 5)">
          {/* コイン袋 (ぷっくりした造形) */}
          <path d="M -6,0 C -6,-8 6,-8 6,0 C 6,6 4,8 0,8 C -4,8 -6,6 -6,0 Z" fill="#fbbf24" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M -3,-4 L 3,-4" stroke="#d97706" strokeWidth="1" strokeLinecap="round" />
          <text x="-2.5" y="3" fontSize="6" fill="#78350f" style={{ fontWeight: 'black', fontFamily: 'serif' }}>¥</text>
        </g>
      }
    />
  ),

  // 3. 職人 (Craftsman): エプロン、ノコギリ
  Craftsman: () => (
    <Humanoid
      bodyColor={{ top: '#fbcfe8', left: '#f472b6', right: '#ec4899' }}
      legColor={{ left: '#475569', right: '#334155' }}
      hat={
        <g transform="translate(0, 10)">
          {/* バンダナ (結び目ディテール) */}
          <polygon points="22,6 42,6 32,1" fill="#be185d" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="38" cy="6" r="1.5" fill="#be185d" stroke="#000" strokeWidth="1" />
        </g>
      }
      propLeft={
        <g transform="translate(5, 0)">
          {/* ノコギリ (刃のギザギザを暗示) */}
          <polygon points="0,0 0,18 -6,14" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M 0,4 L -2,3 M 0,8 L -2,7 M 0,12 L -2,11" stroke="#94a3b8" strokeWidth="1" />
          <line x1="0" y1="0" x2="-6" y2="-6" stroke="#000" strokeWidth="3" strokeLinecap="round" />
          <line x1="0" y1="0" x2="-6" y2="-6" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      }
    />
  ),

  // 4. 鍛冶師 (Blacksmith): 耐熱エプロン、ゴーグル、ハンマー
  Blacksmith: () => (
    <Humanoid
      bodyColor={{ top: '#64748b', left: '#475569', right: '#334155' }}
      legColor={{ left: '#1e293b', right: '#0f172a' }}
      hat={
        <g transform="translate(0, 10)">
          {/* ゴーグル (光沢感) */}
          <polygon points="20,12 44,12 44,16 20,16" fill="#1e293b" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <rect x="25" y="12.5" width="6" height="3" rx="1" fill="#38bdf8" stroke="#000" strokeWidth="1" />
          <rect x="33" y="12.5" width="6" height="3" rx="1" fill="#38bdf8" stroke="#000" strokeWidth="1" />
          <rect x="26" y="13" width="2" height="1" fill="#fff" opacity="0.5" />
        </g>
      }
      propLeft={
        <g transform="translate(5, 0)">
          <line x1="5" y1="20" x2="-3" y2="0" stroke="#000" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="5" y1="20" x2="-3" y2="0" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="-8" y="-4" width="10" height="8" rx="1.5" fill="#475569" stroke="#000" strokeWidth="2" />
        </g>
      }
    />
  ),

  // 5. 学者 (Scholar): 学士帽、本
  Scholar: () => (
    <Humanoid
      bodyColor={{ top: '#93c5fd', left: '#3b82f6', right: '#1d4ed8' }}
      legColor={{ left: '#1e3a8a', right: '#172554' }}
      hat={
        <g transform="translate(0, 9)">
          <polygon points="32,-5 48,2 32,9 16,2" fill="#1e3a8a" stroke="#000" strokeWidth="2" strokeLinejoin="round" />
          <line x1="48" y1="2" x2="48" y2="10" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <circle cx="48" cy="11" r="1.5" fill="#fbbf24" stroke="#000" strokeWidth="1" />
        </g>
      }
      propLeft={
        <g transform="translate(0, 8)">
          {/* 開いた本 (厚みと質感) */}
          <polygon points="-10,0 0,-5 10,0 0,5" fill="#ffffff" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="-10,0 0,5 0,8 -10,3" fill="#e2e8f0" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="0,5 10,0 10,3 0,8" fill="#cbd5e1" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M -7,1 L -2,-1 M 2,-1 L 7,1" stroke="#94a3b8" strokeWidth="1" opacity="0.6" />
          <rect x="-0.5" y="-4" width="1" height="9" fill="#ef4444" opacity="0.4" />
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
          <polygon points="32,-3 40,2 32,7 24,2" fill="#fbbf24" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="32" cy="2" r="2.5" fill="#fde047" stroke="#000" strokeWidth="1" />
        </g>
      }
      propLeft={
        <g transform="translate(-3, 0)">
          <line x1="5" y1="20" x2="-8" y2="-12" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <line x1="5" y1="20" x2="-8" y2="-12" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
          <g filter="url(#eye-glow)">
            <circle cx="-8" cy="-12" r="5" fill="#fef08a" stroke="#000" strokeWidth="1.5" opacity="0.8" />
            <circle cx="-8" cy="-12" r="2" fill="#ffffff" />
          </g>
        </g>
      }
    />
  ),
};
