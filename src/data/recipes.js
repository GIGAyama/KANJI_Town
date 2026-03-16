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
//  建物アップグレードレシピ
// ══════════════════════════════════════════════════

export const UPGRADE_RECIPES = [
  // 家 → 大きな家 → 豪邸
  {
    id: "upgrade_house2",
    name: "大きな家",
    category: "upgrade",
    tier: 2,
    minGrade: 2,
    requires: "t_house1",   // アップグレード元
    ingredients: [
      { material: "plank", amount: 6 },
      { material: "brick", amount: 3 },
      { material: "glass", amount: 2 },
    ],
    result: { type: "house2", amount: 1 },
    desc: "住める人数が5人に増える",
  },
  {
    id: "upgrade_house3",
    name: "豪邸",
    category: "upgrade",
    tier: 4,
    minGrade: 4,
    requires: "t_house2",
    ingredients: [
      { material: "brick", amount: 8 },
      { material: "glass", amount: 6 },
      { material: "precision", amount: 2 },
      { material: "gold", amount: 1 },
    ],
    result: { type: "house3", amount: 1 },
    desc: "住める人数が10人に。繁栄度大幅UP",
  },
  // お店 → デパート
  {
    id: "upgrade_department",
    name: "デパート",
    category: "upgrade",
    tier: 4,
    minGrade: 4,
    requires: "t_shop",
    ingredients: [
      { material: "steel", amount: 8 },
      { material: "glass", amount: 10 },
      { material: "precision", amount: 3 },
    ],
    result: { type: "department", amount: 1 },
    desc: "商人の収集効率が2倍になる",
  },
  // 鍛冶場 → 大鍛冶場
  {
    id: "upgrade_grand_smithy",
    name: "大鍛冶場",
    category: "upgrade",
    tier: 5,
    minGrade: 5,
    requires: "t_smithy",
    ingredients: [
      { material: "steel", amount: 15 },
      { material: "firestone", amount: 8 },
      { material: "legendSteel", amount: 1 },
    ],
    result: { type: "grand_smithy", amount: 1 },
    desc: "鍛冶師の素材節約ボーナスが2倍",
  },
  // 学校 → 大学
  {
    id: "upgrade_university",
    name: "大学",
    category: "upgrade",
    tier: 6,
    minGrade: 6,
    requires: "t_school",
    ingredients: [
      { material: "brick", amount: 12 },
      { material: "glass", amount: 8 },
      { material: "wisdomBook", amount: 8 },
      { material: "legendSteel", amount: 2 },
    ],
    result: { type: "university", amount: 1 },
    desc: "学者の研究効率が2倍に。EXPボーナス+10%",
  },
];

// ══════════════════════════════════════════════════
//  メガ建築レシピ（2×2・3×3の大型建物）
// ══════════════════════════════════════════════════

export const MEGA_RECIPES = [
  // 2×2 メガ建築
  {
    id: "mega_grand_market",
    name: "大市場",
    category: "mega",
    tier: 3,
    minGrade: 3,
    size: { w: 2, h: 2 },
    ingredients: [
      { material: "plank", amount: 15 },
      { material: "glass", amount: 10 },
      { material: "steel", amount: 5 },
      { material: "fabric", amount: 3 },
    ],
    result: { type: "mega_grand_market", amount: 1 },
    desc: "2×2の巨大市場。商人のコインボーナス+50%",
    pros: 500,
  },
  {
    id: "mega_fortress",
    name: "要塞",
    category: "mega",
    tier: 4,
    minGrade: 4,
    size: { w: 2, h: 2 },
    ingredients: [
      { material: "brick", amount: 20 },
      { material: "steel", amount: 15 },
      { material: "iron", amount: 10 },
      { material: "precision", amount: 4 },
    ],
    result: { type: "mega_fortress", amount: 1 },
    desc: "2×2の堅牢な要塞。サボり衰退を50%軽減",
    pros: 800,
  },
  {
    id: "mega_academy",
    name: "学園都市",
    category: "mega",
    tier: 5,
    minGrade: 5,
    size: { w: 2, h: 2 },
    ingredients: [
      { material: "brick", amount: 15 },
      { material: "glass", amount: 12 },
      { material: "wisdomBook", amount: 10 },
      { material: "precision", amount: 5 },
    ],
    result: { type: "mega_academy", amount: 1 },
    desc: "2×2の学問の殿堂。全住民の収集効率+20%",
    pros: 1200,
  },
  // 3×3 メガ建築
  {
    id: "mega_imperial_palace",
    name: "皇居",
    category: "mega",
    tier: 6,
    minGrade: 6,
    size: { w: 3, h: 3 },
    ingredients: [
      { material: "brick", amount: 30 },
      { material: "steel", amount: 20 },
      { material: "gold", amount: 15 },
      { material: "legendSteel", amount: 8 },
      { material: "wisdomBook", amount: 5 },
      { material: "soulstone", amount: 10 },
    ],
    result: { type: "mega_imperial_palace", amount: 1 },
    desc: "3×3の最高建築。繁栄度+15000、全ボーナス適用",
    pros: 15000,
  },
  {
    id: "mega_wonder",
    name: "世界遺産",
    category: "mega",
    tier: 6,
    minGrade: 6,
    size: { w: 3, h: 3 },
    ingredients: [
      { material: "stone", amount: 40 },
      { material: "gold", amount: 20 },
      { material: "legendSteel", amount: 10 },
      { material: "soulstone", amount: 15 },
      { material: "kanjistone", amount: 20 },
    ],
    result: { type: "mega_wonder", amount: 1 },
    desc: "3×3の世界遺産。全1026字習得への道の証",
    pros: 20000,
  },
];

