// クラフトレシピ定義 — マイ漢字タウン
// 加工素材レシピ + 建物レシピ（学年ティア付き）

// ══════════════════════════════════════════════════
//  加工素材レシピ
// ══════════════════════════════════════════════════

export const MATERIAL_RECIPES = [
  {
    id: "recipe_plank",
    name: "板材",
    category: "material",
    tier: 1,
    minGrade: 1,
    ingredients: [{ material: "wood", amount: 3 }],
    result: { type: "plank", amount: 1 },
  },
  {
    id: "recipe_brick",
    name: "レンガ",
    category: "material",
    tier: 1,
    minGrade: 1,
    ingredients: [
      { material: "stone", amount: 2 },
      { material: "firestone", amount: 1 },
    ],
    result: { type: "brick", amount: 1 },
  },
  {
    id: "recipe_steel",
    name: "鋼",
    category: "material",
    tier: 1,
    minGrade: 1,
    ingredients: [
      { material: "iron", amount: 2 },
      { material: "firestone", amount: 1 },
    ],
    result: { type: "steel", amount: 1 },
  },
  {
    id: "recipe_glass",
    name: "ガラス",
    category: "material",
    tier: 1,
    minGrade: 1,
    ingredients: [
      { material: "crystal", amount: 2 },
      { material: "firestone", amount: 1 },
    ],
    result: { type: "glass", amount: 1 },
  },
  {
    id: "recipe_fabric",
    name: "織物",
    category: "material",
    tier: 3,
    minGrade: 3,
    ingredients: [
      { material: "kanjistone", amount: 3 },
      { material: "soulstone", amount: 1 },
    ],
    result: { type: "fabric", amount: 1 },
  },
  {
    id: "recipe_precision",
    name: "精密部品",
    category: "material",
    tier: 4,
    minGrade: 4,
    ingredients: [
      { material: "steel", amount: 2 },
      { material: "crystal", amount: 1 },
    ],
    result: { type: "precision", amount: 1 },
  },
  {
    id: "recipe_wisdomBook",
    name: "知恵の書",
    category: "material",
    tier: 5,
    minGrade: 5,
    ingredients: [
      { material: "soulstone", amount: 3 },
      { material: "kanjistone", amount: 2 },
    ],
    result: { type: "wisdomBook", amount: 1 },
  },
  {
    id: "recipe_legendSteel",
    name: "伝説の鋼",
    category: "material",
    tier: 6,
    minGrade: 6,
    ingredients: [
      { material: "gold", amount: 2 },
      { material: "steel", amount: 3 },
      { material: "soulstone", amount: 1 },
    ],
    result: { type: "legendSteel", amount: 1 },
  },
];

// ══════════════════════════════════════════════════
//  建物レシピ
// ══════════════════════════════════════════════════

