// 町のアイテムの絵を、マスのどこに・どの大きさで置くかの表 — マイ漢字タウン
//
// 以前は「絵の箱の下のまん中を、マスの手前の頂点に合わせる」だけで置いていたので、
//   ・大きな建物（2×2 など）が、置いたマスより 半マス〜1 マス手前に描かれていた
//     （建物を押しても動かせない・手前の建物に めりこむ、の原因）
//   ・街灯やベンチなどの小さなものが、マスのまん中ではなく手前の かどに立っていた
// ここでは絵ごとに「足もとのまん中」を持ち、それを 置いたマス（足もと全体）のまん中に合わせる。
//
// 表は 2 つある。
//
// ■ 建物と 小さなもの（iso-svg/buildings-art.js・props-art.js。部品は kit.js）→ 下の KIT_BASE
//   絵の原点を「敷地のまん中」に そろえて描いてあるので、置き方は どれも同じ決まりになる。
//   表に書くのは 足もとの大きさ（影・夜のあかりの大きさに使う）だけ。
//   ⚠️ 絵を足すときは buildings-art.js（小さなものは props-art.js）に絵を描き、同じ値を KIT_BASE に 1 行足すこと
//      （test/buildings-art.test.js が、絵と表の食いちがいを見る）。
//
// ■ 木と同じ描き方の、細いもの（信号機・こいのぼり・かかし。絵は iso-svg/nature-art.js）→ 下の FIT
//   足もとは 木と同じ決まりどおりマスのまん中だが、柱 1 本の細いものなので、
//   影を木と同じ大きさにしないために ここへ足もとの大きさを書く。
//   1 行は [ax, ay, s, bw, bh]。
//     ax, ay : 絵の足もとのまん中。単位は絵の viewBox（"0 -100 100 200"）の単位で、
//              原点は箱の下のまん中（絵が translate(50, 100) で使う点）
//     s      : 1 単位あたりの px（町の拡大率が 1 のとき）。1 マスのものは 0.32
//     bw, bh : 足もとの大きさ（マス）。影の大きさに使う
//   （前は 井戸・ベンチ・車なども ここに 1 枚ずつ測った値を持っていた。描き直して KIT_BASE へ移した）

const FIT = {
  t_scarecrow: [0, -50, 0.32, 0.24, 0.24],
  t_koinobori: [0, -50, 0.32, 0.14, 0.14],
  t_signal: [0, -50, 0.32, 0.14, 0.14],
};

