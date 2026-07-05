import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hammer, Lock, Sparkles, ArrowUpCircle, Crown, Star, Users, TrendingUp, Coins } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { MATERIALS } from '../../data/materials';
import { MATERIAL_RECIPES, BUILDING_RECIPES, UPGRADE_RECIPES, MEGA_RECIPES, RARE_RECIPES, DECORATION_RECIPES, BUILDING_SETS, getActiveSets } from '../../data/recipes';
import { TOWN_ITEMS } from '../../data/town-items';
import { canCraft, craft, getResultTownItemId, applyOccupationDiscount } from '../../systems/crafting';
import { getCraftBonuses } from '../../data/residents';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { F } from '../ui/FormatKun';
import { getMinLevelForGrade } from '../../utils/level-system';

const TIER_NAMES = ['', '基礎', '商業', '文化', '産業', '公共', '伝説'];
const TIER_COLORS = ['', '#64748b', '#3b82f6', '#a855f7', '#f97316', '#22c55e', '#eab308'];

const CATEGORIES = [
  { key: 'material', label: <>{F("加工","かこう")}{F("素材","そざい")}</>, icon: '🔧' },
  { key: 'building', label: <>{F("建物","たてもの")}</>, icon: '🏠' },
  { key: 'decoration', label: <>{F("装飾","そうしょく")}</>, icon: '🎨' },
  { key: 'upgrade', label: <>{F("強化","きょうか")}</>, icon: '⬆️' },
  { key: 'mega', label: <>{F("大型","おおがた")}{F("建築","けんちく")}</>, icon: '🏰' },
  { key: 'rare', label: 'レア', icon: '✨' },
];

