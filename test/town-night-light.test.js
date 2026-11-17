import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LAMP_LIGHTS, nightLightOf } from '../src/systems/town-night-light.js';
import { BUILDING_ART, buildingArt } from '../src/data/iso-svg/buildings-art.js';
import { natureArt } from '../src/data/iso-svg/nature-art.js';
import { artBounds } from '../src/data/iso-svg/scale-art.js';

// 夜のあかりは、絵とは別の表（高さ px）で置く。絵を描き直して大きさが変わると、あかりだけが
// 元の高さに残って、ものの上に浮く（エラーにはならない）。絵の高さと 表を ここで つき合わせる。

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const ITEMS = new Map([...read('../src/data/town-items.jsx').matchAll(/^\s*\{ id: '(t_\w+)',\s*svg: lazySvg\('(\w+)'\),(.*)\},?\s*$/gm)].map((m) => {
  const size = /size: \{ w: (\d+), h: (\d+) \}/.exec(m[3]);
  return [m[1], {
    id: m[1],
    type: /type: '(\w+)'/.exec(m[3])?.[1],
    isoHeight: Number(/isoHeight: (\d+)/.exec(m[3])?.[1] || 0),
    size: size ? { w: Number(size[1]), h: Number(size[2]) } : undefined,
  }];
}));

/** 絵の 1 単位は、町の拡大率 1 のとき 0.8px（建物の絵も、木などの絵も同じ） */
const PX = 0.8;
/** 木などの絵（nature-art.js）で あかりを持つもの。原点はマスの手前の頂点で、マスのまん中は (0, -20) */
const NATURE_LAMPS = { t_signal: 'signal-0' };

/** その絵の いちばん上の高さ（px。足もとのまん中から） */
function artTop(itemId) {
  const nature = NATURE_LAMPS[itemId];
  if (nature) return (-artBounds(natureArt(nature)).minY - 20) * PX;
  const name = itemId.slice(2);
  assert.ok(BUILDING_ART[name], `${itemId} の絵が無い`);
  assert.deepEqual(BUILDING_ART[name].size, [1, 1], `${itemId}: 1 マスの絵として測っている`);
  return -artBounds(buildingArt(name, 0)).minY * PX;
}

test('あかりを持つ 小さなもの: あかりは 絵の中（高さの 4〜9 割）にある', () => {
  assert.ok(Object.keys(LAMP_LIGHTS).length >= 7);
  for (const [id, lamp] of Object.entries(LAMP_LIGHTS)) {
    assert.ok(ITEMS.has(id), `${id} というアイテムが無い`);
    const top = artTop(id);
    assert.ok(lamp.lift >= top * 0.4 && lamp.lift <= top * 0.9, `${id}: あかりの高さ ${lamp.lift}px が、絵の高さ ${top.toFixed(1)}px と合わない`);
    // 左右の ずれは、マスの中に収まる
    assert.ok(Math.abs(lamp.dx || 0) <= 12, `${id}: dx`);
    const light = nightLightOf(id, ITEMS.get(id));
    assert.deepEqual(light, { width: 34, height: 30, lift: lamp.lift, dx: lamp.dx || 0 });
  }
});

test('あかりを持つ 小さなものは、左右を うら返して置かれない（うら返ると dx が逆になる）', () => {
  const source = read('../src/data/town-items.jsx');
  for (const id of Object.keys(LAMP_LIGHTS)) {
    const line = source.split('\n').find((l) => l.includes(`id: '${id}'`));
    assert.ok(line && !line.includes('hasVariants'), `${id}: 向きがえ（hasVariants）のあるものに dx は使えない`);
  }
});

test('建物は 窓のあかりが つき、道・庭・木などは つかない', () => {
  const shop = nightLightOf('t_shop', ITEMS.get('t_shop'));
  assert.ok(shop && shop.width >= 30 && shop.height >= 22 && shop.dx === 0);
  assert.ok(shop.lift > 8 && shop.lift <= 8 + 40 * 0.28);
  // 建物が敷地のまん中から ずれている絵は、建物のまん中で光る
  const school = nightLightOf('t_school', ITEMS.get('t_school'));
  assert.ok(school.cu > 0 && school.cv > 0, '学校のあかりは校舎の場所');
  assert.ok(school.width > shop.width);
  for (const id of ['t_road', 't_bridge', 't_well', 't_garden', 't_tree', 't_bench', 't_car', 't_grassland', 't_fountain']) {
    assert.equal(nightLightOf(id, ITEMS.get(id)), null, id);
  }
  assert.equal(nightLightOf('t_nothing', undefined), null);
  assert.equal(nightLightOf('t_shop', null), null);
});

test('町マップは、この表から あかりを作る', () => {
  const map = read('../src/components/town/DraggableTownMap.jsx');
  assert.match(map, /import \{ nightLightOf \} from '\.\.\/\.\.\/systems\/town-night-light'/);
  assert.match(map, /\+ light\.dx - light\.width \/ 2/);
});