/**
 * 建物と 小さなもの（iso-svg/buildings-art.js・props-art.js）の、足もとの大きさ [bw, bh]（マス）。
 * 置き方は どれも「まん中 (0, -50)・大きさ 0.16 ×（敷地の幅 + 奥行き）」。
 * 3 つめの 1 は「地面のレイヤーは影を描かない」しるし（影を絵の中に描いてある絵と、プールのような
 * 平らな絵。敷地に芝や しき石を しく絵は、地面のレイヤーの影が その下に かくれる）。
 * 4・5 つめは、建物のまん中が 敷地のまん中から ずれているときの その場所（敷地の座標 u, v）。
 * 影と 夜のあかりを、建物の足もとに合わせる（学校の校舎は敷地の奥にある、など）。
 * 値は buildings-art.js の base・shadow・at と同じにする（test/buildings-art.test.js が見る）。
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
  t_house3: [2.16, 0.92, 1, 1.5, 0.7],
  t_factory: [1.8, 0.7, 1],
  t_hospital: [1.8, 0.64],
  t_fire_station: [1.82, 0.62],
  t_golden_tower: [0.86, 0.86, 1],
  t_crystal_tower: [0.7, 0.7],
  t_station: [1.4, 0.74, 1, 1, 0.45],
  t_temple: [1.44, 1.22, 1, 1, 0.82],
  t_castle: [1.5, 1.5, 1],
  t_gold_castle: [1.5, 1.5, 1],
  t_national_library: [1.64, 1.34, 1, 1, 0.85],
  t_school: [2.94, 0.9, 1, 1.83, 0.67],
  t_library: [1.72, 0.66],
  t_townhall: [1.76, 0.62],
  t_embassy: [1.26, 0.54, 1],
  t_grand_smithy: [1.74, 0.66],
  t_family_restaurant: [1.76, 0.62],
  t_cinema: [1.76, 0.64],
  t_watermill: [1.18, 0.64, 0, 1.25, 0.46],
  t_hot_spring: [0.96, 0.64, 0, 0.58, 0.46],
  t_philosophers_lab: [0.66, 0.66, 0, 0.58, 0.5],
  t_guardian_shrine: [0.84, 0.52, 1, 1, 0.34],
  t_pool: [1.9, 0.9, 1],
  t_hotel: [0.76, 1.26, 0, 0.5, 0.77],
  t_office_building: [0.72, 1.24, 0, 0.5, 0.8],
  t_tower_apartment: [0.72, 1.2, 0, 0.5, 0.78],
  t_grand_warehouse: [0.76, 1.56, 0, 0.5, 0.88],
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
  t_port: [0.7, 0.36, 1, 0.47, 0.28],
  t_department: [1.6, 1.28, 1, 1, 0.8],
  t_university: [1.72, 0.6, 1, 1, 0.44],
  t_airport: [1.26, 0.7, 1, 0.77, 0.49],
  t_stadium: [1.76, 1.76, 1],
  t_amusement_park: [1, 1, 1],
  t_cherry_pavilion: [0.64, 0.64, 1],
  t_mega_grand_market: [1.56, 0.86, 1, 1, 0.57],
  t_mega_fortress: [1.5, 1.5, 1],
  t_mega_academy: [1.14, 0.68, 1, 0.69, 0.46],
  t_mega_imperial_palace: [1.6, 1.32, 1, 1.5, 1.3],
  t_mega_wonder: [2.24, 2.24, 1],
  t_mega_harbor_town: [1.44, 0.6, 1, 0.9, 0.44],
  t_mega_shrine_complex: [0.92, 0.7, 1, 1, 0.54],
  t_dragon_shrine: [1.24, 1.24, 1],
  t_well: [0.34, 0.34],
  t_stone_lantern: [0.18, 0.18],
  t_fountain: [0.5, 0.5],
  t_statue: [0.28, 0.28],
  t_gold_statue: [0.28, 0.28],
  t_windmill: [0.36, 0.36],
  t_garden: [0.92, 0.92, 1],
  t_zen_garden: [0.92, 0.92, 1],
  t_playground: [0.92, 0.92, 1],
  t_bench: [0.4, 0.12],
  t_mailbox: [0.17, 0.17],
  t_phone_booth: [0.18, 0.18],
  t_street_light: [0.1, 0.1],
  t_bus_stop: [0.12, 0.12],
  t_vending_machine: [0.18, 0.12],
  t_trash_can: [0.15, 0.15],
  t_car: [0.72, 0.34, 1],
  t_bus: [0.9, 0.36, 1],
  t_fire_truck: [0.88, 0.34, 1],
  t_bicycle: [0.4, 0.08, 1],
  t_ship_vehicle: [0.92, 0.92, 1],
  t_airplane: [0.92, 0.92, 1],
  t_bridge: [0.4, 0.96, 1],
};

/** 1 マスのものの決まり: 足もとのまん中は (0, -50)。タイルいっぱいに描いた絵と、木 */
const DEFAULT_ONE = Object.freeze({ ax: 0, ay: -50, s: 0.32, bw: 0.86, bh: 0.86, flip: false });

/**
 * そのアイテムの絵の置き方を返す。
 * @param {{ id: string, size?: { w: number, h: number } }} item
 * @returns {{ ax: number, ay: number, s: number, bw: number, bh: number, flip: boolean, ownShadow?: boolean, cu?: number, cv?: number }}
 *   ownShadow が true なら、地面のレイヤーは その絵の影を描かない。
 *   cu・cv があれば、建物のまん中は 置いたマスから (cu, cv) の所（無ければ敷地のまん中）
 */
export function itemFit(item) {
  const row = item ? FIT[item.id] : null;
  if (row) return { ax: row[0], ay: row[1], s: row[2], bw: row[3], bh: row[4], flip: row[5] === 1 };
  const base = item ? KIT_BASE[item.id] : null;
  if (base) {
    const w = item.size?.w || 1;
    const h = item.size?.h || 1;
    const fit = { ax: 0, ay: -50, s: 0.16 * (w + h), bw: base[0], bh: base[1], flip: false, ownShadow: base[2] === 1 };
    if (base.length > 3) { fit.cu = base[3]; fit.cv = base[4]; }
    return fit;
  }
  if (item && item.size) {
    // どちらの表にも無い大きなもの（絵を足して、表に足し忘れたとき）: 足もとが 88% の ひし形の絵だとして置く
    const side = Math.min(item.size.w, item.size.h);
    return { ax: 0, ay: -47, s: (0.94 * 32 * side) / 88, bw: side * 0.94, bh: side * 0.94, flip: false };
  }
  return DEFAULT_ONE;
}

/** 表に載っている id（テスト用） */
export const FITTED_ITEM_IDS = Object.freeze([...Object.keys(FIT), ...Object.keys(KIT_BASE)]);

/** 新しい絵がらの建物の、足もとの大きさの表（テスト用） */
export const KIT_BASE_SIZES = Object.freeze(KIT_BASE);
