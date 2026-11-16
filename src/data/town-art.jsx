// 町マップ用の建物の絵の読みこみ — マイ漢字タウン
//
// 建物の絵（src/data/iso-svg/）は大きいので、町を描くまで読まない。town-items.jsx は
// 絵を React.lazy で包んでいて、もちもの欄や図鑑などは <Suspense> の中でそれを使う。
//
// 町マップでは lazy を使わない。lazy の部品は「はじめて描くとき」に必ず 1 回 待ちになり
// （絵の束が読みこみずみでも）、いちばん近い <Suspense> の中身がまるごと「よみこみ中」に
// 切りかわる。まちづくりでは、新しい種類の建物を置くたびに画面全体が一瞬 消えていた。
// ここでは絵の束を 1 回だけ読み、読めたら名前で部品を引いて そのまま描く（待ちにならない）。

import React, { memo, useEffect, useState } from 'react';

let artModule = null;
let loading = null;
const components = new Map();

/** 絵の束を読みはじめる（何度呼んでも読むのは 1 回） */
export function loadTownArt() {
  if (!loading) {
    loading = import('./iso-svg.js').then((module) => {
      artModule = module;
      return module;
    });
  }
  return loading;
}

/**
 * そのアイテムの絵の部品を返す。絵の束がまだ読めていなければ null。
 * 部品は memo で包み、町マップを描き直しても同じ建物の図形を計算しなおさない。
 * @param {{ svg?: { svgName?: string } }} item town-items.jsx のアイテム
 */
export function townArtFor(item) {
  const name = item?.svg?.svgName;
  if (!artModule || !name) return null;
  let component = components.get(name);
  if (!component) {
    if (!artModule[name]) return null;
    component = memo(artModule[name]);
    components.set(name, component);
  }
  return component;
}

/** 絵の束が読めたら true になる（読めたときに 1 回だけ描き直す） */
export function useTownArtReady() {
  const [ready, setReady] = useState(artModule !== null);
  useEffect(() => {
    if (ready) return undefined;
    let alive = true;
    loadTownArt().then(() => { if (alive) setReady(true); }).catch(() => {});
    return () => { alive = false; };
  }, [ready]);
  return ready;
}

/**
 * アイテムの絵 1 枚（もちもの欄・クラフトの見本用）。
 * 絵の束が読めていれば そのまま描く。まだなら lazy の部品に任せる（<Suspense> の中で使うこと）。
 * まちづくりの「もちもの」は 100 種類を超えることがあり、lazy のままだと 1 枚ずつ順に
 * 待ちになって、開くまでに 1 秒以上かかっていた。
 */
export const ItemArt = ({ item, seed }) => {
  const Art = townArtFor(item);
  if (Art) return <Art seed={seed} />;
  const Lazy = item.svg;
  return <Lazy seed={seed} />;
};
