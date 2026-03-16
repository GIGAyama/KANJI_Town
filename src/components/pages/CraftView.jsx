import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Hammer, Package, Lock, ChevronRight, Sparkles } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { MATERIALS } from '../../data/materials';
import { ALL_RECIPES, MATERIAL_RECIPES, BUILDING_RECIPES } from '../../data/recipes';
import { TOWN_ITEMS } from '../../data/town-items';
import { canCraft, craft, getResultTownItemId } from '../../systems/crafting';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';

const TIER_NAMES = ['', '基礎', '商業', '文化', '産業', '公共', '伝説'];
const TIER_COLORS = ['', '#64748b', '#3b82f6', '#a855f7', '#f97316', '#22c55e', '#eab308'];

const CraftView = ({ stats, setStats, setView }) => {
  const [category, setCategory] = useState('material'); // 'material' | 'building'
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [craftResult, setCraftResult] = useState(null);
  const [filterTier, setFilterTier] = useState(0); // 0 = all

  const playerGrade = stats.targetGrade || 1;
  const materials = stats.materials || {};

  const recipes = useMemo(() => {
    const base = category === 'material' ? MATERIAL_RECIPES : BUILDING_RECIPES;
    if (filterTier > 0) return base.filter(r => r.tier === filterTier);
    return base;
  }, [category, filterTier]);

  const handleCraft = (recipe) => {
    const matsCopy = { ...(stats.materials || {}) };
    const result = craft(matsCopy, recipe);
    if (!result.success) {
      audioCtrl.playSE('stamp_bad');
      return;
    }

    audioCtrl.playSE('success');

    const newStats = { ...stats, materials: result.materials };

    if (recipe.category === 'material') {
      // 加工素材はmaterialsに追加
      newStats.materials[result.result.type] = (newStats.materials[result.result.type] || 0) + result.result.amount;
    } else {
      // 建物はtownItemsに追加
      const townItemId = getResultTownItemId(result.result.type);
      if (townItemId) {
        newStats.townItems = { ...newStats.townItems, [townItemId]: (newStats.townItems?.[townItemId] || 0) + result.result.amount };
      }
    }

    setStats(newStats);
    StorageAPI.saveStats(newStats);
    setCraftResult({ recipe, result: result.result });
    setTimeout(() => setCraftResult(null), 2000);
  };

  // 不足素材を計算
  const getMissingIngredients = (recipe) => {
    return recipe.ingredients.map(ing => {
      const have = materials[ing.material] || 0;
      return { ...ing, have, missing: Math.max(0, ing.amount - have) };
    });
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4 overflow-y-auto no-scrollbar pb-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => { audioCtrl.playSE('click'); setView('home'); }} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
            <Hammer size={20} className="text-[var(--accent)]" /> クラフト工房
          </h2>
        </div>
      </div>

      {/* 素材インベントリ */}
      <div className="bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 shadow-[4px_4px_0_var(--text)]">
        <h3 className="text-xs font-black text-[var(--text)] flex items-center gap-1 mb-2">
          <Package size={14} className="text-[var(--secondary)]" /> 手持ちの素材
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(MATERIALS).map(([id, mat]) => {
            const count = materials[id] || 0;
            if (count === 0) return null;
            return (
              <div key={id} className="flex items-center gap-1 bg-[var(--bg)] rounded-full px-2.5 py-1 border-2 border-[var(--text)]">
                <span className="text-sm">{mat.icon}</span>
                <span className="text-[10px] font-black text-[var(--text)]">{mat.name}</span>
                <span className="text-[10px] font-black text-[var(--primary)]">{count}</span>
              </div>
            );
          })}
          {Object.values(materials).every(v => !v) && (
            <div className="text-xs text-[var(--text)] opacity-50 py-1">素材がありません。漢字を学んで素材を集めよう！</div>
          )}
        </div>
      </div>

      {/* カテゴリ切り替え */}
      <div className="flex gap-2 shrink-0">
        <button onClick={() => { setCategory('material'); setSelectedRecipe(null); setFilterTier(0); audioCtrl.playSE('click'); }}
          className={`flex-1 py-2.5 rounded-xl border-[3px] text-sm font-black transition-all ${category === 'material' ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
          加工素材
        </button>
        <button onClick={() => { setCategory('building'); setSelectedRecipe(null); setFilterTier(0); audioCtrl.playSE('click'); }}
          className={`flex-1 py-2.5 rounded-xl border-[3px] text-sm font-black transition-all ${category === 'building' ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>
          建物
        </button>
      </div>

      {/* ティアフィルター（建物のみ） */}
      {category === 'building' && (
        <div className="flex gap-1 overflow-x-auto no-scrollbar shrink-0">
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

      {/* レシピ一覧 */}
      <div className="flex flex-col gap-2">
        {recipes.map(recipe => {
          const isUnlocked = playerGrade >= (recipe.minGrade || 1);
          const craftable = isUnlocked && canCraft(materials, recipe.ingredients);
          const isSelected = selectedRecipe?.id === recipe.id;
          const townItemId = recipe.category === 'building' ? getResultTownItemId(recipe.result.type) : null;
          const townItem = townItemId ? TOWN_ITEMS.find(i => i.id === townItemId) : null;
          const resultMat = recipe.category === 'material' ? MATERIALS[recipe.result.type] : null;

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
                  {/* アイコン */}
                  <div className={`w-12 h-12 shrink-0 rounded-xl border-2 border-[var(--text)] flex items-center justify-center overflow-hidden ${townItem?.bg || 'bg-[var(--bg)]'}`}>
                    {townItem ? <townItem.svg /> : resultMat ? <span className="text-2xl">{resultMat.icon}</span> : <span className="text-xl">?</span>}
                    {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Lock size={16} className="text-white" /></div>}
                  </div>
                  {/* 名前とティア */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-[var(--text)]">{recipe.name}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border text-white" style={{ backgroundColor: TIER_COLORS[recipe.tier] || '#64748b', borderColor: TIER_COLORS[recipe.tier] || '#64748b' }}>
                        Tier{recipe.tier}
                      </span>
                      {recipe.result.amount > 1 && <span className="text-[10px] font-bold text-[var(--text)] opacity-50">×{recipe.result.amount}</span>}
                    </div>
                    {/* 素材プレビュー */}
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {recipe.ingredients.map((ing, i) => {
                        const mat = MATERIALS[ing.material];
                        const have = materials[ing.material] || 0;
                        const enough = have >= ing.amount;
                        return (
                          <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${enough ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-red-50 border-red-300 text-red-600'}`}>
                            {mat?.icon} {ing.amount} {!enough && `(${have})`}
                          </span>
                        );
                      })}
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
                        {/* 3×3 クラフトグリッド */}
                        <div className="flex flex-col items-center">
                          <div className="text-[9px] font-bold text-[var(--text)] opacity-50 mb-1">クラフトテーブル</div>
                          <CraftGrid ingredients={recipe.ingredients} materials={materials} />
                        </div>

                        {/* 矢印 */}
                        <div className="text-2xl text-[var(--text)] opacity-30 font-black">&rarr;</div>

                        {/* 結果 */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-[9px] font-bold text-[var(--text)] opacity-50">完成品</div>
                          <div className={`w-16 h-16 rounded-xl border-[3px] border-[var(--text)] flex items-center justify-center overflow-hidden shadow-md ${townItem?.bg || 'bg-[var(--panel)]'}`}>
                            {townItem ? <townItem.svg /> : resultMat ? <span className="text-3xl">{resultMat.icon}</span> : null}
                          </div>
                          <span className="text-xs font-black text-[var(--text)]">{recipe.name}</span>
                        </div>
                      </div>

                      {/* 不足素材の詳細 */}
                      {!craftable && isUnlocked && (
                        <div className="mt-3 text-center">
                          <div className="text-[10px] text-red-500 font-bold">不足素材:</div>
                          <div className="flex gap-1 justify-center mt-1 flex-wrap">
                            {getMissingIngredients(recipe).filter(i => i.missing > 0).map((ing, i) => {
                              const mat = MATERIALS[ing.material];
                              return <span key={i} className="text-[10px] bg-red-50 border border-red-300 text-red-600 px-2 py-0.5 rounded-full font-bold">{mat?.icon} {mat?.name} あと{ing.missing}</span>;
                            })}
                          </div>
                        </div>
                      )}

                      {/* クラフトボタン */}
                      <div className="mt-3 flex justify-center">
                        {isUnlocked ? (
                          <MotionButton
                            variant={craftable ? 'primary' : 'secondary'}
                            disabled={!craftable}
                            onClick={() => handleCraft(recipe)}
                            className={`px-6 py-3 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_var(--text)] ${!craftable ? 'opacity-40 grayscale' : ''}`}
                          >
                            <Hammer size={16} /> クラフトする
                          </MotionButton>
                        ) : (
                          <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
                            <Lock size={14} /> {recipe.minGrade}年生で解放
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
      </div>

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
              <div className="text-lg font-black text-[var(--text)]">完成！</div>
              <div className="text-sm font-bold text-[var(--primary)]">{craftResult.recipe.name} ×{craftResult.result.amount}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── 3×3 クラフトグリッド コンポーネント ──
const CraftGrid = ({ ingredients, materials }) => {
  // 素材を3×3グリッドに配置（最大9スロット）
  const grid = Array(9).fill(null);

  // 素材をグリッドに並べる（パターン配置）
  const layouts = {
    1: [4],                     // 中央
    2: [3, 5],                  // 左右
    3: [1, 4, 7],               // 縦一列
    4: [0, 2, 6, 8],            // 四隅
    5: [0, 2, 4, 6, 8],         // X字
    6: [0, 1, 2, 6, 7, 8],      // 上下段
  };

  // 素材アイテムを展開（amount分繰り返し）
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
