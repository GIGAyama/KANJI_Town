import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hammer, Package, Lock, ChevronRight, Sparkles, ArrowUpCircle, Crown, Star, Users, TrendingUp, Coins } from 'lucide-react';
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
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [craftResult, setCraftResult] = useState(null);
  const [filterTier, setFilterTier] = useState(0);

  const levelInfo = StorageAPI.getLevelInfo(stats.totalExp, stats.townMap);
  const playerLevel = levelInfo.level;
  const playerGrade = stats.targetGrade || 1;
  const materials = stats.materials || {};
  const villagers = stats.villagers || [];
  const perfectCount = stats.perfectCount || 0;

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

  // Check if upgrade source exists on map
  const hasUpgradeSource = (recipe) => {
    if (!recipe.requires) return true;
    return Object.values(stats.townMap || {}).includes(recipe.requires);
  };

  // Occupation craft bonuses
  const craftBonuses = useMemo(() => getCraftBonuses(villagers), [villagers]);

  // Active building sets
  const activeSets = useMemo(() => getActiveSets(stats.townMap), [stats.townMap]);

  const [craftError, setCraftError] = useState(null);

  const handleCraft = (recipe) => {
    const matsCopy = { ...(stats.materials || {}) };
    const playerCoins = stats.coins || 0;
    const result = craft(matsCopy, recipe, villagers, playerCoins);
    if (!result.success) {
      audioCtrl.playSE('stamp_bad');
      // Show error feedback
      const coinCost = recipe.coinCost || 0;
      if (coinCost > 0 && playerCoins < coinCost) {
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
      newStats.materials[result.result.type] = (newStats.materials[result.result.type] || 0) + (result.bonusYield ? result.result.amount * 2 : result.result.amount);
    } else {
      const townItemId = getResultTownItemId(result.result.type);
      if (townItemId) {
        newStats.townItems = { ...newStats.townItems, [townItemId]: (newStats.townItems?.[townItemId] || 0) + result.result.amount };
      }

      // Upgrade: remove old building from inventory, add new one
      if (recipe.category === 'upgrade' && recipe.requires) {
        const oldCount = newStats.townItems?.[recipe.requires] || 0;
        if (oldCount > 0) {
          newStats.townItems[recipe.requires] = oldCount - 1;
        }
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
    setCraftResult({ recipe, result: result.result, bonusYield: result.bonusYield, discount: result.discount, coinBonus: result.coinBonus, coinCost: result.coinCost });
    setTimeout(() => setCraftResult(null), 2500);
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
            <button key={cat.key} onClick={() => { setCategory(cat.key); setSelectedRecipe(null); setFilterTier(0); audioCtrl.playSE('click'); }}
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
                {t}年 {TIER_NAMES[t]}
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
          const isGradeUnlocked = playerLevel >= (recipe.minGrade || 1);
          const isUnlocked = isGradeUnlocked && (category !== 'rare' || isRareUnlocked(recipe)) && (category !== 'upgrade' || hasUpgradeSource(recipe));
          const displayIngredients = getDisplayIngredients(recipe);
          const coinCost = recipe.coinCost || 0;
          const craftable = isUnlocked && canCraft(materials, displayIngredients, coinCost, stats.coins || 0);
          const isSelected = selectedRecipe?.id === recipe.id;
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
              <button
                onClick={() => {
                  audioCtrl.playSE('click');
                  setSelectedRecipe(isSelected ? null : recipe);
                }}
                className={`w-full bg-[var(--panel)] border-[3px] rounded-xl p-3 transition-all text-left ${
                  !isUnlocked ? 'border-gray-300 opacity-50 grayscale'
                  : isSelected ? 'border-[var(--primary)] shadow-lg'
                  : craftable ? 'border-[var(--text)] hover:border-[var(--secondary)]'
                  : 'border-[var(--text)] opacity-70'
                }`}
              >
                <div className="flex items-center gap-3">
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
                      {recipe.size && <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full border border-amber-300">{recipe.size.w}×{recipe.size.h}</span>}
                    </div>
                    {/* Unlock status for rare/upgrade */}
                    {category === 'rare' && !isRareUnlocked(recipe) && (
                      <div className="text-[9px] text-purple-500 font-bold mt-0.5 flex items-center gap-1"><Lock size={10} /> {recipe.unlockDesc}</div>
                    )}
                    {category === 'upgrade' && !hasUpgradeSource(recipe) && (
                      <div className="text-[9px] text-amber-500 font-bold mt-0.5 flex items-center gap-1"><Lock size={10} /> {F("元","もと")}の{F("建物","たてもの")}がマップに{F("必要","ひつよう")}</div>
                    )}
                    {recipe.desc && <div className="text-[9px] text-[var(--text)] opacity-50 mt-0.5">{recipe.desc}</div>}
                    {/* 素材プレビュー + コインコスト */}
                    <div className="flex gap-1 mt-1.5 flex-wrap items-center">
                      {coinCost > 0 && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${(stats.coins || 0) >= coinCost ? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                          <Coins size={10} />{coinCost}
                        </span>
                      )}
                      {displayIngredients.map((ing, i) => {
                        const origIng = recipe.ingredients[i];
                        const mat = MATERIALS[ing.material];
                        const have = materials[ing.material] || 0;
                        const enough = have >= ing.amount;
                        const isDiscounted = origIng && ing.amount < origIng.amount;
                        return (
                          <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${enough ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                            {mat?.icon}<span className="opacity-70">{mat?.name}</span>{isDiscounted ? <><s className="opacity-50">{origIng.amount}</s>{ing.amount}</> : ing.amount}
                            <span className="opacity-50">/{have}</span>
                          </span>
                        );
                      })}
                      {craftable && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-full">OK</span>}
                    </div>
                  </div>
                  <ChevronRight size={16} className={`shrink-0 transition-transform ${isSelected ? 'rotate-90' : ''} text-[var(--text)] opacity-40`} />
                </div>
              </button>

              {/* 展開詳細 — 3×3クラフトグリッド */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-[var(--bg)] border-[3px] border-t-0 border-[var(--text)] rounded-b-xl p-4">
                      <div className="flex items-center gap-4 justify-center">
                        <div className="flex flex-col items-center">
                          <div className="text-[9px] font-bold text-[var(--text)] opacity-50 mb-1">クラフトテーブル</div>
                          <CraftGrid ingredients={displayIngredients} materials={materials} />
                        </div>
                        <div className="text-2xl text-[var(--text)] opacity-30 font-black">&rarr;</div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-[9px] font-bold text-[var(--text)] opacity-50">完成品</div>
                          <div className={`w-16 h-16 rounded-xl border-[3px] border-[var(--text)] flex items-center justify-center overflow-hidden shadow-md ${townItem?.bg || 'bg-[var(--panel)]'}`}>
                            {townItem ? <townItem.svg /> : resultMat ? <span className="text-3xl">{resultMat.icon}</span> : null}
                          </div>
                          <span className="text-xs font-black text-[var(--text)]">{recipe.name}</span>
                          {recipe.pros && <span className="text-[9px] text-emerald-600 font-bold">{F("繁栄度","はんえいど")} +{recipe.pros}</span>}
                        </div>
                      </div>

                      {/* コインコスト表示 */}
                      {coinCost > 0 && (
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <span className={`text-[11px] font-black flex items-center gap-1 ${(stats.coins || 0) >= coinCost ? 'text-yellow-600' : 'text-red-500'}`}>
                            <Coins size={14} /> {coinCost}コイン{(stats.coins || 0) < coinCost && ` (不足: あと${coinCost - (stats.coins || 0)})`}
                          </span>
                        </div>
                      )}

                      {/* 不足素材の詳細 */}
                      {!craftable && isUnlocked && (
                        <div className="mt-3 text-center">
                          <div className="text-[10px] text-red-500 font-bold">{F("不足","ふそく")}:</div>
                          <div className="flex gap-1 justify-center mt-1 flex-wrap">
                            {coinCost > 0 && (stats.coins || 0) < coinCost && (
                              <span className="text-[10px] bg-red-50 border border-red-300 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5"><Coins size={10} /> コイン あと{coinCost - (stats.coins || 0)}</span>
                            )}
                            {displayIngredients.filter(ing => (materials[ing.material] || 0) < ing.amount).map((ing, i) => {
                              const mat = MATERIALS[ing.material];
                              const have = materials[ing.material] || 0;
                              return <span key={i} className="text-[10px] bg-red-50 border border-red-300 text-red-600 px-2 py-0.5 rounded-full font-bold">{mat?.icon} {mat?.name} あと{ing.amount - have}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex flex-col items-center gap-2">
                        {isUnlocked ? (
                          <>
                            {craftable ? (
                              <MotionButton
                                variant="primary"
                                onClick={() => handleCraft(recipe)}
                                className="px-6 py-3 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)]"
                              >
                                <Hammer size={16} /> クラフトする
                              </MotionButton>
                            ) : (
                              <button
                                disabled
                                className="px-6 py-3 text-sm font-black rounded-xl bg-gray-300 text-gray-500 border-[3px] border-gray-400 cursor-not-allowed flex items-center gap-2"
                              >
                                <Hammer size={16} /> クラフトできません
                              </button>
                            )}
                          </>
                        ) : (
                          <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                            <Lock size={14} /> {!isGradeUnlocked ? `${recipe.minGrade}年生で解放` : category === 'rare' ? recipe.unlockDesc : '元の建物が必要'}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
              {craftResult.bonusYield && <div className="text-xs font-bold text-amber-500">ボーナス! 2倍生産!</div>}
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

// ── 3×3 クラフトグリッド コンポーネント ──
const CraftGrid = ({ ingredients, materials }) => {
  const grid = Array(9).fill(null);

  const layouts = {
    1: [4],
    2: [3, 5],
    3: [1, 4, 7],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 1, 2, 6, 7, 8],
  };

  const expandedItems = [];
  for (const ing of ingredients) {
    for (let i = 0; i < Math.min(ing.amount, 9); i++) {
      expandedItems.push(ing);
    }
  }

  const totalSlots = Math.min(expandedItems.length, 9);
  const positions = layouts[totalSlots] || layouts[Math.min(totalSlots, 6)] || [0, 1, 2, 3, 4, 5, 6, 7, 8];

  expandedItems.slice(0, 9).forEach((ing, i) => {
    if (i < positions.length) {
      grid[positions[i]] = ing;
    }
  });

  return (
    <div className="grid grid-cols-3 gap-1 bg-[var(--text)] p-1 rounded-lg" style={{ width: '84px', height: '84px' }}>
      {grid.map((slot, i) => {
        const mat = slot ? MATERIALS[slot.material] : null;
        const have = slot ? (materials[slot.material] || 0) : 0;
        const enough = slot ? have >= slot.amount : true;
        return (
          <div
            key={i}
            className={`w-[24px] h-[24px] rounded flex items-center justify-center text-sm ${
              slot ? (enough ? 'bg-[var(--panel)]' : 'bg-red-100') : 'bg-[var(--bg)] opacity-40'
            }`}
            title={mat ? `${mat.name} ×${slot.amount}` : ''}
          >
            {mat && <span className="text-[11px]">{mat.icon}</span>}
          </div>
        );
      })}
    </div>
  );
};

export default CraftView;
