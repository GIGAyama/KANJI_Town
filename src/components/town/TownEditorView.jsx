import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Coins, Eraser, Undo2, ArrowLeft, Lock, Heart, Package, Hammer, Users, Sparkles, ArrowUpCircle, Crown, Star, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { TOWN_ITEMS } from '../../data/town-items';
import { MATERIALS } from '../../data/materials';
import { MATERIAL_RECIPES, BUILDING_RECIPES, UPGRADE_RECIPES, MEGA_RECIPES, RARE_RECIPES, BUILDING_SETS, getActiveSets } from '../../data/recipes';
import { OCCUPATIONS } from '../../data/residents';
import DraggableTownMap, { CULTIVATABLE_TERRAIN, C } from './DraggableTownMap';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { calculateSatisfaction, getSatisfactionLabel, getSatisfactionMultiplier, getResidentStats, collectDailyResources, calculateMaintenanceCost } from '../../systems/residents';
import { canCraft, craft, getResultTownItemId, applyOccupationDiscount } from '../../systems/crafting';
import { getCraftBonuses } from '../../data/residents';
import { F } from '../ui/FormatKun';
import { getMinLevelForGrade } from '../../utils/level-system';

const TIER_COLORS = ['', '#64748b', '#3b82f6', '#a855f7', '#f97316', '#22c55e', '#eab308'];

// --- パーティクルエフェクト ---
const DUST_EMOJIS = ['💨', '🌫️', '✨'];
const CONFETTI_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];
const SPARKLE_EMOJIS = ['✨', '🌟', '⭐', '💫'];

const ParticleOverlay = ({ particles, type }) => (
  <AnimatePresence>
    {particles.map(p => (
      <motion.div key={p.id}
        initial={{ opacity: 1, x: p.x, y: p.y, scale: type === 'confetti' ? 0.5 : 1 }}
        animate={{ opacity: 0, x: p.x + p.dx, y: p.y + p.dy, scale: type === 'confetti' ? 1.2 : 0.5, rotate: type === 'confetti' ? p.rot : 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: type === 'confetti' ? 1.4 : 0.8, delay: p.delay, ease: 'easeOut' }}
        className="absolute pointer-events-none z-[60]"
        style={{ left: 0, top: 0 }}>
        {type === 'confetti' ? (
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, transform: `rotate(${p.rot}deg)` }} />
        ) : (
          <span className="text-lg select-none">{p.emoji}</span>
        )}
      </motion.div>
    ))}
  </AnimatePresence>
);

