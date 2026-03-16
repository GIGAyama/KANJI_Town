import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudRain, Sun } from 'lucide-react';
import { TOWN_ITEMS, SvgBedrock, SvgRoughland, SvgWeed } from '../../data/town-items';
import VillagerDot from './VillagerDot';

const DraggableTownMap = ({ mapData, isDanger, isEditing, onCellTap, reviewCount, kakejikuImg, villagers = [], exploredRadius = 11 }) => {
  const GRID_SIZE = 20; const CELL_SIZE = 48; const MAP_SIZE = GRID_SIZE * CELL_SIZE;
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: -MAP_SIZE / 2 + 150, y: -MAP_SIZE / 2 + 100 });
  const isDragging = useRef(false); const lastPos = useRef({ x: 0, y: 0 });
  const onCellTapRef = useRef(onCellTap);
  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  const safeMapData = mapData || {};
  const C = 10;

  const handlePointerDown = (e) => { isDragging.current = false; lastPos.current = { x: e.clientX || e.touches?.[0].clientX, y: e.clientY || e.touches?.[0].clientY }; };
  const handlePointerMove = (e) => { if (!lastPos.current.x) return; const clientX = e.clientX || e.touches?.[0].clientX; const clientY = e.clientY || e.touches?.[0].clientY; const dx = clientX - lastPos.current.x; const dy = clientY - lastPos.current.y; if (Math.abs(dx) > 5 || Math.abs(dy) > 5) isDragging.current = true; if (isDragging.current) { setOffset(prev => ({ x: Math.max(Math.min(prev.x + dx, 200), -MAP_SIZE + 200), y: Math.max(Math.min(prev.y + dy, 200), -MAP_SIZE + 200) })); lastPos.current = { x: clientX, y: clientY }; } };
  const handlePointerUp = useCallback((e, cx, cy) => {
    if (!isDragging.current && onCellTapRef.current) onCellTapRef.current(cx, cy);
    lastPos.current = { x: 0, y: 0 };
  }, []);

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
  }, [isDanger, isEditing, reviewCount, exploredRadius, Object.keys(safeMapData).join(',')]);

  const cells = useMemo(() => {
    const result = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
        const isVisible = dist <= exploredRadius;
        const itemId = safeMapData[key];
        const item = itemId ? TOWN_ITEMS.find(i => i.id === itemId) : null;
        const hasGhost = ghosts.some(g => g.x === x && g.y === y);
        const isTerrain = item && item.type === 'terrain';

        // 未探索 → 暗黒のフォグ
        if (!isVisible) {
          result.push(<div key={key} className="w-[48px] h-[48px] bg-[#0f172a]" />);
          continue;
        }

        // 岩盤（探索済みだが開拓不可）
        if (itemId === 't_bedrock') {
          result.push(<div key={key} className="w-[48px] h-[48px] flex items-center justify-center"><SvgBedrock /></div>);
          continue;
        }

        // 荒れ地（タップで開拓できると示すヒント）
        if (itemId === 't_roughland') {
          result.push(
            <div key={key} onPointerUp={(e) => handlePointerUp(e, x, y)}
              className={`w-[48px] h-[48px] flex items-center justify-center relative select-none group ${isEditing ? 'cursor-pointer' : ''}`}>
              <SvgRoughland />
              {isEditing && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-amber-500/40 transition-opacity rounded-sm"><span className="text-[9px] font-black text-white text-center leading-tight">開拓<br/>(-1💰)</span></div>}
            </div>
          );
          continue;
        }

        // 通常セル（更地・設置物・雑草）
        const bgClass = item ? item.bg : 'bg-[#d4a96a]';
        result.push(
          <div key={key} onPointerUp={(e) => handlePointerUp(e, x, y)}
            className={`w-[48px] h-[48px] border-[1px] border-black/5 flex items-center justify-center relative select-none ${bgClass} ${isEditing ? 'hover:brightness-110 cursor-pointer border-black/20' : ''} ${isDanger && !isEditing ? 'brightness-75' : ''}`}>
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
  }, [safeMapData, ghosts, isDanger, isEditing, kakejikuImg, exploredRadius]);

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
      {/* グリッド */}
      <div style={{ width: MAP_SIZE, height: MAP_SIZE, transform: `translate(${offset.x}px, ${offset.y}px)`, gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)`, gridTemplateRows: `repeat(${GRID_SIZE}, 48px)` }}
        className="grid absolute top-0 left-0 transition-transform duration-75 ease-out">
        {cells}
      </div>
      {/* 住民オーバーレイ（グリッドの外でoffset適用） */}
      {villagers.slice(0, 20).map(v => (
        <VillagerDot key={v.id} villager={v} cellSize={CELL_SIZE} offset={offset} />
      ))}
    </div>
  );
};

export default DraggableTownMap;
