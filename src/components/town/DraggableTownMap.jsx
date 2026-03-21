import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, CloudRain, Snowflake, ZoomIn, ZoomOut, Users } from 'lucide-react';
import { TOWN_ITEMS } from '../../data/town-items';
import VillagerDot from './VillagerDot';
import WeatherOverlay from './WeatherOverlay';
import { audioCtrl } from '../../systems/audio';

// ── アイソメトリック定数 ──
const TILE_W = 64;
const TILE_H = 32;
export const GRID_SIZE = 50;
export const C = 25; // マップ中心

// 開拓可能な地形
const CULTIVATABLE_TERRAIN = new Set(['t_roughland', 't_grassland', 't_forest_floor', 't_sand', 't_highland']);

// ── 座標変換 ──
const toIsoX = (gx, gy) => (gx - gy) * (TILE_W / 2);
const toIsoY = (gx, gy) => (gx + gy) * (TILE_H / 2);
const fromIso = (sx, sy) => ({
  x: Math.floor((sx / (TILE_W / 2) + sy / (TILE_H / 2)) / 2),
  y: Math.floor((sy / (TILE_H / 2) - sx / (TILE_W / 2)) / 2),
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


// ── 地形ダイヤモンドSVG ──
const GroundDiamond = React.memo(({ colors, isEditing, isCultivatable, cultivateCost }) => {
  const top = colors?.top || '#d4a96a';
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
      {/* グリッド線（視認性向上） */}
      <polygon points="32,0 64,16 32,32 0,16" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
      {/* 開拓ホバー */}
      {isEditing && isCultivatable && (
        <polygon points="32,0 64,16 32,32 0,16" fill="rgba(245,158,11,0.3)" className="opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </svg>
  );
});

// ── メインコンポーネント ──
const DraggableTownMap = ({ mapData, isDanger, isEditing, onCellTap, reviewCount, villagers = [], exploredRadius = 3 }) => {
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 }); // 初期値を0に設定
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [initialFitDone, setInitialFitDone] = useState(false); // 初回フィットフラグ
  const [timeOfDay, setTimeOfDay] = useState('day'); // 'day' | 'evening' | 'night'
  const [currentWeather, setCurrentWeather] = useState('clear'); // 'clear' | 'rain' | 'snow' | 'sakura'
  const [hoveredCell, setHoveredCell] = useState(null);
  const [residentDisplayMode, setResidentDisplayMode] = useState(() => {
    try {
      return localStorage.getItem('kanji_town_resident_mode') || 'limited';
    } catch (e) {
      return 'limited';
    }
  }); // 'all' | 'limited' | 'none'
  const onCellTapRef = useRef(onCellTap);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  
  useEffect(() => { onCellTapRef.current = onCellTap; }, [onCellTap]);

  // 時間帯と天候の監視
  useEffect(() => {
    const updateTime = () => {
      const h = new Date().getHours();
      if (h >= 6 && h < 16) setTimeOfDay('day');
      else if (h >= 16 && h < 19) setTimeOfDay('evening');
      else setTimeOfDay('night');
      
      // 日付に依存した天候の決定（基本は晴れ、季節ごとにレア天候）
      const now = new Date();
      const month = now.getMonth() + 1;
      const dateStr = `${now.getFullYear()}-${month}-${now.getDate()}`;
      
      // 簡易的なシード乱数生成（その日は一日中同じ天候になる）
      let seed = 0;
      for (let i = 0; i < dateStr.length; i++) {
        seed += dateStr.charCodeAt(i) * (i + 1);
      }
      const rand = (seed * 9301 + 49297) % 233280 / 233280; // 0.0 ~ 1.0
      
      let weather = 'clear';
      if (month >= 3 && month <= 5) {
        // 春 (3〜5月): 桜(15%)、雨(10%)
        if (rand < 0.15) weather = 'sakura';
        else if (rand < 0.25) weather = 'rain';
      } else if (month === 6 || month === 7) {
        // 梅雨・夏 (6〜7月): 雨(20%)
        if (rand < 0.20) weather = 'rain';
      } else if (month === 12 || month === 1 || month === 2) {
        // 冬 (12〜2月): 雪(20%)
        if (rand < 0.20) weather = 'snow';
      } else {
        // その他: 雨(10%)
        if (rand < 0.10) weather = 'rain';
      }
      setCurrentWeather(weather);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000); // 1分ごとに日付や時間帯のロールオーバーを判定
    return () => clearInterval(timer);
  }, []);

  // コンテナサイズ監視
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // 初回マウント時：マップ範囲に合わせて自動ズーム・センタリング
  useEffect(() => {
    if (containerSize.w === 0 || containerSize.h === 0 || initialFitDone) return;

    // 現在の開拓半径(R)を取得
    const R = exploredRadius || 3;
    
    // 見えているマップの実質的な幅・高さを計算
    const mapLogicalW = (2 * R + 2) * TILE_W;
    const mapLogicalH = (2 * R + 2) * TILE_H + 120; // 建物高さなどを考慮した余白

    // 画面サイズに対するフィット率を計算する
    const padding = isEditing ? 120 : 32; // エディター時はUIが被るので余白を大きめに
    const scaleX = (containerSize.w - padding * 2) / mapLogicalW;
    const scaleY = (containerSize.h - padding * 2) / mapLogicalH;
    
    // はみ出さないように小さい方のスケールに合わせる
    let newZoom = Math.min(scaleX, scaleY);
    if (newZoom < 0.25) newZoom = 0.25; // 最低スケール
    if (newZoom > 1.8) newZoom = 1.8;   // 最大スケール

    setZoom(newZoom);

    // isoX: 0, isoY: toIsoY(C,C) を画面の (w/2, h/2) に合わせるためのオフセット
    const cy = toIsoY(C, C);
    const offsetYExtra = isEditing ? -40 : 0; // 下部ツールバーが見えやすいように上に寄せる

    setOffset({
      x: 0,
      y: containerSize.h / 2 - (cy * newZoom) + offsetYExtra
    });

    setInitialFitDone(true);
  }, [containerSize, exploredRadius, initialFitDone, isEditing]);

  const safeMapData = mapData || {};

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
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) isDragging.current = true;
    if (isDragging.current) {
      setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPos.current = { x: clientX, y: clientY };
      setHoveredCell(null);
    } else {
      // ホバー位置の更新
      const rect = containerRef.current.getBoundingClientRect();
      const mapX = (clientX - rect.left - rect.width / 2 - offset.x) / zoom;
      const mapY = (clientY - rect.top - offset.y) / zoom;
      const grid = fromIso(mapX, mapY);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        setHoveredCell(grid);
      } else {
        setHoveredCell(null);
      }
    }
  };
  const handlePointerUp = useCallback((e) => {
    if (!isDragging.current && onCellTapRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // スクリーン座標 → マップ内ローカル座標 → グリッド座標
      const clientX = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      const clientY = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      // CSS transform: translate(offsetX, offsetY) scale(zoom)、left: 50%
      const mapX = (screenX - rect.width / 2 - offset.x) / zoom;
      const mapY = (screenY - offset.y) / zoom;
      const grid = fromIso(mapX, mapY);
      if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
        onCellTapRef.current(grid.x, grid.y);
      }
    }
    lastPos.current = { x: 0, y: 0 };
  }, [zoom, offset.x, offset.y]);

  // ── ズーム ──
  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, z - 0.15));

  // ── 住民表示モード切り替え ──
  const toggleResidentMode = () => {
    const modes = ['all', 'limited', 'none'];
    const next = modes[(modes.indexOf(residentDisplayMode) + 1) % modes.length];
    setResidentDisplayMode(next);
    try {
      localStorage.setItem('kanji_town_resident_mode', next);
    } catch (e) {}
    if (typeof audioCtrl !== 'undefined') audioCtrl.playSE('click');
  };

  // 表示する住民の選別
  const visibleVillagers = useMemo(() => {
    if (residentDisplayMode === 'none') return [];
    if (residentDisplayMode === 'all') return villagers;
    
    // 'limited' モード: 最大10人
    // 移動中(aiStateがMOVING)の住民を優先的に選ぶ（生存感のため）
    // aiStateは各VillagerDot内部で管理されているため、ここでは単純に
    // 住民リストの先頭から選ぶが、将来的にはActivityレベルなどをvillagersデータに持たせると良い
    return villagers.slice(0, 10);
  }, [villagers, residentDisplayMode]);

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

      // --- バリアント計算 ---
      // (x * 13 + y * 7) のようなシンプルなハッシュで決定論的なシードを得る
      const seedVal = (x * 13 + y * 7) % 100;
      const isFlipped = item?.hasVariants ? (seedVal % 2 === 0) : false;
      
      // 色相の変化(-15deg ~ +15deg程度)。自然物は大きめ、人工物は小さめにブレさせる
      let hueShift = 0;
      let brightnessAdjust = 1;
      
      if (item?.hasVariants) {
         const shiftAmount = (seedVal % 31) - 15; // -15 to +15
         hueShift = item.type === 'nature' ? shiftAmount : shiftAmount * 0.5;
         
         // 「夜」かつ「建物」の場合は、発光（brightness増加・少し黄色っぽく）させるなど
         // ここではシンプルに、夜間の建物全体が完全に暗くならないよう輝度を底上げする
      }

      // 夜間発光・影の計算
      const isNight = timeOfDay === 'night';
      const isEvening = timeOfDay === 'evening';
      let nightFilter = '';
      if (isNight && (item?.type === 'building' || item?.type === 'mega' || item?.type === 'rare')) {
         // 夜の建物は、窓が光っているように疑似的に輝度コントラストを上げる
         nightFilter = 'brightness(1.2) contrast(1.1) drop-shadow(0 0 4px rgba(253, 224, 71, 0.3))';
      } else if (isEvening && item?.type === 'nature') {
        nightFilter = 'saturate(1.2)';
      }
      // --------------------

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

            className={`flex items-center justify-center select-none ${isEditing ? 'cursor-pointer' : ''}`}>
            <megaInfo.item.svg />
          </div>
        );
        continue;
      }

      // 開拓可能な地形
      const terrainColors = isTerrain ? (TERRAIN_COLORS[itemId] || TERRAIN_COLORS.t_roughland) : null;

      if (CULTIVATABLE_TERRAIN.has(itemId)) {
        result.push(
          <div key={key} style={{ ...tileStyle, top: isoY, height: TILE_H + 2 }}

            className={`select-none group ${isEditing ? 'cursor-pointer' : ''}`}>
            <GroundDiamond colors={terrainColors} isEditing={isEditing} isCultivatable={true} cultivateCost={item?.cultivateCost || 5} />
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
            <GroundDiamond colors={TERRAIN_COLORS.t_shallow_water} isEditing={false} />
          </div>
        );
        continue;
      }

      // 通常セル（更地・建物・雑草）
      const groundColors = isTerrain ? terrainColors : TERRAIN_COLORS.t_cleared;

      result.push(
        <div key={key} style={{ ...tileStyle, top: isoY - isoHeight, height: TILE_H + isoHeight + 2 }}

          className={`select-none ${isEditing ? 'cursor-pointer' : ''} ${isDanger && !isEditing ? 'brightness-75' : ''}`}>
          {/* 地面ダイヤモンド（建物の下に描画） */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: TILE_W }}>
            <GroundDiamond colors={groundColors} isEditing={isEditing && !item} />
          </div>
          {/* 建物SVG */}
          <AnimatePresence mode="popLayout">
            {item && !isTerrain ? (
              <motion.div key={itemId} initial={{ scale: 0.3, y: -60, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 600, damping: 12, mass: 0.8 }}
                className="absolute inset-0 flex items-end justify-center"
                style={{ bottom: 2 }}>
                <div style={{ 
                  width: TILE_W, 
                  height: Math.max(TILE_W, TILE_H + isoHeight),
                  transform: isFlipped ? 'scaleX(-1)' : 'none',
                  filter: `hue-rotate(${hueShift}deg) ${nightFilter}`.trim()
                }}>
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
  }, [safeMapData, ghosts, isDanger, isEditing, exploredRadius, viewRange, megaAnchors, timeOfDay]);


  return (
      <div ref={containerRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => { lastPos.current = { x: 0, y: 0 }; setHoveredCell(null); }}
      className={`w-full h-full rounded-[16px] overflow-hidden transition-all duration-1000 ${isDanger && !isEditing ? 'bg-slate-900' : 'bg-sky-200'} border-[3px] border-[var(--text)] shadow-inner relative touch-none`}
      style={{ opacity: initialFitDone ? 1 : 0 }}>
      {/* --- 時間帯レイヤー（オーバーレイ） --- */}
      <div 
        className="absolute inset-0 z-20 pointer-events-none transition-colors duration-[3000ms]"
        style={{
          backgroundColor: timeOfDay === 'evening' ? 'rgba(234, 88, 12, 0.2)' : 
                           timeOfDay === 'night'   ? 'rgba(15, 23, 42, 0.45)' : 
                           'transparent',
          mixBlendMode: timeOfDay === 'evening' ? 'overlay' : 'multiply'
        }}
      />
      {/* --------------------------------- */}

      {/* 天候アイコン */}
      <AnimatePresence mode="wait">
        {!isDanger || isEditing ? (
          <motion.div 
            key={currentWeather} 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 10 }} 
            className="absolute top-4 right-4 z-40 pointer-events-none drop-shadow-md"
          >
            {currentWeather === 'clear' && <Sun size={50} className="text-amber-400 animate-spin-slow" fill="currentColor" />}
            {currentWeather === 'rain' && <CloudRain size={50} className="text-slate-400 animate-pulse" fill="currentColor" />}
            {currentWeather === 'snow' && <Snowflake size={50} className="text-sky-200 animate-[spin_4s_linear_infinite]" fill="currentColor" />}
            {currentWeather === 'sakura' && <span className="text-[40px] leading-none select-none drop-shadow-sm">🌸</span>}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* --- キャンバスパーティクル（天候）--- */}
      {!isDanger && <WeatherOverlay weather={currentWeather} />}
      {/* --------------------------------- */}

      {/* ズームボタン & 住民表示切り替え */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onPointerUp={(e) => e.stopPropagation()}>
        {isEditing && (
          <>
            <button onClick={handleZoomIn} className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomIn size={18} /></button>
            <button onClick={handleZoomOut} className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex items-center justify-center font-black text-lg shadow-md hover:scale-110 transition-transform"><ZoomOut size={18} /></button>
          </>
        )}
        {!isEditing && (
          <button 
            onClick={toggleResidentMode} 
            title={`住民表示: ${residentDisplayMode === 'all' ? '全員' : residentDisplayMode === 'limited' ? '10人' : '非表示'}`}
            className="w-10 h-10 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-xl flex flex-col items-center justify-center shadow-md hover:scale-110 transition-transform relative group"
          >
            <Users size={18} className={residentDisplayMode === 'none' ? 'opacity-30' : 'opacity-100'} />
            <div className="absolute -bottom-1 -right-1 bg-[var(--primary)] text-[var(--panel)] text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center border border-[var(--text)]">
              {residentDisplayMode === 'all' ? '●' : residentDisplayMode === 'limited' ? '10' : '×'}
            </div>
            {/* Tooltip */}
            <div className="absolute right-full mr-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-[var(--text)] text-[var(--panel)] text-[10px] px-2 py-1 rounded-md">
              住民表示: {residentDisplayMode === 'all' ? '全員' : residentDisplayMode === 'limited' ? '10人' : '非表示'}
            </div>
          </button>
        )}
      </div>
      {/* アイソメトリックマップ */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}>
        {cells}
        {/* ホバーハイライト */}
        {hoveredCell && (
          <div style={{
            position: 'absolute',
            left: toIsoX(hoveredCell.x, hoveredCell.y) - TILE_W / 2,
            top: toIsoY(hoveredCell.x, hoveredCell.y),
            width: TILE_W,
            height: TILE_H,
            pointerEvents: 'none',
            zIndex: hoveredCell.x + hoveredCell.y + 1,
          }}>
            <svg viewBox="0 0 64 32" width={TILE_W} height={TILE_H}>
              <polygon points="32,0 64,16 32,32 0,16" fill="rgba(255, 255, 255, 0.2)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="2" />
            </svg>
          </div>
        )}
      </div>
      {/* 住民オーバーレイ */}
      {visibleVillagers.map(v => (
        <VillagerDot key={v.id} villager={v} mapData={safeMapData} tileW={TILE_W} tileH={TILE_H} offset={offset} zoom={zoom} containerWidth={containerSize.w} />
      ))}
    </div>
  );
};

export { CULTIVATABLE_TERRAIN };
export default DraggableTownMap;
