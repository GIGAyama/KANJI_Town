// 町のアイテムの絵を、マスのどこに・どの大きさで置くかの表 — マイ漢字タウン
//
// 絵（src/data/iso-svg/）は 1 枚ずつ、足もとの位置も大きさも ちがう決まりで描いてある。
// 以前は「箱の下のまん中を、マスの手前の頂点に合わせる」だけで置いていたので、
//   ・大きな建物（2×2 など）が、置いたマスより 半マス〜1 マス手前に描かれていた
//     （建物を押しても動かせない・手前の建物に めりこむ、の原因）
//   ・街灯やベンチなどの小さなものが、マスのまん中ではなく手前の かどに立っていた
// ここでは絵ごとに「足もとのまん中」を持ち、それを 置いたマス（足もと全体）のまん中に合わせる。
//
// 1 行は [ax, ay, s, bw, bh, flip]。
//   ax, ay : 絵の足もとのまん中。単位は絵の viewBox（"0 -100 100 200"）の単位で、
//            原点は箱の下のまん中（絵が translate(50, 100) で使う点）
//   s      : 1 単位あたりの px（町の拡大率が 1 のとき）。1 マスのものは 0.32
//   bw, bh : 足もとの大きさ（マス）。影の大きさに使う
//   flip   : 1 なら左右を うら返して置く（絵の長い向きを、足もとの長い向きに合わせる）
//
// 数字は、絵を 1 枚ずつ透明な背景に描いて測った（不透明な部分を下から支える 2 本の線
// = 手前の 2 辺 を求め、その交点を手前の頂点とする）。足もとが ひし形でない絵（お寺・駅・
// スタジアムなど）は、絵を見て手で決めてある。大きさは、足もとが マスに収まる いちばん
// 大きな値（すきま 6%）。
//
// ⚠️ 大きさ（size）を持つアイテムを足したら、ここにも 1 行足すこと（test/town-item-fit.test.js が見る）。
//    足さないと DEFAULT_BIG の決まり（足もとが 88% のひし形の絵）で置かれる。

const FIT = {
  t_well: [0, -12, 0.32, 0.36, 0.36],
  t_stone_lantern: [0, -13, 0.32, 0.2, 0.2],
  t_fountain: [0, -2, 0.32, 0.44, 0.44],
  t_statue: [0, -19, 0.32, 0.31, 0.31],
  t_windmill: [0, -3, 0.32, 0.3, 0.3],
  t_gold_statue: [0, 0, 0.32, 0.27, 0.27],
  t_bicycle: [0, -2, 0.32, 0.4, 0.2],
  t_bench: [0, 0, 0.32, 0.37, 0.2],
  t_mailbox: [0, 2, 0.32, 0.17, 0.17],
  t_phone_booth: [1, 0, 0.32, 0.22, 0.22],
  t_street_light: [0, 0, 0.32, 0.12, 0.12],
  t_bus_stop: [2, -3, 0.32, 0.24, 0.24],
  t_vending_machine: [1, -2, 0.32, 0.22, 0.22],
  t_trash_can: [0, -5, 0.32, 0.16, 0.16],
};

/**
 * 新しい絵がらの建物（iso-svg/buildings-art.js）の、足もとの大きさ [bw, bh]（マス）。
 * こちらは絵の原点が「敷地のまん中」に そろえてあるので、置き方は どれも同じ決まりになる
 * （まん中 (0, -50)・大きさ 0.16 ×（敷地の幅 + 奥行き））。ここに書くのは影の大きさだけ。
 * 3 つめの 1 は「影は絵の中に描いてある」しるし（敷地に芝や しき石を しく絵。地面のレイヤーは影を描かない）。
 * 値は buildings-art.js の base・shadow と同じにする（test/buildings-art.test.js が見る）。
 */