export const BUILDING_RECIPES = [
  // ── Tier 1（1年〜）: 基礎建築 ─────────────────
  {
    id: "build_small_house",
    name: "小さな家",
    category: "building",
    tier: 1,
    minGrade: 1,
    ingredients: [
      { material: "plank", amount: 4 },
      { material: "stone", amount: 2 },
    ],
    result: { type: "small_house", amount: 1 },
  },
  {
    id: "build_fence",
    name: "柵",
    category: "building",
    tier: 1,
    minGrade: 1,
    ingredients: [{ material: "wood", amount: 4 }],
    result: { type: "fence", amount: 1 },
  },
  {
    id: "build_road",
    name: "道",
    category: "building",
    tier: 1,
    minGrade: 1,
    ingredients: [{ material: "stone", amount: 3 }],
    result: { type: "road", amount: 1 },
  },
  {
    id: "build_well",
    name: "井戸",
    category: "building",
    tier: 1,
    minGrade: 1,
    ingredients: [
      { material: "stone", amount: 5 },
      { material: "crystal", amount: 2 },
    ],
    result: { type: "well", amount: 1 },
  },

  // ── Tier 2（2年〜）: 商業施設 ─────────────────
  {
    id: "build_shop",
    name: "お店",
    category: "building",
    tier: 2,
    minGrade: 2,
    ingredients: [
      { material: "plank", amount: 3 },
      { material: "glass", amount: 2 },
      { material: "steel", amount: 1 },
    ],
    result: { type: "shop", amount: 1 },
  },
  {
    id: "build_warehouse",
    name: "倉庫",
    category: "building",
    tier: 2,
    minGrade: 2,
    ingredients: [
      { material: "plank", amount: 6 },
      { material: "iron", amount: 3 },
    ],
    result: { type: "warehouse", amount: 1 },
  },
  {
    id: "build_market",
    name: "市場",
    category: "building",
    tier: 2,
    minGrade: 2,
    ingredients: [
      { material: "plank", amount: 5 },
      { material: "glass", amount: 4 },
      { material: "kanjistone", amount: 3 },
    ],
    result: { type: "market", amount: 1 },
  },
  {
    id: "build_port",
    name: "港",
    category: "building",
    tier: 2,
    minGrade: 2,
    ingredients: [
      { material: "wood", amount: 10 },
      { material: "iron", amount: 5 },
      { material: "crystal", amount: 3 },
    ],
    result: { type: "port", amount: 1 },
  },

  // ── Tier 3（3年〜）: 文化施設 ─────────────────
  {
    id: "build_torii",
    name: "鳥居",
    category: "building",
    tier: 3,
    minGrade: 3,
    ingredients: [
      { material: "wood", amount: 8 },
      { material: "firestone", amount: 2 },
    ],
    result: { type: "torii", amount: 1 },
  },
  {
    id: "build_temple",
    name: "お寺",
    category: "building",
    tier: 3,
    minGrade: 3,
    ingredients: [
      { material: "brick", amount: 6 },
      { material: "plank", amount: 4 },
      { material: "fabric", amount: 2 },
    ],
    result: { type: "temple", amount: 1 },
  },
  {
    id: "build_garden",
    name: "庭園",
    category: "building",
    tier: 3,
    minGrade: 3,
    ingredients: [
      { material: "wood", amount: 5 },
      { material: "crystal", amount: 3 },
      { material: "stone", amount: 5 },
    ],
    result: { type: "garden", amount: 1 },
  },
  {
    id: "build_bridge",
    name: "橋",
    category: "building",
    tier: 3,
    minGrade: 3,
    ingredients: [
      { material: "steel", amount: 4 },
      { material: "stone", amount: 6 },
    ],
    result: { type: "bridge", amount: 1 },
  },

  // ── Tier 4（4年〜）: 産業施設 ─────────────────
  {
    id: "build_smithy",
    name: "鍛冶場",
    category: "building",
    tier: 4,
    minGrade: 4,
    ingredients: [
      { material: "brick", amount: 8 },
      { material: "steel", amount: 6 },
      { material: "firestone", amount: 4 },
    ],
    result: { type: "smithy", amount: 1 },
  },
  {
    id: "build_factory",
    name: "工場",
    category: "building",
    tier: 4,
    minGrade: 4,
    ingredients: [
      { material: "steel", amount: 10 },
      { material: "glass", amount: 4 },
      { material: "precision", amount: 2 },
    ],
    result: { type: "factory", amount: 1 },
  },
  {
    id: "build_watermill",
    name: "水車小屋",
    category: "building",
    tier: 4,
    minGrade: 4,
    ingredients: [
      { material: "wood", amount: 8 },
      { material: "iron", amount: 4 },
      { material: "crystal", amount: 2 },
    ],
    result: { type: "watermill", amount: 1 },
  },
  {
    id: "build_mine",
    name: "鉱山",
    category: "building",
    tier: 4,
    minGrade: 4,
    ingredients: [
      { material: "stone", amount: 12 },
      { material: "steel", amount: 4 },
      { material: "firestone", amount: 3 },
    ],
    result: { type: "mine", amount: 1 },
  },

  // ── Tier 5（5年〜）: 公共施設 ─────────────────
  {
    id: "build_school",
    name: "学校",
    category: "building",
    tier: 5,
    minGrade: 5,
    ingredients: [
      { material: "brick", amount: 5 },
      { material: "glass", amount: 3 },
      { material: "wisdomBook", amount: 2 },
    ],
    result: { type: "school", amount: 1 },
  },
  {
    id: "build_library",
    name: "図書館",
    category: "building",
    tier: 5,
    minGrade: 5,
    ingredients: [
      { material: "plank", amount: 8 },
      { material: "glass", amount: 6 },
      { material: "wisdomBook", amount: 4 },
    ],
    result: { type: "library", amount: 1 },
  },
  {
    id: "build_townhall",
    name: "役所",
    category: "building",
    tier: 5,
    minGrade: 5,
    ingredients: [
      { material: "brick", amount: 8 },
      { material: "steel", amount: 4 },
      { material: "wisdomBook", amount: 3 },
    ],
    result: { type: "townhall", amount: 1 },
  },
  {
    id: "build_embassy",
    name: "大使館",
    category: "building",
    tier: 5,
    minGrade: 5,
    ingredients: [
      { material: "glass", amount: 8 },
      { material: "gold", amount: 2 },
      { material: "wisdomBook", amount: 5 },
    ],
    result: { type: "embassy", amount: 1 },
  },

  // ── Tier 6（6年〜）: 伝説建築 ─────────────────
  {
    id: "build_castle",
    name: "お城",
    category: "building",
    tier: 6,
    minGrade: 6,
    ingredients: [
      { material: "brick", amount: 15 },
      { material: "steel", amount: 10 },
      { material: "gold", amount: 5 },
      { material: "legendSteel", amount: 2 },
    ],
    result: { type: "castle", amount: 1 },
  },
  {
    id: "build_golden_tower",
    name: "黄金の塔",
    category: "building",
    tier: 6,
    minGrade: 6,
    ingredients: [
      { material: "gold", amount: 20 },
      { material: "legendSteel", amount: 5 },
      { material: "soulstone", amount: 10 },
    ],
    result: { type: "golden_tower", amount: 1 },
  },
  {
    id: "build_guardian_shrine",
    name: "守り神の祠",
    category: "building",
    tier: 6,
    minGrade: 6,
    ingredients: [
      { material: "legendSteel", amount: 3 },
      { material: "soulstone", amount: 8 },
      { material: "kanjistone", amount: 10 },
    ],
    result: { type: "guardian_shrine", amount: 1 },
  },
  {
    id: "build_monument",
    name: "記念碑",
    category: "building",
    tier: 6,
    minGrade: 6,
    ingredients: [
      { material: "stone", amount: 20 },
      { material: "gold", amount: 10 },
      { material: "wisdomBook", amount: 5 },
    ],
    result: { type: "monument", amount: 1 },
  },
];

// ══════════════════════════════════════════════════
//  統合エクスポート
// ══════════════════════════════════════════════════

export const ALL_RECIPES = [...MATERIAL_RECIPES, ...BUILDING_RECIPES];

// ティアごとのレシピ取得ヘルパー
export function getRecipesByTier(tier) {
  return ALL_RECIPES.filter((r) => r.tier === tier);
}

// 学年で利用可能なレシピ取得ヘルパー
export function getAvailableRecipes(grade) {
  return ALL_RECIPES.filter((r) => r.minGrade <= grade);
}

// IDでレシピ検索ヘルパー
export function getRecipeById(id) {
  return ALL_RECIPES.find((r) => r.id === id) || null;
}
