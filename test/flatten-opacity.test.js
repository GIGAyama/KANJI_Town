import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { flattenOpacity } from '../src/data/iso-svg/flatten-opacity.js';
import { BUILDING_ART, BUILDING_ART_NAMES, buildingArt, buildingArtDef } from '../src/data/iso-svg/buildings-art.js';
import { natureArtMarkup } from '../src/data/iso-svg/nature-art.js';
import { houseArtMarkup } from '../src/data/iso-svg/house-art.js';

// 図形に opacity を書くと、ブラウザは その図形 1 つを「別の合成の単位」として扱う。
// 建物 1 つに 20〜90 個あると、建物の多い町を ずらすときの「合成の準備」が その数だけ重くなる
// （建物 600 の町で 1 コマ 183ms → 145ms。CPU を 4 倍おそくして測った）。
// 見た目が同じになる書き方（fill-opacity・stroke-opacity）に そろえてあることを、ここで見る。
// 絵を足して opacity と書いても、絵を渡す所で書きかわる。その通り道を外したときに落ちる。

/** 図形のタグ（<path …>・<circle …>・<ellipse …>）を全部とり出す */
const shapes = (markup) => markup.match(/<(?:path|circle|ellipse)\b[^>]*>/g) || [];
const hasFill = (tag) => !/\sfill="none"/.test(tag);
const hasStroke = (tag) => /\sstroke="(?!none")/.test(tag);
/** opacity が残っている図形（fill-opacity・stroke-opacity は数えない） */
const withOpacity = (markup) => shapes(markup).filter((tag) => /\sopacity="/.test(tag));

test('ぬりだけの図形は fill-opacity に、線だけの図形は stroke-opacity に書きかえる', () => {
  assert.equal(
    flattenOpacity('<path d="M0 0h4v4z" fill="#ffffff" opacity="0.5"/>'),
    '<path d="M0 0h4v4z" fill="#ffffff" fill-opacity="0.5"/>',
  );
  assert.equal(
    flattenOpacity('<path d="M0 0h4" fill="none" stroke="#2b211c" stroke-width="0.8" opacity="0.7"/>'),
    '<path d="M0 0h4" fill="none" stroke="#2b211c" stroke-width="0.8" stroke-opacity="0.7"/>',
  );
  // 属性の順番が ちがっても、うしろに ほかの属性があっても同じ
  assert.equal(
    flattenOpacity('<ellipse cx="1" cy="2" rx="3" ry="4" opacity=".45" fill="#ffffff" transform="rotate(24 1 2)"/>'),
    '<ellipse cx="1" cy="2" rx="3" ry="4" fill-opacity=".45" fill="#ffffff" transform="rotate(24 1 2)"/>',
  );
  // fill を書かない図形は 黒で ぬられる（= ぬりだけ）
  assert.equal(flattenOpacity('<circle cx="0" cy="0" r="2" opacity="0.3"/>'), '<circle cx="0" cy="0" r="2" fill-opacity="0.3"/>');
  // いくつ並んでいても、1 つずつ書きかえる
  const two = flattenOpacity('<path d="M0 0h1v1z" fill="#111111" opacity="0.2"/><path d="M0 0h1" fill="none" stroke="#111111" opacity="0.4"/>');
  assert.equal(withOpacity(two).length, 0);
  assert.ok(two.includes('fill-opacity="0.2"') && two.includes('stroke-opacity="0.4"'));
});

test('ぬりと線の両方を持つ図形・<g>・すでに書きかえてある図形は、そのままにする', () => {
  // 両方: 線の内がわ半分が ぬりに重なるので、別々に うすめると色が変わってしまう
  const both = '<circle cx="0" cy="0" r="2" fill="#7be08a" stroke="#2b211c" stroke-width="0.5" opacity="0.7"/>';
  assert.equal(flattenOpacity(both), both);
  const group = '<g opacity="0.5"><path d="M0 0h1v1z" fill="#111111"/></g>';
  assert.equal(flattenOpacity(group), group);
  const done = '<path d="M0 0h1v1z" fill="#111111" fill-opacity="0.5"/><path d="M0 0h1" fill="none" stroke="#111111" stroke-opacity="0.5"/>';
  assert.equal(flattenOpacity(done), done);
  // ぬりも線も無い図形（見えない）は さわらない
  const empty = '<path d="M0 0h1" fill="none" opacity="0.5"/>';
  assert.equal(flattenOpacity(empty), empty);
  assert.equal(flattenOpacity(''), '');
});

test('建物の絵: opacity が残るのは、ぬりと線の両方を持つ図形だけ（色ちがいも）', () => {
  let rewritten = 0;
  let left = 0;
  for (const name of BUILDING_ART_NAMES) {
    const count = BUILDING_ART[name].variants || 1;
    for (let variant = 0; variant < count; variant++) {
      const art = buildingArt(name, variant);
      for (const tag of withOpacity(art)) {
        assert.ok(hasFill(tag) && hasStroke(tag), `${name}-${variant}: 書きかえられる opacity が残っている → ${tag.slice(0, 120)}`);
        left++;
      }
      assert.ok(!/<g\b[^>]*\sopacity=/.test(art), `${name}-${variant}: <g> に opacity（中の図形の数だけ重くなる。図形の側に書く）`);
      rewritten += (art.match(/\s(?:fill|stroke)-opacity="/g) || []).length;
      // 文書に置く形（<defs> に入れる文字列）も同じ絵
      assert.ok(buildingArtDef(name, variant).includes(art), `${name}-${variant}: 文書に置く絵が、書きかえる前の絵`);
    }
  }
  assert.ok(rewritten > 1000, `書きかえた数 ${rewritten}`);
  // 残る分は 合成の単位を 1 つずつ増やす。増えてきたら、絵の側で ぬりと線を分けて描く
  assert.ok(left <= 12, `opacity のまま残る図形が ${left} 個`);
});

test('JSX で描く絵（平らなアイテムの見本）に、図形の opacity は無い', () => {
  // こちらは React が そのまま描くので、書きかえの通り道が無い。うすい色は fillOpacity・strokeOpacity と書く。
  // （井戸・ベンチ・車などの小さなものは、建物と同じ文字列の絵になった。上の建物のテストが いっしょに見る）
  for (const file of ['structures.jsx', 'terrain.jsx', 'nature.jsx', 'buildings.jsx']) {
    const source = readFileSync(new URL(`../src/data/iso-svg/${file}`, import.meta.url), 'utf8');
    const lines = source.split('\n').map((line, i) => [i + 1, line]).filter(([, line]) => /\sopacity=/.test(line));
    assert.deepEqual(lines.map(([no]) => no), [], `${file}: opacity と書いた行`);
  }
});

test('木・花・岩と「小さな家」の絵: 図形の opacity は残っていない', () => {
  for (const [label, markup] of [['自然物', natureArtMarkup()], ['小さな家', houseArtMarkup()]]) {
    assert.deepEqual(withOpacity(markup).map((tag) => tag.slice(0, 100)), [], `${label}: opacity が残っている`);
    assert.ok(!/<g\b[^>]*\sopacity=/.test(markup), `${label}: <g> に opacity`);
    assert.ok((markup.match(/\s(?:fill|stroke)-opacity="/g) || []).length > 50, `${label}: 書きかえた跡が無い`);
  }
});