const KIT_BASE = {
  t_shop: [0.76, 0.62],
  t_wall: [0.94, 0.94],
  t_fence: [0.96, 0.1],
  t_mine: [0.8, 0.66],
  t_torii: [0.8, 0.14],
  t_dragon: [0.6, 0.6],
  t_bell_tower: [0.6, 0.6],
  t_clock_tower: [0.46, 0.46],
  t_festival_stage: [0.52, 0.52],
  t_house2: [1.72, 0.62],
  t_house3: [2.16, 0.92, 1],
  t_factory: [1.8, 0.7, 1],
  t_hospital: [1.8, 0.64],
  t_fire_station: [1.82, 0.62],
  t_golden_tower: [0.86, 0.86, 1],
  t_crystal_tower: [0.7, 0.7],
  t_station: [1.4, 0.74, 1],
  t_temple: [1.44, 1.22, 1],
  t_castle: [1.5, 1.5, 1],
  t_gold_castle: [1.5, 1.5, 1],
  t_national_library: [1.64, 1.34, 1],
  t_school: [2.94, 0.9, 1],
  t_library: [1.72, 0.66],
  t_townhall: [1.76, 0.62],
  t_embassy: [1.26, 0.54, 1],
  t_grand_smithy: [1.74, 0.66],
  t_family_restaurant: [1.76, 0.62],
  t_cinema: [1.76, 0.64],
  t_watermill: [1.18, 0.64],
  t_hot_spring: [0.96, 0.64],
  t_philosophers_lab: [0.66, 0.66],
  t_guardian_shrine: [0.84, 0.52, 1],
  t_pool: [1.9, 0.9, 1],
  t_hotel: [0.76, 1.26],
  t_office_building: [0.72, 1.24],
  t_tower_apartment: [0.72, 1.2],
  t_grand_warehouse: [0.76, 1.56],
  t_monument: [0.8, 0.8, 1],
  t_observatory: [0.76, 0.76, 1],
  t_perfect_monument: [0.8, 0.8, 1],
  t_tv_tower: [0.72, 0.72],
  t_ferris_wheel: [0.52, 1.16],
  t_park: [3.9, 4.9, 1],
  t_cafe: [0.74, 0.62],
  t_bakery: [0.74, 0.62],
  t_burger_shop: [0.74, 0.62],
  t_convenience_store: [0.74, 0.62],
  t_flower_shop: [0.74, 0.62],
  t_post_office: [0.74, 0.62],
  t_police_box: [0.6, 0.54],
  t_warehouse: [0.72, 0.62],
  t_market: [0.9, 0.9, 1],
  t_smithy: [0.7, 0.6],
  t_shopping_street: [0.9, 0.44],
  t_port: [1.9, 1.9, 1],
  t_department: [1.6, 1.28, 1],
  t_university: [1.72, 0.6, 1],
  t_airport: [1.26, 0.7, 1],
  t_stadium: [1.76, 1.76, 1],
  t_amusement_park: [1.9, 1.9, 1],
  t_cherry_pavilion: [0.64, 0.64, 1],
  t_mega_grand_market: [1.56, 0.86, 1],
  t_mega_fortress: [1.5, 1.5, 1],
  t_mega_academy: [1.14, 0.68, 1],
  t_mega_imperial_palace: [2.32, 2.32, 1],
  t_mega_wonder: [2.24, 2.24, 1],
  t_mega_harbor_town: [1.9, 1, 1],
  t_mega_shrine_complex: [0.92, 0.7, 1],
  t_dragon_shrine: [1.24, 1.24, 1],
};

/** 1 マスのものの決まり: 足もとのまん中は (0, -50)。タイルいっぱいに描いた絵と、木 */
const DEFAULT_ONE = Object.freeze({ ax: 0, ay: -50, s: 0.32, bw: 0.86, bh: 0.86, flip: false });

/**
 * そのアイテムの絵の置き方を返す。
 * @param {{ id: string, size?: { w: number, h: number } }} item
 * @returns {{ ax: number, ay: number, s: number, bw: number, bh: number, flip: boolean }}
 */
export function itemFit(item) {
  const row = item ? FIT[item.id] : null;
  if (row) return { ax: row[0], ay: row[1], s: row[2], bw: row[3], bh: row[4], flip: row[5] === 1 };
  const base = item ? KIT_BASE[item.id] : null;
  if (base) {
    const w = item.size?.w || 1;
    const h = item.size?.h || 1;
    return { ax: 0, ay: -50, s: 0.16 * (w + h), bw: base[0], bh: base[1], flip: false, ownShadow: base[2] === 1 };
  }
  if (item && item.size) {
    // 表に無い大きな建物: 足もとが 88% の ひし形（ShopBase と同じ描き方）だとして置く
    const side = Math.min(item.size.w, item.size.h);
    return { ax: 0, ay: -47, s: (0.94 * 32 * side) / 88, bw: side * 0.94, bh: side * 0.94, flip: false };
  }
  return DEFAULT_ONE;
}

/** 表に載っている id（テスト用） */
export const FITTED_ITEM_IDS = Object.freeze([...Object.keys(FIT), ...Object.keys(KIT_BASE)]);

/** 新しい絵がらの建物の、足もとの大きさの表（テスト用） */
export const KIT_BASE_SIZES = Object.freeze(KIT_BASE);
