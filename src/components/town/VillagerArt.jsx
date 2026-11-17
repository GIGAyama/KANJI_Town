import React, { memo } from 'react';
import {
  VILLAGER_BOX, VILLAGER_SCALE, villagerArtDef, villagerArtId, villagerHeight, villagerKind, villagerTop, villagerVariantOf,
} from '../../data/villager-art';

// 住民の絵を画面に出す部品。絵そのものは data/villager-art.js にある。
// 絵は文書に「使うときに 1 回だけ」置き、住民 1 人は <use> で呼びだす（建物・木と同じ作り）。

const HOLDER_ID = 'town-villager-art';
const INK = '#2b211c';
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

const n = (v) => Math.round(v * 100) / 100;

/** 名札（角の丸い ふだ + 下向きの とがり）の形。top は ぼうしの いちばん上の高さ */
const tagPaths = new Map();
function tagPath(top) {
  let d = tagPaths.get(top);
  if (!d) {
    const y1 = n(-(top + 3)); // ふだの下
    const y0 = n(y1 - 13.2); // ふだの上
    d = `M-3.5 ${y0}H3.5A4 4 0 0 1 7.5 ${n(y0 + 4)}V${n(y1 - 4)}A4 4 0 0 1 3.5 ${y1}H2.1L0 ${n(y1 + 2.4)}L-2.1 ${y1}H-3.5A4 4 0 0 1 -7.5 ${n(y1 - 4)}V${n(y0 + 4)}A4 4 0 0 1 -3.5 ${y0}Z`;
    tagPaths.set(top, d);
  }
  return d;
}

const FACE_LEFT = `scale(${VILLAGER_SCALE})`;
const FACE_RIGHT = `scale(${-VILLAGER_SCALE} ${VILLAGER_SCALE})`;

/**
 * 町を歩く住民 1 人の絵（体 + 頭の上の名札）。
 * 左右の向きは、体だけを うら返す（名札の漢字は うら返さない）。
 * @param {{ occupation?: string, id?: string, kanjiChar?: string }} villager
 */
export const VillagerFigure = memo(({ occupation, id, char, facesRight }) => {
  const kind = villagerKind(occupation);
  const variant = villagerVariantOf(id);
  ensureVillagerArt(kind, variant);
  const top = villagerTop(kind);
  return (
    <svg width={VILLAGER_BOX.width} height={VILLAGER_BOX.height}
      viewBox={`${VILLAGER_BOX.x} ${VILLAGER_BOX.y} ${VILLAGER_BOX.width} ${VILLAGER_BOX.height}`}
      style={{ display: 'block', overflow: 'visible' }}>
      <use href={`#${villagerArtId(kind, variant)}`} transform={facesRight ? FACE_RIGHT : FACE_LEFT} />
      {char && (
        <>
          <path d={tagPath(top)} fill="#fffdf5" stroke={INK} strokeWidth="0.9" strokeLinejoin="round" />
          <text x="0" y={n(-(top + 5.7))} textAnchor="middle" fontSize="10.5" fontWeight="900" fill={INK}>{char}</text>
        </>
      )}
    </svg>
  );
});

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