// ══════════════════════════════════════════════════
//  レアレシピ（特別な条件で解放）
// ══════════════════════════════════════════════════

export const RARE_RECIPES = [
  {
    id: "rare_cherry_pavilion",
    name: "桜御殿",
    category: "rare",
    tier: 3,
    minGrade: 3,
    unlockCondition: { type: "mastered_kanji", count: 50 },
    unlockDesc: "50字習得で解放",
    ingredients: [
      { material: "wood", amount: 12 },
      { material: "fabric", amount: 4 },
      { material: "kanjistone", amount: 5 },
    ],
    result: { type: "cherry_pavilion", amount: 1 },
    desc: "桜が舞い散る美しい御殿。満足度+10",
    pros: 400,
  },
  {
    id: "rare_crystal_tower",
    name: "水晶の塔",
    category: "rare",
    tier: 4,
    minGrade: 4,
    unlockCondition: { type: "mastered_kanji", count: 100 },
    unlockDesc: "100字習得で解放",
    ingredients: [
      { material: "crystal", amount: 15 },
      { material: "glass", amount: 10 },
      { material: "gold", amount: 3 },
    ],
    result: { type: "crystal_tower", amount: 1 },
    desc: "水晶が輝く神秘の塔。素材ドロップ+10%",
    pros: 600,
  },
  {
    id: "rare_philosophers_lab",
    name: "賢者の研究所",
    category: "rare",
    tier: 5,
    minGrade: 5,
    unlockCondition: { type: "mastered_kanji", count: 200 },
    unlockDesc: "200字習得で解放",
    ingredients: [
      { material: "wisdomBook", amount: 8 },
      { material: "soulstone", amount: 6 },
      { material: "precision", amount: 5 },
      { material: "gold", amount: 3 },
    ],
    result: { type: "philosophers_lab", amount: 1 },
    desc: "知恵を極めし者の研究所。学者の効率3倍",
    pros: 1500,
  },
  {
    id: "rare_dragon_shrine",
    name: "龍神殿",
    category: "rare",
    tier: 6,
    minGrade: 6,
    unlockCondition: { type: "mastered_kanji", count: 500 },
    unlockDesc: "500字習得で解放",
    ingredients: [
      { material: "legendSteel", amount: 6 },
      { material: "soulstone", amount: 12 },
      { material: "gold", amount: 10 },
      { material: "firestone", amount: 8 },
    ],
    result: { type: "dragon_shrine", amount: 1 },
    desc: "龍が宿る伝説の神殿。全収集量2倍",
    pros: 5000,
  },
  {
    id: "rare_perfect_monument",
    name: "完璧の碑",
    category: "rare",
    tier: 6,
    minGrade: 6,
    unlockCondition: { type: "perfect_count", count: 100 },
    unlockDesc: "Perfect100回で解放",
    ingredients: [
      { material: "kanjistone", amount: 20 },
      { material: "gold", amount: 8 },
      { material: "legendSteel", amount: 3 },
    ],
    result: { type: "perfect_monument", amount: 1 },
    desc: "書の道を極めし証。EXP獲得+20%",
    pros: 3000,
  },
];

// ══════════════════════════════════════════════════
//  セットボーナス定義（建物シナジー）
// ══════════════════════════════════════════════════

export const BUILDING_SETS = [
  {
    id: "set_village",
    name: "村セット",
    emoji: "🏘️",
    required: ["t_house1", "t_well", "t_fence", "t_road"],
    bonus: { prosperity: 100, satisfactionBonus: 5 },
    desc: "家・井戸・柵・道をすべて配置",
  },
  {
    id: "set_commerce",
    name: "商業地区",
    emoji: "🏪",
    required: ["t_shop", "t_warehouse", "t_market"],
    bonus: { prosperity: 300, coinMultiplier: 1.2 },
    desc: "お店・倉庫・市場をすべて配置",
  },
  {
    id: "set_culture",
    name: "文化地区",
    emoji: "⛩️",
    required: ["t_torii", "t_temple", "t_garden"],
    bonus: { prosperity: 400, satisfactionBonus: 10 },
    desc: "鳥居・お寺・庭園をすべて配置",
  },
  {
    id: "set_industry",
    name: "産業地区",
    emoji: "🏭",
    required: ["t_smithy", "t_factory", "t_mine"],
    bonus: { prosperity: 500, materialMultiplier: 1.3 },
    desc: "鍛冶場・工場・鉱山をすべて配置",
  },
  {
    id: "set_education",
    name: "教育都市",
    emoji: "🎓",
    required: ["t_school", "t_library", "t_townhall"],
    bonus: { prosperity: 600, expMultiplier: 1.1 },
    desc: "学校・図書館・役所をすべて配置",
  },
  {
    id: "set_legend",
    name: "伝説都市",
    emoji: "👑",
    required: ["t_castle", "t_golden_tower", "t_guardian_shrine", "t_monument"],
    bonus: { prosperity: 2000, satisfactionBonus: 20, allMultiplier: 1.2 },
    desc: "全伝説建築をすべて配置",
  },
];

// セットボーナスの達成判定
export function getActiveSets(townMap) {
  const placedItems = new Set(Object.values(townMap || {}));
  return BUILDING_SETS.filter(set => set.required.every(id => placedItems.has(id)));
}

// ══════════════════════════════════════════════════
//  統合エクスポート
// ══════════════════════════════════════════════════

export const ALL_RECIPES = [...MATERIAL_RECIPES, ...BUILDING_RECIPES];
export const ALL_EXTENDED_RECIPES = [...ALL_RECIPES, ...UPGRADE_RECIPES, ...MEGA_RECIPES, ...RARE_RECIPES];

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
  return ALL_EXTENDED_RECIPES.find((r) => r.id === id) || null;
}
