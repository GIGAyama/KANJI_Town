import React, { memo } from 'react';
import {
  villagerArtDef, villagerArtId, villagerHeight, villagerKind, villagerVariantOf,
} from '../../data/villager-art';

// 住民の顔ぶれの絵（住民の一覧・新しい住民の知らせ）。絵そのものは data/villager-art.js にある。
// 絵は文書に「使うときに 1 回だけ」置き、<use> で呼びだす（建物・木と同じ作り）。
// 町を歩く住民は、ここではなく VillagerCanvas.jsx が canvas に描く。

const HOLDER_ID = 'town-villager-art';
const mounted = new Set();

/** その職業・色ちがいの絵を、文書に 1 回だけ置く（display:none だと <use> が切れるので大きさ 0 にする） */
export function ensureVillagerArt(kind, variant, doc = globalThis.document) {
  const id = villagerArtId(kind, variant);
  if (mounted.has(id) || !doc || !doc.body) return;
  let holder = doc.getElementById(HOLDER_ID);
  if (!holder) {
    const box = doc.createElement('div');
    box.innerHTML = `<svg id="${HOLDER_ID}" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs></defs></svg>`;
    holder = box.firstChild;
    doc.body.appendChild(holder);
  }
  mounted.add(id);
  holder.firstChild.insertAdjacentHTML('beforeend', villagerArtDef(kind, variant));
}

/**
 * 住民の顔ぶれを見せる絵（名札なし）。住民の一覧や、新しい住民が生まれた知らせに使う。
 * @param {number} [size] たての大きさ（px）
 */
export const VillagerPortrait = memo(({ occupation, id, variant, size = 40 }) => {
  const kind = villagerKind(occupation);
  const index = Number.isInteger(variant) ? variant : villagerVariantOf(id);
  ensureVillagerArt(kind, index);
  // ぼうし・持ちものが はみ出さないよう、職業ごとの高さに合わせて わくを取る
  const height = villagerHeight(kind) + 5;
  const width = 30;
  return (
    <svg width={(size * width) / height} height={size} viewBox={`-17 ${-(height - 3)} ${width} ${height}`}
      aria-hidden="true" style={{ display: 'block', overflow: 'visible' }}>
      <use href={`#${villagerArtId(kind, index)}`} />
    </svg>
  );
});
