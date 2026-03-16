import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun } from 'lucide-react';
import { TOWN_ITEMS, SvgBedrock, SvgRoughland, SvgWeed, SvgGrassland, SvgForestFloor, SvgSand, SvgShallowWater, SvgHighland } from '../../data/town-items';
import { BIOME_TYPES, BIOME_TERRAIN_COLORS } from '../../data/biomes';
import VillagerDot from './VillagerDot';

// Terrain SVG lookup for fast access
const TERRAIN_SVG_MAP = {
  t_bedrock: SvgBedrock,
  t_roughland: SvgRoughland,
  t_weed: SvgWeed,
  t_grassland: SvgGrassland,
  t_forest_floor: SvgForestFloor,
  t_sand: SvgSand,
  t_shallow_water: SvgShallowWater,
  t_highland: SvgHighland,
};

// Cultivatable terrain types (can be cleared for building)
const CULTIVATABLE_TERRAIN = new Set(['t_roughland', 't_grassland', 't_forest_floor', 't_sand', 't_highland']);

// Get biome-tinted background color for a terrain tile
// Maps tile IDs like 't_grassland' to the key 'grassland' in BIOME_TERRAIN_COLORS
const getBiomeBg = (itemId, biome) => {
  if (!biome || !itemId) return null;
  const colors = BIOME_TERRAIN_COLORS[biome];
  if (!colors) return null;
  // Strip 't_' prefix to match BIOME_TERRAIN_COLORS keys
  const terrainKey = itemId.replace(/^t_/, '');
  return colors[terrainKey] || null;
};

