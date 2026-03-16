// ==========================================
// 住民職業定義 — マイ漢字タウン Phase 3
// 学年別6段階の職業システム
// ==========================================

// ── 職業定義（学年別 Tier 1〜6）──────────────────
export const OCCUPATIONS = [
  {
    id: "farmer",
    name: "農民",
    emoji: "🌾",
    tier: 1,
    minGrade: 1,
    desc: "木材や石材を集めてくれる働き者",
    collectibles: [
      { material: "wood", baseAmount: 2 },
      { material: "stone", baseAmount: 1 },
    ],
    coinBonus: 0,
  },
  {
    id: "merchant",
    name: "商人",
    emoji: "🏪",
    tier: 2,
    minGrade: 2,
    desc: "鉄や水晶を仕入れ、コインも稼いでくれる",
    collectibles: [
      { material: "iron", baseAmount: 1 },
      { material: "crystal", baseAmount: 1 },
    ],
    coinBonus: 10,
  },
  {
    id: "craftsman",
    name: "職人",
    emoji: "🔨",
    tier: 3,
    minGrade: 3,
    desc: "炎石や漢石など特殊素材を見つけてくれる",
    collectibles: [
      { material: "firestone", baseAmount: 1 },
      { material: "kanjistone", baseAmount: 2 },
    ],
    coinBonus: 5,
  },
  {
    id: "blacksmith",
    name: "鍛冶師",
    emoji: "⚒️",
    tier: 4,
    minGrade: 4,
    desc: "鉄と金を精錬する産業のかなめ",
    collectibles: [
      { material: "iron", baseAmount: 2 },
      { material: "gold", baseAmount: 1 },
    ],
    coinBonus: 8,
  },
  {
    id: "scholar",
    name: "学者",
    emoji: "📚",
    tier: 5,
    minGrade: 5,
    desc: "魂石と漢石を研究で生み出す知識人",
    collectibles: [
      { material: "soulstone", baseAmount: 1 },
      { material: "kanjistone", baseAmount: 2 },
    ],
    coinBonus: 12,
  },
  {
    id: "legendary",
    name: "伝説職人",
    emoji: "⚡",
    tier: 6,
    minGrade: 6,
    desc: "すべての希少素材を集められる伝説の存在",
    collectibles: [
      { material: "gold", baseAmount: 1 },
      { material: "soulstone", baseAmount: 1 },
      { material: "crystal", baseAmount: 1 },
      { material: "firestone", baseAmount: 1 },
    ],
    coinBonus: 20,
  },
];

// IDで職業を取得
export function getOccupation(occupationId) {
  return OCCUPATIONS.find(o => o.id === occupationId) || OCCUPATIONS[0];
}

// 学年に基づいて利用可能な最高職業を取得
export function getMaxOccupationForGrade(grade) {
  const available = OCCUPATIONS.filter(o => o.minGrade <= grade);
  return available[available.length - 1] || OCCUPATIONS[0];
}

// 住民に職業を割り当てる（漢字の学年に基づく）
export function assignOccupation(kanjiGrade) {
  const occ = OCCUPATIONS.find(o => o.minGrade === kanjiGrade);
  return occ ? occ.id : "farmer";
}