const TownEditorView = ({ setView, stats, setStats, onCraft }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [localMap, setLocalMap] = useState({ ...(stats.townMap || {}) });
  const [history, setHistory] = useState([{ ...(stats.townMap || {}) }]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [placementError, setPlacementError] = useState(null);
  // Side panel tabs: items (default), craft, residents
  const [sideTab, setSideTab] = useState('items');
  // Craft state
  const [craftCategory, setCraftCategory] = useState('material');
  const [craftResult, setCraftResult] = useState(null);
  const [filterTier, setFilterTier] = useState(0);
  // Resident state
  const [expandedOcc, setExpandedOcc] = useState(null);
  // パーティクルエフェクト
  const [dustParticles, setDustParticles] = useState([]);
  const [confettiParticles, setConfettiParticles] = useState([]);

  const spawnDust = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2 - 50;
    const ps = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i, x: cx, y: cy,
      dx: (Math.random() - 0.5) * 120, dy: -Math.random() * 80 - 20,
      delay: Math.random() * 0.2, emoji: DUST_EMOJIS[i % DUST_EMOJIS.length],
    }));
    setDustParticles(ps);
    setTimeout(() => setDustParticles([]), 1200);
  };

  const spawnConfetti = () => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const ps = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i, x: cx + (Math.random() - 0.5) * 100, y: cy,
      dx: (Math.random() - 0.5) * 200, dy: -Math.random() * 200 - 50,
      delay: Math.random() * 0.3, rot: Math.random() * 720 - 360,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
    setConfettiParticles(ps);
    setTimeout(() => setConfettiParticles([]), 2000);
  };

  const levelInfo = StorageAPI.getLevelInfo(stats.totalExp, stats.townMap);
  const playerLevel = levelInfo.level;
  const learnedCount = Object.values(stats.kanjiStats || {}).filter(s => s.status !== 'new').length;

  // Unified level system: Craft unlocks at Level 3
  const isCraftUnlocked = playerLevel >= 3;
  const isResidentsUnlocked = (stats.population || 0) >= 1;

  const pushHistory = (newMap) => {
    const trimmed = history.slice(0, historyIdx + 1);
    const next = [...trimmed, { ...newMap }].slice(-20);
    setHistory(next); setHistoryIdx(next.length - 1);
  };

  const handleUndo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setLocalMap({ ...prev }); setHistoryIdx(historyIdx - 1); audioCtrl.playSE('click');
  };

  const showError = (msg) => {
    setPlacementError(msg);
    setTimeout(() => setPlacementError(null), 2000);
  };

  const availableItems = TOWN_ITEMS.filter(item => {
    if (item.type === 'terrain') return false;
    const count = stats.townItems?.[item.id] || 0;
    const inMap = Object.values(localMap).filter(v => v === item.id).length;
    return count > inMap;
  });

  const filteredItems = availableItems.filter(item => filterType === 'all' || item.type === filterType);

  const canPlaceMultiTile = (x, y, w, h) => {
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        const tile = localMap[`${x + dx},${y + dy}`];
        if (tile !== 't_cleared' && tile !== 't_weed') return false;
      }
    }
    return true;
  };

  const findMegaAnchor = (x, y) => {
    for (const [key, itemId] of Object.entries(localMap)) {
      const item = TOWN_ITEMS.find(i => i.id === itemId);
      if (!item || !item.size) continue;
      const [ax, ay] = key.split(',').map(Number);
      if (x >= ax && x < ax + item.size.w && y >= ay && y < ay + item.size.h) {
        return { anchorKey: key, ax, ay, item };
      }
    }
    return null;
  };

  const handleCellTap = (x, y) => {
    const dist = Math.max(Math.abs(x - C), Math.abs(y - C));
    if (dist > (stats.exploredRadius || 3)) return;

    const key = `${x},${y}`;
    const currentTile = localMap[key];

    if (CULTIVATABLE_TERRAIN.has(currentTile)) {
      const terrainDef = TOWN_ITEMS.find(i => i.id === currentTile);
      const cost = terrainDef?.cultivateCost || 5;
      if ((stats.coins || 0) < cost) { audioCtrl.playSE('stamp_bad'); showError(`コインが足りません（${cost}枚必要）`); return; }
      const newMap = { ...localMap, [key]: 't_cleared' };
      setLocalMap(newMap); pushHistory(newMap);
      const newStats = { ...stats, coins: stats.coins - cost, townMap: newMap };
      setStats(newStats); StorageAPI.saveStats(newStats);
      audioCtrl.playSE('place'); spawnDust(); return;
    }

    if (selectedItem === 'eraser') {
      const megaAnchor = findMegaAnchor(x, y);
      if (megaAnchor) {
        const { anchorKey, ax, ay, item } = megaAnchor;
        const newMap = { ...localMap };
        for (let dy = 0; dy < item.size.h; dy++) {
          for (let dx = 0; dx < item.size.w; dx++) {
            newMap[`${ax + dx},${ay + dy}`] = 't_cleared';
          }
        }
        setLocalMap(newMap); pushHistory(newMap);
        audioCtrl.playSE('click');
        return;
      }

      const item = TOWN_ITEMS.find(i => i.id === currentTile);
      if (item && item.type !== 'terrain') {
        const newMap = { ...localMap };
        if (localMap[`${key}:top`]) {
          delete newMap[`${key}:top`];
        } else {
          newMap[key] = 't_cleared';
        }
        setLocalMap(newMap); pushHistory(newMap);
        audioCtrl.playSE('click');
      }
      return;
    }

    if (!selectedItem) {
      if (currentTile && currentTile !== 't_cleared' && currentTile !== 't_weed') {
        const itemDef = TOWN_ITEMS.find(i => i.id === currentTile);
        if (itemDef && itemDef.type !== 'terrain') {
          const topItemId = localMap[`${key}:top`];
          if (topItemId) {
            const newMap = { ...localMap };
            delete newMap[`${key}:top`];
            setLocalMap(newMap); pushHistory(newMap);
            setSelectedItem(topItemId);
            audioCtrl.playSE('click');
            return;
          }
          const megaAnchor = findMegaAnchor(x, y);
          if (megaAnchor) {
            const { anchorKey, ax, ay, item } = megaAnchor;
            const newMap = { ...localMap };
            for (let dy = 0; dy < item.size.h; dy++) {
              for (let dx = 0; dx < item.size.w; dx++) {
                newMap[`${ax + dx},${ay + dy}`] = 't_cleared';
              }
            }
            setLocalMap(newMap); pushHistory(newMap);
            setSelectedItem(item.id);
            audioCtrl.playSE('click');
            return;
          }
          const newMap = { ...localMap, [key]: 't_cleared' };
          setLocalMap(newMap); pushHistory(newMap);
          setSelectedItem(itemDef.id);
          audioCtrl.playSE('click');
        }
      }
      return;
    }

    let targetKey = key;

    if (currentTile !== 't_cleared' && currentTile !== 't_weed') {
      const currentDef = TOWN_ITEMS.find(i => i.id === currentTile);
      const selDef = TOWN_ITEMS.find(i => i.id === selectedItem);
      
      if (currentDef?.isFlat && !selDef?.isFlat && !selDef?.size && !localMap[`${key}:top`]) {
        targetKey = `${key}:top`;
      } else {
        audioCtrl.playSE('stamp_bad');
        return;
      }
    }

    const itemDef = TOWN_ITEMS.find(i => i.id === selectedItem);

    if (itemDef?.minGrade && playerLevel < getMinLevelForGrade(itemDef.minGrade)) {
      audioCtrl.playSE('stamp_bad');
      showError(`レベル${getMinLevelForGrade(itemDef.minGrade)}で解放`);
      return;
    }


    const ownedCount = stats.townItems?.[selectedItem] || 0;
    const placedCount = Object.values(localMap).filter(v => v === selectedItem).length;
    if (ownedCount <= placedCount) {
      audioCtrl.playSE('stamp_bad');
      setSelectedItem(null);
      return;
    }

    if (itemDef?.size) {
      const { w, h } = itemDef.size;
      if (!canPlaceMultiTile(x, y, w, h)) {
        audioCtrl.playSE('stamp_bad');
        showError(`${w}x${h}マスの更地が必要`);
        return;
      }
      const newMap = { ...localMap };
      newMap[key] = selectedItem;
      for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
          if (dx === 0 && dy === 0) continue;
          newMap[`${x + dx},${y + dy}`] = 't_cleared';
        }
      }
      setLocalMap(newMap); pushHistory(newMap); audioCtrl.playSE('place');
      return;
    }

    const newMap = { ...localMap, [targetKey]: selectedItem };
    setLocalMap(newMap); pushHistory(newMap); audioCtrl.playSE('place');
  };

  const handleSave = () => {
    const newStats = { ...stats, townMap: localMap }; setStats(newStats); StorageAPI.saveStatsImmediate(newStats);
    audioCtrl.playSE('success'); setView('home');
  };

  const handleBuy = (item) => {
    if ((stats.coins || 0) < item.price) { audioCtrl.playSE('stamp_bad'); return; }
    const newStats = { ...stats, coins: stats.coins - item.price, townItems: { ...stats.townItems, [item.id]: (stats.townItems?.[item.id] || 0) + 1 } };
    setStats(newStats); StorageAPI.saveStats(newStats); audioCtrl.playSE('coin');
  };

  // ── Craft logic ──
  const materials = stats.materials || {};
  const villagers = stats.villagers || [];
  // levelInfo and playerLevel are now defined at the top
  const perfectCount = stats.perfectCount || 0;

  const craftRecipes = useMemo(() => {
    let base;
    switch (craftCategory) {
      case 'material': base = MATERIAL_RECIPES; break;
      case 'building': base = BUILDING_RECIPES; break;
      case 'upgrade': base = UPGRADE_RECIPES; break;
      case 'mega': base = MEGA_RECIPES; break;
      case 'rare': base = RARE_RECIPES; break;
      default: base = MATERIAL_RECIPES;
    }
    if (filterTier > 0) return base.filter(r => r.tier === filterTier);
    return base;
  }, [craftCategory, filterTier]);

  const isRareUnlocked = (recipe) => {
    if (!recipe.unlockCondition) return true;
    const { type, count } = recipe.unlockCondition;
    if (type === 'player_level') return playerLevel >= count;
    if (type === 'perfect_count') return perfectCount >= count;
    return false;
  };

  const hasUpgradeSource = (recipe) => {
    if (!recipe.requires) return true;
    return Object.values(stats.townMap || {}).includes(recipe.requires);
  };

  const craftBonuses = useMemo(() => getCraftBonuses(villagers), [villagers]);

  const getDisplayIngredients = (recipe) => {
    if (!villagers.length) return recipe.ingredients;
    const { discountedIngredients } = applyOccupationDiscount(recipe.ingredients, recipe, villagers);
    return discountedIngredients;
  };

  const handleCraft = (recipe, quantity = 1) => {
    const matsCopy = { ...(stats.materials || {}) };
    const playerCoins = stats.coins || 0;
    const result = craft(matsCopy, recipe, villagers, playerCoins, quantity);
    if (!result.success) { audioCtrl.playSE('stamp_bad'); return; }

    audioCtrl.playSE('success');
    spawnConfetti();
    const newStats = { ...stats, materials: result.materials };

    // Deduct coin cost for crafting
    if (result.coinCost > 0) {
      newStats.coins = (newStats.coins || 0) - result.coinCost;
    }

    if (recipe.category === 'material') {
      newStats.materials[result.result.type] = (newStats.materials[result.result.type] || 0) + (result.bonusYield ? result.result.amount * 2 : result.result.amount);
    } else {
      const townItemId = getResultTownItemId(result.result.type);
      if (townItemId) {
        newStats.townItems = { ...newStats.townItems, [townItemId]: (newStats.townItems?.[townItemId] || 0) + result.result.amount };
      }
      if (recipe.category === 'upgrade' && recipe.requires) {
        const oldCount = newStats.townItems?.[recipe.requires] || 0;
        if (oldCount > 0) newStats.townItems[recipe.requires] = oldCount - 1;
      }
    }

    if (result.coinBonus > 0) newStats.coins = (newStats.coins || 0) + result.coinBonus;
    newStats.craftCount = (newStats.craftCount || 0) + 1;

    setStats(newStats);
    StorageAPI.saveStats(newStats);
    if (onCraft) onCraft();
    setCraftResult({ recipe, result: result.result, bonusYield: result.bonusYield, discount: result.discount, coinBonus: result.coinBonus });
    setTimeout(() => setCraftResult(null), 2500);
  };

  // ── Resident logic ──
  const satisfaction = useMemo(() => calculateSatisfaction(stats), [stats]);
  const satLabel = getSatisfactionLabel(satisfaction);
  const multiplier = getSatisfactionMultiplier(satisfaction);
  const residentStats = useMemo(() => getResidentStats(stats.villagers), [stats.villagers]);
  const dailyPreview = useMemo(() => collectDailyResources(stats), [stats]);

  // ── Bottom dock state ──
  const [dockOpen, setDockOpen] = useState(null); // 'items' | 'craft' | 'residents' | null

  const toggleDock = (tab) => {
    if (dockOpen === tab) { setDockOpen(null); audioCtrl.playSE('click'); }
    else {
      if (tab === 'craft' && !isCraftUnlocked) { audioCtrl.playSE('stamp_bad'); return; }
      if (tab === 'residents' && !isResidentsUnlocked) { audioCtrl.playSE('stamp_bad'); return; }
      setDockOpen(tab); setSideTab(tab); audioCtrl.playSE('click');
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--bg)]">
      {/* === フルスクリーンマップ === */}
      <div className="absolute inset-0" style={{ bottom: 72 }}>
        <DraggableTownMap mapData={localMap} isDanger={false} isEditing={true} onCellTap={handleCellTap} reviewCount={0} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 3} />
      </div>

      {/* === パーティクルエフェクト === */}
      <ParticleOverlay particles={dustParticles} type="dust" />
      <ParticleOverlay particles={confettiParticles} type="confetti" />

      {/* === ヘッダーバー（オーバーレイ） === */}
      <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between p-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setView('home')} aria-label="ホームに戻る" className="bg-[var(--panel)]/90 backdrop-blur text-[var(--text)] p-2.5 rounded-full border-[2px] border-[var(--text)] shadow-md hover:scale-105 transition-transform min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={20} /></button>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1 bg-[var(--accent)]/90 backdrop-blur px-3 py-1.5 rounded-full text-[var(--text)] border-[2px] border-[var(--text)] font-black text-sm shadow-md"><Coins size={14} />{stats.coins}</span>
          <button onClick={handleUndo} disabled={historyIdx <= 0} aria-label="元に戻す" className={`bg-[var(--panel)]/90 backdrop-blur p-2 rounded-full border-[2px] border-[var(--text)] shadow-md min-w-[40px] min-h-[40px] flex items-center justify-center transition-all ${historyIdx <= 0 ? 'opacity-30' : 'hover:scale-105'}`}><Undo2 size={16} /></button>
          <MotionButton variant="success" onClick={handleSave} className="px-4 py-2 text-sm border-[2px] border-[var(--text)] shadow-[0_2px_0_#065f46] backdrop-blur min-h-[40px]">保存</MotionButton>
        </div>
      </div>

      {/* === 情報オーバーレイ === */}
      <div className="absolute top-16 left-2 bg-[var(--panel)]/90 backdrop-blur border-[2px] border-[var(--text)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--text)] pointer-events-none z-40">
        {F("地形","ちけい")}タップで{F("開拓","かいたく")}　👥{stats.population || 0}{F("人","にん")}　{satLabel.emoji}{satisfaction}
      </div>

      {/* === 配置エラー === */}
      {placementError && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 whitespace-nowrap animate-bounce">
          {placementError}
        </div>
      )}

      {/* === 選択なし状態のヒント === */}
      <AnimatePresence>
        {!selectedItem && !dockOpen && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="absolute z-40 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: 84 }}>
            <div className="bg-[var(--panel)]/90 backdrop-blur border-[2px] border-[var(--text)] rounded-full px-4 py-1.5 shadow-md font-bold text-xs flex items-center gap-1.5 whitespace-nowrap text-[var(--text)] opacity-90">
              💡 アイテムをタップして{F("移動","いどう")}・{F("再配置","さいはいち")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === 選択中アイテム表示 === */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="absolute z-40 left-1/2 -translate-x-1/2"
            style={{ bottom: dockOpen ? 'calc(50% + 44px)' : 84 }}>
            <div className="bg-[var(--panel)]/95 backdrop-blur border-[3px] border-[var(--text)] rounded-full px-4 py-2 shadow-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap">
              {selectedItem === 'eraser' ? <><Eraser size={16} /> けしゴムモード</> : <>{TOWN_ITEMS.find(i => i.id === selectedItem)?.name} を{F("配置中","はいちちゅう")}</>}
              <button onClick={() => setSelectedItem(null)} aria-label="選択解除" className="ml-1 text-[var(--text)] opacity-50 hover:opacity-100 text-lg leading-none w-6 h-6 flex items-center justify-center">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* === スライドアップ モーダルシート === */}
      <AnimatePresence>
        {dockOpen && (
          <>
            {/* 背景オーバーレイ */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 z-40" onClick={() => setDockOpen(null)} />
            {/* シート本体 */}
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute left-0 right-0 z-50 bg-[var(--panel)] border-t-[4px] border-[var(--text)] rounded-t-[24px] shadow-2xl"
              style={{ bottom: 72, maxHeight: '55%' }}>
              {/* ハンドルバー */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 bg-[var(--text)] opacity-20 rounded-full" />
              </div>
              {/* シートタイトル */}
              <div className="flex items-center justify-between px-4 pb-2">
                <h3 className="text-base font-black text-[var(--text)] flex items-center gap-1.5">
                  {dockOpen === 'items' && <><Package size={16} className="text-[var(--accent)]" /> もちもの</>}
                  {dockOpen === 'craft' && <><Hammer size={16} className="text-[var(--accent)]" /> クラフト</>}
                  {dockOpen === 'residents' && <><Users size={16} className="text-[var(--accent)]" /> {F("住民","じゅうみん")}</>}
                </h3>
                <button onClick={() => setDockOpen(null)} className="text-[var(--text)] opacity-50 hover:opacity-100 p-1">✕</button>
              </div>
              {/* シートコンテンツ */}
              <div className="overflow-y-auto no-scrollbar px-3 pb-4" style={{ maxHeight: 'calc(55vh - 80px)' }}>
                {dockOpen === 'items' && <ItemsPanel
                  filteredItems={filteredItems} filterType={filterType} setFilterType={setFilterType}
                  selectedItem={selectedItem} setSelectedItem={setSelectedItem}
                  stats={stats} localMap={localMap} playerLevel={playerLevel}
                  handleBuy={handleBuy} showError={showError}
                  onSelectClose={() => setDockOpen(null)}
                />}
                {dockOpen === 'craft' && <CraftPanel
                  craftCategory={craftCategory} setCraftCategory={setCraftCategory}
                  craftRecipes={craftRecipes}
                  filterTier={filterTier} setFilterTier={setFilterTier}
                  materials={materials} villagers={villagers} playerLevel={playerLevel} stats={stats}
                  isRareUnlocked={isRareUnlocked} hasUpgradeSource={hasUpgradeSource}
                  getDisplayIngredients={getDisplayIngredients} handleCraft={handleCraft} craftBonuses={craftBonuses}
                />}
                {dockOpen === 'residents' && <ResidentsPanel
                  stats={stats} satisfaction={satisfaction} satLabel={satLabel} multiplier={multiplier}
                  residentStats={residentStats} dailyPreview={dailyPreview} villagers={villagers}
                  expandedOcc={expandedOcc} setExpandedOcc={setExpandedOcc} playerLevel={playerLevel}
                />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* === ボトムドック（マイクラ風ホットバー） === */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex items-end justify-center pb-3 px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-[var(--panel)]/95 backdrop-blur border-[4px] border-[var(--text)] rounded-[20px] px-4 py-2 shadow-[4px_4px_0_var(--text)]">
          <button onClick={() => toggleDock('items')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[64px] ${dockOpen === 'items' ? 'bg-[var(--accent)] scale-110 shadow-lg' : 'hover:bg-[var(--bg)] hover:scale-105'}`}>
            <Package size={24} className="text-[var(--text)]" />
            <span className="text-[10px] font-black text-[var(--text)]">もちもの</span>
          </button>
          <button onClick={() => toggleDock('craft')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[64px] ${!isCraftUnlocked ? 'opacity-30' : ''} ${dockOpen === 'craft' ? 'bg-[var(--accent)] scale-110 shadow-lg' : 'hover:bg-[var(--bg)] hover:scale-105'}`}>
            <Hammer size={24} className="text-[var(--text)]" />
            <span className="text-[10px] font-black text-[var(--text)]">つくる</span>
          </button>
          <button onClick={() => toggleDock('residents')}
            className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all min-w-[64px] ${!isResidentsUnlocked ? 'opacity-30' : ''} ${dockOpen === 'residents' ? 'bg-[var(--accent)] scale-110 shadow-lg' : 'hover:bg-[var(--bg)] hover:scale-105'}`}>
            <Users size={24} className="text-[var(--text)]" />
            <span className="text-[10px] font-black text-[var(--text)]">{F("住民","じゅうみん")}</span>
          </button>
        </div>
      </div>

      {/* === クラフト成功アニメーション === */}
      <AnimatePresence>
        {craftResult && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-2">
              <Sparkles size={32} className="text-[var(--accent)]" />
              <div className="text-lg font-black text-[var(--text)]">{F("完成","かんせい")}！</div>
              <div className="text-sm font-bold text-[var(--primary)]">{craftResult.recipe.name} x{craftResult.result.amount}</div>
              {craftResult.bonusYield && <div className="text-xs font-bold text-amber-500">ボーナス! 2倍生産!</div>}
              {craftResult.coinBonus > 0 && <div className="text-xs font-bold text-yellow-600">+{craftResult.coinBonus}コイン</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Items Panel ──
const ItemsPanel = ({ filteredItems, filterType, setFilterType, selectedItem, setSelectedItem, stats, localMap, playerLevel, handleBuy, showError, onSelectClose }) => (
  <div className="flex flex-col gap-3">
    {/* Filter tabs */}
    <div className="flex flex-wrap gap-1.5">
      {[
        { key: 'all', label: 'すべて' }, { key: 'nature', label: <>{F("自然","しぜん")}</> }, { key: 'building', label: <>{F("建物","たてもの")}</> }, { key: 'mega', label: <>{F("大型","おおがた")}</> }, { key: 'rare', label: 'レア' }, { key: 'special', label: <>{F("特別","とくべつ")}</> }
      ].map(f => (
        <button key={f.key} onClick={() => setFilterType(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 transition-all ${filterType === f.key ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{f.label}</button>
      ))}
      <button onClick={() => { setSelectedItem('eraser'); if (onSelectClose) onSelectClose(); }} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 flex items-center gap-1 transition-all ${selectedItem === 'eraser' ? 'bg-rose-500 text-white border-rose-700' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}><Eraser size={12} /> けす</button>
    </div>

    {/* Item grid */}
    <div className="grid grid-cols-4 gap-2">
      {filteredItems.map(item => {
        const count = (stats.townItems?.[item.id] || 0) - Object.values(localMap).filter(v => v === item.id).length;
        const isSelected = selectedItem === item.id;
        const canAfford = stats.coins >= item.price;
        const owned = count > 0;
          const isGradeLocked = item.minGrade && playerLevel < getMinLevelForGrade(item.minGrade);
          return (
            <div key={item.id} onClick={() => {
              if (isGradeLocked) { audioCtrl.playSE('stamp_bad'); showError(`レベル${getMinLevelForGrade(item.minGrade)}で解放`); return; }
              if (owned) { setSelectedItem(item.id); if (onSelectClose) onSelectClose(); audioCtrl.playSE('click'); }
            else if (canAfford) { handleBuy(item); }
            else { audioCtrl.playSE('stamp_bad'); }
          }} className={`flex flex-col items-center gap-0.5 cursor-pointer rounded-xl border-[3px] p-1.5 transition-all select-none ${isGradeLocked ? 'border-gray-400 opacity-50 grayscale' : isSelected ? 'border-[var(--primary)] scale-105 shadow-lg' : 'border-[var(--text)] opacity-80 hover:opacity-100 hover:scale-105'} ${item.bg}`}>
            <div className="w-12 h-12 flex items-center justify-center pointer-events-none relative">
              <item.svg />
              {isGradeLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded"><Lock size={14} className="text-white" /></div>}
            </div>
            <div className="text-[9px] font-black text-[var(--text)] text-center leading-tight truncate w-full">{item.name}</div>
            {item.size && <div className="text-[7px] font-black bg-amber-100 text-amber-700 px-1 rounded-full border border-amber-300">{item.size.w}×{item.size.h}</div>}
            {isGradeLocked
              ? <div className="text-[8px] font-black bg-gray-300 px-1.5 rounded-full">Lv.{getMinLevelForGrade(item.minGrade)}</div>
              : owned ? <div className="text-[9px] font-black bg-white/70 px-1.5 rounded-full">x{count}</div>
              : <div className={`text-[9px] font-black px-1.5 rounded-full flex items-center gap-0.5 ${canAfford ? 'bg-yellow-200' : 'bg-gray-200 opacity-50'}`}><Coins size={8} />{item.price}</div>
            }
          </div>
        );
      })}
    </div>
    {filteredItems.length === 0 && <div className="text-center text-sm text-[var(--text)] opacity-40 py-4">アイテムがありません</div>}
  </div>
);

// ── Craft Panel ──
const CRAFT_CATEGORIES = [
  { key: 'material', label: <>{F("加工","かこう")}{F("素材","そざい")}</>, icon: '🔧' },
  { key: 'building', label: <>{F("建物","たてもの")}</>, icon: '🏠' },
  { key: 'upgrade', label: <>{F("強化","きょうか")}</>, icon: '⬆' },
  { key: 'mega', label: <>{F("大型","おおがた")}</>, icon: '🏰' },
  { key: 'rare', label: 'レア', icon: '✨' },
];

const CraftPanel = ({ craftCategory, setCraftCategory, craftRecipes, filterTier, setFilterTier, materials, villagers, playerLevel, stats, isRareUnlocked, hasUpgradeSource, getDisplayIngredients, handleCraft, craftBonuses }) => {
  const [craftQuantities, setCraftQuantities] = React.useState({});

  const getMaxCraftable = (recipe) => {
    const coinCost = recipe.coinCost || 0;
    const { discountedIngredients } = applyOccupationDiscount(recipe.ingredients, recipe, villagers);
    let max = Infinity;
    if (coinCost > 0) max = Math.min(max, Math.floor((stats.coins || 0) / coinCost));
    for (const ing of discountedIngredients) {
      const have = materials[ing.material] || 0;
      if (ing.amount > 0) max = Math.min(max, Math.floor(have / ing.amount));
    }
    return max === Infinity ? 0 : Math.max(0, max);
  };

  return (
  <div className="flex flex-col gap-3">
    {/* Materials inventory - sticky */}
    <div className="sticky top-0 z-10 bg-[var(--panel)] -mx-3 px-3 pt-0 pb-2 -mt-0">
      <div className="bg-[var(--bg)] rounded-xl p-2.5 border-[2px] border-[var(--text)]">
        <h3 className="text-xs font-black text-[var(--text)] mb-1.5 flex items-center gap-1"><Package size={12} className="text-[var(--secondary)]" /> {F("手持","ても")}ちの{F("素材","そざい")}</h3>
        <div className="flex flex-wrap gap-1">
          {Object.entries(MATERIALS).map(([id, mat]) => {
            const count = materials[id] || 0;
            if (count === 0) return null;
            return (
              <span key={id} className="flex items-center gap-0.5 bg-[var(--panel)] rounded-full px-2 py-0.5 border border-[var(--text)] text-[10px] font-bold">
                {mat.icon} {mat.name} {count}
              </span>
            );
          })}
          {Object.values(materials).every(v => !v) && <span className="text-[10px] text-[var(--text)] opacity-50">{F("素材","そざい")}なし</span>}
        </div>
      </div>
    </div>

    {/* Craft bonuses */}
    {craftBonuses.length > 0 && (
      <div className="bg-blue-50 border-[2px] border-blue-300 rounded-xl px-2.5 py-1.5 text-[10px]">
        <span className="font-black text-blue-700"><Users size={10} className="inline" /> {F("住民","じゅうみん")}ボーナス: </span>
        {craftBonuses.map(b => <span key={b.occupationId} className="text-blue-600 font-bold">{b.desc} </span>)}
      </div>
    )}

    {/* Category tabs */}
    <div className="flex flex-wrap gap-1">
      {CRAFT_CATEGORIES.map(cat => (
        <button key={cat.key} onClick={() => { setCraftCategory(cat.key); setCraftQuantities({}); setFilterTier(0); audioCtrl.playSE('click'); }}
          className={`px-2.5 py-1.5 rounded-lg border-[2px] text-xs font-black whitespace-nowrap transition-all flex items-center gap-0.5 ${craftCategory === cat.key ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>

    {/* Tier filter */}
    {(craftCategory === 'building' || craftCategory === 'mega') && (
      <div className="flex flex-wrap gap-1">
        <button onClick={() => { setFilterTier(0); audioCtrl.playSE('click'); }} className={`px-2.5 py-1 rounded-full text-[10px] font-black border-2 transition-all ${filterTier === 0 ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60'}`}>全て</button>
        {[1, 2, 3, 4, 5, 6].map(t => (
          <button key={t} onClick={() => { setFilterTier(t); audioCtrl.playSE('click'); }} className={`px-2.5 py-1 rounded-full text-[10px] font-black border-2 transition-all ${filterTier === t ? 'text-white border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60'}`} style={filterTier === t ? { backgroundColor: TIER_COLORS[t] } : {}}>Tier {t}</button>
        ))}
      </div>
    )}

    {/* Recipe list */}
    <div className="flex flex-col gap-2">
      {craftRecipes.map(recipe => {
        const isTierUnlocked = playerLevel >= getMinLevelForGrade(recipe.tier || 1);
        const isUnlocked = isTierUnlocked && (craftCategory !== 'rare' || isRareUnlocked(recipe)) && (craftCategory !== 'upgrade' || hasUpgradeSource(recipe));
        const displayIngredients = getDisplayIngredients(recipe);
        const coinCost = recipe.coinCost || 0;
        const maxCraftable = isUnlocked ? getMaxCraftable(recipe) : 0;
        const currentQty = craftQuantities[recipe.id] || 1;
        const craftable = isUnlocked && canCraft(materials, displayIngredients, coinCost, stats.coins || 0, currentQty);
        const townItemId = recipe.category !== 'material' ? getResultTownItemId(recipe.result.type) : null;
        const townItem = townItemId ? TOWN_ITEMS.find(i => i.id === townItemId) : null;
        const resultMat = recipe.category === 'material' ? MATERIALS[recipe.result.type] : null;

        return (
          <div key={recipe.id}
            className={`w-full bg-[var(--panel)] border-[2px] rounded-xl p-2.5 transition-all text-left ${!isUnlocked ? 'border-gray-300 opacity-50 grayscale' : craftable ? 'border-[var(--text)]' : 'border-[var(--text)] opacity-70'}`}
          >
            {/* レシピ情報 */}
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 shrink-0 rounded-lg border-2 border-[var(--text)] flex items-center justify-center overflow-hidden ${townItem?.bg || 'bg-[var(--bg)]'}`}>
                {townItem ? <townItem.svg /> : resultMat ? <span className="text-xl">{resultMat.icon}</span> : <span>?</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-black text-[var(--text)]">{recipe.name}</span>
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded-full border text-white" style={{ backgroundColor: TIER_COLORS[recipe.tier] || '#64748b', borderColor: TIER_COLORS[recipe.tier] || '#64748b' }}>T{recipe.tier}</span>
                </div>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {coinCost > 0 && (
                    <span className={`text-[9px] font-bold px-1 py-0.5 rounded border flex items-center gap-0.5 ${(stats.coins || 0) >= coinCost * currentQty ? 'bg-yellow-50 border-yellow-300 text-yellow-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                      <Coins size={9} />{coinCost * currentQty}
                    </span>
                  )}
                  {displayIngredients.map((ing, i) => {
                    const mat = MATERIALS[ing.material];
                    const have = materials[ing.material] || 0;
                    const totalReq = ing.amount * currentQty;
                    const enough = have >= totalReq;
                    return (
                      <span key={i} className={`text-[9px] font-bold px-1 py-0.5 rounded border ${enough ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                        {mat?.icon}{totalReq}{!enough && <span className="opacity-50">/{have}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* クラフトボタン＆数量セレクター（常時表示） */}
            {isUnlocked && (
              <div className="flex items-center gap-2 mt-2">
                {maxCraftable > 1 && (
                  <div className="flex items-center bg-[var(--bg)] border-2 border-[var(--text)] rounded-lg overflow-hidden h-8 shadow-[1px_1px_0_var(--text)]">
                    <button type="button" onClick={() => { setCraftQuantities(q => ({ ...q, [recipe.id]: Math.max(1, (q[recipe.id] || 1) - 1) })); audioCtrl.playSE('click'); }}
                      className="w-7 h-full flex items-center justify-center hover:bg-black/10 font-black text-sm">-</button>
                    <div className="w-8 text-center font-black text-xs border-x-2 border-[var(--text)] flex items-center justify-center h-full">{currentQty}</div>
                    <button type="button" onClick={() => { setCraftQuantities(q => ({ ...q, [recipe.id]: Math.min(maxCraftable, (q[recipe.id] || 1) + 1) })); audioCtrl.playSE('click'); }}
                      className="w-7 h-full flex items-center justify-center hover:bg-black/10 font-black text-sm">+</button>
                  </div>
                )}
                {maxCraftable > 1 && (
                  <button type="button" onClick={() => { setCraftQuantities(q => ({ ...q, [recipe.id]: maxCraftable })); audioCtrl.playSE('click'); }}
                    className="px-2 h-8 bg-amber-100 border-2 border-[var(--text)] text-amber-700 rounded-lg text-[10px] font-black hover:bg-amber-200 shadow-[1px_1px_0_var(--text)] transition-all active:translate-y-0.5 active:shadow-none">
                    MAX
                  </button>
                )}
                {craftable ? (
                  <MotionButton variant="primary" onClick={() => { handleCraft(recipe, currentQty); setCraftQuantities(q => { const next = { ...q }; delete next[recipe.id]; return next; }); }}
                    className="flex-1 py-2 text-xs border-[2px] border-[var(--text)] shadow-[0_2px_0_var(--text)] flex items-center justify-center gap-1.5">
                    <Hammer size={13} /> {currentQty > 1 ? `${currentQty}個クラフト` : 'クラフトする'}
                  </MotionButton>
                ) : (
                  <div className="flex-1 py-2 bg-gray-100 border-[2px] border-gray-300 rounded-xl text-center text-[10px] font-black text-gray-400 flex items-center justify-center gap-1 opacity-60">
                    <Lock size={11} /> {!isTierUnlocked ? `Lv.${getMinLevelForGrade(recipe.tier || 1)}で解放` : coinCost * currentQty > (stats.coins || 0) ? 'コイン不足' : '素材不足'}
                  </div>
                )}
              </div>
            )}
            {!isUnlocked && (
              <div className="mt-2 text-xs font-bold text-gray-400 flex items-center gap-1"><Lock size={12} /> {!isTierUnlocked ? `レベル${getMinLevelForGrade(recipe.tier || 1)}で解放` : '条件未達成'}</div>
            )}
          </div>
        );
      })}
      {craftRecipes.length === 0 && <div className="text-center text-sm text-[var(--text)] opacity-40 py-4">レシピなし</div>}
    </div>
  </div>
  );
};

// ── Residents Panel ──
const ResidentsPanel = ({ stats, satisfaction, satLabel, multiplier, residentStats, dailyPreview, villagers, expandedOcc, setExpandedOcc, playerLevel }) => (
  <div className="flex flex-col gap-3">
    {/* Summary */}
    <div className="bg-[var(--bg)] rounded-xl p-3 border-[2px] border-[var(--text)]">
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-xl font-black text-[var(--text)]">👥 {residentStats.total}{F("人","にん")}</div>
          <div className="text-xs text-[var(--text)] opacity-60">{F("住民数","じゅうみんすう")}</div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xl">{satLabel.emoji}</span>
            <span className="text-lg font-black" style={{ color: satLabel.color }}>{satisfaction}</span>
          </div>
          <div className="text-xs font-bold" style={{ color: satLabel.color }}>{satLabel.text}</div>
        </div>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden border-2 border-[var(--text)]">
        <motion.div initial={{ width: 0 }} animate={{ width: `${satisfaction}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: satLabel.color }} />
      </div>
      <div className="text-[10px] text-[var(--text)] opacity-50 text-center mt-1">{F("収集","しゅうしゅう")}{F("効率","こうりつ")}: x{multiplier.toFixed(1)}</div>
    </div>

    {/* Daily collection preview */}
    {residentStats.total > 0 && (
      <div className="bg-[var(--bg)] rounded-xl p-2.5 border-[2px] border-[var(--text)]">
        <h3 className="text-xs font-black text-[var(--text)] mb-1.5 flex items-center gap-1"><Package size={12} className="text-[var(--secondary)]" /> {F("毎日","まいにち")}の{F("収集","しゅうしゅう")}</h3>
        <div className="flex flex-wrap gap-1">
          {Object.entries(dailyPreview.materials).map(([matId, amount]) => {
            const mat = MATERIALS[matId];
            if (!mat) return null;
            return <span key={matId} className="text-[10px] bg-[var(--panel)] rounded-full px-2 py-0.5 font-bold border border-[var(--text)]">{mat.icon} {mat.name} +{amount}</span>;
          })}
          {dailyPreview.coins > 0 && <span className="text-[10px] bg-[var(--accent)] rounded-full px-2 py-0.5 font-bold border border-[var(--text)]">+{dailyPreview.coins}</span>}
        </div>
      </div>
    )}

    {/* Occupation list */}
    <div className="flex flex-col gap-1.5">
      {OCCUPATIONS.map(occ => {
        const count = residentStats.occupationCounts[occ.id] || 0;
        const isExpanded = expandedOcc === occ.id;
        const isUnlocked = playerLevel >= getMinLevelForGrade(occ.minGrade);
        const occVillagers = villagers.filter(v => (v.occupation || 'farmer') === occ.id);

        return (
          <div key={occ.id} className={`border-[2px] border-[var(--text)] rounded-xl overflow-hidden transition-all ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}>
            <button onClick={() => { audioCtrl.playSE('click'); setExpandedOcc(isExpanded ? null : occ.id); }} className="w-full flex items-center gap-2 px-2.5 py-2 bg-[var(--bg)] hover:bg-[var(--bg)]/80 transition-colors text-left">
              <span className="text-lg shrink-0">{occ.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-[var(--text)]">{occ.name}</div>
                <div className="text-[9px] text-[var(--text)] opacity-50 truncate">{occ.desc}</div>
              </div>
              <span className="text-sm font-black text-[var(--primary)] shrink-0">{count}{F("人","にん")}</span>
              {count > 0 && (isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
            </button>
            <AnimatePresence>
              {isExpanded && count > 0 && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="px-2.5 py-2 bg-[var(--panel)] border-t-2 border-[var(--text)]">
                    <div className="flex flex-wrap gap-1">
                      {occVillagers.map(v => (
                        <span key={v.id} className="inline-flex items-center gap-0.5 bg-[var(--bg)] rounded-full px-2 py-0.5 text-[10px] font-bold border border-[var(--text)]">
                          <span className="text-[var(--primary)]">{v.kanjiChar}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>

    {/* Tips */}
    <div className="bg-[var(--bg)] rounded-xl p-2.5 border-[2px] border-[var(--text)]">
      <h3 className="text-xs font-black text-[var(--text)] flex items-center gap-1 mb-1.5"><Heart size={12} className="text-rose-500" /> {F("満足度","まんぞくど")}を{F("上","あ")}げるには</h3>
      <div className="flex flex-col gap-1 text-xs text-[var(--text)]">
        <div>🏠 {F("家","いえ")}を{F("建","た")}てて{F("住","す")}む{F("場所","ばしょ")}を{F("増","ふ")}やす</div>
        <div>🏛 いろいろな{F("建物","たてもの")}を{F("建","た")}てる</div>
        <div>🌸 {F("木","き")}や{F("花","はな")}で{F("自然","しぜん")}{F("環境","かんきょう")}を{F("整","ととの")}える</div>
        <div>🔥 {F("毎日","まいにち")}{F("連続","れんぞく")}で{F("学習","がくしゅう")}する</div>
      </div>
    </div>
  </div>
);

export default TownEditorView;
