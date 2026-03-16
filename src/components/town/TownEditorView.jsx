import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Map, Coins, Eraser, Undo2, ArrowLeft, Lock, Heart } from 'lucide-react';
import MotionButton from '../ui/MotionButton';
import { TOWN_ITEMS } from '../../data/town-items';
import DraggableTownMap, { CULTIVATABLE_TERRAIN } from './DraggableTownMap';
import { StorageAPI } from '../../systems/storage';
import { audioCtrl } from '../../systems/audio';
import { calculateSatisfaction, getSatisfactionLabel } from '../../systems/residents';

const TownEditorView = ({ setView, stats, setStats }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [localMap, setLocalMap] = useState({ ...(stats.townMap || {}) });
  const [history, setHistory] = useState([{ ...(stats.townMap || {}) }]); // undo履歴
  const [historyIdx, setHistoryIdx] = useState(0);
  const [placementError, setPlacementError] = useState(null);

  const playerGrade = stats.targetGrade || 1;
  const biomeMap = stats.biomeMap || {};

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

  // 地形タイル以外でインベントリにあるものだけパレット表示
  const availableItems = TOWN_ITEMS.filter(item => {
    if (item.type === 'terrain') return false;
    // 学年未達のアイテムもパレットには表示する（ロック表示付き）
    const count = stats.townItems?.[item.id] || 0;
    const inMap = Object.values(localMap).filter(v => v === item.id).length;
    return count > inMap;
  });

  const filteredItems = availableItems.filter(item => filterType === 'all' || item.type === filterType);

  // 更地・雑草にのみ配置可。荒れ地タップで開拓。
  const handleCellTap = (x, y) => {
    const key = `${x},${y}`;
    const currentTile = localMap[key];

    // 開拓可能地形 → 地形ごとのコストで更地に開拓
    if (CULTIVATABLE_TERRAIN.has(currentTile)) {
      const terrainDef = TOWN_ITEMS.find(i => i.id === currentTile);
      const cost = terrainDef?.cultivateCost || 5;
      if ((stats.coins || 0) < cost) { audioCtrl.playSE('stamp_bad'); showError(`コインが足りません（${cost}🪙必要）`); return; }
      const newMap = { ...localMap, [key]: 't_cleared' };
      setLocalMap(newMap); pushHistory(newMap);
      const newStats = { ...stats, coins: stats.coins - cost };
      setStats(newStats); StorageAPI.saveStats(newStats);
      audioCtrl.playSE('place'); return;
    }

    // けしゴム：地形以外を更地に戻してインベントリ返却
    if (selectedItem === 'eraser') {
      const item = TOWN_ITEMS.find(i => i.id === currentTile);
      if (item && item.type !== 'terrain') {
        const newMap = { ...localMap, [key]: 't_cleared' };
        setLocalMap(newMap); pushHistory(newMap);
        setStats(s => ({ ...s, townItems: { ...s.townItems, [currentTile]: (s.townItems?.[currentTile] || 0) + 1 } }));
        audioCtrl.playSE('click');
      }
      return;
    }

    if (!selectedItem) return;
    if (currentTile !== 't_cleared' && currentTile !== 't_weed') { audioCtrl.playSE('stamp_bad'); return; }

    const itemDef = TOWN_ITEMS.find(i => i.id === selectedItem);

    // 学年チェック
    if (itemDef?.minGrade && playerGrade < itemDef.minGrade) {
      audioCtrl.playSE('stamp_bad');
      showError(`${itemDef.minGrade}年生で解放されます`);
      return;
    }

    // バイオームチェック
    if (itemDef?.biomes) {
      const cellBiome = biomeMap[key];
      if (cellBiome && !itemDef.biomes.includes(cellBiome)) {
        audioCtrl.playSE('stamp_bad');
        showError(`このバイオームには配置できません`);
        return;
      }
    }

    // 在庫チェック
    const ownedCount = stats.townItems?.[selectedItem] || 0;
    const placedCount = Object.values(localMap).filter(v => v === selectedItem).length;
    if (ownedCount <= placedCount) {
      audioCtrl.playSE('stamp_bad');
      setSelectedItem(null);
      return;
    }

    const newMap = { ...localMap, [key]: selectedItem };
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

  return (
    <div className="flex flex-col h-full gap-3 p-3 md:p-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('home')} aria-label="ホームに戻る" className="text-[var(--text)] opacity-60 hover:opacity-100 p-2 rounded-full hover:bg-[var(--bg)] transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"><ArrowLeft size={22} /></button>
          <h2 className="text-xl font-black text-[var(--text)] flex items-center gap-1"><Map size={20} className="text-[var(--accent)]" /> まちをつくる</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 bg-[var(--accent)] px-3 py-1.5 rounded-full text-[var(--text)] border-[3px] border-[var(--text)] font-black text-sm shadow-sm"><Coins size={16} />{stats.coins}</span>
          <button onClick={handleUndo} disabled={historyIdx <= 0} aria-label="元に戻す" className={`p-2 rounded-full border-[2px] border-[var(--text)] min-w-[40px] min-h-[40px] flex items-center justify-center transition-all ${historyIdx <= 0 ? 'opacity-30' : 'hover:bg-[var(--bg)]'}`}><Undo2 size={18} /></button>
          <MotionButton variant="success" onClick={handleSave} className="px-4 py-2 text-sm border-[3px] border-[var(--text)] shadow-[0_3px_0_#065f46] min-h-[40px]">保存</MotionButton>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <DraggableTownMap mapData={localMap} biomeMap={biomeMap} isDanger={false} isEditing={true} onCellTap={handleCellTap} reviewCount={0} kakejikuImg={stats.kakejiku} villagers={stats.villagers || []} exploredRadius={stats.exploredRadius || 3} />
        {/* 操作ヒント */}
        {(() => {
          const sat = calculateSatisfaction(stats);
          const sl = getSatisfactionLabel(sat);
          return (
            <div className="absolute top-2 left-2 bg-[var(--panel)]/90 border-[2px] border-[var(--text)] rounded-xl px-3 py-1.5 text-[10px] font-bold text-[var(--text)] pointer-events-none z-40 leading-relaxed">
              🟫 地形タップ → 開拓（🪙10〜30枚）<br/>
              👥 人口 {stats.population}人　{sl.emoji} 満足度{sat}
            </div>
          );
        })()}
        {/* 配置エラーメッセージ */}
        {placementError && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg z-50 whitespace-nowrap animate-bounce">
            {placementError}
          </div>
        )}
        {selectedItem && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[var(--panel)] border-[3px] border-[var(--text)] rounded-full px-4 py-2 shadow-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap z-40">
            {selectedItem === 'eraser' ? <><Eraser size={16} /> けしゴムモード</> : <>{TOWN_ITEMS.find(i => i.id === selectedItem)?.name} を配置中</>}
            <button onClick={() => setSelectedItem(null)} aria-label="選択解除" className="ml-1 text-[var(--text)] opacity-50 hover:opacity-100 text-lg leading-none w-6 h-6 flex items-center justify-center">✕</button>
          </div>
        )}
      </div>

      <div className="shrink-0 bg-[var(--panel)] border-[4px] border-[var(--text)] rounded-[20px] p-3 shadow-[4px_4px_0_var(--text)]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
          {[
            { key: 'all', label: 'すべて' }, { key: 'nature', label: '自然' }, { key: 'building', label: '建物' }, { key: 'special', label: '特別' }
          ].map(f => (
            <button key={f.key} onClick={() => setFilterType(f.key)} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 transition-all min-h-[36px] ${filterType === f.key ? 'bg-[var(--text)] text-[var(--panel)] border-[var(--text)]' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}>{f.label}</button>
          ))}
          <button onClick={() => setSelectedItem('eraser')} className={`px-3 py-1.5 rounded-full text-xs font-black whitespace-nowrap border-2 flex items-center gap-1 transition-all min-h-[36px] ${selectedItem === 'eraser' ? 'bg-rose-500 text-white border-rose-700' : 'bg-[var(--bg)] text-[var(--text)] border-transparent opacity-60 hover:opacity-100'}`}><Eraser size={12} /> けす</button>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filteredItems.map(item => {
            const count = (stats.townItems?.[item.id] || 0) - Object.values(localMap).filter(v => v === item.id).length;
            const isSelected = selectedItem === item.id;
            const canAfford = stats.coins >= item.price;
            const owned = count > 0;
            const isGradeLocked = item.minGrade && playerGrade < item.minGrade;
            return (
              <div key={item.id} onClick={() => {
                if (isGradeLocked) { audioCtrl.playSE('stamp_bad'); showError(`${item.minGrade}年生で解放`); return; }
                if (owned) { setSelectedItem(item.id); audioCtrl.playSE('click'); }
                else if (canAfford) { handleBuy(item); }
                else { audioCtrl.playSE('stamp_bad'); }
              }} className={`flex flex-col items-center gap-1 shrink-0 cursor-pointer rounded-xl border-[3px] w-16 h-20 overflow-hidden transition-all select-none ${isGradeLocked ? 'border-gray-400 opacity-50 grayscale' : isSelected ? 'border-[var(--primary)] scale-110 shadow-lg' : 'border-[var(--text)] opacity-80 hover:opacity-100 hover:scale-105'} ${item.bg}`}>
                <div className="w-12 h-12 flex items-center justify-center pointer-events-none relative">
                  <item.svg />
                  {isGradeLocked && <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded"><Lock size={14} className="text-white" /></div>}
                </div>
                <div className="text-[8px] font-black text-[var(--text)] px-1 text-center leading-tight">{item.name}</div>
                {isGradeLocked
                  ? <div className="text-[8px] font-black bg-gray-300 px-1.5 rounded-full">{item.minGrade}年生</div>
                  : owned ? <div className="text-[9px] font-black bg-white/70 px-1.5 rounded-full">×{count}</div>
                  : <div className={`text-[9px] font-black px-1.5 rounded-full flex items-center gap-0.5 ${canAfford ? 'bg-yellow-200' : 'bg-gray-200 opacity-50'}`}><Coins size={8} />{item.price}</div>
                }
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TownEditorView;
