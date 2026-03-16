// ==========================================
// バイオーム定義 — Phase 2: マップ拡張
// 50×50マップを6バイオーム + 中央に分割
// ==========================================

/**
 * Biome layout on a 50×50 map (center at 25,25):
 *
 *    NW: forest  |  NE: coast
 *    W:  mountain |  E:  plains
 *    SW: hills   |  SE: volcano
 *    Center: town core (all grades)
 */

export const BIOME_TYPES = {
  center:   { id: 'center',   name: '街の中心',       emoji: '🏘️', grade: 0, color: '#d4a96a', desc: '全学年共通の拠点エリア' },
  forest:   { id: 'forest',   name: '森林バイオーム', emoji: '🌲', grade: 1, color: '#166534', desc: '1年生・基礎建築の地' },
  coast:    { id: 'coast',    name: '海岸バイオーム', emoji: '🏖️', grade: 2, color: '#0ea5e9', desc: '2年生・商業港の地' },
  mountain: { id: 'mountain', name: '山岳バイオーム', emoji: '⛰️', grade: 3, color: '#78716c', desc: '3年生・文化と神社仏閣の地' },
  plains:   { id: 'plains',   name: '平野バイオーム', emoji: '🌾', grade: 4, color: '#84cc16', desc: '4年生・産業と農業の地' },
  hills:    { id: 'hills',    name: '丘陵バイオーム', emoji: '🏔️', grade: 5, color: '#a16207', desc: '5年生・政治と学術の地' },
  volcano:  { id: 'volcano',  name: '火山バイオーム', emoji: '🌋', grade: 6, color: '#dc2626', desc: '6年生・伝説建築の地' },
};

/**
 * Determine biome for a given (x, y) on a 50×50 grid.
 * Center = 25,25. Uses angle + distance to assign biome.
 */
export function getBiomeAt(x, y) {
  const C = 25;
  const dx = x - C;
  const dy = y - C;
  const dist = Math.max(Math.abs(dx), Math.abs(dy)); // Chebyshev distance

  // Center zone: radius <= 5
  if (dist <= 5) return 'center';

  // Use angle to determine biome sector
  const angle = Math.atan2(dy, dx); // -PI to PI
  const deg = ((angle * 180 / Math.PI) + 360) % 360; // 0-360

  // Sector assignments (60 degrees each):
  //   0-60:   NE (coast)   → grade 2
  //   60-120: E  (plains)  → grade 4
  //   120-180: SE (volcano) → grade 6
  //   180-240: SW (hills)   → grade 5
  //   240-300: W  (mountain)→ grade 3
  //   300-360: NW (forest)  → grade 1
  if (deg < 60)  return 'coast';
  if (deg < 120) return 'plains';
  if (deg < 180) return 'volcano';
  if (deg < 240) return 'hills';
  if (deg < 300) return 'mountain';
  return 'forest';
}

/**
 * Get the terrain base tile for a given position based on biome and distance.
 * Returns one of the terrain tile IDs.
 */
export function getTerrainForBiome(x, y, biome) {
  const C = 25;
  const dist = Math.max(Math.abs(x - C), Math.abs(y - C));

  // Seeded pseudo-random for consistent terrain generation
  const seed = (x * 7919 + y * 104729) % 1000;
  const rand = seed / 1000;

  // Center zone - cleared / grassland mix
  if (biome === 'center') {
    if (dist <= 2) return 't_cleared';
    if (dist <= 4) return rand < 0.6 ? 't_cleared' : 't_grassland';
    return rand < 0.3 ? 't_cleared' : 't_grassland';
  }

  // Edge of map → bedrock border
  if (x <= 0 || y <= 0 || x >= 49 || y >= 49) return 't_bedrock';

  // Outer ring → more bedrock/roughland
  if (dist >= 23) return rand < 0.4 ? 't_bedrock' : 't_roughland';
  if (dist >= 20) return rand < 0.2 ? 't_bedrock' : 't_roughland';

  // Biome-specific terrain distribution
  switch (biome) {
    case 'forest':
      if (rand < 0.35) return 't_forest_floor';
      if (rand < 0.65) return 't_grassland';
      if (rand < 0.80) return 't_roughland';
      return 't_cleared';

    case 'coast':
      if (rand < 0.25) return 't_sand';
      if (rand < 0.45) return 't_shallow_water';
      if (rand < 0.65) return 't_grassland';
      if (rand < 0.80) return 't_roughland';
      return 't_cleared';

    case 'mountain':
      if (rand < 0.30) return 't_highland';
      if (rand < 0.55) return 't_roughland';
      if (rand < 0.70) return 't_grassland';
      return 't_cleared';

    case 'plains':
      if (rand < 0.45) return 't_grassland';
      if (rand < 0.65) return 't_cleared';
      if (rand < 0.80) return 't_roughland';
      return 't_forest_floor';

    case 'hills':
      if (rand < 0.30) return 't_highland';
      if (rand < 0.55) return 't_grassland';
      if (rand < 0.75) return 't_roughland';
      return 't_cleared';

    case 'volcano':
      if (rand < 0.35) return 't_roughland';
      if (rand < 0.55) return 't_highland';
      if (rand < 0.70) return 't_grassland';
      return 't_cleared';

    default:
      return 't_roughland';
  }
}

/**
 * Biome-specific background color for terrain tiles.
 * Each biome tints the base terrain slightly different.
 */
export const BIOME_TERRAIN_COLORS = {
  center:   { cleared: '#d4a96a', grassland: '#86efac', roughland: '#92400e' },
  forest:   { cleared: '#c4a05a', grassland: '#4ade80', roughland: '#713f12', forest_floor: '#14532d' },
  coast:    { cleared: '#e8d5a0', grassland: '#86efac', roughland: '#92400e', sand: '#fde68a', shallow_water: '#7dd3fc' },
  mountain: { cleared: '#c8b898', grassland: '#6ee7b7', roughland: '#78716c', highland: '#a8a29e' },
  plains:   { cleared: '#ddb870', grassland: '#a3e635', roughland: '#854d0e', forest_floor: '#166534' },
  hills:    { cleared: '#c9a058', grassland: '#84cc16', roughland: '#92400e', highland: '#a16207' },
  volcano:  { cleared: '#c49080', grassland: '#86efac', roughland: '#7f1d1d', highland: '#991b1b' },
};