const DraggableTownMap = ({ mapData, biomeMap, isDanger, isEditing, onCellTap, reviewCount, kakejikuImg, villagers = [], exploredRadius = 3 }) => {
  const GRID_SIZE = 50; const CELL_SIZE = 48; const MAP_SIZE = GRID_SIZE * CELL_SIZE;
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 400, h: 300 });
  const C = 25; // center of 50x50 map
  // Start centered on the town center
  const [offset, setOffset] = useState({ x: -(C * CELL_SIZE) + 150, y: -(C * CELL_SIZE) + 100 });
  const isDragging = useRef(false); const lastPos = useRef({ x: 0, y: 0 });
  const onCellTapRef = useRef(onCellTap);
  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  // Track container size for viewport culling
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

  const handlePointerDown = (e) => { isDragging.current = false; lastPos.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY }; };
  const handlePointerMove = (e) => { if (!lastPos.current.x) return; const clientX = e.clientX || e.touches?.[0].clientX; const clientY = e.clientY || e.touches?.[0].clientY; const dx = clientX - lastPos.current.x; const dy = clientY - lastPos.current.y; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging.current = true; if (isDragging.current) { setOffset(prev => ({ x: Math.max(Math.min(prev.x + dx, 200), -MAP_SIZE + 200), y: Math.max(Math.min(prev.y + dy, 200), -MAP_SIZE + 200) })); lastPos.current = { x: clientX, y: clientY }; } };
  const handlePointerUp = useCallback((e, cx, cy) => {
    if (!isDragging.current && onCellTapRef.current) onCellTapRef.current(cx, cy);
    lastPos.current = { x: 0, y: 0 };
  }, []);

  // Calculate visible cell range (viewport culling)
  const viewRange = useMemo(() => {
    const margin = 2; // extra cells for smooth scrolling
    const startX = Math.max(0, Math.floor(-offset.x / CELL_SIZE) - margin);
    const startY = Math.max(0, Math.floor(-offset.y / CELL_SIZE) - margin);
    const endX = Math.min(GRID_SIZE - 1, Math.ceil((-offset.x + containerSize.w) / CELL_SIZE) + margin);
    const endY = Math.min(GRID_SIZE - 1, Math.ceil((-offset.y + containerSize.h) / CELL_SIZE) + margin);
    return { startX, startY, endX, endY };
  }, [offset.x, offset.y, containerSize.w, containerSize.h]);

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

  // Build a set of sub-cells occupied by mega buildings (multi-tile)
  // Format: mapData["x,y"] = "t_mega_xxx" for anchor cell, "x,y" = "__sub:anchorX,anchorY" for sub-cells
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

  // Only render visible cells (viewport culling for 50×50 performance)
  const cells = useMemo(() => {
    const result = [];
    const { startX, startY, endX, endY } = viewRange;

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        const key = `${x},${y}`;
        const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
        const isVisible = dist <= exploredRadius;
        const itemId = safeMapData[key];
        const item = itemId ? TOWN_ITEMS.find(i => i.id === itemId) : null;
        const hasGhost = ghosts.some(g => g.x === x && g.y === y);
        const isTerrain = item && item.type === 'terrain';
        const biome = safeBiomeMap[key];

        // Skip sub-cells of mega buildings (they are rendered by the anchor)
        if (megaAnchors.subCells.has(key)) continue;

        const cellStyle = {
          position: 'absolute',
          left: x * CELL_SIZE,
          top: y * CELL_SIZE,
          width: CELL_SIZE,
          height: CELL_SIZE,
        };

        // 未探索 → フォグ
        if (!isVisible) {
          result.push(<div key={key} style={cellStyle} className="bg-[#0f172a]" />);
          continue;
        }

        // メガ建築のアンカーセル → 複数マスにまたがって描画
        const megaInfo = megaAnchors.anchors[key];
        if (megaInfo) {
          const megaStyle = {
            position: 'absolute',
            left: x * CELL_SIZE,
            top: y * CELL_SIZE,
            width: CELL_SIZE * megaInfo.w,
            height: CELL_SIZE * megaInfo.h,
            zIndex: 5,
          };
          result.push(
            <div key={key} style={megaStyle} onPointerUp={(e) => handlePointerUp(e, x, y)}
              className={`flex items-center justify-center relative select-none border-2 border-amber-400/50 rounded-lg overflow-hidden ${megaInfo.item.bg} ${isEditing ? 'cursor-pointer hover:brightness-110' : ''}`}>
              <motion.div key={itemId} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                <megaInfo.item.svg />
              </motion.div>
            </div>
          );
          continue;
        }

        // 岩盤
        if (itemId === 't_bedrock') {
          result.push(<div key={key} style={cellStyle} className="flex items-center justify-center"><SvgBedrock /></div>);
          continue;
        }

        // 開拓可能な地形（荒れ地・草地・森林・砂地・高台）
        const TerrainSvg = TERRAIN_SVG_MAP[itemId];
        const biomeTint = getBiomeBg(itemId, biome);
        if (CULTIVATABLE_TERRAIN.has(itemId)) {
          const terrainItem = TOWN_ITEMS.find(i => i.id === itemId);
          result.push(
            <div key={key} style={{ ...cellStyle, ...(biomeTint ? { backgroundColor: biomeTint } : {}) }} onPointerUp={(e) => handlePointerUp(e, x, y)}
              className={`flex items-center justify-center relative select-none group ${isEditing ? 'cursor-pointer' : ''}`}>
              {TerrainSvg ? <TerrainSvg /> : <SvgRoughland />}
              {isEditing && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-amber-500/40 transition-opacity rounded-sm"><span className="text-[9px] font-black text-white text-center leading-tight">開拓<br/>(-{terrainItem?.cultivateCost || 5}💰)</span></div>}
            </div>
          );
          continue;
        }

        // 浅瀬（建設不可、表示のみ）
        if (itemId === 't_shallow_water') {
          const waterTint = getBiomeBg(itemId, biome);
          result.push(<div key={key} style={{ ...cellStyle, ...(waterTint ? { backgroundColor: waterTint } : {}) }} className="flex items-center justify-center"><SvgShallowWater /></div>);
          continue;
        }

        // 通常セル（更地・設置物・雑草）— バイオームで背景色を変化
        const clearedTint = getBiomeBg(itemId, biome);
        const bgClass = clearedTint ? '' : (item ? item.bg : 'bg-[#d4a96a]');
        const bgStyle = clearedTint ? { backgroundColor: clearedTint } : {};
        result.push(
          <div key={key} style={{ ...cellStyle, ...bgStyle }} onPointerUp={(e) => handlePointerUp(e, x, y)}
            className={`border-[1px] border-black/5 flex items-center justify-center relative select-none ${bgClass} ${isEditing ? 'hover:brightness-110 cursor-pointer border-black/20' : ''} ${isDanger && !isEditing ? 'brightness-75' : ''}`}>
            <AnimatePresence mode="popLayout">
              {item && item.id === 't_kakejiku' ? (
                <motion.div key="kk" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="relative w-[80%] h-[90%] bg-[#f5e6d3] border-x-[4px] border-y-2 border-amber-900 rounded-sm shadow-sm flex items-center justify-center z-10">
                  {kakejikuImg ? <img src={kakejikuImg} className="w-[80%] h-[80%] object-contain mix-blend-multiply opacity-80 pointer-events-none" alt="kakejiku" /> : <span className="text-[10px] text-amber-900 font-bold opacity-50">書</span>}
                </motion.div>
              ) : item && !isTerrain ? (
                <motion.div key={itemId} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center">
                  <item.svg />
                </motion.div>
              ) : item && item.id === 't_weed' ? (
                <motion.div key="weed" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute inset-0 flex items-center justify-center"><SvgWeed /></motion.div>
              ) : null}
            </AnimatePresence>
            {hasGhost && <motion.div animate={{ y: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute z-20 text-2xl drop-shadow-lg pointer-events-none select-none">👻</motion.div>}
          </div>
        );
      }
    }
    return result;
  }, [safeMapData, safeBiomeMap, ghosts, isDanger, isEditing, kakejikuImg, exploredRadius, viewRange, megaAnchors]);

  // Biome indicator for current view center
  const centerBiome = useMemo(() => {
    const cx = Math.floor((-offset.x + containerSize.w / 2) / CELL_SIZE);
    const cy = Math.floor((-offset.y + containerSize.h / 2) / CELL_SIZE);
    const biomeId = safeBiomeMap[`${cx},${cy}`];
    return biomeId ? BIOME_TYPES[biomeId] : null;
  }, [offset.x, offset.y, containerSize.w, containerSize.h, safeBiomeMap]);

  return (
    <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={() => { lastPos.current = { x: 0, y: 0 }; }}
      onPointerLeave={() => { lastPos.current = { x: 0, y: 0 }; }}
      className={`w-full h-full rounded-[16px] overflow-hidden transition-colors duration-1000 ${isDanger && !isEditing ? 'bg-slate-900' : 'bg-sky-300'} border-[3px] border-[var(--text)] shadow-inner relative touch-none`}>
      <AnimatePresence>
        {isDanger && !isEditing
          ? <motion.div key="rain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none z-30"><CloudRain size={150} className="text-slate-400" /></motion.div>
          : <motion.div key="sun" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute top-4 right-4 animate-spin-slow pointer-events-none z-30"><Sun size={60} className="text-amber-400 drop-shadow-md" fill="currentColor" /></motion.div>
        }
      </AnimatePresence>
      {/* バイオーム表示 */}
      {centerBiome && !isEditing && (
        <div className="absolute top-2 left-2 bg-[var(--panel)]/80 border-[2px] border-[var(--text)] rounded-xl px-3 py-1 text-[10px] font-bold text-[var(--text)] pointer-events-none z-40 flex items-center gap-1">
          <span>{centerBiome.emoji}</span>
          <span>{centerBiome.name}</span>
        </div>
      )}
      {/* グリッド (absolute positioned cells for viewport culling) */}
      <div style={{ width: MAP_SIZE, height: MAP_SIZE, transform: `translate(${offset.x}px, ${offset.y}px)`, position: 'relative' }}
        className="absolute top-0 left-0 transition-transform duration-75 ease-out">
        {cells}
      </div>
      {/* 住民オーバーレイ */}
      {villagers.slice(0, 20).map(v => (
        <VillagerDot key={v.id} villager={v} cellSize={CELL_SIZE} offset={offset} />
      ))}
    </div>
  );
};

export { CULTIVATABLE_TERRAIN };
export default DraggableTownMap;
