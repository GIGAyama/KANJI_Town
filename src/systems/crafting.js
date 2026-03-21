// 素材クラフトシステム — マイ漢字タウン
// Phase 4: マイクラ方式の素材クラフト

import { BASE_MATERIALS } from '../data/materials';
import { getCraftBonuses, CRAFT_BONUSES } from '../data/residents';

/**
 * Check if player has enough materials for a recipe
 * @param {Object} materials - Player's material inventory {wood: 5, stone: 3, ...}
 * @param {Array} ingredients - Recipe ingredients [{material: "wood", amount: 3}, ...]
 * @param {number} [coinCost=0] - Coin cost for the recipe
 * @param {number} [playerCoins=0] - Player's current coins
 * @returns {boolean}
 */
export function canCraft(materials, ingredients, coinCost = 0, playerCoins = 0, quantity = 1) {
  if (!materials || !ingredients || !Array.isArray(ingredients)) return false;
  if (coinCost * quantity > 0 && playerCoins < coinCost * quantity) return false;
  return ingredients.every(
    (ing) => (materials[ing.material] || 0) >= ing.amount * quantity
  );
}

/**
 * Apply occupation discount to ingredients
 * @param {Array} ingredients - Original ingredients
 * @param {Object} recipe - Recipe object
 * @param {Array} villagers - Player's villagers
 * @returns {{ discountedIngredients: Array, appliedDiscount: number, coinBonus: number }}
 */
export function applyOccupationDiscount(ingredients, recipe, villagers) {
  if (!villagers || villagers.length === 0) {
    return { discountedIngredients: ingredients, appliedDiscount: 0, coinBonus: 0 };
  }
  const bonuses = getCraftBonuses(villagers);
  let bestDiscount = 0;
  let coinBonus = 0;
  const category = recipe.category || 'building';

  for (const b of bonuses) {
    if (b.categories.includes(category)) {
      if (b.tierRange) {
        const tier = recipe.tier || 1;
        if (tier < b.tierRange[0] || tier > b.tierRange[1]) continue;
      }
      if (b.effectiveDiscount > bestDiscount) bestDiscount = b.effectiveDiscount;
      if (b.coinBonus) coinBonus += b.coinBonus * b.count;
    }
  }

  if (bestDiscount <= 0) return { discountedIngredients: ingredients, appliedDiscount: 0, coinBonus };

  const discountedIngredients = ingredients.map(ing => ({
    ...ing,
    amount: Math.max(1, Math.round(ing.amount * (1 - bestDiscount))),
  }));
  return { discountedIngredients, appliedDiscount: bestDiscount, coinBonus };
}

/**
 * Check if bonus yield triggers (random chance)
 * @param {Object} recipe - Recipe object
 * @param {Array} villagers - Player's villagers
 * @returns {boolean}
 */
export function checkBonusYield(recipe, villagers) {
  if (!villagers || villagers.length === 0) return false;
  const bonuses = getCraftBonuses(villagers);
  const category = recipe.category || 'building';
  let bestYield = 0;
  for (const b of bonuses) {
    if (b.categories.includes(category) && b.effectiveBonusYield > bestYield) {
      bestYield = b.effectiveBonusYield;
    }
  }
  return bestYield > 0 && Math.random() < bestYield;
}

/**
 * Execute a craft - deduct materials and return result
 * @param {Object} materials - Player's material inventory (will be modified)
 * @param {Object} recipe - Recipe object with { id, ingredients, result, ... }
 * @param {Array} [villagers] - Optional villagers for occupation bonuses
 * @param {number} [playerCoins=0] - Player's current coins (for coin cost check)
 * @returns {{ success: boolean, materials: Object, result: Object, bonusYield: boolean, discount: number, coinBonus: number, coinCost: number }}
 */
export function craft(materials, recipe, villagers, playerCoins = 0, quantity = 1) {
  if (!recipe || !recipe.ingredients) {
    return { success: false, materials, result: null, bonusYield: false, discount: 0, coinBonus: 0, coinCost: 0 };
  }

  const coinCost = recipe.coinCost || 0;
  const { discountedIngredients, appliedDiscount, coinBonus } = applyOccupationDiscount(recipe.ingredients, recipe, villagers);

  if (!canCraft(materials, discountedIngredients, coinCost, playerCoins, quantity)) {
    return { success: false, materials, result: null, bonusYield: false, discount: 0, coinBonus: 0, coinCost: 0 };
  }

  // Deduct discounted ingredients
  for (const ing of discountedIngredients) {
    materials[ing.material] = (materials[ing.material] || 0) - ing.amount * quantity;
  }

  // Calculate bonus yield for each item in the batch
  let bonusYieldCount = 0;
  for (let i = 0; i < quantity; i++) {
    if (checkBonusYield(recipe, villagers)) bonusYieldCount++;
  }

  // Total amount = base * quantity + bonuses
  const totalAmount = recipe.result.amount * quantity + (bonusYieldCount * recipe.result.amount);

  return { 
    success: true, 
    materials, 
    result: { ...recipe.result, amount: totalAmount }, 
    bonusYield: bonusYieldCount > 0, 
    bonusYieldCount,
    discount: appliedDiscount, 
    coinBonus: coinBonus * quantity, 
    coinCost: coinCost * quantity,
    quantity
  };
}

/**
 * Calculate material drops for mastering a kanji.
 *
 * If the kanji object already contains a `materialDrops` array (as defined in
 * the grade JSON files), that is used directly. Otherwise a deterministic
 * fallback is generated based on the kanji's stroke count and grade so that
 * every kanji yields *something*.
 *
 * @param {Object} kanji - Kanji object from KANJI_DATA
 * @returns {Object} materials gained {wood: 2, stone: 1, ...}
 */