const CraftView = ({ stats, setStats, setView, onCraft }) => {
  const [category, setCategory] = useState('material');
  const [craftQuantities, setCraftQuantities] = useState({});
  const [craftResult, setCraftResult] = useState(null);
  const [filterTier, setFilterTier] = useState(0);

  const levelInfo = StorageAPI.getLevelInfo(stats.totalExp, stats.townMap);
  const playerLevel = levelInfo.level;
  const materials = stats.materials || {};
  const villagers = stats.villagers || [];
  const perfectCount = stats.perfectCountTotal || 0;

  // Get recipes for current category
  const recipes = useMemo(() => {
    let base;
    switch (category) {
      case 'material': base = MATERIAL_RECIPES; break;
      case 'building': base = BUILDING_RECIPES; break;
      case 'decoration': base = DECORATION_RECIPES; break;
      case 'upgrade': base = UPGRADE_RECIPES; break;
      case 'mega': base = MEGA_RECIPES; break;
      case 'rare': base = RARE_RECIPES; break;
      default: base = MATERIAL_RECIPES;
    }
    if (filterTier > 0) return base.filter(r => r.tier === filterTier);
    return base;
  }, [category, filterTier]);

  // Check unlock conditions for rare recipes
  const isRareUnlocked = (recipe) => {
    if (!recipe.unlockCondition) return true;
    const { type, count } = recipe.unlockCondition;
    if (type === 'player_level') return playerLevel >= count;
    if (type === 'perfect_count') return perfectCount >= count;
    return false;
  };

  // Count upgrade sources on map
  const getUpgradeSourceCount = (recipe) => {
    if (!recipe.requires) return Infinity;
    return Object.values(stats.townMap || {}).filter(id => id === recipe.requires).length;
  };

  // Check if upgrade source exists on map
  const hasUpgradeSource = (recipe) => {
    if (!recipe.requires) return true;
    return getUpgradeSourceCount(recipe) > 0;
  };

  // Occupation craft bonuses
  const craftBonuses = useMemo(() => getCraftBonuses(villagers), [villagers]);

  // Active building sets
  const activeSets = useMemo(() => getActiveSets(stats.townMap), [stats.townMap]);

  const [craftError, setCraftError] = useState(null);

  const handleCraft = (recipe, quantity = 1) => {
    const matsCopy = { ...(stats.materials || {}) };
    const playerCoins = stats.coins || 0;
    const result = craft(matsCopy, recipe, villagers, playerCoins, quantity);
    if (!result.success) {
      audioCtrl.playSE('stamp_bad');
      // Show error feedback
      const coinCost = recipe.coinCost || 0;
      if (coinCost > 0 && playerCoins < coinCost * quantity) {
        setCraftError('コイン不足');
      } else {
        setCraftError('素材不足');
      }
      setTimeout(() => setCraftError(null), 1500);
      return;
    }

    audioCtrl.playSE('success');

    const newStats = { ...stats, materials: result.materials };
    // Deduct coin cost for crafting
    if (result.coinCost > 0) {
      newStats.coins = (newStats.coins || 0) - result.coinCost;
    }

    if (recipe.category === 'material') {
      newStats.materials[result.result.type] = (newStats.materials[result.result.type] || 0) + result.result.amount;
    } else {
      const townItemId = getResultTownItemId(result.result.type);
      if (townItemId) {
        newStats.townItems = { ...newStats.townItems, [townItemId]: (newStats.townItems?.[townItemId] || 0) + result.result.amount };
      }

      // Upgrade: マップ上の元建物を指定数だけ撤去する
      if (recipe.category === 'upgrade' && recipe.requires) {
        let removedCount = 0;
        const newTownMap = { ...(newStats.townMap || {}) };
        for (const [coord, id] of Object.entries(newTownMap)) {
          if (id === recipe.requires && removedCount < quantity) {
            delete newTownMap[coord];
            removedCount++;
          }
        }
        newStats.townMap = newTownMap;
      }
    }

    // Coin bonus from merchants
    if (result.coinBonus > 0) {
      newStats.coins = (newStats.coins || 0) + result.coinBonus;
    }

    // クラフト回数カウント（実績用）
    newStats.craftCount = (newStats.craftCount || 0) + 1;

    setStats(newStats);
    StorageAPI.saveStats(newStats);
    if (onCraft) onCraft();
    setCraftResult({ recipe, result: result.result, bonusYield: result.bonusYield, bonusYieldCount: result.bonusYieldCount, discount: result.discount, coinBonus: result.coinBonus, coinCost: result.coinCost, quantity: result.quantity });
    setTimeout(() => setCraftResult(null), 2500);
    setCraftQuantities(q => { const next = { ...q }; delete next[recipe.id]; return next; }); // クラフト後は1に戻す
  };

  // 最大作成可能数を計算
  const getMaxCraftable = (recipe) => {
    const coinCost = recipe.coinCost || 0;
    const { discountedIngredients } = applyOccupationDiscount(recipe.ingredients, recipe, villagers);
    let max = Infinity;

    // アップグレードの場合、マップ上にある元建物の数が上限になる
    if (recipe.category === 'upgrade' && recipe.requires) {
      max = Math.min(max, getUpgradeSourceCount(recipe));
    }

    if (coinCost > 0) {
      max = Math.min(max, Math.floor((stats.coins || 0) / coinCost));
    }
    for (const ing of discountedIngredients) {
      const have = materials[ing.material] || 0;
      if (ing.amount > 0) {
        max = Math.min(max, Math.floor(have / ing.amount));
      }
    }
    return max === Infinity ? 0 : Math.max(0, max);
  };

  // Get discounted ingredients for display
  const getDisplayIngredients = (recipe) => {
    if (!villagers.length) return recipe.ingredients;
    const { discountedIngredients } = applyOccupationDiscount(recipe.ingredients, recipe, villagers);
    return discountedIngredients;
  };

  return (
    <div className="flex flex-col">
      {/* ── 固定ヘッダー部分（sticky: PageWrapperのスクロール内で固定） ── */}
      <div className="sticky top-0 flex flex-col gap-2 p-4 pb-2 bg-[var(--bg)] z-10 -mx-4 -mt-4 px-4 pt-4">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => { audioCtrl.playSE('click'); setView('home'); }} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ArrowLeft size={22} />
            </button>
            <h2 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
              <Hammer size={20} className="text-[var(--accent)]" /> クラフト{F("工房","こうぼう")}
            </h2>
          </div>
          <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1.5 rounded-full text-[var(--text)] border-[3px] border-[var(--text)] font-black text-sm shadow-sm"><Coins size={16} />{stats.coins}</span>
        </div>

        {/* 素材インベントリ（常に表示） */}
        <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-[16px] p-2.5 shadow-[3px_3px_0_var(--text)]">
          <div className="flex flex-wrap gap-1">
            {Object.entries(MATERIALS).map(([id, mat]) => {
              const count = materials[id] || 0;
              if (count === 0) return null;
              return (
                <div key={id} className="flex items-center gap-0.5 bg-[var(--bg)] rounded-full px-2 py-0.5 border-2 border-[var(--text)]">
                  <span className="text-xs">{mat.icon}</span>
                  <span className="text-[9px] font-black text-[var(--text)]">{mat.name}</span>
                  <span className="text-[9px] font-black text-[var(--primary)]">{count}</span>
                </div>
              );
            })}
            {Object.values(materials).every(v => !v) && (
              <div className="text-[10px] text-[var(--text)] opacity-50 py-0.5">{F("素材","そざい")}なし — {F("漢字","かんじ")}を{F("学","まな")}んで{F("集","あつ")}めよう</div>
            )}
          </div>
        </div>

        {/* カテゴリ切り替え */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button key={cat.key} onClick={() => { setCategory(cat.key); setCraftQuantities({}); setFilterTier(0); audioCtrl.playSE('click'); }}
              className={`px-3 py-2 rounded-xl border-[3px] text-xs font-black whitespace-nowrap transition-all flex items-center gap-1 ${category === cat.key ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>

        {/* ティアフィルター */}
        {(category === 'building' || category === 'mega') && (
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            <button onClick={() => { setFilterTier(0); audioCtrl.playSE('click'); }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap border-2 transition-all ${filterTier === 0 ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60'}`}>
              すべて
            </button>
            {[1, 2, 3, 4, 5, 6].map(t => (
              <button key={t} onClick={() => { setFilterTier(t); audioCtrl.playSE('click'); }}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap border-2 transition-all ${filterTier === t ? 'text-white border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60'}`}
                style={filterTier === t ? { backgroundColor: TIER_COLORS[t] } : {}}>
                Tier{t} {TIER_NAMES[t]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── レシピ一覧（PageWrapperのスクロールで自然にスクロール） ── */}
      <div className="pb-8">
        <div className="flex flex-col gap-3">
          {/* 職業ボーナス表示 */}
          {craftBonuses.length > 0 && (
            <div className="bg-blue-50 border-[3px] border-blue-300 rounded-[16px] px-3 py-2">
              <div className="text-[10px] font-black text-blue-700 mb-1 flex items-center gap-1"><Users size={12} /> {F("住民","じゅうみん")}ボーナス{F("適用中","てきようちゅう")}</div>
              <div className="flex flex-wrap gap-1">
                {craftBonuses.map(b => (
                  <span key={b.occupationId} className="text-[9px] bg-blue-100 border border-blue-300 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                    {b.desc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* セットボーナス表示 */}
          {activeSets.length > 0 && (
            <div className="bg-amber-50 border-[3px] border-amber-300 rounded-[16px] px-3 py-2">
              <div className="text-[10px] font-black text-amber-700 mb-1 flex items-center gap-1"><TrendingUp size={12} /> セットボーナス{F("達成","たっせい")}</div>
              <div className="flex flex-wrap gap-1">
                {activeSets.map(s => (
                  <span key={s.id} className="text-[9px] bg-amber-100 border border-amber-300 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                    {s.emoji} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* レシピ一覧 */}
          {recipes.map(recipe => {
          const isTierUnlocked = playerLevel >= getMinLevelForGrade(recipe.tier || 1);
          const isUnlocked = isTierUnlocked && (category !== 'rare' || isRareUnlocked(recipe)) && (category !== 'upgrade' || hasUpgradeSource(recipe));
          const displayIngredients = getDisplayIngredients(recipe);
          const coinCost = recipe.coinCost || 0;
          const maxCraftable = isUnlocked ? getMaxCraftable(recipe) : 0;
          const currentQty = craftQuantities[recipe.id] || 1;
          const craftable = isUnlocked && currentQty <= maxCraftable && canCraft(materials, displayIngredients, coinCost, stats.coins || 0, currentQty);
          
          const townItemId = recipe.category !== 'material' ? getResultTownItemId(recipe.result.type) : null;
          const townItem = townItemId ? TOWN_ITEMS.find(i => i.id === townItemId) : null;
          const resultMat = recipe.category === 'material' ? MATERIALS[recipe.result.type] : null;

          // Category-specific badge
          let badgeIcon = null;
          if (category === 'upgrade') badgeIcon = <ArrowUpCircle size={12} className="text-emerald-500" />;
          else if (category === 'mega') badgeIcon = <Crown size={12} className="text-amber-500" />;
          else if (category === 'rare') badgeIcon = <Star size={12} className="text-purple-500" />;

          return (
            <div key={recipe.id}>
              <div
                className={`w-full bg-[var(--panel)] border-[3px] rounded-xl overflow-hidden transition-all text-left ${
                  !isUnlocked ? 'border-gray-300 opacity-50 grayscale'
                  : 'border-[var(--text)] hover:shadow-md'
                }`}
              >
                {/* メイン情報部分 */}
                <div className="p-3 flex items-center gap-3">
                  <div className={`w-12 h-12 shrink-0 rounded-xl border-2 border-[var(--text)] flex items-center justify-center overflow-hidden ${townItem?.bg || 'bg-[var(--bg)]'}`}>
                    {townItem ? <townItem.svg /> : resultMat ? <span className="text-2xl">{resultMat.icon}</span> : <span className="text-xl">?</span>}
                    {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Lock size={16} className="text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[var(--text)]">{recipe.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border text-white" style={{ backgroundColor: TIER_COLORS[recipe.tier] || '#64748b', borderColor: TIER_COLORS[recipe.tier] || '#64748b' }}>
                        Tier{recipe.tier}
                      </span>
                      {badgeIcon}
                      {(recipe.size || townItem?.size) && <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-300">{(recipe.size || townItem.size).w}×{(recipe.size || townItem.size).h}</span>}
                    </div>
                    {/* 解放条件 or 説明 */}
                    {!isUnlocked ? (
                      <div className="text-[9px] font-bold mt-0.5 flex items-center gap-1 text-red-500 opacity-80">
                        <Lock size={10} /> 
                        {!isTierUnlocked ? `レベル${getMinLevelForGrade(recipe.tier || 1)}で解放` : category === 'rare' ? recipe.unlockDesc : '元の建物が必要'}
                      </div>
                    ) : (
                      recipe.desc && <div className="text-[9px] text-[var(--text)] opacity-50 mt-0.5">{recipe.desc}</div>
                    )}
                  </div>
                </div>

                {/* クラフト操作エリア（解放済みの場合のみ表示） */}
                {isUnlocked && (
                  <div className="px-3 pb-3 pt-1 border-t-2 border-dashed border-black/5 flex flex-col gap-2">
                    {/* 素材プレビュー */}
                    <div className="flex gap-1 flex-wrap items-center">
                      <div className="text-[10px] font-black mr-1 opacity-60">コスト:</div>
                      {coinCost > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${(stats.coins || 0) >= coinCost * currentQty ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                          <Coins size={10} />{coinCost * currentQty}
                        </span>
                      )}
                      {displayIngredients.map((ing, i) => {
                        const origIng = recipe.ingredients[i];
                        const mat = MATERIALS[ing.material];
                        const have = materials[ing.material] || 0;
                        const totalReq = ing.amount * currentQty;
                        const enough = have >= totalReq;
                        const isDiscounted = origIng && ing.amount < origIng.amount;
                        return (
                          <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${enough ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                            {mat?.icon}<span className="opacity-70">{mat?.name}</span>{isDiscounted ? <><s className="opacity-50">{origIng.amount * currentQty}</s>{totalReq}</> : totalReq}
                            <span className="opacity-50">/{have}</span>
                          </span>
                        );
                      })}
                      {craftable && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-full">OK</span>}
                    </div>

                    {/* アクションボタン & 数量選択 */}
                    <div className="flex items-center gap-2 mt-1">
                      {maxCraftable > 1 && (
                        <div className="flex items-center bg-[var(--bg)] border-2 border-[var(--text)] rounded-xl overflow-hidden h-9 shadow-[2px_2px_0_var(--text)]">
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCraftQuantities(q => ({ ...q, [recipe.id]: Math.max(1, (q[recipe.id] || 1) - 1) })); audioCtrl.playSE('click'); }}
                            className="w-8 h-full flex items-center justify-center hover:bg-black/10 font-black text-sm"
                          >
                            -
                          </button>
                          <div className="w-10 text-center font-black text-xs border-x-2 border-[var(--text)] flex items-center justify-center h-full">
                            {currentQty}
                          </div>
                          <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setCraftQuantities(q => ({ ...q, [recipe.id]: Math.min(maxCraftable, (q[recipe.id] || 1) + 1) })); audioCtrl.playSE('click'); }}
                            className="w-8 h-full flex items-center justify-center hover:bg-black/10 font-black text-sm"
                          >
                            +
                          </button>
                        </div>
                      )}
                      
                      {maxCraftable > 1 && (
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setCraftQuantities(q => ({ ...q, [recipe.id]: maxCraftable })); audioCtrl.playSE('click'); }}
                          className="px-2.5 h-9 bg-amber-100 border-2 border-[var(--text)] text-amber-700 rounded-xl text-[10px] font-black hover:bg-amber-200 shadow-[2px_2px_0_var(--text)] transition-all active:translate-y-0.5 active:shadow-none"
                        >
                          MAX
                        </button>
                      )}

                      {craftable ? (
                        <MotionButton
                          variant="primary"
                          onClick={(e) => { e.stopPropagation(); handleCraft(recipe, currentQty); }}
                          className="flex-1 py-2 text-xs border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] flex items-center justify-center gap-2"
                        >
                          <Hammer size={14} /> {currentQty > 1 ? `${currentQty}個クラフトする` : 'クラフトする'}
                        </MotionButton>
                      ) : (
                        <div className="flex-1 py-2 bg-gray-100 border-[3px] border-gray-300 rounded-xl text-center text-[10px] font-black text-gray-400 flex items-center justify-center gap-1.5 opacity-60">
                          <Lock size={12} /> {coinCost * currentQty > (stats.coins || 0) ? 'コイン不足' : '素材不足'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })}
          {recipes.length === 0 && (
            <div className="text-center text-sm text-[var(--text)] opacity-50 py-8">
              このカテゴリのレシピはありません
            </div>
          )}

          {/* セットボーナス一覧 */}
          {category === 'building' && (
            <div className="bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-[16px] p-3 mt-2">
              <h3 className="text-xs font-black text-[var(--text)] mb-2 flex items-center gap-1"><TrendingUp size={14} /> セットボーナス</h3>
              <div className="flex flex-col gap-1.5">
                {BUILDING_SETS.map(set => {
                  const isActive = activeSets.some(s => s.id === set.id);
                  const placedItems = new Set(Object.values(stats.townMap || {}));
                  const progress = set.required.filter(id => placedItems.has(id)).length;
                  return (
                    <div key={set.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs ${isActive ? 'bg-amber-50 border-amber-300' : 'bg-[var(--bg)] border-transparent opacity-70'}`}>
                      <span className="text-lg">{set.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-[var(--text)]">{set.name} {isActive && <span className="text-amber-500 ml-1">{F("達成","たっせい")}!</span>}</div>
                        <div className="text-[9px] text-[var(--text)] opacity-50">{set.desc}</div>
                      </div>
                      <span className="text-[10px] font-bold text-[var(--text)] opacity-60 shrink-0">{progress}/{set.required.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* クラフトエラー表示 */}
      <AnimatePresence>
        {craftError && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-red-500 text-white font-black text-sm px-5 py-2.5 rounded-full shadow-lg border-[3px] border-red-700">
              {craftError}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* クラフト成功アニメーション */}
      <AnimatePresence>
        {craftResult && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-2">
              <Sparkles size={32} className="text-[var(--accent)]" />
              <div className="text-lg font-black text-[var(--text)]">{F("完成","かんせい")}！</div>
              <div className="text-sm font-bold text-[var(--primary)]">{craftResult.recipe.name} ×{craftResult.result.amount}</div>
              {craftResult.bonusYield && <div className="text-xs font-bold text-amber-500">ボーナス! {craftResult.bonusYieldCount}個追加!</div>}
              {craftResult.discount > 0 && <div className="text-[10px] font-bold text-blue-500">素材{Math.round(craftResult.discount * 100)}%節約</div>}
              {craftResult.coinCost > 0 && <div className="text-[10px] font-bold text-red-400">-{craftResult.coinCost}コイン</div>}
              {craftResult.coinBonus > 0 && <div className="text-[10px] font-bold text-yellow-600">+{craftResult.coinBonus}コイン</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CraftView;
