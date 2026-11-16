import React, { memo } from 'react';
import { GRID_SIZE, TILE_W, TILE_H } from '../../systems/town-map-view';
import { chunkSignature, chunksInRange } from '../../systems/town-ground';
import { paintChunk } from '../../systems/town-ground-paint';

// 町の地面（地形・道・水・がけ・雲・影）を 1 枚の SVG に描く。
//
// 以前は 1 マスごとに div と svg を作っていた（地面だけで 1 マス 7 要素）。ここでは
// かたまり（5×5 マス）ごとに、同じ色の図形を 1 本の path にまとめた文字列を作って置く。
// 絵は かたまりの中身（と まわり 1 マス）だけで決まるので、同じなら作りなおさない。

/** 描いた かたまりの絵をおぼえておく数（町を行き来しても作りなおさない） */
const CACHE_LIMIT = 400;
const cache = new Map();

function chunkArt(model, cx, cy, danger, grid) {
  const signature = chunkSignature(model, cx, cy);
  if (!signature) return null;
  const key = `${cx},${cy}|${danger ? 1 : 0}${grid ? 1 : 0}|${signature}`;
  let art = cache.get(key);
  if (!art) {
    art = paintChunk(model, cx, cy, { danger, grid });
    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value);
    cache.set(key, art);
  }
  return art;
}

/** がけと雲が、マップのひし形より下へ はみ出す分 */
const SKIRT = 80;
const WIDTH = GRID_SIZE * TILE_W;
const HEIGHT = GRID_SIZE * TILE_H;
const LAYERS = ['under', 'ground', 'shadow', 'over'];

const TerrainLayer = memo(({ model, viewRange, danger = false, grid = false }) => {
  const arts = [];
  for (const chunk of chunksInRange(viewRange)) {
    const art = chunkArt(model, chunk.cx, chunk.cy, danger, grid);
    if (art) arts.push({ key: chunk.key, art });
  }
  return (
    <svg aria-hidden="true" width={WIDTH} height={HEIGHT + SKIRT}
      viewBox={`${-WIDTH / 2} 0 ${WIDTH} ${HEIGHT + SKIRT}`}
      style={{ position: 'absolute', left: -WIDTH / 2, top: 0, zIndex: 0, pointerEvents: 'none', display: 'block', overflow: 'visible' }}>
      {LAYERS.map((layer) => (
        <g key={layer}>
          {arts.map(({ key, art }) => (art[layer]
            ? <g key={key} dangerouslySetInnerHTML={{ __html: art[layer] }} />
            : null))}
        </g>
      ))}
    </svg>
  );
});

export default TerrainLayer;