export function calculateMaterialDrops(kanji) {
  if (!kanji) return {};

  // If the kanji data already specifies drops, aggregate them into an object
  if (kanji.materialDrops && Array.isArray(kanji.materialDrops)) {
    const drops = {};
    for (const drop of kanji.materialDrops) {
      drops[drop.type] = (drops[drop.type] || 0) + drop.amount;
    }
    return drops;
  }

  // Deterministic fallback based on stroke count and character code
  const baseKeys = Object.keys(BASE_MATERIALS);
  const strokes = kanji.strokes || kanji.strokeCount || 1;
  const charCode = kanji.char ? kanji.char.charCodeAt(0) : 0;

  const drops = {};

  // Primary material — determined by character code for even distribution
  const primaryIdx = charCode % baseKeys.length;
  const primaryMaterial = baseKeys[primaryIdx];
  drops[primaryMaterial] = Math.max(1, Math.floor(strokes / 3) + 1);

  // Secondary material — offset by half the palette
  const secondaryIdx = (charCode + Math.floor(baseKeys.length / 2)) % baseKeys.length;
  const secondaryMaterial = baseKeys[secondaryIdx];
  if (secondaryMaterial !== primaryMaterial) {
    drops[secondaryMaterial] = Math.max(1, Math.floor(strokes / 5) + 1);
  }

  // Every kanji also drops a small amount of kanjistone
  drops.kanjistone = (drops.kanjistone || 0) + 1;

  return drops;
}

// レシピ結果 → まちアイテムID変換マップ
// 建物レシピの result.type を TOWN_ITEMS の id に変換する
const RESULT_TO_TOWN_ITEM = {
  small_house: 't_house1',
  fence: 't_fence',
  road: 't_road',
  well: 't_well',
  shop: 't_shop',
  warehouse: 't_warehouse',
  market: 't_market',
  port: 't_port',
  torii: 't_torii',
  temple: 't_temple',
  garden: 't_garden',
  bridge: 't_bridge',
  smithy: 't_smithy',
  factory: 't_factory',
  watermill: 't_watermill',
  mine: 't_mine',
  school: 't_school',
  library: 't_library',
  townhall: 't_townhall',
  embassy: 't_embassy',
  castle: 't_castle',
  golden_tower: 't_golden_tower',
  guardian_shrine: 't_guardian_shrine',
  monument: 't_monument',
  // アップグレード建物
  house2: 't_house2',
  house3: 't_house3',
  department: 't_department',
  grand_smithy: 't_grand_smithy',
  university: 't_university',
  // メガ建築
  mega_grand_market: 't_mega_grand_market',
  mega_fortress: 't_mega_fortress',
  mega_academy: 't_mega_academy',
  mega_imperial_palace: 't_mega_imperial_palace',
  mega_wonder: 't_mega_wonder',
  // レア建物
  cherry_pavilion: 't_cherry_pavilion',
  crystal_tower: 't_crystal_tower',
  philosophers_lab: 't_philosophers_lab',
  dragon_shrine: 't_dragon_shrine',
  perfect_monument: 't_perfect_monument',
  bamboo_grove: 't_bamboo_grove',
  hot_spring: 't_hot_spring',
  observatory: 't_observatory',
  // アップグレード建物（追加）
  grand_warehouse: 't_grand_warehouse',
  shopping_street: 't_shopping_street',
  zen_garden: 't_zen_garden',
  national_library: 't_national_library',
  // メガ建築（追加）
  mega_harbor_town: 't_mega_harbor_town',
  mega_shrine_complex: 't_mega_shrine_complex',
  // 装飾アイテム
  stone_lantern: 't_stone_lantern',
  fountain: 't_fountain',
  statue: 't_statue',
  windmill: 't_windmill',
  bell_tower: 't_bell_tower',
  pond: 't_pond',
  cherry_road: 't_cherry_road',
  clock_tower: 't_clock_tower',
  gold_statue: 't_gold_statue',
  festival_stage: 't_festival_stage',
  // 新規オブジェクト
  grass_flat: 't_grass_flat',
  brick: 't_brick',
  asphalt: 't_asphalt',
  magma: 't_magma',
  crosswalk: 't_crosswalk',
  railway: 't_railway',
  dirt: 't_dirt',
  cafe: 't_cafe',
  bakery: 't_bakery',
  burger_shop: 't_burger_shop',
  family_restaurant: 't_family_restaurant',
  convenience_store: 't_convenience_store',
  flower_shop: 't_flower_shop',
  cinema: 't_cinema',
  hotel: 't_hotel',
  hospital: 't_hospital',
  fire_station: 't_fire_station',
  police_box: 't_police_box',
  post_office: 't_post_office',
  station: 't_station',
  airport: 't_airport',
  office_building: 't_office_building',
  tower_apartment: 't_tower_apartment',
  tv_tower: 't_tv_tower',
  stadium: 't_stadium',
  park: 't_park',
  playground: 't_playground',
  pool: 't_pool',
  ferris_wheel: 't_ferris_wheel',
  amusement_park: 't_amusement_park',
  car: 't_car',
  bus: 't_bus',
  bicycle: 't_bicycle',
  ship_vehicle: 't_ship_vehicle',
  airplane: 't_airplane',
  fire_truck: 't_fire_truck',
  bench: 't_bench',
  mailbox: 't_mailbox',
  phone_booth: 't_phone_booth',
  street_light: 't_street_light',
  bus_stop: 't_bus_stop',
  vending_machine: 't_vending_machine',
  trash_can: 't_trash_can',
};

export function getResultTownItemId(resultType) {
  return RESULT_TO_TOWN_ITEM[resultType] || null;
}
