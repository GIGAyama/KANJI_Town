import React, { memo } from 'react';
import { WILD_PROP_BOX, wildPropsMarkup } from '../../data/wild-props-art';

// まだ ひらいていない土地（森林・荒れ地・岩盤）に立つ、木や岩の絵。
// 地面（TerrainLayer）は建物より下に描くので、立っているものは建物と同じ重なり順で
// 1 マスずつ置く。絵は文書に 1 回だけ置き、マスでは <use> で呼びだす（1 マス 2 要素）。
// 絵そのものは data/wild-props-art.js にある。

export { WILD_PROP_BOX, wildPropFor } from '../../data/wild-props-art';

const HOLDER_ID = 'town-wild-props';

/** 絵のおおもとを、文書に 1 回だけ置く（display:none だと <use> が切れるので大きさ 0 にする） */
export function mountWildProps(doc = globalThis.document) {
  if (!doc || !doc.body || doc.getElementById(HOLDER_ID)) return;
  const holder = doc.createElement('div');
  holder.innerHTML = `<svg id="${HOLDER_ID}" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">${wildPropsMarkup()}</svg>`;
  doc.body.appendChild(holder.firstChild);
}

export const WildProp = memo(({ name }) => (
  <svg width={WILD_PROP_BOX.width} height={WILD_PROP_BOX.height} style={{ display: 'block', overflow: 'visible' }}>
    <use href={`#wp-${name}`} />
  </svg>
));
