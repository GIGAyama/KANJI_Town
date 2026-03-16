// 素材クラフトシステム — マイ漢字タウン
// Phase 4: マイクラ方式の素材クラフト

import { BASE_MATERIALS } from '../data/materials';

/**
 * Check if player has enough materials for a recipe
 * @param {Object} materials - Player's material inventory {wood: 5, stone: 3, ...}
 * @param {Array} ingredients - Recipe ingredients [{material: "wood", amount: 3}, ...]
 * @returns {boolean}
 */
export function canCraft(materials, ingredients) {
  if (!materials || !ingredients || !Array.isArray(ingredients)) return false;
  return ingredients.every(
    (ing) => (materials[ing.material] || 0) >= ing.amount
  );
}

/**
 * Execute a craft - deduct materials and return result
 * @param {Object} materials - Player's material inventory (will be modified)
 * @param {Object} recipe - Recipe object with { id, ingredients, result, ... }
 * @returns {{ success: boolean, materials: Object, result: string }}
 */
export function craft(materials, recipe) {
  if (!recipe || !recipe.ingredients) {
    return { success: false, materials, result: null };
  }

  if (!canCraft(materials, recipe.ingredients)) {
    return { success: false, materials, result: null };
  }

  // Deduct ingredients
  for (const ing of recipe.ingredients) {
    materials[ing.material] = (materials[ing.material] || 0) - ing.amount;
  }

  return { success: true, materials, result: recipe.result };
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

/**
 * Get available recipes for a given grade level.
 *
 * A recipe is available if its `minGrade` (or `tier`) is <= the current grade.
 * Recipes without a `minGrade` default to grade 1.
 *
 * @param {number} grade - Current grade (1-6)
 * @param {Array} allRecipes - All recipe definitions
 * @returns {Array} recipes available at this grade
 */
export function getAvailableRecipes(grade, allRecipes) {
  if (!allRecipes || !Array.isArray(allRecipes)) return [];
  return allRecipes.filter((recipe) => {
    const requiredGrade = recipe.minGrade || recipe.tier || 1;
    return requiredGrade <= grade;
  });
}

/**
 * Check which recipes can be crafted with current materials.
 *
 * Returns a new array where each recipe object is augmented with a boolean
 * `craftable` flag indicating whether the player has sufficient materials.
 *
 * @param {Object} materials - Player's material inventory
 * @param {Array} recipes - Available recipes
 * @returns {Array} recipes with craftable flag
 */
export function getCraftableRecipes(materials, recipes) {
  if (!recipes || !Array.isArray(recipes)) return [];
  return recipes.map((recipe) => ({
    ...recipe,
    craftable: canCraft(materials, recipe.ingredients),
  }));
}
