// 夜のあかり — マイ漢字タウン
//
// 夜は町ぜんたいに暗い色を 1 枚かぶせ、その上に 建物の窓や街灯のあかりを、ぼんやりした丸として重ねる
// （描くのは components/town/DraggableTownMap.jsx）。ここは「どのアイテムが・どこに・どの大きさで光るか」を決める。
// 建物 1 つにつき要素 1 つで、動かさない（以前は建物ごとに CSS の filter をかけていて、建物が多い町の夜は重かった）。

import { itemFit } from '../data/town-item-fit.js';

/**
 * あかりを持つ 小さなもの。lift は「足もとのまん中」から あかりの まん中までの高さ、dx は左右の ずれ
 * （どちらも px・町の拡大率 1 のとき。絵の 1 単位は 0.8px）。
 * 絵（iso-svg/props-art.js・nature-art.js）の あかりの場所に合わせてある。
 * ⚠️ 絵の大きさを変えたら、ここも直すこと。前は どれも 22 で、小さく描き直した自動販売機の上に
 *    あかりが浮いた（test/town-night-light.test.js が、あかりが絵の中に入っているかを見る）。
 */
export const LAMP_LIGHTS = Object.freeze({
  t_street_light: { lift: 21, dx: 5 },
  t_stone_lantern: { lift: 11 },
  t_signal: { lift: 19 },
  t_vending_machine: { lift: 8 },
  t_festival_stage: { lift: 22 },
  t_phone_booth: { lift: 8 },
  t_bus_stop: { lift: 14 },
});

/** 窓のあかりが つく種類（建物） */
const LIT_TYPES = new Set(['building', 'mega', 'rare', 'special']);
/** 建物の種類でも、あかりの つかないもの（道・橋・庭・像など） */
const UNLIT_ITEMS = new Set(['t_road', 't_bridge', 't_wall', 't_fence', 't_well', 't_mine', 't_garden', 't_zen_garden', 't_pool', 't_park', 't_torii', 't_dragon', 't_monument', 't_perfect_monument', 't_brick', 't_asphalt', 't_crosswalk', 't_railway', 't_stone_path']);

/**
 * そのアイテムの あかり（無ければ null）。位置は「足もとのまん中」からの ずれ。
 * @param {string} itemId
 * @param {{ type?: string, isoHeight?: number, size?: { w: number, h: number } } | null | undefined} item
 * @returns {{ width: number, height: number, lift: number, dx: number, cu?: number, cv?: number } | null}
 *   cu・cv: 建物が敷地のまん中から ずれているとき（学校の校舎は敷地の奥、など）の、建物のまん中
 */
export function nightLightOf(itemId, item) {
  if (!item) return null;
  const lamp = LAMP_LIGHTS[itemId];
  if (lamp) return { width: 34, height: 30, lift: lamp.lift, dx: lamp.dx || 0 };
  if (!LIT_TYPES.has(item.type) || UNLIT_ITEMS.has(itemId)) return null;
  const fit = itemFit(item);
  const span = (fit.bw + fit.bh) * 20;
  return { width: Math.max(30, span * 1.5), height: Math.max(22, span * 0.95), lift: 8 + Math.min(item.isoHeight || 20, 40) * 0.28, dx: 0, cu: fit.cu, cv: fit.cv };
}
