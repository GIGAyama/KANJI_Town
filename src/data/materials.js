// 素材定義 — マイ漢字タウン
// 基本素材（漢字習得で直接入手 + 住民が自動収集）と加工素材（クラフトで作成）

export const MATERIALS = {
  // ── 基本素材（Tier 1）──────────────────────────
  wood: { id: "wood", name: "木材", icon: "🪵", color: "#8B4513", tier: 1 },
  stone: { id: "stone", name: "石材", icon: "🪨", color: "#808080", tier: 1 },
  iron: { id: "iron", name: "鉄", icon: "⚙️", color: "#4A4A4A", tier: 1 },
  crystal: { id: "crystal", name: "水晶", icon: "💎", color: "#87CEEB", tier: 1 },
  firestone: { id: "firestone", name: "炎石", icon: "🔥", color: "#FF4500", tier: 1 },
  gold: { id: "gold", name: "金", icon: "✨", color: "#FFD700", tier: 1 },
  soulstone: { id: "soulstone", name: "魂石", icon: "💜", color: "#9370DB", tier: 1 },
  kanjistone: { id: "kanjistone", name: "漢石", icon: "📜", color: "#DEB887", tier: 1 },

  // ── 加工素材（Tier 2 — クラフトで作成）─────────────
  plank: { id: "plank", name: "板材", icon: "🪵", color: "#DEB887", tier: 2, crafted: true },
  brick: { id: "brick", name: "レンガ", icon: "🧱", color: "#B22222", tier: 2, crafted: true },
  steel: { id: "steel", name: "鋼", icon: "⚔️", color: "#708090", tier: 2, crafted: true },
  glass: { id: "glass", name: "ガラス", icon: "🔲", color: "#E0FFFF", tier: 2, crafted: true },
  fabric: { id: "fabric", name: "織物", icon: "🧵", color: "#FF69B4", tier: 2, crafted: true, minGrade: 3 },
  precision: { id: "precision", name: "精密部品", icon: "🔩", color: "#C0C0C0", tier: 2, crafted: true, minGrade: 4 },
  wisdomBook: { id: "wisdomBook", name: "知恵の書", icon: "📖", color: "#4169E1", tier: 2, crafted: true, minGrade: 5 },
  legendSteel: { id: "legendSteel", name: "伝説の鋼", icon: "⚡", color: "#FFD700", tier: 2, crafted: true, minGrade: 6 },
};

// 基本素材のみ（漢字ドロップ・住民収集用）
export const BASE_MATERIALS = Object.fromEntries(
  Object.entries(MATERIALS).filter(([, m]) => m.tier === 1)
);

// 加工素材のみ（クラフトで作成）
export const PROCESSED_MATERIALS = Object.fromEntries(
  Object.entries(MATERIALS).filter(([, m]) => m.tier === 2)
);
