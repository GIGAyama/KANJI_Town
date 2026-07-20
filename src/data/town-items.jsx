import { lazy } from 'react';

/**
 * 建物SVGはタウンが実際に描画されるまで読み込まない。
 * 全アイテムが同じ dynamic import を共有するため、ネットワーク要求は1 chunkにまとまる。
 */
const lazySvg = (exportName) => lazy(async () => {
  const components = await import('./iso-svg');
  return { default: components[exportName] };
});

// ResultView / BossBattleView が利用する互換エクスポート。
const SvgVillager = lazySvg('SvgVillager');
const SvgGhostBoss = lazySvg('SvgGhostBoss');
export { SvgGhostBoss, SvgVillager };


const TOWN_ITEMS = [
  // 地形（内部管理用・パレット非表示） isoHeight=0
  { id: 't_bedrock',   svg: lazySvg('SvgBedrock'),   name: '岩盤',   price: 0,     pros: 0,    type: 'terrain', bg: 'bg-[#1e293b]', isoHeight: 0 },
  { id: 't_roughland', svg: lazySvg('SvgRoughland'), name: '荒れ地', price: 0,     pros: -2,   type: 'terrain', bg: 'bg-[#92400e]', cultivateCost: 15, isoHeight: 0 },
  { id: 't_cleared',   svg: lazySvg('SvgCleared'),   name: '更地',   price: 0,     pros: 0,    type: 'terrain', bg: 'bg-[#d4a96a]', isoHeight: 0 },
  { id: 't_weed',      svg: lazySvg('SvgWeed'),      name: 'ざっそう', price: 0,   pros: -5,   type: 'terrain', bg: 'bg-[#a3e635]', isoHeight: 6 },
  { id: 't_grassland',     svg: lazySvg('SvgGrassland'),    name: '草地',     price: 0, pros: 1,  type: 'terrain', bg: 'bg-[#86efac]',  cultivateCost: 10, isoHeight: 0 },
  { id: 't_forest_floor',  svg: lazySvg('SvgForestFloor'),  name: '森林',     price: 0, pros: 2,  type: 'terrain', bg: 'bg-[#14532d]',  cultivateCost: 30, isoHeight: 0 },
  { id: 't_sand',          svg: lazySvg('SvgSand'),         name: '砂地',     price: 0, pros: 0,  type: 'terrain', bg: 'bg-[#fde68a]',  cultivateCost: 10, isoHeight: 0 },
  { id: 't_shallow_water', svg: lazySvg('SvgShallowWater'), name: '浅瀬',     price: 0, pros: 1,  type: 'terrain', bg: 'bg-[#7dd3fc]', isoHeight: 0 },
  { id: 't_highland',      svg: lazySvg('SvgHighland'),     name: '高台',     price: 0, pros: 1,  type: 'terrain', bg: 'bg-[#a8a29e]',  cultivateCost: 20, isoHeight: 0 },
  // 自然（isoHeight: 小さめ、バリアント持ち）
  { id: 't_grass',      svg: lazySvg('SvgGrass'),      name: 'くさ',       price: 10,    pros: 1,    type: 'nature',   bg: 'bg-[#86efac]', isoHeight: 4, hasVariants: true },
  { id: 't_flower',     svg: lazySvg('SvgFlower'),     name: '花壇',       price: 30,    pros: 5,    type: 'nature',   bg: 'bg-[#86efac]', isoHeight: 8, hasVariants: true },
  { id: 't_tree',       svg: lazySvg('SvgTree'),       name: '木',         price: 50,    pros: 10,   type: 'nature',   bg: 'bg-[#86efac]', isoHeight: 28, hasVariants: true },
  { id: 't_sakura',     svg: lazySvg('SvgSakura'),     name: '桜の木',     price: 150,   pros: 25,   type: 'nature',   bg: 'bg-[#86efac]',  minGrade: 3, isoHeight: 28, hasVariants: true },
  { id: 't_pine',       svg: lazySvg('SvgPine'),       name: '松',         price: 100,   pros: 20,   type: 'nature',   bg: 'bg-[#86efac]', isoHeight: 30, hasVariants: true },
  { id: 't_rock',       svg: lazySvg('SvgRock'),       name: '岩',         price: 20,    pros: 2,    type: 'nature',   bg: 'bg-[#86efac]', isoHeight: 10, hasVariants: true },
  { id: 't_water',      svg: lazySvg('SvgWater'),      name: '水路',       price: 40,    pros: 4,    type: 'nature',   bg: 'bg-[#7dd3fc]', isFlat: true, isoHeight: 2 },
  // 建物（isoHeight: 中）
  { id: 't_road',       svg: lazySvg('SvgRoad'),       name: '道',         price: 15,    pros: 3,    type: 'building', bg: 'bg-[#e2e8f0]', isFlat: true, isoHeight: 2 },
  { id: 't_bridge',     svg: lazySvg('SvgBridge'),     name: '橋',         price: 100,   pros: 15,   type: 'building', bg: 'bg-[#7dd3fc]', minGrade: 3, isoHeight: 12 },
  { id: 't_wall',       svg: lazySvg('SvgWall'),       name: '城壁',       price: 80,    pros: 12,   type: 'building', bg: 'bg-[#e2e8f0]', minGrade: 4, isoHeight: 18 },
  { id: 't_house1',     svg: lazySvg('SvgHouse1'),     name: '小さな家',   price: 150,   pros: 50,   type: 'building', bg: 'bg-[#86efac]', isoHeight: 24, hasVariants: true, disableHue: true },
  { id: 't_shop',       svg: lazySvg('SvgShop'),       name: 'お店',       price: 400,   pros: 150,  type: 'building', bg: 'bg-[#e2e8f0]', minGrade: 2, isoHeight: 26, hasVariants: true, disableHue: true },
  { id: 't_school',     svg: lazySvg('SvgSchool'),     name: '学校',       price: 2500,  pros: 1200, type: 'mega',     bg: 'bg-[#e2e8f0]', minGrade: 5, isoHeight: 36, size: { w: 4, h: 4 } },
    // { id: 't_kakejiku',   svg: () => <div/>,  name: 'マイ掛け軸', price: 500,   pros: 100,  type: 'special',  bg: 'bg-[#f5e6d3]', isoHeight: 20 },
  // 特殊（isoHeight: 大きめ）
  { id: 't_torii',      svg: lazySvg('SvgTorii'),      name: '鳥居',       price: 1500,  pros: 800,  type: 'special',  bg: 'bg-[#86efac]', minGrade: 3, isoHeight: 30 },
  { id: 't_temple',     svg: lazySvg('SvgTemple'),     name: 'お寺',       price: 4000,  pros: 1800, type: 'special',  bg: 'bg-[#e2e8f0]', minGrade: 3, isoHeight: 38, size: { w: 2, h: 2 } },
  { id: 't_castle',     svg: lazySvg('SvgCastle'),     name: 'お城',       price: 8000,  pros: 4000, type: 'special',  bg: 'bg-[#86efac]', minGrade: 6, isoHeight: 48, size: { w: 2, h: 2 } },
  { id: 't_gold_castle',svg: lazySvg('SvgGoldCastle'), name: '黄金の城',   price: 20000, pros: 12000, type: 'special', bg: 'bg-[#fef08a]', minGrade: 6, isoHeight: 52, size: { w: 2, h: 2 } },
  { id: 't_dragon',     svg: lazySvg('SvgDragon'),     name: '守り神',     price: 5000,  pros: 3000, type: 'special',  bg: 'bg-[#bbf7d0]', minGrade: 6, isoHeight: 32 },
  // クラフト建物
  { id: 't_fence',      svg: lazySvg('SvgFence'),      name: '柵',         price: 30,    pros: 5,    type: 'building', bg: 'bg-[#d4a96a]', isoHeight: 10 },
  { id: 't_well',       svg: lazySvg('SvgWell'),       name: '井戸',       price: 80,    pros: 20,   type: 'building', bg: 'bg-[#86efac]', isoHeight: 16 },
  { id: 't_warehouse',  svg: lazySvg('SvgWarehouse'),  name: '倉庫',       price: 300,   pros: 80,   type: 'building', bg: 'bg-[#d4a96a]', minGrade: 2, isoHeight: 24 },
  { id: 't_market',     svg: lazySvg('SvgMarket'),     name: '市場',       price: 500,   pros: 200,  type: 'building', bg: 'bg-[#fef3c7]', minGrade: 2, isoHeight: 22 },
  { id: 't_port',       svg: lazySvg('SvgPort'),       name: '港',         price: 1200,  pros: 400,  type: 'building', bg: 'bg-[#7dd3fc]', minGrade: 2, isoHeight: 32, size: { w: 2, h: 2 } },
  { id: 't_garden',     svg: lazySvg('SvgGarden'),     name: '庭園',       price: 400,   pros: 100,  type: 'building', bg: 'bg-[#86efac]', minGrade: 3, isoHeight: 8 },
  { id: 't_smithy',     svg: lazySvg('SvgSmithy'),     name: '鍛冶場',     price: 700,   pros: 300,  type: 'building', bg: 'bg-[#78350f]', minGrade: 4, isoHeight: 26 },
  { id: 't_factory',    svg: lazySvg('SvgFactory'),    name: '工場',       price: 1800,  pros: 600,  type: 'building', bg: 'bg-[#64748b]', minGrade: 4, isoHeight: 34, size: { w: 2, h: 1 } },
  { id: 't_watermill',  svg: lazySvg('SvgWatermill'),  name: '水車小屋',   price: 800,   pros: 350,  type: 'building', bg: 'bg-[#d4a96a]', minGrade: 4, isoHeight: 30, size: { w: 2, h: 1 } },
  { id: 't_mine',       svg: lazySvg('SvgMine'),       name: '鉱山',       price: 600,   pros: 250,  type: 'building', bg: 'bg-[#78716c]', minGrade: 4, isoHeight: 22 },
  { id: 't_library',    svg: lazySvg('SvgLibrary'),    name: '図書館',     price: 2000,  pros: 700,  type: 'building', bg: 'bg-[#fef3c7]', minGrade: 5, isoHeight: 32, size: { w: 2, h: 1 } },
  { id: 't_townhall',   svg: lazySvg('SvgTownhall'),   name: '役所',       price: 2400,  pros: 900,  type: 'building', bg: 'bg-[#f8fafc]', minGrade: 5, isoHeight: 34, size: { w: 2, h: 1 } },
  { id: 't_embassy',    svg: lazySvg('SvgEmbassy'),    name: '大使館',     price: 3000,  pros: 1000, type: 'building', bg: 'bg-[#f8fafc]', minGrade: 5, isoHeight: 36, size: { w: 2, h: 1 } },
  { id: 't_golden_tower',    svg: lazySvg('SvgGoldenTower'),    name: '黄金の塔',     price: 15000, pros: 7000, type: 'special',  bg: 'bg-[#fef08a]', minGrade: 6, isoHeight: 46, size: { w: 1, h: 2 } },
  { id: 't_guardian_shrine',  svg: lazySvg('SvgGuardianShrine'), name: '守り神の祠',   price: 10000, pros: 5000, type: 'special',  bg: 'bg-[#e9d5ff]', minGrade: 6, isoHeight: 38, size: { w: 2, h: 1 } },
  { id: 't_monument',        svg: lazySvg('SvgMonument'),       name: '記念碑',       price: 8000,  pros: 4500, type: 'special',  bg: 'bg-[#e2e8f0]', minGrade: 6, isoHeight: 40, size: { w: 1, h: 2 } },
  // アップグレード建物
  { id: 't_house2',         svg: lazySvg('SvgHouse2'),         name: '大きな家',     price: 600,   pros: 150,  type: 'building', bg: 'bg-[#86efac]', minGrade: 2, isoHeight: 38, size: { w: 2, h: 1 }, hasVariants: true, disableHue: true },
  { id: 't_house3',         svg: lazySvg('SvgHouse3'),         name: '豪邸',         price: 2500,  pros: 600,  type: 'building', bg: 'bg-[#86efac]', minGrade: 4, isoHeight: 50, size: { w: 3, h: 2 }, hasVariants: true, disableHue: true },
  { id: 't_department',     svg: lazySvg('SvgDepartment'),     name: 'デパート',     price: 3500,  pros: 800,  type: 'building', bg: 'bg-[#e2e8f0]', minGrade: 4, isoHeight: 40, size: { w: 2, h: 2 }, hasVariants: true },
  { id: 't_grand_smithy',   svg: lazySvg('SvgGrandSmithy'),    name: '大鍛冶場',     price: 4000,  pros: 1200, type: 'building', bg: 'bg-[#78350f]', minGrade: 5, isoHeight: 36, size: { w: 2, h: 1 } },
  { id: 't_university',     svg: lazySvg('SvgUniversity'),     name: '大学',         price: 8000,  pros: 2500, type: 'building', bg: 'bg-[#fef3c7]', minGrade: 6, isoHeight: 42, size: { w: 2, h: 2 } },
  // メガ建築
  { id: 't_mega_grand_market',   svg: lazySvg('SvgMegaGrandMarket'),   name: '大市場',     price: 2000,  pros: 500,   type: 'mega', bg: 'bg-[#fef3c7]', minGrade: 3, size: { w: 2, h: 2 }, isoHeight: 36 },
  { id: 't_mega_fortress',       svg: lazySvg('SvgMegaFortress'),      name: '要塞',       price: 4000,  pros: 800,   type: 'mega', bg: 'bg-[#475569]', minGrade: 4, size: { w: 2, h: 2 }, isoHeight: 44 },
  { id: 't_mega_academy',        svg: lazySvg('SvgMegaAcademy'),       name: '学園都市',   price: 6000,  pros: 1200,  type: 'mega', bg: 'bg-[#fef3c7]', minGrade: 5, size: { w: 2, h: 2 }, isoHeight: 48 },
  { id: 't_mega_imperial_palace', svg: lazySvg('SvgMegaImperialPalace'), name: '皇居',     price: 20000, pros: 15000, type: 'mega', bg: 'bg-[#fef9c3]', minGrade: 6, size: { w: 3, h: 3 }, isoHeight: 60 },
  { id: 't_mega_wonder',         svg: lazySvg('SvgMegaWonder'),        name: '世界遺産',   price: 25000, pros: 20000, type: 'mega', bg: 'bg-[#e2e8f0]', minGrade: 6, size: { w: 3, h: 3 }, isoHeight: 56 },
  // レア建物
  { id: 't_cherry_pavilion',  svg: lazySvg('SvgCherryPavilion'),  name: '桜御殿',       price: 1000,  pros: 400,   type: 'rare', bg: 'bg-[#fdf2f8]', minGrade: 3, isoHeight: 28 },
  { id: 't_crystal_tower',    svg: lazySvg('SvgCrystalTower'),    name: '水晶の塔',     price: 4000,  pros: 1000,  type: 'rare', bg: 'bg-[#e0f2fe]', minGrade: 4, isoHeight: 42, size: { w: 1, h: 2 } },
  { id: 't_philosophers_lab', svg: lazySvg('SvgPhilosophersLab'),  name: '賢者の研究所', price: 8000,  pros: 2500,  type: 'rare', bg: 'bg-[#eef2ff]', minGrade: 5, isoHeight: 36, size: { w: 2, h: 1 } },
  { id: 't_dragon_shrine',    svg: lazySvg('SvgDragonShrine'),    name: '龍神殿',       price: 20000, pros: 8000,  type: 'rare', bg: 'bg-[#ecfdf5]', minGrade: 6, isoHeight: 44, size: { w: 2, h: 2 } },
  { id: 't_perfect_monument', svg: lazySvg('SvgPerfectMonument'), name: '完璧の碑',     price: 12000, pros: 5000,  type: 'rare', bg: 'bg-[#fef9c3]', minGrade: 6, isoHeight: 42, size: { w: 1, h: 2 } },
  { id: 't_bamboo_grove',    svg: lazySvg('SvgBambooGrove'),    name: '竹林庭',       price: 500,   pros: 200,   type: 'rare', bg: 'bg-[#86efac]', minGrade: 2, isoHeight: 24 },
  { id: 't_hot_spring',      svg: lazySvg('SvgHotSpring'),      name: '温泉宿',       price: 2400,  pros: 500,   type: 'rare', bg: 'bg-[#7dd3fc]', minGrade: 3, isoHeight: 22, size: { w: 2, h: 1 } },
  { id: 't_observatory',     svg: lazySvg('SvgObservatory'),     name: '天文台',       price: 6000,  pros: 1800,  type: 'rare', bg: 'bg-[#eef2ff]', minGrade: 5, isoHeight: 42, size: { w: 1, h: 2 } },
  // 追加アップグレード建物
  { id: 't_grand_warehouse',  svg: lazySvg('SvgGrandWarehouse'),  name: '大倉庫',       price: 900,   pros: 250,   type: 'building', bg: 'bg-[#d4a96a]', minGrade: 3, isoHeight: 30, size: { w: 1, h: 2 } },
  { id: 't_shopping_street',  svg: lazySvg('SvgShoppingStreet'),  name: '商店街',       price: 800,   pros: 250,   type: 'building', bg: 'bg-[#fef3c7]', minGrade: 3, isoHeight: 24 },
  { id: 't_zen_garden',       svg: lazySvg('SvgZenGarden'),       name: '日本庭園',     price: 800,   pros: 200,   type: 'building', bg: 'bg-[#d4a96a]', minGrade: 4, isoHeight: 8 },
  { id: 't_national_library', svg: lazySvg('SvgNationalLibrary'),  name: '国立図書館',   price: 6000,  pros: 1500,  type: 'building', bg: 'bg-[#fef3c7]', minGrade: 6, isoHeight: 40, size: { w: 2, h: 2 } },
  // 追加メガ建築
  { id: 't_mega_harbor_town',    svg: lazySvg('SvgMegaHarborTown'),    name: '港町',       price: 3000,  pros: 600,   type: 'mega', bg: 'bg-[#7dd3fc]', minGrade: 3, size: { w: 2, h: 2 }, isoHeight: 32 },
  { id: 't_mega_shrine_complex', svg: lazySvg('SvgMegaShrineComplex'), name: '神社群',     price: 5000,  pros: 1000,  type: 'mega', bg: 'bg-[#fef3c7]', minGrade: 4, size: { w: 2, h: 2 }, isoHeight: 40 },
  // 装飾アイテム
  { id: 't_stone_lantern',  svg: lazySvg('SvgStoneLantern'),  name: '石灯籠',       price: 100,   pros: 8,     type: 'decoration', bg: 'bg-[#e2e8f0]', isoHeight: 14 },
  { id: 't_fountain',       svg: lazySvg('SvgFountain'),       name: '噴水',         price: 300,   pros: 20,    type: 'decoration', bg: 'bg-[#7dd3fc]', minGrade: 2, isoHeight: 16 },
  { id: 't_statue',         svg: lazySvg('SvgStatue'),         name: '石像',         price: 350,   pros: 30,    type: 'decoration', bg: 'bg-[#e2e8f0]', minGrade: 2, isoHeight: 20 },
  { id: 't_windmill',       svg: lazySvg('SvgWindmill'),       name: '風車',         price: 500,   pros: 50,    type: 'decoration', bg: 'bg-[#86efac]', minGrade: 3, isoHeight: 30 },
  { id: 't_bell_tower',     svg: lazySvg('SvgBellTower'),      name: '鐘楼',         price: 600,   pros: 40,    type: 'decoration', bg: 'bg-[#d4a96a]', minGrade: 3, isoHeight: 28 },
  { id: 't_pond',           svg: lazySvg('SvgPond'),           name: '池',           price: 250,   pros: 15,    type: 'decoration', bg: 'bg-[#7dd3fc]', minGrade: 2, isFlat: true, isoHeight: 4 },
  { id: 't_cherry_road',    svg: lazySvg('SvgCherryRoad'),     name: '桜並木',       price: 400,   pros: 40,    type: 'decoration', bg: 'bg-[#fdf2f8]', minGrade: 3, isoHeight: 26 },
  { id: 't_clock_tower',    svg: lazySvg('SvgClockTower'),     name: '時計塔',       price: 800,   pros: 80,    type: 'decoration', bg: 'bg-[#d4a96a]', minGrade: 4, isoHeight: 34 },
  { id: 't_gold_statue',    svg: lazySvg('SvgGoldStatue'),     name: '黄金像',       price: 2000,  pros: 200,   type: 'decoration', bg: 'bg-[#fef08a]', minGrade: 5, isoHeight: 24 },
  { id: 't_festival_stage', svg: lazySvg('SvgFestivalStage'),  name: '祭りの舞台',   price: 700,   pros: 60,    type: 'decoration', bg: 'bg-[#78350f]', minGrade: 4, isoHeight: 18 },
  // 商業施設
  { id: 't_cafe',              svg: lazySvg('SvgCafe'),              name: 'カフェ',             price: 300,   pros: 100,   type: 'building',   bg: 'bg-[#92400e]', minGrade: 2, isoHeight: 22 },
  { id: 't_bakery',            svg: lazySvg('SvgBakery'),            name: 'パン屋',             price: 350,   pros: 120,   type: 'building',   bg: 'bg-[#ffedd5]', minGrade: 2, isoHeight: 22 },
  { id: 't_burger_shop',       svg: lazySvg('SvgBurgerShop'),        name: 'ハンバーガーショップ', price: 800,   pros: 250,   type: 'building',   bg: 'bg-[#fef08a]', minGrade: 3, isoHeight: 24 },
  { id: 't_family_restaurant', svg: lazySvg('SvgFamilyRestaurant'),  name: 'ファミレス',         price: 1200,  pros: 350,   type: 'building',   bg: 'bg-[#fef9c3]', minGrade: 3, isoHeight: 30, size: { w: 2, h: 1 } },
  { id: 't_convenience_store', svg: lazySvg('SvgConvenienceStore'),  name: 'コンビニ',           price: 600,   pros: 200,   type: 'building',   bg: 'bg-[#e0f2fe]', minGrade: 2, isoHeight: 22 },
  { id: 't_flower_shop',       svg: lazySvg('SvgFlowerShop'),        name: '花屋',               price: 300,   pros: 100,   type: 'building',   bg: 'bg-[#fce7f3]', minGrade: 2, isoHeight: 20 },
  { id: 't_cinema',            svg: lazySvg('SvgCinema'),            name: '映画館',             price: 2500,  pros: 800,   type: 'building',   bg: 'bg-[#334155]', minGrade: 4, isoHeight: 36, size: { w: 2, h: 1 } },
  { id: 't_hotel',             svg: lazySvg('SvgHotel'),             name: 'ホテル',             price: 3500,  pros: 1000,  type: 'building',   bg: 'bg-[#475569]', minGrade: 5, isoHeight: 42, size: { w: 1, h: 2 } },
  // 公共施設
  { id: 't_hospital',          svg: lazySvg('SvgHospital'),          name: '病院',               price: 2500,  pros: 700,   type: 'building',   bg: 'bg-[#f8fafc]', minGrade: 4, isoHeight: 34, size: { w: 2, h: 1 } },
  { id: 't_fire_station',      svg: lazySvg('SvgFireStation'),       name: '消防署',             price: 1600,  pros: 500,   type: 'building',   bg: 'bg-[#ef4444]', minGrade: 3, isoHeight: 30, size: { w: 2, h: 1 } },
  { id: 't_police_box',        svg: lazySvg('SvgPoliceBox'),         name: '交番',               price: 500,   pros: 200,   type: 'building',   bg: 'bg-[#1d4ed8]', minGrade: 3, isoHeight: 20 },
  { id: 't_post_office',       svg: lazySvg('SvgPostOffice'),        name: '郵便局',             price: 600,   pros: 250,   type: 'building',   bg: 'bg-[#f8fafc]', minGrade: 3, isoHeight: 24 },
  { id: 't_station',           svg: lazySvg('SvgStation'),           name: '駅',                 price: 5000,  pros: 1500,  type: 'building',   bg: 'bg-[#e2e8f0]', minGrade: 5, isoHeight: 40, size: { w: 2, h: 2 } },
  { id: 't_airport',           svg: lazySvg('SvgAirport'),           name: '空港',               price: 5000,  pros: 2000,  type: 'mega',       bg: 'bg-[#e2e8f0]', minGrade: 6, size: { w: 2, h: 2 }, isoHeight: 40 },
  // 現代建築
  { id: 't_office_building',   svg: lazySvg('SvgOfficeBuilding'),    name: 'オフィスビル',       price: 3500,  pros: 1000,  type: 'building',   bg: 'bg-[#475569]', minGrade: 5, isoHeight: 44, size: { w: 1, h: 2 } },
  { id: 't_tower_apartment',   svg: lazySvg('SvgTowerApartment'),    name: 'タワマン',           price: 5000,  pros: 1500,  type: 'building',   bg: 'bg-[#64748b]', minGrade: 5, isoHeight: 48, size: { w: 1, h: 2 } },
  { id: 't_tv_tower',          svg: lazySvg('SvgTvTower'),           name: 'テレビ塔',           price: 6000,  pros: 2000,  type: 'special',    bg: 'bg-[#ef4444]', minGrade: 6, isoHeight: 52, size: { w: 1, h: 2 } },
  { id: 't_stadium',           svg: lazySvg('SvgStadium'),           name: 'スタジアム',         price: 4000,  pros: 1500,  type: 'mega',       bg: 'bg-[#86efac]', minGrade: 5, size: { w: 2, h: 2 }, isoHeight: 36 },
  // 公園・レジャー
  { id: 't_park',              svg: lazySvg('SvgPark'),              name: '公園',               price: 2000,  pros: 600,   type: 'mega',       bg: 'bg-[#86efac]', minGrade: 3, isoHeight: 24, size: { w: 4, h: 5 } },
  { id: 't_playground',        svg: lazySvg('SvgPlayground'),        name: '遊具',               price: 300,   pros: 80,    type: 'decoration', bg: 'bg-[#fde68a]', minGrade: 2, isoHeight: 16 },
  { id: 't_pool',              svg: lazySvg('SvgPool'),              name: 'プール',             price: 1600,  pros: 400,   type: 'building',   bg: 'bg-[#7dd3fc]', minGrade: 4, isoHeight: 12, size: { w: 2, h: 1 } },
  { id: 't_ferris_wheel',      svg: lazySvg('SvgFerrisWheel'),       name: '観覧車',             price: 4000,  pros: 1200,  type: 'special',    bg: 'bg-[#e2e8f0]', minGrade: 5, isoHeight: 48, size: { w: 1, h: 2 } },
  { id: 't_amusement_park',    svg: lazySvg('SvgAmusementPark'),     name: '遊園地',             price: 6000,  pros: 2500,  type: 'mega',       bg: 'bg-[#86efac]', minGrade: 5, size: { w: 2, h: 2 }, isoHeight: 40 },
  // 乗り物
  { id: 't_car',               svg: lazySvg('SvgCar'),               name: '自動車',             price: 200,   pros: 30,    type: 'decoration', bg: 'bg-[#ef4444]', minGrade: 2, isoHeight: 8 },
  { id: 't_bus',               svg: lazySvg('SvgBus'),               name: 'バス',               price: 400,   pros: 50,    type: 'decoration', bg: 'bg-[#22c55e]', minGrade: 3, isoHeight: 12 },
  { id: 't_bicycle',           svg: lazySvg('SvgBicycle'),           name: '自転車',             price: 80,    pros: 10,    type: 'decoration', bg: 'bg-[#3b82f6]', isoHeight: 6 },
  { id: 't_ship_vehicle',      svg: lazySvg('SvgShipVehicle'),       name: '船',                 price: 600,   pros: 80,    type: 'decoration', bg: 'bg-[#7dd3fc]', minGrade: 3, isoHeight: 10 },
  { id: 't_airplane',          svg: lazySvg('SvgAirplane'),          name: '飛行機',             price: 1000,  pros: 150,   type: 'decoration', bg: 'bg-[#e2e8f0]', minGrade: 5, isoHeight: 14 },
  { id: 't_fire_truck',        svg: lazySvg('SvgFireTruck'),         name: '消防車',             price: 500,   pros: 60,    type: 'decoration', bg: 'bg-[#ef4444]', minGrade: 3, isoHeight: 12 },
  // ストリートファニチャー
  { id: 't_bench',             svg: lazySvg('SvgBench'),             name: 'ベンチ',             price: 50,    pros: 5,     type: 'decoration', bg: 'bg-[#d97706]', isoHeight: 6 },
  { id: 't_mailbox',           svg: lazySvg('SvgMailbox'),           name: 'ポスト',             price: 60,    pros: 5,     type: 'decoration', bg: 'bg-[#ef4444]', isoHeight: 8 },
  { id: 't_phone_booth',       svg: lazySvg('SvgPhoneBooth'),        name: '公衆電話',           price: 80,    pros: 8,     type: 'decoration', bg: 'bg-[#ef4444]', minGrade: 2, isoHeight: 10 },
  { id: 't_street_light',      svg: lazySvg('SvgStreetLight'),       name: '街灯',               price: 70,    pros: 6,     type: 'decoration', bg: 'bg-[#94a3b8]', isoHeight: 14 },
  { id: 't_bus_stop',          svg: lazySvg('SvgBusStop'),           name: 'バス停',             price: 100,   pros: 10,    type: 'decoration', bg: 'bg-[#3b82f6]', minGrade: 2, isoHeight: 12 },
  { id: 't_vending_machine',   svg: lazySvg('SvgVendingMachine'),    name: '自動販売機',         price: 120,   pros: 12,    type: 'decoration', bg: 'bg-[#1e293b]', minGrade: 2, isoHeight: 10 },
  { id: 't_trash_can',         svg: lazySvg('SvgTrashCan'),          name: 'ゴミ箱',             price: 40,    pros: 3,     type: 'decoration', bg: 'bg-[#64748b]', isoHeight: 6 },
  // 追加平面オブジェクト
  { id: 't_grass_flat', svg: lazySvg('SvgGrassFlat'), name: '芝生', price: 15, pros: 2, type: 'nature', bg: 'bg-[#4ade80]', isFlat: true, isoHeight: 2 },
  { id: 't_brick',      svg: lazySvg('SvgBrick'),      name: 'レンガ道', price: 25, pros: 5, type: 'building', bg: 'bg-[#b45309]', isFlat: true, isoHeight: 2 },
  { id: 't_asphalt',    svg: lazySvg('SvgAsphalt'),    name: 'アスファルト', price: 20, pros: 4, type: 'building', bg: 'bg-[#334155]', isFlat: true, isoHeight: 2 },
  { id: 't_magma',      svg: lazySvg('SvgMagma'),      name: 'マグマ', price: 50, pros: 10, type: 'nature', bg: 'bg-[#ef4444]', minGrade: 4, isFlat: true, isoHeight: 2 },
  { id: 't_crosswalk',  svg: lazySvg('SvgCrosswalk'),  name: '横断歩道', price: 30, pros: 5, type: 'building', bg: 'bg-[#1e293b]', minGrade: 2, isFlat: true, isoHeight: 2 },
  { id: 't_railway',    svg: lazySvg('SvgRailway'),    name: '線路', price: 50, pros: 10, type: 'building', bg: 'bg-[#a8a29e]', minGrade: 3, isFlat: true, isoHeight: 2 },
  { id: 't_dirt',       svg: lazySvg('SvgDirt'),       name: '土', price: 10, pros: 1, type: 'nature', bg: 'bg-[#78350f]', isFlat: true, isoHeight: 2 },
];

export { TOWN_ITEMS };
