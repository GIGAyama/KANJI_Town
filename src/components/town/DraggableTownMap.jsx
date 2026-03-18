import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, ZoomIn, ZoomOut } from 'lucide-react';
import { TOWN_ITEMS } from '../../data/town-items';
import { BIOME_TYPES, BIOME_TERRAIN_COLORS } from '../../data/biomes';
import VillagerDot from './VillagerDot';

// ── アイソメトリック定数 ──
const TILE_W = 64;
const TILE_H = 32;
const GRID_SIZE = 50;
const C = 25; // マップ中心

// 開拓可能な地形
const CULTIVATABLE_TERRAIN = new Set(['t_roughland', 't_grassland', 't_forest_floor', 't_sand', 't_highland']);

// ── 座標変換 ──
const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);
const fromIso = (sx, sy) => ({
  x: Math.round((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2),
  y: Math.round((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2),
});

// ── 地形ダイヤモンドタイル色 ──
const TERRAIN_COLORS = {
  t_bedrock:      { top: '#1e293b', left: '#0f172a', right: '#334155' },
  t_roughland:    { top: '#92400e', left: '#78350f', right: '#a16207' },
  t_cleared:      { top: '#d4a96a', left: '#b8915a', right: '#e8c08a' },
  t_weed:         { top: '#84cc16', left: '#65a30d', right: '#a3e635' },
  t_grassland:    { top: '#86efac', left: '#4ade80', right: '#bbf7d0' },
  t_forest_floor: { top: '#166534', left: '#052e16', right: '#15803d' },
  t_sand:         { top: '#fde68a', left: '#fbbf24', right: '#fef3c7' },
  t_shallow_water:{ top: '#7dd3fc', left: '#38bdf8', right: '#bae6fd' },
  t_highland:     { top: '#a8a29e', left: '#78716c', right: '#d6d3d1' },
};

// バイオームによる色調整
const getBiomeTint = (itemId, biome) => {
  if (!biome || !itemId) return null;
  const colors = BIOME_TERRAIN_COLORS[biome];
  if (!colors) return null;
  const key = itemId.replace(/^t_/, '');
  return colors[key] || null;
};

// ── 地形ダイヤモンドSVG ──
const GroundDiamond = React.memo(({ colors, tint, isEditing, isCultivatable, cultivateCost }) => {
  const top = tint || colors?.top || '#d4a96a';
  const left = colors?.left || '#b8915a';
  const right = colors?.right || '#e8c08a';
  return (
    <svg viewBox="0 0 64 34" width={TILE_W} height={TILE_H + 2} style={{ display: 'block' }}>
      {/* 地面ダイヤモンド（立体感：上面・左面・右面） */}
      <polygon points="32,0 64,16 32,32 0,16" fill={top} />
      {/* 左側面（わずかな厚み） */}
      <polygon points="0,16 32,32 32,34 0,18" fill={left} opacity="0.6" />
      {/* 右側面 */}
      <polygon points="32,32 64,16 64,18 32,34" fill={right} opacity="0.6" />
      {/* グリッド線 */}
      <polygon points="32,0 64,16 32,32 0,16" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
      {/* 開拓ホバー */}
      {isEditing && isCultivatable && (
        <polygon points="32,0 64,16 32,32 0,16" fill="rgba(245,158,11,0.3)" className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </svg>
  );
});

// ── メインコンポーネント ──
const DraggableTownMap = ({ mapData, biomeMap, isDanger, isEditing, onCellTap, reviewCount, kakejikuImg, villagers = [], exploredRadius = 3 }) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 600 });
  const [zoom, setZoom] = useState(0.85);
  const centerIsoY = toIsoY(C, C);
  const [offset, setOffset] = useState({ x: 0, y: -centerIsoY + 300 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const onCellTapRef = useRef(onCellTap);
  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  // コンテナサイズ監視
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const safeMapData = mapData || {};
  const safeBiomeMap = biomeMap || {};

  // ── ドラッグ操作 ──
  const handlePointerDown = (e) => {
    isDragging.current = false;
    lastPos.current = { x: e.clientX || e.touches?.[0]?.clientX || 0, y: e.clientY || e.touches?.[0]?.clientY || 0 };
  };
  const handlePointerMove = (e) => {
    if (!lastPos.current.x) return;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const dx = clientX - lastPos.current.x;
    const dy = clientY - lastPos.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging.current = true;
    if (isDragging.current) {
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: clientX, y: clientY };
    }
  };
  const handlePointerUp = useCallback((e, cx, cy) => {
    if (!isDragging.current && onCellTapRef.current) onCellTapRef.current(cx, cy);
    lastPos.current = { x: 0, y: 0 };
  }, []);

  // ── ズーム ──
  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, z - 0.15));

  // ── ビューポートカリング ──
  const viewRange = useMemo(() => {
    const margin = 4;
    const vl = -offset.x / zoom - TILE_W;
    const vt = -offset.y / zoom - 100;
    const vr = (-offset.x + containerSize.w) / zoom + TILE_W;
    const vb = (-offset.y + containerSize.h) / zoom + 100;
    const corners = [fromIso(vl, vt), fromIso(vr, vt), fromIso(vl, vb), fromIso(vr, vb)];
    const xs = corners.map(c => c.x);
    const ys = corners.map(c => c.y);
    return {
      startX: Math.max(0, Math.min(...xs) - margin),
      startY: Math.max(0, Math.min(...ys) - margin),
      endX: Math.min(GRID_SIZE - 1, Math.max(...xs) + margin),
      endY: Math.min(GRID_SIZE - 1, Math.max(...ys) + margin),
    };
  }, [offset.x, offset.y, containerSize.w, containerSize.h, zoom]);

  // ── メガ建築アンカー ──
  const megaAnchors = useMemo(() => {
    const anchors = {};
    const subCells = new Set();
    for (const [key, itemId] of Object.entries(safeMapData)) {
      if (!itemId || typeof itemId !== 'string') continue;
      const item = TOWN_ITEMS.find(i => i.id === itemId);
      if (item && item.size) {
        const [ax, ay] = key.split(',').map(Number);
        anchors[key] = { item, ax, ay, w: item.size.w, h: item.size.h };
        for (let dy = 0; dy < item.size.h; dy++) {
          for (let dx = 0; dx < item.size.w; dx++) {
            if (dx === 0 && dy === 0) continue;
            subCells.add(`${ax + dx},${ay + dy}`);
          }
        }
      }
    }
    return { anchors, subCells };
  }, [safeMapData]);

  // ── ゴースト（レビュー未完了時の演出） ──
  const ghosts = useMemo(() => {
    if (!isDanger || isEditing) return [];
    const exploredKeys = Object.keys(safeMapData).filter(k => {
      const [x, y] = k.split(',').map(Number);
      return Math.max(Math.abs(x - C), Math.abs(y - C)) <= exploredRadius;
    });
    if (exploredKeys.length === 0) return [{ x: C, y: C }];
    const seed = (reviewCount || 0) * 7919;
    const seededRand = (i) => { let x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    return Array.from({ length: Math.min(reviewCount || 0, 8) }, (_, i) => {
      const k = exploredKeys[Math.floor(seededRand(i) * exploredKeys.length)];
      const [x, y] = k.split(',').map(Number); return { x, y };
    });
  }, [isDanger, isEditing, reviewCount, exploredRadius, safeMapData]);

  // ── セル描画 ──
  const cells = useMemo(() => {
    const result = [];
    const { startX, startY, endX, endY } = viewRange;
    // Y+X順でソート（奥から手前へ描画）
    const cellList = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        cellList.push({ x, y, depth: x + y });
      }
    }
    cellList.sort((a, b) => a.depth - b.depth);

    for (const { x, y, depth } of cellList) {
      const key = `${x},${y}`;
      const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
      const isVisible = dist <= exploredRadius;
      const itemId = safeMapData[key];
      const item = itemId ? TOWN_ITEMS.find(i => i.id === itemId) : null;
      const hasGhost = ghosts.some(g => g.x === x && g.y === y);
      const isTerrain = item && item.type === 'terrain';
      const biome = safeBiomeMap[key];
      const biomeTint = getBiomeTint(itemId, biome);

      if (megaAnchors.subCells.has(key)) continue;

      const isoX = toIsoX(x, y);
      const isoY = toIsoY(x, y);
      const isoHeight = item?.isoHeight || 0;

      const tileStyle = {
        position: 'absolute',
        left: isoX - TILE_W / 2,
        top: isoY - isoHeight,
        width: TILE_W,
        zIndex: depth,
      };

      // フォグ（未探索）
      if (!isVisible) {
        result.push(
          <div key={key} style={{ ...tileStyle, top: isoY, height: TILE_H }}>
            <svg viewBox="0 0 64 32" width={TILE_W} height={TILE_H} style={{ display: 'block' }}>
              <polygon points="32,0 64,16 32,32 0,16" fill="#0f172a" />
            </svg>
          </div>
        );
        continue;
      }

      // 岩盤
      if (itemId === 't_bedrock') {
        result.push(
          <div key={key} style={{ ...tileStyle, top: isoY, height: TILE_H }}>
            <GroundDiamond colors={TERRAIN_COLORS.t_bedrock} tint={null} isEditing={false} />
          </div>
        );
        continue;
      }

      // メガ建築のアンカーセル
      const megaInfo = megaAnchors.anchors[key];
      if (megaInfo) {
        const mw = megaInfo.w;
        const mh = megaInfo.h;
        const megaH = megaInfo.item.isoHeight || 48;
        // メガ建築の中心位置を計算
        const megaCenterX = toIsoX(x + mw / 2 - 0.5, y + mh / 2 - 0.5);
        const megaCenterY = toIsoY(x + mw / 2 - 0.5, y + mh / 2 - 0.5);
        const megaStyle = {
          position: 'absolute',
          left: megaCenterX - TILE_W * mw / 2,
          top: megaCenterY - megaH,
          width: TILE_W * mw,
          height: TILE_H * mh + megaH,
          zIndex: depth + mw + mh,
        };
        result.push(
          <div key={key} style={megaStyle}
            onPointerUp={(e) => handlePointerUp(e, x, y)}
            className={`flex items-center justify-center select-none ${isEditing ? 'cursor-pointer' : ''}`}>
            <megaInfo.item.svg />
          </div>
        );
        continue;
      }

      // 開拓可能な地形
      if (CULTIVATABLE_TERRAIN.has(itemId)) {
        const terrainColors = TERRAIN_COLORS[itemId] || TERRAIN_COLORS.t_roughland;
        result.push(
          <div key={key} style={{ ...tileStyle, top: isoY, height: TILE_H + 2 }}
            onPointerUp={(e) => handlePointerUp(e, x, y)}
            className={`select-none group ${isEditing ? 'cursor-pointer' : ''}`}>
            <GroundDiamond colors={terrainColors} tint={biomeTint} isEditing={isEditing} isCultivatable={true} cultivateCost={item?.cultivateCost || 5} />
            {isEditing && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                <span className="text-[8px] font-black text-white bg-amber-600/80 px-1.5 py-0.5 rounded-full whitespace-nowrap">開拓 -{item?.cultivateCost || 5}💰</span>
              </div>
            )}
          </div>
        );
        continue;
      }

      // 浅瀬
      if (itemId === 't_shallow_water') {
        result.push(
          <div key={key} style={{ ...tileStyle, top: isoY, height: TILE_H + 2 }}>
            <GroundDiamond colors={TERRAIN_COLORS.t_shallow_water} tint={biomeTint} isEditing={false} />
          </div>
        );
        continue;
      }

      // 通常セル（更地・建物・雑草）
      const terrainColors = TERRAIN_COLORS[itemId] || TERRAIN_COLORS.t_cleared;
      const clearedTint = getBiomeTint(itemId, biome) || getBiomeTint('t_cleared', biome);
      const groundColors = isTerrain ? terrainColors : TERRAIN_COLORS.t_cleared;

      result.push(
        <div key={key} style={{ ...tileStyle, top: isoY - isoHeight, height: TILE_H + isoHeight + 2 }}
          onPointerUp={(e) => handlePointerUp(e, x, y)}
          className={`select-none ${isEditing ? 'cursor-pointer' : ''} ${isDanger && !isEditing ? 'brightness-75' : ''}`}>
          {/* 地面ダイヤモンド（建物の下に描画） */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: TILE_W }}>
            <GroundDiamond colors={groundColors} tint={clearedTint} isEditing={isEditing && !item} />
          </div>
          {/* 建物SVG */}
          <AnimatePresence mode="popLayout">
            {item && item.id === 't_kakejiku' ? (
              <motion.div key="kk" initial={{ scale: 0, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }}
                className="absolute inset-0 flex items-center justify-center z-10"
                style={{ bottom: 2 }}>
                <div className="w-[70%] h-[80%] bg-[#f5e6d3] border-x-[3px] border-y-2 border-amber-900 rounded-sm shadow-md flex items-center justify-center">
                  {kakejikuImg ? <img src={kakejikuImg} className="w-[75%] h-[75%] object-contain mix-blend-multiply opacity-80 pointer-events-none" alt="kakejiku" /> : <span className="text-[10px] text-amber-900 font-bold opacity-50">書</span>}
                </div>
              </motion.div>
            ) : item && !isTerrain ? (
              <motion.div key={itemId} initial={{ scale: 0.3, y: -60, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 12, mass: 0.8 }}
                className="absolute inset-0 flex items-end justify-center"
                style={{ bottom: 2 }}>
                <div style={{ width: TILE_W, height: TILE_H + isoHeight }}>
                  <item.svg />
                </div>
              </motion.div>
            ) : item && item.id === 't_weed' ? (
              <motion.div key="weed" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                className="absolute inset-0 flex items-end justify-center" style={{ bottom: 4 }}>
                <div style={{ width: TILE_W * 0.7, height: TILE_H * 0.7 }}>
                  <item.svg />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {/* ゴースト */}
          {hasGhost && (
            <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2 }}
              className="absolute z-20 text-2xl drop-shadow-lg pointer-events-none select-none"
              style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}>👻</motion.div>
          )}
        </div>
      );
    }
    return result;
  }, [safeMapData, safeBiomeMap, ghosts, isDanger, isEditing, kakejikuImg, exploredRadius, viewRange, megaAnchors, handlePointerUp]);

  // バイオーム表示
  const centerBiome = useMemo(() => {
    const sx = (-offset.x + containerSize.w / 2) / zoom;
    const sy = (-offset.y + containerSize.h / 2) / zoom;
    const g = fromIso(sx, sy);
    const biomeId = safeBiomeMap[`${g.x},${g.y}`];
    return biomeId ? BIOME_TYPES[biomeId] : null;
  }, [offset.x, offset.y, containerSize.w, containerSize.h, zoom, safeBiomeMap]);

  return (
    <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={() => { lastPos.current = { x: 0, y: 0 }; }}
      onPointerLeave={() => { lastPos.current = { x: 0, y: 0 }; }}
      className={`w-full h-full rounded-[16px] overflow-hidden transition-colors duration-1000 ${isDanger && !isEditing ? 'bg-slate-900' : 'bg-sky-200'} border-[3px] border-[var(--text)] shadow-inner relative touch-none`}>
      {/* 天候アイコン */}
      <AnimatePresence>
        {!isDanger || isEditing
          ? <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-4 right-4 animate-spin-slow pointer-events-none z-30"><Sun size={50} className="text-amber-400 drop-shadow-md" fill="currentColor" /></motion.div>
          : null
        }
      </AnimatePresence>
      {/* バイオーム表示 */}
      {centerBiome && !isEditing && (
        <div className="absolute top-2 left-2 bg-[var(--panel)]/80 border-[2px] border-[var(--text)] rounded-xl px-3 py-1 text-[10px] font-bold text-[var(--text)] pointer-events-none z-40 flex items-center gap-1">
          <span>{centerBiome.emoji}</span><span>{centerBiome.name}</span>
        </div>
      )}
      {/* ズームボタン */}
      {isEditing && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40">
          <button onClick={handleZoomIn} className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomIn size={18} /></button>
          <button onClick={handleZoomOut} className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomOut size={18} /></button>
        </div>
      )}
      {/* アイソメトリックマップ */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}>
        {cells}
      </div>
      {/* 住民オーバーレイ */}
      {villagers.slice(0, 20).map(v => (
        <VillagerDot key={v.id} villager={v} mapData={safeMapData} tileW={TILE_W} tileH={TILE_H} offset={offset} zoom={zoom} />
      ))}
    </div>
  );
};

export { CULTIVATABLE_TERRAIN };
export default DraggableTownMap;
